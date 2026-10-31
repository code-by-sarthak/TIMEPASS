'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Video, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Ban, 
  Clock, 
  Activity, 
  Key, 
  Lock,
  RefreshCw,
  Search,
  Radio,
  Send,
  Trash2,
  UserX,
  Sparkles,
  Volume2,
  Crown
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AdminStats, ReportItem } from '@/lib/types';

interface DetailedRoom {
  id: string;
  name: string;
  category: string;
  description: string;
  hostName: string;
  isSystemRoom: boolean;
  memberCount: number;
  maxMembers: number;
  members: Array<{
    socketId: string;
    userId: string;
    displayName: string;
    isHost: boolean;
    isMuted: boolean;
    isVideoOff: boolean;
  }>;
  createdAt: number;
}

interface ActiveSocket {
  socketId: string;
  userId: string;
  displayName: string;
  gender?: string;
  region?: string;
  mode: string;
  joinedAt: number;
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; email?: string; username: string; displayName: string; role: string; isBanned: boolean; banReason?: string; createdAt: string }>>([]);
  const [rooms, setRooms] = useState<DetailedRoom[]>([]);
  const [activeSockets, setActiveSockets] = useState<ActiveSocket[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'rooms' | 'broadcast' | 'sockets' | 'reports' | 'users' | 'health'>('rooms');
  const [filterReason, setFilterReason] = useState<string>('ALL');

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('Official TIMEPASS Announcement');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState<string | null>(null);

  // Attempt auto-login if stored in localStorage/sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = sessionStorage.getItem('timepass_admin_key') || localStorage.getItem('timepass_admin_key');
      if (storedKey) {
        setAdminKey(storedKey);
        fetchDashboardData(storedKey);
      }
    }
  }, []);

  const fetchDashboardData = useCallback(async (key: string) => {
    try {
      setAuthError(null);

      // 1. Fetch Stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { 'x-admin-key': key }
      });
      if (!statsRes.ok) {
        throw new Error('Invalid Admin Key. Access denied.');
      }
      const statsData = await statsRes.json();
      setStats(statsData);

      // 2. Fetch Live Rooms
      const roomsRes = await fetch('/api/admin/rooms', {
        headers: { 'x-admin-key': key }
      });
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(roomsData.rooms || []);
      }

      // 3. Fetch Active Sockets
      const socketsRes = await fetch('/api/admin/active-sockets', {
        headers: { 'x-admin-key': key }
      });
      if (socketsRes.ok) {
        const socketsData = await socketsRes.json();
        setActiveSockets(socketsData.activeSockets || []);
      }

      // 4. Fetch Reports
      const reportsRes = await fetch('/api/admin/reports', {
        headers: { 'x-admin-key': key }
      });
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData.reports || []);
      }

      // 5. Fetch Users Directory
      const usersRes = await fetch('/api/admin/users', {
        headers: { 'x-admin-key': key }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('timepass_admin_key', key);
        localStorage.setItem('timepass_admin_key', key);
      }
    } catch (err: unknown) {
      setAuthError((err as Error).message);
      setIsAuthenticated(false);
    }
  }, []);

  // Send Global Announcement
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    try {
      setIsBroadcasting(true);
      setBroadcastFeedback(null);

      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setBroadcastFeedback('📢 Broadcast announcement sent live to all active users!');
        setBroadcastMessage('');
        setTimeout(() => setBroadcastFeedback(null), 5000);
      } else {
        setBroadcastFeedback(`Broadcast error: ${data.error || 'Failed'}`);
      }
    } catch {
      setBroadcastFeedback('Network error while broadcasting announcement');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Terminate a room
  const handleTerminateRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Are you sure you want to forcibly close room: "${roomName}"? All members will be disconnected.`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/rooms/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          roomId,
          reason: 'This room was terminated by the administrator.'
        })
      });

      if (res.ok) {
        fetchDashboardData(adminKey);
      }
    } catch {
      alert('Failed to terminate room');
    }
  };

  // Force kick socket
  const handleKickSocket = async (socketId: string, displayName: string) => {
    if (!confirm(`Disconnect and kick "${displayName}" from TIMEPASS?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/users/kick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          socketId,
          reason: 'Kicked by administrator for violating guidelines'
        })
      });

      if (res.ok) {
        fetchDashboardData(adminKey);
      }
    } catch {
      alert('Failed to kick user');
    }
  };

  // Moderation action
  const handleAction = async (reportId: string | null, targetUserId: string, action: string) => {
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          reportId,
          targetUserId,
          action,
          reason: `Admin enforcement: ${action}`,
        })
      });

      if (res.ok) {
        fetchDashboardData(adminKey);
      }
    } catch {
      alert('Action execution failed');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-dark-surface text-foreground">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-lg shadow-pink-500/25">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mb-1">TIMEPASS Master Admin</h2>
            <p className="text-xs text-gray-400 mb-6">Full platform control: Kick, Terminate Rooms, Broadcast & Ban.</p>

            {authError && (
              <p className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                {authError}
              </p>
            )}

            <form onSubmit={(e) => { e.preventDefault(); fetchDashboardData(adminKey); }} className="space-y-4">
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter Master Password..."
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm text-center tracking-widest focus:outline-none focus:border-pink-500 placeholder:tracking-normal placeholder:text-gray-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl gradient-button text-white text-xs sm:text-sm font-bold shadow-lg shadow-pink-500/25 hover:scale-[1.01] active:scale-[0.98] transition-transform"
              >
                Unlock Administrator Power
              </button>
            </form>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const filteredReports = filterReason === 'ALL'
    ? reports
    : reports.filter((r) => r.reason.toLowerCase().includes(filterReason.toLowerCase()));

  return (
    <div className="min-h-screen flex flex-col bg-dark-surface text-foreground">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 pb-28">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-pink-500 shrink-0" />
              <h1 className="text-xl sm:text-2xl font-black text-white truncate">Administrator Control Center</h1>
              <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-bold border border-pink-500/30">
                MASTER ACCESS
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Full control over live calls, 8-member rooms, global announcements, and safety.</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fetchDashboardData(adminKey)}
              className="px-3.5 py-2 rounded-xl glass-panel text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-pink-400" />
              <span>Refresh All</span>
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem('timepass_admin_key');
                localStorage.removeItem('timepass_admin_key');
                setIsAuthenticated(false);
              }}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 text-xs font-semibold transition-colors"
            >
              Lock
            </button>
          </div>
        </div>

        {/* Real-Time Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 mb-6">
          <div className="glass-panel p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Active Online</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{stats?.activeOnline || 0}</p>
          </div>

          <div className="glass-panel p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Live 8-P Rooms</span>
            <p className="text-xl sm:text-2xl font-black text-purple-400 mt-1">{rooms.length}</p>
          </div>

          <div className="glass-panel p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Live Video Calls</span>
            <p className="text-xl sm:text-2xl font-black text-pink-400 mt-1">{stats?.activeVideoCalls || 0}</p>
          </div>

          <div className="glass-panel p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Queue Video</span>
            <p className="text-xl sm:text-2xl font-black text-cyan-400 mt-1">{stats?.queueVideo || 0}</p>
          </div>

          <div className="glass-panel p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Pending Reports</span>
            <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1">{stats?.pendingReports || 0}</p>
          </div>

          <div className="glass-panel p-3.5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Banned Users</span>
            <p className="text-xl sm:text-2xl font-black text-red-400 mt-1">{stats?.bannedUsers || 0}</p>
          </div>
        </div>

        {/* Navigation Tabs - Mobile Scrollable */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-white/10 pb-3 mb-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'rooms' ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25' : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            Manage Rooms ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'broadcast' ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25' : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            📢 Global Broadcast
          </button>
          <button
            onClick={() => setActiveTab('sockets')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'sockets' ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25' : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            Live Sockets ({activeSockets.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'reports' ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25' : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            Reports ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'users' ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25' : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            User Directory ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'health' ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25' : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            Diagnostics
          </button>
        </div>

        {/* TAB: Manage 8-Member Rooms */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Active 8-Member Custom Rooms</h3>
                <p className="text-xs text-gray-400">View real-time room occupancy and forcibly terminate when required.</p>
              </div>
            </div>

            {rooms.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl text-center border border-white/10">
                <Users className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">No active custom rooms</p>
                <p className="text-xs text-gray-400 mt-1">Rooms created by users will appear here immediately.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between gap-3 shadow-lg hover:border-pink-500/30 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 uppercase tracking-wider">
                            {room.category}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1.5">{room.name}</h4>
                          <p className="text-xs text-gray-400 line-clamp-1">{room.description}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 text-xs font-black border border-purple-500/30 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{room.memberCount}/{room.maxMembers}</span>
                          </span>
                        </div>
                      </div>

                      {/* Members Avatars preview */}
                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-gray-400">
                          Host: <strong className="text-white">{room.hostName || 'System'}</strong>
                        </span>

                        {room.members.length > 0 && (
                          <div className="flex items-center -space-x-1.5">
                            {room.members.slice(0, 5).map((m, idx) => (
                              <div
                                key={idx}
                                title={m.displayName}
                                className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 border border-white/20 text-[9px] font-bold text-white flex items-center justify-center uppercase shadow"
                              >
                                {m.displayName.charAt(0)}
                              </div>
                            ))}
                            {room.members.length > 5 && (
                              <span className="text-[10px] text-gray-400 pl-1 font-bold">
                                +{room.members.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                      <a
                        href={`/rooms/${room.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold"
                      >
                        Join as Spectator
                      </a>

                      <button
                        type="button"
                        onClick={() => handleTerminateRoom(room.id, room.name)}
                        className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Force Terminate</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Global System Broadcast */}
        {activeTab === 'broadcast' && (
          <div className="max-w-2xl mx-auto glass-panel p-5 sm:p-7 rounded-3xl border border-white/10 shadow-2xl">
            <div className="flex items-center gap-2.5 mb-2">
              <Radio className="w-5 h-5 text-pink-500 animate-pulse" />
              <h3 className="text-base font-bold text-white">Live System Announcement</h3>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Broadcast high-priority alerts to all active video chats, 8-member rooms, and users currently online in real time.
            </p>

            {broadcastFeedback && (
              <div className="p-3 mb-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{broadcastFeedback}</span>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Server Maintenance / Community Safety Alert"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">
                  Message Content
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Enter announcement text to display on every user's screen..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isBroadcasting || !broadcastMessage.trim()}
                className="w-full py-3 rounded-2xl gradient-button text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isBroadcasting ? 'Broadcasting...' : 'Broadcast to All Connected Users'}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB: Live Sockets */}
        {activeTab === 'sockets' && (
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Real-Time Connected Sockets</h3>
                <p className="text-xs text-gray-400">Live active sessions currently on the platform.</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                {activeSockets.length} Sockets Live
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-white/5 text-gray-400 uppercase font-semibold text-[10px] border-b border-white/10">
                  <tr>
                    <th className="p-3.5">User Nickname</th>
                    <th className="p-3.5">Region</th>
                    <th className="p-3.5">Socket ID</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Admin Power</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activeSockets.map((s) => (
                    <tr key={s.socketId} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5 font-bold text-white">
                        <div>{s.displayName}</div>
                        <div className="text-[10px] text-gray-400 font-normal">{s.userId}</div>
                      </td>
                      <td className="p-3.5 text-gray-300">
                        📍 {s.region || 'India'} {s.gender ? `(${s.gender})` : ''}
                      </td>
                      <td className="p-3.5 text-gray-400 font-mono text-[10px]">
                        {s.socketId}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          {s.mode || 'Connected'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleKickSocket(s.socketId, s.displayName)}
                          className="px-3 py-1 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 text-xs font-bold flex items-center gap-1 ml-auto"
                        >
                          <UserX className="w-3 h-3" />
                          <span>Kick</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {activeSockets.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        No active socket connections tracked.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: Moderation Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Reported Conversations</h3>
              <select
                value={filterReason}
                onChange={(e) => setFilterReason(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none"
              >
                <option value="ALL" className="bg-dark-surface text-white">All Categories</option>
                <option value="Inappropriate" className="bg-dark-surface text-white">Inappropriate Video</option>
                <option value="Harassment" className="bg-dark-surface text-white">Harassment</option>
                <option value="Spam" className="bg-dark-surface text-white">Spam / Bots</option>
                <option value="Underage" className="bg-dark-surface text-white">Underage</option>
              </select>
            </div>

            {filteredReports.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl text-center border border-white/10">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">No pending reports!</p>
                <p className="text-xs text-gray-400 mt-1">Community standards are currently respected.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="glass-panel p-4 rounded-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          {report.reason}
                        </span>
                        <span className="text-xs text-gray-400">
                          Reported by <strong className="text-white">{report.reporterName}</strong>
                        </span>
                        <span className="text-[10px] text-gray-400">· {new Date(report.createdAt).toLocaleString()}</span>
                      </div>

                      <p className="text-xs text-white">
                        Reported User: <strong className="text-pink-300">{report.reportedUserName}</strong> ({report.reportedUserEmail || 'Guest'})
                        {report.reportedUserBanned && (
                          <span className="ml-2 text-[10px] text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded">BANNED</span>
                        )}
                      </p>

                      {report.details && (
                        <p className="text-xs text-gray-300 italic bg-white/5 p-2 rounded-lg">
                          &quot;{report.details}&quot;
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleAction(report.id, report.reportedUserId, 'DISMISS')}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium"
                      >
                        Dismiss
                      </button>

                      <button
                        onClick={() => handleAction(report.id, report.reportedUserId, 'WARN')}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold"
                      >
                        Warn
                      </button>

                      <button
                        onClick={() => handleAction(report.id, report.reportedUserId, 'SUSPEND_24H')}
                        className="px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 text-xs font-semibold"
                      >
                        Suspend 24h
                      </button>

                      <button
                        onClick={() => handleAction(report.id, report.reportedUserId, 'BAN')}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                      >
                        Permanent Ban
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: User Directory */}
        {activeTab === 'users' && (
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-white/5 text-gray-400 uppercase font-semibold text-[10px] border-b border-white/10">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Joined</th>
                    <th className="p-3.5 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5">
                      <td className="p-3.5 font-medium text-white">
                        <div className="font-bold">{u.displayName}</div>
                        <div className="text-[10px] text-gray-400">@{u.username} {u.email ? `· ${u.email}` : ''}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.role === 'ADMIN' ? 'bg-pink-500/20 text-pink-300' :
                          u.role === 'MODERATOR' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-white/10 text-gray-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {u.isBanned ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">
                            Banned
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right">
                        {u.isBanned ? (
                          <button
                            onClick={() => handleAction(null, u.id, 'UNBAN')}
                            className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold"
                          >
                            Lift Ban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(null, u.id, 'BAN')}
                            className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-semibold"
                          >
                            Ban User
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: Health & Diagnostics */}
        {activeTab === 'health' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>WebRTC Signaling & Socket Core</span>
              </h3>
              <p className="text-xs text-gray-400">Active Sockets: <code>{activeSockets.length} connected</code></p>
              <p className="text-xs text-gray-400">STUN servers: <code>stun.l.google.com:19302 (5 Google STUN nodes)</code></p>
              <p className="text-xs text-gray-400">Encryption: <code>DTLS 1.2 / SRTP encrypted peer mesh</code></p>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                Signaling Engine Operational
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-pink-400" />
                <span>Automated Safety Filters</span>
              </h3>
              <p className="text-xs text-gray-400">Profanity Scanner: <code>Hinglish & English Active</code></p>
              <p className="text-xs text-gray-400">Rate Limiter: <code>10 msg / 5s window</code></p>
              <p className="text-xs text-gray-400">Admin Master Key: <code>Configured & Active</code></p>
              <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold">
                Shield Active & Enforcing
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
