import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    onlineCount: 42 + Math.floor(Math.random() * 15),
    activeUsers: [
      { id: 'u1', displayName: 'Aarav (Mumbai)', country: 'India', status: 'In Video Call' },
      { id: 'u2', displayName: 'Simran (Delhi)', country: 'India', status: 'In Video Call' },
      { id: 'u3', displayName: 'Rohan (Bengaluru)', country: 'India', status: 'Listening to Music' },
      { id: 'u4', displayName: 'Pooja (Pune)', country: 'India', status: 'In Squad Room' },
    ],
    recentActivities: [
      { id: 'a1', message: 'Aarav & Simran matched on Tum Hi Ho', timestamp: Date.now() - 30000 },
      { id: 'a2', message: 'New Squad Room created: Late Night Bollywood Jam', timestamp: Date.now() - 60000 },
      { id: 'a3', message: 'Vikram & Ananya connected in 1-on-1 video call', timestamp: Date.now() - 90000 },
    ]
  });
}
