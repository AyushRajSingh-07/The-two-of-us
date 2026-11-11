import { supabase, isSupabaseConfigured } from './supabase';
import { CoupleSpace, ChatMessage, PhotoItem, GameSessionState } from '../types';

// Default initial couple profile
const DEFAULT_COUPLE: CoupleSpace = {
  id: 'couple-space-default',
  partner1Name: 'Alex',
  partner1Avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  partner2Name: 'Jordan',
  partner2Avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  anniversaryDate: '2024-02-14',
  welcomeMessage: 'Welcome to our private sanctuary. A quiet corner just for us.',
  inviteCode: 'US-FOREVER-2024',
  isPaired: true,
  createdAt: new Date().toISOString(),
};

// Initial welcome messages for chat
const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    spaceId: 'couple-space-default',
    senderId: 'partner-1',
    senderName: 'Alex',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    text: 'Hey sweetheart! Welcome to our private website! 💕 Look around, we have games, our private photo album, and this chat.',
    reactions: { '❤️': ['partner-2'], '✨': ['partner-1'] },
    isRead: true,
    isDelivered: true,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'msg-2',
    spaceId: 'couple-space-default',
    senderId: 'partner-2',
    senderName: 'Jordan',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    text: 'Omg this is amazing!! Did you build this for us? 🥰 Want to play the Together Maze or try the quizzes first?',
    reactions: { '🥰': ['partner-1'] },
    isRead: true,
    isDelivered: true,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'msg-3',
    spaceId: 'couple-space-default',
    senderId: 'partner-1',
    senderName: 'Alex',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    text: 'Let\'s try the Garden or Draw and Guess first! I also uploaded our favorite sunset photo in the gallery 🌅',
    reactions: {},
    isRead: true,
    isDelivered: true,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  }
];

// Initial starter photos for gallery
const DEFAULT_PHOTOS: PhotoItem[] = [
  {
    id: 'photo-1',
    spaceId: 'couple-space-default',
    uploaderId: 'partner-1',
    uploaderName: 'Alex',
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
    uploaderName: 'Jordan',
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
    uploaderName: 'Alex',
    url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1000&auto=format&fit=crop&q=80',
    caption: 'First road trip together! Singing our lungs out to nostalgic playlists.',
    dateTaken: '2024-07-22',
    album: 'Adventures',
    isFavorite: false,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  }
];

// Cross-device and cross-tab sync setup
const broadcastChannel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('two-of-us-sync')
  : null;

// Track active Supabase realtime channel for game sessions
let activeGameRealtimeChannel: any = null;

// LocalStorage helpers
function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`two_of_us_${key}`);
    return raw ? JSON.parse(raw) : fallback;
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

