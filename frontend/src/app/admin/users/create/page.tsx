'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/services/api';

type Role = 'PARENT' | 'ADMIN';

export default function AdminCreateUserPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [role, setRole] = useState<Role>('PARENT');
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (!confirmPassword) e.confirmPassword = 'Please confirm the password.';
    else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setApiError('');
    setSaving(true);
    try {
      await adminApi.createUser({
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        whatsappNumber: whatsapp.trim() || undefined,
        role,
      });
      setSuccess(true);
    } catch (e: any) {
      setApiError(e.message ?? 'Failed to create user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Success Screen ── */
  if (success) {
    return (
      <div className="font-poppins min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">User Created!</h2>
          <p className="text-sm text-gray-500 mb-6">
            <strong className="text-gray-800">{email}</strong> has been registered as a{' '}
            <span className={`font-semibold ${role === 'ADMIN' ? 'text-purple-700' : 'text-[#1C3B35]'}`}>
              {role}
            </span>.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { setEmail(''); setPassword(''); setConfirmPassword(''); setPhone(''); setWhatsapp(''); setRole('PARENT'); setSuccess(false); }}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              Create Another
            </button>
            <button
              onClick={() => router.push('/admin/users')}
              className="flex-1 py-2.5 bg-[#1C3B35] rounded-xl text-sm font-semibold text-white hover:bg-[#15302a] transition"
            >
              View Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="font-poppins max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <Link href="/admin/users" className="hover:text-[#1C3B35] transition font-medium">Users</Link>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-gray-700 font-medium">Create User</span>
        </div>
        <h1 className="text-[22px] sm:text-[28px] font-poppins font-medium text-[#121514]">Create New User</h1>
        <p className="text-gray-400 text-sm mt-0.5">Add a new user account with a specified role.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Role selector */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Select Role</p>
          <div className="grid grid-cols-2 gap-3">
            {(['PARENT', 'ADMIN'] as Role[]).map((r) => {
              const active = role === r;
              const isAdmin = r === 'ADMIN';
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`relative flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all ${
                    active
                      ? isAdmin
                        ? 'border-purple-400 bg-purple-50'
                        : 'border-[#1C3B35] bg-[#EAF2EE]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    active
                      ? isAdmin ? 'bg-purple-100' : 'bg-[#1C3B35]/10'
                      : 'bg-gray-100'
                  }`}>
                    {isAdmin ? (
                      <svg className={`w-5 h-5 ${active ? 'text-purple-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    ) : (
                      <svg className={`w-5 h-5 ${active ? 'text-[#1C3B35]' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${active ? (isAdmin ? 'text-purple-700' : 'text-[#1C3B35]') : 'text-gray-700'}`}>{r}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isAdmin ? 'Full dashboard access' : 'Standard user access'}
                    </p>
                  </div>
                  {active && (
                    <span className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center ${isAdmin ? 'bg-purple-500' : 'bg-[#1C3B35]'}`}>
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fields */}
        <div className="px-6 py-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => { const n = {...p}; delete n.email; return n; }); }}
              placeholder="e.g. user@example.com"
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C3B35] transition bg-gray-50 focus:bg-white ${errors.email ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.email}</p>}
          </div>

          {/* Password + Confirm */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => { const n = {...p}; delete n.password; return n; }); }}
                  placeholder="Min. 8 characters"
                  className={`w-full border rounded-xl px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-[#1C3B35] transition bg-gray-50 focus:bg-white ${errors.password ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {showPw
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.password}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCpw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setErrors(p => { const n = {...p}; delete n.confirmPassword; return n; }); }}
                  placeholder="Repeat password"
                  className={`w-full border rounded-xl px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-[#1C3B35] transition bg-gray-50 focus:bg-white ${errors.confirmPassword ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`}
                />
                <button type="button" onClick={() => setShowCpw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {showCpw
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.confirmPassword}</p>}
            </div>
          </div>

          {/* Phone + WhatsApp */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Phone <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +94760000000"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C3B35] transition bg-gray-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                WhatsApp <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="e.g. +94760000000"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C3B35] transition bg-gray-50 focus:bg-white"
              />
            </div>
          </div>

          {/* API Error */}
          {apiError && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-600 flex items-center gap-2">
              <span>⚠</span>{apiError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between gap-3">
          <Link
            href="/admin/users"
            className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-100 transition"
          >
            ← Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-[#1C3B35] text-white rounded-xl text-sm font-semibold hover:bg-[#15302a] transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {saving ? 'Creating…' : '✓ Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}
