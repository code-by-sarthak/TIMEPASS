import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../../server/db';

const JWT_SECRET = process.env.JWT_SECRET || 'timepass_jwt_production_secret_key_needs_to_be_long_and_secure_64chars';

function signToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

export async function POST(req: NextRequest) {
  try {
    const { login, password } = await req.json();

    if (!login || !password) {
      return NextResponse.json({ error: 'Email or username and password are required' }, { status: 400 });
    }

    const cleanLogin = login.toLowerCase().trim();

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanLogin },
          { username: cleanLogin }
        ]
      },
      include: { profile: true }
    });

    if (!user) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const isEmail = cleanLogin.includes('@');
      const displayName = isEmail ? cleanLogin.split('@')[0] : cleanLogin;
      const uniqueSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      const username = `${displayName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 15)}_${uniqueSuffix}`;
      const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`;

      user = await prisma.user.create({
        data: {
          email: isEmail ? cleanLogin : null,
          username,
          passwordHash,
          displayName,
          avatarUrl,
          isGuest: false,
          role: 'USER',
          profile: {
            create: {
              country: 'India',
              languages: 'Hindi,English',
              interests: 'Bollywood,Music,Chat',
              ageConfirmed: true,
              preferredChatMode: 'video'
            }
          }
        },
        include: { profile: true }
      });
    } else {
      if (!user.passwordHash) {
        return NextResponse.json({ error: 'This account was created with Google/Gmail. Please sign in with Gmail.' }, { status: 401 });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 });
      }
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
    console.error('Login route error:', err);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
