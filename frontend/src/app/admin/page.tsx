'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/services/api';
import {
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  HandCoins,
  UserCheck,
  UserCircle,
  UserPlus,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { AdminStatCard, type AdminStatCardItem } from '@/components/admin/AdminStatCard';

const LiveTrafficWidget = dynamic(() => import('@/components/admin/LiveTrafficWidget'), { ssr: false });

/* ── Tiny live bar chart ──────────────────────────────────────────────── */
const W = 320, H = 170, PAD = { t: 10, r: 10, b: 28, l: 30 };
const chartW = W - PAD.l - PAD.r;
const chartH = H - PAD.t - PAD.b;

type ChartPoint = { label: string; v: number };

function BarChart({ data, color = '#1C3B35' }: { data: ChartPoint[]; color?: string }) {
  const [tip, setTip] = useState<{ x: number; y: number; label: string; val: number } | null>(null);
  if (!data.length) return (
    <div className="flex items-center justify-center h-full text-gray-300 text-xs">No data yet</div>
  );
  const max = Math.max(...data.map(d => d.v), 1);
  const bw = chartW / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ overflow: 'visible' }}>
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1={PAD.l} x2={W - PAD.r}
          y1={PAD.t + chartH * (1 - t)} y2={PAD.t + chartH * (1 - t)}
          stroke="#e5e7eb" strokeWidth={0.8} />
      ))}
      {data.map((d, i) => {
        const bh = Math.max((d.v / max) * chartH, 2);
        const bx = PAD.l + i * bw + bw * 0.2;
        const by = PAD.t + chartH - bh;
        const isLast = i === data.length - 1;
        return (
          <g key={d.label}
            onMouseEnter={() => setTip({ x: bx + bw * 0.3, y: by - 8, label: d.label, val: d.v })}
            onMouseLeave={() => setTip(null)}>
            <rect x={bx} y={by} width={bw * 0.6} height={bh}
              fill={isLast ? color : '#D1E8DA'} rx={3} className="cursor-pointer" />
            <text x={bx + bw * 0.3} y={H - 6} textAnchor="middle" fontSize={8} fill="#9ca3af">{d.label}</text>
          </g>
        );
      })}
      {tip && (
        <g>
          <rect x={tip.x - 40} y={tip.y - 28} width={86} height={28} rx={5} fill="#1C3B35" />
          <text x={tip.x + 3} y={tip.y - 17} textAnchor="middle" fontSize={9} fill="white" fontWeight={600}>{tip.label}</text>
          <text x={tip.x + 3} y={tip.y - 6} textAnchor="middle" fontSize={9} fill="#D4A843">{tip.val}</text>
        </g>
      )}
    </svg>
  );
}

function LineChart({ data }: { data: ChartPoint[] }) {
  const [tip, setTip] = useState<{ x: number; y: number; val: number } | null>(null);
  if (!data.length) return (
    <div className="flex items-center justify-center h-full text-gray-300 text-xs">No revenue data yet</div>
  );
  const max = Math.max(...data.map(d => d.v), 1);
  const min = Math.min(...data.map(d => d.v));
  const range = max - min || 1;
  const pts = data.map((d, i) => ({
    x: PAD.l + (i / Math.max(data.length - 1, 1)) * chartW,
    y: PAD.t + chartH - ((d.v - min) / range) * chartH,
    ...d,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${PAD.t + chartH} L ${pts[0].x} ${PAD.t + chartH} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1C3B35" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#1C3B35" stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1={PAD.l} x2={W - PAD.r}
          y1={PAD.t + chartH * (1 - t)} y2={PAD.t + chartH * (1 - t)}
          stroke="#e5e7eb" strokeWidth={0.8} />
      ))}
      <path d={areaD} fill="url(#areaGrad2)" />
      <path d={pathD} fill="none" stroke="#1C3B35" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={p.label}
          onMouseEnter={() => setTip({ x: p.x, y: p.y, val: p.v })}
          onMouseLeave={() => setTip(null)}>
          <circle cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3.5}
            fill={i === pts.length - 1 ? '#D4A843' : '#1C3B35'}
            stroke="white" strokeWidth={1.5} className="cursor-pointer" />
          <text x={p.x} y={H - 6} textAnchor="middle" fontSize={8} fill="#9ca3af">{p.label}</text>
        </g>
      ))}
      {tip && (
        <g>
          <rect x={tip.x - 40} y={tip.y - 32} width={86} height={28} rx={5} fill="#1C3B35" />
          <text x={tip.x + 3} y={tip.y - 21} textAnchor="middle" fontSize={9} fill="white" fontWeight={600}>Revenue</text>
          <text x={tip.x + 3} y={tip.y - 10} textAnchor="middle" fontSize={9} fill="#D4A843">${tip.val.toFixed(2)}</text>
        </g>
      )}
    </svg>
  );
}

type PendingPayment = {
  id: string; amount: number; currency: string; method: string;
  bankRef?: string; createdAt: string;
  user?: { email: string };
  childProfile?: { id: string; name: string; memberId?: string };
};

