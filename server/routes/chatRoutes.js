import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, getNowISO } from '../db.js';
import { verifyToken } from '../auth.js';
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
    clientMessageId: row.client_message_id || undefined,
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
    status: 'sent',
  };
}

function getAllMessages() {
  const rows = db.prepare('SELECT * FROM chat_messages ORDER BY created_at ASC').all();
  return rows.map(formatMessage);
}

function getOptionalUser(req) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }
  return token ? verifyToken(token) : null;
}

// GET /api/chat/messages -> Load canonical conversation history from SQLite
chatRouter.get('/messages', (req, res) => {
  res.json(getAllMessages());
});

// POST /api/chat/messages -> Save message directly to SQLite before broadcasting
chatRouter.post('/messages', (req, res) => {
  const { text, imageUrl, replyToId, replyToText, replyToSender, senderId, senderName, senderAvatar, clientMessageId } = req.body;
  if (!text && !imageUrl) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  // Idempotency check: if clientMessageId was already saved (e.g. retry after network timeout), return existing
  if (clientMessageId) {
    const existing = db.prepare('SELECT * FROM chat_messages WHERE client_message_id = ?').get(clientMessageId);
    if (existing) {
      return res.status(200).json(formatMessage(existing));
    }
  }

  const user = getOptionalUser(req);
  const dbUser = user ? db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) : null;

  const actualSenderId = dbUser?.id || user?.id || senderId || 'partner-1';
  const actualSenderName = dbUser?.display_name || user?.displayName || senderName || 'Ayush';
  const actualSenderAvatar = dbUser?.avatar || senderAvatar || '';

  const msgId = 'msg-' + randomUUID();
  const now = getNowISO();

  try {
    db.prepare(`
      INSERT INTO chat_messages (
        id, client_message_id, sender_id, sender_name, sender_avatar,
        text, image_url, reply_to_id, reply_to_text, reply_to_sender,
        reactions, is_read, is_delivered, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '{}', 0, 1, ?)
    `).run(
      msgId,
      clientMessageId || null,
      actualSenderId,
      actualSenderName,
      actualSenderAvatar,
      text || '',
      imageUrl || null,
      replyToId || null,
      replyToText || null,
      replyToSender || null,
      now
    );
  } catch (err) {
    // If unique constraint race on client_message_id
    if (clientMessageId && err.message && err.message.includes('UNIQUE')) {
      const existing = db.prepare('SELECT * FROM chat_messages WHERE client_message_id = ?').get(clientMessageId);
      if (existing) {
        return res.status(200).json(formatMessage(existing));
      }
    }
    throw err;
  }

  const created = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(msgId);
  const formatted = formatMessage(created);

  // Broadcast canonical messages to all connected WebSockets immediately
  broadcast('CHAT_UPDATED', getAllMessages());

  // Acknowledge successful save to shared SQLite database with HTTP 201
  res.status(201).json(formatted);
});

// PUT /api/chat/messages/:id (edit message)
chatRouter.put('/messages/:id', (req, res) => {
  const { text } = req.body;
  const msg = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found.' });

  const now = getNowISO();
  db.prepare('UPDATE chat_messages SET text = ?, edited_at = ? WHERE id = ?').run(text, now, req.params.id);

  const updated = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(req.params.id);
  broadcast('CHAT_UPDATED', getAllMessages());
  res.json(formatMessage(updated));
});

// DELETE /api/chat/messages/:id (delete message)
chatRouter.delete('/messages/:id', (req, res) => {
  const msg = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found.' });

  db.prepare('DELETE FROM chat_messages WHERE id = ?').run(req.params.id);
  broadcast('CHAT_UPDATED', getAllMessages());
  res.json({ success: true, id: req.params.id });
});

// POST /api/chat/messages/:id/react (toggle emoji reaction)
chatRouter.post('/messages/:id/react', (req, res) => {
  const { emoji, userId: bodyUserId } = req.body;
  if (!emoji) return res.status(400).json({ error: 'Emoji is required.' });

  const user = getOptionalUser(req);
  const userId = user?.id || bodyUserId || 'partner-1';

  const msg = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found.' });

  let reactions = {};
  try {
    reactions = JSON.parse(msg.reactions || '{}');
  } catch {
    reactions = {};
  }

  const userList = reactions[emoji] ? [...reactions[emoji]] : [];
  if (userList.includes(userId)) {
    reactions[emoji] = userList.filter((id) => id !== userId);
    if (reactions[emoji].length === 0) delete reactions[emoji];
  } else {
    reactions[emoji] = [...userList, userId];
  }

  db.prepare('UPDATE chat_messages SET reactions = ? WHERE id = ?').run(JSON.stringify(reactions), req.params.id);

  const updated = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(req.params.id);
  broadcast('CHAT_UPDATED', getAllMessages());
  res.json(formatMessage(updated));
});

// POST /api/chat/read (mark messages as read)
chatRouter.post('/read', (req, res) => {
  const user = getOptionalUser(req);
  const readerId = user?.id || req.body?.readerId || 'partner-2';

  const result = db.prepare('UPDATE chat_messages SET is_read = 1 WHERE sender_id != ? AND is_read = 0').run(readerId);
  // Only broadcast if rows actually changed, preventing infinite read-broadcast storms
  if (result.changes > 0) {
    broadcast('CHAT_UPDATED', getAllMessages());
  }
  res.json({ success: true, updated: result.changes });
});
