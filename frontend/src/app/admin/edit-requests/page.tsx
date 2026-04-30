'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/services/api';

type EditRequest = {
  id: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  adminNote?: string;
  previousData: Record<string, any>;
  newData: Record<string, any>;
  profile: {
    id: string;
    memberId: string;
    name: string;
    gender: string;
    status: string;
    user: { id: string; email: string; phone?: string };
  };
};

const STATUS_COLOR: Record<string, string> = {
  PENDING:  'bg-amber-100 text-amber-700 border-amber-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  CANCELLED:'bg-gray-100 text-gray-500 border-gray-200',
};

// Fields to display in the diff table
const DIFF_FIELDS = [
  ['name','Name'], ['dateOfBirth','Date of Birth'], ['height','Height (cm)'], ['weight','Weight (kg)'],
  ['complexion','Complexion'], ['appearance','Appearance'], ['dressCode','Dress Code'],
  ['ethnicity','Ethnicity'], ['civilStatus','Civil Status'],
  ['familyStatus','Family Status'], ['country','Country'], ['city','City'], ['state','State'],
  ['residencyStatus','Residency Status'], ['education','Education'], ['fieldOfStudy','Field of Study'],
  ['occupation','Occupation'], ['profession','Profession'],
  ['fatherEthnicity',"Father's Ethnicity"], ['fatherCountry',"Father's Country"],
  ['fatherOccupation',"Father's Occupation"], ['motherEthnicity',"Mother's Ethnicity"],
  ['motherCountry',"Mother's Country"], ['motherOccupation',"Mother's Occupation"],
  ['siblings','Siblings'], ['countryPreference','Country Preference'],
  ['aboutUs','About Me'], ['expectations','Expectations'],
];

function fmt(v: any): string {
  if (v == null || v === '') return '—';
  if (v instanceof Date || (typeof v === 'string' && v.includes('T'))) {
    try { return new Date(v).toLocaleDateString('en-GB'); } catch { return String(v); }
  }
  return String(v);
}

