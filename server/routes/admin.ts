import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { matchmaker } from '../matchmaker';
import { customRoomManager } from '../rooms';
import { 
  broadcastSystemAnnouncement, 
  adminKickSocket, 
  adminTerminateRoom, 
  getActiveSocketsList 
} from '../signaling';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'timepass_jwt_production_secret_key_needs_to_be_long_and_secure_64chars';
const getAdminKey = () => process.env.ADMIN_SECRET_KEY || '8299435591';

// Admin / Moderator Auth Middleware
async function adminMiddleware(req: Request, res: Response, next: () => void) {
  // Allow secret key header, query param, or body key for smooth authentication
  const secretKey = (req.headers['x-admin-key'] as string) || (req.query.key as string) || req.body?.adminKey;
  if (secretKey === getAdminKey()) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin authorization required' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

    if (decoded.role !== 'ADMIN' && decoded.role !== 'MODERATOR') {
      return res.status(403).json({ error: 'Access denied: Requires administrator privileges' });
    }

    (req as Request & { user: { userId: string; role: string } }).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid admin token' });
  }
}

// 1. Live Admin Analytics & Health Metrics
router.get('/stats', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const liveStats = matchmaker.getStats();

    const [totalUsers, totalReports, pendingReports, bannedUsers, totalConversations] = await Promise.all([
      prisma.user.count(),
      prisma.report.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.conversation.count()
    ]);

    res.json({
      activeOnline: liveStats.activeVideoCalls * 2 + liveStats.activeTextChats * 2 + liveStats.queueVideo + liveStats.queueText,
      activeVideoCalls: liveStats.activeVideoCalls,
      activeTextChats: liveStats.activeTextChats,
      queueVideo: liveStats.queueVideo,
      queueText: liveStats.queueText,
      totalUsers,
      totalReports,
      pendingReports,
      bannedUsers,
      totalConversations,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// 2. Moderation Reports List
router.get('/reports', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;

    const reports = await prisma.report.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        reporter: {
          select: { id: true, username: true, displayName: true, email: true }
        },
        reportedUser: {
          select: { id: true, username: true, displayName: true, email: true, isBanned: true, banReason: true }
        }
      }
    });

    const formatted = reports.map(r => ({
      id: r.id,
      reporterId: r.reporterId,
      reporterName: r.reporter.displayName,
      reportedUserId: r.reportedUserId,
      reportedUserName: r.reportedUser.displayName,
      reportedUserEmail: r.reportedUser.email,
      reportedUserBanned: r.reportedUser.isBanned,
      reason: r.reason,
      details: r.details,
      status: r.status,
      actionTaken: r.actionTaken,
      adminNotes: r.adminNotes,
      createdAt: r.createdAt.toISOString(),
      resolvedAt: r.resolvedAt?.toISOString(),
    }));

    res.json({ reports: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// 3. Take Moderation Action (Warn, Suspend, Ban, Dismiss)
router.post('/action', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { reportId, targetUserId, action, reason, notes } = req.body;

    if (!targetUserId || !action) {
      return res.status(400).json({ error: 'targetUserId and action are required' });
    }

    let bannedUntil: Date | null = null;
    let isBanned = false;

    if (action === 'BAN') {
      isBanned = true;
    } else if (action === 'SUSPEND_24H') {
      isBanned = true;
      bannedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (action === 'SUSPEND_7D') {
      isBanned = true;
      bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else if (action === 'UNBAN') {
      isBanned = false;
      bannedUntil = null;
    }

    // Update target user
    if (['BAN', 'SUSPEND_24H', 'SUSPEND_7D', 'UNBAN'].includes(action)) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          isBanned,
          bannedUntil,
          banReason: isBanned ? (reason || 'Violation of TIMEPASS Community Guidelines') : null
        }
      });
    }

    // Update report if reportId was provided
    if (reportId) {
      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED',
          actionTaken: action,
          adminNotes: notes || reason,
          resolvedAt: new Date(),
        }
      });
    }

    // Log moderation action
    await prisma.moderationLog.create({
      data: {
        adminId: (req as Request & { user?: { userId: string } }).user?.userId || 'admin_console',
        targetUserId,
        action,
        reason: reason || action,
      }
    });

    res.json({ success: true, message: `Action ${action} executed successfully` });
  } catch (err) {
    console.error('Moderation action error:', err);
    res.status(500).json({ error: 'Failed to execute moderation action' });
  }
});

// 4. List Users & Ban Management
router.get('/users', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        isGuest: true,
        isBanned: true,
        bannedUntil: true,
        banReason: true,
        createdAt: true,
        profile: {
          select: { country: true, languages: true, interests: true }
        }
      }
    });

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 5. Global System Announcement Broadcast
router.post('/broadcast', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Announcement message is required' });
    }

    const sent = broadcastSystemAnnouncement(title || 'Admin Announcement', message.trim());
    res.json({ success: sent, message: 'Announcement broadcasted to all active users' });
  } catch (err) {
    console.error('Broadcast error:', err);
    res.status(500).json({ error: 'Failed to send broadcast announcement' });
  }
});

// 6. Live Active 8-Member Custom Rooms Directory
router.get('/rooms', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const rooms = customRoomManager.getRoomsDetailed();
    res.json({ rooms });
  } catch (err) {
    console.error('Fetch rooms error:', err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// 7. Force Terminate/Close Active Room
router.post('/rooms/close', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { roomId, reason } = req.body;
    if (!roomId) {
      return res.status(400).json({ error: 'roomId is required' });
    }

    const terminated = adminTerminateRoom(roomId, reason || 'Room terminated by Administrator');
    res.json({ success: terminated, message: `Room ${roomId} closed successfully` });
  } catch (err) {
    console.error('Terminate room error:', err);
    res.status(500).json({ error: 'Failed to terminate room' });
  }
});

// 8. Live Active Connected Sockets
router.get('/active-sockets', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const activeSockets = getActiveSocketsList();
    res.json({ activeSockets });
  } catch (err) {
    console.error('Active sockets error:', err);
    res.status(500).json({ error: 'Failed to fetch active sockets' });
  }
});

// 9. Force Kick Connected User Socket
router.post('/users/kick', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { socketId, reason } = req.body;
    if (!socketId) {
      return res.status(400).json({ error: 'socketId is required' });
    }

    const kicked = adminKickSocket(socketId, reason || 'Kicked by administrator');
    res.json({ success: kicked, message: kicked ? 'User kicked from server' : 'Socket not found' });
  } catch (err) {
    console.error('Kick user error:', err);
    res.status(500).json({ error: 'Failed to kick user' });
  }
});

export default router;
