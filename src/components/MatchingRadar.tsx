'use client';

import React, { useEffect, useState } from 'react';
import { Compass, Sparkles, X, Radio } from 'lucide-react';

interface MatchingRadarProps {
  mode: 'video' | 'text';
  interests?: string[];
  onCancel: () => void;
}

const ICEBREAKERS = [
  "Tip: Ask what movie they've watched more than five times!",
  "Tip: Find out what destination is at the very top of their bucket list.",
  "Tip: Ask what music album has no skips for them.",
  "Tip: Find out what's the weirdest food combination they secretly love.",
  "Tip: A simple warm smile and 'Hey, where are you calling from?' is the best start!"
];

export default function MatchingRadar({ mode, interests = [], onCancel }: MatchingRadarProps) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % ICEBREAKERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
      {/* Radar Animation Rings */}
      <div className="relative w-40 h-40 flex items-center justify-center mb-8">
        <div className="absolute inset-0 rounded-full bg-brand-500/10 animate-ping opacity-75" />
        <div className="absolute -inset-4 rounded-full border border-brand-500/20 animate-pulse" />
        <div className="absolute -inset-8 rounded-full border border-brand-500/10" />
        
        <div className="relative w-20 h-20 rounded-full gradient-button flex items-center justify-center text-white shadow-xl shadow-brand-500/40">
          <Radio className="w-8 h-8 animate-pulse text-white" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">
        Finding someone awesome...
      </h3>
      <p className="text-xs text-gray-400 mb-6 max-w-xs">
        Matching you with another available {mode === 'video' ? 'video' : 'text'} chatter worldwide.
      </p>

      {/* Selected Filters indicator */}
      {interests.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-center gap-1.5 max-w-sm">
          <span className="text-[11px] text-gray-400 mr-1">Matching filters:</span>
          {interests.map((interest) => (
            <span
              key={interest}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-brand-400" />
              {interest}
            </span>
          ))}
        </div>
      )}

      {/* Rotating Icebreaker */}
      <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-xs text-brand-300/90 mb-6 italic transition-all">
        {ICEBREAKERS[tipIndex]}
      </div>

      {/* Cancel Search Button */}
      <button
        onClick={onCancel}
        className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all"
      >
        <X className="w-4 h-4" />
        <span>Cancel Matchmaking</span>
      </button>
    </div>
  );
}
