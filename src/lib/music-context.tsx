'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Music, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  X, 
  Tv,
  Heart,
  Smartphone
} from 'lucide-react';

export interface BollywoodOriginalTrack {
  id: string;
  title: string;
  movie: string;
  singer: string;
  youtubeId: string;
  themeColor: string;
  thumbnail: string;
}

export const ORIGINAL_BOLLYWOOD_HITS: BollywoodOriginalTrack[] = [
  {
    id: 'tum_hi_ho',
    title: 'Tum Hi Ho',
    movie: 'Aashiqui 2',
    singer: 'Arijit Singh & Mithoon',
    youtubeId: 'IJq0yyWug1k',
    themeColor: '#ef4444',
    thumbnail: 'https://img.youtube.com/vi/IJq0yyWug1k/mqdefault.jpg'
  },
  {
    id: 'kesariya',
    title: 'Kesariya Tera Ishq Hai Piya',
    movie: 'Brahmāstra',
    singer: 'Arijit Singh & Pritam',
    youtubeId: 'BddP6PYo2gs',
    themeColor: '#f59e0b',
    thumbnail: 'https://img.youtube.com/vi/BddP6PYo2gs/mqdefault.jpg'
  },
  {
    id: 'apna_bana_le',
    title: 'Apna Bana Le',
    movie: 'Bhediya',
    singer: 'Arijit Singh, Sachin-Jigar',
    youtubeId: 'ElZfdU54Cp8',
    themeColor: '#ec4899',
    thumbnail: 'https://img.youtube.com/vi/ElZfdU54Cp8/mqdefault.jpg'
  },
  {
    id: 'chaleya',
    title: 'Chaleya Teri Ore',
    movie: 'Jawan',
    singer: 'Arijit Singh & Shilpa Rao',
    youtubeId: 'VAdGW7QDJUI',
    themeColor: '#8b5cf6',
    thumbnail: 'https://img.youtube.com/vi/VAdGW7QDJUI/mqdefault.jpg'
  },
  {
    id: 'raataan_lambiyan',
    title: 'Raataan Lambiyan',
    movie: 'Shershaah',
    singer: 'Jubin Nautiyal & Asees Kaur',
    youtubeId: 'gvyUuxdRdR4',
    themeColor: '#38bdf8',
    thumbnail: 'https://img.youtube.com/vi/gvyUuxdRdR4/mqdefault.jpg'
  },
  {
    id: 'gerua',
    title: 'Gerua',
    movie: 'Dilwale',
    singer: 'Arijit Singh & Antara Mitra',
    youtubeId: 'AEIVhBS6baE',
    themeColor: '#f97316',
    thumbnail: 'https://img.youtube.com/vi/AEIVhBS6baE/mqdefault.jpg'
  },
  {
    id: 'heeriye',
    title: 'Heeriye',
    movie: 'Independent Hit',
    singer: 'Jasleen Royal & Arijit Singh',
    youtubeId: 'RLzC55ai0eo',
    themeColor: '#10b981',
    thumbnail: 'https://img.youtube.com/vi/RLzC55ai0eo/mqdefault.jpg'
  },
  {
    id: 'channa_mereya',
    title: 'Channa Mereya',
    movie: 'Ae Dil Hai Mushkil',
    singer: 'Arijit Singh & Pritam',
    youtubeId: '284Ov7ysmfA',
    themeColor: '#a855f7',
    thumbnail: 'https://img.youtube.com/vi/284Ov7ysmfA/mqdefault.jpg'
  }
];

export type MusicPlayerMode = 'video' | 'song';

