'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/services/api';

type Profile = {
  id: string; memberId: string; name: string; gender: string;
  status: string; city?: string; country?: string; createdAt: string;
  subscription?: { status: string; endDate?: string; planName: string } | null;
};

type UserDetail = {
  id: string; email: string; role: string; phone?: string;
  whatsappNumber?: string; createdAt: string; updatedAt: string;
  childProfiles: Profile[];
  _count: { childProfiles: number };
};

const statusColor: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  DRAFT: 'bg-gray-100 text-gray-500 border-gray-200',
  PAYMENT_PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  PAUSED: 'bg-orange-100 text-orange-700 border-orange-200',
  INACTIVE: 'bg-red-100 text-red-500 border-red-200',
  EXPIRED: 'bg-red-100 text-red-600 border-red-200',
};

const subStatusColor: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
  EXPIRED: 'bg-red-100 text-red-600',
};

export default function ViewUserPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    adminApi.getUser(id)
      .then((r) => setUser(r.data))
      .catch(() => setError('Failed to load user'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="w-8 h-8 animate-spin text-[#1C3B35]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );

  if (error || !user) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <span className="text-4xl">⚠️</span>
      <p className="text-gray-500 text-sm">{error || 'User not found'}</p>
      <button onClick={() => router.back()} className="text-sm text-[#1C3B35] font-semibold hover:underline">← Go back</button>
    </div>
  );

  return (
    <div className="font-poppins space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/admin/users" className="hover:text-[#1C3B35] transition font-medium">Users</Link>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-gray-700 font-medium truncate">{user.email}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 ${user.role === 'ADMIN' ? 'bg-purple-600' : 'bg-[#1C3B35]'}`}>
            {user.email[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#121514]">{user.email.split('@')[0]}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/users/${user.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1C3B35] text-white text-sm font-semibold hover:bg-[#152d28] transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Account
          </Link>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Account Info */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#1C3B35]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <h2 className="text-sm font-semibold text-gray-800">Account Details</h2>
            </div>
            <div className="px-5 py-2">
              <InfoRow label="Role">
                <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-semibold border ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-[#EAF2EE] text-[#1C3B35] border-[#c8dfd7]'}`}>
                  {user.role}
                </span>
              </InfoRow>
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Phone" value={user.phone} />
              <InfoRow label="WhatsApp" value={user.whatsappNumber} />
              <InfoRow label="Profiles" value={`${user._count.childProfiles} profile${user._count.childProfiles !== 1 ? 's' : ''}`} />
              <InfoRow label="Joined" value={new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
              <InfoRow label="Last Updated" value={new Date(user.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
            </div>
          </div>

          {/* Stats card */}
          <div className="bg-[#1C3B35] rounded-2xl p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-3">Summary</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">{user._count.childProfiles}</p>
                <p className="text-xs text-white/60 mt-0.5">Profiles</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{user.childProfiles.filter(p => p.status === 'ACTIVE').length}</p>
                <p className="text-xs text-white/60 mt-0.5">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{user.childProfiles.filter(p => p.subscription?.status === 'ACTIVE').length}</p>
                <p className="text-xs text-white/60 mt-0.5">Subscribed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{user.childProfiles.filter(p => p.status === 'DRAFT' || p.status === 'PAYMENT_PENDING').length}</p>
                <p className="text-xs text-white/60 mt-0.5">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profiles list */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#1C3B35]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <h2 className="text-sm font-semibold text-gray-800">Profiles</h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EAF2EE] text-[#1C3B35]">
                {user.childProfiles.length} total
              </span>
            </div>

            {user.childProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <span className="text-3xl mb-2">📋</span>
                <p className="text-sm">No profiles created yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {user.childProfiles.map((p) => (
                  <div key={p.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition">
                    {/* Avatar */}
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${p.gender === 'MALE' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                      {p.name[0].toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-800 truncate">{p.name}</span>
                        <span className="text-xs text-gray-400 font-mono">{p.memberId}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {[p.city, p.country].filter(Boolean).join(', ') || 'No location'} · {p.gender}
                      </p>
                    </div>
                    {/* Status badges */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${statusColor[p.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {p.status.replace('_', ' ')}
                      </span>
                      {p.subscription && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${subStatusColor[p.subscription.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {p.subscription.planName}
                          {p.subscription.endDate ? ` · expires ${new Date(p.subscription.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for InfoRow with children
function InfoRow({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <span className="w-36 shrink-0 text-xs font-semibold text-gray-400 uppercase tracking-wide pt-0.5">{label}</span>
      {children ?? (
        <span className="text-sm text-gray-800 font-medium">
          {value || <span className="text-gray-300 italic">Not set</span>}
        </span>
      )}
    </div>
  );
}
