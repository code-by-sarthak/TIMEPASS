import { QueuedUser, ActiveRoom } from '../src/lib/types';
import { prisma } from './db';

export class Matchmaker {
  private videoQueue: Map<string, QueuedUser> = new Map();
  private textQueue: Map<string, QueuedUser> = new Map();
  private activeRooms: Map<string, ActiveRoom> = new Map();
  private socketToRoom: Map<string, string> = new Map();

  // Add user to the queue and immediately attempt to find the best match
  public async enqueue(user: QueuedUser): Promise<{ matched: boolean; room?: ActiveRoom; partner?: QueuedUser } | null> {
    // Prevent occupying multiple slots in either queue
    this.dequeue(user.socketId);

    const queue = user.mode === 'video' ? this.videoQueue : this.textQueue;

    // Load blocked user IDs from database for accurate safety enforcement
    try {
      const blocks = await prisma.block.findMany({
        where: {
          OR: [
            { blockerId: user.userId },
            { blockedId: user.userId }
          ]
        },
        select: { blockerId: true, blockedId: true }
      });

      const blockedIds = new Set<string>(user.blockedUserIds || []);
      blocks.forEach(b => {
        blockedIds.add(b.blockerId === user.userId ? b.blockedId : b.blockerId);
      });
      user.blockedUserIds = Array.from(blockedIds);
    } catch (err) {
      console.warn('Could not load block list during enqueue:', err);
    }

    // Find best match in the queue
    let bestCandidate: QueuedUser | null = null;
    let highestScore = -1;

    for (const [, candidate] of queue) {
      // 1. Exclude the exact same user or socket
      if (candidate.socketId === user.socketId || candidate.userId === user.userId) {
        continue;
      }

      // 2. Exclude immediate previous conversation partner (avoids instant loop on NEXT)
      if (user.previousPartnerId && candidate.userId === user.previousPartnerId) {
        continue;
      }
      if (candidate.previousPartnerId && candidate.previousPartnerId === user.userId) {
        continue;
      }

      // 3. Exclude blocked users (either party blocked the other)
      if (user.blockedUserIds.includes(candidate.userId) || candidate.blockedUserIds.includes(user.userId)) {
        continue;
      }

      // 4. Score matching candidate:
      // - Language match: +20 points
      // - Shared interests: +10 points each
      // - Waiting time boost: +1 point per 3 seconds waiting (prevents starvation)
      let score = 0;

      // Language match
      const commonLangs = user.languages.filter(l => candidate.languages.includes(l));
      if (commonLangs.length > 0 || user.languages.includes('Any') || candidate.languages.includes('Any')) {
        score += 20;
      }

      // Interests match
      const commonInterests = user.interests.filter(i => candidate.interests.includes(i));
      score += commonInterests.length * 10;

      // Starvation prevention
      const waitSeconds = Math.floor((Date.now() - candidate.joinedAt) / 3000);
      score += waitSeconds;

      if (score > highestScore) {
        highestScore = score;
        bestCandidate = candidate;
      }
    }

    // If an eligible partner is found, atomically match them!
    if (bestCandidate) {
      // Remove candidate from queue
      queue.delete(bestCandidate.socketId);

      const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const room: ActiveRoom = {
        roomId,
        mode: user.mode,
        user1: { socketId: user.socketId, userId: user.userId, displayName: user.displayName },
        user2: { socketId: bestCandidate.socketId, userId: bestCandidate.userId, displayName: bestCandidate.displayName },
        startedAt: Date.now(),
      };

      this.activeRooms.set(roomId, room);
      this.socketToRoom.set(user.socketId, roomId);
      this.socketToRoom.set(bestCandidate.socketId, roomId);

      return { matched: true, room, partner: bestCandidate };
    }

    // No match right now, insert user into queue
    queue.set(user.socketId, user);
    return { matched: false };
  }

  // Remove a socket from queues
  public dequeue(socketId: string): void {
    this.videoQueue.delete(socketId);
    this.textQueue.delete(socketId);
  }

  // Get active room for a socket
  public getRoomBySocketId(socketId: string): ActiveRoom | undefined {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return undefined;
    return this.activeRooms.get(roomId);
  }

  // End an active room session
  public closeRoom(roomId: string): ActiveRoom | undefined {
    const room = this.activeRooms.get(roomId);
    if (room) {
      this.socketToRoom.delete(room.user1.socketId);
      this.socketToRoom.delete(room.user2.socketId);
      this.activeRooms.delete(roomId);
    }
    return room;
  }

  // Analytics & monitoring metrics
  public getStats() {
    let videoCalls = 0;
    let textChats = 0;

    for (const room of this.activeRooms.values()) {
      if (room.mode === 'video') videoCalls++;
      else textChats++;
    }

    return {
      queueVideo: this.videoQueue.size,
      queueText: this.textQueue.size,
      activeVideoCalls: videoCalls,
      activeTextChats: textChats,
      totalActiveRooms: this.activeRooms.size
    };
  }
}

export const matchmaker = new Matchmaker();
