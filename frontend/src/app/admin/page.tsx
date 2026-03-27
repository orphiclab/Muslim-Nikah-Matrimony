'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/services/api';

/* ── Tiny SVG bar chart ───────────────────────────────────────────── */
const BAR_DATA = [
  { month: 'May', v: 90 }, { month: 'Jun', v: 130 }, { month: 'Jul', v: 170 },
  { month: 'Aug', v: 110 }, { month: 'Sep', v: 75 }, { month: 'Oct', v: 50 },
];
const LINE_DATA = [
  { month: 'May', v: 180000 }, { month: 'Jun', v: 250000 }, { month: 'Jul', v: 170000 },
  { month: 'Aug', v: 310000 }, { month: 'Sep', v: 270000 }, { month: 'Oct', v: 350000 },
];
const W = 320, H = 170, PAD = { t: 10, r: 10, b: 28, l: 30 };
const chartW = W - PAD.l - PAD.r;
const chartH = H - PAD.t - PAD.b;

function BarChart() {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; val: number } | null>(null);
  const max = Math.max(...BAR_DATA.map((d) => d.v));
  const bw = chartW / BAR_DATA.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ overflow: 'visible' }}>
      {/* Y grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line key={t} x1={PAD.l} x2={W - PAD.r} y1={PAD.t + chartH * (1 - t)} y2={PAD.t + chartH * (1 - t)}
          stroke="#e5e7eb" strokeWidth={0.8} />
      ))}
      {/* Bars */}
      {BAR_DATA.map((d, i) => {
        const bh = (d.v / max) * chartH;
        const bx = PAD.l + i * bw + bw * 0.2;
        const by = PAD.t + chartH - bh;
        const isActive = i === 2;
        return (
          <g key={d.month} onMouseEnter={() => setTooltip({ x: bx + bw * 0.3, y: by - 8, label: `July 2026`, val: d.v })}
            onMouseLeave={() => setTooltip(null)}>
            <rect x={bx} y={by} width={bw * 0.6} height={bh}
              fill={isActive ? '#1C3B35' : '#D1E8DA'} rx={3} className="cursor-pointer" />
            <text x={bx + bw * 0.3} y={H - 6} textAnchor="middle" fontSize={9} fill="#9ca3af">{d.month}</text>
          </g>
        );
      })}
      {/* Tooltip */}
      {tooltip && (
        <g>
          <rect x={tooltip.x - 40} y={tooltip.y - 28} width={86} height={28} rx={5} fill="#1C3B35" />
          <text x={tooltip.x + 3} y={tooltip.y - 17} textAnchor="middle" fontSize={9} fill="white" fontWeight={600}>{tooltip.label}</text>
          <circle cx={tooltip.x - 26} cy={tooltip.y - 8} r={3} fill="#D4A843" />
          <text x={tooltip.x - 20} y={tooltip.y - 5} fontSize={9} fill="white">value  {tooltip.val}</text>
        </g>
      )}
    </svg>
  );
}

function LineChart() {
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);
  const max = Math.max(...LINE_DATA.map((d) => d.v));
  const min = Math.min(...LINE_DATA.map((d) => d.v));
  const range = max - min;
  const pts = LINE_DATA.map((d, i) => ({
    x: PAD.l + (i / (LINE_DATA.length - 1)) * chartW,
    y: PAD.t + chartH - ((d.v - min) / range) * chartH,
    ...d,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${PAD.t + chartH} L ${pts[0].x} ${PAD.t + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1C3B35" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#1C3B35" stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line key={t} x1={PAD.l} x2={W - PAD.r} y1={PAD.t + chartH * (1 - t)} y2={PAD.t + chartH * (1 - t)}
          stroke="#e5e7eb" strokeWidth={0.8} />
      ))}
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={pathD} fill="none" stroke="#1C3B35" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={p.month} onMouseEnter={() => setTooltip({ x: p.x, y: p.y })} onMouseLeave={() => setTooltip(null)}>
          <circle cx={p.x} cy={p.y} r={i === 3 ? 5 : 3.5} fill={i === 3 ? '#D4A843' : '#1C3B35'}
            stroke="white" strokeWidth={1.5} className="cursor-pointer" />
          <text x={p.x} y={H - 6} textAnchor="middle" fontSize={9} fill="#9ca3af">{p.month}</text>
        </g>
      ))}
      {tooltip && (
        <g>
          <rect x={tooltip.x - 38} y={tooltip.y - 32} width={86} height={28} rx={5} fill="#1C3B35" />
          <text x={tooltip.x + 5} y={tooltip.y - 21} textAnchor="middle" fontSize={9} fill="white" fontWeight={600}>July 2026</text>
          <circle cx={tooltip.x - 26} cy={tooltip.y - 12} r={3} fill="#D4A843" />
          <text x={tooltip.x - 20} y={tooltip.y - 9} fontSize={9} fill="white">Revenue  170k</text>
        </g>
      )}
    </svg>
  );
}

/* ── Stat card ───────────────────────────────────────────────────── */
function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 flex items-center gap-4 ${highlight ? 'bg-[#1C3B35] text-white' : 'bg-white text-gray-800 border border-gray-100'}`}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${highlight ? 'bg-white/15' : 'bg-[#EAF2EE]'}`}>
        <svg className={`w-5 h-5 ${highlight ? 'text-white' : 'text-[#1C3B35]'}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-medium mb-0.5 truncate ${highlight ? 'text-white/70' : 'text-gray-500'}`}>{label}</p>
        <p className={`text-2xl font-bold leading-none ${highlight ? 'text-white' : 'text-gray-800'}`}>{value}</p>
      </div>
    </div>
  );
}

