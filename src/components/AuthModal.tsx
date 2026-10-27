'use client';

import React, { useState } from 'react';
import { X, Smartphone, Mail, Chrome, CheckCircle2, AlertCircle, ArrowRight, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'guest' | 'phone' | 'email';
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'guest' }: AuthModalProps) {
  const { continueAsGuest, login, register, sendOtp, verifyOtp, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState<'guest' | 'phone' | 'email'>(defaultTab);

  // Guest State
  const [guestName, setGuestName] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(true);

  // Phone OTP State
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  // Email/Pass State
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Guest Handler
  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ageConfirmed) {
      setError('You must confirm you are 18 years or older.');
      return;
    }
    setLoading(true);
    const success = await continueAsGuest({ displayName: guestName.trim() || undefined });
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  // 2. Phone OTP Handlers
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOtpLoading(true);
    const res = await sendOtp(phone);
    setOtpLoading(false);
    if (res.success) {
      setOtpSent(true);
      if (res.devCode) {
        setDevCode(res.devCode);
        setOtpCode(res.devCode); // Auto-fill for developer convenience!
      }
    } else {
      setError(res.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOtpLoading(true);
    const success = await verifyOtp(phone, otpCode);
    setOtpLoading(false);
    if (success) {
      onClose();
    }
  };

  // 3. Email/Password Handler
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (isRegisterMode) {
      const ok = await register({ email, password, displayName: displayName || email.split('@')[0] });
      setLoading(false);
      if (ok) onClose();
    } else {
      const ok = await login(email, password);
      setLoading(false);
      if (ok) onClose();
    }
  };

  // 4. Google Sign-In Simulation
  const handleGoogleSignIn = async () => {
    const demoGoogleUser = {
      email: `google.user.${Math.floor(100 + Math.random() * 900)}@gmail.com`,
      displayName: 'Alex Cooper',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };
    const ok = await loginWithGoogle(demoGoogleUser);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md glass-panel rounded-2xl shadow-2xl border border-white/10 p-6 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Welcome to <span className="gradient-text">TIMEPASS</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">Connect with someone new in seconds.</p>
        </div>

        {/* Method Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl mb-6 text-xs font-medium">
          <button
            onClick={() => { setTab('guest'); setError(null); }}
            className={`py-2 rounded-lg transition-all ${
              tab === 'guest' ? 'bg-brand-500 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Instant Guest
          </button>
          <button
            onClick={() => { setTab('phone'); setError(null); }}
            className={`py-2 rounded-lg transition-all ${
              tab === 'phone' ? 'bg-brand-500 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Mobile OTP
          </button>
          <button
            onClick={() => { setTab('email'); setError(null); }}
            className={`py-2 rounded-lg transition-all ${
              tab === 'email' ? 'bg-brand-500 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Email Login
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Instant Guest */}
        {tab === 'guest' && (
          <form onSubmit={handleGuestSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Choose a Display Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. NeonVoyager"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-300">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-gray-600 text-brand-500 focus:ring-0"
              />
              <span>
                I confirm that I am at least <strong>18 years old</strong> and agree to follow the Community Safety Guidelines.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl gradient-button text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Starting session...' : 'Start Chatting as Guest'}</span>
            </button>
          </form>
        )}

        {/* Tab 2: Mobile OTP */}
        {tab === 'phone' && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    Mobile Phone Number
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">We will send a 6-digit one-time code to verify.</p>
                </div>

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-2.5 rounded-xl gradient-button text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25"
                >
                  <span>{otpLoading ? 'Sending OTP...' : 'Send Verification Code'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {devCode && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
                    <span>Dev OTP Code: <strong>{devCode}</strong></span>
                    <span className="text-[10px] text-emerald-400">(Auto-filled)</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-center tracking-widest text-lg font-bold rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-2.5 rounded-xl gradient-button text-white font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{otpLoading ? 'Verifying...' : 'Verify & Enter'}</span>
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(''); }}
                    className="text-xs text-brand-400 hover:underline"
                  >
                    Change phone number
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 3: Email / Password */}
        {tab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your Name or Nickname"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl gradient-button text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25"
            >
              <span>{loading ? 'Processing...' : (isRegisterMode ? 'Create Account' : 'Sign In')}</span>
            </button>

            <div className="text-center text-xs text-gray-400 pt-1">
              {isRegisterMode ? (
                <span>Already have an account? <button type="button" onClick={() => setIsRegisterMode(false)} className="text-brand-400 hover:underline">Log in</button></span>
              ) : (
                <span>No account yet? <button type="button" onClick={() => setIsRegisterMode(true)} className="text-brand-400 hover:underline">Register free</button></span>
              )}
            </div>
          </form>
        )}

        {/* Social Login Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-dark-card text-gray-400">or connect with</span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex items-center justify-center gap-2.5 transition-colors"
        >
          <Chrome className="w-4 h-4 text-brand-400" />
          <span>Continue with Google</span>
        </button>

        <p className="text-[10px] text-gray-400 text-center mt-4">
          By signing in, you agree to our Terms of Service and Privacy Policy. All calls are peer-to-peer encrypted.
        </p>
      </div>
    </div>
  );
}
