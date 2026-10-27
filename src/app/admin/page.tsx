'use client';

import React, { useEffect, useState } from 'react';
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
  Search
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AdminStats, ReportItem } from '@/lib/types';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('admin123');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; email?: string; username: string; displayName: string; role: string; isBanned: boolean; banReason?: string; createdAt: string }>>([]);
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'health'>('reports');
  const [filterReason, setFilterReason] = useState<string>('ALL');

  const fetchDashboardData = async (key: string) => {
    try {
      setAuthError(null);
      // Fetch stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { 'x-admin-key': key }
      });

      if (!statsRes.ok) {
        throw new Error('Invalid Admin Key');
      }

      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch reports
      const reportsRes = await fetch('/api/admin/reports', {
        headers: { 'x-admin-key': key }
      });
      const reportsData = await reportsRes.json();
      setReports(reportsData.reports || []);

      // Fetch users
      const usersRes = await fetch('/api/admin/users', {
        headers: { 'x-admin-key': key }
      });
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);

      setIsAuthenticated(true);
    } catch (err: unknown) {
      setAuthError((err as Error).message);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    // Auto check default key
    fetchDashboardData(adminKey);
  }, []);

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
          reason: `Moderation action taken by admin: ${action}`,
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
          <div className="max-w-sm w-full glass-panel p-6 rounded-2xl border border-white/10 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Admin Moderation Console</h2>
            <p className="text-xs text-gray-400 mb-6">Enter administrator security key to proceed.</p>

            {authError && (
              <p className="p-2 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                {authError}
              </p>
            )}

            <form onSubmit={(e) => { e.preventDefault(); fetchDashboardData(adminKey); }} className="space-y-4">
              <input
                type="password"
                placeholder="Enter Admin Key (default: admin123)"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs text-center tracking-widest focus:outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl gradient-button text-white text-xs font-bold"
              >
                Access Dashboard
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-accent-pink" />
              <h1 className="text-2xl font-black text-white">TIMEPASS Moderation Console</h1>
            </div>
            <p className="text-xs text-gray-400 mt-1">Live platform monitoring, user reports, and safety enforcement.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDashboardData(adminKey)}
              className="px-3.5 py-2 rounded-xl glass-panel text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-white/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Stats</span>
            </button>
          </div>
        </div>

        {/* Real-Time Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <div className="glass-panel p-4 rounded-xl border border-white/10">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Active Online</span>
            <p className="text-2xl font-black text-emerald-400 mt-1">{stats?.activeOnline || 0}</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Live Video Calls</span>
            <p className="text-2xl font-black text-brand-400 mt-1">{stats?.activeVideoCalls || 0}</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Live Text Chats</span>
            <p className="text-2xl font-black text-purple-400 mt-1">{stats?.activeTextChats || 0}</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">In Queue</span>
            <p className="text-2xl font-black text-cyan-400 mt-1">{(stats?.queueVideo || 0) + (stats?.queueText || 0)}</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Pending Reports</span>
            <p className="text-2xl font-black text-amber-400 mt-1">{stats?.pendingReports || 0}</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Banned Users</span>
            <p className="text-2xl font-black text-red-400 mt-1">{stats?.bannedUsers || 0}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'reports' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Reports Queue ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'users' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            User Directory ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'health' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            System Diagnostics
          </button>
        </div>

        {/* TAB 1: Reports Queue */}
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
                        Reported User: <strong className="text-brand-300">{report.reportedUserName}</strong> ({report.reportedUserEmail || 'Guest'})
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
                        Warn User
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

        {/* TAB 2: Users Directory */}
        {activeTab === 'users' && (
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
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

        {/* TAB 3: Diagnostics */}
        {activeTab === 'health' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>WebRTC & Signaling Server</span>
              </h3>
              <p className="text-xs text-gray-400">STUN servers: <code>stun.l.google.com:19302</code></p>
              <p className="text-xs text-gray-400">WebSocket Transport: <code>websocket, polling</code></p>
              <p className="text-xs text-gray-400">Encryption: <code>DTLS 1.2 / SRTP</code></p>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                Signaling Engine Operational
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-brand-400" />
                <span>Automated Safety Filters</span>
              </h3>
              <p className="text-xs text-gray-400">Profanity & Toxic Speech Scanner: <code>Active</code></p>
              <p className="text-xs text-gray-400">Rate Limiter: <code>10 msg / 5 sec window</code></p>
              <p className="text-xs text-gray-400">Anti-Starvation Matchmaker: <code>Enabled (+1 pt / 3s)</code></p>
              <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
                Filters Active & Enforcing
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
