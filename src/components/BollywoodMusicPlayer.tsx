'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Music, 
  Sparkles, 
  Heart,
  Disc,
  Radio
} from 'lucide-react';

export interface BollywoodTrack {
  id: string;
  title: string;
  movie: string;
  artist: string;
  themeColor: string;
  mood: string;
  bpm: number;
  melodyFreqs: number[]; // Musical notes for romantic melody
  chords: number[][];    // Romantic chord progression
}

export const BOLLYWOOD_PLAYLIST: BollywoodTrack[] = [
  {
    id: 'kesariya',
    title: 'Kesariya Tera Ishq Hai Piya',
    movie: 'Brahmāstra',
    artist: 'Arijit Singh & Pritam',
    themeColor: '#f59e0b',
    mood: 'Soulful & Passionate',
    bpm: 86,
    melodyFreqs: [440, 493.88, 554.37, 659.25, 554.37, 493.88, 440],
    chords: [[220, 277.18, 329.63], [246.94, 311.13, 369.99], [293.66, 369.99, 440]]
  },
  {
    id: 'apna_bana_le',
    title: 'Apna Bana Le Piya',
    movie: 'Bhediya',
    artist: 'Arijit Singh, Sachin-Jigar',
    themeColor: '#ec4899',
    mood: 'Heartfelt & Melodic',
    bpm: 80,
    melodyFreqs: [523.25, 587.33, 659.25, 783.99, 659.25, 523.25],
    chords: [[261.63, 329.63, 392], [220, 261.63, 329.63], [174.61, 220, 261.63]]
  },
  {
    id: 'chaleya',
    title: 'Chaleya Teri Ore',
    movie: 'Jawan',
    artist: 'Arijit Singh & Shilpa Rao',
    themeColor: '#8b5cf6',
    mood: 'Trending & Groovy Love',
    bpm: 98,
    melodyFreqs: [659.25, 783.99, 880, 987.77, 880, 783.99],
    chords: [[329.63, 392, 493.88], [261.63, 329.63, 392], [293.66, 369.99, 440]]
  },
  {
    id: 'raataan_lambiyan',
    title: 'Raataan Lambiyan Lambiyan Re',
    movie: 'Shershaah',
    artist: 'Jubin Nautiyal & Asees Kaur',
    themeColor: '#38bdf8',
    mood: 'Late Night Romance',
    bpm: 82,
    melodyFreqs: [587.33, 659.25, 698.46, 880, 698.46, 587.33],
    chords: [[293.66, 349.23, 440], [261.63, 329.63, 392], [220, 261.63, 329.63]]
  },
  {
    id: 'tum_hi_ho',
    title: 'Tum Hi Ho',
    movie: 'Aashiqui 2',
    artist: 'Arijit Singh & Mithoon',
    themeColor: '#ef4444',
    mood: 'All-Time Romantic Classic',
    bpm: 84,
    melodyFreqs: [440, 523.25, 659.25, 587.33, 523.25, 440],
    chords: [[220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66]]
  },
  {
    id: 'satranga',
    title: 'Satranga Ishq',
    movie: 'Animal',
    artist: 'Arijit Singh & Shreyas Puranik',
    themeColor: '#a855f7',
    mood: 'Deep & Intoxicated Romance',
    bpm: 88,
    melodyFreqs: [493.88, 554.37, 659.25, 739.99, 659.25, 493.88],
    chords: [[246.94, 311.13, 369.99], [220, 277.18, 329.63], [196, 246.94, 293.66]]
  },
  {
    id: 'pee_loon',
    title: 'Pee Loon Tere Neelam Nainon Ko',
    movie: 'Once Upon a Time in Mumbaai',
    artist: 'Mohit Chauhan & Pritam',
    themeColor: '#10b981',
    mood: 'Sufi & Nostalgic Love',
    bpm: 90,
    melodyFreqs: [523.25, 659.25, 783.99, 880, 783.99, 659.25],
    chords: [[261.63, 329.63, 392], [293.66, 369.99, 440], [220, 261.63, 329.63]]
  }
];

