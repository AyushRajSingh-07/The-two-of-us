import { supabase, isSupabaseConfigured } from './supabase';
import { CoupleSpace, ChatMessage, PhotoItem, GameSessionState, SharedDailyCounterState, DailyCheckinRecord } from '../types';
import { getKolkataDateString } from './utils';
import { Api, onBackendSync, getAuthToken, connectWebSocket } from './api';

// Default initial couple profile with reset Love Day counter and bio
const DEFAULT_COUPLE: CoupleSpace = {
  id: 'couple-space-default',
  partner1Name: 'Ayush',
  partner1Avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  partner1Bio: 'Adoring boyfriend & puzzle enthusiast. Always smiling when with Vrishti ❤️',
  partner2Name: 'Vrishti',
  partner2Avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  partner2Bio: 'Chief tea drinker, garden master, and Ayush’s favorite human ✨',
  anniversaryDate: getKolkataDateString(),
  welcomeMessage: 'Welcome to our private sanctuary. A quiet corner just for us.',
  inviteCode: 'US-FOREVER-2024',
  isPaired: true,
  sharedTimezone: 'Asia/Kolkata',
  loveDayBaseCount: 612,
  loveDayBaseMigrated: true,
  reminderDailyCheckin: true,
  reminderDateNight: true,
  soundEffectsEnabled: true,
  privatePhotosOnly: true,
  allowPhotoDownloads: true,
  createdAt: new Date().toISOString(),
};

// Initial welcome messages for chat
const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    spaceId: 'couple-space-default',
    senderId: 'partner-1',
    senderName: 'Ayush',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    text: 'Hey sweetheart! Welcome to our private website! 💕 Look around, we have games, our private photo album, and this chat.',
    reactions: { '❤️': ['partner-2'], '✨': ['partner-1'] },
    isRead: true,
    isDelivered: true,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'sent',
  },
  {
    id: 'msg-2',
    spaceId: 'couple-space-default',
    senderId: 'partner-2',
    senderName: 'Vrishti',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    text: 'Omg this is amazing!! Did you build this for us? 🥰 Want to play the Together Maze or try the quizzes first?',
    reactions: { '🥰': ['partner-1'] },
    isRead: true,
    isDelivered: true,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    status: 'sent',
  },
  {
    id: 'msg-3',
    spaceId: 'couple-space-default',
    senderId: 'partner-1',
    senderName: 'Ayush',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    text: 'Let\'s try the Garden or Draw and Guess first! I also uploaded our favorite sunset photo in the gallery 🌅',
    reactions: {},
    isRead: true,
    isDelivered: true,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    status: 'sent',
  }
];

// Initial starter photos for gallery
const DEFAULT_PHOTOS: PhotoItem[] = [
  {
    id: 'photo-1',
    spaceId: 'couple-space-default',
    uploaderId: 'partner-1',
    uploaderName: 'Ayush',
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1000&auto=format&fit=crop&q=80',
    caption: 'Our spontaneous sunset walk by the coast. One of my favorite days ever.',
    dateTaken: '2024-06-15',
    album: 'Date Nights',
    isFavorite: true,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'photo-2',
    spaceId: 'couple-space-default',
    uploaderId: 'partner-2',
    uploaderName: 'Vrishti',
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1000&auto=format&fit=crop&q=80',
    caption: 'Coffee date where we stayed talking until the cafe closed.',
    dateTaken: '2024-04-10',
    album: 'Candid Moments',
    isFavorite: true,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'photo-3',
    spaceId: 'couple-space-default',
    uploaderId: 'partner-1',
    uploaderName: 'Ayush',
    url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1000&auto=format&fit=crop&q=80',
    caption: 'First road trip together! Singing our lungs out to nostalgic playlists.',
    dateTaken: '2024-07-22',
    album: 'Adventures',
    isFavorite: false,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  }
];

const LOVE_DAY_DATES_COUNTED_KEY = 'love_day_dates_counted';
const broadcastChannel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('two-of-us-sync')
  : null;

// LocalStorage helpers with robust null/corruption protection
function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`two_of_us_${key}`);
    if (raw === null || raw === undefined || raw === 'undefined' || raw === 'null' || raw === '') {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function saveLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(`two_of_us_${key}`, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

// Global broadcast dispatcher
function notifySync(type: string, payload?: any) {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type, payload });
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('two-of-us-sync', { detail: { type, payload } }));
  }
}

