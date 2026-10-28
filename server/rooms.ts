export interface RoomMember {
  socketId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  gender?: string;
  region?: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  joinedAt: number;
}

export interface CustomRoom {
  id: string;
  name: string;
  category: 'Gaming' | 'Music' | 'Hangout' | 'Movies' | 'Tech';
  description: string;
  hostId: string;
  hostName: string;
  isSystemRoom: boolean;
  maxMembers: number; // Max 8 members
  isPrivate: boolean;
  passcode?: string;
  members: Map<string, RoomMember>;
  nowPlayingTrackId?: string;
  createdAt: number;
}

export interface CustomRoomSummary {
  id: string;
  name: string;
  category: 'Gaming' | 'Music' | 'Hangout' | 'Movies' | 'Tech';
  description: string;
  hostName: string;
  isSystemRoom: boolean;
  memberCount: number;
  maxMembers: number;
  isPrivate: boolean;
  nowPlayingTrackId?: string;
  createdAt: number;
}

class CustomRoomManager {
  private rooms = new Map<string, CustomRoom>();
  private socketToRoom = new Map<string, string>();

  constructor() {
    this.seedDefaultRooms();
  }

  // Pre-seed iconic 8-member active public rooms (Official Community Lounges, no fake user names)
  private seedDefaultRooms() {
    const defaultRooms: Array<Omit<CustomRoom, 'members' | 'createdAt'>> = [
      {
        id: 'bgmi-valorant-squad',
        name: '🎮 BGMI & Valorant Squad Lounge',
        category: 'Gaming',
        description: 'Ranked push tonight! Join squad with mic. All ranks welcome.',
        hostId: 'system',
        hostName: '',
        isSystemRoom: true,
        maxMembers: 8,
        isPrivate: false,
        nowPlayingTrackId: 'chaleya'
      },
      {
        id: 'bollywood-antakshari-jam',
        name: '🎵 Late Night Bollywood Antakshari & Jam',
        category: 'Music',
        description: 'Singing, vibing & playing classic Arijit Singh & KK hits together!',
        hostId: 'system',
        hostName: '',
        isSystemRoom: true,
        maxMembers: 8,
        isPrivate: false,
        nowPlayingTrackId: 'tum_hi_ho'
      },
      {
        id: 'chai-pe-charcha-hangout',
        name: '☕ Chai Pe Charcha & 3 AM Thoughts',
        category: 'Hangout',
        description: 'Casual chill talks, sharing life stories, memes and late night vibes.',
        hostId: 'system',
        hostName: '',
        isSystemRoom: true,
        maxMembers: 8,
        isPrivate: false,
        nowPlayingTrackId: 'kesariya'
      },
      {
        id: 'cinema-anime-watch-party',
        name: '🍿 Bollywood Gossip & Anime Club',
        category: 'Movies',
        description: 'Movie recommendations, best scenes discussion & anime banter.',
        hostId: 'system',
        hostName: '',
        isSystemRoom: true,
        maxMembers: 8,
        isPrivate: false,
        nowPlayingTrackId: 'apna_bana_le'
      },
      {
        id: 'night-owl-devs-lounge',
        name: '💻 Night Owl Devs & Hackathon Chill',
        category: 'Tech',
        description: 'Coders, designers & tech enthusiasts building cool things together.',
        hostId: 'system',
        hostName: '',
        isSystemRoom: true,
        maxMembers: 8,
        isPrivate: false,
        nowPlayingTrackId: 'raataan_lambiyan'
      }
    ];

    for (const r of defaultRooms) {
      this.rooms.set(r.id, {
        ...r,
        members: new Map(),
        createdAt: Date.now() - Math.floor(Math.random() * 3600000)
      });
    }
  }

  public getAllRooms(): CustomRoomSummary[] {
    const list: CustomRoomSummary[] = [];
    for (const room of this.rooms.values()) {
      list.push({
        id: room.id,
        name: room.name,
        category: room.category,
        description: room.description,
        hostName: room.hostName,
        isSystemRoom: room.isSystemRoom ?? true,
        memberCount: room.members.size,
        maxMembers: room.maxMembers || 8,
        isPrivate: room.isPrivate,
        nowPlayingTrackId: room.nowPlayingTrackId,
        createdAt: room.createdAt
      });
    }
    return list.sort((a, b) => b.memberCount - a.memberCount);
  }

