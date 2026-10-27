'use client';

import React, { useState } from 'react';
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
  HelpCircle,
  Play
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { POPULAR_INTERESTS, POPULAR_LANGUAGES, POPULAR_COUNTRIES } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Technology', 'Music']);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [selectedCountry, setSelectedCountry] = useState<string>('Global (Any)');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleStartChat = (mode: 'video' | 'text') => {
    // Encode preferences into query parameters for the chat session
    const params = new URLSearchParams();
    if (selectedInterests.length > 0) params.set('interests', selectedInterests.join(','));
    if (selectedLanguage) params.set('language', selectedLanguage);
    if (selectedCountry) params.set('country', selectedCountry);

    router.push(`/${mode}?${params.toString()}`);
  };

  const faqs = [
    {
      q: 'How does TIMEPASS work?',
      a: 'TIMEPASS matches you randomly with another available person for a one-on-one video call or text chat. If you share common interests or languages, our smart matchmaking engine prioritizes connecting you together. Press NEXT at any time to instantly meet someone new!'
    },
    {
      q: 'Are video conversations recorded or stored?',
      a: 'Never. TIMEPASS uses direct peer-to-peer WebRTC connections with DTLS-SRTP encryption. Your audio and video stream directly between you and your chat partner; no video is ever routed through or stored on our servers.'
    },
    {
      q: 'Do I need to create an account to chat?',
      a: 'No! You can chat immediately as a verified guest without signing up. However, creating a free account allows you to save custom interests, manage your profile avatar, keep a friends list, and remember blocked users.'
    },
    {
      q: 'How do you keep the community safe?',
      a: 'Every user has instant access to Report & Block controls during every conversation. Our automated filters block abusive words, and human moderators review flagged reports with prompt suspension and IP ban actions.'
    },
    {
      q: 'Is there an age requirement?',
      a: 'Yes, TIMEPASS is strictly for users 18 years of age and older. Underage accounts are permanently removed.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-dark-surface text-foreground">
      <Navbar onOpenAuth={() => setIsAuthOpen(true)} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Glow backdrop lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[250px] bg-accent-purple/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-brand-300 mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Redesigned, Safer & Modern Random Social Discovery</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight mb-4">
            Your Next Conversation Is <br className="hidden sm:block" />
            <span className="gradient-text">One Click Away.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            Meet verified, interesting people worldwide through encrypted one-to-one video calls and instant text chat. Filter by hobbies, speak your language, or discover random serendipity.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={() => handleStartChat('video')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl gradient-button text-white font-bold text-base flex items-center justify-center gap-3 shadow-xl shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              <Video className="w-5 h-5" />
              <span>Start Video Chat</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleStartChat('text')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-panel hover:bg-white/10 text-white font-bold text-base flex items-center justify-center gap-3 border border-white/10 transition-all hover:scale-105 active:scale-95"
            >
              <MessageSquare className="w-5 h-5 text-accent-purple" />
              <span>Start Text Chat</span>
            </button>
          </div>

          {/* Preferences Card */}
          <div className="glass-panel p-6 rounded-2xl max-w-2xl mx-auto text-left shadow-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>Customize Your Match Preferences</span>
              </h3>
              <span className="text-[11px] text-gray-400">Optional · Boosts matching relevance</span>
            </div>

            {/* Interest Chips */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Select What You Love Talking About:
              </label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30 border border-brand-400/30 scale-105'
                          : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language & Country Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Preferred Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                >
                  <option value="Any" className="bg-dark-surface text-white">Any Language</option>
                  {POPULAR_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang} className="bg-dark-surface text-white">
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Country Preference
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                >
                  {POPULAR_COUNTRIES.map((country) => (
                    <option key={country} value={country} className="bg-dark-surface text-white">
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-dark-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Built for Modern Real-Time Serendipity
            </h2>
            <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto">
              Everything you loved about instant discovery, upgraded with safety, HD video quality, and genuine privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/10 relative group hover:border-brand-500/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Instant One-Click Matching</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                No long onboarding or waiting rooms. Click start and instantly connect with another chatter anywhere on earth in under 2 seconds.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10 relative group hover:border-accent-purple/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-accent-purple/20 text-accent-purple flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Peer-to-Peer Encrypted</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Calls stream directly device-to-device via standard WebRTC DTLS encryption. Zero server recording, zero hidden storage.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10 relative group hover:border-emerald-500/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Proactive Safety & Moderation</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                One-click report & block instantly breaks connections. Automated filters remove toxic text and rogue actors are swiftly banned.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How TIMEPASS Works</h2>
            <p className="text-sm text-gray-400 mt-2">Three effortless steps to meet someone new.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6 glass-panel rounded-2xl border border-white/10">
              <div className="w-10 h-10 rounded-full gradient-button text-white font-black text-sm flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Pick Your Mode</h4>
              <p className="text-xs text-gray-400">Choose Video Chat with camera & mic, or casual anonymous Text Chat.</p>
            </div>

            <div className="p-6 glass-panel rounded-2xl border border-white/10">
              <div className="w-10 h-10 rounded-full gradient-button text-white font-black text-sm flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Get Matched</h4>
              <p className="text-xs text-gray-400">Our engine pairs you with a random stranger who shares your interests.</p>
            </div>

            <div className="p-6 glass-panel rounded-2xl border border-white/10">
              <div className="w-10 h-10 rounded-full gradient-button text-white font-black text-sm flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Talk or Hit NEXT</h4>
              <p className="text-xs text-gray-400">Enjoy great conversation, add friends, or press NEXT whenever you want to move on.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-dark-card/20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-sm text-gray-400 mt-2">Everything you need to know about TIMEPASS.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="glass-panel rounded-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-5 py-4 text-left text-sm font-semibold text-white flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openFaq === idx ? 'rotate-180 text-brand-400' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-xs text-gray-300 leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
