import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'timepass_test_secret_1234567890';

describe('Authentication & Security', () => {
  it('should securely hash and verify passwords using bcrypt', async () => {
    const rawPassword = 'superSecurePassword2026!';
    const hash = await bcrypt.hash(rawPassword, 10);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith('$2')).toBe(true);

    const match = await bcrypt.compare(rawPassword, hash);
    expect(match).toBe(true);

    const wrongMatch = await bcrypt.compare('wrongPassword', hash);
    expect(wrongMatch).toBe(false);
  });

  it('should sign and verify valid JWT tokens', () => {
    const payload = { userId: 'usr_abc123', role: 'USER' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    expect(typeof token).toBe('string');

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    expect(decoded.userId).toBe('usr_abc123');
    expect(decoded.role).toBe('USER');
  });

  it('should reject tampered JWT tokens', () => {
    const token = jwt.sign({ userId: 'usr_hacker' }, JWT_SECRET);
    const tampered = token + 'tampered';

    expect(() => {
      jwt.verify(tampered, JWT_SECRET);
    }).toThrow();
  });
});
