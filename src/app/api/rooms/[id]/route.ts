import { NextResponse } from 'next/server';
import { customRoomManager } from '@/../server/rooms';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const room = customRoomManager.getRoom(params.id);
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({
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
        members: Array.from(room.members.values()).map((m) => ({
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
  } catch (err) {
    console.error('Next.js API room details error:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch room' }, { status: 500 });
  }
}
