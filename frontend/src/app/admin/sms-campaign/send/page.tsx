'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('mn_token') : null; }

interface Template { id: string; name: string; message: string; category: string; }

const CHAR_LIMIT = 160;

function SendCampaignInner() {
  const router = useRouter();
  const params = useSearchParams();
  const fromTargeting = params.get('from') === 'targeting';

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState<'ALL' | 'FILTERED' | 'SELECTED'>(fromTargeting ? 'SELECTED' : 'ALL');
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [preview, setPreview] = useState(false);

  // Filter state (for FILTERED type)
  const [filterPkg, setFilterPkg] = useState('ALL');
  const [filterGender, setFilterGender] = useState('');
  const [filterCountry, setFilterCountry] = useState('');

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg }); setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    // Load templates
    fetch(`${API}/admin/sms-campaign/templates/list`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json()).then((d) => { if (d.success) setTemplates(d.data); });

    // Load selected users from targeting page
    if (fromTargeting) {
      const ids = sessionStorage.getItem('sms_selected_users');
      const count = sessionStorage.getItem('sms_selected_count');
      if (ids) { setSelectedUserIds(JSON.parse(ids)); }
      if (count) { setSelectedCount(parseInt(count)); }
    }
  }, [fromTargeting]);

  const onTemplateChange = (id: string) => {
    setSelectedTemplate(id);
    const tpl = templates.find((t) => t.id === id);
    if (tpl) setMessage(tpl.message);
  };

  const smsParts = Math.max(1, Math.ceil(message.length / CHAR_LIMIT));

  const handleSend = async () => {
    if (!campaignName.trim()) { showToast('error', 'Please enter a campaign name'); return; }
    if (!message.trim()) { showToast('error', 'Please enter a message'); return; }
    if (scheduleType === 'later' && !scheduledAt) { showToast('error', 'Please select a scheduled date/time'); return; }

    setSending(true);
    const payload: any = {
      name: campaignName,
      message,
      recipientType,
      templateId: selectedTemplate || undefined,
    };

    if (recipientType === 'SELECTED') payload.selectedUserIds = selectedUserIds;
    if (recipientType === 'FILTERED') {
      payload.recipientFilter = { packageStatus: filterPkg || undefined, gender: filterGender || undefined, country: filterCountry || undefined };
    }
    if (scheduleType === 'later') {
      payload.scheduledAt = new Date(scheduledAt).toISOString();
    }

    const endpoint = scheduleType === 'now' ? `${API}/admin/sms-campaign/send` : `${API}/admin/sms-campaign`;

    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (d.success) {
        if (scheduleType === 'now') {
          showToast('success', `✓ Campaign sent! ${d.data?.sentCount ?? 0} delivered, ${d.data?.failedCount ?? 0} failed`);
          setTimeout(() => router.push('/admin/sms-campaign/history'), 2000);
        } else {
          showToast('success', 'Campaign saved and scheduled!');
          setTimeout(() => router.push('/admin/sms-campaign/history'), 2000);
        }
        // Clear session storage
        sessionStorage.removeItem('sms_selected_users');
        sessionStorage.removeItem('sms_selected_count');
      } else {
        showToast('error', d.message || 'Failed to send campaign');
      }
    } catch { showToast('error', 'Network error'); } finally { setSending(false); }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#121514]">Send Campaign</h1>
        <p className="text-gray-400 text-sm mt-1">Compose and send a bulk SMS campaign to your users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-5">

          {/* Campaign Name */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Campaign Name *</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Eid Mubarak Promotion"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20"
            />
          </div>

          {/* Template Selector */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Use Template (optional)</label>
            <select value={selectedTemplate} onChange={(e) => onTemplateChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20">
              <option value="">— Select a template —</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.category})</option>)}
            </select>
          </div>

          {/* Message */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Message *</label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your SMS message here..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20 mb-3"
            />
            <div className="flex items-center gap-4 text-xs">
              <span className={`font-medium ${message.length > CHAR_LIMIT ? 'text-amber-500' : 'text-gray-400'}`}>
                {message.length} characters
              </span>
              <span className={`font-medium ${smsParts > 1 ? 'text-amber-500' : 'text-gray-400'}`}>
                {smsParts} SMS part{smsParts !== 1 ? 's' : ''}
              </span>
              {message.length > CHAR_LIMIT && (
                <span className="text-amber-600 font-semibold">⚠ Message exceeds 160 chars — will be split into {smsParts} parts</span>
              )}
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all ${message.length > CHAR_LIMIT ? 'bg-amber-400' : 'bg-emerald-400'}`}
                style={{ width: `${Math.min(100, (message.length % CHAR_LIMIT || (message.length ? CHAR_LIMIT : 0)) / CHAR_LIMIT * 100)}%` }}
              />
            </div>
          </div>

          {/* Scheduling */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Scheduling</label>
            <div className="flex gap-3 mb-4">
              {(['now', 'later'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setScheduleType(type)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors border ${scheduleType === type ? 'bg-[#1C3B35] text-white border-[#1C3B35]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                >
                  {type === 'now' ? '⚡ Send Now' : '⏰ Schedule Later'}
                </button>
              ))}
            </div>
            {scheduleType === 'later' && (
              <input
                type="datetime-local"
                value={scheduledAt}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20"
              />
            )}
          </div>
        </div>

        {/* Right: Recipients + Actions */}
        <div className="space-y-5">
          {/* Recipients */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Recipients</label>
            <div className="space-y-2">
              {([
                { value: 'ALL', label: 'All Users', icon: '👥' },
                { value: 'FILTERED', label: 'Filtered Users', icon: '🔍' },
                { value: 'SELECTED', label: 'Selected Users Only', icon: '☑️' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRecipientType(opt.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors border ${recipientType === opt.value ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'}`}
                >
                  <span>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>

            {recipientType === 'SELECTED' && (
              <div className="mt-4 p-3 bg-indigo-50 rounded-xl">
                <p className="text-sm font-semibold text-indigo-700">{selectedCount || selectedUserIds.length} users selected</p>
                <p className="text-xs text-indigo-500 mt-0.5">
                  {selectedCount > 0 ? 'From targeting page' : 'No users selected — go to User Targeting to select'}
                </p>
              </div>
            )}

            {recipientType === 'FILTERED' && (
              <div className="mt-4 space-y-3">
                <select value={filterPkg} onChange={(e) => setFilterPkg(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20">
                  <option value="ALL">All Package Status</option>
                  <option value="ACTIVE">Active Package</option>
                  <option value="EXPIRED">Expired Package</option>
                  <option value="NOT_PURCHASED">Not Purchased</option>
                </select>
                <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20">
                  <option value="">All Genders</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
                <input type="text" value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}
                  placeholder="Country (e.g. Sri Lanka)"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 space-y-3">
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full py-3 rounded-xl bg-[#1C3B35] text-white text-sm font-semibold hover:bg-[#152d28] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {sending ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Sending...</>
              ) : scheduleType === 'now' ? '🚀 Send Campaign' : '📅 Schedule Campaign'}
            </button>
            <button onClick={() => router.push('/admin/sms-campaign')}
              className="w-full py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>

          {/* Sending note */}
          <div className="bg-amber-50 rounded-2xl p-4 text-xs text-amber-700 space-y-1">
            <p className="font-semibold">⚠ Before Sending</p>
            <p>• Duplicate phone numbers are automatically removed</p>
            <p>• Phone numbers are validated before sending</p>
            <p>• Large campaigns are sent in batches of 10</p>
            <p>• All sends are logged in Campaign History</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SendCampaignPage() {
  return (
    <Suspense>
      <SendCampaignInner />
    </Suspense>
  );
}
