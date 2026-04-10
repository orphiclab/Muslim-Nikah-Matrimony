'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/services/api';
import { useCurrency } from '@/hooks/useCurrency';

type Payment = {
  id: string; amount: number; currency: string; method: string;
  status: string; bankRef?: string; bankSlipUrl?: string; purpose?: string;
  adminNote?: string; approvedAt?: string; createdAt: string; rejectionReason?: string;
  user?: { email: string }; childProfile?: { id: string; name: string; memberId?: string };
};

const STATUS_OPTIONS = ['ALL', 'PENDING', 'SUCCESS', 'FAILED'];
const REJECT_REASONS = ['Payment not received', 'Other'];

/* ── Approve Modal ───────────────────────────────────────────────────────────── */
function ApproveModal({
  payment, onClose, onDone,
}: { payment: Payment; onClose: () => void; onDone: () => void }) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const { fmt } = useCurrency();

  const submit = async () => {
    setLoading(true); setErr('');
    try {
      await adminApi.approvePayment({ paymentId: payment.id, adminNote: note });
      onDone();
    } catch (e: any) {
      setErr(e.message ?? 'Approval failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Approve Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Payment details */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <Row label="Payment ID" value={<span className="font-mono text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-700 select-all">{payment.id}</span>} />
          <Row label="Customer" value={payment.user?.email ?? '—'} />
          <Row label="Profile" value={
            <div className="flex flex-col items-end gap-1">
              <span>{`${payment.childProfile?.name ?? '—'}${payment.childProfile?.memberId ? ` (${payment.childProfile.memberId})` : ''}`}</span>
              {payment.purpose === 'BOOST' && <span className="bg-[#DB9D30] text-white text-[10px] px-1.5 py-0.5 rounded font-bold">⚡ PROFILE BOOST</span>}
              {payment.purpose === 'SUBSCRIPTION' && <span className="bg-[#1C3B35] text-white text-[10px] px-1.5 py-0.5 rounded font-bold">✓ SUBSCRIPTION</span>}
            </div>
          } />
          <Row label="Amount" value={<span className="font-semibold text-gray-800">{fmt(payment.amount)}</span>} />
          <Row label="Method" value={payment.method === 'BANK_TRANSFER' ? '🏦 Bank Transfer' : '💳 Online Gateway'} />
          {payment.bankRef && <Row label="Bank Ref" value={<span className="font-mono text-[#1C3B35] font-semibold">{payment.bankRef}</span>} />}
          <Row label="Submitted" value={new Date(payment.createdAt).toLocaleString()} />
        </div>

        {/* Bank slip preview */}
        {payment.bankSlipUrl && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Bank Slip / Screenshot</p>
            <a href={payment.bankSlipUrl} target="_blank" rel="noreferrer"
               className="block rounded-xl overflow-hidden border border-gray-200 hover:border-[#1C3B35] transition">
              <img src={payment.bankSlipUrl} alt="Bank slip" className="w-full max-h-56 object-cover" />
            </a>
            <p className="text-xs text-gray-400 mt-1">Click to open full size</p>
          </div>
        )}

        {/* Admin note */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Admin Note <span className="font-normal text-gray-400">(optional)</span></label>
          <textarea
            value={note} onChange={e => setNote(e.target.value)} rows={2}
            placeholder="e.g. Bank transfer confirmed — Ref #ABC123"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 resize-none outline-none focus:border-[#1C3B35] transition"
          />
        </div>

        {err && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{err}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 bg-[#1C3B35] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#15302a] transition disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : '✓'} Approve & Activate
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Reject Modal ────────────────────────────────────────────────────────────── */
function RejectModal({
  payment, onClose, onDone,
}: { payment: Payment; onClose: () => void; onDone: () => void }) {
  const [reasonType, setReasonType] = useState('Payment not received');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const { fmt } = useCurrency();

  const finalReason = reasonType === 'Other' ? customReason.trim() : reasonType;

  const submit = async () => {
    if (!finalReason) { setErr('Please enter a reason.'); return; }
    setLoading(true); setErr('');
    try {
      await adminApi.rejectPayment({ paymentId: payment.id, reason: finalReason });
      onDone();
    } catch (e: any) {
      setErr(e.message ?? 'Rejection failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800">Reject Payment</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Payment summary */}
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-1.5 text-sm">
          <Row label="Customer" value={payment.user?.email ?? '—'} />
          <Row label="Profile" value={`${payment.childProfile?.name ?? '—'}${payment.childProfile?.memberId ? ` (${payment.childProfile.memberId})` : ''}`} />
          <Row label="Amount" value={<span className="font-semibold text-red-700">{fmt(payment.amount)}</span>} />
          {payment.bankRef && <Row label="Bank Ref" value={<span className="font-mono">{payment.bankRef}</span>} />}
        </div>

        <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          ⚠ The profile will be reset to <strong>DRAFT</strong> status and the user will see the rejection reason on their dashboard.
        </p>

        {/* Reason dropdown */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Rejection Reason <span className="text-red-400">*</span></label>
          <select
            value={reasonType}
            onChange={e => setReasonType(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 outline-none focus:border-red-400 transition bg-gray-50"
          >
            {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Custom reason input when "Other" is selected */}
        {reasonType === 'Other' && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Custom Reason <span className="text-red-400">*</span></label>
            <textarea
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              rows={3}
              placeholder="Describe the reason for rejection..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 resize-none outline-none focus:border-red-400 transition"
            />
          </div>
        )}

        {err && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{err}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={submit} disabled={loading || (reasonType === 'Other' && !customReason.trim())}
            className="flex-1 bg-red-500 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-red-600 transition disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : '✗'} Reject Payment
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-400 flex-shrink-0">{label}</span>
      <span className="text-gray-700 text-right">{value}</span>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function AdminPaymentsPage() {
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'SUBSCRIPTION' | 'BOOST'>('SUBSCRIPTION');
  const [filter, setFilter] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Payment | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const PER_PAGE = 10;
  const { fmt } = useCurrency();
  const router = useRouter();

  // ── Sorting ──────────────────────────────────────────────────────
  type SortKey = 'customer' | 'amount' | 'method' | 'status' | 'date';
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const load = () => {
    setLoading(true);
    adminApi.payments(undefined)
      .then((r) => setAllPayments(r.data ?? []))
      .catch(() => setAllPayments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [filter, typeFilter]);

  // Split by type
  const subPayments  = allPayments.filter(p => p.purpose !== 'BOOST');
  const boostPayments = allPayments.filter(p => p.purpose === 'BOOST');
  const typePool = typeFilter === 'BOOST' ? boostPayments : subPayments;

  // Status filter within the active type
  const payments = filter === 'ALL' ? typePool : typePool.filter(p => p.status === filter);

  const handleDone = () => {
    setSelected(null);
    setToast({ text: '✅ Payment approved — profile is now active!', ok: true });
    setTimeout(() => setToast(null), 6000);
    load();
  };

  const handleRejectDone = () => {
    setRejectTarget(null);
    setToast({ text: '✗ Payment rejected — profile reset to DRAFT. User will see the reason.', ok: false });
    setTimeout(() => setToast(null), 6000);
    load();
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-700',
      SUCCESS: 'bg-green-100 text-green-700',
      FAILED: 'bg-red-100 text-red-700',
    };
    return map[s] ?? 'bg-gray-100 text-gray-600';
  };

  // Counts scoped to the active type pool
  const pendingCount = typePool.filter(p => p.status === 'PENDING').length;
  const successCount = typePool.filter(p => p.status === 'SUCCESS').length;
  const failedCount  = typePool.filter(p => p.status === 'FAILED').length;

  // Overall pending counts for header badges
  const totalSubPending   = subPayments.filter(p => p.status === 'PENDING').length;
  const totalBoostPending = boostPayments.filter(p => p.status === 'PENDING').length;

  const totalPages = Math.ceil(payments.length / PER_PAGE);

  // Apply sort
  const sorted = [...payments].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'customer') cmp = (a.user?.email ?? '').localeCompare(b.user?.email ?? '');
    else if (sortKey === 'amount') cmp = a.amount - b.amount;
    else if (sortKey === 'method') cmp = a.method.localeCompare(b.method);
    else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
    else if (sortKey === 'date') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const pageData = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Sort header helper
  const SortTh = ({ colKey, label, className = '' }: { colKey: SortKey; label: string; className?: string }) => (
    <th
      onClick={() => handleSort(colKey)}
      className={`px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide cursor-pointer select-none group whitespace-nowrap ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <span className={sortKey === colKey ? 'text-[#1C3B35]' : 'group-hover:text-gray-700 transition'}>{label}</span>
        <span className="flex flex-col gap-[1px] shrink-0">
          <svg className={`w-2.5 h-2.5 transition ${sortKey === colKey && sortDir === 'asc' ? 'text-[#1C3B35]' : 'text-gray-300 group-hover:text-gray-400'}`} fill="currentColor" viewBox="0 0 10 6"><path d="M5 0L10 6H0z" /></svg>
          <svg className={`w-2.5 h-2.5 transition ${sortKey === colKey && sortDir === 'desc' ? 'text-[#1C3B35]' : 'text-gray-300 group-hover:text-gray-400'}`} fill="currentColor" viewBox="0 0 10 6"><path d="M5 6L0 0H10z" /></svg>
        </span>
      </div>
    </th>
  );

  return (
    <>
      {selected && (
        <ApproveModal payment={selected} onClose={() => setSelected(null)} onDone={handleDone} />
      )}
      {rejectTarget && (
        <RejectModal payment={rejectTarget} onClose={() => setRejectTarget(null)} onDone={handleRejectDone} />
      )}

      <div className="font-poppins space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[34px] xl:text-[37px] 2xl:text-[40px] font-poppins font-medium text-[#121514]">Payment Management</h1>
            <p className="text-[#121514AD]/68 title-sub-top mt-0.5">Review and approve subscription &amp; boost payments</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#1C3B35]/10 text-[#1C3B35] flex items-center gap-1.5">
              💳 {totalSubPending} Subscription pending
            </span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#DB9D30]/15 text-[#8B5E00] flex items-center gap-1.5">
              ⚡ {totalBoostPending} Boost pending
            </span>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`p-4 rounded-xl text-sm font-medium border ${toast.ok ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
            {toast.text}
          </div>
        )}

        {/* Pending alert banner */}
        {filter !== 'PENDING' && pendingCount > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-xl">{typeFilter === 'BOOST' ? '⚡' : '⏳'}</span>
            <p className="text-sm text-amber-800 font-medium">
              {pendingCount} {typeFilter === 'BOOST' ? 'boost' : 'subscription'} payment{pendingCount > 1 ? 's' : ''} awaiting approval.
            </p>
            <button onClick={() => setFilter('PENDING')}
              className="ml-auto text-xs font-semibold text-amber-700 underline hover:no-underline">
              View now
            </button>
          </div>
        )}

        {/* Table card */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

          {/* ── Type switcher ── */}
          <div className="px-4 pt-4 pb-0 flex gap-2">
            {([{ key: 'SUBSCRIPTION', label: 'Subscriptions', icon: '💳', color: 'bg-[#1C3B35] text-white', inactive: 'bg-[#1C3B35]/8 text-[#1C3B35]' },
               { key: 'BOOST',        label: 'Boosts',        icon: '⚡',      color: 'bg-[#DB9D30] text-white', inactive: 'bg-[#DB9D30]/10 text-[#8B5E00]' },
            ] as const).map(t => (
              <button key={t.key}
                onClick={() => { setTypeFilter(t.key); setFilter('PENDING'); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  typeFilter === t.key ? t.color : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>
                <span>{t.icon}</span>
                {t.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  typeFilter === t.key ? 'bg-white/25 text-white' : 'bg-white text-gray-500'
                }`}>
                  {t.key === 'SUBSCRIPTION' ? subPayments.length : boostPayments.length}
                </span>
              </button>
            ))}
          </div>

          {/* ── Status tabs ── */}
          <div className="flex border-b border-gray-100 px-4 pt-3 gap-1">
            {STATUS_OPTIONS.map((s) => {
              const countMap: Record<string, number> = {
                PENDING: pendingCount,
                SUCCESS: successCount,
                FAILED: failedCount,
              };
              const count = countMap[s];
              const badgeColor = filter === s
                ? 'bg-white/20 text-white'
                : s === 'PENDING' ? 'bg-amber-100 text-amber-700'
                : s === 'SUCCESS' ? 'bg-green-100 text-green-700'
                : s === 'FAILED'  ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-500';
              return (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition-all ${filter === s
                    ? (typeFilter === 'BOOST' ? 'bg-[#DB9D30] text-white' : 'bg-[#1C3B35] text-white')
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                  {s !== 'ALL' && (
                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${badgeColor}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48 gap-3 text-gray-400 text-sm">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Loading payments...
              </div>
            ) : pageData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <span className="text-4xl mb-3">💳</span>
                <p className="text-sm">No {filter !== 'ALL' ? filter.toLowerCase() : ''} payments found</p>
                {filter === 'PENDING' && (
                  <p className="text-xs mt-1 text-gray-300">All payments have been processed!</p>
                )}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <SortTh colKey="customer" label="Registered Email" />
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide whitespace-nowrap">Profile</th>
                    <SortTh colKey="amount" label="Amount" />
                    <SortTh colKey="method" label="Method" />
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide whitespace-nowrap">Bank Ref</th>
                    <SortTh colKey="status" label="Status" />
                    <SortTh colKey="date" label="Date" />
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageData.map((p, i) => (
                    <tr key={p.id} className={`hover:bg-gray-50 transition ${i % 2 === 1 ? 'bg-[#FAFAFA]' : ''} ${p.status === 'PENDING' ? 'border-l-4 border-l-amber-400' : ''}`}>
                      <td className="px-5 py-3.5 text-gray-700 text-xs">{p.user?.email ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-800">{p.childProfile?.name ?? '—'}</p>
                        {p.childProfile?.memberId && (
                          <p className="text-xs text-gray-400">{p.childProfile.memberId}</p>
                        )}
                        {p.purpose === 'BOOST' && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold bg-[#DB9D30] text-white px-1.5 py-0.5 rounded shadow-sm">⚡ BOOST</span>
                        )}
                        {p.childProfile?.id && (
                          <button
                            onClick={() => router.push(`/admin/profiles/${p.childProfile!.id}`)}
                            className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded-lg transition shadow-sm"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                            </svg>
                            View Profile
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-800 whitespace-nowrap">
                        {fmt(p.amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.method === 'BANK_TRANSFER' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                          {p.method === 'BANK_TRANSFER' ? '🏦 Bank' : '💳 Online'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-600">
                        {p.bankRef ?? p.childProfile?.memberId ?? '—'}
                        {p.bankSlipUrl && (
                          <a href={p.bankSlipUrl} target="_blank" rel="noreferrer"
                             className="ml-1 text-blue-500 hover:underline text-[10px]">📎 slip</a>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusBadge(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString()}<br />
                        <span className="text-[10px]">{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {p.status === 'PENDING' && (
                          <div className="flex flex-col gap-1.5">
                            <button onClick={() => setSelected(p)}
                              className="text-xs bg-[#1C3B35] text-white px-3 py-1.5 rounded-lg hover:bg-[#15302a] transition font-semibold flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Approve
                            </button>
                            <button onClick={() => setRejectTarget(p)}
                              className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition font-semibold flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </button>
                          </div>
                        )}
                        {p.status === 'SUCCESS' && (
                          <div>
                            <span className="text-xs text-green-600 font-medium">✓ Approved</span>
                            {p.approvedAt && (
                              <p className="text-[10px] text-gray-400 mt-0.5">{new Date(p.approvedAt).toLocaleDateString()}</p>
                            )}
                          </div>
                        )}
                        {p.status === 'FAILED' && (
                          <div className="space-y-1">
                            <span className="text-xs text-red-500 font-semibold">✗ Rejected</span>
                            {p.rejectionReason && (
                              <p className="text-[10px] text-red-400 max-w-[140px] leading-tight">{p.rejectionReason}</p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          {!loading && payments.length > 0 && (
            <div className="px-5 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-gray-400">
                Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, sorted.length)} of {sorted.length} entries
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
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
    </>
  );
}
