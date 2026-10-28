'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Video, 
  MessageSquare, 
  Sparkles, 
  Globe, 
  ShieldCheck, 
  Zap, 
  Lock, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  ChevronDown,
  Heart,
  Flame,
  Radio,
  MapPin,
  Play,
  Square
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import BollywoodMusicPlayer from '@/components/BollywoodMusicPlayer';
import TimepassLogo from '@/components/TimepassLogo';
import { POPULAR_INTERESTS, POPULAR_LANGUAGES } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { getSocket } from '@/lib/socket';
import { RealLiveActivity, RealActiveUser } from '@/lib/types';

const ROMANTIC_VIBES = [
  {
    title: 'Yeh Jawaani Hai Deewani',
    vibe: 'Fun, Travel & Spontaneous Connections',
    badge: 'Trending Now',
    image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=500&auto=format&fit=crop&q=80'
  },
  {
    title: 'Jab We Met',
    vibe: 'Late Night Heart-to-Heart Talks',
    badge: 'Popular Vibe',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&auto=format&fit=crop&q=80'
  },
  {
    title: 'Zindagi Na Milegi Dobara',
    vibe: 'Deep Conversations & New Best Friends',
    badge: 'Chill Mode',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&auto=format&fit=crop&q=80'
  }
];

function formatTimeAgo(ts: number): string {
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ago`;
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Music', 'Movies', 'Travel']);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Hindi');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<'Anyone' | 'Girls' | 'Boys'>('Anyone');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // 100% Real Live Data State (No dummy names)
  const [recentActivities, setRecentActivities] = useState<RealLiveActivity[]>([]);
  const [activeUsers, setActiveUsers] = useState<RealActiveUser[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [activeActivityIndex, setActiveActivityIndex] = useState(0);

  // Synchronize genuine real-time activity and online status
  useEffect(() => {
    // 1. Initial REST fetch for instant display
    fetch('/api/live-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.onlineCount) setOnlineCount(data.onlineCount);
        if (Array.isArray(data.recentActivities)) setRecentActivities(data.recentActivities);
        if (Array.isArray(data.activeUsers)) setActiveUsers(data.activeUsers);
      })
      .catch(() => {});

    // 2. Real-time Socket.IO subscriptions
    const socket = getSocket();
    if (!socket) return;

    if (user) {
      socket.emit('register-presence', {
        displayName: user.displayName,
        gender: user.profile?.gender || undefined,
        region: user.profile?.region || undefined,
        userId: user.id
      });
    }

    const onOnlineCount = (data: { count: number }) => {
      setOnlineCount(data.count || 1);
    };

    const onLiveStatusSync = (status: {
      onlineCount: number;
      activeUsers: RealActiveUser[];
      recentActivities: RealLiveActivity[];
    }) => {
      if (status.onlineCount) setOnlineCount(status.onlineCount);
      if (Array.isArray(status.activeUsers)) setActiveUsers(status.activeUsers);
      if (Array.isArray(status.recentActivities)) setRecentActivities(status.recentActivities);
    };

    const onRealActivity = (act: RealLiveActivity) => {
      setRecentActivities((prev) => [act, ...prev.filter(a => a.id !== act.id).slice(0, 19)]);
    };

    const onActiveUsersUpdate = (users: RealActiveUser[]) => {
      if (Array.isArray(users)) setActiveUsers(users);
    };

    socket.on('online-count', onOnlineCount);
    socket.on('live-status-sync', onLiveStatusSync);
    socket.on('real-activity', onRealActivity);
    socket.on('active-users-update', onActiveUsersUpdate);

    return () => {
      socket.off('online-count', onOnlineCount);
      socket.off('live-status-sync', onLiveStatusSync);
      socket.off('real-activity', onRealActivity);
      socket.off('active-users-update', onActiveUsersUpdate);
    };
  }, [user]);

  // Rotate through real live activities if any exist
  useEffect(() => {
    if (recentActivities.length <= 1) return;
    const interval = setInterval(() => {
      setActiveActivityIndex((prev) => (prev + 1) % recentActivities.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [recentActivities.length]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleStartChat = (mode: 'video' | 'text', subMode?: 'avatar') => {
    // If not signed in or guest, prompt AuthModal with full details!
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    const params = new URLSearchParams();
    if (selectedInterests.length > 0) params.set('interests', selectedInterests.join(','));
    if (selectedLanguage) params.set('language', selectedLanguage);
    if (selectedGenderFilter !== 'Anyone') params.set('genderPref', selectedGenderFilter);
    if (subMode === 'avatar') params.set('mode', 'avatar');

    router.push(`/${mode}?${params.toString()}`);
  };

  const currentActivity = recentActivities.length > 0 
    ? recentActivities[activeActivityIndex % recentActivities.length] 
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-dark-surface text-foreground selection:bg-pink-500 selection:text-white">
      <Navbar onOpenAuth={() => setIsAuthOpen(true)} />

      {/* Floating Bollywood Romance Music Bar */}
      <div className="sticky top-16 z-30 w-full px-4 py-2 bg-black/60 backdrop-blur-md border-b border-pink-500/15 flex items-center justify-center">
        <BollywoodMusicPlayer />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        {/* Glow backdrop lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-pink-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[450px] h-[250px] bg-purple-500/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          
          {/* Main Hero TIMEPASS Glowing Emblem & Logo Showcase */}
          <div className="flex flex-col items-center justify-center mb-6 animate-in fade-in zoom-in-95 duration-700">
            <div className="px-5 py-3 sm:px-7 sm:py-3.5 rounded-3xl bg-white/5 border border-pink-500/30 backdrop-blur-2xl shadow-[0_0_60px_rgba(236,72,153,0.3)] hover:shadow-[0_0_90px_rgba(236,72,153,0.55)] transition-all duration-500 group">
              <TimepassLogo size="lg" showTagline={true} clickable={false} />
            </div>
          </div>

          {/* Live Genuine Activity Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/5 border border-pink-500/20 text-xs font-semibold text-pink-300 mb-6 shadow-lg shadow-pink-500/5 animate-in fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            {currentActivity ? (
              <span className="truncate max-w-[280px] sm:max-w-none">
                <strong className="text-white">{currentActivity.name}</strong> from <strong className="text-white">{currentActivity.region}</strong> {currentActivity.mode}{' '}
                <span className="text-[10px] text-gray-400 font-normal">({formatTimeAgo(currentActivity.timestamp)})</span>
              </span>
            ) : (
              <span>
                <strong className="text-emerald-400 font-bold">{onlineCount} {onlineCount === 1 ? 'user' : 'users'} online</strong> · Genuine Matchmaking Active
              </span>
            )}
          </div>

          {/* Hero Heading */}
          <h1 className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.1] mb-4">
            Meet Someone New. <br />
            <span className="bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Anytime. Anywhere.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-xs sm:text-base md:text-lg text-gray-300 mb-8 leading-relaxed px-2">
            Instant peer-to-peer random video calls and 8-member custom rooms for gaming, music jams, and late night hangout chats.
          </p>

          {/* Gender Filter Tabs */}
          <div className="max-w-md w-full mx-auto mb-6 p-1.5 rounded-2xl glass-toolbar border border-white/10 flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-gray-400 px-2 sm:px-3 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-pink-500 fill-current shrink-0" />
              <span className="hidden xs:inline">I want to meet:</span>
              <span className="xs:hidden">Meet:</span>
            </span>
            <div className="flex items-center gap-1">
              {(['Anyone', 'Girls', 'Boys'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedGenderFilter(filter)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all ${
                    selectedGenderFilter === filter
                      ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-md shadow-pink-500/25 scale-105'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {filter === 'Anyone' && '✨ Anyone'}
                  {filter === 'Girls' && '👩 Girls'}
                  {filter === 'Boys' && '👦 Boys'}
                </button>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={() => handleStartChat('video')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white font-black text-base shadow-xl shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 group"
            >
              <Video className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>Start Video Chat</span>
              <Sparkles className="w-4 h-4 text-pink-200 animate-pulse" />
            </button>

            <button
              onClick={() => router.push('/rooms')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-toolbar border border-pink-500/30 text-white font-bold text-base hover:bg-pink-500/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-pink-500/10"
            >
              <Users className="w-5 h-5 text-pink-400" />
              <span>8-Member Custom Rooms</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-black border border-pink-500/30">8👥</span>
            </button>
          </div>

          {/* Quick Avatar Mode Access Pill */}
          <div className="flex items-center justify-center -mt-8 mb-10">
            <button
              onClick={() => handleStartChat('video', 'avatar')}
              className="text-xs text-pink-300/90 hover:text-white transition-all flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-pink-500/20 hover:bg-pink-500/20 hover:scale-105 shadow"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>No webcam or on mobile Wi-Fi?</span>
              <span className="font-bold underline text-pink-400 hover:text-pink-200">Start in Avatar Mode →</span>
            </button>
          </div>

          {/* Interest Selection Chips */}
          <div className="max-w-2xl mx-auto glass-panel p-5 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-gray-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span>Match By Interests (Optional)</span>
              </span>
              <span className="text-gray-500 text-[11px]">{selectedInterests.length} selected</span>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR_INTERESTS.slice(0, 10).map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25 scale-105'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    <span>#{interest}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Romantic Aesthetic Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-black/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-pink-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Flame className="w-4 h-4 text-pink-400" />
              <span>Choose Your Conversation Vibe</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Bollywood Romantic Vibe Discovery</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ROMANTIC_VIBES.map((card, idx) => (
              <div
                key={idx}
                onClick={() => handleStartChat('video')}
                className="group relative rounded-3xl overflow-hidden border border-white/10 hover:border-pink-500/50 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-pink-500/20"
              >
                <div className="h-64 w-full relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-surface via-dark-surface/60 to-transparent" />
                </div>

                <div className="absolute bottom-0 inset-x-0 p-5">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    {card.badge}
                  </span>
                  <h3 className="text-lg font-black text-white mt-2 group-hover:text-pink-300 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-gray-300 mt-1">{card.vibe}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REAL Live Active Users & Matchmaking Queue (NO Dummy Data) */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-gradient-to-b from-dark-surface to-dark-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                  Live Platform Presence
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Real Active Chatters & Matchmaking Queue
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {activeUsers.length > 0
                  ? `${activeUsers.length} real user${activeUsers.length === 1 ? '' : 's'} online or waiting for instant match.`
                  : `Currently ${onlineCount} active connection on the platform. Start a call to be matched instantly.`}
              </p>
            </div>

            <button
              onClick={() => handleStartChat('video')}
              className="px-5 py-2.5 rounded-xl gradient-button text-white text-xs font-bold flex items-center gap-1.5 w-fit shadow-md shadow-pink-500/20 hover:scale-105 transition-transform"
            >
              <span>Join Live Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeUsers.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {activeUsers.map((chatter) => (
                <div
                  key={chatter.socketId}
                  onClick={() => handleStartChat('video')}
                  className="glass-panel p-3.5 rounded-2xl border border-white/10 hover:border-pink-500/40 cursor-pointer group transition-all text-center hover:scale-[1.02]"
                >
                  <div className="w-12 h-12 rounded-full mx-auto mb-2 bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform">
                    {chatter.displayName.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                    {chatter.displayName}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">📍 {chatter.region || 'India'}</p>
                  <div className="mt-1 flex items-center justify-center gap-1 flex-wrap">
                    {chatter.gender && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/10 text-gray-300 font-medium">
                        {chatter.gender}
                      </span>
                    )}
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                      {chatter.mode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-8 border border-white/10 text-center max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center mx-auto text-pink-400">
                <Radio className="w-8 h-8 animate-pulse text-pink-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Live Matchmaking Queue Is Open</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                  Click below to enter the queue and be paired with the next chatter, or open another browser tab or window to test real two-way WebRTC calling!
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => handleStartChat('video')}
                  className="px-5 py-2.5 rounded-xl gradient-button text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-pink-500/20 hover:scale-105 transition-transform"
                >
                  <Video className="w-4 h-4" />
                  <span>Start Video Chat</span>
                </button>
                <button
                  onClick={() => router.push('/rooms')}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-2 border border-white/10 hover:scale-105 transition-transform"
                >
                  <Users className="w-4 h-4 text-pink-400" />
                  <span>Browse 8-Member Rooms</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Why Everyone is Addicted to TIMEPASS Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-gradient-to-b from-dark-surface via-pink-950/10 to-dark-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-pink-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Built For Pure Fun</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">
              Why Everyone Is Hooked On <span className="bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">TIMEPASS</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 max-w-xl mx-auto">
              Everything designed to make your chats effortless, spontaneous, and endlessly entertaining.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-pink-500/40 transition-all hover:scale-[1.02] group">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Instant &lt; 1s Matchmaking</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                No endless swiping or waiting rooms. One tap pairs you directly with real people waiting to chat right now.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-red-500/40 transition-all hover:scale-[1.02] group">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 group-hover:scale-110 transition-transform">
                <Square className="w-6 h-6 text-red-400 fill-current" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">1-Tap CUT &amp; Esc Shortcuts</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Full control at your fingertips. If a conversation isn&apos;t your vibe, hit CUT or press Esc once to end it, and hit NEW to meet the next stranger.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-purple-500/40 transition-all hover:scale-[1.02] group">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                <Radio className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Bollywood Beats While Talking</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Spin our vintage Bollywood vinyl dock and stream iconic songs by Arijit Singh, Jubin Nautiyal, and KK while making new memories.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-amber-500/40 transition-all hover:scale-[1.02] group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6 text-amber-400 fill-current" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Zero Awkward Silences</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Ran out of words? Tap our 1-click Icebreaker Roll to spark fun, juicy questions that get both of you laughing instantly.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-emerald-500/40 transition-all hover:scale-[1.02] group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">100% Anonymous &amp; Private</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                No intrusive phone numbers or OTP verifications required. Chat privately with full end-to-end WebRTC peer encryption.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-cyan-500/40 transition-all hover:scale-[1.02] group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Real Humans, Zero Fake Bots</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                We despise dummy profiles. Every single person in the matchmaking queue is a live connected user ready to talk.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">Simple & Fast</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">How TIMEPASS Works</h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">Start meeting interesting people in three simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-pink-500/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 font-black text-lg mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-white mb-2">Pick Your Vibe & Preferences</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Choose to meet Girls, Boys, or Anyone. Add your favorite topics like Music, Movies, or Travel to match with people who share your interests.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-purple-500/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black text-lg mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-white mb-2">1-Click Instant Matchmaking</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Our smart queue pairs you with someone compatible in milliseconds using WebSockets and automated matchmaking.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-indigo-500/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-lg mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-white mb-2">Direct Peer-to-Peer Connection</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Enjoy encrypted WebSockets & WebRTC streams. Skip anytime with the NEXT button or report inappropriate users with 1 click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-black/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">Got Questions?</span>
            <h2 className="text-3xl font-black text-white mt-1">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Is TIMEPASS free to use?',
                a: 'Yes, TIMEPASS is 100% free. You can start video and text chats immediately without any hidden charges.'
              },
              {
                q: 'Do I have to share my phone number or personal details?',
                a: 'No. You can sign in with your Google account or continue as an instant guest with just your display name, gender, and region.'
              },
              {
                q: 'Are video calls recorded?',
                a: 'Never. WebRTC video calls are direct peer-to-peer streams encrypted between your browser and your chat partner. We do not record or store your calls.'
              },
              {
                q: 'How does moderation and safety work?',
                a: 'We have automated profanity filtering, one-click report and block tools, and a real-time admin moderation dashboard to maintain a clean and respectful community.'
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="glass-panel rounded-2xl border border-white/10 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between font-bold text-sm text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openFaq === idx ? 'rotate-180 text-pink-400' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {/* Auth Modal with Google & Guest with full details */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
