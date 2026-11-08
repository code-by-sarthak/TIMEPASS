import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/../server/db';

const JWT_SECRET = process.env.JWT_SECRET || 'timepass_jwt_production_secret_key_needs_to_be_long_and_secure_64chars';

function signToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, email, displayName, photoUrl, phoneNumber, gender, region } = body;

    if (!uid && !email && !phoneNumber) {
      return NextResponse.json(
        { error: 'Valid Firebase user details required' },
        { status: 400 }
      );
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email: email.toLowerCase() }] : []),
          ...(phoneNumber ? [{ phone: phoneNumber }] : []),
          { username: `fb_${uid}` }
        ]
      },
      include: { profile: true }
    });

    if (!user) {
      const cleanName = displayName || (email ? email.split('@')[0] : 'Timepass User');
      const uniqueSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      const safePrefix = cleanName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 15) || 'user';
      const username = `fb_${safePrefix}_${uniqueSuffix}`;
      const avatarUrl = photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`;

      user = await prisma.user.create({
        data: {
          email: email ? email.toLowerCase() : null,
          phone: phoneNumber || null,
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
      if (user.bannedUntil && new Date() > user.bannedUntil) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isBanned: false, bannedUntil: null, banReason: null }
        });
      } else {
        return NextResponse.json(
          { error: `Your account is suspended: ${user.banReason || 'Community Guidelines Violation'}` },
          { status: 403 }
        );
      }
    }

    const token = signToken(user.id, user.role);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isGuest: false,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (err) {
    console.warn('Next.js API Firebase sync serverless fallback:', err);
    try {
      const body = await req.json().catch(() => ({}));
      const { uid, email, displayName, photoUrl, phoneNumber, gender, region } = body;
      const cleanName = displayName || (email ? email.split('@')[0] : 'Timepass User');
      const uniqueSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      const userId = uid || `usr_fb_${uniqueSuffix}`;
      const token = signToken(userId, 'USER');

      return NextResponse.json({
        success: true,
        token,
        user: {
          id: userId,
          email: email || null,
          phone: phoneNumber || null,
          username: `fb_${uniqueSuffix}`,
          displayName: cleanName,
          avatarUrl: photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`,
          isGuest: false,
          role: 'USER',
          profile: {
            id: `prof_${userId}`,
            userId: userId,
            gender: gender || 'Not Specified',
            region: region || 'Global',
            country: 'India',
            languages: 'Hindi,English',
            interests: 'Music,Bollywood,Movies,Travel',
            ageConfirmed: true,
            preferredChatMode: 'video',
            allowFriendRequests: true,
            theme: 'dark'
          }
        }
      });
    } catch {
      return NextResponse.json({ error: 'Failed to synchronize Firebase session' }, { status: 500 });
    }
  }
}
