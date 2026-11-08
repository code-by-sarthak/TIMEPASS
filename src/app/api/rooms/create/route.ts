import { NextResponse } from 'next/server';
import { customRoomManager } from '@/../server/rooms';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, description, hostId, hostName, isPrivate, passcode, maxMembers } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Room name is required' }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        category: room.category,
        description: room.description,
        inviteUrl: `/rooms/${room.id}`
      }
    });
  } catch (err) {
    console.error('Next.js API room create error:', err);
    return NextResponse.json({ success: false, error: 'Failed to create room' }, { status: 500 });
  }
}
