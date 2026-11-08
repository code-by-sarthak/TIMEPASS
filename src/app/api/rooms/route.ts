import { NextResponse } from 'next/server';
import { customRoomManager } from '@/../server/rooms';

export async function GET() {
  try {
    const rooms = customRoomManager.getAllRooms();
    return NextResponse.json({ success: true, rooms });
  } catch (err) {
    console.error('Next.js API rooms error:', err);
    return NextResponse.json({ success: false, rooms: [] }, { status: 500 });
  }
}
