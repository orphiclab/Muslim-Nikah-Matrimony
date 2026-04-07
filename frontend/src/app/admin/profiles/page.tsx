'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/services/api';

type Profile = {
  id: string; name: string; gender: string; status: string;
  country?: string; city?: string; occupation?: string;
  createdAt: string; user?: { email: string };
};

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'DRAFT', 'PAYMENT_PENDING', 'EXPIRED'];

type SortKey = 'name' | 'owner' | 'gender' | 'location' | 'status' | 'joined';

export default function AdminProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('joined');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [openAction, setOpenAction] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const PER_PAGE = 10;

  useEffect(() => {
    setLoading(true);
    adminApi.profiles()
      .then((r) => setProfiles(r.data ?? []))
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenAction(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = profiles.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.user?.email ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filter === 'ALL' || p.status === filter;
    return matchSearch && matchStatus;
  });

  // Sorting
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortKey === 'owner') cmp = (a.user?.email ?? '').localeCompare(b.user?.email ?? '');
    else if (sortKey === 'gender') cmp = a.gender.localeCompare(b.gender);
    else if (sortKey === 'location') cmp = ([a.city, a.country].filter(Boolean).join(', ')).localeCompare([b.city, b.country].filter(Boolean).join(', '));
    else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
    else if (sortKey === 'joined') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const pageData = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const statusColor = (s: string) => ({
    ACTIVE: 'bg-green-100 text-green-700',
    DRAFT: 'bg-gray-100 text-gray-600',
    PAYMENT_PENDING: 'bg-amber-100 text-amber-700',
    EXPIRED: 'bg-red-100 text-red-700',
  }[s] ?? 'bg-gray-100 text-gray-500');

  const statusLabel = (s: string) => ({
    ACTIVE: 'Active', DRAFT: 'Draft',
    PAYMENT_PENDING: 'Pending Payment', EXPIRED: 'Expired',
  }[s] ?? s);

  // Sortable column header helper
  const SortTh = ({ colKey, label }: { colKey: SortKey; label: string }) => (
    <th
      onClick={() => handleSort(colKey)}
      className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide cursor-pointer select-none group whitespace-nowrap"
    >
      <div className="flex items-center gap-1.5">
        <span className={sortKey === colKey ? 'text-[#1C3B35]' : 'group-hover:text-gray-700 transition'}>
          {label}
        </span>
        <span className="flex flex-col gap-[1px] shrink-0">
          <svg className={`w-2.5 h-2.5 transition ${sortKey === colKey && sortDir === 'asc' ? 'text-[#1C3B35]' : 'text-gray-300 group-hover:text-gray-400'}`} fill="currentColor" viewBox="0 0 10 6">
            <path d="M5 0L10 6H0z" />
          </svg>
          <svg className={`w-2.5 h-2.5 transition ${sortKey === colKey && sortDir === 'desc' ? 'text-[#1C3B35]' : 'text-gray-300 group-hover:text-gray-400'}`} fill="currentColor" viewBox="0 0 10 6">
            <path d="M5 6L0 0H10z" />
          </svg>
        </span>
      </div>
    </th>
  );

  return (
    <div className="font-poppins space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[34px] xl:text-[37px] 2xl:text-[40px] font-poppins font-medium text-[#121514]">Master File</h1>
          <p className="text-[#121514AD]/68 title-sub-top mt-0.5">All candidate profiles across the system</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['ACTIVE', 'DRAFT', 'PAYMENT_PENDING'].map(s => {
            const cnt = profiles.filter(p => p.status === s).length;
            return (
              <span key={s} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusColor(s)}`}>
                {cnt} {statusLabel(s)}
              </span>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Filters */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex gap-1 flex-wrap">
            {STATUS_OPTIONS.map((s) => (
              <button key={s} onClick={() => { setFilter(s); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${filter === s ? 'bg-[#1C3B35] text-white' : 'text-gray-500 hover:bg-gray-50 border border-gray-200'}`}>
                {s === 'ALL' ? 'All' : statusLabel(s)}
                {s !== 'ALL' && (
                  <span className={`ml-1 ${filter === s ? 'opacity-70' : 'text-gray-400'}`}>
                    ({profiles.filter(p => p.status === s).length})
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:ml-auto bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 w-full sm:w-64">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name or email…"
              className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400" />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto" ref={dropdownRef}>
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading…</div>
          ) : pageData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <span className="text-3xl mb-2">👤</span>
              <p className="text-sm">No profiles found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide w-10">#</th>
                  <SortTh colKey="name" label="Name" />
                  <SortTh colKey="owner" label="Owner" />
                  <SortTh colKey="gender" label="Gender" />
                  <SortTh colKey="location" label="Location" />
                  <SortTh colKey="status" label="Status" />
                  <SortTh colKey="joined" label="Joined" />
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageData.map((p, i) => (
                  <tr key={p.id} className={`hover:bg-gray-50 transition ${i % 2 === 1 ? 'bg-[#FAFAFA]' : ''}`}>
                    <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">{(page - 1) * PER_PAGE + i + 1}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800 whitespace-nowrap">{p.name}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{p.user?.email ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.gender === 'FEMALE' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'}`}>
                        {p.gender === 'FEMALE' ? '♀ Female' : '♂ Male'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{[p.city, p.country].filter(Boolean).join(', ') || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColor(p.status)}`}>{statusLabel(p.status)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 relative">
                      <button
                        onClick={() => setOpenAction(openAction === p.id ? null : p.id)}
                        className="text-gray-400 hover:text-gray-700 transition px-2 py-1 rounded-lg hover:bg-gray-100"
                      >
                        <span className="text-base tracking-widest font-bold">···</span>
                      </button>

                      {openAction === p.id && (
                        <div className="absolute right-4 z-50 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden" style={{ top: '100%' }}>
                          {/* View Profile */}
                          <button
                            onClick={() => { setOpenAction(null); router.push(`/admin/profiles/${p.id}`); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                          >
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            View Profile
                          </button>
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
        {!loading && sorted.length > 0 && (
          <div className="px-5 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, sorted.length)} of {sorted.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
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
  );
}
