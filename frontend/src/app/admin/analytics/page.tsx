'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/services/api';
import { AdminStatCard, type AdminStatCardItem } from '@/components/admin/AdminStatCard';
import {
  CircleDollarSign,
  HandCoins,
  MessageSquare,
  UserCheck,
  UserCircle,
  Users,
  Zap,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues with socket.io
const LiveTrafficWidget = dynamic(() => import('@/components/admin/LiveTrafficWidget'), { ssr: false });


/* ── Mini Spark Bar ───────────────────────────────────────── */
function SparkBar({ value, max, color = '#1C3B35' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] text-gray-400 w-7 text-right">{pct}%</span>
    </div>
  );
}

/* ── Top Viewed Row ───────────────────────────────────────── */
function ViewedCard({ rank, profile, maxViews }: { rank: number; profile: any; maxViews: number }) {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
      {/* Rank */}
      <span className="text-lg w-6 text-center flex-shrink-0">
        {medals[rank] ?? <span className="text-sm font-bold text-gray-400">#{rank + 1}</span>}
      </span>

      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
        profile.gender === 'FEMALE' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
      }`}>
        {profile.name?.[0]?.toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{profile.name}</p>
        <p className="text-xs text-gray-400">{profile.city ?? '—'} · {profile.gender}</p>
        <SparkBar value={profile.viewCount} max={maxViews} color={rank === 0 ? '#DB9D30' : '#1C3B35'} />
      </div>

      {/* Count */}
      <span className="text-sm font-bold text-gray-700 flex-shrink-0">
        {profile.viewCount.toLocaleString()} <span className="text-xs font-normal text-gray-400">views</span>
      </span>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────── */
export default function AdminAnalyticsPage() {
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [selectedStatKey, setSelectedStatKey] = useState('Total Revenue');

  const load = () => {
    setLoading(true);
    setError(null);
    adminApi.getAnalytics()
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load analytics. Ensure you are logged in as admin.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400 font-poppins">
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Loading analytics…
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 font-poppins">
      <span className="text-4xl">⚠️</span>
      <p className="text-gray-600 font-semibold text-center">{error}</p>
      <button onClick={load} className="text-sm bg-[#1C3B35] text-white px-5 py-2.5 rounded-xl hover:bg-[#15302a] transition font-semibold">
        Retry
      </button>
    </div>
  );

  const d = data ?? {};
  const totalRev   = typeof d.totalRevenue === 'number' ? d.totalRevenue : 0;
  const topViewed  = d.topViewed ?? [];
  const maxViews   = topViewed.length > 0 ? topViewed[0].viewCount : 1;

  // Derived rates
  const activationRate = d.totalProfiles > 0
    ? Math.round((d.activeProfiles / d.totalProfiles) * 100)
    : 0;

  const kpis: AdminStatCardItem[] = [
    {
      label: 'Total Revenue',
      icon: CircleDollarSign,
      value: `$${totalRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: 'Successful payments only',
    },
    { label: 'Total Users', icon: Users, value: d.totalUsers ?? 0, sub: 'Registered accounts' },
    {
      label: 'Total Profiles',
      icon: UserCircle,
      value: d.totalProfiles ?? 0,
      sub: `${activationRate}% activation rate`,
    },
    {
      label: 'Active Profiles',
      icon: UserCheck,
      value: d.activeProfiles ?? 0,
      sub: 'With active subscription',
    },
    {
      label: 'Pending Payments',
      icon: HandCoins,
      value: d.pendingPayments ?? 0,
      sub: 'Awaiting approval',
    },
    { label: 'Active Boosts', icon: Zap, value: d.activeBoosts ?? 0, sub: 'VIP profiles live now' },
    {
      label: 'Total Messages',
      icon: MessageSquare,
      value: d.totalMessages ?? 0,
      sub: 'Chat messages sent',
    },
  ];

  return (
    <div className="font-poppins space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[34px] xl:text-[37px] 2xl:text-[40px] font-poppins font-medium text-[#121514]">Analytics</h1>
          <p className="text-[#121514AD]/68 title-sub-top mt-0.5">Platform-wide performance metrics</p>
        </div>
        <button
          onClick={load}
          className="self-start sm:self-auto flex items-center gap-2 text-sm border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition font-semibold"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* KPI Grid — same stat cards as admin dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.slice(0, 4).map((k) => (
          <AdminStatCard
            key={k.label}
            item={k}
            selected={selectedStatKey === k.label}
            onSelect={() => setSelectedStatKey(k.label)}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.slice(4).map((k) => (
          <AdminStatCard
            key={k.label}
            item={k}
            selected={selectedStatKey === k.label}
            onSelect={() => setSelectedStatKey(k.label)}
          />
        ))}
      </div>

      {/* ── Live Traffic ── */}
      <LiveTrafficWidget />

      {/* Two-column row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Top Viewed Profiles */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-medium font-poppins text-[#121514] subtitle">Top Viewed Profiles</h2>
              <p className="text-xs md:text-sm lg:text-base   text-gray-400 mt-0.5">Most visited active profiles</p>
            </div>
            <span className="text-xs font-semibold bg-[#EAF2EE] text-[#1C3B35] px-2.5 py-1 rounded-lg">
              Top {topViewed.length}
            </span>
          </div>
          {topViewed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <span className="text-3xl mb-2">👁</span>
              <p className="text-sm">No profile views yet</p>
            </div>
          ) : (
            <div>
              {topViewed.map((p: any, i: number) => (
                <ViewedCard key={p.id} rank={i} profile={p} maxViews={maxViews} />
              ))}
            </div>
          )}
        </div>

        {/* Platform Health */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="mb-5">
            <h2 className="font-medium font-poppins text-[#121514] subtitle">Platform Health</h2>
            <p className="text-xs md:text-sm lg:text-base text-gray-400 mt-0.5">Key ratios and conversion indicators</p>
          </div>

          <div className="space-y-5">
            {/* Profile activation rate */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">Profile Activation Rate</span>
                <span className="text-sm font-bold text-gray-800">{activationRate}%</span>
              </div>
              <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#1C3B35] to-[#2a5247] transition-all duration-700"
                  style={{ width: `${activationRate}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">{d.activeProfiles ?? 0} of {d.totalProfiles ?? 0} profiles active</p>
            </div>

            {/* Boost adoption */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">Boost Adoption</span>
                <span className="text-sm font-bold text-gray-800">
                  {d.activeProfiles > 0 ? Math.round(((d.activeBoosts ?? 0) / d.activeProfiles) * 100) : 0}%
                </span>
              </div>
              <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#DB9D30] to-[#E8BE1A] transition-all duration-700"
                  style={{
                    width: `${d.activeProfiles > 0 ? Math.round(((d.activeBoosts ?? 0) / d.activeProfiles) * 100) : 0}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">{d.activeBoosts ?? 0} of {d.activeProfiles ?? 0} active profiles boosted</p>
            </div>

            {/* Pending payments (lower = better) */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">Pending Payments</span>
                <span className="text-sm font-bold text-gray-800">{d.pendingPayments ?? 0}</span>
              </div>
              <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    (d.pendingPayments ?? 0) === 0 ? 'bg-green-400' : 'bg-amber-400'
                  }`}
                  style={{
                    width: d.totalProfiles > 0
                      ? `${Math.min(100, Math.round(((d.pendingPayments ?? 0) / d.totalProfiles) * 100))}%`
                      : '0%',
                  }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {(d.pendingPayments ?? 0) === 0 ? '✅ All payments processed' : 'Awaiting manual approval'}
              </p>
            </div>

            {/* Engagement */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">Messages / Active Profile</span>
                <span className="text-sm font-bold text-gray-800">
                  {d.activeProfiles > 0
                    ? ((d.totalMessages ?? 0) / d.activeProfiles).toFixed(1)
                    : '0'}
                </span>
              </div>
              <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] transition-all duration-700"
                  style={{ width: `${Math.min(100, (d.activeProfiles > 0 ? Math.round(((d.totalMessages ?? 0) / d.activeProfiles) * 5) : 0))}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">{(d.totalMessages ?? 0).toLocaleString()} total messages sent</p>
            </div>
          </div>
        </div>

      </div>

      {/* Revenue summary card */}
      <div className="bg-gradient-to-br from-[#1C3B35] via-[#294d42] to-[#1C3B35] rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center">
        <div className="flex-1 text-center sm:text-left">
          <p className="text-white/60 text-sm font-medium">Total Revenue Collected</p>
          <p className="text-4xl font-extrabold text-white mt-1">
            ${totalRev.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-white/40 text-xs mt-1">From approved payments only</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
          {[
            { label: 'Users',     value: d.totalUsers    ?? 0 },
            { label: 'Profiles',  value: d.totalProfiles ?? 0 },
            { label: 'Messages',  value: d.totalMessages ?? 0 },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl px-4 py-3">
              <p className="text-white text-xl font-bold">{s.value.toLocaleString()}</p>
              <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
