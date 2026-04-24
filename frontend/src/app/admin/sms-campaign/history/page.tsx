'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('mn_token') : null; }

interface Campaign {
  id: string;
  name: string;
  message: string;
  status: string;
  recipientType: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  template?: { name: string } | null;
  logs?: CampaignLog[];
}

interface CampaignLog {
  id: string;
  userId: string;
  phone: string;
  status: string;
  errorMsg: string | null;
  sentAt: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  SENDING: 'bg-blue-100 text-blue-700',
  SCHEDULED: 'bg-indigo-100 text-indigo-700',
  FAILED: 'bg-rose-100 text-rose-700',
  DRAFT: 'bg-gray-100 text-gray-500',
};

const LOG_STYLE: Record<string, string> = {
  SENT: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-rose-100 text-rose-700',
  PENDING: 'bg-gray-100 text-gray-500',
};

export default function CampaignHistoryPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Campaign | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetch(`${API}/admin/sms-campaign`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setCampaigns(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    const r = await fetch(`${API}/admin/sms-campaign/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const d = await r.json();
    if (d.success) setDetail(d.data);
    setDetailLoading(false);
  };

  const filtered = campaigns.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const deliveryRate = (c: Campaign) =>
    c.totalRecipients > 0 ? Math.round((c.sentCount / c.totalRecipients) * 100) : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#121514]">Campaign History</h1>
        <p className="text-gray-400 text-sm mt-1">View all past and scheduled SMS campaigns</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search campaigns..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20">
          <option value="">All Statuses</option>
          {['COMPLETED', 'SENDING', 'SCHEDULED', 'FAILED', 'DRAFT'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Campaign Name', 'Status', 'Recipients', 'Sent', 'Failed', 'Rate', 'Created', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <polyline points="12 8 12 12 14 14" /><path d="M3.05 11a9 9 0 1 0 .5-3" /><polyline points="3 4 3 11 10 11" />
                    </svg>
                    <p className="text-gray-400 text-sm">No campaigns found</p>
                  </td>
                </tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#121514]">{c.name}</p>
                    {c.template && <p className="text-xs text-gray-400">Template: {c.template.name}</p>}
                    <p className="text-xs text-gray-400 capitalize">{c.recipientType.toLowerCase().replace('_', ' ')}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-700">{c.totalRecipients.toLocaleString()}</td>
                  <td className="px-4 py-3 text-emerald-600 font-medium">{c.sentCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-rose-500 font-medium">{c.failedCount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
                        <div className="h-1.5 bg-emerald-400 rounded-full" style={{ width: `${deliveryRate(c)}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{deliveryRate(c)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    <p>{new Date(c.createdAt).toLocaleDateString()}</p>
                    <p>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openDetail(c.id)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-2.5 py-1 bg-indigo-50 rounded-lg transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#121514]">{detail?.name ?? 'Loading...'}</h2>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            {detailLoading ? (
              <div className="flex items-center justify-center p-12">
                <svg className="w-6 h-6 animate-spin text-gray-300" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
              </div>
            ) : detail && (
              <div className="overflow-y-auto flex-1">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-100">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#121514]">{detail.totalRecipients}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">{detail.sentCount}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-rose-500">{detail.failedCount}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Failed</p>
                  </div>
                </div>
                {/* Message */}
                <div className="p-6 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Message</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4">{detail.message ?? '—'}</p>
                </div>
                {/* Logs */}
                <div className="p-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Delivery Log ({detail.logs?.length ?? 0})</p>
                  {detail.logs && detail.logs.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {detail.logs.map((log) => (
                        <div key={log.id} className="flex items-center gap-3 text-xs p-3 bg-gray-50 rounded-xl">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${LOG_STYLE[log.status]}`}>{log.status}</span>
                          <span className="font-mono text-gray-600">{log.phone}</span>
                          {log.errorMsg && <span className="text-rose-500">{log.errorMsg}</span>}
                          {log.sentAt && <span className="text-gray-400 ml-auto">{new Date(log.sentAt).toLocaleTimeString()}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No delivery logs yet</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