function mapCoupleSpaceFromBackend(data: any): CoupleSpace {
  return {
    id: data.id || 'couple-space-default',
    partner1Name: data.partner1_name || data.partner1Name || 'Ayush',
    partner1Avatar: data.partner1_avatar || data.partner1Avatar || DEFAULT_COUPLE.partner1Avatar,
    partner1Bio: data.partner1_bio || data.partner1Bio || DEFAULT_COUPLE.partner1Bio,
    partner2Name: data.partner2_name || data.partner2Name || 'Vrishti',
    partner2Avatar: data.partner2_avatar || data.partner2Avatar || DEFAULT_COUPLE.partner2Avatar,
    partner2Bio: data.partner2_bio || data.partner2Bio || DEFAULT_COUPLE.partner2Bio,
    anniversaryDate: data.anniversary_date || data.anniversaryDate || DEFAULT_COUPLE.anniversaryDate,
    welcomeMessage: data.welcome_message || data.welcomeMessage || DEFAULT_COUPLE.welcomeMessage,
    inviteCode: data.invite_code || data.inviteCode || DEFAULT_COUPLE.inviteCode,
    isPaired: Boolean(data.is_paired ?? data.isPaired ?? true),
    sharedTimezone: data.shared_timezone || data.sharedTimezone || 'Asia/Kolkata',
    loveDayBaseCount: data.love_day_base_count || data.loveDayBaseCount || 612,
    loveDayBaseMigrated: Boolean(data.love_day_base_migrated ?? data.loveDayBaseMigrated ?? true),
    reminderDailyCheckin: Boolean(data.reminder_daily_checkin ?? data.reminderDailyCheckin ?? true),
    reminderDateNight: Boolean(data.reminder_date_night ?? data.reminderDateNight ?? true),
    soundEffectsEnabled: Boolean(data.sound_effects_enabled ?? data.soundEffectsEnabled ?? true),
    privatePhotosOnly: Boolean(data.private_photos_only ?? data.privatePhotosOnly ?? true),
    allowPhotoDownloads: Boolean(data.allow_photo_downloads ?? data.allowPhotoDownloads ?? true),
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
  };
}