  public getRoom(roomId: string): CustomRoom | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomBySocketId(socketId: string): CustomRoom | undefined {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  public createRoom(params: {
    name: string;
    category: 'Gaming' | 'Music' | 'Hangout' | 'Movies' | 'Tech';
    description?: string;
    hostId: string;
    hostName: string;
    isPrivate?: boolean;
    passcode?: string;
    maxMembers?: number;
  }): CustomRoom {
    const id = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const room: CustomRoom = {
      id,
      name: params.name.trim(),
      category: params.category,
      description: params.description?.trim() || `Welcome to ${params.name}!`,
      hostId: params.hostId,
      hostName: params.hostName,
      isSystemRoom: false,
      maxMembers: Math.min(8, Math.max(2, params.maxMembers || 8)), // Strictly max 8 members!
      isPrivate: !!params.isPrivate,
      passcode: params.passcode?.trim(),
      members: new Map(),
      nowPlayingTrackId: 'kesariya',
      createdAt: Date.now()
    };

    this.rooms.set(id, room);
    return room;
  }

  public joinRoom(
    roomId: string, 
    member: Omit<RoomMember, 'isHost' | 'joinedAt'>,
    passcode?: string
  ): { success: boolean; error?: string; room?: CustomRoom; member?: RoomMember } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.isPrivate && room.passcode && room.passcode !== passcode) {
      return { success: false, error: 'Incorrect room passcode' };
    }

    // Limit check: 8 members strictly
    if (room.members.size >= room.maxMembers && !room.members.has(member.socketId)) {
      return { success: false, error: `Room is full (${room.maxMembers}/8 members)` };
    }

    const isHost = room.members.size === 0 || room.hostId === member.userId;
    const roomMember: RoomMember = {
      ...member,
      isHost,
      joinedAt: Date.now()
    };

    room.members.set(member.socketId, roomMember);
    this.socketToRoom.set(member.socketId, roomId);

    return { success: true, room, member: roomMember };
  }

  public leaveRoom(socketId: string): { roomId?: string; member?: RoomMember; roomEmpty?: boolean } {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return {};

    const room = this.rooms.get(roomId);
    this.socketToRoom.delete(socketId);

    if (!room) return { roomId };

    const member = room.members.get(socketId);
    room.members.delete(socketId);

    // If host left and members remain, assign host to first remaining member
    if (member?.isHost && room.members.size > 0) {
      const nextMember = room.members.values().next().value;
      if (nextMember) {
        nextMember.isHost = true;
        room.hostId = nextMember.userId;
        room.hostName = nextMember.displayName;
      }
    }

    // If custom non-seeded room is empty, clean it up after a grace period
    const isSeeded = [
      'bgmi-valorant-squad',
      'bollywood-antakshari-jam',
      'chai-pe-charcha-hangout',
      'cinema-anime-watch-party',
      'night-owl-devs-lounge'
    ].includes(room.id);

    const roomEmpty = room.members.size === 0;
    if (roomEmpty && !isSeeded) {
      this.rooms.delete(roomId);
    }

    return { roomId, member, roomEmpty };
  }

  public updateMemberMedia(socketId: string, updates: { isMuted?: boolean; isVideoOff?: boolean }): RoomMember | undefined {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return undefined;
    const room = this.rooms.get(roomId);
    if (!room) return undefined;
    const member = room.members.get(socketId);
    if (!member) return undefined;

    if (typeof updates.isMuted === 'boolean') member.isMuted = updates.isMuted;
    if (typeof updates.isVideoOff === 'boolean') member.isVideoOff = updates.isVideoOff;

    return member;
  }

  public updateRoomTrack(roomId: string, trackId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.nowPlayingTrackId = trackId;
    return true;
  }
}

export const customRoomManager = new CustomRoomManager();