interface MusicContextType {
  tracks: BollywoodOriginalTrack[];
  currentTrack: BollywoodOriginalTrack;
  currentTrackIndex: number;
  isPlaying: boolean;
  isMuted: boolean;
  playerMode: MusicPlayerMode;
  isFloatingMinimized: boolean;
  playTrack: (index: number) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleMute: () => void;
  setPlayerMode: (mode: MusicPlayerMode) => void;
  setIsFloatingMinimized: (min: boolean) => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playerMode, setPlayerMode] = useState<MusicPlayerMode>('song');
  const [isFloatingMinimized, setIsFloatingMinimized] = useState(false);

  const playedHistoryRef = useRef<number[]>([0]);
  const currentTrack = ORIGINAL_BOLLYWOOD_HITS[currentTrackIndex];
  const isCallingPage = pathname === '/video' || pathname?.startsWith('/rooms/');

  // Pick Next Track without repeating recent songs
  const nextTrack = useCallback(() => {
    let nextIdx = Math.floor(Math.random() * ORIGINAL_BOLLYWOOD_HITS.length);
    let attempts = 0;
    while (playedHistoryRef.current.slice(-3).includes(nextIdx) && attempts < 15) {
      nextIdx = Math.floor(Math.random() * ORIGINAL_BOLLYWOOD_HITS.length);
      attempts++;
    }
    playedHistoryRef.current.push(nextIdx);
    setCurrentTrackIndex(nextIdx);
    setIsPlaying(true);
  }, []);

  const prevTrack = useCallback(() => {
    const prevIdx = (currentTrackIndex - 1 + ORIGINAL_BOLLYWOOD_HITS.length) % ORIGINAL_BOLLYWOOD_HITS.length;
    setCurrentTrackIndex(prevIdx);
    setIsPlaying(true);
  }, [currentTrackIndex]);

  const playTrack = useCallback((index: number) => {
    if (index >= 0 && index < ORIGINAL_BOLLYWOOD_HITS.length) {
      setCurrentTrackIndex(index);
      setIsPlaying(true);
      playedHistoryRef.current.push(index);
    }
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return (
    <MusicContext.Provider
      value={{
        tracks: ORIGINAL_BOLLYWOOD_HITS,
        currentTrack,
        currentTrackIndex,
        isPlaying,
        isMuted,
        playerMode,
        isFloatingMinimized,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        toggleMute,
        setPlayerMode,
        setIsFloatingMinimized,
      }}
    >
      {children}

      {/* GLOBAL PERSISTENT BOLLYWOOD MUSIC DOCK */}
      {isPlaying && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-in-out shadow-2xl ${
            isCallingPage
              ? isFloatingMinimized
                ? 'bottom-20 sm:bottom-24 right-2 sm:right-4 w-[280px] sm:w-72 max-w-[calc(100vw-16px)] rounded-2xl glass-panel border border-pink-500/40 p-2.5 flex items-center gap-3 backdrop-blur-xl'
                : 'bottom-20 sm:bottom-24 right-2 sm:right-4 w-[300px] xs:w-[340px] sm:w-[380px] max-w-[calc(100vw-16px)] rounded-3xl glass-panel border-2 border-pink-500/50 p-2.5 sm:p-3.5 bg-black/95 backdrop-blur-2xl shadow-pink-500/20'
              : isFloatingMinimized
                ? 'bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-4 right-2 sm:right-4 w-[280px] sm:w-72 max-w-[calc(100vw-16px)] rounded-2xl glass-panel border border-pink-500/40 p-2.5 flex items-center gap-3 backdrop-blur-xl'
                : 'bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-4 right-2 sm:right-4 w-[300px] xs:w-[340px] sm:w-[380px] max-w-[calc(100vw-16px)] rounded-3xl glass-panel border-2 border-pink-500/50 p-2.5 sm:p-3.5 bg-black/95 backdrop-blur-2xl shadow-pink-500/20'
          }`}
          style={{
            boxShadow: `0 20px 50px -10px ${currentTrack.themeColor}33, 0 0 30px 2px ${currentTrack.themeColor}22`
          }}
        >
          {/* Header Bar with Mode Switcher */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate max-w-[150px]">
                  {currentTrack.title}
                </p>
                <span className="text-[9px] font-bold text-gray-400 block truncate">
                  {currentTrack.singer}
                </span>
              </div>
            </div>

            {/* Mode Switcher: Video Mode vs Song Mode */}
            <div className="flex items-center gap-1 shrink-0">
              <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setPlayerMode('song')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                    playerMode === 'song'
                      ? 'bg-pink-500 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Song Mode (Audio Only with Visualizer)"
                >
                  🎵 Song
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerMode('video')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                    playerMode === 'video'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Video Mode (Watch Official Music Video)"
                >
                  🎬 Video
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsFloatingMinimized(!isFloatingMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title={isFloatingMinimized ? 'Expand Player' : 'Minimize Player'}
              >
                {isFloatingMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying(false)}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                title="Close Music Player"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* PLAYER CONTENT */}
          {!isFloatingMinimized ? (
            <div>
              {/* VIDEO MODE: Official Video with Synchronized Studio Sound */}
              {playerMode === 'video' ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner group">
                  <iframe
                    key={`video_${currentTrack.id}`}
                    src={`https://www.youtube-nocookie.com/embed/${currentTrack.youtubeId}?autoplay=1&enablejsapi=1&rel=0&playsinline=1`}
                    title={`${currentTrack.title} - ${currentTrack.singer}`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              ) : (
                /* SONG MODE: Dedicated Audio Card with Vinyl Spin and Visualizer */
                <div className="relative w-full p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex flex-col items-center justify-center text-center">
                  {/* Background audio player (iframe hidden so it streams the genuine song audio) */}
                  <div className="absolute w-1 h-1 opacity-0 overflow-hidden pointer-events-none">
                    <iframe
                      key={`audio_${currentTrack.id}`}
                      src={`https://www.youtube-nocookie.com/embed/${currentTrack.youtubeId}?autoplay=1&enablejsapi=1&rel=0&playsinline=1`}
                      title="Audio Stream"
                      className="w-1 h-1"
                      allow="autoplay"
                    />
                  </div>

                  {/* Rotating Vinyl Disc */}
                  <div className="relative w-24 h-24 mb-3 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentTrack.thumbnail}
                      alt={currentTrack.title}
                      className="w-24 h-24 rounded-full object-cover border-4 border-black/80 shadow-[0_0_30px_rgba(236,72,153,0.35)] animate-spin-slow"
                    />
                    <div className="absolute inset-0 rounded-full border-4 border-dashed border-pink-500/40 pointer-events-none animate-spin" />
                    <div className="w-5 h-5 rounded-full bg-black border-2 border-pink-500 absolute" />
                  </div>

                  <p className="text-sm font-black text-white">{currentTrack.title}</p>
                  <p className="text-xs text-pink-300 font-semibold mt-0.5">{currentTrack.movie} · {currentTrack.singer}</p>

                  {/* Equalizer animation bars */}
                  <div className="flex items-end gap-1.5 h-6 my-2.5">
                    {[40, 85, 60, 100, 75, 45, 90, 65, 80].map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-gradient-to-t from-pink-500 to-purple-400 rounded-full animate-pulse"
                        style={{ height: `${h}%`, animationDelay: `${i * 120}ms` }}
                      />
                    ))}
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      type="button"
                      onClick={prevTrack}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                      title="Previous Song"
                    >
                      <SkipForward className="w-4 h-4 rotate-180" />
                    </button>
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="p-3 rounded-full bg-pink-500 hover:bg-pink-400 text-white shadow-lg shadow-pink-500/30 transition-transform active:scale-95"
                      title="Pause"
                    >
                      <Pause className="w-5 h-5 fill-current" />
                    </button>
                    <button
                      type="button"
                      onClick={nextTrack}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                      title="Next Song"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Track Meta Footer */}
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-300">
                <span className="font-semibold text-white/90 truncate max-w-[200px]">
                  🎬 {currentTrack.movie}
                </span>
                <button
                  type="button"
                  onClick={nextTrack}
                  className="text-[10px] text-pink-300 font-bold bg-pink-500/15 hover:bg-pink-500/25 px-2.5 py-1 rounded-full border border-pink-500/30 shrink-0 transition-colors flex items-center gap-1"
                >
                  <span>Next Hit</span>
                  <SkipForward className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            /* Minimized Bar */
            <div className="relative flex items-center justify-between w-full">
              {/* Keep background audio playing */}
              <div className="absolute w-1 h-1 opacity-0 overflow-hidden pointer-events-none">
                <iframe
                  key={`min_${currentTrack.id}`}
                  src={`https://www.youtube-nocookie.com/embed/${currentTrack.youtubeId}?autoplay=1&enablejsapi=1&rel=0&playsinline=1`}
                  title="Audio Stream"
                  className="w-1 h-1"
                  allow="autoplay"
                />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-9 h-9 rounded-full object-cover border border-pink-500 animate-spin-slow shrink-0"
                />
                <div className="truncate min-w-0">
                  <p className="text-[11px] font-bold text-white truncate max-w-[130px]">{currentTrack.title}</p>
                  <p className="text-[9px] text-pink-300 truncate max-w-[130px]">{currentTrack.movie}</p>
                </div>
              </div>

              {/* Visualizer bars */}
              <div className="flex items-end gap-0.5 h-4 px-1 shrink-0">
                {[30, 80, 50, 100, 60].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-pink-500 rounded-full animate-pulse"
                    style={{ height: `${h}%`, animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
