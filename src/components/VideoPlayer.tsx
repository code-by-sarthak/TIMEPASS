'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Volume2, 
  VolumeX, 
  User as UserIcon, 
  Sparkles,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  displayName?: string;
  avatarUrl?: string | null;
  gender?: string | null;
  region?: string | null;
  country?: string;
  qualityBadge?: 'Excellent' | 'Good' | 'Reconnecting';
  callMode?: 'video' | 'audio';
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export default function VideoPlayer({
  stream,
  isLocal = false,
  isMuted = false,
  isVideoOff = false,
  displayName,
  avatarUrl,
  gender,
  region,
  country,
  qualityBadge,
  callMode = 'video',
  isMinimized = false,
  onToggleMinimize,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioAutoplayBlocked, setAudioAutoplayBlocked] = useState(false);

  // Guaranteed video element binding & autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      // Guaranteed autoplay without browser policy block by keeping video muted
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Video element play retry:', err);
          video.muted = true;
          video.play().catch(() => {});
        });
      }
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  // Dedicated unmuted audio channel for remote partner with tap-to-unlock fallback
  useEffect(() => {
    if (!isLocal && audioRef.current && stream) {
      const audio = audioRef.current;
      if (audio.srcObject !== stream) {
        audio.srcObject = stream;
      }
      audio.muted = isMuted;

      const p = audio.play();
      if (p !== undefined) {
        p.then(() => {
          setAudioAutoplayBlocked(false);
        }).catch(() => {
          setAudioAutoplayBlocked(true);
          const unlock = () => {
            audio.play().then(() => setAudioAutoplayBlocked(false)).catch(() => {});
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
          };
          window.addEventListener('click', unlock, { once: true });
          window.addEventListener('touchstart', unlock, { once: true });
        });
      }
    }
  }, [isLocal, stream, isMuted]);

  const showVideo = !isVideoOff && stream && callMode !== 'audio';

  // SINGLE SMALL STYLISH MINIMIZED PILL
  if (isMinimized) {
    return (
      <div 
        onClick={onToggleMinimize}
        className="w-auto h-auto px-3 py-2 rounded-2xl glass-panel border border-pink-500/40 shadow-2xl flex items-center gap-2.5 cursor-pointer backdrop-blur-2xl hover:scale-105 transition-all select-none group"
        title="Tap to expand video"
      >
        {!isLocal && (
          <audio ref={audioRef} autoPlay playsInline muted={isMuted} />
        )}
        <video ref={videoRef} autoPlay playsInline muted={true} className="hidden" />

        <div className="relative w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName || 'User'} className="w-full h-full rounded-full object-cover" />
          ) : (
            <UserIcon className="w-4 h-4" />
          )}
          {!isMuted && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
        </div>

        <div className="min-w-0 pr-1">
          <p className="text-[11px] font-black text-white truncate max-w-[80px] xs:max-w-[110px]">{displayName || 'You'}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${showVideo ? 'bg-pink-400' : 'bg-amber-400'}`} />
            <span className="text-[8px] text-gray-400 uppercase font-semibold">{showVideo ? 'Cam' : 'Off'}</span>
            <span className={`w-1.5 h-1.5 rounded-full ml-1 ${!isMuted ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="text-[8px] text-gray-400 uppercase font-semibold">{!isMuted ? 'Mic' : 'Muted'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleMinimize?.(); }}
          className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
          title="Expand"
        >
          <Maximize2 className="w-3.5 h-3.5 text-pink-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-neutral-950 rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center shadow-2xl group select-none">
      {/* Dedicated Remote Audio Channel (Independent of Video Frame Autoplay) */}
      {!isLocal && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          muted={isMuted}
        />
      )}

      {/* Video Stream Element (Always Muted for 100% Guaranteed Autoplay on Mobile & Desktop) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={true}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLocal ? 'mirror-video' : ''
        } ${showVideo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Audio-Only / Camera-Off Profile Visualizer */}
      {!showVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-purple-950/40 via-neutral-950 to-pink-950/40 text-center">
          {/* Avatar with pulsing ring */}
          <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-pink-500/20 to-purple-600/30 border-2 border-pink-500/50 flex items-center justify-center mb-3 shadow-2xl shadow-pink-500/20">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName || 'User'} className="w-full h-full rounded-full object-cover" />
            ) : (
              <UserIcon className="w-10 h-10 sm:w-14 sm:h-14 text-pink-400" />
            )}
            {!isMuted && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center text-[10px] text-white animate-pulse">
                🎙️
              </span>
            )}
          </div>

          <p className="text-sm sm:text-base font-black text-white">{displayName || (isLocal ? 'You' : 'Stranger')}</p>
          <p className="text-[11px] text-pink-400/90 font-semibold mt-0.5">
            {callMode === 'audio' ? '🎙️ Audio Call Mode' : isVideoOff ? '📷 Video Paused · Voice Active' : 'Connecting Media...'}
          </p>

          {/* Animated live soundwave bars */}
          <div className="flex items-end gap-1 h-5 mt-3">
            {[30, 75, 45, 90, 60, 40, 85, 50, 70].map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-gradient-to-t from-pink-500 to-purple-400 transition-all duration-200"
                style={{
                  height: !isMuted ? `${h}%` : '15%',
                  opacity: !isMuted ? 1 : 0.3,
                  animation: !isMuted ? `pulse 0.${(i % 4) + 6}s infinite alternate` : 'none'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top Details Header: Cleanly Aligned User Info & Upper Audio/Video Status Icons */}
      <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-2.5 sm:right-3 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {displayName && (
            <div className="px-2.5 sm:px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] sm:text-xs font-black text-white flex items-center gap-1.5 shadow-lg border border-white/10">
              <span className="truncate max-w-[100px] xs:max-w-[140px]">{displayName}</span>
              {gender && gender !== 'Not Specified' && (
                <span className="text-[10px] text-pink-400 font-bold">({gender})</span>
              )}
              {isLocal && <span className="text-[10px] text-emerald-400 font-bold">(You)</span>}
              {region && region !== 'Global' ? (
                <span className="text-[10px] text-gray-400 hidden xs:inline">· {region.split('(')[0].trim()}</span>
              ) : country ? (
                <span className="text-[10px] text-gray-400 hidden xs:inline">· {country}</span>
              ) : null}
            </div>
          )}

          {qualityBadge && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wide backdrop-blur-md ${
              qualityBadge === 'Excellent' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' :
              qualityBadge === 'Good' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40' :
              'bg-amber-500/30 text-amber-300 border border-amber-500/40 animate-pulse'
            }`}>
              {qualityBadge}
            </span>
          )}
        </div>

        {/* Right Upper Video & Audio Indicator Icons + Single Small Stylish Minimize Button */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Upper Video Status Icon */}
          <span 
            className={`p-1.5 rounded-xl backdrop-blur-md border text-[10px] font-bold shadow-lg transition-all flex items-center gap-1 ${
              showVideo 
                ? 'bg-pink-500/25 text-pink-300 border-pink-500/40 shadow-pink-500/20' 
                : 'bg-amber-500/25 text-amber-300 border-amber-500/40'
            }`}
            title={showVideo ? 'Video Camera Active' : 'Video Camera Off'}
          >
            {showVideo ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
          </span>

          {/* Upper Audio Status Icon */}
          <span 
            className={`p-1.5 rounded-xl backdrop-blur-md border text-[10px] font-bold shadow-lg transition-all flex items-center gap-1 ${
              !isMuted 
                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20' 
                : 'bg-red-500/25 text-red-300 border-red-500/40'
            }`}
            title={!isMuted ? 'Microphone Active' : 'Microphone Muted'}
          >
            {!isMuted ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          </span>

          {/* Single Small Stylish Minimize / Maximize Button */}
          {onToggleMinimize && (
            <button
              type="button"
              onClick={onToggleMinimize}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white shadow-lg backdrop-blur-md transition-all active:scale-95 flex items-center justify-center group/min"
              title={isMinimized ? 'Expand Video' : 'Minimize Video to Single Small Stylish Icon'}
            >
              {isMinimized ? (
                <Maximize2 className="w-3.5 h-3.5 text-pink-400 group-hover/min:scale-110 transition-transform" />
              ) : (
                <Minimize2 className="w-3.5 h-3.5 text-gray-300 group-hover/min:text-white transition-colors" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Bottom Status Badges */}
      <div className="absolute bottom-2.5 sm:bottom-3 left-2.5 sm:left-3 flex items-center gap-1.5 z-10 pointer-events-none">
        {isMuted ? (
          <div className="px-2 py-1 rounded-xl bg-red-600/90 text-white text-[10px] font-bold shadow-lg flex items-center gap-1 backdrop-blur-md">
            <MicOff className="w-3 h-3" />
            <span>MUTED</span>
          </div>
        ) : (
          <div className="px-2 py-1 rounded-xl bg-emerald-600/80 text-white text-[10px] font-bold shadow-lg flex items-center gap-1 backdrop-blur-md">
            <Mic className="w-3 h-3 text-emerald-200" />
            <span>AUDIO ON</span>
          </div>
        )}

        {isVideoOff && (
          <div className="px-2 py-1 rounded-xl bg-amber-500/90 text-white text-[10px] font-bold shadow-lg flex items-center gap-1 backdrop-blur-md">
            <VideoOff className="w-3 h-3" />
            <span>CAM OFF</span>
          </div>
        )}
      </div>

      {/* Tap to Unmute Overlay if Autoplay Restricted */}
      {audioAutoplayBlocked && !isLocal && (
        <button
          type="button"
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.play().then(() => setAudioAutoplayBlocked(false)).catch(() => {});
            }
          }}
          className="absolute inset-x-4 bottom-12 z-20 py-2 px-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-black shadow-2xl flex items-center justify-center gap-2 animate-bounce cursor-pointer pointer-events-auto"
        >
          <Volume2 className="w-4 h-4" />
          <span>Tap to Unmute Stranger Audio</span>
        </button>
      )}
    </div>
  );
}
