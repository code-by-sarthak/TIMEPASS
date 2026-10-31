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
  Users
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

function VideoChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

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
  const [isPartnerMuted, setIsPartnerMuted] = useState(false);
  const [isPartnerVideoOff, setIsPartnerVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAvatarMode, setIsAvatarMode] = useState(false);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  // Chat & Modals
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [friendAdded, setFriendAdded] = useState(false);

  // Filter preferences from URL query
  const interests = searchParams.get('interests')?.split(',').filter(Boolean) || [];
  const language = searchParams.get('language') || 'English';
  const country = searchParams.get('country') || 'Global (Any)';
  const requestedMode = searchParams.get('mode');

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

      // Acquire camera and microphone
      const stream = await webrtcRef.current.getLocalMedia();
      setLocalStream(stream);
      setIsAvatarMode(false);

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
      console.error('Camera/Mic permission failed:', err);
      setCallState('permission_denied');

      const isHttpMobile = typeof window !== 'undefined' && 
        window.location.protocol === 'http:' && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1';

      if (isHttpMobile) {
        setErrorMessage(
          'Mobile browsers restrict physical webcam access over local HTTP (http://192.168.x.x). Tap "Continue in Avatar Mode" to connect and voice chat immediately!'
        );
      } else {
        setErrorMessage(
          'Camera and microphone access was denied or not detected. Please enable permissions in your browser address bar or continue instantly in Avatar Mode.'
        );
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

  // Start immediately on page mount (either avatar mode or video mode)
  useEffect(() => {
    if (requestedMode === 'avatar') {
      handleContinueAvatarMode();
    } else {
      startVideoSession();
    }
  }, [requestedMode, handleContinueAvatarMode, startVideoSession]);

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

  // Media Toggle Handlers
  const handleToggleMic = () => {
    if (!webrtcRef.current) return;
    const isNowMuted = !webrtcRef.current.toggleAudio();
    setIsMuted(isNowMuted);

    const socket = getSocket();
    socket.emit('media-state-change', { micMuted: isNowMuted });
  };

  const handleToggleVideo = () => {
    if (!webrtcRef.current) return;
    const isNowOff = !webrtcRef.current.toggleVideo();
    setIsVideoOff(isNowOff);

    const socket = getSocket();
    socket.emit('media-state-change', { cameraOff: isNowOff });
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
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 py-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-xl glass-toolbar text-white hover:bg-white/10 transition-colors shadow"
            title="Return to Home"
          >
            <Home className="w-4 h-4" />
          </button>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full glass-toolbar text-xs font-bold text-white shadow">
            <span>TIME</span>
            <span className="gradient-text">PASS</span>
            <span className="text-gray-400 font-normal">· Video</span>
          </div>
        </div>

        {partner && callState === 'connected' && (
          <div className="flex items-center gap-2 pointer-events-auto">
            {!friendAdded ? (
              <button
                onClick={handleAddFriend}
                className="px-3 py-1.5 rounded-full glass-toolbar text-xs font-medium text-white hover:bg-brand-500/30 flex items-center gap-1.5 transition-colors shadow"
              >
                <UserPlus className="w-3.5 h-3.5 text-brand-400" />
                <span className="hidden sm:inline">Add Friend</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                Friend Added!
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Calling Stage */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Video Canvas Area */}
        <div className="flex-1 relative flex flex-col md:flex-row p-3 gap-3 items-center justify-center">
          {/* Permission Denied / Camera Fallback UI */}
          {callState === 'permission_denied' && (
            <div className="max-w-md w-full p-6 sm:p-7 glass-panel rounded-3xl text-center border border-pink-500/30 shadow-[0_0_50px_rgba(236,72,153,0.18)] animate-in fade-in zoom-in-95 duration-300 mx-3">
              {/* Animated Icon Badge */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-pink-500/10">
                <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-pink-400" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] font-black shadow">
                  !
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">
                Camera Permission Needed
              </h3>
              
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-4 max-w-sm mx-auto">
                {errorMessage || 'Camera access was denied or not detected. No worries! You can chat right now in Live Avatar Mode.'}
              </p>

              {/* Context helper notice */}
              <div className="mb-5 p-3 rounded-2xl bg-white/5 border border-white/10 text-left text-xs text-gray-300 space-y-1.5">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Live Avatar Mode:</strong> Connect instantly with animated avatar, live voice, reactions & Bollywood music without sharing your camera!
                  </span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-gray-400">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    To allow real camera: Tap the 🔒 or site settings icon in your browser address bar &gt; Allow Camera, then click <strong>Try Camera Again</strong>.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5">
                {/* PRIMARY ACTION: Avatar Mode (Instant Match) */}
                <button
                  onClick={handleContinueAvatarMode}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-pink-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
                  <span>Continue in Avatar Mode (Instant Match)</span>
                </button>

                {/* SECONDARY ROW */}
                <div className="grid grid-cols-2 gap-2 mt-0.5">
                  <button
                    onClick={startVideoSession}
                    className="py-2.5 px-3 rounded-xl glass-toolbar border border-white/10 hover:bg-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-pink-400" />
                    <span>Try Camera Again</span>
                  </button>

                  <button
                    onClick={() => router.push('/rooms')}
                    className="py-2.5 px-3 rounded-xl bg-pink-500/15 border border-pink-500/30 hover:bg-pink-500/25 text-pink-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Users className="w-3.5 h-3.5 text-pink-400" />
                    <span>8-Member Rooms</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Searching / Matchmaking Radar */}
          {callState === 'searching' && (
            <MatchingRadar
              mode="video"
              interests={interests}
              onCancel={() => router.push('/')}
            />
          )}

          {/* Disconnected State UI */}
          {callState === 'disconnected' && (
            <div className="max-w-sm p-6 glass-panel rounded-2xl text-center border border-white/10 animate-in fade-in">
              <h3 className="text-lg font-bold text-white mb-1">Partner Disconnected</h3>
              <p className="text-xs text-gray-400 mb-6">The other chatter left the conversation.</p>
              <button
                onClick={handleNext}
                className="w-full py-3 rounded-xl gradient-button text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-500/30"
              >
                <span>Find Next Person</span>
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Active Call Layout: Remote Video Centerstage + Local Video Picture-in-Picture */}
          {(callState === 'connected' || callState === 'connecting') && (
            <div className="relative w-full h-full flex flex-col md:flex-row gap-3">
              {/* Remote User Video (Center Stage) */}
              <div className="flex-1 w-full h-full relative rounded-2xl overflow-hidden">
                <VideoPlayer
                  stream={remoteStream}
                  isLocal={false}
                  isMuted={isPartnerMuted}
                  isVideoOff={isPartnerVideoOff}
                  displayName={partner?.displayName || 'Connecting...'}
                  avatarUrl={partner?.avatarUrl}
                  gender={partner?.gender}
                  region={partner?.region}
                  country={partner?.country}
                  qualityBadge={connectionQuality}
                />
              </div>

              {/* Local User Preview (Picture-in-Picture / Mobile Native Top-Right Floating) */}
              <div className="absolute top-14 sm:top-auto sm:bottom-24 right-2.5 sm:right-6 w-24 xs:w-28 sm:w-48 md:w-56 aspect-[3/4] sm:aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-20 transition-all hover:scale-105 group/pip backdrop-blur-md">
                <VideoPlayer
                  stream={localStream}
                  isLocal={true}
                  isMuted={isMuted}
                  isVideoOff={isVideoOff}
                  displayName={user?.displayName || 'You'}
                  avatarUrl={user?.avatarUrl}
                  gender={user?.profile?.gender}
                  region={user?.profile?.region}
                />
                {isAvatarMode && (
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-auto z-10">
                    <span className="px-1.5 py-0.5 rounded-full bg-pink-500/80 backdrop-blur-md text-[9px] font-bold text-white shadow flex items-center gap-1">
                      <span>🎭</span>
                      <span className="hidden xs:inline">Avatar</span>
                    </span>
                    <button
                      onClick={handleSwitchToRealCamera}
                      disabled={isSwitchingCamera}
                      className="px-2 py-0.5 rounded-full bg-black/70 hover:bg-black/95 backdrop-blur-md text-[9px] font-bold text-white border border-white/20 transition-all flex items-center gap-1 shadow hover:border-pink-500/50"
                      title="Switch to Real Webcam"
                    >
                      <Camera className="w-2.5 h-2.5 text-pink-400" />
                      <span>{isSwitchingCamera ? 'Connecting...' : 'Camera'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
