'use client';

import React from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Tv,
  Heart,
  Music2
} from 'lucide-react';
import { useMusic } from '@/lib/music-context';

export default function BollywoodMusicPlayer({ compact = false }: { compact?: boolean }) {
  const { 
    tracks, 
    currentTrack, 
    currentTrackIndex, 
    isPlaying, 
    playerMode,
    isFloatingMinimized,
    playTrack, 
    togglePlay, 
    nextTrack, 
    setPlayerMode,
    setIsFloatingMinimized 
  } = useMusic();

  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-2">
      {/* Top Floating Music Bar */}
      <div 
        className="glass-toolbar rounded-2xl p-2 sm:p-2.5 border border-pink-500/30 shadow-2xl flex items-center justify-between gap-1.5 sm:gap-3 w-full transition-all overflow-hidden"
        style={{
          boxShadow: isPlaying ? `0 10px 30px -5px ${currentTrack.themeColor}33` : undefined
        }}
      >
        {/* Track Thumbnail & Rotating Vinyl Disc */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <button
            onClick={togglePlay}
            className="relative w-9 h-9 sm:w-11 sm:h-11 shrink-0 flex items-center justify-center group"
            title={isPlaying ? 'Pause Song' : 'Play Original Song'}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-pink-500/70 shadow-lg transition-transform ${
                isPlaying ? 'animate-spin-slow' : 'group-hover:scale-105'
              }`}
            />
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white fill-current ml-0.5" />
              )}
            </div>
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-pink-500 rounded-full border-2 border-black animate-ping" />
            )}
          </button>

          {/* Track Metadata */}
          <div className="overflow-hidden min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-[8px] sm:text-[9px] font-black text-pink-400 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-pink-400" />
                <span className="hidden xs:inline">Original Master</span>
                <span className="xs:hidden">Original</span>
              </span>
              {isPlaying && (
                <span className="px-1 sm:px-1.5 py-0.2 rounded text-[7px] sm:text-[8px] bg-pink-500/20 text-pink-300 font-bold animate-pulse">
                  PLAYING
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs font-black text-white truncate max-w-[110px] xs:max-w-[150px] sm:max-w-[240px]">
              {currentTrack.title}
            </p>
            <p className="text-[9px] sm:text-[10px] text-gray-400 truncate max-w-[110px] xs:max-w-[150px] sm:max-w-[240px]">
              {currentTrack.movie} · {currentTrack.singer}
            </p>
          </div>
        </div>

        {/* Visualizer bars */}
        <div className="hidden sm:flex items-end gap-1 h-5 shrink-0 px-1">
          {[40, 85, 60, 100, 75, 45, 90].map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-full transition-all duration-200"
              style={{
                height: isPlaying ? `${h}%` : '20%',
                backgroundColor: isPlaying ? currentTrack.themeColor : '#4b5563',
                animation: isPlaying ? `pulse 1.${i}s infinite alternate` : 'none'
              }}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={togglePlay}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl font-black text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 shadow-lg transition-all ${
              isPlaying
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-pink-500/30 hover:scale-105 active:scale-95 animate-pulse'
            }`}
            title={isPlaying ? 'Pause' : 'Play Original Song'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                <span className="text-[9px] sm:text-[10px]">PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                <span className="text-[9px] sm:text-[10px] font-black">PLAY</span>
              </>
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Next Song (No Repeat)"
          >
            <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Player Mode Switcher: Song Mode vs Video Mode */}
          <button
            onClick={() => {
              const nextMode = playerMode === 'video' ? 'song' : 'video';
              setPlayerMode(nextMode);
              setIsFloatingMinimized(false);
            }}
            className={`px-2 py-1 sm:py-1.5 rounded-xl font-bold text-[10px] sm:text-xs transition-colors flex items-center gap-1 ${
              playerMode === 'video' 
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow' 
                : 'bg-pink-500/20 text-pink-300 border border-pink-500/40 hover:bg-pink-500/30'
            }`}
            title={playerMode === 'video' ? 'Switch to Song Mode (Audio Only)' : 'Switch to Video Mode'}
          >
            {playerMode === 'video' ? '🎬 Video' : '🎵 Song'}
          </button>
        </div>
      </div>

      {/* Quick Song Selection Chips (One-click switch to any original hit) */}
      {!compact && (
        <div className="flex items-center gap-1.5 overflow-x-auto w-full py-1 scrollbar-none px-1">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Music2 className="w-2.5 h-2.5 text-pink-400" />
            <span>Trending:</span>
          </span>
          {tracks.map((track, idx) => {
            const isSelected = idx === currentTrackIndex;
            return (
              <button
                key={track.id}
                onClick={() => playTrack(idx)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 ${
                  isSelected && isPlaying
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20 scale-105'
                    : isSelected
                    ? 'bg-white/20 text-white border border-pink-500/40'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {isSelected && isPlaying && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                <span>{track.title.split(' ')[0]}</span>
                <span className="text-[8px] opacity-70">({track.movie})</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
