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
  Play
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import BollywoodMusicPlayer from '@/components/BollywoodMusicPlayer';
import { POPULAR_INTERESTS, POPULAR_LANGUAGES } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const LIVE_ACTIVITIES = [
  { name: 'Priya', city: 'Mumbai', mode: 'Video Call', time: 'Just now', gender: 'Female', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { name: 'Aryan', city: 'Delhi NCR', mode: 'Video Call', time: '1m ago', gender: 'Male', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Ananya', city: 'Bengaluru', mode: 'Text Chat', time: '2m ago', gender: 'Female', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
  { name: 'Rohan', city: 'Punjab', mode: 'Video Call', time: '3m ago', gender: 'Male', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { name: 'Simran', city: 'Kolkata', mode: 'Video Call', time: 'Just now', gender: 'Female', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { name: 'Kabir', city: 'Pune', mode: 'Text Chat', time: '4m ago', gender: 'Male', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' }
];

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

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Music', 'Movies', 'Travel']);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Hindi');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<'Anyone' | 'Girls' | 'Guys'>('Anyone');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeActivityIndex, setActiveActivityIndex] = useState(0);

  // Rotate live activity ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveActivityIndex((prev) => (prev + 1) % LIVE_ACTIVITIES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleStartChat = (mode: 'video' | 'text') => {
    // If not signed in or guest, prompt AuthModal with full details!
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    const params = new URLSearchParams();
    if (selectedInterests.length > 0) params.set('interests', selectedInterests.join(','));
    if (selectedLanguage) params.set('language', selectedLanguage);
    if (selectedGenderFilter !== 'Anyone') params.set('genderPref', selectedGenderFilter);

    router.push(`/${mode}?${params.toString()}`);
  };

  const currentActivity = LIVE_ACTIVITIES[activeActivityIndex];

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
          
          {/* Live Activity Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/5 border border-pink-500/20 text-xs font-semibold text-pink-300 mb-6 shadow-lg shadow-pink-500/5 animate-in fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" />
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentActivity.avatar} alt={currentActivity.name} className="w-4 h-4 rounded-full object-cover" />
            <span>
              <strong>{currentActivity.name}</strong> from <strong>{currentActivity.city}</strong> joined {currentActivity.mode}
            </span>
            <span className="text-[10px] text-gray-400">({currentActivity.time})</span>
          </div>

          {/* Hero Heading */}
          <h1 className="text-4xl sm:text-7xl font-black tracking-tight text-white leading-[1.1] mb-4">
            Meet Someone New. <br />
            <span className="bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Anytime. Anywhere.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            The most addictive real-time social discovery platform. Instant one-on-one video calls and text chats with charming, genuine people worldwide.
          </p>

          {/* Main Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <button
              onClick={() => handleStartChat('video')}
              className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-black text-base flex items-center justify-center gap-3 shadow-2xl shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              <Video className="w-5 h-5 fill-current" />
              <span>Start Video Chat</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleStartChat('text')}
              className="w-full sm:w-auto px-9 py-4 rounded-2xl glass-panel hover:bg-white/10 text-white font-black text-base flex items-center justify-center gap-3 border border-white/10 hover:scale-105 active:scale-95 transition-all"
            >
              <MessageSquare className="w-5 h-5 text-pink-400" />
              <span>Start Text Chat</span>
            </button>
          </div>

          {/* Gender Preference Quick Toggle */}
          <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 mb-8 text-xs font-bold">
            <span className="px-3 py-1 text-gray-400">Match Preference:</span>
            {(['Anyone', 'Girls', 'Guys'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedGenderFilter(mode)}
                className={`px-4 py-1.5 rounded-xl transition-all ${
                  selectedGenderFilter === mode
                    ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {mode === 'Girls' ? '👩 Girls' : mode === 'Guys' ? '👨 Guys' : '✨ Anyone'}
              </button>
            ))}
          </div>

          {/* Preferences Card */}
          <div className="glass-panel p-6 rounded-3xl max-w-2xl mx-auto text-left shadow-2xl border border-pink-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span>Customize Your Vibe & Interests</span>
              </h3>
              <span className="text-[11px] text-gray-400">Boosts matching chemistry</span>
            </div>

            {/* Interest Chips */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {POPULAR_INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30 border border-pink-400/30 scale-105'
                          : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language Preference */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-gray-300 font-semibold">Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-pink-500"
              >
                <option value="Hindi" className="bg-dark-surface text-white">Hindi & Hinglish</option>
                {POPULAR_LANGUAGES.map((l) => (
                  <option key={l} value={l} className="bg-dark-surface text-white">{l}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Romantic Bollywood Discovery Vibes Carousel Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-dark-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-300 text-xs font-bold mb-2">
              <Heart className="w-3 h-3 text-pink-500 fill-current" />
              <span>Feel the Bollywood Spark</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Every Great Story Starts with a Hello.
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 max-w-lg mx-auto">
              From late night conversations to spontaneous travel plans, meet people who match your energy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ROMANTIC_VIBES.map((card, idx) => (
              <div
                key={idx}
                className="group relative rounded-3xl overflow-hidden glass-panel border border-white/10 hover:border-pink-500/40 transition-all hover:scale-102 duration-300"
              >
                <div className="h-64 w-full relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 filter brightness-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-surface via-black/40 to-transparent" />
                  
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-pink-600/80 backdrop-blur-md text-[10px] font-black uppercase text-white shadow-lg">
                    {card.badge}
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-black text-white mb-1">{card.title}</h3>
                  <p className="text-xs text-gray-400">{card.vibe}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Active Chatters Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-pink-500 fill-current" />
                <span>Active Chatters Right Now</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">Real people waiting to be matched in 1 click.</p>
            </div>

            <button
              onClick={() => handleStartChat('video')}
              className="px-5 py-2.5 rounded-xl gradient-button text-white text-xs font-bold flex items-center gap-1.5 w-fit shadow-md shadow-pink-500/20"
            >
              <span>Join The Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {LIVE_ACTIVITIES.map((chatter, idx) => (
              <div
                key={idx}
                onClick={() => handleStartChat('video')}
                className="glass-panel p-3.5 rounded-2xl border border-white/10 hover:border-pink-500/30 cursor-pointer group transition-all text-center"
              >
                <div className="relative w-14 h-14 mx-auto mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={chatter.avatar}
                    alt={chatter.name}
                    className="w-full h-full rounded-full object-cover border-2 border-pink-500/40 group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-dark-surface" />
                </div>
                <p className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors">{chatter.name}</p>
                <p className="text-[10px] text-gray-400">📍 {chatter.city}</p>
                <span className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 font-semibold">
                  {chatter.mode}
                </span>
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