/* ── Helper: last N months labels ─────────────────────────────── */
function lastNMonths(n: number): string[] {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const result = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`${months[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`);
  }
  return result;
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [page, setPage] = useState(1);
  const [approving, setApproving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [selectedStatKey, setSelectedStatKey] = useState<string>('Total Revenue');
  const router = useRouter();

  const showToast = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 5000);
  };

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminApi.dashboard().then(r => r.data).catch(() => ({})),
      adminApi.analytics().then(r => r.data).catch(() => null),
      adminApi.payments('PENDING').then(r => r.data ?? []).catch(() => []),
    ]).then(([s, a, p]) => {
      setStats(s);
      setAnalytics(a);
      setPendingPayments(p);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const approvePayment = async (paymentId: string) => {
    setApproving(paymentId);
    try {
      await adminApi.approvePayment(paymentId);
      showToast('✅ Payment approved & profile activated!');
      load();
    } catch {
      showToast('Failed to approve payment', false);
    } finally {
      setApproving(null);
    }
  };

  // Build chart data from real analytics or empty
  const monthLabels = lastNMonths(6);

  // For registrations — we use totalUsers from stats, show proportional bar (placeholder if no time-series data)
  const regData: ChartPoint[] = monthLabels.map((label, i) => ({
    label: label.split(' ')[0], // just month abbrev
    v: i === monthLabels.length - 1 ? (stats?.totalUsers ?? 0) : 0,
  }));

  // For revenue — use totalRevenue on last month
  const revData: ChartPoint[] = monthLabels.map((label, i) => ({
    label: label.split(' ')[0],
    v: i === monthLabels.length - 1 ? (stats?.totalRevenue ?? 0) : 0,
  }));

  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalUsers = stats?.totalUsers ?? 0;
  const totalProfiles = stats?.totalProfiles ?? 0;
  const pendingCount = stats?.pendingPayments ?? 0;
  const activeProfiles = stats?.activeProfiles ?? 0;

  const row1: AdminStatCardItem[] = [
    { label: 'Total Revenue', icon: CircleDollarSign, value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'Successful payments only' },
    { label: 'Total Users', icon: Users, value: totalUsers.toLocaleString(), sub: 'Registered accounts' },
    { label: 'Total Profiles', icon: UserCircle, value: totalProfiles.toLocaleString(), sub: `${totalProfiles > 0 ? Math.round((activeProfiles / totalProfiles) * 100) : 0}% activation rate` },
    { label: 'Pending Approvals', icon: ClipboardCheck, value: pendingCount, sub: pendingCount > 0 ? 'Needs your attention' : 'All clear!' },
  ];
  const row2: AdminStatCardItem[] = [
    { label: 'Active Subscriptions', icon: CreditCard, value: activeProfiles.toLocaleString(), sub: 'With active subscription' },
    { label: 'Active Profiles', icon: UserCheck, value: activeProfiles.toLocaleString(), sub: 'Visible to members' },
    { label: 'Pending Payments', icon: HandCoins, value: pendingCount, sub: 'Awaiting approval' },
    { label: 'Total Registered', icon: UserPlus, value: totalUsers.toLocaleString(), sub: 'All time' },
  ];

  const quickActions = [
    { label: 'Approve Payments', href: '/admin/payments', icon: '✅', badge: pendingCount > 0 ? pendingCount : null },
    { label: 'Membership', href: '/admin/users', icon: '👥', badge: null },
    { label: 'Master File', href: '/admin/profiles', icon: '📋', badge: null },
    { label: 'Manage Packages', href: '/admin/packages', icon: '📦', badge: null },
    { label: 'Manage Boosts', href: '/admin/boosts', icon: '⚡', badge: null },
    { label: 'Analytics', href: '/admin/analytics', icon: '📊', badge: null },
  ];

  const PER_PAGE = 8;
  const totalPages = Math.ceil(pendingPayments.length / PER_PAGE);
  const pageData = pendingPayments.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Top viewed profiles from analytics
  const topViewed: any[] = analytics?.topViewed ?? [];

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400 font-poppins">
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Loading dashboard…
    </div>
  );

  return (
    <div className="font-poppins space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[34px] xl:text-[37px] 2xl:text-[40px] font-poppins font-medium text-[#121514]">Dashboard Overview</h1>
          <p className="text-[#121514AD]/68 title-sub-top mt-0.5">Monitor activity and manage the platform</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 text-sm border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition font-semibold">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${toast.ok ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          {toast.text}
        </div>
      )}

      {/* ── Row 1 stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {row1.map((c) => (
          <AdminStatCard
            key={c.label}
            item={c}
            selected={selectedStatKey === c.label}
            onSelect={() => setSelectedStatKey(c.label)}
          />
        ))}
      </div>

      {/* ── Row 2 stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {row2.map((c) => (
          <AdminStatCard
            key={c.label}
            item={c}
            selected={selectedStatKey === c.label}
            onSelect={() => setSelectedStatKey(c.label)}
          />
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Registrations bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-medium font-poppins text-[#121514] subtitle">Registrations Over Time</h2>
              <p className="text-xs md:text-sm lg:text-base text-gray-400 mt-0.5">User registrations by month</p>
            </div>
            <span className="text-xs bg-[#EAF2EE] text-[#1C3B35] px-3 py-1 rounded-full font-semibold">
              {totalUsers} total
            </span>
          </div>
          <div className="h-44">
            <BarChart data={regData} />
          </div>
        </div>

        {/* Revenue line chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-medium font-poppins text-[#121514] subtitle">Revenue Overview</h2>
              <p className="text-xs md:text-sm lg:text-base text-gray-400 mt-0.5">Approved payment totals</p>
            </div>
            <span className="text-xs bg-[#EAF2EE] text-[#1C3B35] px-3 py-1 rounded-full font-semibold">
              ${totalRevenue.toFixed(2)}
            </span>
          </div>
          <div className="h-44">
            <LineChart data={revData} />
          </div>
        </div>
      </div>

      {/* ── Live Traffic ── */}
      <LiveTrafficWidget />

      {/* ── Top Viewed + Quick Actions ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top Viewed Profiles */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-medium font-poppins text-[#121514] subtitle mb-4">Top Viewed Profiles</h2>
          {topViewed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-300">
              <span className="text-3xl mb-2">👁</span>
              <p className="text-xs md:text-sm lg:text-base text-gray-400">No profile views yet</p>
              <p className="text-xs md:text-sm lg:text-base text-gray-300 mt-1">Views appear once members browse profiles</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {topViewed.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-bold text-gray-300 w-5 text-center">{i + 1}</span>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${p.gender === 'FEMALE' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                    {p.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.memberId} · {p.city ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-[#1C3B35]">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                    {p.viewCount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-medium font-poppins text-[#121514] subtitle mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-2.5">
            {quickActions.map(qa => (
              <a key={qa.label} href={qa.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#EAF2EE] hover:bg-[#1C3B35] hover:text-white text-[#1C3B35] text-sm font-medium transition-all duration-200 group">
                <div className="h-7 w-7 rounded-lg bg-[#1C3B35] group-hover:bg-white/20 flex items-center justify-center flex-shrink-0 text-sm">
                  {qa.icon}
                </div>
                {qa.label}
                {qa.badge != null && qa.badge > 0 && (
                  <span className="ml-1 min-w-[20px] h-5 rounded-full bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {qa.badge}
                  </span>
                )}
                <svg className="w-4 h-4 ml-auto opacity-30 group-hover:opacity-100 transition" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pending Payments approval table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-medium font-poppins text-[#121514] subtitle">Pending Payment Approvals</h2>
            <p className="text-xs md:text-sm lg:text-base text-gray-400 mt-0.5">
              {pendingPayments.length > 0
                ? `${pendingPayments.length} payment${pendingPayments.length > 1 ? 's' : ''} awaiting approval`
                : 'No pending payments — all clear!'}
            </p>
          </div>
          <button onClick={() => router.push('/admin/payments')}
            className="text-xs bg-[#1C3B35] text-white px-4 py-2 rounded-lg hover:bg-[#15302a] transition font-semibold">
            View All Payments
          </button>
        </div>
        <div className="overflow-x-auto">
          {pendingPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <span className="text-3xl mb-2">✅</span>
              <p className="text-xs md:text-sm lg:text-base ">No pending payments — all clear!</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Payment ID', 'Customer', 'Profile', 'Amount', 'Method', 'Bank Ref', 'Date', 'Action'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageData.map((row, i) => (
                  <tr key={row.id} className={`hover:bg-amber-50/30 transition border-l-4 border-l-amber-400 ${i % 2 === 1 ? 'bg-[#F9FAFB]' : ''}`}>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500 select-all" title={row.id}>
                      {row.id.slice(0, 10)}…
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">{row.user?.email ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{row.childProfile?.name ?? '—'}</p>
                      {row.childProfile?.memberId && <p className="text-xs text-gray-400">{row.childProfile.memberId}</p>}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800">${row.amount} <span className="text-xs font-normal text-gray-400">{row.currency}</span></td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${row.method === 'BANK_TRANSFER' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                        {row.method === 'BANK_TRANSFER' ? '🏦 Bank' : '💳 Online'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{row.bankRef ?? '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{new Date(row.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => approvePayment(row.id)}
                        disabled={approving === row.id}
                        className="text-xs bg-[#1C3B35] text-white px-3 py-1.5 rounded-lg hover:bg-[#15302a] transition font-semibold flex items-center gap-1 disabled:opacity-50">
                        {approving === row.id ? (
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        {approving === row.id ? 'Approving…' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pendingPayments.length > 0 && (
          <div className="px-6 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, pendingPayments.length)} of {pendingPayments.length} pending
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`h-7 w-7 rounded-lg text-xs font-semibold transition ${page === i + 1 ? 'bg-[#1C3B35] text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
