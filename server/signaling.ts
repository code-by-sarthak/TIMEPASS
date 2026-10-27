import { Server, Socket } from 'socket.io';
import { matchmaker } from './matchmaker';
import { filterProfanity, checkRateLimit, isUserBanned } from './moderation';
import { prisma } from './db';
import { QueuedUser } from '../src/lib/types';

export function setupSignaling(io: Server) {
  // Track total connected sockets for genuine live stats
  let totalConnectedSockets = 0;

  io.on('connection', (socket: Socket) => {
    totalConnectedSockets++;
    io.emit('online-count', { count: totalConnectedSockets });

    // Send current online count on connect
    socket.emit('online-count', { count: totalConnectedSockets });

    // User metadata attached to socket
    let currentUserId = (socket.handshake.query.userId as string) || `guest_${socket.id.substring(0, 8)}`;
    let currentDisplayName = (socket.handshake.query.displayName as string) || `Stranger_${socket.id.substring(0, 4)}`;

    // 1. Join Matchmaking Queue
    socket.on('join-queue', async (data: {
      mode: 'video' | 'text';
      interests?: string[];
      languages?: string[];
      country?: string;
      userId?: string;
      displayName?: string;
      avatarUrl?: string;
      previousPartnerId?: string;
    }) => {
      try {
        if (data.userId) currentUserId = data.userId;
        if (data.displayName) currentDisplayName = data.displayName;

        // Check ban status
        const banCheck = await isUserBanned(currentUserId);
        if (banCheck.banned) {
          socket.emit('banned-notice', { reason: banCheck.reason });
          return;
        }

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
              country: user.country,
              interests: user.interests,
              languages: user.languages,
              sharedInterests,
            }
          });

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
        }
      } catch (err) {
        console.error('Error in join-queue:', err);
        socket.emit('queue-error', { message: 'Failed to join queue' });
      }
    });

    // 2. Leave Matchmaking Queue
    socket.on('leave-queue', () => {
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

      const room = matchmaker.getRoomBySocketId(socket.id);
      if (!room) return;

      const { cleanText } = filterProfanity(data.content.trim());
      const partnerSocketId = room.user1.socketId === socket.id ? room.user2.socketId : room.user1.socketId;

      const messagePayload = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        senderId: currentUserId,
        senderName: currentDisplayName,
        content: cleanText,
        timestamp: new Date().toISOString(),
      };

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

    // 9. NEXT Button
    socket.on('call-next', (data?: { interests?: string[]; languages?: string[]; country?: string }) => {
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
      socket.emit('partner-left', { reason: 'Finding next person...' });

      // Automatically search for next partner
      setTimeout(() => {
        socket.emit('trigger-requeue', { previousPartnerId });
      }, 100);
    });

    // 10. END CALL Button
    socket.on('call-end', () => {
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

    // 13. Disconnect cleanup
    socket.on('disconnect', () => {
      totalConnectedSockets = Math.max(0, totalConnectedSockets - 1);
      io.emit('online-count', { count: totalConnectedSockets });

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
