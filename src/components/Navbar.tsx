'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Video, MessageSquare, Shield, User as UserIcon, Sun, Moon, LogIn, LogOut, Radio, Clock, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { getSocket } from '@/lib/socket';

interface NavbarProps {
  onOpenAuth?: () => void;
}

export default function Navbar({ onOpenAuth }: NavbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (socket && socket.on) {
      socket.on('online-count', (data: { count: number }) => {
        setOnlineCount(data.count || 1);
      });
    }

    return () => {
      if (socket && socket.off) {
        socket.off('online-count');
      }
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-indigo-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-wider text-white">TIME</span>
              <span className="font-extrabold text-xl tracking-wider gradient-text">PASS</span>
            </div>
            <p className="text-[10px] text-gray-400 -mt-1 hidden sm:block tracking-wide">Meet Someone New. Anytime.</p>
          </div>
        </Link>

        {/* Live Online Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{onlineCount.toLocaleString()} {onlineCount === 1 ? 'user' : 'users'} online</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/video"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
              pathname === '/video'
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Video className="w-4 h-4 text-brand-400" />
            <span className="hidden sm:inline">Video Chat</span>
          </Link>

          <Link
            href="/text"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
              pathname === '/text'
                ? 'bg-accent-purple/20 text-purple-300 border border-purple-500/30'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-accent-purple" />
            <span className="hidden sm:inline">Text Chat</span>
          </Link>

          <Link
            href="/safety"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
              pathname === '/safety'
                ? 'bg-blue-500/20 text-blue-300'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="hidden md:inline">Safety</span>
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* User Account / Profile Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                  alt={user.displayName}
                  className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/30"
                />
                <span className="text-sm font-medium text-white max-w-[100px] truncate hidden sm:inline">
                  {user.displayName}
                </span>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 py-2 glass-panel rounded-xl shadow-xl z-50 border border-white/10"
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-xs text-gray-400">Signed in as</p>
                    <p className="text-sm font-semibold text-white truncate">{user.displayName}</p>
                    {user.isGuest && (
                      <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                        Guest Mode
                      </span>
                    )}
                  </div>

                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                    <UserIcon className="w-4 h-4 text-brand-400" />
                    <span>My Profile</span>
                  </Link>

                  <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                    <ShieldAlert className="w-4 h-4 text-accent-pink" />
                    <span>Admin Dashboard</span>
                  </Link>

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-lg gradient-button text-white text-sm font-medium flex items-center gap-1.5 shadow-md shadow-brand-500/20"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
