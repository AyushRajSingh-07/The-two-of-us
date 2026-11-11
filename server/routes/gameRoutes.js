import { Router } from 'express';
import { db, getNowISO } from '../db.js';
import { verifyToken } from '../auth.js';
import { broadcast } from '../websocket.js';

export const gameRouter = Router();

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

// GET /api/games/session/:id -> Load saved game session state
gameRouter.get('/session/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM game_sessions WHERE session_id = ?').get(req.params.id);
  if (!row) {
    return res.json({ state: null, data: null });
  }

  try {
    const parsedState = JSON.parse(row.state);
    res.json({
      sessionId: row.session_id,
      gameId: row.game_title,
      gameTitle: row.game_title,
      state: parsedState,
      data: parsedState,
      updatedBy: row.updated_by,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    res.json({ state: null, data: null });
  }
});

// POST /api/games/session/:id -> Update session state & broadcast to partner
gameRouter.post('/session/:id', (req, res) => {
  const sessionId = req.params.id;
  const { state, data, gameTitle, gameId, updatedBy } = req.body;
  const now = getNowISO();

  const user = getOptionalUser(req);
  const actualUserId = user?.id || updatedBy || 'partner-1';

  const rawState = state !== undefined ? state : data;
  const actualGameTitle = gameTitle || gameId || 'Co-op Game';
  const stateStr = JSON.stringify(rawState);

  const existing = db.prepare('SELECT session_id FROM game_sessions WHERE session_id = ?').get(sessionId);
  if (existing) {
    db.prepare(`
      UPDATE game_sessions
      SET state = ?, game_title = COALESCE(?, game_title), updated_by = ?, updated_at = ?
      WHERE session_id = ?
    `).run(stateStr, actualGameTitle, actualUserId, now, sessionId);
  } else {
    db.prepare(`
      INSERT INTO game_sessions (session_id, game_title, state, updated_by, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, actualGameTitle, stateStr, actualUserId, now);
  }

  const broadcastPayload = {
    sessionId,
    gameId: actualGameTitle,
    gameTitle: actualGameTitle,
    data: rawState,
    payload: rawState,
    state: rawState,
    updatedBy: actualUserId,
    updatedAt: now,
  };

  // Broadcast to partner in real time
  broadcast('GAME_UPDATED', broadcastPayload);

  res.json({
    success: true,
    sessionId,
    gameId: actualGameTitle,
    gameTitle: actualGameTitle,
    data: rawState,
    state: rawState,
  });
});
