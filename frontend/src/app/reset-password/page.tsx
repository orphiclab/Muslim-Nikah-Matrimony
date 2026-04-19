'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { authApi } from '@/services/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<'validating' | 'valid' | 'invalid' | 'success'>('validating');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCo, setShowCo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    authApi.validateResetToken(token)
      .then(res => setStatus(res.valid ? 'valid' : 'invalid'))
      .catch(() => setStatus('invalid'));
  }, [token]);

  // Password strength
  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = [
    '',
    'bg-red-400',
    'bg-amber-400',
    'bg-blue-400',
    'bg-green-500',
  ][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      // Clear any stale session so the login page doesn't auto-redirect
      localStorage.removeItem('mn_token');
      localStorage.removeItem('mn_user');
      setStatus('success');
    } catch (err: any) {
      setError(err.message ?? 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-poppins bg-gray-50 pt-24 pb-8 px-4 min-h-screen">
      <div className="w-full max-w-4xl mx-auto rounded-2xl bg-white shadow-md overflow-hidden flex flex-col md:flex-row">

        {/* ── Left Sidebar ── */}
        <aside className="hidden md:flex w-64 bg-[#F0F4F2] px-7 py-8 flex-col justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {status === 'success' ? 'All Done!' : status === 'invalid' ? 'Link Expired' : 'Set New Password'}
            </h2>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              {status === 'success'
                ? 'Your password has been updated. You can now sign in with your new credentials.'
                : status === 'invalid'
                ? 'This link is no longer valid. Please request a fresh reset link.'
                : 'Choose a strong password to keep your account secure.'}
            </p>

            <div className="mt-6 flex items-center gap-2">
              <div className="h-0.5 flex-1 bg-[#1B6B4A]/20 rounded" />
              <span className="text-xs text-[#1B6B4A] font-medium">Secure Reset</span>
              <div className="h-0.5 flex-1 bg-[#1B6B4A]/20 rounded" />
            </div>

            <ul className="mt-6 flex flex-col gap-4">
              {[
                { icon: '🔒', text: 'End-to-end encrypted' },
                { icon: '⏱️', text: 'Link valid for 1 hour' },
                { icon: '🛡️', text: 'Single-use token only' },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-base">{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-10 text-xs text-gray-400 leading-relaxed">
            Trusted by 10,000+ families worldwide for halal matchmaking.
          </p>
        </aside>

        {/* ── Right Form Area ── */}
        <main className="flex-1 px-6 py-8 md:px-10 md:py-8">

          {/* Mobile brand header */}
          <div className="md:hidden mb-6 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#1B6B4A] mb-3">
              <span className="text-xl">🕌</span>
            </div>
            <p className="text-xs font-medium text-[#1B6B4A] uppercase tracking-widest">Muslim Nikah</p>
          </div>

          <div className="w-full max-w-md mx-auto">

            {/* ── Validating ── */}
            {status === 'validating' && (
              <div className="py-12 flex flex-col items-center text-center">
                <svg className="w-8 h-8 animate-spin text-[#1B6B4A] mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <p className="text-sm text-gray-400">Verifying your reset link…</p>
              </div>
            )}

            {/* ── Invalid / Expired ── */}
            {status === 'invalid' && (
              <div className="py-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 border border-red-100 mb-5">
                  <XCircle className="w-7 h-7 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Link Invalid or Expired</h1>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  This reset link is invalid, has expired, or has already been used.
                  Reset links are valid for <strong>1 hour</strong>.
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/forgot-password"
                    className="w-full rounded-xl bg-[#1B6B4A] py-3 text-sm font-semibold text-white hover:bg-[#155a3d] transition text-center shadow-md"
                  >
                    Request a New Link
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Login
                  </Link>
                </div>
              </div>
            )}

            {/* ── Valid — Password Form ── */}
            {status === 'valid' && (
              <>
                <h1 className="text-2xl font-bold text-gray-800">Set New Password</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a strong password to protect your account.
                </p>

                <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">

                  {/* New Password */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(''); }}
                        placeholder="Min. 8 characters"
                        required
                        autoFocus
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-11 py-3 text-sm text-gray-800 outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/15 focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1"
                      >
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Strength meter */}
                    {password && (
                      <div className="mt-1">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map(i => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-gray-200'}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-400">{strengthLabel}</p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        type={showCo ? 'text' : 'password'}
                        value={confirm}
                        onChange={e => { setConfirm(e.target.value); setError(''); }}
                        placeholder="Repeat your password"
                        className={`w-full rounded-xl border bg-gray-50 pl-10 pr-11 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:bg-white transition ${
                          confirm && password !== confirm
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                            : 'border-gray-200 focus:border-[#1B6B4A] focus:ring-[#1B6B4A]/15'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCo(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1"
                      >
                        {showCo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirm && password !== confirm && (
                      <p className="text-xs text-red-500 mt-0.5">Passwords don't match</p>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                      {error}
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading || !password || !confirm}
                    className="mt-1 w-full rounded-xl bg-[#1B6B4A] py-3.5 text-sm font-semibold text-white hover:bg-[#155a3d] active:scale-[0.98] transition-all duration-200 shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Resetting…
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Reset Password
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-gray-100">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Login
                  </Link>
                </div>
              </>
            )}

            {/* ── Success ── */}
            {status === 'success' && (
              <div className="py-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-50 border border-green-100 mb-5">
                  <CheckCircle2 className="w-7 h-7 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Password Reset!</h1>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  Your password has been updated successfully. You can now sign in with your new password.
                </p>
                <Link
                  href="/login"
                  className="block w-full rounded-xl bg-[#1B6B4A] py-3.5 text-sm font-semibold text-white hover:bg-[#155a3d] transition text-center shadow-md"
                >
                  Sign In Now
                </Link>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="font-poppins bg-gray-50 pt-24 px-4 min-h-screen flex items-start justify-center">
        <div className="w-full max-w-4xl mx-auto rounded-2xl bg-white shadow-md p-16 flex items-center justify-center">
          <svg className="w-6 h-6 animate-spin text-[#1B6B4A]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
