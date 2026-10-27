import { prisma } from './db';

// Prohibited terms / toxic keywords list for real-time safety
const PROHIBITED_WORDS = [
  'kill yourself',
  'nigger',
  'faggot',
  'kike',
  'spic',
  'child porn',
  'cp link',
  'sell drugs',
  'terrorist attack',
  'bomb threat'
];

export function filterProfanity(text: string): { cleanText: string; isFlagged: boolean } {
  let cleanText = text;
  let isFlagged = false;
  const lower = text.toLowerCase();

  for (const word of PROHIBITED_WORDS) {
    if (lower.includes(word)) {
      isFlagged = true;
      const regex = new RegExp(word, 'gi');
      cleanText = cleanText.replace(regex, '*** [Blocked by Safety Filter] ***');
    }
  }

  return { cleanText, isFlagged };
}

// Simple in-memory token bucket rate limiter
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimiters = new Map<string, RateLimitBucket>();

export function checkRateLimit(key: string, maxTokens: number = 10, refillRatePerSec: number = 2): boolean {
  const now = Date.now();
  let bucket = rateLimiters.get(key);

  if (!bucket) {
    bucket = { tokens: maxTokens - 1, lastRefill: now };
    rateLimiters.set(key, bucket);
    return true;
  }

  // Refill tokens
  const elapsedSec = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsedSec * refillRatePerSec);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }

  return false;
}

// Check if user is currently banned
export async function isUserBanned(userId: string): Promise<{ banned: boolean; reason?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true, bannedUntil: true, banReason: true }
    });

    if (!user) return { banned: false };

    if (user.isBanned) {
      if (user.bannedUntil && new Date() > user.bannedUntil) {
        // Temporary ban expired, lift ban
        await prisma.user.update({
          where: { id: userId },
          data: { isBanned: false, bannedUntil: null, banReason: null }
        });
        return { banned: false };
      }
      return { banned: true, reason: user.banReason || 'Your account has been suspended for violating Community Guidelines.' };
    }

    return { banned: false };
  } catch (err) {
    console.error('Error checking user ban status:', err);
    return { banned: false };
  }
}
