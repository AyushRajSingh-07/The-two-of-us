import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In-memory sync store for cross-device local Wi-Fi testing (phone + PC)
const memorySyncStore: Record<string, any> = {};

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'local-cross-device-sync-bridge',
      configureServer(server) {
        // SSE (Server-Sent Events) endpoint for real-time cross-device sync
        const sseClients: Record<string, any[]> = {};

        server.middlewares.use('/api/sync/stream', (req, res) => {
          const url = new URL(req.url || '', `http://${req.headers.host}`);
          const sessionId = url.searchParams.get('sessionId') || 'default';

          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });
          res.write(`data: ${JSON.stringify({ type: 'CONNECTED', sessionId })}\n\n`);

          if (!sseClients[sessionId]) sseClients[sessionId] = [];
          sseClients[sessionId].push(res);

          req.on('close', () => {
            sseClients[sessionId] = sseClients[sessionId].filter((c) => c !== res);
          });
        });

        // POST/GET session state
        server.middlewares.use('/api/sync/session', (req, res) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
          }

          const url = new URL(req.url || '', `http://${req.headers.host}`);
          const sessionId = url.searchParams.get('sessionId') || 'default';

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => (body += chunk));
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                memorySyncStore[sessionId] = parsed;

                // Broadcast to all connected devices (phones & PCs)
                if (sseClients[sessionId]) {
                  const sseMsg = `data: ${JSON.stringify({ type: 'GAME_UPDATED', payload: parsed })}\n\n`;
                  sseClients[sessionId].forEach((client) => client.write(sseMsg));
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
              } catch (err: any) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          } else {
            // GET
            const data = memorySyncStore[sessionId] || null;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ data }));
          }
        });
      },
    },
  ],
  server: {
    port: 5173,
    host: true, // Listens on all local IP addresses (0.0.0.0) so phone can connect via Wi-Fi!
  },
});
