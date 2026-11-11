// Client library for Two of Us Sanctuary Backend
export const BACKEND_URL_STORAGE_KEY = 'two_of_us_backend_url';
export const TOKEN_STORAGE_KEY = 'two_of_us_auth_token';
export const USER_STORAGE_KEY = 'two_of_us_auth_user';

export const DEFAULT_PUBLIC_BACKEND_URL = 'https://carrousel-skid-carrousel.ngrok-free.dev';

// Determine backend URL:
// 1. Runtime override from localStorage (if user explicitly set a non-default custom URL)
// 2. Build-time Vite env variable VITE_BACKEND_URL
// 3. Public ngrok tunnel URL fallback for cross-device access
export function getBackendUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem(BACKEND_URL_STORAGE_KEY);
    if (custom && custom.trim()) {
      const clean = custom.trim().replace(/\/+$/, '');
      // If we are on GitHub Pages or a mobile phone, don't use old localhost:3001 left in localStorage
      const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (clean.includes('localhost') || clean.includes('127.0.0.1')) {
        if (isLocalHost) {
          return clean;
        }
        // On external/mobile devices, override obsolete localhost with public ngrok URL
        return DEFAULT_PUBLIC_BACKEND_URL;
      }
      return clean;
    }
  }
  const envUrl = (import.meta.env.VITE_BACKEND_URL as string) || '';
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return DEFAULT_PUBLIC_BACKEND_URL;
}

export function setBackendUrl(url: string) {
  if (typeof window !== 'undefined') {
    const clean = url.trim().replace(/\/+$/, '');
    localStorage.setItem(BACKEND_URL_STORAGE_KEY, clean);
    // Re-initialize WebSocket connection
    reconnectWebSocket();
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthSession(token: string, user: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    reconnectWebSocket();
  }
}

export function clearAuthSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    disconnectWebSocket();
  }
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// HTTP request helper with auth & ngrok headers
export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBackendUrl();
  const token = getAuthToken();

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  // Required to bypass ngrok free tier interstitial screen for API requests
  headers.set('ngrok-skip-browser-warning', '1');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.error) errorMsg = errJson.error;
    } catch {
      // not JSON
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

// -------------------------------------------------------------
// Realtime WebSocket Client
// -------------------------------------------------------------
type SyncListener = (event: { type: string; payload?: any }) => void;
const listeners = new Set<SyncListener>();
let ws: WebSocket | null = null;
let reconnectTimer: any = null;
let isIntentionallyClosed = false;

export function onBackendSync(callback: SyncListener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function dispatchSyncEvent(type: string, payload?: any) {
  listeners.forEach((fn) => {
    try {
      fn({ type, payload });
    } catch (e) {
      console.warn('[API SYNC LISTENER ERROR]', e);
    }
  });
}

export function connectWebSocket() {
  if (typeof window === 'undefined') return;
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  isIntentionallyClosed = false;
  const baseUrl = getBackendUrl();
  const token = getAuthToken();

  // Convert http/https to ws/wss
  let wsUrl = baseUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  wsUrl += `/api/ws${token ? '?token=' + encodeURIComponent(token) : ''}`;

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[WS] Connected to Sanctuary Backend:', wsUrl);
      dispatchSyncEvent('BACKEND_CONNECTED', { url: baseUrl });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type) {
          dispatchSyncEvent(msg.type, msg.payload);
        }
      } catch (err) {
        console.warn('[WS] Parse message error', err);
      }
    };

    ws.onclose = () => {
      dispatchSyncEvent('BACKEND_DISCONNECTED');
      if (!isIntentionallyClosed) {
        // Reconnect after 3 seconds
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectWebSocket, 3000);
      }
    };

    ws.onerror = (err) => {
      console.warn('[WS] Connection warning:', err);
    };
  } catch (err) {
    console.warn('[WS] Failed to connect WebSocket:', err);
  }
}

export function reconnectWebSocket() {
  disconnectWebSocket();
  connectWebSocket();
}

export function disconnectWebSocket() {
  isIntentionallyClosed = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (ws) {
    try {
      ws.close();
    } catch {}
    ws = null;
  }
}

