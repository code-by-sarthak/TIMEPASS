'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Video, Mic, MicOff, VideoOff, PhoneOff, Copy, Check, Share2, Users, AlertCircle } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { WebRTCManager } from '@/lib/webrtc';
import VideoPlayer from '@/components/VideoPlayer';
import { soundManager } from '@/lib/sound';

export default function PrivateRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [status, setStatus] = useState<'waiting' | 'ready' | 'connected' | 'full'>('waiting');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [copied, setCopied] = useState(false);

  const webrtcRef = useRef<WebRTCManager | null>(null);

  useEffect(() => {
    const rtc = new WebRTCManager(
      (stream) => {
        setRemoteStream(stream);
        setStatus('connected');
        soundManager.playMatchFound();
      },
      (state) => {
        if (state === 'connected') setStatus('connected');
      },
      (candidate) => {
        const socket = getSocket();
        socket.emit('signal-ice-candidate', { candidate });
      }
    );

    webrtcRef.current = rtc;

    async function init() {
      try {
        const stream = await rtc.getLocalMedia();
        setLocalStream(stream);

        const socket = getSocket();
        socket.emit('join-private-room', { roomId });

        socket.on('private-room-status', (data: { status: 'waiting' | 'full' }) => {
          if (data.status === 'full') setStatus('full');
          else setStatus('waiting');
        });

        socket.on('private-room-ready', async () => {
          setStatus('ready');
          rtc.initPeerConnection();
          try {
            const offer = await rtc.createOffer();
            socket.emit('signal-offer', { sdp: offer, roomId });
          } catch {
            //
          }
        });

        socket.on('signal-offer', async (data: { sdp: RTCSessionDescriptionInit }) => {
          rtc.initPeerConnection();
          const answer = await rtc.createAnswer(data.sdp);
          socket.emit('signal-answer', { sdp: answer, roomId });
        });

        socket.on('signal-answer', async (data: { sdp: RTCSessionDescriptionInit }) => {
          await rtc.handleRemoteAnswer(data.sdp);
        });

        socket.on('signal-ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
          await rtc.addIceCandidate(data.candidate);
        });
      } catch (err) {
        console.warn('Private room error:', err);
      }
    }

    init();

    return () => {
      rtc.stopAll();
    };
  }, [roomId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnd = () => {
    webrtcRef.current?.stopAll();
    router.push('/');
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden flex flex-col p-4 relative">
      {/* Top Header */}
      <div className="flex items-center justify-between z-20 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm text-white">TIME</span>
          <span className="font-extrabold text-sm gradient-text">PASS</span>
          <span className="text-xs text-gray-400">· Private Room</span>
        </div>

        <button
          onClick={handleCopyLink}
          className="px-3.5 py-1.5 rounded-xl glass-toolbar text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-white/10"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Link Copied!' : 'Share Room Link'}</span>
        </button>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative flex items-center justify-center">
        {status === 'waiting' && (
          <div className="max-w-md p-6 glass-panel rounded-2xl text-center border border-white/10">
            <Users className="w-12 h-12 text-brand-400 mx-auto mb-3 animate-pulse" />
            <h2 className="text-lg font-bold text-white mb-2">Waiting for your friend to join...</h2>
            <p className="text-xs text-gray-400 mb-6">
              Send this private link to your friend. When they open it, your encrypted direct video call will start automatically.
            </p>
            <button
              onClick={handleCopyLink}
              className="px-6 py-2.5 rounded-xl gradient-button text-white text-xs font-bold inline-flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Copy Invite Link</span>
            </button>
          </div>
        )}

        {status === 'full' && (
          <div className="max-w-md p-6 glass-panel rounded-2xl text-center border border-red-500/20">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white mb-2">Room is Full</h2>
            <p className="text-xs text-gray-400 mb-4">This private room already has 2 active participants.</p>
            <button
              onClick={() => router.push('/')}
              className="px-5 py-2 rounded-xl gradient-button text-white text-xs font-bold"
            >
              Return Home
            </button>
          </div>
        )}

        {status === 'connected' && (
          <div className="relative w-full h-full flex flex-col md:flex-row gap-3">
            <div className="flex-1 w-full h-full relative rounded-2xl overflow-hidden">
              <VideoPlayer
                stream={remoteStream}
                isLocal={false}
                displayName="Friend"
              />
            </div>
            <div className="absolute bottom-6 right-6 w-44 aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-20">
              <VideoPlayer
                stream={localStream}
                isLocal={true}
                isMuted={isMuted}
                isVideoOff={isVideoOff}
                displayName="You"
              />
            </div>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="py-3 flex items-center justify-center gap-3 z-20">
        <button
          onClick={() => {
            const muted = !webrtcRef.current?.toggleAudio();
            setIsMuted(muted);
          }}
          className={`p-3 rounded-xl ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={() => {
            const off = !webrtcRef.current?.toggleVideo();
            setIsVideoOff(off);
          }}
          className={`p-3 rounded-xl ${isVideoOff ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white'}`}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        <button
          onClick={handleEnd}
          className="p-3 rounded-xl bg-red-600 text-white"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
