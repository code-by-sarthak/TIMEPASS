import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'timepass_jwt_production_secret_key_needs_to_be_long_and_secure_64chars';

// Helper to sign JWT
function signToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

// 1. Guest Registration / Quick Onboarding
router.post('/guest', async (req: Request, res: Response) => {
  try {
    const { displayName, gender, region, interests, languages, country } = req.body;
    const cleanName = displayName ? displayName.trim() : `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
    const username = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const avatarGender = gender === 'Female' ? 'adventurer-neutral' : 'bottts';
    const avatarUrl = `https://api.dicebear.com/7.x/${avatarGender}/svg?seed=${encodeURIComponent(cleanName)}`;

    const user = await prisma.user.create({
      data: {
        username,
        displayName: cleanName,
        isGuest: true,
        role: 'USER',
        avatarUrl,
        profile: {
          create: {
            gender: gender || 'Not Specified',
            region: region || 'Global',
            country: country || 'India',
            languages: Array.isArray(languages) ? languages.join(',') : (languages || 'Hindi,English'),
            interests: Array.isArray(interests) ? interests.join(',') : (interests || 'Music,Movies,Friendship'),
            ageConfirmed: true,
            preferredChatMode: 'video',
          }
        }
      },
      include: { profile: true }
    });

    const token = signToken(user.id, user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isGuest: true,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (err) {
    console.error('Guest creation error:', err);
    res.status(500).json({ error: 'Failed to create guest session' });
  }
});

// 2. Email / Password Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, username, interests, languages, country } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, and display name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check existing
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          username ? { username: username.toLowerCase() } : { email: email.toLowerCase() }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Email or username already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const finalUsername = username ? username.toLowerCase() : email.split('@')[0] + Math.floor(100 + Math.random() * 900);
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`;

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        username: finalUsername,
        displayName,
        avatarUrl,
        isGuest: false,
        role: 'USER',
        profile: {
          create: {
            country: country || 'Global',
            languages: Array.isArray(languages) ? languages.join(',') : (languages || 'English'),
            interests: Array.isArray(interests) ? interests.join(',') : (interests || 'Gaming,Technology'),
            ageConfirmed: true,
          }
        }
      },
      include: { profile: true }
    });

    const token = signToken(user.id, user.role);

    res.json({
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
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 3. Email / Username Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: login.toLowerCase() },
          { username: login.toLowerCase() }
        ]
      },
      include: { profile: true }
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.isBanned) {
      if (user.bannedUntil && new Date() > user.bannedUntil) {
        // Expired suspension
        await prisma.user.update({
          where: { id: user.id },
          data: { isBanned: false, bannedUntil: null, banReason: null }
        });
      } else {
        return res.status(403).json({
          error: `Your account is suspended: ${user.banReason || 'Community Guidelines Violation'}`
        });
      }
    }

    const token = signToken(user.id, user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isGuest: user.isGuest,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 4. Send Mobile OTP
router.post('/otp/send', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.length < 8) {
      return res.status(400).json({ error: 'Valid phone number is required' });
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any old pending OTP for this number
    await prisma.otpVerification.deleteMany({
      where: { phone }
    });

    await prisma.otpVerification.create({
      data: { phone, code, expiresAt }
    });

    console.log(`📱 [SMS Gateway] OTP generated for ${phone}: ${code}`);

    // In dev / sandbox mode, return code in response for frictionless user testing
    res.json({
      success: true,
      message: 'OTP sent to mobile number',
      devCode: code, // Highlighted in UI for easy local verification!
    });
  } catch (err) {
    console.error('OTP Send error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// 5. Verify Mobile OTP
router.post('/otp/verify', async (req: Request, res: Response) => {
  try {
    const { phone, code, displayName } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: 'Phone and OTP code are required' });
    }

    const record = await prisma.otpVerification.findFirst({
      where: {
        phone,
        code,
        verified: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { verified: true }
    });

    // Find or create user with this phone number
    let user = await prisma.user.findUnique({
      where: { phone },
      include: { profile: true }
    });

    if (!user) {
      const cleanName = displayName || `User_${phone.slice(-4)}`;
      const username = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`;

      user = await prisma.user.create({
        data: {
          phone,
          username,
          displayName: cleanName,
          avatarUrl,
          isGuest: false,
          role: 'USER',
          profile: {
            create: {
              country: 'Global',
              languages: 'English',
              interests: 'Gaming,Movies,Music',
              ageConfirmed: true,
            }
          }
        },
        include: { profile: true }
      });
    }

    const token = signToken(user.id, user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
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
    console.error('OTP verify error:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// 6. Real Firebase Authentication Sync Endpoint (Google, Phone OTP, Email/Pass)
router.post('/firebase-sync', async (req: Request, res: Response) => {
  try {
    const { uid, email, phoneNumber, displayName, photoUrl, providerId, gender, region } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'Firebase UID is required' });
    }

    const conditions = [];
    if (email) conditions.push({ email: email.toLowerCase() });
    if (phoneNumber) conditions.push({ phone: phoneNumber });

    // Check if user exists by email or phone
    let user = conditions.length > 0 ? await prisma.user.findFirst({
      where: {
        OR: conditions
      },
      include: { profile: true }
    }) : null;

    if (user) {
      // Update display name or avatar if updated in Firebase
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          displayName: displayName || user.displayName,
          avatarUrl: photoUrl || user.avatarUrl,
          ...(phoneNumber && !user.phone ? { phone: phoneNumber } : {}),
          ...(email && !user.email ? { email: email.toLowerCase() } : {}),
        },
        include: { profile: true }
      });
    } else {
      // Create new verified user
      const cleanName = displayName || (email ? email.split('@')[0] : (phoneNumber ? `User_${phoneNumber.slice(-4)}` : 'Chatter'));
      const prefix = providerId === 'google.com' ? 'g' : (phoneNumber ? 'ph' : 'u');
      const username = `${prefix}_${cleanName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${Math.floor(100 + Math.random() * 900)}`;
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
        return res.status(403).json({
          error: `Your account is suspended: ${user.banReason || 'Community Guidelines Violation'}`
        });
      }
    }

    const token = signToken(user.id, user.role);

    res.json({
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
    console.error('Firebase sync error:', err);
    res.status(500).json({ error: 'Failed to synchronize Firebase session' });
  }
});

// 7. Google Sign-In Simulation / OAuth Endpoint
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { email, displayName, photoUrl, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Google email is required' });
    }

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true }
    });

    if (!user) {
      const cleanName = displayName || email.split('@')[0];
      const username = `g_${cleanName.replace(/\s+/g, '_').toLowerCase()}_${Math.floor(100 + Math.random() * 900)}`;
      const avatarUrl = photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`;

      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          username,
          displayName: cleanName,
          avatarUrl,
          isGuest: false,
          role: 'USER',
          profile: {
            create: {
              country: 'Global',
              languages: 'English',
              interests: 'Technology,Travel,Music',
              ageConfirmed: true,
            }
          }
        },
        include: { profile: true }
      });
    }

    const token = signToken(user.id, user.role);

    res.json({
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
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// 7. Get Current User (/me)
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { profile: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
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
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// 8. Delete Account (GDPR / Privacy Compliance)
router.delete('/delete', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    await prisma.user.delete({
      where: { id: decoded.userId }
    });

    res.json({ success: true, message: 'Account and associated data deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
