import { Router } from 'express';
import { db, getNowISO } from '../db.js';
import { requireAuth } from '../auth.js';
import { broadcast } from '../websocket.js';

export const gameRouter = Router();

// GET /api/games/session/:id
gameRouter.get('/session/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM game_sessions WHERE session_id = ?').get(req.params.id);
  if (!row) {
    return res.json({ state: null });
  }

  try {
    const parsedState = JSON.parse(row.state);
    res.json({
      sessionId: row.session_id,
      gameTitle: row.game_title,
      state: parsedState,
      updatedBy: row.updated_by,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    res.json({ state: null });
  }
});

// POST /api/games/session/:id -> Update session state & broadcast
gameRouter.post('/session/:id', requireAuth, (req, res) => {
  const sessionId = req.params.id;
  const { state, gameTitle } = req.body;
  const now = getNowISO();

  const stateStr = JSON.stringify(state);

  const existing = db.prepare('SELECT session_id FROM game_sessions WHERE session_id = ?').get(sessionId);
  if (existing) {
    db.prepare(`
      UPDATE game_sessions
      SET state = ?, game_title = COALESCE(?, game_title), updated_by = ?, updated_at = ?
      WHERE session_id = ?
    `).run(stateStr, gameTitle || null, req.user.id, now, sessionId);
  } else {
    db.prepare(`
      INSERT INTO game_sessions (session_id, game_title, state, updated_by, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, gameTitle || 'Co-op Game', stateStr, req.user.id, now);
  }

  // Broadcast to partner in real time
  broadcast('GAME_UPDATED', {
    sessionId,
    gameTitle,
    payload: state,
    updatedBy: req.user.id,
  });

  res.json({ success: true, sessionId, state });
});
