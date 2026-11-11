import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import cors from 'cors';
import { initDatabase } from './db.js';
import { initWebSocket } from './websocket.js';

import { authRouter } from './routes/authRoutes.js';
import { coupleRouter } from './routes/coupleRoutes.js';
import { checkinRouter } from './routes/checkinRoutes.js';
import { chatRouter } from './routes/chatRoutes.js';
import { photoRouter } from './routes/photoRoutes.js';
import { gameRouter } from './routes/gameRoutes.js';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;

// CORS configuration: supports GitHub Pages live site, ngrok tunnels, and local testing
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const allowedPatterns = [
        /^https:\/\/ayushrajsingh-07\.github\.io/,
        /^http:\/\/localhost:\d+/,
        /^http:\/\/127\.0\.0\.1:\d+/,
        /\.ngrok-free\.app$/,
        /\.ngrok\.io$/,
        /\.ngrok\.app$/,
      ];

      const isAllowed = allowedPatterns.some((pattern) => pattern.test(origin));
      if (isAllowed) {
        return callback(null, true);
      }
      // If user provided custom CORS origins in env
      if (process.env.CORS_ORIGIN) {
        const customOrigins = process.env.CORS_ORIGIN.split(',').map((s) => s.trim());
        if (customOrigins.includes(origin)) return callback(null, true);
      }

      // Default allow for seamless pairing
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning'],
  })
);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize SQLite database
initDatabase();

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/couple', coupleRouter);
app.use('/api/checkin', checkinRouter);
app.use('/api/chat', chatRouter);
app.use('/api/photos', photoRouter);
app.use('/api/games', gameRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    sanctuary: 'Two of Us Backend',
    timezone: 'Asia/Kolkata',
    timestamp: new Date().toISOString(),
  });
});

// Root friendly welcome
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Two of Us • Sanctuary Server</title></head>
      <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #faf7f5; color: #4a3b45;">
        <h1 style="color: #e11d48; margin-bottom: 8px;">💕 Two of Us • Private Sanctuary Backend</h1>
        <p style="color: #71626f;">Server is running and listening for Ayush & Vrishti!</p>
        <p style="font-size: 13px; color: #9f8c9d;">Status: <strong>Online</strong> • Timezone: <strong>Asia/Kolkata</strong></p>
      </body>
    </html>
  `);
});

// Initialize WebSocket server on same HTTP port
initWebSocket(server);

if (process.env.NODE_ENV !== 'test_export_only') {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`  💕 TWO OF US • SANCTUARY BACKEND ACTIVE`);
    console.log(`  Local URL:        http://localhost:${PORT}`);
    console.log(`  Local Network:    http://0.0.0.0:${PORT}`);
    console.log(`  WebSocket:        ws://localhost:${PORT}/api/ws`);
    console.log(`  Health Check:     http://localhost:${PORT}/api/health`);
    console.log(`======================================================`);
    console.log(`  To connect with ngrok, run in your terminal:`);
    console.log(`  > ngrok http ${PORT}`);
    console.log(`======================================================\n`);
  });
}

export { app, server };

