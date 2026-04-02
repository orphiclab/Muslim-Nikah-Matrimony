'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/services/api';

type User = {
  id: string; email: string; phone?: string; role: string; createdAt: string;
  _count?: { childProfiles: number };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    adminApi.users()
      .then((r) => setUsers(r.data ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const roleColor = (role: string) =>
    role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-[#EAF2EE] text-[#1C3B35]';

  return (
    <div className="font-poppins space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[34px] xl:text-[37px] 2xl:text-[40px] font-poppins font-medium text-[#121514]">Membership</h1>
          <p className="text-[#121514AD]/68 title-sub-top mt-0.5">All registered platform members</p>
        </div>
        {/* Summary chips */}
        <div className="flex gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#EAF2EE] text-[#1C3B35]">{users.length} Total</span>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">{users.filter(u => u.role === 'ADMIN').length} Admins</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Search bar */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by email…"
              className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
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
                  {['#', 'Email', 'Phone', 'Role', 'Profiles', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageData.map((u, i) => (
                  <tr key={u.id} className={`hover:bg-gray-50 transition ${i % 2 === 1 ? 'bg-[#FAFAFA]' : ''}`}>
                    <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">{(page - 1) * PER_PAGE + i + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-[#1C3B35] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.email[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{u.phone ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${roleColor(u.role)}`}>{u.role}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{u._count?.childProfiles ?? 0}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <button className="text-gray-400 hover:text-gray-700 transition px-2 py-1 rounded-lg hover:bg-gray-100">
                        <span className="text-base tracking-widest font-bold">···</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} entries
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
  );
}
