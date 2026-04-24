'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL;
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('mn_token') : null; }

interface UserRow {
  id: string;
  email: string;
  phone: string | null;
  memberId: string;
  name: string;
  gender: string;
  country: string;
  packageStatus: 'ACTIVE' | 'EXPIRED' | 'NOT_PURCHASED';
  subscriptionEndDate: string | null;
  registeredAt: string;
  lastActive: string;
}

const PKG_BADGE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  EXPIRED: 'bg-amber-100 text-amber-700',
  NOT_PURCHASED: 'bg-gray-100 text-gray-500',
};

const COUNTRIES = ['Sri Lanka', 'Australia', 'United Kingdom', 'Canada', 'UAE', 'Germany', 'France', 'Qatar', 'Saudi Arabia'];

export default function UserTargetingPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  // Filters
  const [pkgFilter, setPkgFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [lastActiveDays, setLastActiveDays] = useState('');

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [indivSmsUser, setIndivSmsUser] = useState<UserRow | null>(null);
  const [indivMsg, setIndivMsg] = useState('');
  const [sendingIndiv, setSendingIndiv] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (pkgFilter && pkgFilter !== 'ALL') params.set('packageStatus', pkgFilter);
    if (genderFilter) params.set('gender', genderFilter);
    if (countryFilter) params.set('country', countryFilter);
    if (lastActiveDays) params.set('lastActiveDays', lastActiveDays);
    try {
      const r = await fetch(`${API}/admin/sms-campaign/users?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const d = await r.json();
      if (d.success) { setUsers(d.data); setTotal(d.total); }
    } catch { } finally { setLoading(false); }
  }, [page, pkgFilter, genderFilter, countryFilter, lastActiveDays]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const selectAll = () => setSelected(new Set(users.map((u) => u.id)));
  const clearSelection = () => setSelected(new Set());

  const goSendCampaign = () => {
    if (selected.size === 0) return;
    sessionStorage.setItem('sms_selected_users', JSON.stringify([...selected]));
    sessionStorage.setItem('sms_selected_count', String(selected.size));
    router.push('/admin/sms-campaign/send?from=targeting');
  };

  const sendIndividual = async () => {
    if (!indivSmsUser || !indivMsg.trim()) return;
    setSendingIndiv(true);
    try {
      const r = await fetch(`${API}/admin/sms-campaign/send-individual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ userId: indivSmsUser.id, message: indivMsg }),
      });
      const d = await r.json();
      showToast(d.success ? 'success' : 'error', d.message || (d.success ? 'SMS sent!' : 'Failed to send'));
      if (d.success) { setIndivSmsUser(null); setIndivMsg(''); }
    } catch { showToast('error', 'Network error'); } finally { setSendingIndiv(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#121514]">User Targeting</h1>
          <p className="text-gray-400 text-sm mt-1">Filter and select recipients for your SMS campaign</p>
        </div>
        {selected.size > 0 && (
          <button
            onClick={goSendCampaign}
            className="flex items-center gap-2 bg-[#1C3B35] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#152d28] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            Send to {selected.size} selected
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5 mb-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Package Status</label>
            <select value={pkgFilter} onChange={(e) => { setPkgFilter(e.target.value); setPage(1); }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20">
              <option value="ALL">All Users</option>
              <option value="ACTIVE">Active Package</option>
              <option value="EXPIRED">Expired Package</option>
              <option value="NOT_PURCHASED">Not Purchased</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Gender</label>
            <select value={genderFilter} onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20">
              <option value="">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Country</label>
            <select value={countryFilter} onChange={(e) => { setCountryFilter(e.target.value); setPage(1); }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20">
              <option value="">All Countries</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Last Active</label>
            <select value={lastActiveDays} onChange={(e) => { setLastActiveDays(e.target.value); setPage(1); }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20">
              <option value="">Any Time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selection bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-sm text-gray-500">{total} users found</span>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={selectAll} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1.5 bg-indigo-50 rounded-lg transition-colors">
            Select All ({users.length})
          </button>
          {selected.size > 0 && (
            <button onClick={clearSelection} className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 bg-gray-100 rounded-lg transition-colors">
              Clear ({selected.size})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" className="rounded" checked={selected.size === users.length && users.length > 0}
                    onChange={(e) => e.target.checked ? selectAll() : clearSelection()} />
                </th>
                {['Member ID', 'Name', 'Phone', 'Gender', 'Country', 'Package', 'Registered', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">No users found matching filters</td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${selected.has(u.id) ? 'bg-indigo-50/40' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{u.memberId}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#121514]">{u.name}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {u.phone ? (
                      <span className="font-mono text-xs text-gray-700">{u.phone}</span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.gender}</td>
                  <td className="px-4 py-3 text-gray-600">{u.country}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PKG_BADGE[u.packageStatus]}`}>
                      {u.packageStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(u.registeredAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setIndivSmsUser(u)}
                      disabled={!u.phone}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed px-2.5 py-1 bg-indigo-50 rounded-lg transition-colors"
                    >
                      Send SMS
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 rounded-lg disabled:opacity-40 hover:bg-gray-200 transition-colors">
                Previous
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 rounded-lg disabled:opacity-40 hover:bg-gray-200 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Individual SMS Modal */}
      {indivSmsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#121514]">Send Individual SMS</h2>
              <button onClick={() => setIndivSmsUser(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-400">Recipient</p>
              <p className="font-semibold text-[#121514]">{indivSmsUser.name}</p>
              <p className="text-sm text-gray-500 font-mono">{indivSmsUser.phone}</p>
            </div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Message</label>
            <textarea
              rows={4}
              value={indivMsg}
              onChange={(e) => setIndivMsg(e.target.value)}
              placeholder="Type your SMS message here..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20 mb-2"
            />
            <div className="flex items-center justify-between text-xs text-gray-400 mb-5">
              <span>{indivMsg.length} chars · {Math.ceil(indivMsg.length / 160) || 1} SMS part{Math.ceil(indivMsg.length / 160) !== 1 ? 's' : ''}</span>
              {indivMsg.length > 160 && <span className="text-amber-500 font-medium">⚠ Multi-part SMS</span>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIndivSmsUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={sendIndividual} disabled={sendingIndiv || !indivMsg.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[#1C3B35] text-white text-sm font-semibold hover:bg-[#152d28] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {sendingIndiv ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> : null}
                {sendingIndiv ? 'Sending...' : 'Send SMS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
