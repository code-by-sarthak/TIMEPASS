'use client';

import React, { useState } from 'react';
import { 
  X, 
  Chrome, 
  Sparkles, 
  Heart, 
  MapPin, 
  User, 
  Users, 
  Flame, 
  ShieldCheck, 
  ArrowRight,
  Music2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import BollywoodMusicPlayer from './BollywoodMusicPlayer';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'google' | 'guest';
}

const POPULAR_REGIONS = [
  'Mumbai (Maharashtra)',
  'Delhi NCR',
  'Bengaluru (Karnataka)',
  'Punjab (Chandigarh)',
  'Hyderabad (Telangana)',
  'Kolkata (West Bengal)',
  'Pune (Maharashtra)',
  'Ahmedabad (Gujarat)',
  'Jaipur (Rajasthan)',
  'Dubai (UAE)',
  'London (UK)',
  'New York (USA)',
  'Global / Worldwide'
];

// Romantic aesthetic movie gallery cards
const BOLLYWOOD_CARDS = [
  {
    title: 'Kabir & Preeti',
    movie: 'Kabir Singh',
    tag: 'Trending Romance',
    image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80',
    quote: '"Tujhe kitna chahne lage hum..."'
  },
  {
    title: 'Shiva & Isha',
    movie: 'Brahmāstra',
    tag: 'Pure Magic',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    quote: '"Kesariya tera ishq hai piya..."'
  },
  {
    title: 'Vikram & Dimple',
    movie: 'Shershaah',
    tag: 'Heartfelt Love',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    quote: '"Raataan lambiyan lambiyan re..."'
  }
];

export default function AuthModal({ isOpen, onClose, defaultTab = 'google' }: AuthModalProps) {
  const { continueAsGuest, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState<'google' | 'guest'>(defaultTab);

  // Form Details
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [region, setRegion] = useState('Mumbai (Maharashtra)');
  const [ageConfirmed, setAgeConfirmed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  if (!isOpen) return null;

  // 1. Google One-Click Login
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const success = await loginWithGoogle({ gender, region });
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  // 2. Instant Guest Login with Full Details
  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ageConfirmed) {
      setError('You must confirm you are at least 18 years old to join.');
      return;
    }

    if (!displayName.trim()) {
      setError('Please enter your name or nickname to proceed.');
      return;
    }

    setError(null);
    setLoading(true);

    const success = await continueAsGuest({
      displayName: displayName.trim(),
      gender,
      region,
      country: region.includes('(') ? region.split('(')[1].replace(')', '') : 'India',
    });

    setLoading(false);
    if (success) {
      onClose();
    }
  };

  const activeCard = BOLLYWOOD_CARDS[activeCardIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in">
      <div className="w-full max-w-4xl glass-panel rounded-3xl shadow-2xl border border-pink-500/30 overflow-hidden relative flex flex-col md:flex-row">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-white/20 transition-colors backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT COLUMN: Bollywood Romantic Experience & Visuals */}
        <div className="w-full md:w-5/12 relative min-h-[220px] md:min-h-full flex flex-col justify-between p-6 overflow-hidden">
          {/* Background Cinematic Image with Gradient Overlay */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeCard.image}
            alt={activeCard.title}
            className="absolute inset-0 w-full h-full object-cover filter brightness-75 scale-105 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-surface via-black/40 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-900/20 to-dark-surface" />

          {/* Top Bollywood Vibes Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-pink-500/30 text-pink-300 text-xs font-bold shadow-lg">
              <Heart className="w-3.5 h-3.5 text-pink-500 fill-current animate-pulse" />
              <span>Bollywood Romance</span>
            </div>

            {/* Quick Card Switcher */}
            <div className="flex gap-1.5">
              {BOLLYWOOD_CARDS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveCardIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    activeCardIndex === idx ? 'bg-pink-500 w-5' : 'bg-white/40 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Cinematic Quote & Music Player */}
          <div className="relative z-10 space-y-3 mt-auto pt-6">
            <div className="glass-toolbar rounded-2xl p-3.5 border border-white/10 shadow-xl backdrop-blur-md">
              <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">{activeCard.movie}</span>
              <p className="text-sm font-semibold text-white italic mt-0.5">{activeCard.quote}</p>
            </div>

            {/* Embedded Bollywood Music Player */}
            <BollywoodMusicPlayer compact />
          </div>
        </div>

        {/* RIGHT COLUMN: Modern Addictive Login Form */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-center bg-dark-card/95 relative">
          {/* Glow backdrop */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Title */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-black text-xl text-white tracking-wider">TIME</span>
              <span className="font-black text-xl gradient-text tracking-wider">PASS</span>
            </div>
            <h3 className="text-2xl font-black text-white">
              Meet Someone New. <span className="gradient-text">Right Now.</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Select your gender and region to connect with genuine people nearby.
            </p>
          </div>

          {/* Toggle Tabs: Google or Instant Guest */}
          <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-2xl mb-6 text-xs font-bold">
            <button
              onClick={() => { setTab('google'); setError(null); }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                tab === 'google'
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Chrome className="w-4 h-4 text-white" />
              <span>Google Account</span>
            </button>

            <button
              onClick={() => { setTab('guest'); setError(null); }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                tab === 'guest'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-pink-300" />
              <span>Instant Guest</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Gender & Region Selectors (Used for both Google and Guest!) */}
          <div className="space-y-4 mb-5">
            {/* Gender Selection Cards */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-2">
                I identify as:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Female', 'Male', 'Other'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      gender === g
                        ? 'bg-pink-500/20 border-pink-500 text-white shadow-md shadow-pink-500/20 scale-102'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{g === 'Female' ? '👩 Girl' : g === 'Male' ? '👦 Boy' : '✨ Other'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Region / City Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-pink-400" />
                <span>My City / Region:</span>
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-pink-500"
              >
                {POPULAR_REGIONS.map((r) => (
                  <option key={r} value={r} className="bg-dark-surface text-white">
                    📍 {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TAB 1: Google One-Click */}
          {tab === 'google' && (
            <div className="space-y-4">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-gray-600 text-pink-500 focus:ring-0"
                />
                <span>
                  I confirm that I am <strong>18 years or older</strong>.
                </span>
              </label>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/30 hover:scale-102 active:scale-98 transition-all"
              >
                <Chrome className="w-5 h-5 text-white" />
                <span>{loading ? 'Connecting with Google...' : 'Continue with Google Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-gray-400 text-center">
                Syncs your real Google display name & verified photo securely.
              </p>
            </div>
          )}

          {/* TAB 2: Instant Guest Onboarding */}
          {tab === 'guest' && (
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-pink-400" />
                  <span>Your Display Name / Nickname</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav, Ananya, Rohan, Simran"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-pink-500"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-gray-600 text-pink-500 focus:ring-0"
                />
                <span>
                  I confirm that I am at least <strong>18 years old</strong> and agree to treat strangers with respect.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-pink-500/30 hover:scale-102 active:scale-98 transition-all"
              >
                <Flame className="w-4 h-4 text-pink-300 fill-current" />
                <span>{loading ? 'Entering TIMEPASS...' : 'Start Chatting Instantly'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-3 text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Encrypted P2P Calls</span>
            </span>
            <span>·</span>
            <span>No Phone Number Required</span>
            <span>·</span>
            <span>Strict 18+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
