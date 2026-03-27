'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard().then((r) => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: '👥', color: 'bg-blue-50 text-blue-700' },
    { label: 'Total Profiles', value: stats?.totalProfiles ?? 0, icon: '👤', color: 'bg-purple-50 text-purple-700' },
    { label: 'Active Profiles', value: stats?.activeProfiles ?? 0, icon: '✅', color: 'bg-green-50 text-green-700' },
    { label: 'Pending Payments', value: stats?.pendingPayments ?? 0, icon: '⏳', color: 'bg-amber-50 text-amber-700' },
    { label: 'Total Revenue', value: `$${(stats?.totalRevenue ?? 0).toFixed(2)}`, icon: '💰', color: 'bg-emerald-50 text-emerald-700' },
  ];

  return (
    <div className="font-poppins">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">System overview and management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl p-5 ${c.color} flex items-center gap-4`}>
            <span className="text-3xl">{c.icon}</span>
            <div>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-sm font-medium opacity-80">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { href: '/admin/payments', label: 'Review Pending Payments', desc: `${stats?.pendingPayments ?? 0} payments need approval`, icon: '💳', urgent: (stats?.pendingPayments ?? 0) > 0 },
          { href: '/admin/users', label: 'Manage Users', desc: `${stats?.totalUsers ?? 0} registered users`, icon: '👥', urgent: false },
          { href: '/admin/profiles', label: 'View Profiles', desc: `${stats?.activeProfiles ?? 0} active profiles`, icon: '👤', urgent: false },
        ].map((a) => (
          <a key={a.href} href={a.href}
            className={`block bg-white rounded-2xl border p-5 hover:shadow-md transition ${a.urgent ? 'border-amber-200' : 'border-gray-100'}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{a.icon}</span>
              <div>
                <p className="font-semibold text-gray-800">{a.label}</p>
                <p className="text-sm text-gray-500 mt-0.5">{a.desc}</p>
              </div>
              {a.urgent && <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">Action needed</span>}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
