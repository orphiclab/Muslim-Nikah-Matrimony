'use client';

import { useEffect, useState, useCallback } from 'react';
import { profileApi, paymentApi } from '@/services/api';
import Link from 'next/link';

/* ── Countdown hook ────────────────────────────────────────────── */
function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState('');
  const [pct, setPct] = useState(100);

  useEffect(() => {
    if (!expiresAt) { setRemaining(''); return; }
    const end = new Date(expiresAt).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) { setRemaining('Expired'); setPct(0); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
      // Progress bar: rough % of a 30-day boost window
      const total = 30 * 86400000;
      setPct(Math.min(100, Math.max(0, (diff / total) * 100)));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return { remaining, pct };
}

/* ── Boost Card ────────────────────────────────────────────────── */
function BoostCard({ profile }: { profile: any }) {
  const { remaining, pct } = useCountdown(profile.boostExpiresAt ?? null);
  const active = !!(profile.boostExpiresAt && new Date(profile.boostExpiresAt) > new Date());
  const expiryDate = profile.boostExpiresAt
    ? new Date(profile.boostExpiresAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all ${active ? 'border-[#DB9D30]/40' : 'border-gray-100 opacity-60'}`}>
      {active && (
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-gradient-to-r from-[#DB9D30] to-[#f5c77e] transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
      )}
      <div className="px-5 pt-4 pb-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${active ? 'bg-[#DB9D30] text-white' : 'bg-gray-100 text-gray-500'}`}>
              {profile.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">{profile.name}</p>
              <p className="text-[10px] text-gray-400 font-mono">{profile.memberId}</p>
            </div>
          </div>
          {active ? (
            <span className="inline-flex items-center gap-1 bg-[#DB9D30] text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">
              ⚡ Boosting
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-[10px] font-bold px-2.5 py-1 rounded-full">
              Expired
            </span>
          )}
        </div>

        {/* Countdown */}
        {active && remaining ? (
          <div className="bg-gradient-to-r from-[#FFFBF0] to-[#FFF8E7] border border-[#DB9D30]/20 rounded-xl px-4 py-3 mb-3">
            <p className="text-[10px] text-[#A07830] font-semibold uppercase tracking-wide mb-1">Time Remaining</p>
            <p className="text-xl font-extrabold text-[#8B5E00] font-mono">{remaining}</p>
            <div className="mt-2 h-1.5 bg-[#DB9D30]/15 rounded-full overflow-hidden">
              <div className="h-full bg-[#DB9D30] rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : expiryDate ? (
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 mb-3">
            <p className="text-[10px] text-gray-400">Ad expired on <strong className="text-gray-600">{expiryDate}</strong></p>
          </div>
        ) : null}

        {/* Details row */}
        <div className="flex items-center text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-[#DB9D30]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {active ? 'Expires' : 'Expired'}: {expiryDate ?? '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Payment status badge ──────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    APPROVED: 'bg-green-100 text-green-700',
    PENDING:  'bg-amber-100 text-amber-700',
    REJECTED: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status === 'APPROVED' ? '✓ Approved' : status === 'REJECTED' ? '✗ Rejected' : '⏳ Pending'}
    </span>
  );
}

