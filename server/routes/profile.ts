import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'timepass_jwt_production_secret_key_needs_to_be_long_and_secure_64chars';

// Middleware to extract user ID from JWT
function authMiddleware(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    (req as Request & { user: { userId: string; role: string } }).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// 1. Update Profile & Preferences
router.post('/update', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user: { userId: string } }).user.userId;
    const { displayName, avatarUrl, bio, country, languages, interests, preferredChatMode, theme } = req.body;

    // Update user display name & avatar if provided
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName && { displayName: displayName.trim() }),
        ...(avatarUrl && { avatarUrl }),
      }
    });

    // Upsert user profile
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        ...(bio !== undefined && { bio }),
        ...(country && { country }),
        ...(languages && { languages: Array.isArray(languages) ? languages.join(',') : languages }),
        ...(interests && { interests: Array.isArray(interests) ? interests.join(',') : interests }),
        ...(preferredChatMode && { preferredChatMode }),
        ...(theme && { theme }),
      },
      create: {
        userId,
        bio: bio || '',
        country: country || 'Global',
        languages: Array.isArray(languages) ? languages.join(',') : (languages || 'English'),
        interests: Array.isArray(interests) ? interests.join(',') : (interests || 'Gaming,Music'),
        preferredChatMode: preferredChatMode || 'video',
        theme: theme || 'dark',
      }
    });

    res.json({ success: true, profile });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 2. Get Blocked Users
router.get('/blocks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user: { userId: string } }).user.userId;

    const blocks = await prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: { id: true, username: true, displayName: true, avatarUrl: true }
        }
      }
    });

    res.json({ blocks: blocks.map(b => b.blocked) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch block list' });
  }
});

// 3. Unblock User
router.delete('/blocks/:blockedId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user: { userId: string } }).user.userId;
    const { blockedId } = req.params;

    await prisma.block.deleteMany({
      where: {
        blockerId: userId,
        blockedId
      }
    });

    res.json({ success: true, message: 'User unblocked' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

// 4. Friends List & Friend Requests
router.get('/friends', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user: { userId: string } }).user.userId;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        user1: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        user2: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
      }
    });

    const friends = friendships.map(f => {
      return f.user1Id === userId ? f.user2 : f.user1;
    });

    res.json({ friends });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// 5. Add Friend
router.post('/friends/add', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user: { userId: string } }).user.userId;
    const { friendUserId } = req.body;

    if (!friendUserId || friendUserId === userId) {
      return res.status(400).json({ error: 'Invalid friend user ID' });
    }

    // Check if user exists
    const friend = await prisma.user.findUnique({
      where: { id: friendUserId }
    });

    if (!friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Upsert friendship
    await prisma.friendship.upsert({
      where: {
        user1Id_user2Id: {
          user1Id: userId < friendUserId ? userId : friendUserId,
          user2Id: userId < friendUserId ? friendUserId : userId
        }
      },
      update: { status: 'ACCEPTED' },
      create: {
        user1Id: userId < friendUserId ? userId : friendUserId,
        user2Id: userId < friendUserId ? friendUserId : userId,
        status: 'ACCEPTED'
      }
    });

    res.json({ success: true, message: 'Friend added successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add friend' });
  }
});

// 6. Recent Conversation History (Opt-in)
router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user: { userId: string } }).user.userId;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }]
      },
      orderBy: { startedAt: 'desc' },
      take: 10,
      include: {
        user1: { select: { id: true, displayName: true, avatarUrl: true } },
        user2: { select: { id: true, displayName: true, avatarUrl: true } },
      }
    });

    const formatted = conversations.map(c => {
      const partner = c.user1Id === userId ? c.user2 : c.user1;
      return {
        id: c.id,
        mode: c.mode,
        startedAt: c.startedAt,
        durationSeconds: c.durationSeconds,
        partner
      };
    });

    res.json({ conversations: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation history' });
  }
});

export default router;
