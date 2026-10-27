import { describe, it, expect } from 'vitest';
import { filterProfanity, checkRateLimit } from '../server/moderation';

describe('Safety & Moderation Utilities', () => {
  it('should allow clean normal friendly text', () => {
    const result = filterProfanity('Hello there! How is the weather in Tokyo?');
    expect(result.isFlagged).toBe(false);
    expect(result.cleanText).toBe('Hello there! How is the weather in Tokyo?');
  });

  it('should censor and flag prohibited toxic words', () => {
    const result = filterProfanity('Hey please kill yourself right now');
    expect(result.isFlagged).toBe(true);
    expect(result.cleanText).toContain('*** [Blocked by Safety Filter] ***');
  });

  it('should enforce rate limits on rapid message spam', () => {
    const testKey = 'test_spam_socket_123';
    // Allow up to 3 rapid tokens in this test
    const allow1 = checkRateLimit(testKey, 3, 0.5);
    const allow2 = checkRateLimit(testKey, 3, 0.5);
    const allow3 = checkRateLimit(testKey, 3, 0.5);
    const allow4 = checkRateLimit(testKey, 3, 0.5);

    expect(allow1).toBe(true);
    expect(allow2).toBe(true);
    expect(allow3).toBe(true);
    expect(allow4).toBe(false); // 4th request blocked by rate limiter!
  });
});
