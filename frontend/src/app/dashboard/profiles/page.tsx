'use client';

import { useEffect, useState } from 'react';
import { profileApi, paymentApi } from '@/services/api';

const STEPS = ['Personal', 'Location & Edu', 'Family', 'Preferences', 'Review'];

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    PAYMENT_PENDING: 'bg-amber-100 text-amber-700',
    EXPIRED: 'bg-red-100 text-red-700',
    DRAFT: 'bg-gray-100 text-gray-500',
  };
  return map[s] ?? 'bg-gray-100 text-gray-500';
};

/* ── Input helper ─────────────────────────────────────────────────── */
function Field({
  label, name, value, onChange, type = 'text', placeholder = '', required = false, children,
}: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children ?? (
        <input
          type={type} name={name} value={value ?? ''} onChange={onChange}
          placeholder={placeholder} required={required}
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 outline-none focus:border-[#1C3B35] transition bg-gray-50 focus:bg-white"
        />
      )}
    </div>
  );
}

/* ── Delete confirm modal ─────────────────────────────────────────── */
function DeleteModal({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Delete Profile</h3>
            <p className="text-xs text-gray-400">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <span className="font-semibold text-gray-800">"{name}"</span>? All subscription data will also be removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 bg-red-500 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-red-600 transition">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<any>({ gender: 'MALE', dateOfBirth: '', name: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [initiating, setInitiating] = useState<string | null>(null);
  // Privacy per-profile: { [profileId]: { showRealName, nickname, saving } }
  const [privacy, setPrivacy] = useState<Record<string, { showRealName: boolean; nickname: string; saving: boolean }>>({});

  const showToast = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 6000);
  };

  const load = () => {
    setLoading(true);
    profileApi.getMyProfiles().then((r) => setProfiles(r.data ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Initialise privacy state from loaded profiles
  useEffect(() => {
    const init: Record<string, { showRealName: boolean; nickname: string; saving: boolean }> = {};
    profiles.forEach(p => {
      init[p.id] = { showRealName: p.showRealName ?? true, nickname: p.nickname ?? '', saving: false };
    });
    setPrivacy(init);
  }, [profiles]);

  const savePrivacy = async (profileId: string) => {
    const ps = privacy[profileId];
    if (!ps) return;
    setPrivacy(prev => ({ ...prev, [profileId]: { ...prev[profileId], saving: true } }));
    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api';
      const token = localStorage.getItem('mn_token');
      await fetch(`${BASE}/profile/update/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ showRealName: ps.showRealName, nickname: ps.nickname }),
      });
      showToast('Privacy settings saved!');
      load();
    } catch {
      showToast('Failed to save privacy settings', false);
    } finally {
      setPrivacy(prev => ({ ...prev, [profileId]: { ...prev[profileId], saving: false } }));
    }
  };

  const handleField = (e: any) => setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));

  const createProfile = async () => {
    setSaving(true);
    try {
      await profileApi.create(form);
      showToast('Profile created! Now purchase a subscription to activate it.');
      setShowCreate(false);
      setStep(0);
      setForm({ gender: 'MALE', dateOfBirth: '', name: '' });
      load();
    } catch (e: any) {
      showToast(e.message ?? 'Failed to create profile', false);
    } finally { setSaving(false); }
  };

  const initiatePayment = async (profileId: string) => {
    setInitiating(profileId);
    try {
      await paymentApi.initiate({ childProfileId: profileId, amount: 29.99, method: 'GATEWAY' });
      showToast('Payment initiated! Head to Subscription page to complete.');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to initiate payment', false);
    } finally { setInitiating(null); }
  };

  const deleteProfile = async (id: string) => {
    try {
      await profileApi.delete(id);
      setDeleteTarget(null);
      load();
      showToast('Profile deleted.');
    } catch (e: any) {
      showToast(e.message ?? 'Delete failed', false);
    }
  };

  const inputClass = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 outline-none focus:border-[#1C3B35] transition bg-gray-50 focus:bg-white';
  const selectClass = inputClass;

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Loading...
    </div>
  );

  return (
    <>
      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onConfirm={() => deleteProfile(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* Create Profile Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-800">Create Profile</h2>
                <p className="text-xs text-gray-400 mt-0.5">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
              </div>
              <button onClick={() => { setShowCreate(false); setStep(0); }}
                className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 pt-5 pb-2">
              {/* Progress bar */}
              <div className="flex gap-1 mb-6">
                {STEPS.map((s, i) => (
                  <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-[#1C3B35]' : 'bg-gray-100'}`} />
                ))}
              </div>

              {/* Step content */}
              <div className="space-y-3 min-h-[220px]">
                {step === 0 && (
                  <>
                    <Field label="Full Name" name="name" value={form.name} onChange={handleField} placeholder="e.g. Ahmed Hassan" required />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Gender <span className="text-red-400">*</span></label>
                        <select name="gender" value={form.gender} onChange={handleField} className={selectClass}>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                        </select>
                      </div>
                      <Field label="Date of Birth" name="dateOfBirth" value={form.dateOfBirth} onChange={handleField} type="date" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Height (cm)" name="height" value={form.height} onChange={handleField} type="number" placeholder="175" />
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Civil Status</label>
                        <select name="civilStatus" value={form.civilStatus ?? ''} onChange={handleField} className={selectClass}>
                          <option value="">Select</option>
                          <option>Never Married</option><option>Divorced</option><option>Widowed</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Country" name="country" value={form.country} onChange={handleField} placeholder="Sri Lanka" />
                      <Field label="City" name="city" value={form.city} onChange={handleField} placeholder="Colombo" />
                    </div>
                    <Field label="Education" name="education" value={form.education} onChange={handleField} placeholder="Bachelor's Degree" />
                    <Field label="Occupation" name="occupation" value={form.occupation} onChange={handleField} placeholder="Software Engineer" />
                    <Field label="Annual Income" name="annualIncome" value={form.annualIncome} onChange={handleField} placeholder="e.g. $40,000" />
                  </>
                )}

                {step === 2 && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Family Status</label>
                      <select name="familyStatus" value={form.familyStatus ?? ''} onChange={handleField} className={selectClass}>
                        <option value="">Select</option>
                        <option>Nuclear</option><option>Joint</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Father's Occupation" name="fatherOccupation" value={form.fatherOccupation} onChange={handleField} />
                      <Field label="Mother's Occupation" name="motherOccupation" value={form.motherOccupation} onChange={handleField} />
                    </div>
                    <Field label="Number of Siblings" name="siblings" value={form.siblings} onChange={handleField} type="number" placeholder="2" />
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Min Age Preference" name="minAgePreference" value={form.minAgePreference} onChange={handleField} type="number" placeholder="22" />
                      <Field label="Max Age Preference" name="maxAgePreference" value={form.maxAgePreference} onChange={handleField} type="number" placeholder="35" />
                    </div>
                    <Field label="Country Preference" name="countryPreference" value={form.countryPreference} onChange={handleField} placeholder="Any country" />
                    <Field label="Min Height Preference (cm)" name="minHeightPreference" value={form.minHeightPreference} onChange={handleField} type="number" placeholder="160" />
                  </>
                )}

                {step === 4 && (
                  <>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Review your details</p>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                      {[
                        ['Name', form.name], ['Gender', form.gender], ['Date of Birth', form.dateOfBirth],
                        ['Country', form.country], ['City', form.city], ['Education', form.education],
                        ['Occupation', form.occupation],
                      ].filter(([, v]) => v).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-gray-400">{k}</span>
                          <span className="font-medium text-gray-700">{v}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">
                      A bio and expectations will be auto-generated. You can edit them after creation.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between gap-3">
              <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition font-semibold">
                Back
              </button>
              {step < 4 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={step === 0 && (!form.name || !form.dateOfBirth)}
                  className="px-6 py-2.5 bg-[#1C3B35] text-white rounded-xl text-sm font-semibold hover:bg-[#15302a] transition disabled:opacity-50">
                  Next →
                </button>
              ) : (
                <button onClick={createProfile} disabled={saving || !form.name || !form.dateOfBirth}
                  className="px-6 py-2.5 bg-[#1C3B35] text-white rounded-xl text-sm font-semibold hover:bg-[#15302a] transition disabled:opacity-50 flex items-center gap-2">
                  {saving ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : null}
                  {saving ? 'Creating…' : '✓ Create Profile'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="font-poppins space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Profiles</h1>
            <p className="text-gray-400 text-sm mt-0.5">Manage your family members' matrimonial profiles</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="text-sm bg-[#1C3B35] text-white px-5 py-2.5 rounded-xl hover:bg-[#15302a] transition font-semibold flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Profile
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`p-4 rounded-xl text-sm font-medium border ${toast.ok ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
            {toast.text}
          </div>
        )}

        {/* Profile cards */}
        {profiles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p className="font-semibold text-gray-500">No profiles yet</p>
            <p className="text-sm mt-1 mb-5">Add your first family member to get started</p>
            <button onClick={() => setShowCreate(true)}
              className="text-sm bg-[#1C3B35] text-white px-5 py-2.5 rounded-xl hover:bg-[#15302a] transition font-semibold inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create First Profile
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {profiles.map((p) => (
              <div key={p.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {/* Card header */}
                <div className={`px-5 py-4 border-b border-gray-50 flex items-center justify-between ${
                  p.status === 'ACTIVE' ? 'bg-green-50' :
                  p.status === 'PAYMENT_PENDING' ? 'bg-amber-50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      p.status === 'ACTIVE' ? 'bg-[#1C3B35] text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {p.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{p.name}</p>
                      {p.memberId && <p className="text-xs text-gray-400 font-mono">{p.memberId}</p>}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge(p.status)}`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Card body */}
                <div className="px-5 py-4 space-y-2">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                      </svg>
                      <span className="capitalize">{p.gender?.toLowerCase() ?? '—'}</span>
                    </div>
                    {p.country && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        {p.city ? `${p.city}, ` : ''}{p.country}
                      </div>
                    )}
                    {p.education && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                        </svg>
                        {p.education}
                      </div>
                    )}
                    {p.occupation && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                        </svg>
                        {p.occupation}
                      </div>
                    )}
                  </div>

                  {/* Subscription info */}
                  {p.subscription && (
                    <div className={`mt-2 rounded-lg px-3 py-2 text-xs flex items-center justify-between ${
                      p.subscription.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
                    }`}>
                      <span>Subscription: <strong>{p.subscription.status}</strong></span>
                      {p.subscription.endDate && (
                        <span className="text-[10px] opacity-70">Expires {new Date(p.subscription.endDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  )}

                  {/* ── Privacy Settings ─────────────────────────────── */}
                  {privacy[p.id] && (
                    <div className="mt-3 border border-gray-100 rounded-xl bg-gray-50 px-4 py-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-700">Show Real Name Publicly</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">When OFF, your nickname is shown instead</p>
                        </div>
                        {/* iOS-style toggle */}
                        <button
                          onClick={() => setPrivacy(prev => ({
                            ...prev,
                            [p.id]: { ...prev[p.id], showRealName: !prev[p.id].showRealName }
                          }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                            privacy[p.id].showRealName ? 'bg-[#1C3B35]' : 'bg-gray-300'
                          }`}>
                          <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${
                            privacy[p.id].showRealName ? 'translate-x-6' : 'translate-x-1'
                          }`} style={{ width: 18, height: 18 }} />
                        </button>
                      </div>

                      {/* Nickname input — shown when real name is hidden */}
                      {!privacy[p.id].showRealName && (
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1">Nickname (shown publicly)</label>
                          <input
                            type="text"
                            value={privacy[p.id].nickname}
                            onChange={e => setPrivacy(prev => ({
                              ...prev,
                              [p.id]: { ...prev[p.id], nickname: e.target.value }
                            }))}
                            placeholder="e.g. Sister Mariam, Brother Ali"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#1C3B35] transition bg-white"
                          />
                          {!privacy[p.id].nickname.trim() && (
                            <p className="text-[10px] text-amber-500 mt-1">⚠ Enter a nickname or your name will be hidden completely</p>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => savePrivacy(p.id)}
                        disabled={privacy[p.id].saving}
                        className="w-full text-xs font-semibold bg-[#1C3B35] text-white py-2 rounded-lg hover:bg-[#15302a] transition disabled:opacity-50 flex items-center justify-center gap-1.5">
                        {privacy[p.id].saving ? (
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        {privacy[p.id].saving ? 'Saving…' : 'Save Privacy Settings'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Card footer actions */}
                <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    {(p.status === 'DRAFT' || p.status === 'EXPIRED') && (
                      <button
                        onClick={() => initiatePayment(p.id)}
                        disabled={initiating === p.id}
                        className="text-xs bg-[#1C3B35] text-white px-3.5 py-2 rounded-lg hover:bg-[#15302a] transition font-semibold disabled:opacity-50 flex items-center gap-1.5">
                        {initiating === p.id ? (
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
                          </svg>
                        )}
                        {p.status === 'EXPIRED' ? 'Renew' : 'Activate'}
                      </button>
                    )}
                    {p.status === 'ACTIVE' && (
                      <a href={`/dashboard/chat`}
                        className="text-xs border border-[#1C3B35] text-[#1C3B35] px-3.5 py-2 rounded-lg hover:bg-[#1C3B35]/5 transition font-semibold flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Chat
                      </a>
                    )}
                  </div>
                  <button onClick={() => setDeleteTarget(p)}
                    className="text-xs text-gray-400 hover:text-red-500 transition flex items-center gap-1 py-2 px-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
