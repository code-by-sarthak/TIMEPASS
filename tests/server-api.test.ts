import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import cors from 'cors';
import authRoutes from '../server/routes/auth';
import profileRoutes from '../server/routes/profile';
import adminRoutes from '../server/routes/admin';
import { setupSignaling } from '../server/signaling';

describe('TIMEPASS End-to-End Server API & Signaling', () => {
  let server: http.Server;
  let testPort: number;
  let clientSocket1: ClientSocketType;
  let clientSocket2: ClientSocketType;

  beforeAll(async () => {
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.use('/api/auth', authRoutes);
    app.use('/api/profile', profileRoutes);
    app.use('/api/admin', adminRoutes);
    app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

    server = http.createServer(app);
    const io = new SocketIOServer(server, { cors: { origin: '*' } });
    setupSignaling(io);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          testPort = address.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (clientSocket1) clientSocket1.disconnect();
    if (clientSocket2) clientSocket2.disconnect();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('GET /api/health should return status ok', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/health`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.status).toBe('ok');
  });

  it('POST /api/auth/guest creates an instant guest profile and JWT', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: 'GuestRider',
        interests: ['Gaming', 'Coding'],
        country: 'Canada'
      })
    });

    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    expect(data.user.displayName).toBe('GuestRider');
    expect(data.user.isGuest).toBe(true);
  });

  it('POST /api/auth/otp/send and /verify works correctly', async () => {
    const phone = '+19998887777';
    const sendRes = await fetch(`http://localhost:${testPort}/api/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    expect(sendRes.ok).toBe(true);
    const sendData = await sendRes.json();
    expect(sendData.success).toBe(true);
    expect(sendData.devCode).toBeDefined();

    // Verify OTP
    const verifyRes = await fetch(`http://localhost:${testPort}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        code: sendData.devCode,
        displayName: 'PhoneHero'
      })
    });
    expect(verifyRes.ok).toBe(true);
    const verifyData = await verifyRes.json();
    expect(verifyData.success).toBe(true);
    expect(verifyData.token).toBeDefined();
    expect(verifyData.user.displayName).toBe('PhoneHero');
  });

  it('GET /api/admin/stats returns accurate real-time metrics with admin key', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/admin/stats`, {
      headers: { 'x-admin-key': 'admin123' }
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.totalUsers).toBeGreaterThan(0);
    expect(data.totalReports).toBeGreaterThanOrEqual(0);
  });

  it('Socket.IO pairs two clients in video queue', async () => {
    const socketUrl = `http://localhost:${testPort}`;

    clientSocket1 = ClientSocket(socketUrl, { transports: ['websocket'] });
    clientSocket2 = ClientSocket(socketUrl, { transports: ['websocket'] });

    await new Promise<void>((resolve) => {
      let connected = 0;
      const check = () => {
        connected++;
        if (connected === 2) resolve();
      };
      clientSocket1.on('connect', check);
      clientSocket2.on('connect', check);
    });

    // Client 1 joins queue
    const matchPromise1 = new Promise<any>((resolve) => {
      clientSocket1.on('match-found', (data) => resolve(data));
    });

    const matchPromise2 = new Promise<any>((resolve) => {
      clientSocket2.on('match-found', (data) => resolve(data));
    });

    clientSocket1.emit('join-queue', {
      mode: 'video',
      userId: 'test_user_a',
      displayName: 'Alice In Test',
      interests: ['Gaming'],
      languages: ['English']
    });

    clientSocket2.emit('join-queue', {
      mode: 'video',
      userId: 'test_user_b',
      displayName: 'Bob In Test',
      interests: ['Gaming'],
      languages: ['English']
    });

    const [match1, match2] = await Promise.all([matchPromise1, matchPromise2]);

    expect(match1.roomId).toBe(match2.roomId);
    expect(match1.partner.displayName).toBe('Bob In Test');
    expect(match2.partner.displayName).toBe('Alice In Test');
    expect(match1.initiator !== match2.initiator).toBe(true);
  });
});
