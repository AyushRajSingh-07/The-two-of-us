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
    // 1. Try real backend if token exists
    if (getAuthToken()) {
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
    }

    // 2. Supabase fallback
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
    if (!local.partner1Bio) local.partner1Bio = DEFAULT_COUPLE.partner1Bio;
    if (!local.partner2Bio) local.partner2Bio = DEFAULT_COUPLE.partner2Bio;
    if (!local.sharedTimezone) local.sharedTimezone = 'Asia/Kolkata';
    if (!local.loveDayBaseCount) local.loveDayBaseCount = 612;
    local.loveDayBaseMigrated = true;
    if (local.partner1Name === 'Alex') local.partner1Name = 'Ayush';
    if (local.partner2Name === 'Jordan') local.partner2Name = 'Vrishti';
    saveLocal('couple_space', local);
    return local;
  },

  async saveCoupleSpace(space: CoupleSpace): Promise<CoupleSpace> {
    saveLocal('couple_space', space);

    // 1. Try real backend
    if (getAuthToken()) {
      try {
        await Api.updateCoupleSpace(space);
      } catch (err) {
        console.warn('[DataStore] Backend saveCoupleSpace error:', err);
      }
    }

    // 2. Supabase fallback
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('couples').upsert({
          id: space.id.startsWith('couple-space') ? undefined : space.id,
          partner1_name: space.partner1Name,
          partner1_avatar: space.partner1Avatar,
          partner1_bio: space.partner1Bio,
          partner2_name: space.partner2Name,
          partner2_avatar: space.partner2Avatar,
          partner2_bio: space.partner2Bio,
          anniversary_date: space.anniversaryDate,
          welcome_message: space.welcomeMessage,
          invite_code: space.inviteCode,
          is_paired: space.isPaired,
          shared_timezone: space.sharedTimezone || 'Asia/Kolkata',
          love_day_base_count: space.loveDayBaseCount || 612,
          love_day_base_migrated: true,
          reminder_daily_checkin: space.reminderDailyCheckin ?? true,
          reminder_date_night: space.reminderDateNight ?? true,
          sound_effects_enabled: space.soundEffectsEnabled ?? true,
          private_photos_only: space.privatePhotosOnly ?? true,
          allow_photo_downloads: space.allowPhotoDownloads ?? true,
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
    // 1. Try real backend
    if (getAuthToken()) {
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
          }));
          saveLocal('chat_messages', list);
          return list;
        }
      } catch (err) {
        console.warn('[DataStore] Backend getMessages error:', err);
      }
    }

    // 2. Supabase fallback
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
    // 1. Try real backend
    if (getAuthToken()) {
      try {
        const sent = await Api.sendMessage({
          text: msg.text,
          imageUrl: msg.imageUrl,
          replyToId: msg.replyToId,
          replyToText: msg.replyToText,
          replyToSender: msg.replyToSender,
        });

        const formatted: ChatMessage = {
          id: sent.id,
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
        };

        const current = loadLocal<ChatMessage[]>('chat_messages', DEFAULT_MESSAGES);
        const updated = [...current, formatted];
        saveLocal('chat_messages', updated);
        notifySync('CHAT_UPDATED', updated);
        return formatted;
      } catch (err) {
        console.warn('[DataStore] Backend sendMessage error, falling back:', err);
      }
    }

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
    if (getAuthToken()) {
      try {
        await Api.editMessage(messageId, newText);
      } catch (err) {
        console.warn('[DataStore] Backend editMessage error:', err);
      }
    }

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
    if (getAuthToken()) {
      try {
        await Api.deleteMessage(messageId);
      } catch (err) {
        console.warn('[DataStore] Backend deleteMessage error:', err);
      }
    }

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
    if (getAuthToken()) {
      try {
        await Api.toggleReaction(messageId, emoji);
      } catch (err) {
        console.warn('[DataStore] Backend toggleReaction error:', err);
      }
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
    if (getAuthToken()) {
      try {
        await Api.markMessagesRead();
      } catch (err) {
        console.warn('[DataStore] Backend markMessagesRead error:', err);
      }
    }

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
    if (getAuthToken()) {
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
    }

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

  async uploadPhoto(item: Omit<PhotoItem, 'id' | 'createdAt'> & { file?: File }): Promise<PhotoItem> {
    if (getAuthToken()) {
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
    }

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
    if (getAuthToken()) {
      try {
        await Api.toggleFavoritePhoto(photoId);
      } catch (err) {
        console.warn('[DataStore] Backend toggleFavoritePhoto error:', err);
      }
    }

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
    if (getAuthToken()) {
      try {
        await Api.deletePhoto(photoId);
      } catch (err) {
        console.warn('[DataStore] Backend deletePhoto error:', err);
      }
    }

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
    if (getAuthToken()) {
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
    }

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

    return loadLocal<GameSessionState<T> | null>(`game_session_${sessionId}`, null);
  },

  async updateGameSession<T = any>(session: GameSessionState<T>): Promise<void> {
    saveLocal(`game_session_${session.sessionId}`, session);

    if (getAuthToken()) {
      try {
        await Api.updateGameSession(session.sessionId, session.data, session.gameId);
      } catch (err) {
        console.warn('[DataStore] Backend updateGameSession error:', err);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
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

  // Shared Daily Login Check-in Counter (Asia/Kolkata timezone with 612 baseline)
  async getDailyCounterState(spaceId: string): Promise<SharedDailyCounterState> {
    if (getAuthToken()) {
      try {
        const counter = await Api.getDailyCounter();
        if (counter && counter.todayRecord) {
          saveLocal('daily_counter_state', counter);
          return counter;
        }
      } catch (err) {
        console.warn('[DataStore] Backend getDailyCounter error:', err);
      }
    }

    const today = getKolkataDateString();
    let history: Record<string, DailyCheckinRecord> = {};

    const isMigrated = loadLocal<boolean>('love_day_base_migrated_v612', false);
    if (!isMigrated) {
      saveLocal('love_day_base_count', 612);
      saveLocal('love_day_dates_counted', []);
      saveLocal('love_day_base_migrated_v612', true);

      const currentHistory = loadLocal<Record<string, DailyCheckinRecord>>('daily_checkin_history', {});
      const safeHistory = (currentHistory && typeof currentHistory === 'object') ? currentHistory : {};
      safeHistory[today] = {
        date: today,
        partner1CheckedIn: false,
        partner2CheckedIn: false,
        bothCompleted: false,
      };
      saveLocal('daily_checkin_history', safeHistory);

      let couple = loadLocal<CoupleSpace>('couple_space', DEFAULT_COUPLE);
      if (!couple || typeof couple !== 'object') couple = { ...DEFAULT_COUPLE };
      couple.loveDayBaseCount = 612;
      couple.loveDayBaseMigrated = true;
      saveLocal('couple_space', couple);
    }

    const localHist = loadLocal<Record<string, DailyCheckinRecord>>('daily_checkin_history', {});
    history = (localHist && typeof localHist === 'object') ? localHist : {};

    if (!history[today]) {
      history[today] = {
        date: today,
        partner1CheckedIn: false,
        partner2CheckedIn: false,
        bothCompleted: false,
      };
    }

    const rawBase = loadLocal<number>('love_day_base_count', 612);
    const baseCount = (typeof rawBase === 'number' && !isNaN(rawBase)) ? rawBase : 612;
    const rawDates = loadLocal<string[]>(LOVE_DAY_DATES_COUNTED_KEY, []);
    let datesCounted = Array.isArray(rawDates) ? [...rawDates] : [];

    let datesChanged = false;
    Object.entries(history).forEach(([dateStr, rec]) => {
      if (rec && rec.bothCompleted && !datesCounted.includes(dateStr)) {
        datesCounted.push(dateStr);
        datesChanged = true;
      }
    });
    if (datesChanged) {
      saveLocal('love_day_dates_counted', datesCounted);
    }

    const sharedCount = baseCount + datesCounted.length;

    return {
      sharedCount,
      todayDate: today,
      todayRecord: history[today],
      history,
    };
  },

  async recordDailyLogin(spaceId: string, isPartner1: boolean): Promise<SharedDailyCounterState> {
    if (getAuthToken()) {
      try {
        const counter = await Api.recordDailyCheckin();
        if (counter && counter.todayRecord) {
          saveLocal('daily_counter_state', counter);
          notifySync('DAILY_CHECKIN_UPDATED', counter);
          return counter;
        }
      } catch (err) {
        console.warn('[DataStore] Backend recordDailyCheckin error:', err);
      }
    }

    const today = getKolkataDateString();
    const current = await this.getDailyCounterState(spaceId);
    const history = { ...current.history };
    const todayRecord: DailyCheckinRecord = { ...(history[today] || {
      date: today,
      partner1CheckedIn: false,
      partner2CheckedIn: false,
      bothCompleted: false,
    }) };

    let changed = false;
    const nowIso = new Date().toISOString();

    if (isPartner1) {
      if (!todayRecord.partner1CheckedIn) {
        todayRecord.partner1CheckedIn = true;
        todayRecord.partner1CheckedInAt = nowIso;
        changed = true;
      }
    } else {
      if (!todayRecord.partner2CheckedIn) {
        todayRecord.partner2CheckedIn = true;
        todayRecord.partner2CheckedInAt = nowIso;
        changed = true;
      }
    }

    if (todayRecord.partner1CheckedIn && todayRecord.partner2CheckedIn && !todayRecord.bothCompleted) {
      todayRecord.bothCompleted = true;
      changed = true;
    }

    history[today] = todayRecord;
    saveLocal('daily_checkin_history', history);

    const rawBase = loadLocal<number>('love_day_base_count', 612);
    const baseCount = (typeof rawBase === 'number' && !isNaN(rawBase)) ? rawBase : 612;
    const rawDates = loadLocal<string[]>(LOVE_DAY_DATES_COUNTED_KEY, []);
    let datesCounted = Array.isArray(rawDates) ? [...rawDates] : [];
    if (todayRecord.bothCompleted && !datesCounted.includes(today)) {
      datesCounted.push(today);
      saveLocal('love_day_dates_counted', datesCounted);
    }

    const updatedSharedCount = baseCount + datesCounted.length;
    const result: SharedDailyCounterState = {
      sharedCount: updatedSharedCount,
      todayDate: today,
      todayRecord,
      history,
    };

    if (changed) {
      notifySync('DAILY_CHECKIN_UPDATED', result);
    }
    return result;
  },

  // Real-time Event Listeners
  onSync(callback: (event: { type: string; payload?: any }) => void) {
    // 1. Connect WebSocket to backend if not connected
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
