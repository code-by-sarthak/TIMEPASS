'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { 
  Users, 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  PhoneOff, 
  Copy, 
  Check, 
  Share2, 
  Sparkles, 
  MessageSquare, 
  X, 
  Send, 
  Music2, 
  Crown,
  Volume2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getSocket } from '@/lib/socket';
import { soundManager } from '@/lib/sound';
import { useMusic } from '@/lib/music-context';
import TimepassLogo from '@/components/TimepassLogo';

interface RoomMember {
  socketId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  gender?: string;
  region?: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
}

interface CustomRoomData {
  id: string;
  name: string;
  category: 'Gaming' | 'Music' | 'Hangout' | 'Movies' | 'Tech';
  description: string;
  hostId: string;
  hostName: string;
  isSystemRoom?: boolean;
  maxMembers: number;
  nowPlayingTrackId?: string;
  members: RoomMember[];
}

interface RoomChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

const COMMON_REACTIONS = [
  { emoji: '❤️', label: 'Heart' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '🎉', label: 'Party' },
  { emoji: '✨', label: 'Sparkle' },
];

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export default function CustomRoomViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { tracks, playTrack } = useMusic();

  const roomId = params.id as string;

  const [room, setRoom] = useState<CustomRoomData | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [messages, setMessages] = useState<RoomChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMusicPickerOpen, setIsMusicPickerOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: number; emoji: string; left: number }>>([]);

  // Local media states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // WebRTC Mesh Connections for all peers in the room
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Spawns floating reaction
  const triggerReaction = useCallback((emoji: string) => {
    const id = Date.now() + Math.random();
    const left = Math.floor(Math.random() * 60) + 20;
    setFloatingEmojis((prev) => [...prev, { id, emoji, left }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 2200);
  }, []);

  // WebRTC Peer Connection Factory for Room Mesh
  const createPeerConnection = useCallback((targetSocketId: string) => {
    if (peersRef.current.has(targetSocketId)) {
      return peersRef.current.get(targetSocketId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(targetSocketId, pc);

    // Attach local audio/video tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, localStreamRef.current!);
        } catch (e) {
          console.warn('Track addition error:', e);
        }
      });
    }

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket();
        socket.emit('custom-room-signal-ice', {
          targetSocketId,
          candidate: event.candidate
        });
      }
    };

    // Handle Incoming Remote Audio & Video Stream
    pc.ontrack = (event) => {
      const incomingStream = event.streams[0] || new MediaStream([event.track]);
      remoteStreamsRef.current.set(targetSocketId, incomingStream);
      setRemoteStreams((prev) => ({
        ...prev,
        [targetSocketId]: incomingStream
      }));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        peersRef.current.delete(targetSocketId);
        remoteStreamsRef.current.delete(targetSocketId);
        setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[targetSocketId];
          return next;
        });
      }
    };

    return pc;
  }, []);

  // Initialize Local Media (Camera, Mic or Virtual Avatar Fallback)
  useEffect(() => {
    let active = true;

    async function initMedia() {
      let stream: MediaStream | null = null;
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: { echoCancellation: true, noiseSuppression: true }
          });
        }
      } catch {
        // Fallback to audio only if camera is blocked or not available
        try {
          if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
            stream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: { echoCancellation: true, noiseSuppression: true }
            });
          }
        } catch {
          // If both fail, generate silent audio context stream for WebRTC negotiation
          try {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) {
              const audioCtx = new AudioCtx();
              const osc = audioCtx.createOscillator();
              const dst = audioCtx.createMediaStreamDestination();
              const gain = audioCtx.createGain();
              gain.gain.value = 0.0;
              osc.connect(gain);
              gain.connect(dst);
              osc.start();
              stream = dst.stream;
            }
          } catch (e) {
            console.warn('AudioContext fallback warning:', e);
          }
        }
      }

      if (!active) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      if (stream) {
        localStreamRef.current = stream;
        setLocalStream(stream);
        if (localVideoRef.current && stream.getVideoTracks().length > 0) {
          localVideoRef.current.srcObject = stream;
        }

        // Add tracks to any existing peer connections
        peersRef.current.forEach((pc) => {
          stream!.getTracks().forEach((track) => {
            pc.addTrack(track, stream!);
          });
        });
      }
    }

    initMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, []);

  // Socket Connection and WebRTC Mesh Signaling for Room
  useEffect(() => {
    const socket = getSocket(user?.id, user?.displayName);

    socket.emit('join-custom-room', {
      roomId,
      displayName: user?.displayName,
      avatarUrl: user?.avatarUrl,
      gender: user?.profile?.gender,
      region: user?.profile?.region
    });

    // 1. Room Joined: Initiate WebRTC offers to all existing peers in the room
    socket.on('custom-room-joined', async (data: { room: CustomRoomData; myMember: RoomMember }) => {
      setRoom(data.room);
      setMembers(data.room.members);
      soundManager.playMatchFound();
      try {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
      } catch {}

      // Initiate WebRTC peer connection to all existing members
      for (const m of data.room.members) {
        if (m.socketId !== socket.id) {
          try {
            const pc = createPeerConnection(m.socketId);
            const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
            await pc.setLocalDescription(offer);
            socket.emit('custom-room-signal-offer', {
              targetSocketId: m.socketId,
              sdp: offer
            });
          } catch (err) {
            console.warn('Error creating WebRTC offer for room peer:', err);
          }
        }
      }
    });

    // 2. Member Joined: Add to member list
    socket.on('custom-room-member-joined', (data: { member: RoomMember; memberCount: number }) => {
      setMembers((prev) => {
        if (prev.some((m) => m.socketId === data.member.socketId)) return prev;
        return [...prev, data.member];
      });
      soundManager.playPop();
    });

    // 3. WebRTC Offer Received: Answer caller
    socket.on('custom-room-signal-offer', async (data: { callerSocketId: string; sdp: RTCSessionDescriptionInit }) => {
      try {
        const pc = createPeerConnection(data.callerSocketId);
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('custom-room-signal-answer', {
          targetSocketId: data.callerSocketId,
          sdp: answer
        });
      } catch (err) {
        console.warn('Error answering room WebRTC offer:', err);
      }
    });

    // 4. WebRTC Answer Received: Set remote description
    socket.on('custom-room-signal-answer', async (data: { responderSocketId: string; sdp: RTCSessionDescriptionInit }) => {
      try {
        const pc = peersRef.current.get(data.responderSocketId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        }
      } catch (err) {
        console.warn('Error setting room WebRTC answer:', err);
      }
    });

    // 5. WebRTC ICE Candidate Received
    socket.on('custom-room-signal-ice', async (data: { senderSocketId: string; candidate: RTCIceCandidateInit }) => {
      try {
        const pc = peersRef.current.get(data.senderSocketId);
        if (pc && data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.warn('Error adding room ICE candidate:', err);
      }
    });

    // 6. Member Left: Cleanup WebRTC connection and member list
    socket.on('custom-room-member-left', (data: { socketId: string; displayName: string }) => {
      setMembers((prev) => prev.filter((m) => m.socketId !== data.socketId));
      const pc = peersRef.current.get(data.socketId);
      if (pc) {
        pc.close();
        peersRef.current.delete(data.socketId);
      }
      remoteStreamsRef.current.delete(data.socketId);
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[data.socketId];
        return next;
      });
      soundManager.playDisconnect();
    });

    // 7. Room Chat Message
    socket.on('custom-room-new-message', (msg: RoomChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      soundManager.playMessagePing();
    });

    // 8. Room Reaction
    socket.on('custom-room-new-reaction', (data: { emoji: string; senderName: string }) => {
      triggerReaction(data.emoji);
      soundManager.playPop();
    });

    // 9. Sync Bollywood Track
    socket.on('custom-room-track-changed', (data: { trackId: string; changedBy: string }) => {
      const trackIdx = tracks.findIndex((t) => t.id === data.trackId);
      if (trackIdx !== -1) {
        playTrack(trackIdx);
        soundManager.playStreak();
      }
    });

    // 10. Member Media State Change (Mute / Video Off)
    socket.on('custom-room-member-media-changed', (data: { socketId: string; isMuted?: boolean; isVideoOff?: boolean }) => {
      setMembers((prev) =>
        prev.map((m) => {
          if (m.socketId === data.socketId) {
            return {
              ...m,
              isMuted: typeof data.isMuted === 'boolean' ? data.isMuted : m.isMuted,
              isVideoOff: typeof data.isVideoOff === 'boolean' ? data.isVideoOff : m.isVideoOff
            };
          }
          return m;
        })
      );
    });

    socket.on('custom-room-error', (data: { message: string }) => {
      alert(data.message);
      router.push('/rooms');
    });

    return () => {
      socket.emit('leave-custom-room');
      socket.off('custom-room-joined');
      socket.off('custom-room-member-joined');
      socket.off('custom-room-member-left');
      socket.off('custom-room-signal-offer');
      socket.off('custom-room-signal-answer');
      socket.off('custom-room-signal-ice');
      socket.off('custom-room-new-message');
      socket.off('custom-room-new-reaction');
      socket.off('custom-room-track-changed');
      socket.off('custom-room-member-media-changed');
      socket.off('custom-room-error');

      // Close all peer connections
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      remoteStreamsRef.current.clear();
    };
  }, [roomId, user, tracks, playTrack, router, triggerReaction, createPeerConnection]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleToggleMic = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => (track.enabled = !nextState));
    }
    const socket = getSocket();
    socket.emit('custom-room-toggle-media', { isMuted: nextState });
  };

  const handleToggleVideo = () => {
    const nextState = !isVideoOff;
    setIsVideoOff(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => (track.enabled = !nextState));
    }
    const socket = getSocket();
    socket.emit('custom-room-toggle-media', { isVideoOff: nextState });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const socket = getSocket();
    socket.emit('custom-room-message', { content: chatInput.trim() });
    setChatInput('');
  };

  const handleSendReaction = (emoji: string) => {
    triggerReaction(emoji);
    soundManager.playPop();
    const socket = getSocket();
    socket.emit('custom-room-reaction', { emoji });
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      soundManager.playPop();
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSelectBollywoodTrack = (trackId: string) => {
    const trackIdx = tracks.findIndex((t) => t.id === trackId);
    if (trackIdx !== -1) {
      playTrack(trackIdx);
    }
    const socket = getSocket();
    socket.emit('custom-room-sync-track', { trackId });
    setIsMusicPickerOpen(false);
  };

  return (
    <div className="relative w-full min-h-screen h-[100dvh] bg-dark-surface overflow-hidden flex flex-col select-none text-foreground">
      {/* Floating Reactions Particles */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingEmojis.map((r) => (
          <div
            key={r.id}
            style={{ left: `${r.left}%` }}
            className="absolute bottom-20 text-3xl sm:text-4xl animate-float-fade"
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Top Room Header Bar */}
      <header className="px-3 sm:px-4 py-2 sm:py-2.5 glass-panel border-b border-white/10 flex items-center justify-between z-20 shrink-0 shadow-lg">
        {/* Left: Logo & Room Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <TimepassLogo size="sm" showTagline={false} />

          {room && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="hidden xs:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/30 shrink-0">
                {room.category}
              </span>
              <div className="truncate min-w-0">
                <h2 className="text-xs sm:text-sm font-black text-white truncate max-w-[140px] xs:max-w-[200px] sm:max-w-[280px]">
                  {room.name}
                </h2>
                <div className="text-[10px] text-gray-400 truncate">
                  {room.isSystemRoom || !room.hostName ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Official Public Lounge</span>
                    </span>
                  ) : (
                    <span>Created by <strong className="text-pink-300">{room.hostName}</strong></span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Member count, Invite, Bollywood DJ & Leave */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Member Count Pill (Max 8) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-white">
              {members.length}/8
            </span>
            <span className="hidden md:inline text-[10px] text-gray-400 font-medium">Members</span>
          </div>

          {/* Sync Bollywood DJ Music Button */}
          <button
            type="button"
            onClick={() => setIsMusicPickerOpen(!isMusicPickerOpen)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 text-xs font-bold border border-pink-500/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            title="Pick a Bollywood track for the entire room"
          >
            <Music2 className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span className="hidden sm:inline">Room DJ</span>
          </button>

          {/* Copy Invite Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1 transition-all"
            title="Copy invite link to share with friends"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Invite'}</span>
          </button>

          {/* Leave Room Button */}
          <button
            type="button"
            onClick={() => router.push('/rooms')}
            className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-black flex items-center gap-1 shadow-md shadow-red-600/20 transition-all active:scale-95"
            title="Leave this room"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* Main Room Arena: 8-Member Grid + Side Chat */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* 8-Member Grid Area (Adaptive Viewport Fit for Mobile & Desktop) */}
        <div className="flex-1 p-2 sm:p-4 flex flex-col justify-between min-h-0 overflow-hidden">
          {/* Synchronized Room DJ Banner */}
          <div className="mb-1.5 sm:mb-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/20 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 truncate min-w-0">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse shrink-0" />
              <span className="text-[10px] sm:text-xs text-pink-300 font-bold truncate">
                🎵 Room Audio &amp; Video Live for all 8 members · Tap Room DJ to sync tracks!
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
              HD WebRTC Connected
            </span>
          </div>

          {/* Grid of up to 8 Member Tiles (Fits any screen height without scroll) */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 grid-rows-4 md:grid-rows-2 gap-1.5 sm:gap-3 items-stretch justify-center min-h-0 overflow-hidden py-0.5">
            {members.map((member, idx) => {
              const isSelf = member.userId === user?.id || member.socketId === getSocket().id;
              const remoteStream = remoteStreams[member.socketId];
              const hasVideo = isSelf ? (!isVideoOff && localStream?.getVideoTracks().length) : (!member.isVideoOff && remoteStream?.getVideoTracks().length);

              return (
                <div
                  key={member.socketId || idx}
                  className="relative w-full h-full min-h-0 rounded-xl sm:rounded-3xl glass-panel border border-white/10 overflow-hidden flex flex-col items-center justify-center p-1 sm:p-3 shadow-lg group hover:border-pink-500/40 transition-all"
                >
                  {/* Real Live Video Stream (Local or Remote) */}
                  {hasVideo ? (
                    <video
                      autoPlay
                      playsInline
                      muted={isSelf} // Only mute self to avoid echo; remote audio plays aloud
                      ref={(el) => {
                        if (!el) return;
                        if (isSelf && localStream) {
                          if (el.srcObject !== localStream) el.srcObject = localStream;
                        } else if (!isSelf && remoteStream) {
                          if (el.srcObject !== remoteStream) el.srcObject = remoteStream;
                        }
                      }}
                      className={`absolute inset-0 w-full h-full object-cover ${isSelf ? 'mirror-video' : ''}`}
                    />
                  ) : (
                    /* Avatar with voice pulsing ring */
                    <div className="relative flex flex-col items-center justify-center text-center z-10 scale-90 sm:scale-100">
                      {/* Hidden audio element for remote member when video is off so voice still plays */}
                      {!isSelf && remoteStream && (
                        <audio
                          autoPlay
                          playsInline
                          ref={(el) => {
                            if (el && el.srcObject !== remoteStream) el.srcObject = remoteStream;
                          }}
                        />
                      )}
                      <div className="relative w-10 h-10 xs:w-14 xs:h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm xs:text-lg sm:text-2xl shadow-xl shadow-pink-500/25 border-2 border-white/20">
                        {member.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.avatarUrl}
                            alt={member.displayName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          member.displayName.charAt(0).toUpperCase()
                        )}
                        {!member.isMuted && (
                          <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Top-Right Mic Indicator */}
                  <div className="absolute top-1.5 sm:top-2.5 right-1.5 sm:right-2.5 z-20">
                    <span
                      className={`p-1 sm:p-1.5 rounded-lg flex items-center justify-center ${
                        member.isMuted
                          ? 'bg-red-500/80 text-white'
                          : 'bg-black/60 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {member.isMuted ? <MicOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <Mic className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                    </span>
                  </div>

                  {/* Bottom Member Identity Banner */}
                  <div className="absolute bottom-1 sm:bottom-2 inset-x-1 sm:inset-x-2 z-20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-between text-[9px] sm:text-[11px] truncate">
                    <div className="flex items-center gap-1 sm:gap-1.5 truncate">
                      {member.isHost && (
                        <span title="Room Host">
                          <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 shrink-0" />
                        </span>
                      )}
                      <span className="font-bold text-white truncate max-w-[70px] xs:max-w-[100px] sm:max-w-[120px]">
                        {member.displayName} {isSelf && '(You)'}
                      </span>
                    </div>

                    <span className="text-[8px] sm:text-[9px] text-gray-400 shrink-0 hidden xs:inline">
                      📍 {member.region || 'India'}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Empty Member Slots (up to 8) to show room capacity */}
            {Array.from({ length: Math.max(0, 8 - members.length) }).map((_, idx) => (
              <div
                key={`empty_${idx}`}
                className="w-full h-full min-h-0 rounded-xl sm:rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center p-1 sm:p-3 text-center text-gray-500 hover:border-pink-500/20 transition-colors"
              >
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-600 mb-0.5 sm:mb-1">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400">Slot {members.length + idx + 1}/8</span>
                <span className="text-[8px] sm:text-[9px] text-gray-500 hidden xs:inline">Waiting for member...</span>
              </div>
            ))}
          </div>

          {/* Quick Floating Reactions Bar for the Room */}
          <div className="mt-1 sm:mt-2 py-1 sm:py-1.5 px-2 sm:px-3 rounded-2xl glass-toolbar border border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-1 hidden sm:inline">React:</span>
              {COMMON_REACTIONS.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => handleSendReaction(r.emoji)}
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-white/5 hover:bg-white/15 text-xs sm:text-sm hover:scale-125 active:scale-95 transition-all"
                  title={r.label}
                >
                  {r.emoji}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="px-2.5 sm:px-3 py-1 rounded-xl gradient-button text-white text-[11px] sm:text-xs font-bold flex items-center gap-1 shadow-md shadow-pink-500/20 md:hidden"
            >
              <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Chat ({messages.length})</span>
            </button>
          </div>
        </div>

        {/* Room Side Group Chat Panel (Desktop: side panel, Mobile: slide-over drawer) */}
        <div
          className={`fixed inset-y-0 right-0 z-40 w-80 max-w-[85vw] glass-panel border-l border-white/10 flex flex-col transition-transform duration-300 ${
            isChatOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:static md:w-80 shrink-0'
          }`}
        >
          {/* Chat Header */}
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-pink-400" />
              <h3 className="text-xs font-black text-white">Group Room Chat</h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-pink-500/20 text-pink-300 font-bold">
                {messages.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsChatOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Simple Clean Chat Messages Stream */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-2">
                <Users className="w-8 h-8 text-pink-500/40" />
                <p className="text-xs font-bold text-gray-300">Welcome to the squad room!</p>
                <p className="text-[11px] text-gray-400 max-w-[200px] leading-relaxed">
                  Send messages to everyone in this room, react with emojis, or sync a Bollywood hit together!
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="flex flex-col">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[10px] font-black text-pink-300 truncate max-w-[120px]">
                      {m.senderName}
                    </span>
                    <span className="text-[8px] text-gray-500">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-white break-words leading-relaxed">
                    {m.content}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-2.5 border-t border-white/10 flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Message room members..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-pink-500"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2 rounded-xl gradient-button text-white disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Floating Bottom Room Toolbar */}
      <footer className="p-1.5 xs:p-2 sm:p-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-white/10 glass-panel flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-3 z-30 shrink-0">
        {/* Mic Toggle */}
        <button
          type="button"
          onClick={handleToggleMic}
          className={`p-2 xs:p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
            isMuted
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'bg-white/10 hover:bg-white/15 text-white'
          }`}
          title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
          <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Mute'}</span>
        </button>

        {/* Video Toggle */}
        <button
          type="button"
          onClick={handleToggleVideo}
          className={`p-2 xs:p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
            isVideoOff
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'bg-white/10 hover:bg-white/15 text-white'
          }`}
          title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isVideoOff ? <VideoOff className="w-4 h-4" /> : <VideoIcon className="w-4 h-4 text-pink-400" />}
          <span className="hidden sm:inline">{isVideoOff ? 'Video Off' : 'Video On'}</span>
        </button>

        {/* Room DJ Music Sync Trigger */}
        <button
          type="button"
          onClick={() => setIsMusicPickerOpen(true)}
          className="p-2 xs:p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-pink-500/20 text-pink-300 font-bold text-xs flex items-center gap-1.5 border border-pink-500/30 hover:bg-pink-500/30 transition-all hover:scale-105"
        >
          <Music2 className="w-4 h-4 text-pink-400" />
          <span className="hidden sm:inline">Sync Bollywood DJ</span>
        </button>

        {/* Copy Invite Link */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="p-2 xs:p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-bold text-xs flex items-center gap-1.5 transition-all"
        >
          {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{copiedLink ? 'Link Copied!' : 'Share Room'}</span>
        </button>

        {/* Leave Room */}
        <button
          type="button"
          onClick={() => router.push('/rooms')}
          className="p-2 xs:p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-all active:scale-95"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden xs:inline">Leave Room</span>
        </button>
      </footer>

      {/* Synchronized Bollywood Music Picker Modal */}
      {isMusicPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-panel w-full max-w-md p-5 rounded-3xl border border-pink-500/40 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Music2 className="w-4 h-4 text-pink-400" />
                <h3 className="text-sm font-black text-white">Select Song to Play For All 8 Members</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMusicPickerOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handleSelectBollywoodTrack(track.id)}
                  className="w-full p-2.5 rounded-2xl bg-white/5 hover:bg-pink-500/20 border border-white/5 hover:border-pink-500/40 flex items-center gap-3 transition-all text-left group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={track.thumbnail}
                    alt={track.title}
                    className="w-10 h-10 rounded-xl object-cover border border-pink-500/40 group-hover:scale-105 transition-transform"
                  />
                  <div className="truncate flex-1">
                    <p className="text-xs font-black text-white group-hover:text-pink-300 transition-colors truncate">
                      {track.title}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {track.movie} · {track.singer}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-pink-400 px-2 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 shrink-0">
                    Play in Room
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
