import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../../server/db';

const JWT_SECRET = process.env.JWT_SECRET || 'timepass_jwt_production_secret_key_needs_to_be_long_and_secure_64chars';

function signToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, displayName, photoUrl, gender, region } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid Gmail or email address is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    let user = await prisma.user.findFirst({
      where: { email: cleanEmail },
      include: { profile: true }
    });

    if (!user) {
      const cleanName = displayName?.trim() || cleanEmail.split('@')[0];
      const uniqueSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      const safePrefix = cleanName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 15) || 'user';
      const username = `g_${safePrefix}_${uniqueSuffix}`;
      const avatarUrl = photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`;

      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          username,
          displayName: cleanName,
          avatarUrl,
          isGuest: false,
          role: 'USER',
          profile: {
            create: {
              gender: gender || 'Not Specified',
              region: region || 'Global',
              country: 'India',
              languages: 'Hindi,English',
              interests: 'Music,Bollywood,Movies,Travel',
              ageConfirmed: true,
              preferredChatMode: 'video',
            }
          }
        },
        include: { profile: true }
      });
    }

    if (user.isBanned) {
      return NextResponse.json({
        error: `Your account is suspended: ${user.banReason || 'Community Guidelines Violation'}`
      }, { status: 403 });
    }

    const token = signToken(user.id, user.role);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isGuest: false,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (err) {
    console.error('App Router /api/auth/google error:', err);
    return NextResponse.json({ error: 'Google sign-in failed. Please try again.' }, { status: 500 });
  }
}
