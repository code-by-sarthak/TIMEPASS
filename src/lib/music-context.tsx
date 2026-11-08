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

export type MusicPlayerMode = 'song' | 'video';

interface MusicContextType {
  tracks: BollywoodOriginalTrack[];
  currentTrack: BollywoodOriginalTrack;
  currentTrackIndex: number;
  isPlaying: boolean;
  isMuted: boolean;
  playerMode: MusicPlayerMode;
  isFloatingMinimized: boolean;
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
  const [playerMode, setPlayerMode] = useState<MusicPlayerMode>('song');
  const [isFloatingMinimized, setIsFloatingMinimized] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(75);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playedHistoryRef = useRef<number[]>([0]);

  const currentTrack = ORIGINAL_BOLLYWOOD_HITS[currentTrackIndex];
  const isCallingPage = pathname === '/video' || pathname?.startsWith('/rooms/');

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

  // Synchronous, gesture-compliant Play / Pause handler
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const nextState = !prev;
      if (playerMode === 'song') {
        if (nextState) {
          if (audioRef.current) {
            audioRef.current.play().catch((err) => {
              console.warn('HTML5 Audio playback prevented:', err);
            });
          }
        } else {
          audioRef.current?.pause();
        }
      } else {
        // Video mode iframe command
        try {
          if (iframeRef.current?.contentWindow) {
            const command = nextState 
              ? '{"event":"command","func":"playVideo","args":""}'
              : '{"event":"command","func":"pauseVideo","args":""}';
            iframeRef.current.contentWindow.postMessage(command, '*');
          }
        } catch {}
      }
      return nextState;
    });
  }, [playerMode]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      if (audioRef.current) {
        audioRef.current.muted = nextMuted;
      }
      try {
        if (iframeRef.current?.contentWindow) {
          const command = nextMuted 
            ? '{"event":"command","func":"mute","args":""}'
            : '{"event":"command","func":"unMute","args":""}';
          iframeRef.current.contentWindow.postMessage(command, '*');
        }
      } catch {}
      return nextMuted;
    });
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current && isFinite(time)) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleSetPlayerMode = useCallback((mode: MusicPlayerMode) => {
    setPlayerMode(mode);
    if (mode === 'video') {
      // Pause HTML5 audio so YouTube video audio plays cleanly
      audioRef.current?.pause();
    } else {
      // Switched to song mode: resume HTML5 audio if active
      if (isPlaying && audioRef.current) {
        audioRef.current.play().catch(console.warn);
      }
    }
  }, [isPlaying]);

  // Handle track index change: load and play immediately
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.src = currentTrack.audioUrl;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);

    if (isPlaying && playerMode === 'song') {
      audioRef.current.play().catch((err) => {
        console.warn('Track switch auto-play caught:', err);
      });
    }
  }, [currentTrackIndex, playerMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle HTML5 track finished: auto-advance to next song
  const handleAudioEnded = useCallback(() => {
    console.log('🎵 Track finished. Seamlessly advancing to next Bollywood hit...');
    nextTrack();
  }, [nextTrack]);

  // Clean, universally embeddable YouTube URL for Video Mode
  const embedUrl = `https://www.youtube.com/embed/${currentTrack.youtubeId}?autoplay=1&enablejsapi=1&playsinline=1&rel=0`;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

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
      }}
    >
      {/* 100% PERSISTENT HTML5 AUDIO ELEMENT (Never unmounted, instant gesture response) */}
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        preload="auto"
        playsInline
        onEnded={handleAudioEnded}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            if (audioRef.current.duration) {
              setDuration(audioRef.current.duration);
            }
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && audioRef.current.duration) {
            setDuration(audioRef.current.duration);
          }
        }}
        onError={() => {
          console.warn('Audio element error on track, auto-recovering...');
        }}
      />

      {children}

      {/* GLOBAL PERSISTENT BOLLYWOOD MUSIC DOCK */}
      {isPlaying && (
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
          {/* Header Bar with Mode Switcher */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate max-w-[130px] sm:max-w-[160px]">
                  {currentTrack.title}
                </p>
                <span className="text-[9px] font-bold text-gray-400 block truncate max-w-[130px] sm:max-w-[160px]">
                  {currentTrack.movie} · {currentTrack.singer}
                </span>
              </div>
            </div>

            {/* Mode Switcher: Song Mode vs Video Mode */}
            <div className="flex items-center gap-1 shrink-0">
              <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => handleSetPlayerMode('song')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                    playerMode === 'song'
                      ? 'bg-pink-500 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Song Mode (Instant Audio Playback)"
                >
                  🎵 Song
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPlayerMode('video')}
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
                onClick={() => {
                  setIsPlaying(false);
                  audioRef.current?.pause();
                }}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                title="Close Music Player"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* VIDEO MODE: Official YouTube Music Video */}
          {!isFloatingMinimized && playerMode === 'video' && (
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl mb-2.5">
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
          )}

          {/* SONG MODE: Rich Vinyl Visualizer, Seek Bar & Controls */}
          {!isFloatingMinimized && playerMode === 'song' && (
            <div className="flex flex-col gap-2.5 pt-1">
              <div className="flex items-center gap-3">
                {/* Rotating Vinyl Disc */}
                <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentTrack.thumbnail}
                    alt={currentTrack.title}
                    className={`w-12 h-12 rounded-full object-cover border-2 border-pink-500 shadow-lg ${
                      isPlaying ? 'animate-spin-slow' : ''
                    }`}
                  />
                  <div className="absolute inset-0 rounded-full border border-black/40 pointer-events-none" />
                  <div className="w-3 h-3 rounded-full bg-black/90 border border-white/30 absolute pointer-events-none" />
                </div>

                {/* Song Info & Live Soundwave Bars */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-black text-white truncate max-w-[150px]">{currentTrack.title}</p>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300">
                      STEREO MP3
                    </span>
                  </div>
                  <p className="text-[10px] text-pink-300 truncate font-semibold mb-1">
                    {currentTrack.movie} · {currentTrack.singer}
                  </p>

                  {/* Animated Soundwave Visualizer Bars */}
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
              </div>

              {/* Interactive Audio Progress Bar */}
              <div className="flex flex-col gap-1 w-full px-0.5">
                <div 
                  className="relative w-full h-2 bg-white/10 rounded-full cursor-pointer group overflow-hidden"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const pct = Math.max(0, Math.min(1, clickX / rect.width));
                    seek(pct * duration);
                  }}
                >
                  <div 
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all group-hover:brightness-125"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 px-0.5">
                  <span>{formatTime(currentTime)}</span>
                  <span className="text-pink-400 font-bold">Auto-Next Enabled</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Bottom Controls Bar */}
              <div className="flex items-center justify-between pt-0.5">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-pink-400" />}
                </button>

                {/* Center Playback Buttons */}
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

                {/* Watch Video Mode Shortcut */}
                <button
                  type="button"
                  onClick={() => handleSetPlayerMode('video')}
                  className="px-2 py-1 rounded-xl bg-purple-500/20 border border-purple-500/40 text-[10px] font-bold text-purple-300 hover:bg-purple-500/30 transition-colors flex items-center gap-1"
                  title="Watch Official YouTube Video"
                >
                  <Tv className="w-3 h-3" />
                  <span>Video</span>
                </button>
              </div>
            </div>
          )}

          {/* MINIMIZED BAR: Sleek mini pill */}
          {isFloatingMinimized && (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-8 h-8 rounded-full object-cover border border-pink-500 animate-spin-slow shrink-0"
                />
                <div className="truncate min-w-0">
                  <p className="text-[10px] font-bold text-white truncate max-w-[120px]">{currentTrack.title}</p>
                  <p className="text-[8px] text-pink-300 truncate max-w-[120px]">{currentTrack.movie}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1.5 rounded-lg bg-pink-500 text-white hover:bg-pink-400"
                >
                  {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={nextTrack}
                  className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"
                >
                  <SkipForward className="w-3 h-3" />
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