/* ── Main Page ─────────────────────────────────────────────────── */
export default function BoostsPage() {
  const [profiles,    setProfiles]    = useState<any[]>([]);
  const [payments,    setPayments]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState<'active' | 'history'>('active');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, paymentRes] = await Promise.all([
        profileApi.getMyProfiles(),
        paymentApi.myPayments(),
      ]);
      // Profiles with boost data
      const allProfiles: any[] = profileRes.data ?? [];
      // Store ALL profiles for boost status lookup
      setProfiles(allProfiles);
      // Filter only boost payments
      const allPayments: any[] = paymentRes.data ?? [];
      const boostPay = allPayments.filter((p: any) => p.purpose === 'BOOST');
      setPayments(boostPay);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const activeBoosts  = profiles.filter(p => p.boostExpiresAt && new Date(p.boostExpiresAt) > now);
  const expiredBoosts = profiles.filter(p => p.boostExpiresAt && new Date(p.boostExpiresAt) <= now);

  // Lookup boost active state for a given profileId
  const isBoostActive = (profileId: string) => {
    const p = profiles.find(pr => pr.id === profileId);
    return !!(p?.boostExpiresAt && new Date(p.boostExpiresAt) > now);
  };
  const hasBoost = (profileId: string) => {
    const p = profiles.find(pr => pr.id === profileId);
    return !!p?.boostExpiresAt;
  };

  return (
    <div className="font-poppins space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[28px] font-poppins font-medium text-[#121514] flex items-center gap-2">
            <span className="text-[#DB9D30]">⚡</span> My Boosts
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {activeBoosts.length > 0
              ? `${activeBoosts.length} active boost${activeBoosts.length > 1 ? 's' : ''} — your profile is at the top!`
              : 'No active boosts — boost your profile to appear at the top of search'}
          </p>
        </div>
        <Link href="/dashboard/profiles"
          className="inline-flex items-center gap-2 bg-[#DB9D30] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#c98b26] transition">
          <span>⚡</span> Boost a Profile
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 gap-3 text-gray-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Loading boosts…
        </div>
      ) : (
        <>
          {/* Tab switcher */}
          <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1">
            {(['active', 'history'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t ? 'bg-white text-[#8B5E00] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {t === 'active' ? `⚡ Running Ads (${activeBoosts.length})` : `📋 Payment History (${payments.length})`}
              </button>
            ))}
          </div>

          {/* ── Active Boosts tab ── */}
          {tab === 'active' && (
            <div className="space-y-4">
              {activeBoosts.length === 0 && expiredBoosts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4 text-3xl">⚡</div>
                  <p className="font-semibold text-gray-600 text-lg">No boosts yet</p>
                  <p className="text-sm text-gray-400 mt-1 mb-5">Boost your profile to appear at the top of the members list with a VIP badge</p>
                  <Link href="/dashboard/profiles"
                    className="inline-flex items-center gap-2 bg-[#DB9D30] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#c98b26] transition">
                    ⚡ Boost Now
                  </Link>
                </div>
              ) : (
                <>
                  {/* Running Ads */}
                  {activeBoosts.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-[#A07830] uppercase tracking-wide mb-3">⚡ Running Ads</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {activeBoosts.map(p => <BoostCard key={p.id} profile={p} />)}
                      </div>
                    </div>
                  )}
                  {/* Expired Ads */}
                  {expiredBoosts.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 mt-2">Expired Ads</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {expiredBoosts.map(p => <BoostCard key={p.id} profile={p} />)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Payment History tab ── */}
          {tab === 'history' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              {payments.length === 0 ? (
                <div className="p-16 text-center text-gray-400">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">💳</div>
                  <p className="font-semibold text-gray-500">No boost payments yet</p>
                  <p className="text-sm mt-1">Your boost payment history will appear here once you purchase a boost.</p>
                </div>
              ) : (
                <>
                  {/* Table header */}
                  <div className="grid grid-cols-5 gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    <span className="col-span-2">Profile</span>
                    <span>Amount</span>
                    <span>Date</span>
                    <span>Status</span>
                  </div>
                  {/* Rows */}
                  <div className="divide-y divide-gray-50">
                    {payments.map((pay: any) => (
                      <div key={pay.id} className="grid grid-cols-5 gap-3 items-center px-5 py-3.5 hover:bg-gray-50 transition">
                        {/* Profile name */}
                        <div className="col-span-2 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">
                            {pay.childProfile?.name ?? 'Profile'}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                            {pay.childProfile?.memberId ?? pay.childProfileId?.slice(0, 8)}
                          </p>
                        </div>
                        {/* Amount — use stored currency from gatewayPayload, default LKR */}
                        <div>
                          {(() => {
                            const payload = pay.gatewayPayload as any;
                            const isUsd = payload?.currency === 'USD';
                            const sym = isUsd ? '$' : 'Rs.';
                            const amtStr = isUsd
                              ? Number(pay.amount).toFixed(2)
                              : Number(pay.amount).toLocaleString();
                            return (
                              <p className="font-bold text-[#8B5E00] text-sm">{sym} {amtStr}</p>
                            );
                          })()}
                          {pay.bankRef && <p className="text-[10px] text-gray-400 font-mono mt-0.5">Ref: {pay.bankRef}</p>}
                        </div>
                        {/* Date */}
                        <div>
                          <p className="text-xs text-gray-600">
                            {new Date(pay.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(pay.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {/* Status — based on payment status, then boost state */}
                        <div className="space-y-1">
                          {(() => {
                            const s = pay.status;
                            // Pending / waiting admin approval
                            if (s === 'PENDING') return (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                                ⏳ Pending
                              </span>
                            );
                            // Rejected / failed
                            if (s === 'REJECTED' || s === 'FAILED') return (
                              <div>
                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-[10px] font-bold px-2.5 py-1 rounded-full">
                                  ✗ Rejected
                                </span>
                                {pay.rejectionReason && (
                                  <p className="text-[10px] text-red-400 mt-1 leading-tight max-w-[140px]">
                                    {pay.rejectionReason}
                                  </p>
                                )}
                              </div>
                            );
                            // Approved/Success — now check if boost is still active
                            const active = isBoostActive(pay.childProfileId);
                            if (active) return (
                              <span className="inline-flex items-center gap-1 bg-[#DB9D30] text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">
                                ⚡ Boosting
                              </span>
                            );
                            return (
                              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-[10px] font-bold px-2.5 py-1 rounded-full">
                                Expired
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
