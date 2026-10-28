'use client';

import React from 'react';
import Link from 'next/link';

interface TimepassLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  clickable?: boolean;
}

export default function TimepassLogo({ 
  size = 'md', 
  showTagline = true, 
  clickable = true 
}: TimepassLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7 sm:w-8 sm:h-8',
    md: 'w-9 h-9 sm:w-11 sm:h-11',
    lg: 'w-11 h-11 xs:w-14 xs:h-14 sm:w-16 sm:h-16'
  };

  const textSizes = {
    sm: 'text-sm sm:text-base md:text-lg',
    md: 'text-lg sm:text-xl md:text-2xl',
    lg: 'text-2xl xs:text-3xl sm:text-4xl'
  };

  const content = (
    <div className="flex items-center gap-2.5 sm:gap-3 group select-none">
      {/* 3D Glowing Animated Emblem */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 active:scale-95`}>
        {/* Outer Pulsing Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-500 opacity-75 blur-md group-hover:opacity-100 group-hover:blur-lg transition-all animate-pulse" />
        
        {/* Emblem Body */}
        <div className="relative w-full h-full rounded-2xl bg-gradient-to-tr from-[#161233] via-[#1a1442] to-[#251b5c] border-2 border-pink-500/50 shadow-2xl flex items-center justify-center overflow-hidden">
          {/* Shimmer line */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          {/* Custom Multi-layered Icon: Clock + Chat + Spark */}
          <svg 
            className="w-3/5 h-3/5 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Clock Face Circle */}
            <circle cx="12" cy="12" r="9" stroke="url(#logo-grad-1)" strokeWidth="2" strokeDasharray="3 2" />
            
            {/* Clock Hands */}
            <path d="M12 7V12L15 14" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Intersecting Chat Bubble Tail */}
            <path d="M17.5 17.5L20 20" stroke="url(#logo-grad-2)" strokeWidth="2.5" strokeLinecap="round" />
            
            {/* Center Heartbeat Glow */}
            <circle cx="12" cy="12" r="2" fill="#ec4899" />
            
            <defs>
              <linearGradient id="logo-grad-1" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ec4899" />
                <stop offset="0.5" stopColor="#a855f7" />
                <stop offset="1" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="logo-grad-2" x1="17" y1="17" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ec4899" />
                <stop offset="1" stopColor="#f43f5e" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Live Sparkle Accent Dot */}
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-400 to-amber-300 rounded-full border-2 border-black animate-ping" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-400 to-amber-300 rounded-full border-2 border-black" />
      </div>

      {/* Typography */}
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center tracking-wider font-black leading-none">
          <span className={`${textSizes[size]} text-white tracking-widest drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]`}>
            TIME
          </span>
          <span className={`${textSizes[size]} ml-0.5 bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent tracking-widest drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]`}>
            PASS
          </span>
          <span className="text-[9px] font-black uppercase text-pink-400 ml-1 px-1.5 py-0.2 rounded-full bg-pink-500/10 border border-pink-500/30 hidden xs:inline-block">
            LIVE
          </span>
        </div>

        {showTagline && (
          <p className="text-[10px] text-gray-400 tracking-wide font-medium mt-0.5 hidden sm:block truncate">
            Meet Someone New. <span className="text-pink-400 font-semibold">Anytime.</span>
          </p>
        )}
      </div>
    </div>
  );

  if (clickable) {
    return (
      <Link href="/" title="TIMEPASS — Meet Someone New. Anytime.">
        {content}
      </Link>
    );
  }

  return content;
}
