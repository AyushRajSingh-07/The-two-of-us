import { Router } from 'express';
import { db, getNowISO } from '../db.js';
import { requireAuth } from '../auth.js';
import { broadcast } from '../websocket.js';
import { formatCoupleSpace } from './authRoutes.js';

export const coupleRouter = Router();

// Get Couple Space details (public read so any device displays canonical couple profile)
coupleRouter.get('/', (req, res) => {
  const row = db.prepare('SELECT * FROM couple_space WHERE id = ?').get('couple-space-default');
  if (!row) {
    return res.status(404).json({ error: 'Couple space not found.' });
  }
  res.json(formatCoupleSpace(row));
});

// Update Couple Space settings (accessible from phone & PC to persist profile & couple updates)
coupleRouter.put('/', (req, res) => {
  const existing = db.prepare('SELECT * FROM couple_space WHERE id = ?').get('couple-space-default');
  if (!existing) {
    return res.status(404).json({ error: 'Couple space not found.' });
  }

  const body = req.body;

  const partner1Name = body.partner1Name !== undefined ? body.partner1Name : existing.partner1_name;
  const partner1Avatar = body.partner1Avatar !== undefined ? body.partner1Avatar : existing.partner1_avatar;
  const partner1Bio = body.partner1Bio !== undefined ? body.partner1Bio : existing.partner1_bio;
  const partner2Name = body.partner2Name !== undefined ? body.partner2Name : existing.partner2_name;
  const partner2Avatar = body.partner2Avatar !== undefined ? body.partner2Avatar : existing.partner2_avatar;
  const partner2Bio = body.partner2Bio !== undefined ? body.partner2Bio : existing.partner2_bio;
  const anniversaryDate = body.anniversaryDate !== undefined ? body.anniversaryDate : existing.anniversary_date;
  const welcomeMessage = body.welcomeMessage !== undefined ? body.welcomeMessage : existing.welcome_message;
  const inviteCode = body.inviteCode !== undefined ? body.inviteCode : existing.invite_code;
  const sharedTimezone = body.sharedTimezone !== undefined ? body.sharedTimezone : existing.shared_timezone;
  const loveDayBaseCount = body.loveDayBaseCount !== undefined ? Number(body.loveDayBaseCount) : existing.love_day_base_count;
  const partner1Theme = body.partner1Theme !== undefined ? body.partner1Theme : existing.partner1_theme;
  const partner2Theme = body.partner2Theme !== undefined ? body.partner2Theme : existing.partner2_theme;
  const reminderDailyCheckin = body.reminderDailyCheckin !== undefined ? (body.reminderDailyCheckin ? 1 : 0) : existing.reminder_daily_checkin;
  const reminderDateNight = body.reminderDateNight !== undefined ? (body.reminderDateNight ? 1 : 0) : existing.reminder_date_night;
  const soundEffectsEnabled = body.soundEffectsEnabled !== undefined ? (body.soundEffectsEnabled ? 1 : 0) : existing.sound_effects_enabled;
  const privatePhotosOnly = body.privatePhotosOnly !== undefined ? (body.privatePhotosOnly ? 1 : 0) : existing.private_photos_only;
  const allowPhotoDownloads = body.allowPhotoDownloads !== undefined ? (body.allowPhotoDownloads ? 1 : 0) : existing.allow_photo_downloads;
  const isPaired = body.isPaired !== undefined ? (body.isPaired ? 1 : 0) : existing.is_paired;

  db.prepare(`
    UPDATE couple_space SET
      partner1_name = ?, partner1_avatar = ?, partner1_bio = ?,
      partner2_name = ?, partner2_avatar = ?, partner2_bio = ?,
      anniversary_date = ?, welcome_message = ?, invite_code = ?,
      shared_timezone = ?, love_day_base_count = ?, partner1_theme = ?,
      partner2_theme = ?, reminder_daily_checkin = ?, reminder_date_night = ?,
      sound_effects_enabled = ?, private_photos_only = ?, allow_photo_downloads = ?,
      is_paired = ?, updated_at = ?
    WHERE id = 'couple-space-default'
  `).run(
    partner1Name, partner1Avatar, partner1Bio,
    partner2Name, partner2Avatar, partner2Bio,
    anniversaryDate, welcomeMessage, inviteCode,
    sharedTimezone, loveDayBaseCount, partner1Theme,
    partner2Theme, reminderDailyCheckin, reminderDateNight,
    soundEffectsEnabled, privatePhotosOnly, allowPhotoDownloads,
    isPaired, getNowISO()
  );

  // Keep users table in sync with profile updates
  try {
    db.prepare("UPDATE users SET avatar = ?, display_name = ? WHERE id = 'partner-1' OR username = 'ayush'").run(partner1Avatar, partner1Name);
    db.prepare("UPDATE users SET avatar = ?, display_name = ? WHERE id = 'partner-2' OR username = 'vrishti'").run(partner2Avatar, partner2Name);
  } catch {}

  // Update existing chat messages sender_avatar so chat history reflects the new profile picture
  try {
    db.prepare("UPDATE chat_messages SET sender_avatar = ? WHERE sender_id = 'partner-1' OR sender_name = ?").run(partner1Avatar, partner1Name);
    db.prepare("UPDATE chat_messages SET sender_avatar = ? WHERE sender_id = 'partner-2' OR sender_name = ?").run(partner2Avatar, partner2Name);
  } catch {}

  const updated = db.prepare('SELECT * FROM couple_space WHERE id = ?').get('couple-space-default');
  const formatted = formatCoupleSpace(updated);

  // Broadcast settings change in real-time to all devices
  broadcast('COUPLE_UPDATED', formatted);

  // Also broadcast refreshed chat messages so avatars update live in chat
  try {
    const chatRows = db.prepare('SELECT * FROM chat_messages ORDER BY created_at ASC').all();
    const formattedMsgs = chatRows.map((r) => ({
      id: r.id,
      clientMessageId: r.client_message_id || undefined,
      spaceId: 'couple-space-default',
      senderId: r.sender_id,
      senderName: r.sender_name,
      senderAvatar: r.sender_id === 'partner-1' || r.sender_name === partner1Name ? partner1Avatar : partner2Avatar,
      text: r.text,
      imageUrl: r.image_url,
      replyToId: r.reply_to_id,
      replyToText: r.reply_to_text,
      replyToSender: r.reply_to_sender,
      reactions: JSON.parse(r.reactions || '{}'),
      isRead: Boolean(r.is_read),
      isDelivered: Boolean(r.is_delivered),
      editedAt: r.edited_at,
      createdAt: r.created_at,
      status: 'sent',
    }));
    broadcast('CHAT_UPDATED', formattedMsgs);
  } catch {}

  res.json(formatted);
});
