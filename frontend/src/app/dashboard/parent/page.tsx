'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CircleDollarSign, HandCoins, UserCheck, Users } from 'lucide-react';
import { AdminStatCard, type AdminStatCardItem } from '@/components/admin/AdminStatCard';
import { profileApi, paymentApi } from '@/services/api';
import { useCurrency } from '@/hooks/useCurrency';

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    PAYMENT_PENDING: 'bg-amber-100 text-amber-700',
    EXPIRED: 'bg-red-100 text-red-700',
    DRAFT: 'bg-gray-100 text-gray-500',
  };
  return map[s] ?? 'bg-gray-100 text-gray-500';
};

const paymentBadge = (s: string) => {
  const map: Record<string, string> = {
    SUCCESS: 'bg-green-100 text-green-700',
    PENDING: 'bg-amber-100 text-amber-700',
    FAILED: 'bg-red-100 text-red-700',
  };
  return map[s] ?? 'bg-gray-100 text-gray-500';
};

export default function ParentDashboard() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedStatKey, setSelectedStatKey] = useState('Total Spend');
  const { fmt } = useCurrency();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUser(JSON.parse(localStorage.getItem('mn_user') ?? '{}'));
    }
    Promise.all([profileApi.getMyProfiles(), paymentApi.myPayments()])
      .then(([p, pay]) => {
        setProfiles(p.data ?? []);
        setPayments(pay.data ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeProfiles = profiles.filter((p) => p.status === 'ACTIVE').length;
  const pendingPayments = payments.filter((p) => p.status === 'PENDING').length;
  const totalSpend = payments.filter(p => p.status === 'SUCCESS').reduce((sum, p) => sum + p.amount, 0);

  const statItems: AdminStatCardItem[] = [
    {
      label: 'Total Spend',
      icon: CircleDollarSign,
      value: fmt(totalSpend),
      sub: 'From successful payments',
    },
    { label: 'Total Profiles', icon: Users, value: profiles.length, sub: 'Registered profiles' },
    { label: 'Active Profiles', icon: UserCheck, value: activeProfiles, sub: 'Visible to members' },
    { label: 'Pending Payments', icon: HandCoins, value: pendingPayments, sub: 'Awaiting confirmation' },
  ];

  const quickActions = [
    { label: 'Browse Members', href: '/profiles', icon: '🔍' },
    { label: 'Messages', href: '/dashboard/chat', icon: '💬' },
    { label: 'My Profiles', href: '/dashboard/profiles', icon: '👤' },
    { label: 'Manage Subscription', href: '/dashboard/subscription', icon: '💳' },
  ];

  const recentActivity = [
    ...payments.slice(0, 3).map(p => ({
      dot: p.status === 'SUCCESS' ? '#10B981' : p.status === 'PENDING' ? '#F59E0B' : '#EF4444',
      text: `Payment ${p.status.toLowerCase()} — ${fmt(p.amount)}`,
      time: new Date(p.createdAt).toLocaleString(),
      tag: p.status,
      tagColor: p.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : p.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700',
    })),
    ...profiles.slice(0, 2).map(p => ({
      dot: p.status === 'ACTIVE' ? '#10B981' : '#F59E0B',
      text: `Profile "${p.name}" — ${p.status.replace('_', ' ')}`,
      time: new Date(p.createdAt).toLocaleString(),
      tag: 'Profile',
      tagColor: 'bg-[#1C3B35] text-white',
    })),
  ].slice(0, 5);

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Loading...
    </div>
  );

  return (
    <div className="font-poppins space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[34px] xl:text-[37px] 2xl:text-[40px] font-poppins font-medium text-[#121514]">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}! 👋
        </h1>
        <p className="text-[#121514AD]/68 title-sub-top mt-0.5">Here's what's happening with your account today</p>
      </div>

      {/* ── Stat cards (same as admin dashboard) ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-1 md:grid-cols-2 sm:gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {statItems.map((item) => (
          <AdminStatCard
            key={item.label}
            item={item}
            selected={selectedStatKey === item.label}
            onSelect={() => setSelectedStatKey(item.label)}
          />
        ))}
      </div>

      {/* ── Recent Activity + Quick Actions ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-medium font-poppins text-[#121514] subtitle mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
              <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm">No activity yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="mt-1.5 h-2 w-2 rounded-full flex-shrink-0" style={{ background: a.dot }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{a.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      {a.time}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${a.tagColor}`}>{a.tag}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-medium font-poppins text-[#121514] subtitle mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-3">
            {quickActions.map((qa) => (
              <a key={qa.label} href={qa.href}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#EAF2EE] hover:bg-[#1C3B35] hover:text-white text-[#1C3B35] text-sm font-semibold transition-all duration-200 group">
                <div className="h-7 w-7 rounded-lg bg-[#1C3B35] group-hover:bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">{qa.icon}</span>
                </div>
                {qa.label}
                <svg className="w-4 h-4 ml-auto opacity-40 group-hover:opacity-100 transition" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Family Profiles Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-medium font-poppins text-[#121514] subtitle">Family Profiles</h2>
            <p className="text-xs text-gray-400 mt-0.5">Manage your registered profiles</p>
          </div>
          <Link href="/dashboard/profiles"
            className="text-xs bg-[#1C3B35] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-[#15302a] transition font-semibold flex items-center gap-1.5 shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Profile
          </Link>
        </div>
        <div className="px-4 sm:px-6 pt-2 pb-1 text-[11px] text-gray-400 sm:hidden">
          Swipe left/right to view all columns
        </div>
        <div className="dashboard-table-scroll overflow-x-auto">
          {profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <span className="text-4xl mb-3">👨‍👩‍👧‍👦</span>
              <p className="text-sm font-medium">No profiles yet</p>
              <p className="text-xs mt-1">Add your first family member to get started</p>
            </div>
          ) : (
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Member ID', 'Name', 'Gender', 'Status', 'Plan', 'Created', 'Action'].map((h) => (
                    <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {profiles.map((p, i) => {
                  // Find this profile's latest subscription payment
                  const profilePayment = payments
                    .filter(pay => pay.childProfileId === p.id && (pay.purpose === 'SUBSCRIPTION' || !pay.purpose))
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

                  const planDot =
                    !profilePayment ? '#9CA3AF' :
                    profilePayment.status === 'SUCCESS' ? '#10B981' :
                    profilePayment.status === 'PENDING' ? '#F59E0B' : '#EF4444';

                  const planLabel =
                    !profilePayment ? 'No Plan' :
                    profilePayment.status === 'SUCCESS' ? 'Active' :
                    profilePayment.status === 'PENDING' ? 'Pending' : 'Failed';

                  const planLabelColor =
                    !profilePayment ? 'bg-gray-100 text-gray-400' :
                    profilePayment.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                    profilePayment.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600';

                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 transition ${i % 2 === 1 ? 'bg-[#FAFAFA]' : ''}`}>
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">{p.memberId ?? '—'}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{p.name}</td>
                      <td className="px-6 py-4 text-gray-500 capitalize">{p.gender?.toLowerCase() ?? '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center whitespace-nowrap text-[11px] sm:text-xs leading-none font-semibold px-2 sm:px-2.5 py-1 rounded-full max-[720px]:text-[10px] max-[720px]:px-1.5 ${statusBadge(p.status)}`}>
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: planDot }} />
                          <span className={`inline-flex items-center whitespace-nowrap text-[11px] sm:text-xs leading-none font-semibold px-2 sm:px-2.5 py-1 rounded-full max-[720px]:text-[10px] max-[720px]:px-1.5 ${planLabelColor}`}>
                            {planLabel}
                          </span>
                        </div>
                        {!profilePayment && (
                          <Link href="/select-plan" className="mt-1 text-[10px] text-[#1B6B4A] font-semibold hover:underline block">
                            + Get Plan
                          </Link>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/profiles`}
                          className="text-xs text-[#1C3B35] font-semibold hover:underline flex items-center gap-1">
                          Manage
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Recent Payments ── */}
      {payments.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-medium font-poppins text-[#121514] subtitle">Recent Payments</h2>
              <p className="text-xs text-gray-400 mt-0.5">Your latest payment history</p>
            </div>
            <Link href="/dashboard/subscription"
              className="text-xs text-[#1C3B35] font-semibold hover:underline shrink-0">
              View all →
            </Link>
          </div>
          <div className="px-4 sm:px-6 pt-2 pb-1 text-[11px] text-gray-400 sm:hidden">
            Swipe left/right to view all columns
          </div>
          <div className="dashboard-table-scroll overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Payment ID', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.slice(0, 5).map((pay, i) => (
                  <tr key={pay.id} className={`hover:bg-gray-50 transition ${i % 2 === 1 ? 'bg-[#FAFAFA]' : ''}`}>
                    <td className="px-6 py-3.5 font-mono text-xs text-gray-400 select-all">{pay.id.slice(0, 14)}…</td>
                    <td className="px-6 py-3.5 font-semibold text-gray-800">{fmt(pay.amount)}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center whitespace-nowrap text-[11px] sm:text-xs leading-none px-2 sm:px-2.5 py-1 rounded-full font-medium ${pay.method === 'BANK_TRANSFER' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                        {pay.method === 'BANK_TRANSFER' ? '🏦 Bank' : '💳 Online'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${paymentBadge(pay.status)}`}>{pay.status}</span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-400">{new Date(pay.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
