'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Smartphone, 
  Mail, 
  Chrome, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  UserCheck,
  ShieldCheck,
  Flame,
  Globe
} from 'lucide-react';
import { ConfirmationResult } from 'firebase/auth';
import { useAuth } from '@/lib/auth-context';
import { 
  setupRecaptcha, 
  sendFirebasePhoneOtp, 
  registerWithFirebaseEmail, 
  loginWithFirebaseEmail 
} from '@/lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'guest' | 'phone' | 'email';
}

const COUNTRY_CODES = [
  { code: '+91', country: 'India (IN)' },
  { code: '+1', country: 'United States / Canada' },
  { code: '+44', country: 'United Kingdom (UK)' },
  { code: '+61', country: 'Australia (AU)' },
  { code: '+49', country: 'Germany (DE)' },
  { code: '+33', country: 'France (FR)' },
  { code: '+81', country: 'Japan (JP)' },
  { code: '+971', country: 'UAE (AE)' },
  { code: '+55', country: 'Brazil (BR)' },
  { code: '+34', country: 'Spain (ES)' },
  { code: '+65', country: 'Singapore (SG)' }
];

export default function AuthModal({ isOpen, onClose, defaultTab = 'guest' }: AuthModalProps) {
  const { continueAsGuest, loginWithGoogle, syncFirebaseUser, login, register } = useAuth();
  const [tab, setTab] = useState<'guest' | 'phone' | 'email'>(defaultTab);

  // Guest State
  const [guestName, setGuestName] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(true);

  // Real Phone OTP State
  const [selectedCountryCode, setSelectedCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Real Email/Password State
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Resend Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  if (!isOpen) return null;

  // 1. Instant Guest Handler
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

  // 2. Real Mobile OTP: Send Real SMS via Firebase
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const cleanNum = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanNum.length < 7) {
      setError('Please enter a valid mobile number.');
      return;
    }

    const fullPhoneNumber = `${selectedCountryCode}${cleanNum}`;

    setOtpLoading(true);
    try {
      const appVerifier = setupRecaptcha('firebase-recaptcha-container');
      const confirmation = await sendFirebasePhoneOtp(fullPhoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setResendTimer(60);
      setSuccessNotice(`Real verification code dispatched via SMS to ${fullPhoneNumber}`);
    } catch (err: unknown) {
      const errObj = err as Error;
      console.error('Firebase Phone OTP Error:', errObj);
      if (errObj.message?.includes('auth/invalid-phone-number')) {
        setError('Invalid mobile phone number format.');
      } else if (errObj.message?.includes('auth/too-many-requests')) {
        setError('Too many SMS attempts. Please wait a few moments or try again later.');
      } else if (errObj.message?.includes('reCAPTCHA')) {
        setError('Verification challenge failed. Please refresh and try again.');
      } else {
        setError(errObj.message || 'Failed to dispatch real SMS verification code.');
      }
    } finally {
      setOtpLoading(false);
    }
  };

  // Real Mobile OTP: Verify SMS Code
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) {
      setError('Session expired. Please request a new SMS OTP.');
      return;
    }

    if (otpCode.length < 6) {
      setError('Please enter the full 6-digit SMS code.');
      return;
    }

    setError(null);
    setOtpLoading(true);

    try {
      const credential = await confirmationResult.confirm(otpCode);
      const fbUser = credential.user;

      const synced = await syncFirebaseUser({
        uid: fbUser.uid,
        phoneNumber: fbUser.phoneNumber,
        displayName: displayName.trim() || `User_${fbUser.phoneNumber?.slice(-4)}`,
        providerId: 'phone'
      });

      if (synced) {
        onClose();
      }
    } catch (err: unknown) {
      console.error('Verification code confirmation error:', err);
      setError('Incorrect or expired SMS verification code. Please check your text messages and re-enter.');
    } finally {
      setOtpLoading(false);
    }
  };

  // 3. Real Email & Password Handler
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegisterMode) {
        const fbUser = await registerWithFirebaseEmail(email, password, displayName);
        const synced = await syncFirebaseUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: displayName || fbUser.displayName,
          photoUrl: fbUser.photoURL,
          providerId: 'password'
        });
        if (synced) onClose();
      } else {
        const fbUser = await loginWithFirebaseEmail(email, password);
        const synced = await syncFirebaseUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoUrl: fbUser.photoURL,
          providerId: 'password'
        });
        if (synced) onClose();
      }
    } catch (err: unknown) {
      const errObj = err as Error;
      if (errObj.message?.includes('auth/invalid-credential') || errObj.message?.includes('auth/user-not-found') || errObj.message?.includes('auth/wrong-password')) {
        setError('Invalid email or password.');
      } else if (errObj.message?.includes('auth/email-already-in-use')) {
        setError('This email address is already registered. Please sign in instead.');
      } else if (errObj.message?.includes('auth/weak-password')) {
        setError('Password should be at least 6 characters long.');
      } else {
        // Fallback to local DB auth if Firebase email is not enabled in Firebase Console
        try {
          if (isRegisterMode) {
            const ok = await register({ email, password, displayName: displayName || email.split('@')[0] });
            if (ok) onClose();
          } else {
            const ok = await login(email, password);
            if (ok) onClose();
          }
        } catch {
          setError(errObj.message || 'Authentication failed');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Real Google Sign-In with Popup
  const handleGoogleClick = async () => {
    setError(null);
    setLoading(true);
    const success = await loginWithGoogle();
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md glass-panel rounded-3xl shadow-2xl border border-indigo-500/30 p-6 sm:p-7 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1.5 bg-gradient-to-r from-transparent via-brand-500 to-transparent" />

        {/* reCAPTCHA Invisible Container */}
        <div id="firebase-recaptcha-container" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-2">
            <Flame className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
            <span>Meet Real People Worldwide</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-wide">
            Sign In to <span className="gradient-text">TIMEPASS</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">Real video calls, real mobile OTP, and real connections.</p>
        </div>

        {/* Method Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-2xl mb-6 text-xs font-semibold">
          <button
            onClick={() => { setTab('guest'); setError(null); }}
            className={`py-2 rounded-xl transition-all ${
              tab === 'guest' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            Instant Guest
          </button>
          <button
            onClick={() => { setTab('phone'); setError(null); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === 'phone' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Mobile OTP</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </button>
          <button
            onClick={() => { setTab('email'); setError(null); }}
            className={`py-2 rounded-xl transition-all ${
              tab === 'email' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            Email Login
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* TAB 1: Instant Guest */}
        {tab === 'guest' && (
          <form onSubmit={handleGuestSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Pick a Cool Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Maverick, StarLord, Nova"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500"
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
                I confirm that I am at least <strong>18 years old</strong> and agree to follow Community Safety Guidelines.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl gradient-button text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-brand-500/30 hover:scale-102 active:scale-98 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Starting session...' : 'Start Chatting as Guest'}</span>
            </button>
          </form>
        )}

        {/* TAB 2: Real Mobile Number with Firebase SMS OTP */}
        {tab === 'phone' && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Your Real Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedCountryCode}
                      onChange={(e) => setSelectedCountryCode(e.target.value)}
                      className="w-28 px-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code} className="bg-dark-surface text-white">
                          {c.code} {c.country.split(' ')[0]}
                        </option>
                      ))}
                    </select>

                    <div className="relative flex-1">
                      <Smartphone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <input
                        type="tel"
                        required
                        placeholder="9876543210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Real 6-digit SMS code will be sent to your phone via Firebase.</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-3 rounded-xl gradient-button text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-brand-500/30"
                >
                  <span>{otpLoading ? 'Sending Real SMS...' : 'Send Real SMS OTP'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Enter 6-Digit SMS Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3.5 py-3 text-center tracking-[0.4em] text-xl font-bold rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-500"
                  />
                  <p className="text-[11px] text-gray-400 text-center mt-2">
                    Sent to {selectedCountryCode} {phoneNumber}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Your Display Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Phoenix"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={otpLoading || otpCode.length < 6}
                  className="w-full py-3 rounded-xl gradient-button text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{otpLoading ? 'Verifying...' : 'Verify & Enter TIMEPASS'}</span>
                </button>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(''); }}
                    className="text-brand-400 hover:underline"
                  >
                    Change phone number
                  </button>

                  {resendTimer > 0 ? (
                    <span className="text-gray-500">Resend SMS in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendPhoneOtp}
                      className="text-brand-400 hover:underline font-semibold"
                    >
                      Resend SMS Code
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: Real Email / Password */}
        {tab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your Name or Nickname"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl gradient-button text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25"
            >
              <span>{loading ? 'Processing...' : (isRegisterMode ? 'Create Real Account' : 'Sign In')}</span>
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

        {/* Social Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-dark-card text-gray-400">or connect in 1-click</span>
          </div>
        </div>

        {/* Real Google Sign-In Button */}
        <button
          onClick={handleGoogleClick}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-2.5 transition-all hover:scale-102 active:scale-98 shadow-md"
        >
          <Chrome className="w-4 h-4 text-brand-400" />
          <span>Continue with Real Google Account</span>
        </button>

        <p className="text-[10px] text-gray-400 text-center mt-4">
          Encrypted P2P video calls · Safe & verified connections · 18+ adults only
        </p>
      </div>
    </div>
  );
}
