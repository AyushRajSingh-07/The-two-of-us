import { Router } from 'express';
import { db, getNowISO } from '../db.js';
import { generateToken, comparePassword, hashPassword, requireAuth } from '../auth.js';
import { broadcast } from '../websocket.js';

export const authRouter = Router();

// Login for Ayush or Vrishti
authRouter.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const cleanUser = String(username).trim().toLowerCase();
  if (cleanUser !== 'ayush' && cleanUser !== 'vrishti') {
    return res.status(403).json({
      error: 'Access restricted: Only Ayush and Vrishti are authorized to enter this private sanctuary.',
    });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUser);
  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  const isValid = comparePassword(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }

  const token = generateToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.display_name,
      avatar: user.avatar,
      bio: user.bio,
      isPartner1: user.id === 'partner-1',
    },
  });
});

// Check current session
authRouter.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({
    id: user.id,
    username: user.username,
    name: user.display_name,
    avatar: user.avatar,
    bio: user.bio,
    isPartner1: user.id === 'partner-1',
  });
});

// Update own profile
authRouter.put('/profile', requireAuth, (req, res) => {
  const { name, avatar, bio } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const newName = name !== undefined ? name.trim() : user.display_name;
  const newAvatar = avatar !== undefined ? avatar : user.avatar;
  const newBio = bio !== undefined ? bio.trim() : user.bio;

  db.prepare(`
    UPDATE users SET display_name = ?, avatar = ?, bio = ? WHERE id = ?
  `).run(newName, newAvatar, newBio, user.id);

  // Also update corresponding partner fields in couple_space
  const isP1 = user.id === 'partner-1';
  if (isP1) {
    db.prepare(`
      UPDATE couple_space
      SET partner1_name = ?, partner1_avatar = ?, partner1_bio = ?, updated_at = ?
      WHERE id = 'couple-space-default'
    `).run(newName, newAvatar, newBio, getNowISO());
  } else {
    db.prepare(`
      UPDATE couple_space
      SET partner2_name = ?, partner2_avatar = ?, partner2_bio = ?, updated_at = ?
      WHERE id = 'couple-space-default'
    `).run(newName, newAvatar, newBio, getNowISO());
  }

  const updatedCouple = db.prepare('SELECT * FROM couple_space WHERE id = ?').get('couple-space-default');
  broadcast('COUPLE_UPDATED', formatCoupleSpace(updatedCouple));

  res.json({
    id: user.id,
    username: user.username,
    name: newName,
    avatar: newAvatar,
    bio: newBio,
    isPartner1: isP1,
  });
});

// Change password
authRouter.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user || !comparePassword(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  const newHash = hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);

  res.json({ success: true, message: 'Password successfully updated.' });
});

export function formatCoupleSpace(row) {
  if (!row) return null;
  return {
    id: row.id,
    partner1Name: row.partner1_name,
    partner1Avatar: row.partner1_avatar,
    partner1Bio: row.partner1_bio,
    partner2Name: row.partner2_name,
    partner2Avatar: row.partner2_avatar,
    partner2Bio: row.partner2_bio,
    anniversaryDate: row.anniversary_date,
    welcomeMessage: row.welcome_message,
    inviteCode: row.invite_code,
    sharedTimezone: row.shared_timezone || 'Asia/Kolkata',
    loveDayBaseCount: row.love_day_base_count || 612,
    loveDayBaseMigrated: true,
    partner1Theme: row.partner1_theme || 'light',
    partner2Theme: row.partner2_theme || 'light',
    reminderDailyCheckin: Boolean(row.reminder_daily_checkin),
    reminderDateNight: Boolean(row.reminder_date_night),
    soundEffectsEnabled: Boolean(row.sound_effects_enabled),
    privatePhotosOnly: Boolean(row.private_photos_only),
    allowPhotoDownloads: Boolean(row.allow_photo_downloads),
    isPaired: Boolean(row.is_paired),
    updatedAt: row.updated_at,
  };
}
