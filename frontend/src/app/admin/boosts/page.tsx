'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/services/api';

type Boost = {
  id: string;
  memberId: string;
  name: string;
  gender: string;
  city?: string;
  country?: string;
  boostExpiresAt: string | null;
  status: string;
  viewCount: number;
  isActive: boolean;
  daysLeft: number;
  user: { email: string };
};

/* ─── Extend Modal ──────────────────────────────────────────── */
function ExtendModal({
  boost,
  onClose,
  onConfirm,
  loading,
}: {
  boost: Boost;
  onClose: () => void;
  onConfirm: (days: number) => void;
  loading: boolean;
}) {
  const [days, setDays] = useState<string>('');
  const parsed = parseInt(days, 10);
  const valid  = !isNaN(parsed) && parsed > 0 && parsed <= 365;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Extend Boost</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              <span className="font-semibold text-gray-700">{boost.name}</span>
              {boost.isActive && boost.daysLeft > 0
                ? ` · ${boost.daysLeft} day${boost.daysLeft !== 1 ? 's' : ''} remaining`
                : ' · Expired'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition mt-0.5"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Number of days to extend
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={e => setDays(e.target.value)}
              placeholder="e.g. 14"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#DB9D30]/40 focus:border-[#DB9D30] transition"
            />
            <span className="text-sm text-gray-400 font-medium">days</span>
          </div>
          {days && !valid && (
            <p className="text-xs text-red-500">Enter a number between 1 and 365.</p>
          )}
        </div>

        {/* Quick-pick chips */}
        <div className="flex flex-wrap gap-2">
          {[7, 15, 30, 60, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(String(d))}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                days === String(d)
                  ? 'bg-[#DB9D30] text-white border-[#DB9D30]'
                  : 'bg-[#DB9D30]/10 text-[#8B5E00] border-[#DB9D30]/30 hover:bg-[#DB9D30]/20'
              }`}
            >
              +{d}d
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => valid && onConfirm(parsed)}
            disabled={!valid || loading}
            className="flex-1 bg-[#1C3B35] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#14302a] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Extending…
              </>
            ) : (
              'Extend Boost'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function AdminBoostsPage() {
  const [boosts, setBoosts]   = useState<Boost[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState<{ text: string; ok: boolean } | null>(null);
  const [acting, setActing]   = useState<string | null>(null);
  const [filter, setFilter]   = useState<'all' | 'active' | 'expired'>('all');

  /* extend modal state */
  const [extendTarget, setExtendTarget] = useState<Boost | null>(null);
  const extendLoading = acting?.startsWith(extendTarget?.id ?? '___') && acting.includes('_extend');

  const showToast = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 5000);
  };

  const load = () => {
    setLoading(true);
    adminApi.getBoosts()
      .then(r => setBoosts(r.data ?? []))
      .catch(() => showToast('Failed to load boosts', false))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this boost?')) return;
    setActing(id + '_remove');
    try {
      await adminApi.removeBoost(id);
      showToast('Boost removed.');
      load();
    } catch {
      showToast('Failed to remove boost', false);
    } finally { setActing(null); }
  };

  const handleExtendConfirm = async (days: number) => {
    if (!extendTarget) return;
    const id = extendTarget.id;
    setActing(id + '_extend');
    try {
      await adminApi.extendBoost(id, days);
      showToast(`Boost extended by ${days} day${days !== 1 ? 's' : ''}!`);
      setExtendTarget(null);
      load();
    } catch {
      showToast('Failed to extend boost', false);
    } finally { setActing(null); }
  };

  const displayed = boosts.filter(b =>
    filter === 'all' ? true
    : filter === 'active' ? b.isActive
    : !b.isActive,
  );

  const activeCount  = boosts.filter(b => b.isActive).length;
  const expiredCount = boosts.filter(b => !b.isActive).length;

  return (
    <div className="font-poppins space-y-6">

      {/* Extend Modal */}
      {extendTarget && (
        <ExtendModal
          boost={extendTarget}
          onClose={() => setExtendTarget(null)}
          onConfirm={handleExtendConfirm}
          loading={!!extendLoading}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[34px] xl:text-[37px] 2xl:text-[40px] font-poppins font-medium text-[#121514]">Profile Boosts</h1>
          <p className="text-[#121514AD]/68 title-sub-top mt-0.5">Manage boosted profiles — extend or remove VIP status</p>
        </div>
        <button onClick={load} className="self-start sm:self-auto flex items-center gap-2 text-sm border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition font-semibold">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${toast.ok ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          {toast.text}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Boosts',   value: boosts.length,  color: 'bg-white border border-gray-100' },
          { label: 'Active Boosts',  value: activeCount,   color: 'bg-gradient-to-br from-[#DB9D30]/10 to-[#E8BE1A]/10 border border-[#DB9D30]/30' },
          { label: 'Expired Boosts', value: expiredCount,  color: 'bg-gray-50 border border-gray-100' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-5`}>
            <p className="text-xs text-gray-500 font-medium mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'active', 'expired'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition capitalize ${
              filter === f
                ? 'bg-[#1C3B35] text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {f} {f === 'active' ? `(${activeCount})` : f === 'expired' ? `(${expiredCount})` : `(${boosts.length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3 text-gray-400">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading boosts…
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <span className="text-4xl mb-3">⚡</span>
            <p className="font-semibold text-gray-500">No boosted profiles</p>
            <p className="text-sm mt-1">Profiles boosted by members will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Profile', 'Member', 'Location', 'Status', 'Views', 'Expires', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map((b, i) => (
                  <tr key={b.id} className={`hover:bg-amber-50/20 transition ${i % 2 === 1 ? 'bg-[#FAFAFA]' : ''}`}>
                    {/* Profile */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          b.gender === 'FEMALE' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {b.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                            {b.name}
                            {b.isActive && (
                              <span className="text-[9px] font-extrabold text-[#DB9D30] bg-[#DB9D30]/10 px-1.5 py-0.5 rounded-full border border-[#DB9D30]/30">
                                ✦ VIP
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">{b.memberId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Member email */}
                    <td className="px-5 py-4 text-xs text-gray-500">{b.user?.email ?? '—'}</td>

                    {/* Location */}
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {[b.city, b.country].filter(Boolean).join(', ') || '—'}
                    </td>

                    {/* Profile status */}
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        b.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {b.status}
                      </span>
                    </td>

                    {/* Views */}
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                        👁 {b.viewCount.toLocaleString()}
                      </span>
                    </td>

                    {/* Expires */}
                    <td className="px-5 py-4">
                      {b.boostExpiresAt ? (
                        <div>
                          <p className={`text-xs font-semibold ${b.isActive ? 'text-[#DB9D30]' : 'text-gray-400'}`}>
                            {b.isActive
                              ? `${b.daysLeft} day${b.daysLeft !== 1 ? 's' : ''} left`
                              : 'Expired'}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(b.boostExpiresAt).toLocaleDateString('en-US', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </p>
                        </div>
                      ) : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {/* Extend */}
                        <button
                          onClick={() => setExtendTarget(b)}
                          disabled={acting !== null}
                          className="text-[10px] font-semibold bg-[#DB9D30]/10 text-[#8B5E00] border border-[#DB9D30]/30 hover:bg-[#DB9D30]/20 px-3 py-1.5 rounded-lg transition disabled:opacity-40 whitespace-nowrap flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                          </svg>
                          Extend
                        </button>

                        {/* Remove */}
                        <button
                          onClick={() => handleRemove(b.id)}
                          disabled={acting !== null}
                          className="text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg transition disabled:opacity-40 whitespace-nowrap flex items-center gap-1"
                        >
                          {acting === `${b.id}_remove` ? (
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                            </svg>
                          )}
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
