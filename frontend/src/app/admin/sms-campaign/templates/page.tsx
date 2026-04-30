'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('mn_token') : null; }

interface Template { id: string; name: string; message: string; category: string; createdAt: string; }

const CATEGORIES = ['GENERAL', 'WELCOME', 'REMINDER', 'PROMOTIONAL'];
const CATEGORY_STYLE: Record<string, string> = {
  GENERAL: 'bg-gray-100 text-gray-600',
  WELCOME: 'bg-emerald-100 text-emerald-700',
  REMINDER: 'bg-amber-100 text-amber-700',
  PROMOTIONAL: 'bg-indigo-100 text-indigo-700',
};

const STARTER_TEMPLATES = [
  { name: 'Welcome Message', category: 'WELCOME', message: 'Assalamu Alaikum! Welcome to Muslim Nikah. Your journey to find your life partner starts here. Visit our platform to complete your profile.' },
  { name: 'Package Expiry Reminder', category: 'REMINDER', message: 'Dear member, your Muslim Nikah  subscription is expiring soon. Renew now to keep your profile active and visible to potential matches.' },
  { name: 'Profile Completion Reminder', category: 'REMINDER', message: 'Your Muslim Nikah profile is incomplete. A complete profile gets 3x more views! Login and complete your profile today.' },
  { name: 'Special Promotion', category: 'PROMOTIONAL', message: 'Exclusive offer for Muslim Nikah members! Get 20% off on your next subscription renewal. Limited time only. Login to your account to avail.' },
];

interface ModalState { open: boolean; mode: 'create' | 'edit'; template?: Template; }

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'create' });
  const [form, setForm] = useState({ name: '', message: '', category: 'GENERAL' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500);
  };

  const fetchTemplates = () => {
    setLoading(true);
    fetch(`${API}/admin/sms-campaign/templates/list`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setTemplates(d.data ?? []); })
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openCreate = () => { setForm({ name: '', message: '', category: 'GENERAL' }); setModal({ open: true, mode: 'create' }); };
  const openEdit = (t: Template) => { setForm({ name: t.name, message: t.message, category: t.category }); setModal({ open: true, mode: 'edit', template: t }); };

  const saveTemplate = async () => {
    if (!form.name.trim() || !form.message.trim()) { showToast('error', 'Name and message are required'); return; }
    setSaving(true);
    const url = modal.mode === 'edit' ? `${API}/admin/sms-campaign/templates/${modal.template?.id}` : `${API}/admin/sms-campaign/templates`;
    const method = modal.mode === 'edit' ? 'PUT' : 'POST';
    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.success) {
        showToast('success', modal.mode === 'edit' ? 'Template updated!' : 'Template created!');
        setModal({ open: false, mode: 'create' });
        fetchTemplates();
      } else { showToast('error', d.message || 'Failed'); }
    } catch { showToast('error', 'Network error'); } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const r = await fetch(`${API}/admin/sms-campaign/templates/${deleteId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` },
      });
      const d = await r.json();
      if (d.success) { showToast('success', 'Template deleted'); fetchTemplates(); }
      else showToast('error', 'Failed to delete');
    } catch { showToast('error', 'Network error'); } finally { setDeleteId(null); }
  };

  const addStarterTemplate = async (tpl: typeof STARTER_TEMPLATES[0]) => {
    try {
      const r = await fetch(`${API}/admin/sms-campaign/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(tpl),
      });
      const d = await r.json();
      if (d.success) { showToast('success', `"${tpl.name}" added!`); fetchTemplates(); }
      else showToast('error', d.message || 'Already exists or failed');
    } catch { showToast('error', 'Network error'); }
  };

  return (
    <div>
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#121514]">SMS Templates</h1>
          <p className="text-gray-400 text-sm mt-1">Create and manage reusable message templates</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-[#1C3B35] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#152d28] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New Template
        </button>
      </div>

      {/* Quick Start — always visible, filtered to not-yet-added templates */}
      {(() => {
        const addedNames = new Set(templates.map((t) => t.name));
        const remaining = STARTER_TEMPLATES.filter((s) => !addedNames.has(s.name));
        if (loading || remaining.length === 0) return null;
        return (
          <div className="bg-indigo-50 rounded-2xl p-6 mb-6">
            <p className="text-sm font-semibold text-indigo-700 mb-1">Quick Start</p>
            <p className="text-xs text-indigo-500 mb-4">Add these pre-built templates to get started quickly</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {remaining.map((tpl) => (
                <button key={tpl.name} onClick={() => addStarterTemplate(tpl)}
                  className="text-left p-4 bg-white rounded-xl hover:shadow-sm transition-all border border-indigo-100">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${CATEGORY_STYLE[tpl.category]}`}>{tpl.category}</span>
                  <p className="text-sm font-semibold text-[#121514]">{tpl.name}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{tpl.message}</p>
                  <p className="text-xs text-indigo-600 mt-2 font-medium">+ Add this template →</p>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Templates grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 h-40 animate-pulse" />)}
        </div>
      ) : templates.length === 0 ? null : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${CATEGORY_STYLE[t.category] ?? 'bg-gray-100 text-gray-600'}`}>{t.category}</span>
                  <h3 className="font-semibold text-[#121514]">{t.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(t)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  </button>
                  <button onClick={() => setDeleteId(t.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 line-clamp-3">{t.message}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <span>{t.message.length} chars · {Math.ceil(t.message.length / 160)} SMS part{Math.ceil(t.message.length / 160) !== 1 ? 's' : ''}</span>
                <span>{new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#121514]">{modal.mode === 'edit' ? 'Edit Template' : 'New Template'}</h2>
              <button onClick={() => setModal({ open: false, mode: 'create' })} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Template Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Welcome Message"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Category</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Message *</label>
                <textarea rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Type your SMS message..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20 mb-1" />
                <p className={`text-xs ${form.message.length > 160 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {form.message.length} chars · {Math.ceil(form.message.length / 160) || 1} SMS part{Math.ceil(form.message.length / 160) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal({ open: false, mode: 'create' })}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={saveTemplate} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#1C3B35] text-white text-sm font-semibold hover:bg-[#152d28] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {saving ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> : null}
                {saving ? 'Saving...' : modal.mode === 'edit' ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /></svg>
            </div>
            <p className="font-semibold text-[#121514] mb-1">Delete Template</p>
            <p className="text-sm text-gray-400 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
