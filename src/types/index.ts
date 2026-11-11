export type CategoryType = 'romantic' | 'funny' | 'coop';
export type ThemeMode = 'light' | 'dark';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  theme?: ThemeMode;
  email?: string;
  isPartner1: boolean;
}

export interface CoupleSpace {
  id: string;
  partner1Name: string;
  partner1Avatar: string;
  partner1Bio?: string;
  partner1Theme?: ThemeMode;
  partner2Name: string;
  partner2Avatar: string;
  partner2Bio?: string;
  partner2Theme?: ThemeMode;
  anniversaryDate: string; // YYYY-MM-DD
  welcomeMessage: string;
  inviteCode: string;
  isPaired: boolean;
  sharedTimezone: string; // e.g. 'Asia/Kolkata'
  loveDayBaseCount: number; // e.g. 612
  loveDayBaseMigrated: boolean; // Ensures one-time update to 612
  reminderDailyCheckin: boolean;
  reminderDateNight: boolean;
  soundEffectsEnabled: boolean;
  privatePhotosOnly: boolean;
  allowPhotoDownloads: boolean;
  createdAt: string;
}

export interface ReactionRecord {
  emoji: string;
  userIds: string[];
}

export interface ChatMessage {
  id: string;
  spaceId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  imageUrl?: string;
  replyToId?: string;
  replyToText?: string;
  replyToSender?: string;
  reactions: Record<string, string[]>; // emoji -> array of userIds
  isRead: boolean;
  isDelivered: boolean;
  createdAt: string;
  editedAt?: string;
  status?: 'sending' | 'sent' | 'failed';
  error?: string;
}

export interface PhotoItem {
  id: string;
  spaceId: string;
  uploaderId: string;
  uploaderName: string;
  url: string;
  caption: string;
  dateTaken: string;
  album: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface GameInfo {
  id: string;
  title: string;
  category: CategoryType;
  description: string;
  tagline: string;
  icon: string;
  playersBadge: string;
  difficulty?: 'Easy' | 'Cozy' | 'Playful' | 'Spicy';
}

export interface GameSessionState<T = any> {
  sessionId: string;
  gameId: string;
  currentTurnUserId?: string;
  status: 'waiting' | 'in_progress' | 'completed';
  data: T;
  lastUpdatedBy: string;
  updatedAt: string;
}

export interface DailyCheckinRecord {
  date: string; // YYYY-MM-DD in Asia/Kolkata
  partner1CheckedIn: boolean; // Ayush
  partner1CheckedInAt?: string;
  partner2CheckedIn: boolean; // Vrishti
  partner2CheckedInAt?: string;
  bothCompleted: boolean;
}

export interface SharedDailyCounterState {
  sharedCount: number; // Cumulative days where both Ayush and Vrishti logged in
  todayDate: string; // YYYY-MM-DD in Asia/Kolkata
  todayRecord: DailyCheckinRecord;
  history: Record<string, DailyCheckinRecord>;
}