export default function BollywoodMusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visualizerBars, setVisualizerBars] = useState([30, 60, 45, 80, 65, 40]);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const songTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playedHistoryRef = useRef<number[]>([0]);

  const currentTrack = BOLLYWOOD_PLAYLIST[currentTrackIndex];

  // Pick Next Track without repeating recent songs
  const nextTrack = useCallback(() => {
    let nextIdx = Math.floor(Math.random() * BOLLYWOOD_PLAYLIST.length);
    // Ensure not immediate repetition
    let attempts = 0;
    while (playedHistoryRef.current.slice(-3).includes(nextIdx) && attempts < 10) {
      nextIdx = Math.floor(Math.random() * BOLLYWOOD_PLAYLIST.length);
      attempts++;
    }
    playedHistoryRef.current.push(nextIdx);
    setCurrentTrackIndex(nextIdx);
    setProgress(0);
  }, []);

  // Web Audio Procedural Bollywood Synthesizer (Zero External 404s!)
  const playSynthesizedMelody = useCallback((track: BollywoodTrack) => {
    if (typeof window === 'undefined') return;

    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }

    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    // Clean any prior loop
    if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);

    let step = 0;
    const intervalMs = (60 / track.bpm) * 1000 * 0.75;

    synthIntervalRef.current = setInterval(() => {
      if (isMuted || !ctx) return;
      try {
        const now = ctx.currentTime;

        // 1. Warm Acoustic Chord Pad
        const chord = track.chords[step % track.chords.length];
        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.04, now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.8);
        });

        // 2. Romantic Lead Melody Note
        const noteFreq = track.melodyFreqs[step % track.melodyFreqs.length];
        const leadOsc = ctx.createOscillator();
        const leadGain = ctx.createGain();
        leadOsc.type = 'sine';
        leadOsc.frequency.setValueAtTime(noteFreq, now + 0.05);

        leadGain.gain.setValueAtTime(0, now + 0.05);
        leadGain.gain.linearRampToValueAtTime(0.08, now + 0.12);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        leadOsc.connect(leadGain);
        leadGain.connect(ctx.destination);
        leadOsc.start(now + 0.05);
        leadOsc.stop(now + 0.6);

        // Update Equalizer visualizer
        setVisualizerBars([
          20 + Math.random() * 70,
          30 + Math.random() * 60,
          40 + Math.random() * 50,
          25 + Math.random() * 75,
          35 + Math.random() * 65,
          20 + Math.random() * 60
        ]);

        step++;
      } catch {
        // Autoplay policy
      }
    }, intervalMs);
  }, [isMuted]);

  // Track progress and Auto-change song after 28 seconds
  useEffect(() => {
    let progressTimer: NodeJS.Timeout;
    if (isPlaying) {
      playSynthesizedMelody(currentTrack);

      const songDurationSec = 28; // Changes song smoothly after a period
      const startTime = Date.now();

      progressTimer = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const pct = Math.min(100, (elapsed / songDurationSec) * 100);
        setProgress(pct);

        if (pct >= 100) {
          nextTrack();
        }
      }, 500);
    } else {
      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
    }

    return () => {
      clearInterval(progressTimer);
      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
    };
  }, [isPlaying, currentTrackIndex, playSynthesizedMelody, currentTrack, nextTrack]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="glass-toolbar rounded-2xl p-3 border border-pink-500/20 shadow-xl shadow-pink-500/10 flex items-center justify-between gap-3 max-w-md w-full transition-all">
      {/* Vinyl Disc & Status */}
      <div className="flex items-center gap-3">
        <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
          <div
            className={`w-11 h-11 rounded-full bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 p-0.5 shadow-md flex items-center justify-center ${
              isPlaying ? 'animate-spin-slow' : ''
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-dark-surface border-2 border-white/40 flex items-center justify-center">
              <Heart className="w-2 h-2 text-pink-400 fill-current" />
            </div>
          </div>
          {isPlaying && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full border border-black animate-ping" />
          )}
        </div>

        {/* Track Details */}
        <div className="overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-pink-400" />
              <span>Bollywood Romance</span>
            </span>
          </div>
          <p className="text-xs font-black text-white truncate max-w-[180px] sm:max-w-[200px]">
            {currentTrack.title}
          </p>
          <p className="text-[10px] text-gray-400 truncate">
            {currentTrack.movie} · {currentTrack.artist}
          </p>
        </div>
      </div>

      {/* Visualizer Bars (Bouncing when playing) */}
      <div className="hidden sm:flex items-end gap-1 h-6 shrink-0 px-2">
        {visualizerBars.map((h, i) => (
          <div
            key={i}
            className="w-1 rounded-full transition-all duration-150"
            style={{
              height: isPlaying ? `${h}%` : '20%',
              backgroundColor: isPlaying ? currentTrack.themeColor : '#4b5563'
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={togglePlay}
          className="p-2 rounded-xl gradient-button text-white shadow-md shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all"
          title={isPlaying ? 'Pause Song' : 'Play Romantic Bollywood Song'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        <button
          onClick={nextTrack}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          title="Change to Next Song"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors hidden sm:block"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
