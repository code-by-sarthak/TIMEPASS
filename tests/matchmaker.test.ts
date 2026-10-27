import { describe, it, expect, beforeEach } from 'vitest';
import { Matchmaker } from '../server/matchmaker';
import { QueuedUser } from '../src/lib/types';

describe('Matchmaking Engine', () => {
  let matchmaker: Matchmaker;

  beforeEach(() => {
    matchmaker = new Matchmaker();
  });

  it('should queue a single user and return matched: false', async () => {
    const user1: QueuedUser = {
      socketId: 'sock_1',
      userId: 'user_1',
      displayName: 'Alice',
      mode: 'video',
      interests: ['Gaming', 'Coding'],
      languages: ['English'],
      country: 'USA',
      joinedAt: Date.now(),
      blockedUserIds: []
    };

    const res = await matchmaker.enqueue(user1);
    expect(res?.matched).toBe(false);

    const stats = matchmaker.getStats();
    expect(stats.queueVideo).toBe(1);
  });

  it('should pair two compatible users in video queue', async () => {
    const user1: QueuedUser = {
      socketId: 'sock_1',
      userId: 'user_1',
      displayName: 'Alice',
      mode: 'video',
      interests: ['Gaming'],
      languages: ['English'],
      country: 'USA',
      joinedAt: Date.now(),
      blockedUserIds: []
    };

    const user2: QueuedUser = {
      socketId: 'sock_2',
      userId: 'user_2',
      displayName: 'Bob',
      mode: 'video',
      interests: ['Gaming', 'Music'],
      languages: ['English'],
      country: 'UK',
      joinedAt: Date.now(),
      blockedUserIds: []
    };

    await matchmaker.enqueue(user1);
    const res = await matchmaker.enqueue(user2);

    expect(res?.matched).toBe(true);
    expect(res?.room).toBeDefined();
    expect(res?.partner?.userId).toBe('user_1');

    const stats = matchmaker.getStats();
    expect(stats.queueVideo).toBe(0);
    expect(stats.activeVideoCalls).toBe(1);
  });

  it('should exclude matching a user with themselves', async () => {
    const user1: QueuedUser = {
      socketId: 'sock_1',
      userId: 'user_1',
      displayName: 'Alice',
      mode: 'video',
      interests: ['Gaming'],
      languages: ['English'],
      country: 'USA',
      joinedAt: Date.now(),
      blockedUserIds: []
    };

    await matchmaker.enqueue(user1);
    const res = await matchmaker.enqueue({ ...user1, socketId: 'sock_1_dup' });

    expect(res?.matched).toBe(false);
  });

  it('should respect block lists and not match blocked users', async () => {
    const user1: QueuedUser = {
      socketId: 'sock_1',
      userId: 'user_1',
      displayName: 'Alice',
      mode: 'video',
      interests: ['Gaming'],
      languages: ['English'],
      country: 'USA',
      joinedAt: Date.now(),
      blockedUserIds: ['user_2'] // Alice blocked Bob
    };

    const user2: QueuedUser = {
      socketId: 'sock_2',
      userId: 'user_2',
      displayName: 'Bob',
      mode: 'video',
      interests: ['Gaming'],
      languages: ['English'],
      country: 'UK',
      joinedAt: Date.now(),
      blockedUserIds: []
    };

    await matchmaker.enqueue(user1);
    const res = await matchmaker.enqueue(user2);

    expect(res?.matched).toBe(false); // Should not match!
    const stats = matchmaker.getStats();
    expect(stats.queueVideo).toBe(2);
  });

  it('should prevent instant rematch with previous partner on NEXT', async () => {
    const user1: QueuedUser = {
      socketId: 'sock_1',
      userId: 'user_1',
      displayName: 'Alice',
      mode: 'video',
      interests: ['Gaming'],
      languages: ['English'],
      country: 'USA',
      joinedAt: Date.now(),
      previousPartnerId: 'user_2', // Alice just skipped Bob
      blockedUserIds: []
    };

    const user2: QueuedUser = {
      socketId: 'sock_2',
      userId: 'user_2',
      displayName: 'Bob',
      mode: 'video',
      interests: ['Gaming'],
      languages: ['English'],
      country: 'UK',
      joinedAt: Date.now(),
      blockedUserIds: []
    };

    await matchmaker.enqueue(user2);
    const res = await matchmaker.enqueue(user1);

    expect(res?.matched).toBe(false); // Excludes immediate previous partner
  });
});
