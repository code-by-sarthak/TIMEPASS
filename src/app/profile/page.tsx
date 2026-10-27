'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User as UserIcon, 
  Settings, 
  Shield, 
  Users, 
  Ban, 
  Trash2, 
  Sparkles, 
  Save, 
  Clock, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { POPULAR_INTERESTS, POPULAR_LANGUAGES, POPULAR_COUNTRIES } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, updateUser, deleteAccount } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('Global');
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [interests, setInterests] = useState<string[]>(['Gaming', 'Technology']);
  const [blocks, setBlocks] = useState<Array<{ id: string; username: string; displayName: string; avatarUrl: string }>>([]);
  const [friends, setFriends] = useState<Array<{ id: string; username: string; displayName: string; avatarUrl: string }>>([]);
  const [history, setHistory] = useState<Array<{ id: string; mode: string; startedAt: string; durationSeconds: number; partner: { id: string; displayName: string; avatarUrl: string } }>>([]);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'friends' | 'blocks' | 'history'>('profile');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      if (user.profile) {
        setBio(user.profile.bio || '');
        setCountry(user.profile.country || 'Global');
        if (user.profile.languages) {
          setLanguages(user.profile.languages.split(',').filter(Boolean));
        }
        if (user.profile.interests) {
          setInterests(user.profile.interests.split(',').filter(Boolean));
        }
      }
    }
  }, [user]);

  // Fetch friends and blocks
  useEffect(() => {
    if (!token) return;

    fetch('/api/profile/blocks', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.blocks) setBlocks(data.blocks); })
      .catch(() => {});

    fetch('/api/profile/friends', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.friends) setFriends(data.friends); })
      .catch(() => {});

    fetch('/api/profile/history', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.conversations) setHistory(data.conversations); })
      .catch(() => {});
  }, [token]);

  const handleToggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName,
          bio,
          country,
          languages,
          interests,
        })
      });

      if (res.ok) {
        setSaveSuccess(true);
        updateUser({ displayName });
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async (blockedId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/profile/blocks/${blockedId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setBlocks((prev) => prev.filter((b) => b.id !== blockedId));
      }
    } catch {
      //
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to permanently delete your account and all associated data? This action cannot be undone.')) {
      await deleteAccount();
      router.push('/');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-dark-surface text-foreground">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <UserIcon className="w-12 h-12 text-gray-400 mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Sign in to view your profile</h2>
          <p className="text-xs text-gray-400 mb-6">Create a profile to save favorite interests, friends, and settings.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 rounded-xl gradient-button text-white text-xs font-bold"
          >
            Go to Home
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark-surface text-foreground">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {/* User Card Header */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 mb-6 flex flex-col sm:flex-row items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=timepass'}
            alt={user.displayName}
            className="w-20 h-20 rounded-2xl border-2 border-brand-500/40 bg-brand-500/10 shadow-lg"
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl font-black text-white">{user.displayName}</h1>
              {user.isGuest ? (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-semibold w-fit">
                  Guest Session
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-300 text-[10px] font-semibold w-fit">
                  Verified Member
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">@{user.username} · Joined {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'profile' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Profile & Interests
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'friends' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('blocks')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'blocks' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Blocked Users ({blocks.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'history' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Recent History
          </button>
        </div>

        {/* TAB 1: Profile & Interests */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-brand-400" />
                <span>General Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                  >
                    {POPULAR_COUNTRIES.map((c) => (
                      <option key={c} value={c} className="bg-dark-surface text-white">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Bio / Status</label>
                <textarea
                  rows={2}
                  placeholder="Tell people a little about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Interests Chips */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>Selected Interests</span>
              </h3>
              <p className="text-xs text-gray-400 mb-4">Click tags to toggle. The matchmaking engine prioritizes chatter matching based on these.</p>

              <div className="flex flex-wrap gap-2">
                {POPULAR_INTERESTS.map((item) => {
                  const selected = interests.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleToggleInterest(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        selected
                          ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30 border border-brand-400/30'
                          : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl gradient-button text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-500/25"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>

              {saveSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Profile saved!
                </span>
              )}

              <button
                type="button"
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Friends */}
        {activeTab === 'friends' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-sm font-bold text-white mb-4">Your Friends</h3>
            {friends.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">
                No friends added yet. Click &quot;Add Friend&quot; during great video or text chats to stay connected!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {friends.map((f) => (
                  <div key={f.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.avatarUrl} alt={f.displayName} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="text-xs font-bold text-white">{f.displayName}</p>
                      <p className="text-[10px] text-gray-400">@{f.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Blocked Users */}
        {activeTab === 'blocks' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-sm font-bold text-white mb-2">Blocked Users</h3>
            <p className="text-xs text-gray-400 mb-4">You will never be matched with users in this list.</p>

            {blocks.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">
                Your block list is empty.
              </p>
            ) : (
              <div className="space-y-2">
                {blocks.map((b) => (
                  <div key={b.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.avatarUrl} alt={b.displayName} className="w-8 h-8 rounded-full" />
                      <div>
                        <p className="text-xs font-bold text-white">{b.displayName}</p>
                        <p className="text-[10px] text-gray-400">@{b.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnblock(b.id)}
                      className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: History */}
        {activeTab === 'history' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-sm font-bold text-white mb-4">Recent Conversations</h3>
            {history.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">
                No conversation history yet. Start a video or text chat to meet someone new!
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.partner.avatarUrl} alt={item.partner.displayName} className="w-8 h-8 rounded-full" />
                      <div>
                        <p className="font-bold text-white">{item.partner.displayName}</p>
                        <p className="text-[10px] text-gray-400">{item.mode.toUpperCase()} Call · {item.durationSeconds}s</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(item.startedAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
