'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Plus, 
  Gamepad2, 
  Music2, 
  Coffee, 
  Film, 
  Code, 
  Lock, 
  Sparkles, 
  Radio, 
  ArrowRight, 
  Search,
  X,
  ShieldCheck,
  Flame,
  Volume2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BollywoodMusicPlayer from '@/components/BollywoodMusicPlayer';
import TimepassLogo from '@/components/TimepassLogo';
import { useAuth } from '@/lib/auth-context';
import { soundManager } from '@/lib/sound';

interface RoomSummary {
  id: string;
  name: string;
  category: 'Gaming' | 'Music' | 'Hangout' | 'Movies' | 'Tech';
  description: string;
  hostName: string;
  isSystemRoom?: boolean;
  memberCount: number;
  maxMembers: number;
  isPrivate: boolean;
  nowPlayingTrackId?: string;
  createdAt: number;
}

const CATEGORIES = [
  { id: 'All', label: 'All Rooms', icon: Flame },
  { id: 'Gaming', label: '🎮 Gaming', icon: Gamepad2 },
  { id: 'Music', label: '🎵 Music & Jam', icon: Music2 },
  { id: 'Hangout', label: '☕ Hangout', icon: Coffee },
  { id: 'Movies', label: '🎬 Movies', icon: Film },
  { id: 'Tech', label: '💻 Tech', icon: Code },
];

