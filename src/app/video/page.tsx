'use client';

import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  SkipForward, 
  MessageSquare, 
  ShieldAlert, 
  Settings, 
  Maximize2, 
  Minimize2, 
  Camera, 
  AlertCircle,
  Home,
  UserPlus,
  Radio,
  Sparkles,
  RotateCw,
  Users,
  X,
  Chrome
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getSocket } from '@/lib/socket';
import { WebRTCManager } from '@/lib/webrtc';
import { soundManager } from '@/lib/sound';
import { CallState, ChatMessage, MatchPartner } from '@/lib/types';
import VideoPlayer from '@/components/VideoPlayer';
import CallControls from '@/components/CallControls';
import ChatDrawer from '@/components/ChatDrawer';
import ReportModal from '@/components/ReportModal';
import MatchingRadar from '@/components/MatchingRadar';
import DeviceSettingsModal from '@/components/DeviceSettingsModal';
import AuthModal from '@/components/AuthModal';

function VideoChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Filter preferences from URL query
  const interests = searchParams.get('interests')?.split(',').filter(Boolean) || [];
  const language = searchParams.get('language') || 'English';
  const country = searchParams.get('country') || 'Global (Any)';
  const requestedMode = searchParams.get('mode');

  // Call States
  const [callState, setCallState] = useState<CallState>('idle');
  const [partner, setPartner] = useState<MatchPartner | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'Excellent' | 'Good' | 'Reconnecting'>('Good');

  // Media States
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callMode, setCallMode] = useState<'video' | 'audio'>(requestedMode === 'audio' ? 'audio' : 'video');
  const [layoutMode, setLayoutMode] = useState<'split' | 'pip'>('split');
  const [isLocalMinimized, setIsLocalMinimized] = useState(false);
  const [isPartnerMuted, setIsPartnerMuted] = useState(false);
  const [isPartnerVideoOff, setIsPartnerVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAvatarMode, setIsAvatarMode] = useState(false);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [systemAnnouncement, setSystemAnnouncement] = useState<{ title: string; message: string } | null>(null);

  // Chat & Modals
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [friendAdded, setFriendAdded] = useState(false);

  // Refs for instances
  const webrtcRef = useRef<WebRTCManager | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const partnerIdRef = useRef<string | null>(null);

  // Initialize WebRTC Manager
  useEffect(() => {
    const rtc = new WebRTCManager(
      // On Remote Stream Received
      (stream) => {
        setRemoteStream(stream);
        setCallState('connected');
        soundManager.playMatchFound();
      },
      // On Connection State Change
      (state) => {
        if (state === 'connected') {
          setCallState('connected');
          setConnectionQuality('Excellent');
        } else if (state === 'connecting') {
          setCallState('connecting');
          setConnectionQuality('Good');
        } else if (state === 'disconnected' || state === 'failed') {
          setConnectionQuality('Reconnecting');
        }
      },
      // On Local ICE Candidate
      (candidate) => {
        const socket = getSocket();
        if (socket?.connected) {
          socket.emit('signal-ice-candidate', { candidate });
        }
      }
    );

    webrtcRef.current = rtc;

    return () => {
      rtc.stopAll();
    };
  }, []);

  // Initialize Camera Media and Join Matchmaking Queue
  const startVideoSession = useCallback(async () => {
    if (!webrtcRef.current) return;

    try {
      setCallState('permission_requested');
      setErrorMessage(null);

      // Acquire camera and microphone with progressive step-downs
      const stream = await webrtcRef.current.getLocalMedia();
      setLocalStream(stream);
      setIsAvatarMode(webrtcRef.current.isAvatarMode);

      // Join socket queue
      const socket = getSocket(user?.id, user?.displayName);
      socket.emit('join-queue', {
        mode: 'video',
        interests,
        languages: [language],
        country,
        gender: user?.profile?.gender,
        region: user?.profile?.region,
        userId: user?.id,
        displayName: user?.displayName,
        avatarUrl: user?.avatarUrl,
        previousPartnerId: partnerIdRef.current || undefined,
      });

      setCallState('searching');
    } catch (err: unknown) {
      console.warn('Physical camera/mic fallback triggered:', err);
      try {
        // Seamlessly continue in Live Avatar Mode so call never fails
        const avatarStream = await webrtcRef.current.getAvatarMedia(
          user?.displayName || 'TIMEPASS User',
          user?.avatarUrl
        );
        setLocalStream(avatarStream);
        setIsAvatarMode(true);

        const socket = getSocket(user?.id, user?.displayName);
        socket.emit('join-queue', {
          mode: 'video',
          interests,
          languages: [language],
          country,
          gender: user?.profile?.gender,
          region: user?.profile?.region,
          userId: user?.id,
          displayName: user?.displayName,
          avatarUrl: user?.avatarUrl,
          previousPartnerId: partnerIdRef.current || undefined,
        });

        setCallState('searching');
      } catch (avatarErr) {
        setCallState('permission_denied');
        setErrorMessage('Unable to initialize media. Please refresh the page or tap below to retry.');
      }
    }
  }, [user, interests, language, country]);

  // Virtual Avatar Mode Handler (Unblocks users without webcam or on mobile HTTP)
  const handleContinueAvatarMode = useCallback(async () => {
    if (!webrtcRef.current) return;

    try {
      setCallState('permission_requested');
      setErrorMessage(null);

      // Generate virtual animated avatar stream (with mic if available, else synthetic silent baseline)
      const stream = await webrtcRef.current.getAvatarMedia(
        user?.displayName || 'TIMEPASS User',
        user?.avatarUrl
      );
      setLocalStream(stream);
      setIsAvatarMode(true);

      // Join socket queue
      const socket = getSocket(user?.id, user?.displayName);
      socket.emit('join-queue', {
        mode: 'video',
        interests,
        languages: [language],
        country,
        gender: user?.profile?.gender,
        region: user?.profile?.region,
        userId: user?.id,
        displayName: user?.displayName,
        avatarUrl: user?.avatarUrl,
        previousPartnerId: partnerIdRef.current || undefined,
      });

      setCallState('searching');
    } catch (err: unknown) {
      console.error('Failed to start avatar mode:', err);
      setCallState('permission_denied');
      setErrorMessage('Could not initialize avatar stream. Please try reloading the page.');
    }
  }, [user, interests, language, country]);

  // Dynamic Switch to Real Camera during active call
  const handleSwitchToRealCamera = async () => {
    if (!webrtcRef.current) return;
    setIsSwitchingCamera(true);
    try {
      const success = await webrtcRef.current.switchToRealCamera();
      if (success && webrtcRef.current.localStream) {
        setLocalStream(webrtcRef.current.localStream);
        setIsAvatarMode(false);
      } else {
        alert('Could not access real camera. Please check your browser address bar permissions.');
      }
    } catch (e) {
      console.error('Camera switch error:', e);
    } finally {
      setIsSwitchingCamera(false);
    }
  };

  // Start immediately on page mount once authenticated (either avatar mode or video mode)
  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (requestedMode === 'avatar') {
      handleContinueAvatarMode();
    } else {
      startVideoSession();
    }
  }, [loading, user, requestedMode, handleContinueAvatarMode, startVideoSession]);

  // Socket Event Handlers
  useEffect(() => {
    const socket = getSocket();

    // 1. Match Found
    socket.on('match-found', async (data: {
      roomId: string;
      initiator: boolean;
      partner: MatchPartner;
    }) => {
      setPartner(data.partner);
      partnerIdRef.current = data.partner.id;
      setCallState('connecting');
      setMessages([]);
      setFriendAdded(false);

      // Trigger celebratory confetti on match
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#6366f1', '#a855f7', '#38bdf8']
        });
      } catch {
        // Confetti fallback
      }

      soundManager.playMatchFound();

      if (!webrtcRef.current) return;

      // Initialize peer connection with local media tracks
      webrtcRef.current.initPeerConnection();

      if (data.initiator) {
        // Create WebRTC Offer
        try {
          const offer = await webrtcRef.current.createOffer();
          socket.emit('signal-offer', { sdp: offer, roomId: data.roomId });
        } catch (err) {
          console.error('Error creating offer:', err);
        }
      }
    });

    // 2. Signal Offer Received
    socket.on('signal-offer', async (data: { sdp: RTCSessionDescriptionInit }) => {
      if (!webrtcRef.current) return;
      try {
        const answer = await webrtcRef.current.createAnswer(data.sdp);
        socket.emit('signal-answer', { sdp: answer });
      } catch (err) {
        console.error('Error answering offer:', err);
      }
    });

    // 3. Signal Answer Received
    socket.on('signal-answer', async (data: { sdp: RTCSessionDescriptionInit }) => {
      if (!webrtcRef.current) return;
      try {
        await webrtcRef.current.handleRemoteAnswer(data.sdp);
      } catch (err) {
        console.error('Error setting remote answer:', err);
      }
    });

    // 4. Remote ICE Candidate
    socket.on('signal-ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      if (!webrtcRef.current) return;
      await webrtcRef.current.addIceCandidate(data.candidate);
    });

    // 5. Partner Left / Disconnected
    socket.on('partner-left', (data: { reason?: string }) => {
      soundManager.playDisconnect();
      setRemoteStream(null);
      setCallState('disconnected');
      if (webrtcRef.current) {
        webrtcRef.current.closePeerConnection();
      }
    });

    // 6. Partner Media State (Camera/Mic Toggles)
    socket.on('partner-media-state', (data: { cameraOff?: boolean; micMuted?: boolean }) => {
      if (data.cameraOff !== undefined) setIsPartnerVideoOff(data.cameraOff);
      if (data.micMuted !== undefined) setIsPartnerMuted(data.micMuted);
    });

    // 7. Text Messages
    socket.on('receive-message', (data: { id: string; senderId: string; senderName: string; content: string; timestamp: string }) => {
      const msg: ChatMessage = { ...data, isSelf: false };
      setMessages((prev) => [...prev, msg]);
      soundManager.playMessagePing();
      if (!isChatOpen) {
        setUnreadCount((c) => c + 1);
      }
    });

    socket.on('message-sent', (data: { id: string; senderId: string; senderName: string; content: string; timestamp: string }) => {
      const msg: ChatMessage = { ...data, isSelf: true };
      setMessages((prev) => [...prev, msg]);
    });

    // 8. Partner Typing
    socket.on('partner-typing', (data: { isTyping: boolean }) => {
      setIsPartnerTyping(data.isTyping);
    });

    // 9. Requeue trigger after NEXT
    socket.on('trigger-requeue', (data: { previousPartnerId?: string }) => {
      if (data.previousPartnerId) {
        partnerIdRef.current = data.previousPartnerId;
      }
      setPartner(null);
      setRemoteStream(null);
      setCallState('searching');

      socket.emit('join-queue', {
        mode: 'video',
        interests,
        languages: [language],
        country,
        gender: user?.profile?.gender,
        region: user?.profile?.region,
        userId: user?.id,
        displayName: user?.displayName,
        avatarUrl: user?.avatarUrl,
        previousPartnerId: partnerIdRef.current || undefined,
      });
    });

    // 10. Admin Disconnect / Kick
    socket.on('admin-kick', (data: { reason?: string }) => {
      alert(data.reason || 'You have been disconnected by administrator.');
      router.push('/');
    });

    // 11. Live System Announcement
    socket.on('system-announcement', (data: { title: string; message: string }) => {
      setSystemAnnouncement(data);
      soundManager.playNotification();
      setTimeout(() => setSystemAnnouncement(null), 8000);
    });

    return () => {
      socket.off('match-found');
      socket.off('signal-offer');
      socket.off('signal-answer');
      socket.off('signal-ice-candidate');
      socket.off('partner-left');
      socket.off('partner-media-state');
      socket.off('receive-message');
      socket.off('message-sent');
      socket.off('partner-typing');
      socket.off('trigger-requeue');
      socket.off('admin-kick');
      socket.off('system-announcement');
    };
  }, [isChatOpen, interests, language, country, user]);

  // NEXT Button Handler
  const handleNext = () => {
    soundManager.playDisconnect();
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('call-next', {
        interests,
        languages: [language],
        country
      });
    }

    if (webrtcRef.current) {
      webrtcRef.current.closePeerConnection();
    }
    setRemoteStream(null);
    setPartner(null);
    setCallState('searching');
  };

  // Keyboard shortcut: pressing Escape triggers NEXT
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && callState !== 'searching') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callState]);

  // END CALL Handler
  const handleEndCall = () => {
    soundManager.playDisconnect();
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('call-end');
    }
    if (webrtcRef.current) {
      webrtcRef.current.stopAll();
    }
    router.push('/');
  };

  // Media Toggle Handlers: Instant 1-Click Turn On or Off
  const handleToggleMic = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (webrtcRef.current) {
      webrtcRef.current.toggleAudio(!nextMuted);
    }
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('media-state-change', { micMuted: nextMuted });
    }
  };

  const handleToggleVideo = () => {
    const nextVideoOff = !isVideoOff;
    setIsVideoOff(nextVideoOff);
    if (webrtcRef.current) {
      webrtcRef.current.toggleVideo(!nextVideoOff);
    }
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('media-state-change', { cameraOff: nextVideoOff });
    }
  };

  // Switch between Video Call and Audio Call
  const handleSwitchMode = (newMode: 'video' | 'audio') => {
    setCallMode(newMode);
    const nextVideoOff = newMode === 'audio';
    setIsVideoOff(nextVideoOff);

    if (webrtcRef.current) {
      webrtcRef.current.toggleVideo(!nextVideoOff);
    }

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('media-state-change', { cameraOff: nextVideoOff });
    }
  };

  const handleSwitchCamera = async () => {
    if (!webrtcRef.current) return;
    await webrtcRef.current.switchCamera();
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleSendMessage = (content: string) => {
    const socket = getSocket();
    socket.emit('send-message', { content });
  };

  const handleTyping = (isTyping: boolean) => {
    const socket = getSocket();
    socket.emit('typing', { isTyping });
  };

  const handleSubmitReport = (reason: string, details: string) => {
    if (!partner) return;
    const socket = getSocket();
    socket.emit('report-user', {
      reportedUserId: partner.id,
      reason,
      details,
    });
    handleNext();
  };

  const handleAddFriend = async () => {
    if (!partner || !user) return;
    try {
      const res = await fetch('/api/profile/friends/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('timepass_token')}`
        },
        body: JSON.stringify({ friendUserId: partner.id })
      });
      if (res.ok) {
        setFriendAdded(true);
      }
    } catch {
      // Offline fallback
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen h-[100dvh] bg-black overflow-hidden flex flex-col select-none"
    >
      {/* Top Header Bar with Audio/Video Mode Selector & Layout Toggle */}
      <div className="absolute top-0 left-0 right-0 z-30 px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-xl glass-toolbar text-white hover:bg-white/10 transition-colors shadow"
            title="Return to Home"
          >
            <Home className="w-4 h-4" />
          </button>
          <div className="hidden xs:flex items-center gap-1.5 px-3 py-1 rounded-full glass-toolbar text-xs font-bold text-white shadow">
            <span>TIME</span>
            <span className="gradient-text">PASS</span>
          </div>
        </div>

        {/* PROMINENT AUDIO / VIDEO MODE SELECTOR (Both options clearly available) */}
        <div className="flex items-center bg-black/70 backdrop-blur-xl rounded-2xl p-1 border border-white/15 pointer-events-auto shadow-2xl">
          <button
            type="button"
            onClick={() => handleSwitchMode('video')}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl font-black text-[11px] sm:text-xs flex items-center gap-1.5 transition-all ${
              callMode === 'video'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Video Call Mode (Camera & Microphone Always On)"
          >
            <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-300" />
            <span>Video Call</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('audio')}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl font-black text-[11px] sm:text-xs flex items-center gap-1.5 transition-all ${
              callMode === 'audio'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Audio Call Mode (Voice-Only, Camera Paused)"
          >
            <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300" />
            <span>Audio Call</span>
          </button>
        </div>

        {/* Right Header Actions: Layout Switcher & Add Friend */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Layout Toggle: Split View vs Focus PiP View */}
          <button
            type="button"
            onClick={() => setLayoutMode(layoutMode === 'split' ? 'pip' : 'split')}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl glass-toolbar text-white text-xs font-bold hover:bg-white/10 transition-colors flex items-center gap-1 shadow"
            title={layoutMode === 'split' ? 'Switch to Focus/PiP View' : 'Switch to Equal Split View'}
          >
            {layoutMode === 'split' ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-pink-400" />
                <span className="hidden md:inline">Focus</span>
              </>
            ) : (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-pink-400" />
                <span className="hidden md:inline">Split</span>
              </>
            )}
          </button>

          {partner && callState === 'connected' && (
            <div>
              {!friendAdded ? (
                <button
                  onClick={handleAddFriend}
                  className="px-2.5 sm:px-3 py-1.5 rounded-full glass-toolbar text-xs font-medium text-white hover:bg-pink-500/30 flex items-center gap-1.5 transition-colors shadow"
                >
                  <UserPlus className="w-3.5 h-3.5 text-pink-400" />
                  <span className="hidden sm:inline">Add Friend</span>
                </button>
              ) : (
                <span className="px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                  Friend Added!
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Live System Announcement Banner */}
      {systemAnnouncement && (
        <div className="absolute top-14 inset-x-3 sm:inset-x-8 z-40 p-3 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white shadow-2xl shadow-pink-500/30 flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📢</span>
            <div>
              <p className="text-xs font-black">{systemAnnouncement.title}</p>
              <p className="text-[11px] opacity-90">{systemAnnouncement.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSystemAnnouncement(null)}
            className="p-1 rounded-lg hover:bg-white/20 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Calling Stage: Symmetrical, Balanced Dual-Feed Layout with Proper Alignment */}
      <div className="flex-1 relative flex overflow-hidden pt-12 sm:pt-14 pb-20 sm:pb-24 px-2 sm:px-4">
        {layoutMode === 'split' ? (
          /* PROPER BALANCED SPLIT ALIGNMENT: 50% Stranger (Left/Top) + 50% You (Right/Bottom) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4 w-full h-full max-w-7xl mx-auto">
            {/* Box 1: Stranger Feed / Radar State */}
            <div className={`relative w-full h-full min-h-[220px] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-neutral-950 flex items-center justify-center transition-all ${
              isLocalMinimized ? 'md:col-span-2' : ''
            }`}>
              {callState === 'connected' || callState === 'connecting' ? (
                <VideoPlayer
                  stream={remoteStream}
                  isLocal={false}
                  isMuted={isPartnerMuted}
                  isVideoOff={isPartnerVideoOff || callMode === 'audio'}
                  displayName={partner?.displayName || 'Connecting with Stranger...'}
                  avatarUrl={partner?.avatarUrl}
                  gender={partner?.gender}
                  region={partner?.region}
                  country={partner?.country}
                  qualityBadge={connectionQuality}
                  callMode={callMode}
                />
              ) : callState === 'searching' ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-purple-950/40 via-neutral-950 to-pink-950/40">
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center mb-3 sm:mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-pink-500/30 animate-ping" />
                    <div className="absolute inset-2 rounded-full border border-purple-500/40 animate-pulse" />
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-pink-500/30">
                      {callMode === 'video' ? <Video className="w-8 h-8 sm:w-10 sm:h-10" /> : <Mic className="w-8 h-8 sm:w-10 sm:h-10" />}
                    </div>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-white mb-1">
                    {callMode === 'video' ? 'Finding a Video Partner...' : 'Finding a Voice Partner...'}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-gray-400 max-w-xs mb-3">
                    Matching you with genuine chatters based on your preferences
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-[10px] font-bold text-pink-300">
                      ⚡ Instant Match
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-[10px] font-bold text-purple-300">
                      {callMode === 'video' ? '📹 Video Enabled' : '🎙️ Voice Only'}
                    </span>
                  </div>
                </div>
              ) : callState === 'disconnected' ? (
                <div className="max-w-xs p-6 rounded-2xl text-center">
                  <h3 className="text-base font-black text-white mb-1">Partner Left</h3>
                  <p className="text-xs text-gray-400 mb-4">The other chatter disconnected.</p>
                  <button
                    onClick={handleNext}
                    className="w-full py-2.5 px-4 rounded-xl gradient-button text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30"
                  >
                    <span>Find Next Person</span>
                    <SkipForward className="w-4 h-4 fill-current" />
                  </button>
                </div>
              ) : (
                <div className="text-center p-6 text-gray-400 text-xs">
                  <p>Ready to connect</p>
                </div>
              )}
            </div>

            {/* Box 2: Your Live Video Feed (ALWAYS ON in Video Call!) */}
            {isLocalMinimized ? (
              <div className="absolute bottom-24 sm:bottom-28 right-4 sm:right-8 z-30 pointer-events-auto">
                <VideoPlayer
                  stream={localStream}
                  isLocal={true}
                  isMuted={isMuted}
                  isVideoOff={isVideoOff || callMode === 'audio'}
                  displayName={user?.displayName ? `${user.displayName} (You)` : 'You'}
                  avatarUrl={user?.avatarUrl}
                  gender={user?.profile?.gender}
                  region={user?.profile?.region}
                  callMode={callMode}
                  isMinimized={true}
                  onToggleMinimize={() => setIsLocalMinimized(false)}
                />
              </div>
            ) : (
              <div className="relative w-full h-full min-h-[220px] rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-pink-500/30 shadow-2xl bg-neutral-950 flex items-center justify-center">
                <VideoPlayer
                  stream={localStream}
                  isLocal={true}
                  isMuted={isMuted}
                  isVideoOff={isVideoOff || callMode === 'audio'}
                  displayName={user?.displayName ? `${user.displayName} (You)` : 'You'}
                  avatarUrl={user?.avatarUrl}
                  gender={user?.profile?.gender}
                  region={user?.profile?.region}
                  callMode={callMode}
                  isMinimized={false}
                  onToggleMinimize={() => setIsLocalMinimized(true)}
                />
                {isAvatarMode && callMode === 'video' && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 z-20">
                    <button
                      onClick={handleSwitchToRealCamera}
                      disabled={isSwitchingCamera}
                      className="px-2.5 py-1 rounded-xl bg-black/80 hover:bg-black backdrop-blur-md text-[10px] font-bold text-white border border-pink-500/40 transition-all flex items-center gap-1.5 shadow-lg"
                      title="Switch to Real Camera"
                    >
                      <Camera className="w-3 h-3 text-pink-400" />
                      <span>{isSwitchingCamera ? 'Connecting...' : 'Real Camera'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* FOCUS / THEATER VIEW: Large Remote Stage + Floating Local PiP */
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <div className="w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-neutral-950">
              <VideoPlayer
                stream={remoteStream}
                isLocal={false}
                isMuted={isPartnerMuted}
                isVideoOff={isPartnerVideoOff || callMode === 'audio'}
                displayName={partner?.displayName || (callState === 'searching' ? 'Searching...' : 'Stranger')}
                avatarUrl={partner?.avatarUrl}
                gender={partner?.gender}
                region={partner?.region}
                country={partner?.country}
                qualityBadge={connectionQuality}
                callMode={callMode}
              />
            </div>

            {/* Floating PiP (Local Camera) */}
            <div className={`absolute ${
              isLocalMinimized
                ? 'bottom-24 sm:bottom-28 right-4 sm:right-8 w-auto'
                : 'top-4 sm:top-auto sm:bottom-4 right-3 sm:right-6 w-28 xs:w-36 sm:w-56 aspect-[3/4] sm:aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-pink-500/40'
            } z-20 backdrop-blur-md hover:scale-105 transition-all`}>
              <VideoPlayer
                stream={localStream}
                isLocal={true}
                isMuted={isMuted}
                isVideoOff={isVideoOff || callMode === 'audio'}
                displayName={user?.displayName ? `${user.displayName} (You)` : 'You'}
                avatarUrl={user?.avatarUrl}
                gender={user?.profile?.gender}
                region={user?.profile?.region}
                callMode={callMode}
                isMinimized={isLocalMinimized}
                onToggleMinimize={() => setIsLocalMinimized(!isLocalMinimized)}
              />
            </div>
          </div>
        )}

        {/* In-Call Text Chat Drawer */}
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={messages}
          onSendMessage={handleSendMessage}
          isPartnerTyping={isPartnerTyping}
          onTyping={handleTyping}
          sharedInterests={partner?.sharedInterests}
          partnerName={partner?.displayName || 'Stranger'}
        />
      </div>

      {/* Floating Call Control Toolbar */}
      <div className="absolute bottom-3 sm:bottom-5 left-0 right-0 z-30 pointer-events-auto px-2 sm:px-4 flex justify-center pb-[env(safe-area-inset-bottom,0px)]">
        <CallControls
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isFullscreen={isFullscreen}
          isChatOpen={isChatOpen}
          unreadCount={unreadCount}
          onToggleMic={handleToggleMic}
          onToggleVideo={handleToggleVideo}
          onSwitchCamera={handleSwitchCamera}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleChat={() => {
            setIsChatOpen(!isChatOpen);
            setUnreadCount(0);
          }}
          onNext={handleNext}
          onEndCall={handleEndCall}
          onOpenReport={() => setIsReportOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Report Modal */}
      {partner && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          reportedUserId={partner.id}
          partnerName={partner.displayName}
          onSubmitReport={handleSubmitReport}
        />
      )}

      {/* Hardware Device Settings Modal */}
      <DeviceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* STRICT AUTHENTICATION GATE: User must login through Gmail or Email */}
      {!user && !loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in">
          <div className="max-w-md w-full glass-panel p-6 sm:p-8 rounded-3xl border border-pink-500/30 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center mx-auto text-white shadow-lg shadow-pink-500/30">
              <Video className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Sign In Required</h3>
              <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                To keep TIMEPASS safe and genuine, 1-on-1 video calls and chat are exclusively available to users signed in with a Gmail or Email account.
              </p>
            </div>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white font-black text-sm shadow-xl shadow-pink-500/30 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Chrome className="w-4 h-4" />
              <span>Sign In with Gmail or Email</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal for Video Chat Gate */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        promptMessage="Sign in with Gmail or Email to unlock 1-on-1 video calls"
        onSuccess={() => {
          setIsAuthOpen(false);
        }}
      />
    </div>
  );
}

export default function VideoChatPage() {
  return (
    <Suspense fallback={
      <div className="w-screen h-screen bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Loading TIMEPASS Video...</p>
        </div>
      </div>
    }>
      <VideoChatContent />
    </Suspense>
  );
}
