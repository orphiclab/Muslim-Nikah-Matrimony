'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/services/api';

type UserDetail = {
  id: string; email: string; role: string;
  phone?: string; whatsappNumber?: string;
  createdAt: string; updatedAt: string;
  _count: { childProfiles: number };
};

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    if (!id) return;
    adminApi.getUser(id)
      .then((r) => {
        const u = r.data as UserDetail;
        setUser(u);
        setPhone(u.phone ?? '');
        setWhatsapp(u.whatsappNumber ?? '');
        setRole(u.role);
      })
      .catch(() => setError('Failed to load user'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!user) return;
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await adminApi.updateUser(user.id, {
        phone: phone.trim() || undefined,
        whatsappNumber: whatsapp.trim() || undefined,
        role: role || undefined,
      });
      setSuccess('Account updated successfully!');
      setTimeout(() => router.push(`/admin/users/${user.id}`), 1200);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update account');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="w-8 h-8 animate-spin text-[#1C3B35]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );

  if (error && !user) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <span className="text-4xl">⚠️</span>
      <p className="text-gray-500 text-sm">{error}</p>
      <button onClick={() => router.back()} className="text-sm text-[#1C3B35] font-semibold hover:underline">← Go back</button>
    </div>
  );

  return (
    <div className="font-poppins space-y-6 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/admin/users" className="hover:text-[#1C3B35] transition font-medium">Users</Link>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <Link href={`/admin/users/${id}`} className="hover:text-[#1C3B35] transition font-medium truncate max-w-[180px]">
          {user?.email}
        </Link>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-gray-700 font-medium">Edit</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 ${role === 'ADMIN' ? 'bg-purple-600' : 'bg-[#1C3B35]'}`}>
          {user?.email[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[#121514]">Edit Account</h1>
          <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#1C3B35]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <h2 className="text-sm font-semibold text-gray-800">Account Information</h2>
        </div>

        <div className="px-6 py-6 space-y-5">
          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Email Address
            </label>
            <input
              value={user?.email ?? ''}
              readOnly
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-400 cursor-not-allowed select-none"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Phone Number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+94 7X XXX XXXX"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20 focus:border-[#1C3B35] transition placeholder:text-gray-300"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              WhatsApp Number
            </label>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+94 7X XXX XXXX"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20 focus:border-[#1C3B35] transition placeholder:text-gray-300"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Role
            </label>
            <div className="flex gap-3">
              {['PARENT', 'ADMIN'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition ${
                    role === r
                      ? r === 'ADMIN'
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'bg-[#1C3B35] border-[#1C3B35] text-white'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {role === 'ADMIN' && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                ⚠️ Granting ADMIN role gives full access to the admin panel. Please confirm this is intentional.
              </p>
            )}
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {success}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none sm:w-36 py-2.5 rounded-xl bg-[#1C3B35] text-white text-sm font-semibold hover:bg-[#152d28] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving…
              </>
            ) : 'Save Changes'}
          </button>
          <Link
            href={`/admin/users/${id}`}
            className="flex-1 sm:flex-none sm:w-28 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition text-center"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* Meta info */}
      <p className="text-xs text-gray-400 text-center">
        Account ID: <span className="font-mono">{id}</span>
        · {user?._count.childProfiles ?? 0} profile{(user?._count.childProfiles ?? 0) !== 1 ? 's' : ''} linked
      </p>
    </div>
  );
}
