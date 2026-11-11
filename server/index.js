import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import cors from 'cors';
import { initDatabase } from './db.js';
import { initWebSocket } from './websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

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
        /\.ngrok-free\.dev$/,
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

// Serve built frontend assets if dist folder exists
if (fs.existsSync(distPath)) {
  app.use('/The-two-of-us', express.static(distPath));
  app.use(express.static(distPath));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    sanctuary: 'Two of Us Backend',
    timezone: 'Asia/Kolkata',
    timestamp: new Date().toISOString(),
  });
});

// Root friendly welcome & direct launcher to the frontend
app.get('/', (req, res) => {
  const githubPagesUrl = 'https://ayushrajsingh-07.github.io/The-two-of-us/';
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Two of Us • Private Sanctuary Backend</title>
        <meta http-equiv="refresh" content="3;url=${githubPagesUrl}">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #fff5f7 0%, #faf6f0 50%, #f7f1fc 100%);
            color: #2e2633;
          }
          .card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(244, 63, 94, 0.2);
            border-radius: 28px;
            padding: 40px 32px;
            max-width: 480px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 40px -15px rgba(225, 29, 72, 0.15);
          }
          .heart {
            font-size: 48px;
            animation: pulse 1.5s infinite;
            display: inline-block;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
          }
          h1 {
            color: #e11d48;
            font-size: 24px;
            margin: 16px 0 8px;
            font-weight: 800;
          }
          p {
            color: #645766;
            font-size: 14px;
            line-height: 1.6;
            margin: 8px 0 24px;
          }
          .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            background: #ecfdf5;
            color: #047857;
            border: 1px solid #a7f3d0;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 24px;
          }
          .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10b981;
          }
          .btn {
            display: block;
            width: 100%;
            box-sizing: border-box;
            background: linear-gradient(135deg, #e11d48, #be123c);
            color: white;
            text-decoration: none;
            padding: 14px 24px;
            border-radius: 16px;
            font-weight: 700;
            font-size: 15px;
            box-shadow: 0 8px 20px -4px rgba(225, 29, 72, 0.35);
            transition: all 0.2s ease;
          }
          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px -4px rgba(225, 29, 72, 0.45);
          }
          .hint {
            font-size: 12px;
            color: #9c8e9f;
            margin-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="heart">💕</div>
          <h1>Two of Us • Sanctuary Server</h1>
          <div class="status-badge">
            <span class="dot"></span>
            <span>Backend Online & Synced (Asia/Kolkata)</span>
          </div>
          <p>
            Your private backend API and real-time WebSocket server are active and listening for <strong>Ayush & Vrishti</strong>!
          </p>
          <a href="${githubPagesUrl}" class="btn">
            👉 Enter Couples' Sanctuary App
          </a>
          <div class="hint">
            Redirecting automatically to the live application in 3 seconds...
          </div>
        </div>
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

