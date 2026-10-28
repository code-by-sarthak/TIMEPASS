import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Heart, Globe, AlertTriangle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-dark-surface/80 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand & Mission */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-wider text-white">TIME</span>
            <span className="font-extrabold text-lg tracking-wider gradient-text">PASS</span>
          </div>
          <p className="text-sm text-gray-400">
            A next-generation random video and text discovery network. Meet verified, interesting strangers worldwide instantly with one click.
          </p>
          <div className="flex items-center gap-2 text-xs text-amber-400/90 bg-amber-400/10 p-2 rounded-lg border border-amber-400/20">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Strictly 18+ adults only. Inappropriate conduct is immediately blocked and banned.</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Discovery Modes</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <Link href="/video" className="hover:text-brand-400 transition-colors">Instant Video Chat</Link>
            </li>
            <li>
              <Link href="/rooms" className="hover:text-pink-400 transition-colors flex items-center gap-1.5">
                <span>8-Member Custom Rooms</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-pink-500/20 text-pink-300 font-bold">8👥</span>
              </Link>
            </li>
            <li>
              <Link href="/profile" className="hover:text-brand-400 transition-colors">Interest Filters</Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-brand-400 transition-colors">Platform Moderation</Link>
            </li>
          </ul>
        </div>

        {/* Safety & Guidelines */}
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Safety & Privacy</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <Link href="/safety" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" /> Community Guidelines
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-400" /> P2P Encryption & Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link>
            </li>
          </ul>
        </div>

        {/* Platform Integrity */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">P2P Architecture</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            All video and audio communications stream peer-to-peer via standard encrypted WebRTC (DTLS-SRTP). No video is recorded or stored on any server.
          </p>
          <div className="flex items-center gap-3 pt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-emerald-400" /> 190+ Countries</span>
            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-pink-400" /> Free Always</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400">
        <p>&copy; {new Date().getFullYear()} TIMEPASS. All rights reserved.</p>
        <p className="mt-2 sm:mt-0">Designed for safe, instant human connection.</p>
      </div>
    </footer>
  );
}
