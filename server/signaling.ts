import { Server, Socket } from 'socket.io';
import { matchmaker } from './matchmaker';
import { filterProfanity, checkRateLimit, isUserBanned } from './moderation';
import { prisma } from './db';
import { QueuedUser, RealLiveActivity, RealActiveUser } from '../src/lib/types';
import { COMPANION_PROFILES, CompanionProfile, getCompanionReply } from './companion';
import { customRoomManager } from './rooms';

// Genuine live state tracking
let totalConnectedSockets = 0;
const realLiveActivities: RealLiveActivity[] = [];
const realActiveUsers = new Map<string, RealActiveUser>();

// Interactive Text Chat Companions
interface CompanionSession {
  roomId: string;
  partner: CompanionProfile;
  messageCount: number;
}
const activeCompanionSessions = new Map<string, CompanionSession>();
const pendingCompanionTimers = new Map<string, NodeJS.Timeout>();

export function getLiveStatus() {
  return {
    onlineCount: totalConnectedSockets,
    activeUsers: Array.from(realActiveUsers.values()),
    recentActivities: realLiveActivities.slice(0, 15)
  };
}

export function setupSignaling(io: Server) {
  io.on('connection', (socket: Socket) => {
    totalConnectedSockets++;
    io.emit('online-count', { count: totalConnectedSockets });

    // Send current online count and live status on connect
    socket.emit('online-count', { count: totalConnectedSockets });
    socket.emit('live-status-sync', getLiveStatus());

    // User metadata attached to socket
    let currentUserId = (socket.handshake.query.userId as string) || `guest_${socket.id.substring(0, 8)}`;
    let currentDisplayName = (socket.handshake.query.displayName as string) || `User_${socket.id.substring(0, 4)}`;

    // 0. Register User Presence for Live Real Activity
    socket.on('register-presence', (data: { displayName?: string; gender?: string; region?: string; userId?: string }) => {
      if (data.userId) currentUserId = data.userId;
      if (data.displayName) currentDisplayName = data.displayName;

      const userObj: RealActiveUser = {
        socketId: socket.id,
        userId: currentUserId,
        displayName: currentDisplayName,
        gender: data.gender,
        region: data.region || 'India',
        mode: 'Online',
        joinedAt: Date.now()
      };
      realActiveUsers.set(socket.id, userObj);

      const act: RealLiveActivity = {
        id: `pres_${socket.id}_${Date.now()}`,
        name: currentDisplayName,
        region: data.region || 'India',
        gender: data.gender,
        mode: 'joined TIMEPASS',
        timestamp: Date.now()
      };
      realLiveActivities.unshift(act);
      if (realLiveActivities.length > 30) realLiveActivities.pop();

      io.emit('real-activity', act);
      io.emit('active-users-update', Array.from(realActiveUsers.values()));
    });

    // 1. Join Matchmaking Queue
    socket.on('join-queue', async (data: {
      mode: 'video' | 'text';
      interests?: string[];
      languages?: string[];
      country?: string;
      gender?: string;
      genderPref?: string;
      region?: string;
      userId?: string;
      displayName?: string;
      avatarUrl?: string;
      previousPartnerId?: string;
    }) => {
      try {
        if (data.userId) currentUserId = data.userId;
        if (data.displayName) currentDisplayName = data.displayName;

        // Register in active real users
        const activeUser: RealActiveUser = {
          socketId: socket.id,
          userId: currentUserId,
          displayName: currentDisplayName,
          gender: data.gender,
          region: data.region || 'India',
          mode: data.mode === 'video' ? 'Video Queue' : 'Text Queue',
          joinedAt: Date.now()
        };
        realActiveUsers.set(socket.id, activeUser);

        // Broadcast real activity
        const act: RealLiveActivity = {
          id: `queue_${socket.id}_${Date.now()}`,
          name: currentDisplayName,
          region: data.region || 'India',
          gender: data.gender,
          mode: `joined ${data.mode === 'video' ? 'Video Call' : 'Text Chat'}`,
          timestamp: Date.now()
        };
        realLiveActivities.unshift(act);
        if (realLiveActivities.length > 30) realLiveActivities.pop();

        io.emit('real-activity', act);
        io.emit('active-users-update', Array.from(realActiveUsers.values()));

        // Check ban status
        const banCheck = await isUserBanned(currentUserId);
        if (banCheck.banned) {
          socket.emit('banned-notice', { reason: banCheck.reason });
          return;
        }

        // Clean up any existing companion session or pending timers
        if (pendingCompanionTimers.has(socket.id)) {
          clearTimeout(pendingCompanionTimers.get(socket.id)!);
          pendingCompanionTimers.delete(socket.id);
        }
        activeCompanionSessions.delete(socket.id);

        // Clean up any existing room this socket is in
        const existingRoom = matchmaker.getRoomBySocketId(socket.id);
        if (existingRoom) {
          const partnerSocketId = existingRoom.user1.socketId === socket.id
            ? existingRoom.user2.socketId
            : existingRoom.user1.socketId;

          matchmaker.closeRoom(existingRoom.roomId);
          io.to(partnerSocketId).emit('partner-left', { reason: 'Partner skipped' });
        }

        const user: QueuedUser = {
          socketId: socket.id,
          userId: currentUserId,
          displayName: currentDisplayName,
          avatarUrl: data.avatarUrl,
          gender: data.gender,
          region: data.region,
          mode: data.mode || 'video',
          interests: Array.isArray(data.interests) ? data.interests : [],
          languages: Array.isArray(data.languages) && data.languages.length > 0 ? data.languages : ['Any'],
          country: data.country || 'Global',
          joinedAt: Date.now(),
          previousPartnerId: data.previousPartnerId,
          blockedUserIds: []
        };

        socket.emit('queue-status', { status: 'searching' });

        const matchResult = await matchmaker.enqueue(user);

        if (matchResult && matchResult.matched && matchResult.room && matchResult.partner) {
          const room = matchResult.room;
          const partner = matchResult.partner;

          // Clear any companion timers for both sockets
          if (pendingCompanionTimers.has(socket.id)) {
            clearTimeout(pendingCompanionTimers.get(socket.id)!);
            pendingCompanionTimers.delete(socket.id);
          }
          if (pendingCompanionTimers.has(partner.socketId)) {
            clearTimeout(pendingCompanionTimers.get(partner.socketId)!);
            pendingCompanionTimers.delete(partner.socketId);
          }

          // Compute shared interests
          const sharedInterests = user.interests.filter(i => partner.interests.includes(i));

          // Join socket.io room
          socket.join(room.roomId);
          const partnerSocket = io.sockets.sockets.get(partner.socketId);
          if (partnerSocket) {
            partnerSocket.join(room.roomId);
          }

          // User 1 is initiator (creates WebRTC offer)
          socket.emit('match-found', {
            roomId: room.roomId,
            mode: room.mode,
            initiator: true,
            partner: {
              id: partner.userId,
              displayName: partner.displayName,
              avatarUrl: partner.avatarUrl,
              gender: partner.gender,
              region: partner.region,
              country: partner.country,
              interests: partner.interests,
              languages: partner.languages,
              sharedInterests,
            }
          });

          // Partner is receiver (creates WebRTC answer)
          io.to(partner.socketId).emit('match-found', {
            roomId: room.roomId,
            mode: room.mode,
            initiator: false,
            partner: {
              id: user.userId,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              gender: user.gender,
              region: user.region,
              country: user.country,
              interests: user.interests,
              languages: user.languages,
              sharedInterests,
            }
          });

          // Broadcast real match activity
          const matchAct: RealLiveActivity = {
            id: `match_${room.roomId}_${Date.now()}`,
            name: `${user.displayName} & ${partner.displayName}`,
            region: `${user.region || 'Nearby'} · ${partner.region || 'Nearby'}`,
            gender: `${user.gender || ''} & ${partner.gender || ''}`,
            mode: `Matched on ${room.mode === 'video' ? 'Video' : 'Text'}`,
            timestamp: Date.now()
          };
          realLiveActivities.unshift(matchAct);
          if (realLiveActivities.length > 30) realLiveActivities.pop();
          io.emit('real-activity', matchAct);

          // Log conversation session asynchronously in DB
          try {
            await prisma.conversation.create({
              data: {
                id: room.roomId,
                mode: room.mode,
                user1Id: user.userId,
                user2Id: partner.userId,
              }
            });
          } catch {
            // Non-blocking
          }
        } else if (data.mode === 'text') {
          // If in text mode and no real human joined within 1.5s, auto-pair with an interactive companion!
          const timer = setTimeout(() => {
            pendingCompanionTimers.delete(socket.id);
            if (!socket.connected) return;

            // Remove from queue
            matchmaker.dequeue(socket.id);

            // Select companion
            let pool = COMPANION_PROFILES;
            if (data.genderPref === 'Girls' || user.gender === 'Girls') {
              pool = COMPANION_PROFILES.filter(c => c.gender === 'Girls');
            } else if (data.genderPref === 'Boys' || user.gender === 'Boys') {
              pool = COMPANION_PROFILES.filter(c => c.gender === 'Boys');
            }
            if (!pool || pool.length === 0) pool = COMPANION_PROFILES;
            const companion = pool[Math.floor(Math.random() * pool.length)];

            const roomId = `room_comp_${socket.id}_${Date.now()}`;
            activeCompanionSessions.set(socket.id, {
              roomId,
              partner: companion,
              messageCount: 0
            });

            const sharedInterests = (user.interests || []).filter(i => companion.interests.includes(i));

            socket.join(roomId);
            socket.emit('match-found', {
              roomId,
              mode: 'text',
              initiator: true,
              partner: {
                id: companion.id,
                displayName: companion.displayName,
                avatarUrl: companion.avatarUrl,
                gender: companion.gender,
                region: companion.region,
                country: 'India',
                interests: companion.interests,
                languages: ['English', 'Hindi'],
                sharedInterests: sharedInterests.length > 0 ? sharedInterests : ['Bollywood', 'Music']
              }
            });

            // Companion sends a warm initial greeting
            setTimeout(() => {
              if (!activeCompanionSessions.has(socket.id) || !socket.connected) return;
              socket.emit('partner-typing', { isTyping: true });
              setTimeout(() => {
                if (!activeCompanionSessions.has(socket.id) || !socket.connected) return;
                socket.emit('partner-typing', { isTyping: false });
                socket.emit('receive-message', {
                  id: `msg_comp_${Date.now()}`,
                  senderId: companion.id,
                  senderName: companion.displayName,
                  content: `Hey! How's your night going? ✨`,
                  timestamp: new Date().toISOString()
                });
              }, 1100);
            }, 700);
          }, 1500);

          pendingCompanionTimers.set(socket.id, timer);
        }
      } catch (err) {
        console.error('Error in join-queue:', err);
        socket.emit('queue-error', { message: 'Failed to join queue' });
      }
    });

    // 2. Leave Matchmaking Queue
    socket.on('leave-queue', () => {
      if (pendingCompanionTimers.has(socket.id)) {
        clearTimeout(pendingCompanionTimers.get(socket.id)!);
        pendingCompanionTimers.delete(socket.id);
      }
      activeCompanionSessions.delete(socket.id);
      matchmaker.dequeue(socket.id);
      socket.emit('queue-status', { status: 'idle' });
    });

    // 3. WebRTC Signaling: SDP Offer
    socket.on('signal-offer', (data: { sdp: RTCSessionDescriptionInit; to?: string; roomId?: string }) => {
      const room = matchmaker.getRoomBySocketId(socket.id);
      if (room) {
        const partnerSocketId = room.user1.socketId === socket.id ? room.user2.socketId : room.user1.socketId;
        io.to(partnerSocketId).emit('signal-offer', { sdp: data.sdp, from: socket.id });
      } else if (data.to) {
        io.to(data.to).emit('signal-offer', { sdp: data.sdp, from: socket.id });
      }
    });

    // 4. WebRTC Signaling: SDP Answer
    socket.on('signal-answer', (data: { sdp: RTCSessionDescriptionInit; to?: string; roomId?: string }) => {
      const room = matchmaker.getRoomBySocketId(socket.id);
      if (room) {
        const partnerSocketId = room.user1.socketId === socket.id ? room.user2.socketId : room.user1.socketId;
        io.to(partnerSocketId).emit('signal-answer', { sdp: data.sdp, from: socket.id });
      } else if (data.to) {
        io.to(data.to).emit('signal-answer', { sdp: data.sdp, from: socket.id });
      }
    });

    // 5. WebRTC Signaling: ICE Candidate
    socket.on('signal-ice-candidate', (data: { candidate: RTCIceCandidateInit; to?: string }) => {
      const room = matchmaker.getRoomBySocketId(socket.id);
      if (room) {
        const partnerSocketId = room.user1.socketId === socket.id ? room.user2.socketId : room.user1.socketId;
        io.to(partnerSocketId).emit('signal-ice-candidate', { candidate: data.candidate, from: socket.id });
      } else if (data.to) {
        io.to(data.to).emit('signal-ice-candidate', { candidate: data.candidate, from: socket.id });
      }
    });

    // 6. Media Toggles (Camera on/off, Mic mute/unmute)
    socket.on('media-state-change', (data: { cameraOff?: boolean; micMuted?: boolean }) => {
      const room = matchmaker.getRoomBySocketId(socket.id);
      if (room) {
        const partnerSocketId = room.user1.socketId === socket.id ? room.user2.socketId : room.user1.socketId;
        io.to(partnerSocketId).emit('partner-media-state', data);
      }
    });

    // 7. Chat Message
    socket.on('send-message', async (data: { content: string }) => {
      // Rate limiting: max 10 messages per 5 seconds
      if (!checkRateLimit(`chat_${socket.id}`, 8, 2)) {
        socket.emit('error-notice', { message: 'You are sending messages too quickly.' });
        return;
      }

      if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
        return;
      }

      const { cleanText } = filterProfanity(data.content.trim());
      const messagePayload = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        senderId: currentUserId,
        senderName: currentDisplayName,
        content: cleanText,
        timestamp: new Date().toISOString(),
      };

      // Check if user is in an interactive Companion session
      const companionSession = activeCompanionSessions.get(socket.id);
      if (companionSession) {
        socket.emit('message-sent', messagePayload);
        companionSession.messageCount++;

        setTimeout(() => {
          if (!activeCompanionSessions.has(socket.id) || !socket.connected) return;
          socket.emit('partner-typing', { isTyping: true });

          setTimeout(() => {
            if (!activeCompanionSessions.has(socket.id) || !socket.connected) return;
            socket.emit('partner-typing', { isTyping: false });

            const reply = getCompanionReply(cleanText, companionSession.partner, companionSession.messageCount);
            socket.emit('receive-message', {
              id: `msg_comp_${Date.now()}`,
              senderId: companionSession.partner.id,
              senderName: companionSession.partner.displayName,
              content: reply,
              timestamp: new Date().toISOString()
            });

            // 30% chance companion reacts with an emoji
            if (Math.random() < 0.3) {
              setTimeout(() => {
                if (activeCompanionSessions.has(socket.id) && socket.connected) {
                  const reactions = ['❤️', '🔥', '😂', '✨', '👏'];
                  const picked = reactions[Math.floor(Math.random() * reactions.length)];
                  socket.emit('receive-reaction', { emoji: picked, senderId: companionSession.partner.id });
                }
              }, 700);
            }
          }, 1200);
        }, 350);
        return;
      }

      const room = matchmaker.getRoomBySocketId(socket.id);
      if (!room) return;

      const partnerSocketId = room.user1.socketId === socket.id ? room.user2.socketId : room.user1.socketId;

      // Deliver to partner
      io.to(partnerSocketId).emit('receive-message', messagePayload);
      // Echo confirmation to sender
      socket.emit('message-sent', messagePayload);
    });

    // 8. Typing Indicator
    socket.on('typing', (data: { isTyping: boolean }) => {
      const room = matchmaker.getRoomBySocketId(socket.id);
      if (room) {
        const partnerSocketId = room.user1.socketId === socket.id ? room.user2.socketId : room.user1.socketId;
        io.to(partnerSocketId).emit('partner-typing', data);
      }
    });

    // 8.1 Real-time Floating Reactions (Hearts, Fire, Laughs, etc.)
    socket.on('send-reaction', (data: { emoji: string }) => {
      const companionSession = activeCompanionSessions.get(socket.id);
      if (companionSession && data?.emoji) {
        if (Math.random() < 0.5) {
          setTimeout(() => {
            if (activeCompanionSessions.has(socket.id) && socket.connected) {
              socket.emit('receive-reaction', { emoji: data.emoji, senderId: companionSession.partner.id });
            }
          }, 600);
        }
        return;
      }

      const room = matchmaker.getRoomBySocketId(socket.id);
      if (room && data?.emoji) {
        const partnerSocketId = room.user1.socketId === socket.id ? room.user2.socketId : room.user1.socketId;
        io.to(partnerSocketId).emit('receive-reaction', { emoji: data.emoji, senderId: currentUserId });
      }
    });

    // 9. NEXT Button
    socket.on('call-next', (data?: { interests?: string[]; languages?: string[]; country?: string }) => {
      if (pendingCompanionTimers.has(socket.id)) {
        clearTimeout(pendingCompanionTimers.get(socket.id)!);
        pendingCompanionTimers.delete(socket.id);
      }
      if (activeCompanionSessions.has(socket.id)) {
        activeCompanionSessions.delete(socket.id);
      }

      const room = matchmaker.getRoomBySocketId(socket.id);
      let previousPartnerId: string | undefined;

      if (room) {
        const partnerSocketId = room.user1.socketId === socket.id ? room.user2.socketId : room.user1.socketId;
        previousPartnerId = room.user1.socketId === socket.id ? room.user2.userId : room.user1.userId;

        matchmaker.closeRoom(room.roomId);
        io.to(partnerSocketId).emit('partner-left', { reason: 'Partner skipped' });

        // Update conversation record
        prisma.conversation.update({
          where: { id: room.roomId },
          data: {
            endedAt: new Date(),
            durationSeconds: Math.floor((Date.now() - room.startedAt) / 1000),
            endReason: 'next'
          }
        }).catch(() => {});
      }

      // Re-queue this user automatically
      socket.emit('queue-status', { status: 'searching' });

      // Automatically search for next partner
      setTimeout(() => {
        socket.emit('trigger-requeue', { previousPartnerId });
      }, 50);
    });

    // 10. END CALL Button
    socket.on('call-end', () => {
      if (pendingCompanionTimers.has(socket.id)) {
        clearTimeout(pendingCompanionTimers.get(socket.id)!);
        pendingCompanionTimers.delete(socket.id);
      }
      if (activeCompanionSessions.has(socket.id)) {
        activeCompanionSessions.delete(socket.id);
        matchmaker.dequeue(socket.id);
        socket.emit('call-ended');
        return;
      }

      const room = matchmaker.getRoomBySocketId(socket.id);
      if (room) {
        const partnerSocketId = room.user1.socketId === socket.id ? room.user2.socketId : room.user1.socketId;
        matchmaker.closeRoom(room.roomId);
        io.to(partnerSocketId).emit('partner-left', { reason: 'Partner ended the conversation' });

        prisma.conversation.update({
          where: { id: room.roomId },
          data: {
            endedAt: new Date(),
            durationSeconds: Math.floor((Date.now() - room.startedAt) / 1000),
            endReason: 'end_call'
          }
        }).catch(() => {});
      }

      matchmaker.dequeue(socket.id);
      socket.emit('call-ended');
    });

    // 11. Report and Block User
    socket.on('report-user', async (data: { reportedUserId: string; reason: string; details?: string }) => {
      try {
        const room = matchmaker.getRoomBySocketId(socket.id);
        const conversationId = room?.roomId;

        // Save report to database
        await prisma.report.create({
          data: {
            reporterId: currentUserId,
            reportedUserId: data.reportedUserId,
            conversationId,
            reason: data.reason || 'General Misconduct',
            details: data.details,
            status: 'PENDING'
          }
        });

        // Add block to database
        await prisma.block.upsert({
          where: {
            blockerId_blockedId: {
              blockerId: currentUserId,
              blockedId: data.reportedUserId
            }
          },
          update: {},
          create: {
            blockerId: currentUserId,
            blockedId: data.reportedUserId
          }
        });

        // Close room immediately
        if (room) {
          const partnerSocketId = room.user1.socketId === socket.id ? room.user2.socketId : room.user1.socketId;
          matchmaker.closeRoom(room.roomId);
          io.to(partnerSocketId).emit('partner-left', { reason: 'Conversation ended' });
        }

        socket.emit('report-success', { message: 'User reported and blocked. You will not be matched with them again.' });
      } catch (err) {
        console.error('Error reporting user:', err);
      }
    });

    // 12. Private Direct Room Handling (/room/:id)
    socket.on('join-private-room', (data: { roomId: string; displayName?: string }) => {
      const { roomId } = data;
      socket.join(roomId);

      const roomMembers = io.sockets.adapter.rooms.get(roomId);
      const memberCount = roomMembers ? roomMembers.size : 0;

      if (memberCount === 1) {
        // First user, wait for guest
        socket.emit('private-room-status', { status: 'waiting', isHost: true });
      } else if (memberCount === 2) {
        // Second user joined, notify both to start WebRTC
        io.to(roomId).emit('private-room-ready', { roomId });
      } else {
        // Room full
        socket.emit('private-room-status', { status: 'full' });
      }
    });

    // 12.1 8-Member Custom Room System
    socket.on('get-custom-rooms', () => {
      socket.emit('custom-rooms-list', customRoomManager.getAllRooms());
    });

    socket.on('join-custom-room', (data: {
      roomId: string;
      passcode?: string;
      displayName?: string;
      avatarUrl?: string;
      gender?: string;
      region?: string;
    }) => {
      const result = customRoomManager.joinRoom(data.roomId, {
        socketId: socket.id,
        userId: currentUserId,
        displayName: data.displayName || currentDisplayName,
        avatarUrl: data.avatarUrl,
        gender: data.gender,
        region: data.region || 'India',
        isMuted: false,
        isVideoOff: false
      }, data.passcode);

      if (!result.success || !result.room || !result.member) {
        socket.emit('custom-room-error', { message: result.error || 'Failed to join room' });
        return;
      }

      socket.join(data.roomId);

      // Send current room state to joining member
      socket.emit('custom-room-joined', {
        room: {
          id: result.room.id,
          name: result.room.name,
          category: result.room.category,
          description: result.room.description,
          hostId: result.room.hostId,
          hostName: result.room.hostName,
          maxMembers: result.room.maxMembers,
          nowPlayingTrackId: result.room.nowPlayingTrackId,
          members: Array.from(result.room.members.values())
        },
        myMember: result.member
      });

      // Broadcast to all other members in this room
      socket.to(data.roomId).emit('custom-room-member-joined', {
        member: result.member,
        memberCount: result.room.members.size
      });

      // Broadcast updated room list to all clients in lobby
      io.emit('custom-rooms-updated', customRoomManager.getAllRooms());
    });

    socket.on('leave-custom-room', () => {
      const { roomId, member } = customRoomManager.leaveRoom(socket.id);
      if (roomId) {
        socket.leave(roomId);
        if (member) {
          io.to(roomId).emit('custom-room-member-left', {
            socketId: socket.id,
            userId: member.userId,
            displayName: member.displayName
          });
        }
        io.emit('custom-rooms-updated', customRoomManager.getAllRooms());
      }
    });

    socket.on('custom-room-message', (data: { content: string }) => {
      const room = customRoomManager.getRoomBySocketId(socket.id);
      if (!room || !data.content || !data.content.trim()) return;

      const { cleanText } = filterProfanity(data.content.trim());
      const msg = {
        id: `rmsg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        senderId: currentUserId,
        senderName: currentDisplayName,
        content: cleanText,
        timestamp: new Date().toISOString()
      };

      io.to(room.id).emit('custom-room-new-message', msg);
    });

    socket.on('custom-room-reaction', (data: { emoji: string }) => {
      const room = customRoomManager.getRoomBySocketId(socket.id);
      if (!room || !data.emoji) return;

      io.to(room.id).emit('custom-room-new-reaction', {
        emoji: data.emoji,
        senderName: currentDisplayName
      });
    });

    socket.on('custom-room-sync-track', (data: { trackId: string }) => {
      const room = customRoomManager.getRoomBySocketId(socket.id);
      if (!room || !data.trackId) return;

      customRoomManager.updateRoomTrack(room.id, data.trackId);
      io.to(room.id).emit('custom-room-track-changed', {
        trackId: data.trackId,
        changedBy: currentDisplayName
      });
    });

    socket.on('custom-room-toggle-media', (data: { isMuted?: boolean; isVideoOff?: boolean }) => {
      const room = customRoomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      const updated = customRoomManager.updateMemberMedia(socket.id, data);
      if (updated) {
        io.to(room.id).emit('custom-room-member-media-changed', {
          socketId: socket.id,
          isMuted: updated.isMuted,
          isVideoOff: updated.isVideoOff
        });
      }
    });

    // 12.2 Custom Room WebRTC Mesh Signaling (Real Audio & Video between room peers)
    socket.on('custom-room-signal-offer', (data: {
      targetSocketId: string;
      sdp: any;
    }) => {
      io.to(data.targetSocketId).emit('custom-room-signal-offer', {
        callerSocketId: socket.id,
        sdp: data.sdp
      });
    });

    socket.on('custom-room-signal-answer', (data: {
      targetSocketId: string;
      sdp: any;
    }) => {
      io.to(data.targetSocketId).emit('custom-room-signal-answer', {
        responderSocketId: socket.id,
        sdp: data.sdp
      });
    });

    socket.on('custom-room-signal-ice', (data: {
      targetSocketId: string;
      candidate: any;
    }) => {
      io.to(data.targetSocketId).emit('custom-room-signal-ice', {
        senderSocketId: socket.id,
        candidate: data.candidate
      });
    });

    // 13. Disconnect cleanup
    socket.on('disconnect', () => {
      totalConnectedSockets = Math.max(0, totalConnectedSockets - 1);
      realActiveUsers.delete(socket.id);
      io.emit('online-count', { count: totalConnectedSockets });
      io.emit('active-users-update', Array.from(realActiveUsers.values()));

      if (pendingCompanionTimers.has(socket.id)) {
        clearTimeout(pendingCompanionTimers.get(socket.id)!);
        pendingCompanionTimers.delete(socket.id);
      }
      activeCompanionSessions.delete(socket.id);

      // Clean up custom room participation if any
      const roomLeave = customRoomManager.leaveRoom(socket.id);
      if (roomLeave?.roomId) {
        if (roomLeave.member) {
          io.to(roomLeave.roomId).emit('custom-room-member-left', {
            socketId: socket.id,
            userId: roomLeave.member.userId,
            displayName: roomLeave.member.displayName
          });
        }
        io.emit('custom-rooms-updated', customRoomManager.getAllRooms());
      }

      matchmaker.dequeue(socket.id);

      const room = matchmaker.getRoomBySocketId(socket.id);
      if (room) {
        const partnerSocketId = room.user1.socketId === socket.id ? room.user2.socketId : room.user1.socketId;
        matchmaker.closeRoom(room.roomId);
        io.to(partnerSocketId).emit('partner-left', { reason: 'Stranger disconnected' });

        prisma.conversation.update({
          where: { id: room.roomId },
          data: {
            endedAt: new Date(),
            durationSeconds: Math.floor((Date.now() - room.startedAt) / 1000),
            endReason: 'disconnect'
          }
        }).catch(() => {});
      }
    });
  });
}
