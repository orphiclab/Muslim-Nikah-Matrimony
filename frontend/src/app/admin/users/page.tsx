'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/services/api';

type User = {
  id: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
  _count?: { childProfiles: number };
};

type Tab = 'ALL' | 'ADMIN' | 'PARENT';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('ALL');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<'email' | 'phone' | 'role' | 'profiles' | 'joined'>('joined');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [openAction, setOpenAction] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const PER_PAGE = 10;

  useEffect(() => {
    adminApi.users()
      .then((r) => setUsers(r.data ?? []))
      .catch(() => setUsers([]))
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

  const filtered = users.filter((u) => {
    const matchSearch = u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone ?? '').includes(search);
    const matchTab = tab === 'ALL' || u.role === tab;
    return matchSearch && matchTab;
  });

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'email') cmp = a.email.localeCompare(b.email);
    else if (sortKey === 'phone') cmp = (a.phone ?? '').localeCompare(b.phone ?? '');
    else if (sortKey === 'role') cmp = a.role.localeCompare(b.role);
    else if (sortKey === 'profiles') cmp = (a._count?.childProfiles ?? 0) - (b._count?.childProfiles ?? 0);
    else if (sortKey === 'joined') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const pageData = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const roleColor = (role: string) =>
    role === 'ADMIN'
      ? 'bg-purple-100 text-purple-700 border border-purple-200'
      : 'bg-[#EAF2EE] text-[#1C3B35] border border-[#c8dfd7]';

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const parentCount = users.filter((u) => u.role === 'PARENT').length;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'ALL', label: 'All Users', count: users.length },
    { key: 'PARENT', label: 'Parents', count: parentCount },
    { key: 'ADMIN', label: 'Admins', count: adminCount },
  ];

  const handleViewAccount = (u: User) => {
    setOpenAction(null);
    router.push(`/admin/users/${u.id}`);
  };

  const handleEditAccount = (u: User) => {
    setOpenAction(null);
    router.push(`/admin/users/${u.id}/edit`);
  };

  const handleDeleteAccount = (u: User) => {
    setOpenAction(null);
    setDeleteConfirm(u);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    setUsers((prev) => prev.filter((u) => u.id !== deleteConfirm.id));
    setDeleteConfirm(null);
  };

  return (
    <div className="font-poppins space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[34px] xl:text-[37px] 2xl:text-[40px] font-poppins font-medium text-[#121514]">
            Users
          </h1>
          <p className="text-[#121514AD]/68 title-sub-top mt-0.5">
            All registered platform users
          </p>
        </div>
        {/* Summary chips */}
        <div className="flex gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#EAF2EE] text-[#1C3B35]">
            {users.length} Total
          </span>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">
            {adminCount} Admins
          </span>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700">
            {parentCount} Parents
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="px-5 pt-4 border-b border-gray-100">
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setPage(1); }}
                className={`relative px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all ${
                  tab === t.key
                    ? 'text-[#1C3B35] bg-[#EAF2EE]'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.label}
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  tab === t.key ? 'bg-[#1C3B35] text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search + Filter bar */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by email or phone…"
              className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Role filter (only visible on ALL tab) */}
          {tab === 'ALL' && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Filter:</span>
              <div className="flex gap-1.5">
                {(['ALL', 'PARENT', 'ADMIN'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => { setTab(r); setPage(1); }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition ${
                      tab === r
                        ? 'bg-[#1C3B35] text-white border-[#1C3B35]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {r === 'ALL' ? 'All' : r === 'PARENT' ? 'Parents' : 'Admins'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto" ref={dropdownRef}>
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading…</div>
          ) : pageData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <span className="text-3xl mb-2">👥</span>
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {/* # — not sortable */}
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide w-10">#</th>

                  {/* Sortable columns */}
                  {([
                    { key: 'email',    label: 'Email' },
                    { key: 'phone',    label: 'Phone' },
                    { key: 'role',     label: 'Role' },
                    { key: 'profiles', label: 'Profiles' },
                    { key: 'joined',   label: 'Joined' },
                  ] as { key: typeof sortKey; label: string }[]).map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={sortKey === col.key ? 'text-[#1C3B35]' : 'group-hover:text-gray-700 transition'}>
                          {col.label}
                        </span>
                        <span className="flex flex-col gap-[1px] shrink-0">
                          {/* Up arrow */}
                          <svg
                            className={`w-2.5 h-2.5 transition ${
                              sortKey === col.key && sortDir === 'asc'
                                ? 'text-[#1C3B35]'
                                : 'text-gray-300 group-hover:text-gray-400'
                            }`}
                            fill="currentColor" viewBox="0 0 10 6"
                          >
                            <path d="M5 0L10 6H0z" />
                          </svg>
                          {/* Down arrow */}
                          <svg
                            className={`w-2.5 h-2.5 transition ${
                              sortKey === col.key && sortDir === 'desc'
                                ? 'text-[#1C3B35]'
                                : 'text-gray-300 group-hover:text-gray-400'
                            }`}
                            fill="currentColor" viewBox="0 0 10 6"
                          >
                            <path d="M5 6L0 0H10z" />
                          </svg>
                        </span>
                      </div>
                    </th>
                  ))}

                  {/* Actions — not sortable */}
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageData.map((u, i) => (
                  <tr key={u.id} className={`hover:bg-gray-50 transition ${i % 2 === 1 ? 'bg-[#FAFAFA]' : ''}`}>
                    {/* # */}
                    <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">
                      {(page - 1) * PER_PAGE + i + 1}
                    </td>
                    {/* Email */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                          u.role === 'ADMIN' ? 'bg-purple-600' : 'bg-[#1C3B35]'
                        }`}>
                          {u.email[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{u.email}</span>
                      </div>
                    </td>
                    {/* Phone */}
                    <td className="px-5 py-3.5 text-gray-500">{u.phone ?? '—'}</td>
                    {/* Role */}
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${roleColor(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    {/* Profile Count */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                          (u._count?.childProfiles ?? 0) > 0
                            ? 'bg-[#EAF2EE] text-[#1C3B35]'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {u._count?.childProfiles ?? 0}
                        </span>
                        <span className="text-xs text-gray-400">
                          {(u._count?.childProfiles ?? 0) === 1 ? 'profile' : 'profiles'}
                        </span>
                      </div>
                    </td>
                    {/* Joined */}
                    <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5 relative">
                      <button
                        id={`action-btn-${u.id}`}
                        onClick={() => setOpenAction(openAction === u.id ? null : u.id)}
                        className="text-gray-400 hover:text-gray-700 transition px-2 py-1 rounded-lg hover:bg-gray-100"
                      >
                        <span className="text-base tracking-widest font-bold">···</span>
                      </button>

                      {openAction === u.id && (
                        <div className="absolute right-4 z-50 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                          style={{ top: '100%' }}>
                          {/* View Account */}
                          <button
                            onClick={() => handleViewAccount(u)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                          >
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            View Account
                          </button>
                          {/* Edit Account */}
                          <button
                            onClick={() => handleEditAccount(u)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                          >
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit Account
                          </button>
                          {/* Divider */}
                          <div className="border-t border-gray-100 my-1" />
                          {/* Delete Account */}
                          <button
                            onClick={() => handleDeleteAccount(u)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                            Delete Account
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

        {/* Footer / Pagination */}
        {!loading && sorted.length > 0 && (
          <div className="px-5 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, sorted.length)} of {sorted.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`h-7 w-7 rounded-lg text-xs font-semibold transition ${page === i + 1 ? 'bg-[#1C3B35] text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Delete Account</h3>
                <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to delete <strong className="text-gray-900">{deleteConfirm.email}</strong>?
              All associated data will be permanently removed.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
