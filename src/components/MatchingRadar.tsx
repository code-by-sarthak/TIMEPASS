'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, X, Radio, Copy, Check, ExternalLink, Zap } from 'lucide-react';

interface MatchingRadarProps {
  mode: 'video' | 'text';
  interests?: string[];
  onCancel: () => void;
  onInstantMatch?: () => void;
}

const ICEBREAKERS = [
  "Tip: Ask what movie they've watched more than five times! 🎬",
  "Tip: Find out what destination is at the very top of their bucket list. ✈️",
  "Tip: Ask what music album has no skips for them. 🎵",
  "Tip: Chai or Coffee? It's the ultimate conversation starter! ☕",
  "Tip: A simple warm smile and 'Hey, how's your day?' is the best start! ✨"
];

export default function MatchingRadar({ mode, interests = [], onCancel, onInstantMatch }: MatchingRadarProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [searchSeconds, setSearchSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % ICEBREAKERS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSearchSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const openSecondWindow = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'width=500,height=700');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center max-w-md mx-auto select-none animate-in fade-in">
      {/* 3D Multi-Layer Glowing Radar Rings */}
      <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center mb-6">
        <div className="absolute inset-0 rounded-full bg-pink-500/15 animate-ping opacity-75" />
        <div className="absolute -inset-3 rounded-full border-2 border-dashed border-pink-500/30 animate-spin-slow" />
        <div className="absolute -inset-6 rounded-full border border-purple-500/20 animate-pulse" />
        <div className="absolute -inset-10 rounded-full border border-cyan-500/10" />

        {/* Center Glowing Orb */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-pink-500/40 hover:scale-105 transition-transform duration-300">
          <Radio className="w-9 h-9 sm:w-10 sm:h-10 animate-pulse text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]" />
        </div>
      </div>

      <div className="space-y-1 mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-[11px] text-pink-300 font-bold mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Connecting to next stranger ({searchSeconds}s)...</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-white">
          Finding someone awesome...
        </h3>
        <p className="text-xs text-gray-400 max-w-xs mx-auto">
          Searching available {mode === 'video' ? 'video' : 'text'} chatters in your preferred vibe.
        </p>
      </div>

      {/* Selected Filters indicator */}
      {interests.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-center gap-1.5 max-w-sm">
          {interests.map((interest) => (
            <span
              key={interest}
              className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-pink-500/15 text-pink-300 border border-pink-500/30 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-pink-400" />
              <span>#{interest}</span>
            </span>
          ))}
        </div>
      )}

      {/* Rotating Fun Tip Card */}
      <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-pink-200/90 mb-6 italic transition-all max-w-sm">
        {ICEBREAKERS[tipIndex]}
      </div>

      {/* Action Buttons: Cancel and Test in 2nd Window */}
      <div className="flex items-center justify-center gap-2.5 flex-wrap">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          title="Cancel search and go home"
        >
          <X className="w-4 h-4 text-red-400" />
          <span>Cancel</span>
        </button>

        <button
          onClick={openSecondWindow}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
          title="Open another window to test two real users connecting side-by-side"
        >
          <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
          <span>Test 2 Tabs</span>
        </button>
      </div>
    </div>
  );
}
