import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import adminRoutes from './routes/admin';
import roomRoutes from './routes/rooms';
import { setupSignaling, getLiveStatus } from './signaling';

dotenv.config();

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: '.' });
const handle = app.getRequestHandler();

async function startServer() {
  await app.prepare();

  const expressApp = express();
  const server = http.createServer(expressApp);

  // Enable CORS & JSON parsing & static assets
  expressApp.use(cors());
  expressApp.use(express.json());
  expressApp.use(express.static('public'));

  // Attach API routes
  expressApp.use('/api/auth', authRoutes);
  expressApp.use('/api/profile', profileRoutes);
  expressApp.use('/api/admin', adminRoutes);
  expressApp.use('/api/rooms', roomRoutes);

  // Live real data endpoint
  expressApp.get('/api/live-status', (req, res) => {
    res.json(getLiveStatus());
  });

  // Health check endpoint
  expressApp.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'TIMEPASS Real-Time Video & Chat Platform',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Attach Socket.IO to the same HTTP server
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Initialize signaling & matchmaking socket events
  setupSignaling(io);

  // Delegate all other routes to Next.js handler
  expressApp.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 TIMEPASS platform is LIVE on http://localhost:${port}`);
    console.log(`📡 WebRTC Signaling & Socket.IO active`);
    console.log(`🛡️  Admin Dashboard available at /admin (Protected by Master Password)`);
    console.log(`======================================================\n`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start TIMEPASS server:', err);
  process.exit(1);
});