export const DataStore = {
  // Couple Space
  async getCoupleSpace(): Promise<CoupleSpace> {
    // 1. Always attempt to load from SQLite backend first
    try {
      const remote = await Api.getCoupleSpace();
      if (remote && remote.id) {
        const space = mapCoupleSpaceFromBackend(remote);
        saveLocal('couple_space', space);
        return space;
      }
    } catch (err) {
      console.warn('[DataStore] Backend getCoupleSpace failed, using local cache:', err);
    }

    // 2. Supabase fallback if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('couples')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data && !error) {
          return mapCoupleSpaceFromBackend(data);
        }
      } catch (e) {
        console.warn('Supabase fetch couple error, falling back to local', e);
      }
    }

    let local = loadLocal<CoupleSpace>('couple_space', DEFAULT_COUPLE);
    if (!local || typeof local !== 'object') {
      local = { ...DEFAULT_COUPLE };
    }
    saveLocal('couple_space', local);
    return local;
  },

  async saveCoupleSpace(space: CoupleSpace): Promise<CoupleSpace> {
    saveLocal('couple_space', space);

    try {
      await Api.updateCoupleSpace(space);
    } catch (err) {
      console.warn('[DataStore] Backend saveCoupleSpace error:', err);
    }

    notifySync('COUPLE_UPDATED', space);
    return space;
  },

  // Chat Messages: Load canonical conversation history from SQLite
  async getMessages(spaceId: string): Promise<ChatMessage[]> {
    try {
      const remote = await Api.getMessages();
      if (Array.isArray(remote)) {
        const list: ChatMessage[] = remote.map((d: any) => ({
          id: d.id,
          spaceId: d.spaceId || d.space_id || spaceId,
          senderId: d.senderId || d.sender_id,
          senderName: d.senderName || d.sender_name,
          senderAvatar: d.senderAvatar || d.sender_avatar,
          text: d.text || '',
          imageUrl: d.imageUrl || d.image_url,
          replyToId: d.replyToId || d.reply_to_id,
          replyToText: d.replyToText || d.reply_to_text,
          replyToSender: d.replyToSender || d.reply_to_sender,
          reactions: (typeof d.reactions === 'string' ? JSON.parse(d.reactions || '{}') : d.reactions) || {},
          isRead: Boolean(d.isRead ?? d.is_read),
          isDelivered: Boolean(d.isDelivered ?? d.is_delivered ?? true),
          createdAt: d.createdAt || d.created_at || new Date().toISOString(),
          editedAt: d.editedAt || d.edited_at,
          status: 'sent',
        }));
        saveLocal('chat_messages', list);
        return list;
      }
    } catch (err) {
      console.warn('[DataStore] Backend getMessages error, falling back to cache:', err);
    }

    return loadLocal<ChatMessage[]>('chat_messages', DEFAULT_MESSAGES);
  },

  async sendMessage(msg: Omit<ChatMessage, 'id' | 'createdAt' | 'reactions' | 'isRead' | 'isDelivered'>): Promise<ChatMessage> {
    try {
      // 1. Save directly to shared SQLite database with idempotency clientMessageId
      const sent = await Api.sendMessage({
        text: msg.text,
        imageUrl: msg.imageUrl,
        replyToId: msg.replyToId,
        replyToText: msg.replyToText,
        replyToSender: msg.replyToSender,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderAvatar: msg.senderAvatar,
        clientMessageId: msg.clientMessageId,
      });

      const formatted: ChatMessage = {
        id: sent.id,
        clientMessageId: sent.clientMessageId || msg.clientMessageId,
        spaceId: msg.spaceId,
        senderId: sent.senderId || sent.sender_id || msg.senderId,
        senderName: sent.senderName || sent.sender_name || msg.senderName,
        senderAvatar: sent.senderAvatar || sent.sender_avatar || msg.senderAvatar,
        text: sent.text,
        imageUrl: sent.imageUrl || sent.image_url,
        replyToId: sent.replyToId || sent.reply_to_id,
        replyToText: sent.replyToText || sent.reply_to_text,
        replyToSender: sent.replyToSender || sent.reply_to_sender,
        reactions: sent.reactions || {},
        isRead: Boolean(sent.isRead ?? sent.is_read),
        isDelivered: true,
        createdAt: sent.createdAt || sent.created_at || new Date().toISOString(),
        status: 'sent',
      };

      const current = loadLocal<ChatMessage[]>('chat_messages', []);
      const updated = [...current.filter(m => m.id !== formatted.id), formatted];
      saveLocal('chat_messages', updated);
      return formatted;
    } catch (err) {
      console.error('[DataStore] Backend sendMessage failed:', err);
      throw err;
    }
  },

  async editMessage(messageId: string, newText: string): Promise<void> {
    try {
      await Api.editMessage(messageId, newText);
    } catch (err) {
      console.warn('[DataStore] Backend editMessage error:', err);
    }

    const current = loadLocal<ChatMessage[]>('chat_messages', DEFAULT_MESSAGES);
    const updated = current.map(m => m.id === messageId ? { ...m, text: newText, editedAt: new Date().toISOString() } : m);
    saveLocal('chat_messages', updated);
    notifySync('CHAT_UPDATED', updated);
  },

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await Api.deleteMessage(messageId);
    } catch (err) {
      console.warn('[DataStore] Backend deleteMessage error:', err);
    }

    const current = loadLocal<ChatMessage[]>('chat_messages', DEFAULT_MESSAGES);
    const updated = current.filter(m => m.id !== messageId);
    saveLocal('chat_messages', updated);
    notifySync('CHAT_UPDATED', updated);
  },

  async toggleReaction(messageId: string, emoji: string, userId: string): Promise<void> {
    try {
      await Api.toggleReaction(messageId, emoji);
    } catch (err) {
      console.warn('[DataStore] Backend toggleReaction error:', err);
    }

    const current = loadLocal<ChatMessage[]>('chat_messages', DEFAULT_MESSAGES);
    const updated = current.map(m => {
      if (m.id !== messageId) return m;
      const reactions = { ...(m.reactions || {}) };
      const userList = reactions[emoji] ? [...reactions[emoji]] : [];
      if (userList.includes(userId)) {
        reactions[emoji] = userList.filter(id => id !== userId);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...userList, userId];
      }
      return { ...m, reactions };
    });
    saveLocal('chat_messages', updated);
    notifySync('CHAT_UPDATED', updated);
  },

  async markMessagesAsRead(spaceId: string, currentUserId: string): Promise<void> {
    const current = loadLocal<ChatMessage[]>('chat_messages', DEFAULT_MESSAGES);
    const hasUnread = current.some(m => m.senderId !== currentUserId && !m.isRead);

    try {
      if (hasUnread) {
        await Api.markMessagesRead();
      }
    } catch (err) {
      console.warn('[DataStore] Backend markMessagesRead error:', err);
    }

    if (hasUnread) {
      const updated = current.map(m => {
        if (m.senderId !== currentUserId && !m.isRead) {
          return { ...m, isRead: true };
        }
        return m;
      });
      saveLocal('chat_messages', updated);
    }
  },

  // Photos
  async getPhotos(spaceId: string): Promise<PhotoItem[]> {
    try {
      const remote = await Api.getPhotos();
      if (Array.isArray(remote)) {
        const mapped: PhotoItem[] = remote.map((d: any) => ({
          id: d.id,
          spaceId: d.spaceId || d.space_id || spaceId,
          uploaderId: d.uploaderId || d.uploader_id,
          uploaderName: d.uploaderName || d.uploader_name,
          url: d.url,
          caption: d.caption || '',
          dateTaken: d.dateTaken || d.date_taken,
          album: d.album || 'General',
          isFavorite: Boolean(d.isFavorite ?? d.is_favorite),
          createdAt: d.createdAt || d.created_at || new Date().toISOString(),
        }));
        saveLocal('photos', mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('[DataStore] Backend getPhotos error:', err);
    }

    return loadLocal<PhotoItem[]>('photos', DEFAULT_PHOTOS);
  },

  async uploadPhoto(item: Omit<PhotoItem, 'id' | 'createdAt'> & { file?: File }): Promise<PhotoItem> {
    try {
      let uploaded: any;
      if (item.file) {
        uploaded = await Api.uploadPhoto(item.file, {
          caption: item.caption,
          album: item.album,
          dateTaken: item.dateTaken,
        });
      } else if (item.url) {
        uploaded = await Api.uploadPhotoUrl(item.url, {
          caption: item.caption,
          album: item.album,
          dateTaken: item.dateTaken,
        });
      }

      if (uploaded && uploaded.id) {
        const newPhoto: PhotoItem = {
          id: uploaded.id,
          spaceId: item.spaceId,
          uploaderId: uploaded.uploaderId || uploaded.uploader_id || item.uploaderId,
          uploaderName: uploaded.uploaderName || uploaded.uploader_name || item.uploaderName,
          url: uploaded.url,
          caption: uploaded.caption || item.caption,
          album: uploaded.album || item.album,
          dateTaken: uploaded.dateTaken || uploaded.date_taken || item.dateTaken,
          isFavorite: Boolean(uploaded.isFavorite ?? uploaded.is_favorite),
          createdAt: uploaded.createdAt || uploaded.created_at || new Date().toISOString(),
        };

        const current = loadLocal<PhotoItem[]>('photos', DEFAULT_PHOTOS);
        const updated = [newPhoto, ...current];
        saveLocal('photos', updated);
        notifySync('PHOTOS_UPDATED', updated);
        return newPhoto;
      }
    } catch (err) {
      console.warn('[DataStore] Backend photo upload error:', err);
    }

    const newPhoto: PhotoItem = {
      ...item,
      id: 'photo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
    };

    const current = loadLocal<PhotoItem[]>('photos', DEFAULT_PHOTOS);
    const updated = [newPhoto, ...current];
    saveLocal('photos', updated);
    notifySync('PHOTOS_UPDATED', updated);
    return newPhoto;
  },

  async toggleFavoritePhoto(photoId: string): Promise<void> {
    try {
      await Api.toggleFavoritePhoto(photoId);
    } catch (err) {
      console.warn('[DataStore] Backend toggleFavoritePhoto error:', err);
    }

    const current = loadLocal<PhotoItem[]>('photos', DEFAULT_PHOTOS);
    const updated = current.map(p => p.id === photoId ? { ...p, isFavorite: !p.isFavorite } : p);
    saveLocal('photos', updated);
    notifySync('PHOTOS_UPDATED', updated);
  },

  async deletePhoto(photoId: string): Promise<void> {
    try {
      await Api.deletePhoto(photoId);
    } catch (err) {
      console.warn('[DataStore] Backend deletePhoto error:', err);
    }

    const current = loadLocal<PhotoItem[]>('photos', DEFAULT_PHOTOS);
    const updated = current.filter(p => p.id !== photoId);
    saveLocal('photos', updated);
    notifySync('PHOTOS_UPDATED', updated);
  },

  // Game Sessions (Multiplayer Co-op cross-device synchronization)
  async getGameSession<T = any>(sessionId: string): Promise<GameSessionState<T> | null> {
    try {
      const row = await Api.getGameSession(sessionId);
      if (row && row.sessionId) {
        return {
          sessionId: row.sessionId,
          gameId: row.gameId,
          currentTurnUserId: row.currentTurnUserId,
          status: row.status,
          data: row.data,
          lastUpdatedBy: row.lastUpdatedBy,
          updatedAt: row.updatedAt,
        };
      }
    } catch (err) {
      console.warn('[DataStore] Backend getGameSession error:', err);
    }

    return loadLocal<GameSessionState<T> | null>(`game_session_${sessionId}`, null);
  },

  async updateGameSession<T = any>(session: GameSessionState<T>): Promise<void> {
    saveLocal(`game_session_${session.sessionId}`, session);

    try {
      await Api.updateGameSession(session.sessionId, session.data, session.gameId);
    } catch (err) {
      console.warn('[DataStore] Backend updateGameSession error:', err);
    }

    notifySync('GAME_UPDATED', session);
  },

  // Shared Daily Login Check-in Counter: CANONICAL SQLITE SOURCE OF TRUTH (Asia/Kolkata timezone with 612 baseline)
  async getDailyCounterState(spaceId: string): Promise<SharedDailyCounterState> {
    // 1. ALWAYS query SQLite backend first so phone and PC are 100% matched
    try {
      const counter = await Api.getDailyCounter();
      if (counter && counter.todayRecord) {
        saveLocal('daily_counter_state', counter);
        return counter;
      }
    } catch (err) {
      console.warn('[DataStore] Backend getDailyCounter error, falling back to cache:', err);
    }

    // 2. Fallback to cached state
    const cached = loadLocal<SharedDailyCounterState | null>('daily_counter_state', null);
    if (cached && cached.todayRecord) {
      return cached;
    }

    const today = getKolkataDateString();
    return {
      sharedCount: 613,
      todayDate: today,
      todayRecord: {
        date: today,
        partner1CheckedIn: true,
        partner2CheckedIn: true,
        bothCompleted: true,
      },
      history: {},
    };
  },

  async recordDailyLogin(spaceId: string, isPartner1: boolean): Promise<SharedDailyCounterState> {
    // 1. Always record atomically in SQLite
    try {
      const counter = await Api.recordDailyCheckin({
        partnerIndex: isPartner1 ? 1 : 2,
        isPartner1,
      });
      if (counter && counter.todayRecord) {
        saveLocal('daily_counter_state', counter);
        notifySync('DAILY_CHECKIN_UPDATED', counter);
        return counter;
      }
    } catch (err) {
      console.warn('[DataStore] Backend recordDailyCheckin error:', err);
    }

    return this.getDailyCounterState(spaceId);
  },

  // Real-time Event Listeners
  onSync(callback: (event: { type: string; payload?: any }) => void) {
    // 1. Connect WebSocket to backend
    connectWebSocket();

    // 2. Listen to WebSocket events from backend
    const unsubWs = onBackendSync((event) => {
      callback(event);
    });

    // 3. Local cross-tab BroadcastChannel
    const handleBroadcast = (ev: MessageEvent) => callback(ev.data);
    const handleCustom = (ev: Event) => {
      const custom = ev as CustomEvent;
      callback(custom.detail);
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcast);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('two-of-us-sync', handleCustom);
    }

    return () => {
      unsubWs();
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcast);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('two-of-us-sync', handleCustom);
      }
    };
  }
};
