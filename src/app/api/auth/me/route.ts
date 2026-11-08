import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/../server/db';

const JWT_SECRET = process.env.JWT_SECRET || 'timepass_jwt_production_secret_key_needs_to_be_long_and_secure_64chars';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json({
        user: {
          id: decoded.userId,
          email: null,
          username: `user_${decoded.userId.slice(-6)}`,
          displayName: 'Timepass User',
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(decoded.userId)}`,
          isGuest: false,
          role: 'USER',
          isBanned: false,
          createdAt: new Date().toISOString(),
          profile: {
            id: `prof_${decoded.userId}`,
            userId: decoded.userId,
            gender: 'Not Specified',
            region: 'Global',
            country: 'India',
            languages: 'Hindi,English',
            interests: 'Music,Movies',
            ageConfirmed: true,
            preferredChatMode: 'video',
            allowFriendRequests: true,
            theme: 'dark'
          }
        }
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isGuest: user.isGuest,
        role: user.role,
        isBanned: user.isBanned,
        createdAt: user.createdAt,
        profile: user.profile
      }
    });
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}