export default function RoomsLobbyPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create room form state
  const [roomName, setRoomName] = useState('');
  const [roomCategory, setRoomCategory] = useState<'Gaming' | 'Music' | 'Hangout' | 'Movies' | 'Tech'>('Gaming');
  const [roomDescription, setRoomDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch rooms list
  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data.success && Array.isArray(data.rooms)) {
        setRooms(data.rooms);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setErrorMsg('Please enter a room name');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomName.trim(),
          category: roomCategory,
          description: roomDescription.trim(),
          hostId: user?.id || `usr_${Date.now()}`,
          hostName: user?.displayName || 'Anonymous Host',
          isPrivate,
          passcode: isPrivate ? passcode.trim() : undefined,
          maxMembers: 8 // Strictly 8 members!
        })
      });

      const data = await res.json();
      if (data.success && data.room) {
        soundManager.playPop();
        router.push(`/rooms/${data.room.id}`);
      } else {
        setErrorMsg(data.error || 'Failed to create room');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-dark-surface text-foreground selection:bg-pink-500 selection:text-white">
      <Navbar />

      {/* Persistent Bollywood Romance Music Dock */}
      <div className="sticky top-16 z-30 w-full px-4 py-2 bg-black/60 backdrop-blur-md border-b border-pink-500/15 flex items-center justify-center">
        <BollywoodMusicPlayer />
      </div>

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-8 pb-10 px-4 sm:px-6 lg:px-8 border-b border-white/5 bg-gradient-to-b from-dark-surface via-pink-950/15 to-dark-surface">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs font-bold text-pink-300 mb-4">
            <Users className="w-3.5 h-3.5 text-pink-400" />
            <span>Multiplayer Social Hangouts · Max 8 Members</span>
          </div>

          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-3">
            8-Member Custom Rooms. <br />
            <span className="bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Hangout, Game &amp; Jam Together.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-xs sm:text-sm md:text-base text-gray-300 mb-8 leading-relaxed px-2">
            Jump into live 8-member group rooms for BGMI/Valorant squads, late night Bollywood antakshari, 
            chai pe charcha, and chill conversations with friends or strangers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                soundManager.playPop();
                setIsCreateModalOpen(true);
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-sm shadow-xl shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create 8-Member Room</span>
            </button>

            <button
              onClick={() => router.push('/video')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl glass-toolbar border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <Radio className="w-4 h-4 text-pink-400" />
              <span>1-on-1 Random Video</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Rooms Section */}
      <section className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter Pills & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    soundManager.playPop();
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25 scale-105'
                      : 'glass-panel text-gray-300 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-400 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* Room Cards Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin mb-3" />
            <p className="text-xs text-gray-400">Loading live custom rooms...</p>
          </div>
        ) : filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map((room) => {
              const isFull = room.memberCount >= room.maxMembers;
              const fillPercentage = (room.memberCount / room.maxMembers) * 100;

              return (
                <div
                  key={room.id}
                  className="glass-panel p-5 rounded-3xl border border-white/10 hover:border-pink-500/40 transition-all duration-300 flex flex-col justify-between hover:scale-[1.02] shadow-xl group"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500/15 text-pink-300 border border-pink-500/30">
                        {room.category}
                      </span>

                      {/* Member Capacity Indicator (Max 8) */}
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold">
                        <Users className="w-3 h-3 text-pink-400" />
                        <span className={isFull ? 'text-red-400' : 'text-emerald-400'}>
                          {room.memberCount}/{room.maxMembers}
                        </span>
                        {isFull && <span className="text-[9px] text-red-400 uppercase font-black">FULL</span>}
                      </div>
                    </div>

                    {/* Room Title */}
                    <h3 className="text-base font-black text-white group-hover:text-pink-300 transition-colors line-clamp-1">
                      {room.name}
                    </h3>

                    {/* Room Description */}
                    <p className="text-xs text-gray-300 mt-1.5 line-clamp-2 leading-relaxed">
                      {room.description}
                    </p>
                  </div>

                  {/* Room Meta & Action */}
                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="truncate">
                      {room.isSystemRoom || !room.hostName ? (
                        <>
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span>Official Public Lounge</span>
                          </span>
                          <span className="text-xs text-gray-400 truncate block">
                            TIMEPASS Community
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] text-pink-400 font-bold block">Created by</span>
                          <span className="text-xs font-bold text-white truncate block max-w-[140px]">
                            {room.hostName}
                          </span>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        soundManager.playPop();
                        router.push(`/rooms/${room.id}`);
                      }}
                      disabled={isFull}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md ${
                        isFull
                          ? 'bg-white/10 text-gray-500 cursor-not-allowed'
                          : 'gradient-button text-white shadow-pink-500/20 hover:scale-105 active:scale-95'
                      }`}
                    >
                      <span>{isFull ? 'Room Full' : 'Join Room'}</span>
                      {!isFull && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel p-10 rounded-3xl border border-white/10 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-pink-500/10 text-pink-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">No rooms found in this category</h4>
              <p className="text-xs text-gray-400 mt-1">Be the first to create an 8-member squad room right now!</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 rounded-xl gradient-button text-white text-xs font-black shadow-lg shadow-pink-500/20"
            >
              + Create Room
            </button>
          </div>
        )}
      </section>

      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-pink-500/30 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-white">Create 8-Member Room</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Room Name *</label>
                <input
                  type="text"
                  placeholder="e.g. BGMI Squad Push 🏆 or Chai Pe Charcha ☕"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  maxLength={40}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Gaming', 'Music', 'Hangout', 'Movies', 'Tech'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setRoomCategory(cat)}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition-all ${
                        roomCategory === cat
                          ? 'bg-pink-500/25 text-pink-300 border-pink-500/60 shadow-sm'
                          : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {cat === 'Gaming' && '🎮 Gaming'}
                      {cat === 'Music' && '🎵 Music'}
                      {cat === 'Hangout' && '☕ Hangout'}
                      {cat === 'Movies' && '🎬 Movies'}
                      {cat === 'Tech' && '💻 Tech'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Description / Topic</label>
                <textarea
                  rows={2}
                  placeholder="Tell people what this room is about..."
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  maxLength={120}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 text-xs resize-none"
                />
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Capacity Limit</span>
                  <span className="text-[10px] text-gray-400">Strictly 8 members max</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300 font-black text-xs border border-pink-500/30">
                  8 Members
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl glass-panel text-gray-300 hover:text-white font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !roomName.trim()}
                  className="px-6 py-2.5 rounded-xl gradient-button text-white font-black text-xs shadow-lg shadow-pink-500/25 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create & Enter Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