export function sendWebSocketMessage(type: string, payload?: any) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, ...payload }));
  }
}

// -------------------------------------------------------------
// Typed API Endpoints
// -------------------------------------------------------------
export const Api = {
  // Server Health
  async checkHealth(): Promise<{ status: string; sanctuary: string; timezone: string } | null> {
    try {
      return await apiRequest('/api/health');
    } catch {
      return null;
    }
  },

  // Auth
  async login(username: string, password: string) {
    const res = await apiRequest<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setAuthSession(res.token, res.user);
    return res;
  },

  async getMe() {
    return apiRequest('/api/auth/me');
  },

  async updateProfile(profile: { name?: string; avatar?: string; bio?: string }) {
    return apiRequest('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return apiRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Couple Space
  async getCoupleSpace() {
    return apiRequest('/api/couple');
  },

  async updateCoupleSpace(updates: any) {
    return apiRequest('/api/couple', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Daily Check-in & Love Day Counter
  async getDailyCounter() {
    return apiRequest('/api/checkin');
  },

  async recordDailyCheckin() {
    return apiRequest('/api/checkin', {
      method: 'POST',
    });
  },

  // Chat
  async getMessages() {
    return apiRequest('/api/chat/messages');
  },

  async sendMessage(data: {
    text?: string;
    imageUrl?: string;
    replyToId?: string;
    replyToText?: string;
    replyToSender?: string;
  }) {
    return apiRequest('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async editMessage(messageId: string, text: string) {
    return apiRequest(`/api/chat/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ text }),
    });
  },

  async deleteMessage(messageId: string) {
    return apiRequest(`/api/chat/messages/${messageId}`, {
      method: 'DELETE',
    });
  },

  async toggleReaction(messageId: string, emoji: string) {
    return apiRequest(`/api/chat/messages/${messageId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  },

  async markMessagesRead() {
    return apiRequest('/api/chat/read', {
      method: 'POST',
    });
  },

  // Photos
  async getPhotos() {
    const photos = await apiRequest<any[]>('/api/photos');
    const token = getAuthToken();
    // Append token to photo streaming URL so img elements can fetch authenticated images
    return photos.map((p) => {
      if (p.url && !p.url.includes('?') && token) {
        return { ...p, url: `${p.url}?token=${encodeURIComponent(token)}` };
      }
      return p;
    });
  },

  async uploadPhoto(file: File, meta: { caption?: string; album?: string; dateTaken?: string }) {
    const formData = new FormData();
    formData.append('photo', file);
    if (meta.caption) formData.append('caption', meta.caption);
    if (meta.album) formData.append('album', meta.album);
    if (meta.dateTaken) formData.append('dateTaken', meta.dateTaken);

    const uploaded = await apiRequest('/api/photos/upload', {
      method: 'POST',
      body: formData,
    });

    const token = getAuthToken();
    if (uploaded.url && !uploaded.url.includes('?') && token) {
      uploaded.url = `${uploaded.url}?token=${encodeURIComponent(token)}`;
    }
    return uploaded;
  },

  async uploadPhotoUrl(url: string, meta: { caption?: string; album?: string; dateTaken?: string }) {
    const uploaded = await apiRequest('/api/photos/upload', {
      method: 'POST',
      body: JSON.stringify({ url, ...meta }),
    });
    return uploaded;
  },

  async deletePhoto(photoId: string) {
    return apiRequest(`/api/photos/${photoId}`, {
      method: 'DELETE',
    });
  },

  async toggleFavoritePhoto(photoId: string) {
    return apiRequest(`/api/photos/${photoId}/favorite`, {
      method: 'POST',
    });
  },

  // Co-Op Games Real-Time
  async getGameSession(sessionId: string) {
    return apiRequest(`/api/games/session/${encodeURIComponent(sessionId)}`);
  },

  async updateGameSession(sessionId: string, state: any, gameTitle?: string) {
    return apiRequest(`/api/games/session/${encodeURIComponent(sessionId)}`, {
      method: 'POST',
      body: JSON.stringify({ state, gameTitle }),
    });
  },
};