// Global broadcast dispatcher (notifies local window, cross-tab, and local Vite SSE if available)
function notifySync(type: string, payload?: any) {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type, payload });
  }
  window.dispatchEvent(new CustomEvent('two-of-us-sync', { detail: { type, payload } }));

  // Also broadcast to Vite local sync bridge for phone <-> PC local Wi-Fi testing
  if (typeof fetch !== 'undefined' && !isSupabaseConfigured && payload?.sessionId) {
    fetch(`/api/sync/session?sessionId=${payload.sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Ignore if running standalone static build
    });
  }
}

export const DataStore = {
  // Couple Space
  async getCoupleSpace(): Promise<CoupleSpace> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('couples')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data && !error) {
          return {
            id: data.id,
            partner1Name: data.partner1_name,
            partner1Avatar: data.partner1_avatar,
            partner2Name: data.partner2_name,
            partner2Avatar: data.partner2_avatar,
            anniversaryDate: data.anniversary_date,
            welcomeMessage: data.welcome_message,
            inviteCode: data.invite_code,
            isPaired: data.is_paired,
            createdAt: data.created_at,
          };
        }
      } catch (e) {
        console.warn('Supabase fetch couple error, falling back to local', e);
      }
    }
    return loadLocal<CoupleSpace>('couple_space', DEFAULT_COUPLE);
  },

  async saveCoupleSpace(space: CoupleSpace): Promise<CoupleSpace> {
    saveLocal('couple_space', space);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('couples').upsert({
          id: space.id.startsWith('couple-space') ? undefined : space.id,
          partner1_name: space.partner1Name,
          partner1_avatar: space.partner1Avatar,
          partner2_name: space.partner2Name,
          partner2_avatar: space.partner2Avatar,
          anniversary_date: space.anniversaryDate,
          welcome_message: space.welcomeMessage,
          invite_code: space.inviteCode,
          is_paired: space.isPaired,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to sync couple space to Supabase', err);
      }
    }
    notifySync('COUPLE_UPDATED', space);
    return space;
  },

  // Chat Messages
  async getMessages(spaceId: string): Promise<ChatMessage[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .order('created_at', { ascending: true });

        if (data && !error) {
          return data.map((d: any) => ({
            id: d.id,
            spaceId: d.space_id,
            senderId: d.sender_id,
            senderName: d.sender_name,
            senderAvatar: d.sender_avatar,
            text: d.text,
            imageUrl: d.image_url,
            replyToId: d.reply_to_id,
            replyToText: d.reply_to_text,
            replyToSender: d.reply_to_sender,
            reactions: d.reactions || {},
            isRead: d.is_read,
            isDelivered: d.is_delivered,
            createdAt: d.created_at,
            editedAt: d.edited_at,
          }));
        }
      } catch (e) {
        console.warn('Supabase getMessages error, falling back', e);
      }
    }
    return loadLocal<ChatMessage[]>('chat_messages', DEFAULT_MESSAGES);
  },

  async sendMessage(msg: Omit<ChatMessage, 'id' | 'createdAt' | 'reactions' | 'isRead' | 'isDelivered'>): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      ...msg,
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      reactions: {},
      isRead: false,
      isDelivered: true,
      createdAt: new Date().toISOString(),
    };

    const current = loadLocal<ChatMessage[]>('chat_messages', DEFAULT_MESSAGES);
    const updated = [...current, newMessage];
    saveLocal('chat_messages', updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('chat_messages').insert({
          space_id: msg.spaceId.startsWith('couple-space') ? null : msg.spaceId,
          sender_id: msg.senderId,
          sender_name: msg.senderName,
          sender_avatar: msg.senderAvatar,
          text: msg.text,
          image_url: msg.imageUrl,
          reply_to_id: msg.replyToId,
          reply_to_text: msg.replyToText,
          reply_to_sender: msg.replyToSender,
          reactions: {},
          is_read: false,
          is_delivered: true,
        });
      } catch (e) {
        console.error('Supabase send message error', e);
      }
    }

    notifySync('CHAT_UPDATED', updated);
    return newMessage;
  },

  async editMessage(messageId: string, newText: string): Promise<void> {
    const current = loadLocal<ChatMessage[]>('chat_messages', DEFAULT_MESSAGES);
    const updated = current.map(m => m.id === messageId ? { ...m, text: newText, editedAt: new Date().toISOString() } : m);
    saveLocal('chat_messages', updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('chat_messages').update({ text: newText, edited_at: new Date().toISOString() }).eq('id', messageId);
      } catch (e) {
        console.error(e);
      }
    }
    notifySync('CHAT_UPDATED', updated);
  },

  async deleteMessage(messageId: string): Promise<void> {
    const current = loadLocal<ChatMessage[]>('chat_messages', DEFAULT_MESSAGES);
    const updated = current.filter(m => m.id !== messageId);
    saveLocal('chat_messages', updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('chat_messages').delete().eq('id', messageId);
      } catch (e) {
        console.error(e);
      }
    }
    notifySync('CHAT_UPDATED', updated);
  },

  async toggleReaction(messageId: string, emoji: string, userId: string): Promise<void> {
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

    if (isSupabaseConfigured && supabase) {
      const msg = updated.find(m => m.id === messageId);
      if (msg) {
        try {
          await supabase.from('chat_messages').update({ reactions: msg.reactions }).eq('id', messageId);
        } catch (e) {
          console.error(e);
        }
      }
    }
    notifySync('CHAT_UPDATED', updated);
  },

  async markMessagesAsRead(spaceId: string, currentUserId: string): Promise<void> {
    const current = loadLocal<ChatMessage[]>('chat_messages', DEFAULT_MESSAGES);
    let changed = false;
    const updated = current.map(m => {
      if (m.senderId !== currentUserId && !m.isRead) {
        changed = true;
        return { ...m, isRead: true };
      }
      return m;
    });
    if (changed) {
      saveLocal('chat_messages', updated);
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('chat_messages').update({ is_read: true }).neq('sender_id', currentUserId);
        } catch (e) {
          console.error(e);
        }
      }
      notifySync('CHAT_UPDATED', updated);
    }
  },

  // Photos
  async getPhotos(spaceId: string): Promise<PhotoItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('photos')
          .select('*')
          .order('created_at', { ascending: false });

        if (data && !error) {
          return data.map((d: any) => ({
            id: d.id,
            spaceId: d.space_id,
            uploaderId: d.uploader_id,
            uploaderName: d.uploader_name,
            url: d.url,
            caption: d.caption,
            dateTaken: d.date_taken,
            album: d.album,
            isFavorite: d.is_favorite,
            createdAt: d.created_at,
          }));
        }
      } catch (e) {
        console.warn('Supabase getPhotos error, falling back', e);
      }
    }
    return loadLocal<PhotoItem[]>('photos', DEFAULT_PHOTOS);
  },

  async uploadPhoto(item: Omit<PhotoItem, 'id' | 'createdAt'>): Promise<PhotoItem> {
    const newPhoto: PhotoItem = {
      ...item,
      id: 'photo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
    };

    const current = loadLocal<PhotoItem[]>('photos', DEFAULT_PHOTOS);
    const updated = [newPhoto, ...current];
    saveLocal('photos', updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('photos').insert({
          space_id: item.spaceId.startsWith('couple-space') ? null : item.spaceId,
          uploader_id: item.uploaderId,
          uploader_name: item.uploaderName,
          url: item.url,
          caption: item.caption,
          date_taken: item.dateTaken,
          album: item.album,
          is_favorite: item.isFavorite,
        });
      } catch (e) {
        console.error('Supabase photo insert error', e);
      }
    }

    notifySync('PHOTOS_UPDATED', updated);
    return newPhoto;
  },

  async toggleFavoritePhoto(photoId: string): Promise<void> {
    const current = loadLocal<PhotoItem[]>('photos', DEFAULT_PHOTOS);
    const updated = current.map(p => p.id === photoId ? { ...p, isFavorite: !p.isFavorite } : p);
    saveLocal('photos', updated);

    if (isSupabaseConfigured && supabase) {
      const p = updated.find(x => x.id === photoId);
      if (p) {
        try {
          await supabase.from('photos').update({ is_favorite: p.isFavorite }).eq('id', photoId);
        } catch (e) {
          console.error(e);
        }
      }
    }
    notifySync('PHOTOS_UPDATED', updated);
  },

  async deletePhoto(photoId: string): Promise<void> {
    const current = loadLocal<PhotoItem[]>('photos', DEFAULT_PHOTOS);
    const updated = current.filter(p => p.id !== photoId);
    saveLocal('photos', updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('photos').delete().eq('id', photoId);
      } catch (e) {
        console.error(e);
      }
    }
    notifySync('PHOTOS_UPDATED', updated);
  },

  // Game Sessions (Multiplayer Co-op cross-device synchronization)
  async getGameSession<T = any>(sessionId: string): Promise<GameSessionState<T> | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('id', sessionId)
          .maybeSingle();

        if (data && !error) {
          return {
            sessionId: data.id,
            gameId: data.game_id,
            currentTurnUserId: data.current_turn_user_id,
            status: data.status,
            data: data.state,
            lastUpdatedBy: data.last_updated_by,
            updatedAt: data.updated_at,
          };
        }
      } catch (e) {
        console.warn('Supabase getGameSession error, falling back', e);
      }
    }

    // Try fetching from Vite local sync bridge (for Phone <-> PC over local Wi-Fi)
    if (typeof fetch !== 'undefined' && !isSupabaseConfigured) {
      try {
        const res = await fetch(`/api/sync/session?sessionId=${sessionId}`);
        if (res.ok) {
          const json = await res.json();
          if (json?.data) return json.data;
        }
      } catch {
        // Fallback to local
      }
    }

    return loadLocal<GameSessionState<T> | null>(`game_session_${sessionId}`, null);
  },

  async updateGameSession<T = any>(session: GameSessionState<T>): Promise<void> {
    saveLocal(`game_session_${session.sessionId}`, session);

    if (isSupabaseConfigured && supabase) {
      try {
        // Ensure realtime channel is subscribed
        if (!activeGameRealtimeChannel || activeGameRealtimeChannel.topic !== `game_${session.sessionId}`) {
          activeGameRealtimeChannel = supabase.channel(`game_${session.sessionId}`);
          activeGameRealtimeChannel.subscribe();
        }

        // Fast broadcast to partner phone/PC
        activeGameRealtimeChannel.send({
          type: 'broadcast',
          event: 'GAME_UPDATED',
          payload: session,
        });

        // Persist in Postgres DB
        await supabase.from('game_sessions').upsert({
          id: session.sessionId,
          game_id: session.gameId,
          current_turn_user_id: session.currentTurnUserId,
          status: session.status,
          state: session.data,
          last_updated_by: session.lastUpdatedBy,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Supabase game session upsert error', e);
      }
    }

    notifySync('GAME_UPDATED', session);
  },

  // Event Listeners for Real-time Reactive Updates (Cross-device, Cross-tab, Local)
  onSync(callback: (event: { type: string; payload?: any }) => void) {
    const handleBroadcast = (ev: MessageEvent) => callback(ev.data);
    const handleCustom = (ev: Event) => {
      const custom = ev as CustomEvent;
      callback(custom.detail);
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcast);
    }
    window.addEventListener('two-of-us-sync', handleCustom);

    // If on Vite local Wi-Fi dev server, subscribe to SSE stream
    let sseSource: EventSource | null = null;
    if (typeof EventSource !== 'undefined' && !isSupabaseConfigured) {
      try {
        sseSource = new EventSource('/api/sync/stream');
        sseSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data?.type === 'GAME_UPDATED') {
              callback(data);
            }
          } catch {}
        };
      } catch {}
    }

    // If Supabase is configured, subscribe to Supabase broadcast channel
    let supabaseChannel: any = null;
    if (isSupabaseConfigured && supabase) {
      supabaseChannel = supabase
        .channel('couple_global_sync')
        .on('broadcast', { event: 'GAME_UPDATED' }, (payload: any) => {
          callback({ type: 'GAME_UPDATED', payload: payload.payload });
        })
        .subscribe();
    }

    return () => {
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcast);
      }
      window.removeEventListener('two-of-us-sync', handleCustom);
      if (sseSource) sseSource.close();
      if (supabaseChannel && supabase) supabase.removeChannel(supabaseChannel);
    };
  }
};
