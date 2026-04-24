'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL;

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('mn_token') : null;
}

interface Stats {
  totalUsers: number;
  sentToday: number;
  sentThisMonth: number;
  activeCampaigns: number;
  failedCount: number;
  totalCampaigns: number;
  totalTemplates: number;
}

const statCards = (s: Stats) => [
  {
    label: 'Total Users',
    value: s.totalUsers.toLocaleString(),
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    color: 'from-indigo-500 to-indigo-600',
    sub: 'Registered users',
  },
  {
    label: 'SMS Sent Today',
    value: s.sentToday.toLocaleString(),
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    ),
    color: 'from-emerald-500 to-emerald-600',
    sub: `${s.sentThisMonth.toLocaleString()} this month`,
  },
  {
    label: 'Active Campaigns',
    value: s.activeCampaigns.toLocaleString(),
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    color: 'from-amber-500 to-amber-600',
    sub: `${s.totalCampaigns} total campaigns`,
  },
  {
    label: 'Failed SMS',
    value: s.failedCount.toLocaleString(),
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    color: 'from-rose-500 to-rose-600',
    sub: 'Delivery failures',
  },
];

const quickLinks = [
  { href: '/admin/sms-campaign/send', label: 'Send Campaign', desc: 'Send bulk SMS to users', icon: '🚀' },
  { href: '/admin/sms-campaign/targeting', label: 'User Targeting', desc: 'Filter and select recipients', icon: '🎯' },
  { href: '/admin/sms-campaign/history', label: 'Campaign History', desc: 'View past campaigns', icon: '📋' },
  { href: '/admin/sms-campaign/templates', label: 'Templates', desc: 'Manage message templates', icon: '📝' },
];

export default function SmsCampaignDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    fetch(`${API}/admin/sms-campaign/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setStats(d.data); else setError('Failed to load stats'); })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#121514]">SMS Campaign Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Overview of your SMS marketing performance</p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 animate-pulse h-32" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-600 rounded-2xl p-4 mb-8 text-sm">{error}</div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {statCards(stats).map((card) => (
            <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shrink-0`}>
                {card.icon}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-[#121514]">{card.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-[#121514] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((ql) => (
            <Link
              key={ql.href}
              href={ql.href}
              className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5 hover:shadow-md hover:ring-black/10 transition-all group"
            >
              <div className="text-3xl mb-3">{ql.icon}</div>
              <p className="font-semibold text-[#121514] group-hover:text-indigo-600 transition-colors">{ql.label}</p>
              <p className="text-xs text-gray-400 mt-1">{ql.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Extra info row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">This Month</p>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-bold text-[#121514]">{stats.sentThisMonth.toLocaleString()}</p>
              <p className="text-sm text-gray-400 pb-1">SMS sent</p>
            </div>
            <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full" style={{ width: `${Math.min(100, (stats.sentThisMonth / Math.max(1, stats.totalUsers)) * 100)}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {stats.totalUsers > 0 ? ((stats.sentThisMonth / stats.totalUsers) * 100).toFixed(1) : 0}% of users reached
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Templates</p>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-bold text-[#121514]">{stats.totalTemplates}</p>
              <p className="text-sm text-gray-400 pb-1">saved templates</p>
            </div>
            <Link href="/admin/sms-campaign/templates" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Manage Templates →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
