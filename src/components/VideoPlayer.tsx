'use client';

import React, { useEffect, useRef } from 'react';
import { MicOff, VideoOff, Volume2, User as UserIcon } from 'lucide-react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  displayName?: string;
  avatarUrl?: string | null;
  country?: string;
  qualityBadge?: 'Excellent' | 'Good' | 'Reconnecting';
}

export default function VideoPlayer({
  stream,
  isLocal = false,
  isMuted = false,
  isVideoOff = false,
  displayName,
  avatarUrl,
  country,
  qualityBadge,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {
          // Auto-play policy catch
        });
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full bg-dark-card rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center shadow-xl group">
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Always mute local video to prevent echo feedback loop!
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLocal ? 'mirror-video' : ''
        } ${isVideoOff || !stream ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Video Off Fallback Avatar */}
      {(isVideoOff || !stream) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-dark-surface to-dark-card text-center">
          <div className="w-24 h-24 rounded-full bg-brand-500/20 border-2 border-brand-500/40 flex items-center justify-center mb-3 shadow-lg shadow-brand-500/10">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName || 'User'} className="w-full h-full rounded-full object-cover" />
            ) : (
              <UserIcon className="w-12 h-12 text-brand-400" />
            )}
          </div>
          <p className="text-base font-semibold text-white">{displayName || 'Camera Off'}</p>
          <p className="text-xs text-gray-400 mt-0.5">Video is currently paused</p>
        </div>
      )}

      {/* Top Overlays */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
        {displayName && (
          <div className="px-3 py-1 rounded-full glass-toolbar text-xs font-medium text-white flex items-center gap-1.5 shadow">
            <span>{displayName}</span>
            {isLocal && <span className="text-[10px] text-brand-400 font-bold">(You)</span>}
            {country && <span className="text-[10px] text-gray-400">· {country}</span>}
          </div>
        )}

        {qualityBadge && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
            qualityBadge === 'Excellent' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            qualityBadge === 'Good' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
            'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
          }`}>
            {qualityBadge}
          </span>
        )}
      </div>

      {/* Bottom Status Badges */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
        {isMuted && (
          <div className="p-1.5 rounded-full bg-red-500/80 text-white shadow" title="Microphone Muted">
            <MicOff className="w-3.5 h-3.5" />
          </div>
        )}
        {isVideoOff && (
          <div className="p-1.5 rounded-full bg-amber-500/80 text-white shadow" title="Camera Paused">
            <VideoOff className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
}
