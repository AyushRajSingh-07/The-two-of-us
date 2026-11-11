import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from './auth.js';

let wss = null;
const clients = new Map(); // ws -> { userId, username }

export function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/api/ws' });

  wss.on('connection', (ws, req) => {
    // Check token from query param ?token=...
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    let user = null;
    if (token) {
      user = verifyToken(token);
    }

    if (user) {
      clients.set(ws, user);
      ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', payload: { user } }));
      // Notify partner that partner is online
      broadcast('PARTNER_STATUS', { userId: user.id, online: true }, ws);
    }

    // Ping / Pong for keeping connection alive through ngrok
    ws.isAlive = true;
    ws.missedPings = 0;
    ws.on('pong', () => {
      ws.isAlive = true;
      ws.missedPings = 0;
    });

    ws.on('message', (data) => {
      try {
        ws.isAlive = true;
        ws.missedPings = 0;
        const msg = JSON.parse(data.toString());

        // Application-level Heartbeat
        if (msg.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          return;
        }

        if (msg.type === 'AUTH') {
          const authUser = verifyToken(msg.token);
          if (authUser) {
            clients.set(ws, authUser);
            ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', payload: { user: authUser } }));
            broadcast('PARTNER_STATUS', { userId: authUser.id, online: true }, ws);
          } else {
            ws.send(JSON.stringify({ type: 'AUTH_ERROR', error: 'Invalid token' }));
          }
        } else if (msg.type === 'TYPING_STATUS') {
          const clientUser = clients.get(ws);
          if (clientUser) {
            broadcast('TYPING_STATUS', { userId: clientUser.id, isTyping: Boolean(msg.isTyping) }, ws);
          }
        } else if (msg.type === 'GAME_MOVE') {
          // Fast relay for real-time game moves
          broadcast('GAME_MOVE', msg.payload, ws);
        }
      } catch (err) {
        console.error('[WS] Message error:', err);
      }
    });

    ws.on('close', () => {
      const clientUser = clients.get(ws);
      if (clientUser) {
        clients.delete(ws);
        broadcast('PARTNER_STATUS', { userId: clientUser.id, online: false });
      }
    });

    ws.on('error', (err) => {
      console.error('[WS] Socket error:', err.message);
    });
  });

  // Gentle keepalive interval every 30s with missed pings tolerance
  const interval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      ws.missedPings = (ws.missedPings || 0) + 1;
      // Allow 3 missed pings (90 seconds of total silence) before terminating
      if (ws.missedPings > 3) {
        return ws.terminate();
      }
      try {
        ws.ping();
      } catch {}
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('[WS] WebSocket server initialized on /api/ws');
}

export function broadcast(type, payload, excludeSocket = null) {
  if (!wss) return;
  const msg = JSON.stringify({ type, payload });
  wss.clients.forEach((client) => {
    if (client !== excludeSocket && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}
