'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Video, Users, Shield, Music2, Sparkles } from 'lucide-react';
import { useMusic } from '@/lib/music-context';
import { soundManager } from '@/lib/sound';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { isPlaying, togglePlay, setIsFloatingMinimized, isFloatingMinimized } = useMusic();

  // Hide bottom nav on full-screen calling pages so controls never clash
  if (pathname === '/video' || pathname.startsWith('/rooms/')) {
    return null;
  }

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black/90 backdrop-blur-2xl border-t border-white/10 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.8)] select-none transition-all"
    >
      {/* 1. Home */}
      <Link
        href="/"
        onClick={() => soundManager.playPop()}
        className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
          pathname === '/'
            ? 'text-pink-400 font-bold scale-105'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Home</span>
      </Link>

      {/* 2. Video Call (Highlighted) */}
      <Link
        href="/video"
        onClick={() => soundManager.playPop()}
        className={`relative flex flex-col items-center gap-0.5 px-3.5 py-1 rounded-xl transition-all ${
          pathname === '/video'
            ? 'text-white font-extrabold bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg shadow-pink-500/30 scale-105'
            : 'text-gray-300 hover:text-white'
        }`}
      >
        <div className="relative">
          <Video className="w-5 h-5 text-pink-400" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <span className="text-[10px] tracking-tight">Video Call</span>
      </Link>

      {/* 3. 8-Member Rooms */}
      <Link
        href="/rooms"
        onClick={() => soundManager.playPop()}
        className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
          pathname.startsWith('/rooms')
            ? 'text-pink-400 font-bold scale-105'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <div className="relative">
          <Users className="w-5 h-5" />
          <span className="absolute -top-1 -right-2 text-[8px] px-1 py-0.2 rounded-full bg-pink-500 text-white font-black">
            8👥
          </span>
        </div>
        <span className="text-[10px] tracking-tight">Rooms</span>
      </Link>

      {/* 4. Music Player Toggle */}
      <button
        type="button"
        onClick={() => {
          soundManager.playPop();
          if (!isPlaying) {
            togglePlay();
          } else {
            setIsFloatingMinimized(!isFloatingMinimized);
          }
        }}
        className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
          isPlaying
            ? 'text-yellow-300 font-bold scale-105'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <div className="relative">
          <Music2 className={`w-5 h-5 ${isPlaying ? 'animate-spin-slow text-yellow-300' : ''}`} />
          {isPlaying && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-pink-500 animate-ping" />
          )}
        </div>
        <span className="text-[10px] tracking-tight">{isPlaying ? 'Playing' : 'Music'}</span>
      </button>

      {/* 5. Safety */}
      <Link
        href="/safety"
        onClick={() => soundManager.playPop()}
        className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
          pathname === '/safety'
            ? 'text-blue-400 font-bold scale-105'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <Shield className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Safety</span>
      </Link>
    </nav>
  );
}
