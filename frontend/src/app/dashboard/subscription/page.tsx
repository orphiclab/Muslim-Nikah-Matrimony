'use client';

import { useEffect, useState, useCallback } from 'react';
import { subscriptionApi, paymentApi, packagesApi } from '@/services/api';
import { useCurrency } from '@/hooks/useCurrency';

type Profile = {
  id: string; name: string; memberId?: string;
  subscription?: { status: string; endDate?: string; planName?: string } | null;
};
type Payment = {
  id: string; amount: number; currency: string; method: string;
  status: string; bankRef?: string; childProfileId: string; createdAt: string;
  purpose?: string; rejectionReason?: string;
};

/* ── Countdown hook ────────────────────────────────────────────── */
function useCountdown(endDate: string | null | undefined) {
  const [remaining, setRemaining] = useState('');
  const [pct, setPct] = useState(100);

  useEffect(() => {
    if (!endDate) { setRemaining(''); return; }
    const end = new Date(endDate).getTime();

    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) { setRemaining('Expired'); setPct(0); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
      const total = 30 * 86400000;
      setPct(Math.min(100, Math.max(0, (diff / total) * 100)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return { remaining, pct };
}

/* ── Subscription Card ─────────────────────────────────────────── */
function SubscriptionCard({
  profile, activePlan, onBankTransfer, onPending, pending,
}: {
  profile: Profile;
  activePlan: any;
  pending?: Payment;
  onBankTransfer: () => void;
  onPending: () => void;
}) {
  const isActive  = profile.subscription?.status === 'ACTIVE';
  const isExpired = profile.subscription?.status === 'EXPIRED';
  const { remaining, pct } = useCountdown(isActive ? profile.subscription?.endDate : null);
  const expiryDate = profile.subscription?.endDate
    ? new Date(profile.subscription.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all ${
      isActive  ? 'border-[#1B6B4A]/30' :
      pending   ? 'border-amber-200' :
      isExpired ? 'border-red-100' : 'border-gray-100'
    }`}>
      {/* Top progress bar for active */}
      {isActive && (
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-gradient-to-r from-[#1B6B4A] to-[#4ade80] transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="px-5 pt-4 pb-5 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${
              isActive ? 'bg-[#1B6B4A] text-white' :
              pending  ? 'bg-amber-400 text-white' :
              isExpired? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500'
            }`}>
              {profile.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">{profile.name}</p>
              {profile.memberId && <p className="text-[10px] text-gray-400 font-mono">{profile.memberId}</p>}
            </div>
          </div>

          {/* Status badge */}
          {isActive && (
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
              ✓ Active
            </span>
          )}
          {isExpired && !pending && (
            <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-[10px] font-bold px-2.5 py-1 rounded-full">
              Expired
            </span>
          )}
          {pending && (
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">
              ⏳ Pending Approval
            </span>
          )}
          {!isActive && !isExpired && !pending && (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-[10px] font-bold px-2.5 py-1 rounded-full">
              No Subscription
            </span>
          )}
        </div>

        {/* Active — countdown box */}
        {isActive && remaining && (
          <div className="bg-gradient-to-r from-[#EDFAF3] to-[#F0FDF6] border border-[#1B6B4A]/15 rounded-xl px-4 py-3">
            <p className="text-[10px] text-[#1B6B4A] font-semibold uppercase tracking-wide mb-1">Time Remaining</p>
            <p className="text-xl font-extrabold text-[#1B6B4A] font-mono">{remaining}</p>
            <div className="mt-2 h-1.5 bg-[#1B6B4A]/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#1B6B4A] rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
              <svg className="w-3 h-3 text-[#1B6B4A]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Expires: <strong className="text-gray-600">{expiryDate}</strong>
            </p>
          </div>
        )}

        {/* Pending info box */}
        {pending && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">⏳</span>
              <div>
                <p className="text-xs font-bold text-amber-800">Awaiting Admin Approval</p>
                <p className="text-[11px] text-amber-600 mt-0.5 leading-relaxed">
                  Your payment has been received. An admin will review and activate your profile shortly.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-amber-100 px-3 py-2.5 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount</span>
                <span className="font-bold text-gray-700">Rs. {Number(pending.amount).toLocaleString()}</span>
              </div>
              {pending.bankRef && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Bank Ref</span>
                  <span className="font-mono font-semibold text-[#1B6B4A]">{pending.bankRef}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Submitted</span>
                <span className="text-gray-600">{new Date(pending.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Expired note */}
        {isExpired && !pending && expiryDate && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
            <p className="text-[11px] text-red-400">Subscription expired on <strong className="text-red-600">{expiryDate}</strong></p>
          </div>
        )}

        {/* Action buttons */}
        {!isActive && !pending && (
          <button
            onClick={onBankTransfer}
            className="w-full bg-[#1B6B4A] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#155a3d] transition flex items-center justify-center gap-2">
            🏦 {isExpired ? 'Renew via Bank Transfer' : 'Pay via Bank Transfer'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Bank Transfer Form ────────────────────────────────────────── */
function BankTransferForm({
  profile, activePlan, fmt, siteSettings,
  onCancel, onSubmit, submitting,
}: {
  profile: Profile; activePlan: any; fmt: (n: number) => string;
  siteSettings: any; onCancel: () => void;
  onSubmit: (ref: string) => void; submitting: boolean;
}) {
  const [ref, setRef] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-lg">🏦 Bank Transfer</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>

        <div className="bg-[#EDFAF3] border border-[#1B6B4A]/20 rounded-xl p-4 space-y-1.5 text-sm">
          <p className="text-[11px] text-[#1B6B4A] font-bold uppercase tracking-wide mb-2">Transfer Details</p>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount</span>
            <span className="font-bold text-gray-800">{fmt(activePlan ? activePlan.price : 29.99)}</span>
          </div>
          {siteSettings?.bankName && (
            <div className="flex justify-between">
              <span className="text-gray-500">Bank</span>
              <span className="font-medium text-gray-700">{siteSettings.bankName}</span>
            </div>
          )}
          {siteSettings?.bankAccountNumber && (
            <div className="flex justify-between">
              <span className="text-gray-500">Account No.</span>
              <span className="font-mono font-semibold text-gray-700">{siteSettings.bankAccountNumber}</span>
            </div>
          )}
          {siteSettings?.bankAccountName && (
            <div className="flex justify-between">
              <span className="text-gray-500">Account Name</span>
              <span className="font-medium text-gray-700">{siteSettings.bankAccountName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Reference</span>
            <span className="font-mono font-bold text-[#1B6B4A]">{profile.memberId ?? profile.id.slice(0, 8)}</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Transaction / Receipt Reference *</label>
          <input
            type="text"
            placeholder="Enter your bank transaction reference"
            value={ref}
            onChange={e => setRef(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/10 transition"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            disabled={!ref.trim() || submitting}
            onClick={() => onSubmit(ref)}
            className="flex-1 bg-[#1B6B4A] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#155a3d] transition disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : '📤'} Submit Payment
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Payment History Row ───────────────────────────────────────── */
function PaymentRow({ p, profiles }: { p: Payment; profiles: Profile[] }) {
  const profile = profiles.find(pr => pr.id === p.childProfileId);
  const isBoost = p.purpose === 'BOOST';
  const statusMap: Record<string, string> = {
    SUCCESS: 'bg-green-100 text-green-700',
    PENDING: 'bg-amber-100 text-amber-700',
    FAILED:  'bg-red-100 text-red-600',
  };
  const payload = (p as any).gatewayPayload as any;
  const isUsd = payload?.currency === 'USD';
  const amtStr = isUsd ? `$${Number(p.amount).toFixed(2)}` : `Rs. ${Number(p.amount).toLocaleString()}`;

  return (
    <div className="flex items-start gap-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/80 px-1 rounded-xl transition">
      {/* Icon */}
      <div className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-sm ${isBoost ? 'bg-[#FFF8E7] text-[#DB9D30]' : 'bg-[#EDFAF3] text-[#1B6B4A]'}`}>
        {isBoost ? '⚡' : '🏦'}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-gray-800 text-sm">{amtStr}</p>
          {isBoost && (
            <span className="text-[9px] font-bold bg-[#DB9D30] text-white px-1.5 py-0.5 rounded shadow-sm">⚡ BOOST</span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusMap[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {p.status === 'SUCCESS' ? '✓ Success' : p.status === 'PENDING' ? '⏳ Pending' : '✗ Failed'}
          </span>
        </div>
        {profile && <p className="text-[11px] text-gray-400 mt-0.5">{profile.name} · <span className="font-mono">{profile.memberId}</span></p>}
        {p.bankRef && <p className="text-[11px] text-gray-400 font-mono mt-0.5">Ref: {p.bankRef}</p>}
        {p.rejectionReason && <p className="text-[11px] text-red-400 mt-0.5">{p.rejectionReason}</p>}
      </div>

      {/* Date */}
      <div className="text-right shrink-0">
        <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        <p className="text-[10px] text-gray-300 mt-0.5">{new Date(p.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────── */
export default function SubscriptionPage() {
  const [profiles,     setProfiles]     = useState<Profile[]>([]);
  const [payments,     setPayments]     = useState<Payment[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [message,      setMessage]      = useState<{ text: string; ok: boolean } | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [activePlan,   setActivePlan]   = useState<any>(null);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [bankTarget,   setBankTarget]   = useState<Profile | null>(null);
  const { fmt } = useCurrency();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, pkg] = await Promise.all([
        subscriptionApi.mySubscriptions(),
        paymentApi.myPayments(),
        packagesApi.getActive('SUBSCRIPTION'),
      ]);
      setProfiles(s.data ?? []);
      setPayments(p.data ?? []);
      if (pkg.data?.length > 0) setActivePlan(pkg.data[0]);

      // Fetch site settings for bank details
      const settingsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api'}/site-settings`);
      if (settingsRes.ok) { const d = await settingsRes.json(); setSiteSettings(d.data ?? d); }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getPendingPayment = (profileId: string) =>
    payments.find(p => p.childProfileId === profileId && p.status === 'PENDING' && p.purpose !== 'BOOST');

  const submitBankTransfer = async (profile: Profile, ref: string) => {
    setSubmitting(true);
    try {
      const res = await paymentApi.initiate({
        childProfileId: profile.id,
        amount: activePlan ? activePlan.price : 29.99,
        method: 'BANK_TRANSFER',
        bankRef: ref,
      });
      setBankTarget(null);
      setMessage({ text: `✅ Payment submitted! ID: ${res.data.id} — Admin will review shortly.`, ok: true });
      setTimeout(() => setMessage(null), 10000);
      load();
    } catch (e: any) {
      setMessage({ text: e.message ?? 'Something went wrong', ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  const historyPayments = payments.filter(p => p.purpose !== 'BOOST');

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400 font-poppins">
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      Loading subscriptions…
    </div>
  );

  const activeCount = profiles.filter(p => p.subscription?.status === 'ACTIVE').length;

  return (
    <div className="font-poppins space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-[22px] sm:text-[28px] font-poppins font-medium text-[#121514]">Subscriptions</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {activeCount > 0 ? `${activeCount} active subscription${activeCount > 1 ? 's' : ''}` : 'Manage subscriptions for each profile'}
        </p>
      </div>

      {/* Toast */}
      {message && (
        <div className={`p-4 rounded-2xl text-sm font-medium border ${message.ok ? 'bg-green-50 text-green-800 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          {message.text}
        </div>
      )}

      {/* Active Plan Banner */}
      {(() => {
        // Find the subscription info from the user's actual active profile
        const activeProfile = profiles.find(p => p.subscription?.status === 'ACTIVE');
        const subPlanName = activeProfile?.subscription?.planName
          ?? activePlan?.name
          ?? 'Standard Plan';
        const subDuration = activePlan?.durationDays ?? 30;
        return (
          <div className="bg-gradient-to-br from-[#1B6B4A] to-[#2d9966] rounded-2xl p-4 sm:p-6 text-white flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">Current Plan</p>
              <p className="font-bold text-xl sm:text-2xl break-words">{subPlanName}</p>
              <p className="text-white/70 text-sm mt-1 leading-relaxed">
                {subDuration}-day access · Full visibility · Unlimited messaging
              </p>
            </div>
            <div className="shrink-0 self-start text-left sm:self-auto sm:text-right">
              <p className="text-2xl sm:text-3xl font-extrabold">{fmt(activePlan ? activePlan.price : 29.99)}</p>
              <p className="text-white/60 text-xs mt-1">per profile / {subDuration} days</p>
            </div>
          </div>
        );
      })()}

      {/* Profile Subscription Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Profile Subscriptions</h2>
        {profiles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
            <p className="font-semibold text-gray-500">No profiles found</p>
            <p className="text-sm mt-1">Create a profile first to manage subscriptions.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {profiles.map(profile => (
              <SubscriptionCard
                key={profile.id}
                profile={profile}
                activePlan={activePlan}
                pending={getPendingPayment(profile.id)}
                onBankTransfer={() => setBankTarget(profile)}
                onPending={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-800">Payment History</h2>
          <p className="text-xs text-gray-400 mt-0.5">All subscription and boost payments</p>
        </div>
        <div className="px-5 py-2">
          {payments.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl">💳</div>
              <p className="font-semibold text-gray-500">No payments yet</p>
            </div>
          ) : (
            historyPayments.map(p => <PaymentRow key={p.id} p={p} profiles={profiles} />)
          )}
        </div>
      </div>

      {/* Bank Transfer Modal */}
      {bankTarget && (
        <BankTransferForm
          profile={bankTarget}
          activePlan={activePlan}
          fmt={fmt}
          siteSettings={siteSettings}
          onCancel={() => setBankTarget(null)}
          onSubmit={ref => submitBankTransfer(bankTarget, ref)}
          submitting={submitting}
        />
      )}
    </div>
  );
}
