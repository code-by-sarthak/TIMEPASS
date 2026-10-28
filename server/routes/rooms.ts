import { Router, Request, Response } from 'express';
import { customRoomManager } from '../rooms';

const router = Router();

// List all 8-member custom rooms
router.get('/', (req: Request, res: Response) => {
  const rooms = customRoomManager.getAllRooms();
  res.json({ success: true, rooms });
});

// Get details of a specific room
router.get('/:id', (req: Request, res: Response) => {
  const room = customRoomManager.getRoom(req.params.id);
  if (!room) {
    return res.status(404).json({ success: false, error: 'Room not found' });
  }

  res.json({
    success: true,
    room: {
      id: room.id,
      name: room.name,
      category: room.category,
      description: room.description,
      hostName: room.hostName,
      memberCount: room.members.size,
      maxMembers: room.maxMembers,
      isPrivate: room.isPrivate,
      nowPlayingTrackId: room.nowPlayingTrackId,
      createdAt: room.createdAt,
      members: Array.from(room.members.values()).map(m => ({
        userId: m.userId,
        displayName: m.displayName,
        avatarUrl: m.avatarUrl,
        gender: m.gender,
        region: m.region,
        isHost: m.isHost,
        isMuted: m.isMuted,
        isVideoOff: m.isVideoOff,
      }))
    }
  });
});

// Create an 8-member custom room
router.post('/create', (req: Request, res: Response) => {
  const { name, category, description, hostId, hostName, isPrivate, passcode, maxMembers } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Room name is required' });
  }

  const validCategories = ['Gaming', 'Music', 'Hangout', 'Movies', 'Tech'];
  const cat = validCategories.includes(category) ? category : 'Hangout';

  const room = customRoomManager.createRoom({
    name: name.trim(),
    category: cat as 'Gaming' | 'Music' | 'Hangout' | 'Movies' | 'Tech',
    description: description?.trim() || `Join ${name.trim()} for awesome conversations!`,
    hostId: hostId || `host_${Date.now()}`,
    hostName: hostName || 'Host',
    isPrivate: !!isPrivate,
    passcode: passcode?.trim(),
    maxMembers: 8 // Strictly max 8 members!
  });

  res.json({
    success: true,
    room: {
      id: room.id,
      name: room.name,
      category: room.category,
      description: room.description,
      inviteUrl: `/rooms/${room.id}`
    }
  });
});

export default router;