/* ── Pending table ───────────────────────────────────────────────── */
const DEMO_PENDING = [
  { id: '#001', name: 'Ahmed Hassan', age: 26, country: 'Australia', status: 'Pending' },
  { id: '#002', name: 'Sara Malik', age: 24, country: 'Australia', status: 'Pending' },
  { id: '#003', name: 'Yusuf Rahman', age: 28, country: 'Australia', status: 'Pending' },
  { id: '#004', name: 'Nadia Al-Rashid', age: 22, country: 'Australia', status: 'Pending' },
  { id: '#005', name: 'Omar Farooq', age: 30, country: 'Australia', status: 'Pending' },
  { id: '#006', name: 'Aisha Begum', age: 25, country: 'Australia', status: 'Pending' },
  { id: '#007', name: 'Tariq Khan', age: 27, country: 'Sri Lanka', status: 'Pending' },
  { id: '#008', name: 'Fatima Zahra', age: 23, country: 'Sri Lanka', status: 'Pending' },
];

/* ── Main page ───────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    adminApi.dashboard().then((r) => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalUsers = stats?.totalUsers ?? 4521;
  const totalProfiles = stats?.totalProfiles ?? 2847;
  const activeProfiles = stats?.activeProfiles ?? 1293;
  const pendingPayments = stats?.pendingPayments ?? 23;
  const totalRevenue = stats?.totalRevenue ?? 47832;

  const row1 = [
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, highlight: true },
    { label: 'New Registrations', value: 156 },
    { label: 'Approved Profiles', value: totalProfiles.toLocaleString() },
    { label: 'Pending Approvals', value: pendingPayments },
  ];
  const row2 = [
    { label: 'Active Subscriptions', value: activeProfiles.toLocaleString() },
    { label: 'Expired Profiles', value: 89 },
    { label: 'Pending Payments', value: pendingPayments },
    { label: 'Total Users', value: totalUsers.toLocaleString() },
  ];

  const activity = [
    { dot: '#3B82F6', text: 'Ahmed Hassan registered', time: '5 minutes ago', tag: 'New user', tagColor: 'bg-[#1C3B35] text-white' },
    { dot: '#F59E0B', text: 'Premium subscription · $29.99', time: '15 minutes ago', tag: 'Payment', tagColor: 'bg-amber-100 text-amber-700' },
    { dot: '#10B981', text: 'Profile approved: Fatima Ali', time: '20 minutes ago', tag: 'Approval', tagColor: 'bg-green-100 text-green-700' },
    { dot: '#F97316', text: 'Profile pending: Omar Khan', time: '30 minutes ago', tag: 'Approval', tagColor: 'bg-orange-100 text-orange-700' },
  ];

  const quickActions = [
    { label: 'Add New Profile', href: '/admin/profiles', icon: '👤' },
    { label: 'Approve Users', href: '/admin/users', icon: '✅' },
    { label: 'View payments', href: '/admin/payments', icon: '💳' },
    { label: 'Manage packages', href: '/admin/packages', icon: '📦' },
  ];

  const PER_PAGE = 8;
  const totalPages = Math.ceil(DEMO_PENDING.length / PER_PAGE);
  const pageData = DEMO_PENDING.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="font-poppins space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-400 text-sm mt-0.5">Monitor activity and manage the platform</p>
      </div>

      {/* ── Row 1 stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {row1.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {/* ── Row 2 stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {row2.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Registrations Over Time</h2>
            <select className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white outline-none focus:border-[#1C3B35]">
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-44">
            <BarChart />
          </div>
        </div>

        {/* Line chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Revenue by Month</h2>
          </div>
          <div className="h-44">
            <LineChart />
          </div>
        </div>
      </div>

      {/* ── Recent Activity + Quick Actions ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-4">Recent Activity</h2>
          <div className="flex flex-col gap-3">
            {activity.map((a, i) => (
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
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-4">Quick Action</h2>
          <div className="flex flex-col gap-3">
            {quickActions.map((qa) => (
              <a key={qa.label} href={qa.href}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#EAF2EE] hover:bg-[#1C3B35] hover:text-white text-[#1C3B35] text-sm font-semibold transition-all duration-200 group">
                <div className="h-7 w-7 rounded-lg bg-[#1C3B35] group-hover:bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                {qa.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pending Approvals table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Pending Approvals</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', 'Name', 'Age', 'Country', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide">
                    <span className="flex items-center gap-1">{h}
                      {h !== 'Action' && (
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageData.map((row, i) => (
                <tr key={row.id} className={`hover:bg-gray-50 transition ${i % 2 === 1 ? 'bg-[#F9FAFB]' : ''}`}>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">{row.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{row.name}</td>
                  <td className="px-6 py-4 text-gray-600">{row.age}</td>
                  <td className="px-6 py-4 text-gray-600">{row.country}</td>
                  <td className="px-6 py-4">
                    <span className="text-[#F59E0B] font-semibold">{row.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-gray-400 hover:text-gray-700 transition px-2 py-1 rounded-lg hover:bg-gray-100">
                      <span className="text-base tracking-widest font-bold">···</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            Showing data {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, DEMO_PENDING.length)} of {DEMO_PENDING.length} entries
          </p>
          <div className="flex items-center gap-2">
            {/* Export */}
            <button className="flex items-center gap-1.5 bg-[#1C3B35] text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-[#15302a] transition mr-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
            {/* Prev */}
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`h-7 w-7 rounded-lg text-xs font-semibold transition ${
                  page === i + 1 ? 'bg-[#1C3B35] text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}>
                {i + 1}
              </button>
            ))}
            {/* Next */}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
