'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api';

const CATEGORIES = ['', 'AUTH', 'PROFILE', 'PAYMENT', 'ADMIN', 'SUBSCRIPTION', 'SYSTEM', 'CHAT', 'BOOST', 'SMS'];
const LEVELS     = ['', 'INFO', 'WARNING', 'ERROR'];

const CAT_META: Record<string, { icon: string; color: string; bg: string }> = {
  AUTH:         { icon: '🔐', color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200'     },
  PROFILE:      { icon: '👤', color: 'text-purple-600',  bg: 'bg-purple-50 border-purple-200' },
  PAYMENT:      { icon: '💳', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200'},
  ADMIN:        { icon: '🛠️', color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200'   },
  SUBSCRIPTION: { icon: '📦', color: 'text-cyan-600',    bg: 'bg-cyan-50 border-cyan-200'     },
  SYSTEM:       { icon: '⚙️', color: 'text-gray-600',    bg: 'bg-gray-50 border-gray-200'     },
  CHAT:         { icon: '💬', color: 'text-pink-600',    bg: 'bg-pink-50 border-pink-200'     },
  BOOST:        { icon: '🚀', color: 'text-orange-600',  bg: 'bg-orange-50 border-orange-200' },
  SMS:          { icon: '📱', color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-200' },
};

const LEVEL_BADGE: Record<string, string> = {
  INFO:    'bg-[#EAF2EE] text-[#1C3B35]',
  WARNING: 'bg-amber-100 text-amber-700',
  ERROR:   'bg-red-100 text-red-700',
};

const ACTION_LABEL: Record<string, string> = {
  USER_REGISTERED: 'User Registered', USER_LOGIN: 'User Logged In',
  LOGIN_FAILED: 'Failed Login Attempt', PASSWORD_RESET: 'Password Reset',
  PROFILE_CREATED: 'Profile Created', PROFILE_UPDATED: 'Profile Updated',
  PROFILE_VIEWED: 'Profile Viewed', PROFILE_APPROVED: 'Profile Approved',
  PROFILE_REJECTED: 'Profile Rejected', PAYMENT_APPROVED: 'Payment Approved',
  PAYMENT_REJECTED: 'Payment Rejected', SUBSCRIPTION_ACTIVATED: 'Subscription Activated',
  SUBSCRIPTION_EXPIRED: 'Subscription Expired', BOOST_ACTIVATED: 'Boost Activated',
  ADMIN_USER_CREATED: 'User Created by Admin', ADMIN_PASSWORD_CHANGED: 'Password Changed by Admin',
  SMS_CAMPAIGN_SENT: 'SMS Campaign Sent', SETTINGS_UPDATED: 'Settings Updated',
};

function parseDevice(ua?: string | null): { browser: string; os: string } {
  if (!ua) return { browser: '', os: '' };
  const browser =
    ua.includes('Edg/')     ? 'Edge'    :
    ua.includes('OPR/')     ? 'Opera'   :
    ua.includes('Chrome/')  ? 'Chrome'  :
    ua.includes('Firefox/') ? 'Firefox' :
    ua.includes('Safari/')  ? 'Safari'  : 'Browser';
  const os =
    ua.includes('Windows') ? 'Windows' :
    ua.includes('Mac')     ? 'macOS'   :
    ua.includes('Android') ? 'Android' :
    (ua.includes('iPhone') || ua.includes('iPad')) ? 'iOS' :
    ua.includes('Linux')   ? 'Linux'   : '';
  return { browser, os };
}

function fmtTime(iso: string) {
  const d = new Date(iso), diff = Date.now() - d.getTime(), m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className={`text-2xl font-bold font-poppins ${color}`}>{value.toLocaleString()}</p>
        <p className="text-[12px] text-gray-400 font-poppins">{label}</p>
      </div>
    </div>
  );
}

export default function ActivityLogPage() {
  const [logs,     setLogs]     = useState<any[]>([]);
  const [meta,     setMeta]     = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [stats,    setStats]    = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [live,     setLive]     = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [category, setCategory] = useState('');
  const [level,    setLevel]    = useState('');
  const [search,   setSearch]   = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [page,     setPage]     = useState(1);
  const [limit,    setLimit]    = useState(10);
  const [exporting, setExporting] = useState(false);
  const sseRef = useRef<EventSource | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('mn_token') : '';

  const buildParams = useCallback((includePageLimit = true) => {
    const p = new URLSearchParams();
    if (includePageLimit) { p.set('page', String(page)); p.set('limit', String(limit)); }
    if (category) p.set('category', category);
    if (level)    p.set('level', level);
    if (search)   p.set('search', search);
    if (dateFrom) p.set('dateFrom', dateFrom);
    if (dateTo)   p.set('dateTo', dateTo);
    return p;
  }, [page, limit, category, level, search, dateFrom, dateTo]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/activity-logs?${buildParams(true)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      setLogs(d.data ?? []);
      setMeta(d.meta ?? { total: 0, page: 1, limit, pages: 1 });
      setNewCount(0);
    } catch { setLogs([]); }
    finally  { setLoading(false); }
  }, [buildParams, limit, token]);

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch(`${API}/admin/activity-logs/stats`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setStats(d.data);
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => { fetchLogs(); fetchStats(); }, [fetchLogs, fetchStats]);

  // SSE real-time connection
  useEffect(() => {
    if (!live) { sseRef.current?.close(); return; }
    const es = new EventSource(`${API}/admin/activity-logs/stream?token=${token}`);
    es.onmessage = (e) => {
      try {
        const entry = JSON.parse(e.data);
        setNewCount(n => n + 1);
        if (page === 1 && !category && !level && !search) {
          setLogs(prev => [entry, ...prev.slice(0, limit - 1)]);
          setMeta(m => ({ ...m, total: m.total + 1 }));
        }
        fetchStats();
      } catch { /* ignore parse errors */ }
    };
    sseRef.current = es;
    return () => es.close();
  }, [live, token, page, category, level, search, limit, fetchStats]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const p = buildParams(false); // no page/limit — export all matching
      const r = await fetch(`${API}/admin/activity-logs/export?${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`Export failed: ${r.status}`);
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Export failed: ' + (e.message ?? 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  const total24h  = stats?.recentCount ?? 0;
  const errCount  = stats?.byLevel?.find((l: any) => l.level === 'ERROR')?._count?.id ?? 0;
  const warnCount = stats?.byLevel?.find((l: any) => l.level === 'WARNING')?._count?.id ?? 0;

  // Pagination pages array
  const buildPages = () => {
    const total = meta.pages, cur = page;
    const pages: (number | '…')[] = [];
    if (total <= 7) { for (let i = 1; i <= total; i++) pages.push(i); }
    else {
      pages.push(1);
      if (cur > 3) pages.push('…');
      for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
      if (cur < total - 2) pages.push('…');
      pages.push(total);
    }
    return pages;
  };

  return (
    <div className="space-y-5 font-poppins">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#121514]">Activity Log</h1>
          <p className="text-gray-400 text-sm mt-0.5">Real-time audit trail · IP · Device · Actor · Target</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live toggle */}
          <button
            onClick={() => setLive(v => !v)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
              live ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${live ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            {live ? 'Live' : 'Paused'}
          </button>
          {newCount > 0 && (
            <button onClick={() => { fetchLogs(); setNewCount(0); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C3B35] text-white text-xs font-semibold animate-pulse">
              ↑ {newCount} new — refresh
            </button>
          )}
          {/* CSV Export */}
          <button onClick={exportCsv} disabled={exporting}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 disabled:opacity-60 transition">
            {exporting ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            )}
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button onClick={() => { fetchLogs(); fetchStats(); }}
            className="flex items-center gap-2 bg-[#1C3B35] hover:bg-[#15302a] text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Last 24h Events" value={total24h}   icon="⚡" color="text-[#1C3B35]" />
        <StatCard label="Total Events"    value={meta.total} icon="📋" color="text-blue-600" />
        <StatCard label="Warnings"        value={warnCount}  icon="⚠️" color="text-amber-600" />
        <StatCard label="Errors"          value={errCount}   icon="🚨" color="text-red-600" />
      </div>

      {/* Category pills */}
      {stats?.byCategory && (
        <div className="flex flex-wrap gap-2">
          {(stats.byCategory as any[]).map((c: any) => {
            const m = CAT_META[c.category] ?? { icon: '📌', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' };
            return (
              <button key={c.category}
                onClick={() => { setCategory(c.category === category ? '' : c.category); setPage(1); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition ${
                  category === c.category ? 'bg-[#1C3B35] text-white border-[#1C3B35]' : `${m.bg} ${m.color}`
                }`}>
                {m.icon} {c.category} <span className="opacity-60">({c._count.id})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input placeholder="Search action, email, IP…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-[13px] focus:outline-none focus:border-[#1C3B35] transition"/>
          </div>
          {/* Category */}
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:border-[#1C3B35] appearance-none bg-white transition">
            {CATEGORIES.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
          </select>
          {/* Level */}
          <select value={level} onChange={e => { setLevel(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:border-[#1C3B35] appearance-none bg-white transition">
            {LEVELS.map(l => <option key={l} value={l}>{l || 'All Levels'}</option>)}
          </select>
        </div>
        {/* Date range */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-400 font-medium">Date range:</span>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#1C3B35] transition"/>
          <span className="text-xs text-gray-300">—</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#1C3B35] transition"/>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
              className="text-xs text-red-400 hover:text-red-600 font-semibold transition">✕ Clear</button>
          )}
        </div>
      </div>

      {/* Log table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-gray-600">
            {loading ? 'Loading…' : `${meta.total.toLocaleString()} events`}
          </p>
          <div className="flex items-center gap-2">
            {live && <span className="flex items-center gap-1.5 text-[11px] text-green-600 font-semibold"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>Live</span>}
            <span className="text-[12px] text-gray-400">Page {meta.page} of {meta.pages}</span>
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="px-6 py-4 animate-pulse flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0"/>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-1/3"/>
                  <div className="h-3 bg-gray-50 rounded w-2/3"/>
                  <div className="h-2 bg-gray-50 rounded w-1/2"/>
                </div>
                <div className="h-3 bg-gray-50 rounded w-16"/>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <span className="text-5xl mb-3">🗒️</span>
            <p className="font-semibold text-gray-400">No activity logs found</p>
            <p className="text-sm mt-1">Try changing your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map((log: any) => {
              const cat   = CAT_META[log.category] ?? { icon: '📌', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' };
              const lvl   = LEVEL_BADGE[log.level]  ?? 'bg-gray-100 text-gray-600';
              const label = ACTION_LABEL[log.action] ?? log.action.replace(/_/g, ' ');
              const dev   = parseDevice(log.userAgent);
              const dt    = new Date(log.createdAt);
              return (
                <div key={log.id} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50/60 transition">
                  {/* Category icon */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border shrink-0 text-sm mt-0.5 ${cat.bg}`}>
                    {cat.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Action + badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold text-[#121514]">{label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lvl}`}>{log.level}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}>{log.category}</span>
                    </div>

                    {/* Date + Time */}
                    <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                      <span>📅</span>
                      <span>{dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span className="text-gray-300">·</span>
                      <span>⏱</span>
                      <span>{dt.toLocaleTimeString('en-GB', { hour12: false })}</span>
                    </p>

                    {/* Actor */}
                    {log.actorEmail && (
                      <p className="text-[12px] text-gray-500 flex items-center gap-1">
                        <span className="text-gray-300">👤 Actor:</span>
                        <span className="font-medium text-[#1C3B35]">{log.actorEmail}</span>
                        {log.actorRole && <span className="text-gray-300 ml-1 text-[10px]">({log.actorRole})</span>}
                      </p>
                    )}

                    {/* Target / Entity */}
                    {log.entityLabel && (
                      <p className="text-[12px] text-gray-500 flex items-center gap-1">
                        <span className="text-gray-300">🎯 Target:</span>
                        <span className="font-medium text-gray-700">{log.entityLabel}</span>
                      </p>
                    )}

                    {/* IP + Device — always shown */}
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[11px] text-gray-600">
                        <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                        </svg>
                        <span className="font-mono font-medium">
                          {log.ipAddress || '—'}
                        </span>
                      </span>
                      {(dev.browser || dev.os) && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[11px] text-gray-600">
                          <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
                          </svg>
                          <span>{[dev.browser, dev.os].filter(Boolean).join(' / ')}</span>
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    {log.meta && Object.keys(log.meta).length > 0 && (
                      <p className="text-[11px] text-gray-300 font-mono truncate max-w-lg">
                        {JSON.stringify(log.meta)}
                      </p>
                    )}
                  </div>

                  {/* Relative time */}
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-gray-400 whitespace-nowrap">{fmtTime(log.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Per page + count */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 whitespace-nowrap">Per page:</span>
              <div className="flex gap-1">
                {[10, 20, 50, 100].map(n => (
                  <button key={n} onClick={() => { setLimit(n); setPage(1); }}
                    className={`h-7 px-2.5 rounded-lg text-xs font-semibold transition border ${
                      limit === n ? 'bg-[#1C3B35] text-white border-[#1C3B35]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}>{n}</button>
                ))}
              </div>
            </div>
            <span className="text-gray-200 text-xs">|</span>
            <p className="text-xs text-gray-400">
              {loading ? '…' : (() => {
                const from = Math.min((page - 1) * limit + 1, meta.total);
                const to   = Math.min(page * limit, meta.total);
                return meta.total === 0 ? 'No entries' : `Showing ${from}–${to} of ${meta.total.toLocaleString()}`;
              })()}
            </p>
          </div>

          {/* Page buttons */}
          {meta.pages > 1 && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page <= 1}
                className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                Prev
              </button>
              {buildPages().map((p, i) =>
                p === '…' ? (
                  <span key={`e${i}`} className="h-8 w-8 flex items-center justify-center text-xs text-gray-400">…</span>
                ) : (
                  <button key={p} onClick={() => { setPage(p as number); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                      page === p ? 'bg-[#1C3B35] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>{p}</button>
                )
              )}
              <button onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page >= meta.pages}
                className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition flex items-center gap-1">
                Next
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