function DiffTable({ prev, next }: { prev: Record<string, any>; next: Record<string, any> }) {
  const changed = DIFF_FIELDS.filter(([key]) => fmt(prev[key]) !== fmt(next[key]));
  const unchanged = DIFF_FIELDS.filter(([key]) => fmt(prev[key]) === fmt(next[key]) && (prev[key] || next[key]));

  if (changed.length === 0) return (
    <p className="text-xs text-gray-400 italic py-2">No detectable field changes.</p>
  );

  return (
    <div className="space-y-4">
      {/* Changed fields */}
      <div>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Changed Fields ({changed.length})</p>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide w-32">Field</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-red-400 uppercase tracking-wide">Previous</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-green-600 uppercase tracking-wide">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {changed.map(([key, label]) => (
                <tr key={key} className="hover:bg-amber-50/40 transition">
                  <td className="px-4 py-2.5 font-medium text-gray-600 text-xs">{label}</td>
                  <td className="px-4 py-2.5 text-red-600 line-through text-xs">{fmt(prev[key])}</td>
                  <td className="px-4 py-2.5 text-green-700 font-semibold text-xs">{fmt(next[key])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unchanged — collapsed */}
      {unchanged.length > 0 && (
        <details className="text-xs text-gray-400">
          <summary className="cursor-pointer hover:text-gray-600 transition font-medium">
            {unchanged.length} unchanged field{unchanged.length !== 1 ? 's' : ''} (click to expand)
          </summary>
          <div className="mt-2 rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-gray-50">
                {unchanged.map(([key, label]) => (
                  <tr key={key}>
                    <td className="px-4 py-2 text-gray-500 font-medium w-32">{label}</td>
                    <td className="px-4 py-2 text-gray-400">{fmt(prev[key])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

export default function EditRequestsPage() {
  const [requests, setRequests] = useState<EditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selected, setSelected] = useState<EditRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = async (status: string) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await adminApi.getEditRequests(status || undefined);
      setRequests(res.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(statusFilter); }, [statusFilter]);

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    setMessage('');
    try {
      await adminApi.approveEditRequest(selected.id, adminNote || undefined);
      setMessage('✅ Edit request approved. Profile updated and user notified.');
      setSelected(null);
      setAdminNote('');
      load(statusFilter);
    } catch (e: any) {
      setMessage(`❌ ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    if (!adminNote.trim()) { setMessage('❌ Please provide a reason for rejection.'); return; }
    setActionLoading(true);
    setMessage('');
    try {
      await adminApi.rejectEditRequest(selected.id, adminNote);
      setMessage('✅ Edit request rejected. User notified.');
      setSelected(null);
      setAdminNote('');
      load(statusFilter);
    } catch (e: any) {
      setMessage(`❌ ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="font-poppins space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1C3B35] flex items-center gap-2">
            <span className="text-2xl">📝</span> Profile Edit Requests
            {statusFilter === 'PENDING' && pendingCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and approve profile changes submitted by users</p>
        </div>

        {/* Status filter tabs */}
        <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
          {['PENDING', 'APPROVED', 'REJECTED', ''].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setSelected(null); }}
              className={`px-4 py-2 text-sm font-semibold transition-all ${
                statusFilter === s
                  ? 'bg-[#1C3B35] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Global message */}
      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium border ${
          message.startsWith('✅') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className={`grid gap-6 ${selected ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>

        {/* Left: Request list */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400 gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading…
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm">No {statusFilter.toLowerCase() || ''} edit requests found.</p>
            </div>
          ) : (
            requests.map(req => (
              <div
                key={req.id}
                onClick={() => { setSelected(req); setAdminNote(''); setMessage(''); }}
                className={`cursor-pointer rounded-2xl border p-4 transition-all hover:shadow-md ${
                  selected?.id === req.id
                    ? 'border-[#1C3B35] bg-[#EAF2EE]/60 shadow-md'
                    : 'border-gray-200 bg-white hover:border-[#1C3B35]/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                      req.profile.gender === 'MALE' ? 'bg-blue-500' : 'bg-pink-500'
                    }`}>
                      {req.profile.gender === 'MALE' ? '♂' : '♀'}
                    </div>
                    <div className="min-w-0">
                      {req.profile.name && req.profile.name.trim().length > 1 && (
                        <p className="font-bold text-gray-800 text-sm truncate">{req.profile.name}</p>
                      )}
                      <p className="text-xs text-gray-400">{req.profile.memberId} · {req.profile.user.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border flex-shrink-0 ${STATUS_COLOR[req.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {req.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span>Submitted: {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  {req.reviewedAt && (
                    <span>Reviewed: {new Date(req.reviewedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                  )}
                </div>

                {req.adminNote && (
                  <p className="mt-2 text-xs text-gray-500 italic bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100">
                    Note: {req.adminNote}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right: Detail panel */}
        {selected && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Panel header */}
            <div className="bg-gradient-to-r from-[#1C3B35] to-[#2d6352] px-5 py-4 flex items-center justify-between">
              <div>
                {selected.profile.name && selected.profile.name.trim().length > 1 && (
                  <h2 className="font-bold text-white text-sm">{selected.profile.name}</h2>
                )}
                <p className="text-xs text-white/60 mt-0.5">{selected.profile.memberId} · {selected.profile.user.email}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-white/60 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Diff table */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Changes Requested</p>
                <DiffTable prev={selected.previousData} next={selected.newData} />
              </div>

              {/* Action area — only for PENDING */}
              {selected.status === 'PENDING' && (
                <div className="border-t border-gray-100 pt-5 space-y-3">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Admin Note <span className="font-normal text-gray-400 normal-case">(required for rejection, optional for approval)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Add a note for the user…"
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 outline-none focus:border-[#1C3B35] focus:ring-2 focus:ring-[#1C3B35]/15 transition resize-none"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="flex-1 rounded-xl border-2 border-red-200 text-red-600 font-semibold text-sm py-2.5 hover:bg-red-50 transition disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing…' : '✕ Reject'}
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="flex-1 rounded-xl bg-[#1C3B35] text-white font-semibold text-sm py-2.5 hover:bg-[#15302a] transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {actionLoading ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      ) : '✓'} {actionLoading ? 'Processing…' : 'Approve & Apply'}
                    </button>
                  </div>
                </div>
              )}

              {/* Already reviewed */}
              {selected.status !== 'PENDING' && (
                <div className={`rounded-xl px-4 py-3 text-sm border ${STATUS_COLOR[selected.status]}`}>
                  <p className="font-semibold">
                    {selected.status === 'APPROVED' ? '✓ Approved' : '✕ Rejected'}
                    {selected.reviewedAt && (
                      <span className="font-normal ml-2 opacity-70">
                        on {new Date(selected.reviewedAt).toLocaleDateString('en-GB')}
                      </span>
                    )}
                  </p>
                  {selected.adminNote && <p className="mt-1 opacity-80">Note: {selected.adminNote}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
