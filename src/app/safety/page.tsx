import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield, AlertTriangle, EyeOff, Ban, CheckCircle, HeartHandshake, UserX } from 'lucide-react';

export default function SafetyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-dark-surface text-foreground">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-4 border border-brand-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-white">Community Safety & Guidelines</h1>
          <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto">
            TIMEPASS is designed to be a safe, welcoming, and enjoyable space to meet people worldwide. We enforce zero tolerance for abuse.
          </p>
        </div>

        {/* 18+ Rule Highlight */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3 mb-8">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-white mb-0.5">Strict Age Requirement (18+)</h3>
            <p className="leading-relaxed">
              TIMEPASS is exclusively for adults aged 18 and older. Minors are strictly prohibited from using this service. Any user suspected or verified to be under 18 is immediately banned and reported to relevant authorities if required by law.
            </p>
          </div>
        </div>

        {/* Prohibited Conduct Grid */}
        <h2 className="text-lg font-bold text-white mb-4">Prohibited Behaviors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="glass-panel p-5 rounded-xl border border-red-500/20 space-y-2">
            <div className="flex items-center gap-2 text-red-400 text-sm font-bold">
              <EyeOff className="w-4 h-4" />
              <span>Nudity & Sexual Content</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Exposing genitals, engaging in sexual acts, or displaying sexually explicit media on camera is strictly prohibited and results in an immediate permanent ban.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-red-500/20 space-y-2">
            <div className="flex items-center gap-2 text-red-400 text-sm font-bold">
              <UserX className="w-4 h-4" />
              <span>Harassment & Hate Speech</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Bullying, discrimination based on race, religion, gender, sexual orientation, disability, or threatening language will not be tolerated.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-red-500/20 space-y-2">
            <div className="flex items-center gap-2 text-red-400 text-sm font-bold">
              <Ban className="w-4 h-4" />
              <span>Spam, Bots & Scams</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Automated video playback, bot accounts, advertising third-party websites, cryptocurrency schemes, or commercial solicitations are blocked.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-red-500/20 space-y-2">
            <div className="flex items-center gap-2 text-red-400 text-sm font-bold">
              <Shield className="w-4 h-4" />
              <span>Doxxing & Privacy Violations</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Never ask for, share, or broadcast private personal info (home addresses, phone numbers, passwords, bank details) of yourself or others.
            </p>
          </div>
        </div>

        {/* Safe Chatting Tips */}
        <h2 className="text-lg font-bold text-white mb-4">Tips for a Great Conversation</h2>
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-start gap-2.5 text-xs text-gray-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Use the NEXT button freely:</strong> If someone makes you uncomfortable or you do not feel like talking, click NEXT without hesitation.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-gray-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Use Report & Block:</strong> Click the shield icon during any call to immediately disconnect and prevent that person from ever being matched with you again.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-gray-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Keep personal details private:</strong> Enjoy talking about hobbies, music, travel, and perspectives without giving away your real identity or home location.</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
