import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, getNowISO } from '../db.js';
import { requireAuth } from '../auth.js';
import { broadcast } from '../websocket.js';

export const chatRouter = Router();

function formatMessage(row) {
  if (!row) return null;
  let parsedReactions = {};
  try {
    parsedReactions = JSON.parse(row.reactions || '{}');
  } catch (e) {
    parsedReactions = {};
  }

  return {
    id: row.id,
    spaceId: 'couple-space-default',
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderAvatar: row.sender_avatar,
    text: row.text,
    imageUrl: row.image_url,
    replyToId: row.reply_to_id,
    replyToText: row.reply_to_text,
    replyToSender: row.reply_to_sender,
    reactions: parsedReactions,
    isRead: Boolean(row.is_read),
    isDelivered: Boolean(row.is_delivered),
    editedAt: row.edited_at,
    createdAt: row.created_at,
  };
}

function getAllMessages() {
  const rows = db.prepare('SELECT * FROM chat_messages ORDER BY created_at ASC').all();
  return rows.map(formatMessage);
}

// GET /api/chat/messages
chatRouter.get('/messages', requireAuth, (req, res) => {
  res.json(getAllMessages());
});

// POST /api/chat/messages
chatRouter.post('/messages', requireAuth, (req, res) => {
  const { text, imageUrl, replyToId, replyToText, replyToSender } = req.body;
  if (!text && !imageUrl) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  // Get user details
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const msgId = 'msg-' + randomUUID();
  const now = getNowISO();

  db.prepare(`
    INSERT INTO chat_messages (
      id, sender_id, sender_name, sender_avatar,
      text, image_url, reply_to_id, reply_to_text, reply_to_sender,
      reactions, is_read, is_delivered, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '{}', 0, 1, ?)
  `).run(
    msgId,
    req.user.id,
    user?.display_name || req.user.displayName,
    user?.avatar || '',
    text || '',
    imageUrl || null,
    replyToId || null,
    replyToText || null,
    replyToSender || null,
    now
  );

  const allMsgs = getAllMessages();
  broadcast('CHAT_UPDATED', allMsgs);

  const created = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(msgId);
  res.status(201).json(formatMessage(created));
});

// PUT /api/chat/messages/:id (edit)
chatRouter.put('/messages/:id', requireAuth, (req, res) => {
  const { text } = req.body;
  const msg = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found.' });

  if (msg.sender_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only edit your own messages.' });
  }

  const now = getNowISO();
  db.prepare('UPDATE chat_messages SET text = ?, edited_at = ? WHERE id = ?').run(text, now, req.params.id);

  const allMsgs = getAllMessages();
  broadcast('CHAT_UPDATED', allMsgs);

  res.json({ success: true });
});

// DELETE /api/chat/messages/:id
chatRouter.delete('/messages/:id', requireAuth, (req, res) => {
  const msg = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found.' });

  if (msg.sender_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only delete your own messages.' });
  }

  db.prepare('DELETE FROM chat_messages WHERE id = ?').run(req.params.id);

  const allMsgs = getAllMessages();
  broadcast('CHAT_UPDATED', allMsgs);

  res.json({ success: true });
});

// POST /api/chat/messages/:id/react
chatRouter.post('/messages/:id/react', requireAuth, (req, res) => {
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: 'Emoji is required.' });

  const msg = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found.' });

  let reactions = {};
  try {
    reactions = JSON.parse(msg.reactions || '{}');
  } catch (e) {
    reactions = {};
  }

  const userList = reactions[emoji] || [];
  if (userList.includes(req.user.id)) {
    // Remove reaction
    reactions[emoji] = userList.filter((u) => u !== req.user.id);
    if (reactions[emoji].length === 0) delete reactions[emoji];
  } else {
    // Add reaction
    reactions[emoji] = [...userList, req.user.id];
  }

  db.prepare('UPDATE chat_messages SET reactions = ? WHERE id = ?').run(
    JSON.stringify(reactions),
    req.params.id
  );

  const allMsgs = getAllMessages();
  broadcast('CHAT_UPDATED', allMsgs);

  res.json({ success: true, reactions });
});

// POST /api/chat/read (mark partner messages as read)
chatRouter.post('/read', requireAuth, (req, res) => {
  // Mark messages where sender_id != current user as read
  db.prepare('UPDATE chat_messages SET is_read = 1 WHERE sender_id != ? AND is_read = 0').run(req.user.id);

  const allMsgs = getAllMessages();
  broadcast('CHAT_UPDATED', allMsgs);

  res.json({ success: true });
});
