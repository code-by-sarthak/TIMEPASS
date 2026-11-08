'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  X, 
  Tv,
  Music2,
  ExternalLink
} from 'lucide-react';

export interface BollywoodOriginalTrack {
  id: string;
  title: string;
  movie: string;
  singer: string;
  youtubeId: string;
  themeColor: string;
  thumbnail: string;
  audioUrl: string;
}

export const ORIGINAL_BOLLYWOOD_HITS: BollywoodOriginalTrack[] = [
  {
    id: 'tum_hi_ho',
    title: 'Tum Hi Ho',
    movie: 'Aashiqui 2',
    singer: 'Arijit Singh & Mithoon',
    youtubeId: 'IJq0yyWug1k',
    themeColor: '#ef4444',
    thumbnail: 'https://img.youtube.com/vi/IJq0yyWug1k/mqdefault.jpg',
    audioUrl: '/music/tum_hi_ho.mp3'
  },
  {
    id: 'kesariya',
    title: 'Kesariya Tera Ishq Hai Piya',
    movie: 'Brahmāstra',
    singer: 'Arijit Singh & Pritam',
    youtubeId: 'BddP6PYo2gs',
    themeColor: '#f59e0b',
    thumbnail: 'https://img.youtube.com/vi/BddP6PYo2gs/mqdefault.jpg',
    audioUrl: '/music/kesariya.mp3'
  },
  {
    id: 'apna_bana_le',
    title: 'Apna Bana Le',
    movie: 'Bhediya',
    singer: 'Arijit Singh, Sachin-Jigar',
    youtubeId: 'ElZfdU54Cp8',
    themeColor: '#ec4899',
    thumbnail: 'https://img.youtube.com/vi/ElZfdU54Cp8/mqdefault.jpg',
    audioUrl: '/music/apna_bana_le.mp3'
  },
  {
    id: 'chaleya',
    title: 'Chaleya Teri Ore',
    movie: 'Jawan',
    singer: 'Arijit Singh & Shilpa Rao',
    youtubeId: 'VAdGW7QDJiU',
    themeColor: '#8b5cf6',
    thumbnail: 'https://img.youtube.com/vi/VAdGW7QDJiU/mqdefault.jpg',
    audioUrl: '/music/chaleya.mp3'
  },
  {
    id: 'raataan_lambiyan',
    title: 'Raataan Lambiyan',
    movie: 'Shershaah',
    singer: 'Jubin Nautiyal & Asees Kaur',
    youtubeId: 'gvyUuxdRdR4',
    themeColor: '#38bdf8',
    thumbnail: 'https://img.youtube.com/vi/gvyUuxdRdR4/mqdefault.jpg',
    audioUrl: '/music/raataan_lambiyan.mp3'
  },
  {
    id: 'gerua',
    title: 'Gerua',
    movie: 'Dilwale',
    singer: 'Arijit Singh & Antara Mitra',
    youtubeId: 'AEIVhBS6baE',
    themeColor: '#f97316',
    thumbnail: 'https://img.youtube.com/vi/AEIVhBS6baE/mqdefault.jpg',
    audioUrl: '/music/gerua.mp3'
  },
  {
    id: 'heeriye',
    title: 'Heeriye',
    movie: 'Independent Hit',
    singer: 'Jasleen Royal & Arijit Singh',
    youtubeId: 'RLzC55ai0eo',
    themeColor: '#10b981',
    thumbnail: 'https://img.youtube.com/vi/RLzC55ai0eo/mqdefault.jpg',
    audioUrl: '/music/heeriye.mp3'
  },
  {
    id: 'channa_mereya',
    title: 'Channa Mereya',
    movie: 'Ae Dil Hai Mushkil',
    singer: 'Arijit Singh & Pritam',
    youtubeId: '284Ov7ysmfA',
    themeColor: '#a855f7',
    thumbnail: 'https://img.youtube.com/vi/284Ov7ysmfA/mqdefault.jpg',
    audioUrl: '/music/channa_mereya.mp3'
  },
  {
    id: 'tere_vaaste',
    title: 'Tere Vaaste Falak Se Main Chand Launga',
    movie: 'Zara Hatke Zara Bachke',
    singer: 'Varun Jain, Sachin-Jigar & Shadab Faridi',
    youtubeId: 'g5WZLO8BAC8',
    themeColor: '#06b6d4',
    thumbnail: 'https://img.youtube.com/vi/g5WZLO8BAC8/mqdefault.jpg',
    audioUrl: '/music/tere_vaaste.mp3'
  },
  {
    id: 'dil_diyan_gallan',
    title: 'Dil Diyan Gallan',
    movie: 'Tiger Zinda Hai',
    singer: 'Atif Aslam & Vishal-Shekhar',
    youtubeId: 'SAcpESN_Fk4',
    themeColor: '#ec4899',
    thumbnail: 'https://img.youtube.com/vi/SAcpESN_Fk4/mqdefault.jpg',
    audioUrl: '/music/dil_diyan_gallan.mp3'
  },
  {
    id: 'shayad',
    title: 'Shayad Kabhi Na Keh Sakoon',
    movie: 'Love Aaj Kal',
    singer: 'Arijit Singh & Pritam',
    youtubeId: 'MJyKN-8UncM',
    themeColor: '#8b5cf6',
    thumbnail: 'https://img.youtube.com/vi/MJyKN-8UncM/mqdefault.jpg',
    audioUrl: '/music/shayad.mp3'
  },
  {
    id: 'pal_pal_dil_ke_paas',
    title: 'Pal Pal Dil Ke Paas',
    movie: 'Title Track',
    singer: 'Arijit Singh & Parampara Tandon',
    youtubeId: 'i1HpSzorjlc',
    themeColor: '#f59e0b',
    thumbnail: 'https://img.youtube.com/vi/i1HpSzorjlc/mqdefault.jpg',
    audioUrl: '/music/pal_pal_dil_ke_paas.mp3'
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
  isDockOpen: boolean;
  currentTime: number;
  duration: number;
  playTrack: (index: number) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleMute: () => void;
  seek: (time: number) => void;
  setPlayerMode: (mode: MusicPlayerMode) => void;
  setIsFloatingMinimized: (min: boolean) => void;
  setIsDockOpen: (open: boolean) => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playerMode, setPlayerMode] = useState<MusicPlayerMode>('video');
  const [isFloatingMinimized, setIsFloatingMinimized] = useState(false);
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(240);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playedHistoryRef = useRef<number[]>([0]);

  const currentTrack = ORIGINAL_BOLLYWOOD_HITS[currentTrackIndex];
  const isCallingPage = pathname === '/video' || pathname?.startsWith('/rooms/');

  // Send command safely to YouTube iframe
  const sendYouTubeCommand = useCallback((func: string, args: any[] = []) => {
    try {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      }
    } catch (e) {
      console.warn('YouTube postMessage error:', e);
    }
  }, []);

  // Advance to next track without immediate repeats ("one song after another go on")
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
    setIsDockOpen(true);
    const nextSong = ORIGINAL_BOLLYWOOD_HITS[nextIdx];
    sendYouTubeCommand('loadVideoById', [nextSong.youtubeId]);
  }, [sendYouTubeCommand]);

  const prevTrack = useCallback(() => {
    const prevIdx = (currentTrackIndex - 1 + ORIGINAL_BOLLYWOOD_HITS.length) % ORIGINAL_BOLLYWOOD_HITS.length;
    setCurrentTrackIndex(prevIdx);
    setIsPlaying(true);
    setIsDockOpen(true);
    const prevSong = ORIGINAL_BOLLYWOOD_HITS[prevIdx];
    sendYouTubeCommand('loadVideoById', [prevSong.youtubeId]);
  }, [currentTrackIndex, sendYouTubeCommand]);

  const playTrack = useCallback((index: number) => {
    if (index >= 0 && index < ORIGINAL_BOLLYWOOD_HITS.length) {
      setCurrentTrackIndex(index);
      playedHistoryRef.current.push(index);
      setIsPlaying(true);
      setIsDockOpen(true);
      setIsFloatingMinimized(false);
      const targetSong = ORIGINAL_BOLLYWOOD_HITS[index];
      sendYouTubeCommand('loadVideoById', [targetSong.youtubeId]);
    }
  }, [sendYouTubeCommand]);

  // Synchronous, gesture-compliant Play / Pause handler
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      sendYouTubeCommand('pauseVideo');
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      setIsDockOpen(true);
      setIsFloatingMinimized(false);
      sendYouTubeCommand('playVideo');
    }
  }, [isPlaying, sendYouTubeCommand]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      sendYouTubeCommand(nextMuted ? 'mute' : 'unMute');
      return nextMuted;
    });
  }, [sendYouTubeCommand]);

  const seek = useCallback((time: number) => {
    if (isFinite(time)) {
      sendYouTubeCommand('seekTo', [time, true]);
      setCurrentTime(time);
    }
  }, [sendYouTubeCommand]);

  const handleSetPlayerMode = useCallback((mode: MusicPlayerMode) => {
    setPlayerMode(mode);
    setIsDockOpen(true);
  }, []);

  // Listen to YouTube postMessage events for seamless auto-advance ("one song after another")
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      try {
        let payload = event.data;
        if (typeof payload === 'string') {
          try {
            payload = JSON.parse(payload);
          } catch {
            return;
          }
        }
        if (!payload || typeof payload !== 'object') return;

        // YouTube postMessage API state updates: info 0 = ENDED, 1 = PLAYING, 2 = PAUSED
        if (payload.event === 'onStateChange') {
          if (payload.info === 0) {
            console.log('🎵 Bollywood hit ended! Auto-playing next track...');
            nextTrack();
          } else if (payload.info === 1) {
            setIsPlaying(true);
            setIsDockOpen(true);
          } else if (payload.info === 2) {
            setIsPlaying(false);
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [nextTrack]);

  // Clean, official YouTube embed URL with autoplay, playsinline, and jsapi enabled
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrl = `https://www.youtube.com/embed/${currentTrack.youtubeId}?autoplay=1&enablejsapi=1&playsinline=1&rel=0${origin ? `&origin=${encodeURIComponent(origin)}` : ''}`;

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
        isDockOpen,
        currentTime,
        duration,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        toggleMute,
        seek,
        setPlayerMode: handleSetPlayerMode,
        setIsFloatingMinimized,
        setIsDockOpen,
      }}
    >
      {children}

      {/* GLOBAL PERSISTENT OFFICIAL BOLLYWOOD MUSIC DOCK */}
      {(isDockOpen || isPlaying) && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-in-out shadow-2xl ${
            isCallingPage
              ? isFloatingMinimized
                ? 'bottom-20 sm:bottom-24 right-2 sm:right-4 w-[280px] sm:w-72 max-w-[calc(100vw-16px)] rounded-2xl glass-panel border border-pink-500/40 p-2.5 flex items-center gap-3 backdrop-blur-xl'
                : 'bottom-20 sm:bottom-24 right-2 sm:right-4 w-[310px] xs:w-[350px] sm:w-[390px] max-w-[calc(100vw-16px)] rounded-3xl glass-panel border-2 border-pink-500/50 p-3 sm:p-4 bg-black/95 backdrop-blur-2xl shadow-pink-500/25'
              : isFloatingMinimized
                ? 'bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-4 right-2 sm:right-4 w-[280px] sm:w-72 max-w-[calc(100vw-16px)] rounded-2xl glass-panel border border-pink-500/40 p-2.5 flex items-center gap-3 backdrop-blur-xl'
                : 'bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-4 right-2 sm:right-4 w-[310px] xs:w-[350px] sm:w-[390px] max-w-[calc(100vw-16px)] rounded-3xl glass-panel border-2 border-pink-500/50 p-3 sm:p-4 bg-black/95 backdrop-blur-2xl shadow-pink-500/25'
          }`}
          style={{
            boxShadow: `0 20px 50px -10px ${currentTrack.themeColor}33, 0 0 30px 2px ${currentTrack.themeColor}22`
          }}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <span 
                className="w-2.5 h-2.5 rounded-full animate-ping shrink-0" 
                style={{ backgroundColor: currentTrack.themeColor }}
              />
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate max-w-[130px] sm:max-w-[180px]">
                  {currentTrack.title}
                </p>
                <span className="text-[9px] font-bold text-gray-400 block truncate max-w-[130px] sm:max-w-[180px]">
                  {currentTrack.movie} · {currentTrack.singer}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>BOLLYWOOD HIT</span>
              </span>

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
                onClick={() => {
                  sendYouTubeCommand('pauseVideo');
                  setIsPlaying(false);
                  setIsDockOpen(false);
                }}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                title="Close Music Player"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* OFFICIAL YOUTUBE MUSIC VIDEO: Kept alive off-screen when minimized so audio never pauses */}
          <div
            className={
              isFloatingMinimized
                ? 'fixed -top-[9999px] -left-[9999px] w-1 h-1 opacity-0 pointer-events-none'
                : 'w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl mb-2.5 relative'
            }
          >
            <iframe
              ref={iframeRef}
              key={`yt_${currentTrack.id}`}
              src={embedUrl}
              title={`${currentTrack.title} - ${currentTrack.singer}`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* EXPANDED CONTROLS BAR */}
          {!isFloatingMinimized && (
            <div className="flex flex-col gap-2 pt-0.5">
              <div className="flex items-center justify-between">
                {/* Volume & Live Soundwave Bars */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-pink-400" />}
                  </button>

                  <div className="flex items-end gap-1 h-3.5">
                    {[35, 75, 50, 95, 60, 40, 85, 45, 90, 65, 30].map((h, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full transition-all duration-150"
                        style={{
                          height: isPlaying ? `${h}%` : '20%',
                          backgroundColor: isPlaying ? currentTrack.themeColor : '#4b5563',
                          animation: isPlaying ? `pulse 0.${(i % 5) + 6}s infinite alternate` : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Center Playback Controls */}
                <div className="flex items-center gap-2">
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
                    className="p-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white shadow-lg shadow-pink-500/30 transition-transform active:scale-95"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={nextTrack}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                    title="Next Song (One after another)"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Auto-Next Badge */}
                <span className="text-[9px] font-bold text-pink-300 bg-pink-500/15 px-2 py-1 rounded-lg border border-pink-500/30">
                  Auto-Next 🔁
                </span>
              </div>
            </div>
          )}

          {/* MINIMIZED PILL: Sleek mini bar while keeping video & audio playing seamlessly */}
          {isFloatingMinimized && (
            <div className="flex items-center justify-between w-full">
              <div 
                className="flex items-center gap-2 min-w-0 cursor-pointer"
                onClick={() => setIsFloatingMinimized(false)}
                title="Tap to expand video player"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className={`w-8 h-8 rounded-full object-cover border border-pink-500 shrink-0 ${
                    isPlaying ? 'animate-spin-slow' : ''
                  }`}
                />
                <div className="truncate min-w-0">
                  <p className="text-[10px] font-bold text-white truncate max-w-[110px]">{currentTrack.title}</p>
                  <p className="text-[8px] text-pink-300 truncate max-w-[110px]">{currentTrack.movie}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1.5 rounded-lg bg-pink-500 text-white hover:bg-pink-400"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={nextTrack}
                  className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"
                  title="Next Song"
                >
                  <SkipForward className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsFloatingMinimized(false)}
                  className="p-1.5 rounded-lg bg-white/10 text-gray-300 hover:text-white"
                  title="Expand to Full Video"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
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
