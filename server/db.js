import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'sanctuary.db');
export const db = new DatabaseSync(DB_PATH);

// Turn on WAL mode for fast concurrent reads and writes
db.exec(`PRAGMA journal_mode = WAL;`);
db.exec(`PRAGMA synchronous = NORMAL;`);

// Helper to get Kolkata date YYYY-MM-DD
export function getKolkataDateString() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

// Helper to get current ISO timestamp
export function getNowISO() {
  return new Date().toISOString();
}

// Initialize tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS couple_space (
      id TEXT PRIMARY KEY,
      partner1_name TEXT NOT NULL,
      partner1_avatar TEXT,
      partner1_bio TEXT,
      partner2_name TEXT NOT NULL,
      partner2_avatar TEXT,
      partner2_bio TEXT,
      anniversary_date TEXT,
      welcome_message TEXT,
      invite_code TEXT NOT NULL,
      shared_timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
      love_day_base_count INTEGER NOT NULL DEFAULT 612,
      partner1_theme TEXT DEFAULT 'light',
      partner2_theme TEXT DEFAULT 'light',
      reminder_daily_checkin INTEGER DEFAULT 1,
      reminder_date_night INTEGER DEFAULT 1,
      sound_effects_enabled INTEGER DEFAULT 1,
      private_photos_only INTEGER DEFAULT 1,
      allow_photo_downloads INTEGER DEFAULT 1,
      is_paired INTEGER DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_checkins (
      date TEXT PRIMARY KEY,
      partner1_checked_in INTEGER NOT NULL DEFAULT 0,
      partner1_checked_in_at TEXT,
      partner2_checked_in INTEGER NOT NULL DEFAULT 0,
      partner2_checked_in_at TEXT,
      both_completed INTEGER NOT NULL DEFAULT 0,
      counted_towards_love_days INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      client_message_id TEXT UNIQUE,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_avatar TEXT,
      text TEXT,
      image_url TEXT,
      reply_to_id TEXT,
      reply_to_text TEXT,
      reply_to_sender TEXT,
      reactions TEXT DEFAULT '{}',
      is_read INTEGER DEFAULT 0,
      is_delivered INTEGER DEFAULT 1,
      edited_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      uploader_id TEXT NOT NULL,
      uploader_name TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      caption TEXT,
      album TEXT DEFAULT 'Date Nights',
      date_taken TEXT,
      is_favorite INTEGER DEFAULT 0,
      mime_type TEXT,
      file_size INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS game_sessions (
      session_id TEXT PRIMARY KEY,
      game_title TEXT,
      state TEXT NOT NULL,
      updated_by TEXT,
      updated_at TEXT NOT NULL
    );
  `);

  // Safely ensure client_message_id column exists
  try {
    db.prepare('ALTER TABLE chat_messages ADD COLUMN client_message_id TEXT').run();
  } catch {}
  try {
    db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_client_msg_id ON chat_messages(client_message_id)').run();
  } catch {}

  // Seed Couple Space if not present
  const existingCouple = db.prepare('SELECT * FROM couple_space WHERE id = ?').get('couple-space-default');
  if (!existingCouple) {
    db.prepare(`
      INSERT INTO couple_space (
        id, partner1_name, partner1_avatar, partner1_bio,
        partner2_name, partner2_avatar, partner2_bio,
        anniversary_date, welcome_message, invite_code,
        shared_timezone, love_day_base_count,
        partner1_theme, partner2_theme,
        reminder_daily_checkin, reminder_date_night, sound_effects_enabled,
        private_photos_only, allow_photo_downloads, is_paired, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'couple-space-default',
      'Ayush',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'Adoring boyfriend & puzzle enthusiast. Always smiling when with Vrishti ❤️',
      'Vrishti',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      'Chief tea drinker, garden master, and Ayush’s favorite human ✨',
      getKolkataDateString(),
      'Welcome to our private sanctuary. A quiet corner just for us.',
      'US-FOREVER-2024',
      'Asia/Kolkata',
      612,
      'light',
      'light',
      1, 1, 1, 1, 1, 1,
      getNowISO()
    );
    console.log('[DB] Seeded initial CoupleSpace with 612 base Love Days');
  }

  // Seed Users (Ayush & Vrishti)
  const ayushPass = process.env.AYUSH_PASSWORD || 'ayush123';
  const vrishtiPass = process.env.VRISHTI_PASSWORD || 'vrishti123';

  const ayushUser = db.prepare('SELECT * FROM users WHERE username = ?').get('ayush');
  if (!ayushUser) {
    const hash = bcrypt.hashSync(ayushPass, 10);
    db.prepare(`
      INSERT INTO users (id, username, password_hash, display_name, avatar, bio, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'partner-1',
      'ayush',
      hash,
      'Ayush',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'Adoring boyfriend & puzzle enthusiast. Always smiling when with Vrishti ❤️',
      getNowISO()
    );
    console.log('[DB] Created account: ayush');
  }

  const vrishtiUser = db.prepare('SELECT * FROM users WHERE username = ?').get('vrishti');
  if (!vrishtiUser) {
    const hash = bcrypt.hashSync(vrishtiPass, 10);
    db.prepare(`
      INSERT INTO users (id, username, password_hash, display_name, avatar, bio, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'partner-2',
      'vrishti',
      hash,
      'Vrishti',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      'Chief tea drinker, garden master, and Ayush’s favorite human ✨',
      getNowISO()
    );
    console.log('[DB] Created account: vrishti');
  }

  // Seed starter chat messages if empty
  const msgCount = db.prepare('SELECT COUNT(*) as count FROM chat_messages').get().count;
  if (msgCount === 0) {
    const now = Date.now();
    const insertMsg = db.prepare(`
      INSERT INTO chat_messages (
        id, sender_id, sender_name, sender_avatar, text,
        reactions, is_read, is_delivered, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertMsg.run(
      'msg-1',
      'partner-1',
      'Ayush',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'Hey sweetheart! Welcome to our private website! 💕 Look around, we have games, our private photo album, and this chat.',
      JSON.stringify({ '❤️': ['partner-2'], '✨': ['partner-1'] }),
      1, 1,
      new Date(now - 3600000 * 2).toISOString()
    );

    insertMsg.run(
      'msg-2',
      'partner-2',
      'Vrishti',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      'Omg this is amazing!! Did you build this for us? 🥰 Want to play the Together Maze or try the quizzes first?',
      JSON.stringify({ '🥰': ['partner-1'] }),
      1, 1,
      new Date(now - 3600000 * 1).toISOString()
    );

    console.log('[DB] Seeded initial chat messages');
  }
}
