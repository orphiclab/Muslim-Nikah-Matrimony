'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { profileApi, paymentApi, packagesApi } from '@/services/api';

const STEPS = ['Personal', 'Location & Edu', 'Family', 'Preferences', 'Review'];

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    PAUSED: 'bg-amber-100 text-amber-700',
    INACTIVE: 'bg-red-100 text-red-600',
    PAYMENT_PENDING: 'bg-amber-100 text-amber-700',
    EXPIRED: 'bg-red-100 text-red-700',
    DRAFT: 'bg-gray-100 text-gray-500',
  };
  return map[s] ?? 'bg-gray-100 text-gray-500';
};

/* ── Input helper ─────────────────────────────────────────────────── */
function Field({
  label, name, value, onChange, type = 'text', placeholder = '', required = false, error, children,
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
          className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-gray-700 outline-none focus:border-[#1C3B35] transition bg-gray-50 focus:bg-white ${
            error ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
          }`}
        />
      )}
      {error && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠</span>{error}</p>}
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
/* ── View Profile Modal ───────────────────────────────────────────── */
function ViewProfileModal({ profile, onClose }: { profile: any; onClose: () => void }) {
  const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | number | null }) =>
    value ? (
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-[#1C3B35]/8 flex items-center justify-center flex-shrink-0 mt-0.5">{icon}</div>
        <div>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-sm text-gray-800 font-medium mt-0.5">{String(value)}</p>
        </div>
      </div>
    ) : null;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
    const hasContent = React.Children.toArray(children).some((c: any) => c !== null && c !== false && c !== undefined);
    if (!hasContent) return null;
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-[#F0F4F2] border-b border-gray-100">
          <h3 className="text-xs font-bold text-[#1C3B35] uppercase tracking-wider">{title}</h3>
        </div>
        <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
      </div>
    );
  };

  const initial = (profile.name || '?')[0].toUpperCase();
  const age = profile.dateOfBirth
    ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  const iconCls = 'w-3.5 h-3.5 text-[#1C3B35]';

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-3 sm:p-6 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose}>
      <div className="w-full max-w-2xl my-auto" onClick={e => e.stopPropagation()}>
        {/* Header card */}
        <div className="bg-[#1C3B35] rounded-t-3xl px-6 pt-6 pb-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-white">{initial}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{profile.name}</h2>
                {profile.memberId && <p className="text-xs text-white/60 font-mono mt-0.5">{profile.memberId}</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  {age && <span className="text-xs text-white/70">{age} yrs</span>}
                  {profile.gender && <span className="text-xs bg-white/15 text-white/80 px-2 py-0.5 rounded-full capitalize">{profile.gender.toLowerCase()}</span>}
                  {profile.status && <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    profile.status === 'ACTIVE' ? 'bg-green-400/20 text-green-200' : 'bg-white/10 text-white/60'
                  }`}>{profile.status.replace('_', ' ')}</span>}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="bg-gray-50 rounded-b-3xl px-4 py-4 space-y-3">
          <Section title="Personal Details">
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>} label="Created By" value={profile.createdBy} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>} label="Date of Birth" value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>} label="Height" value={profile.height ? `${profile.height} cm` : null} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>} label="Appearance" value={profile.appearance} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>} label="Complexion" value={profile.complexion} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h0a2.5 2.5 0 002.5 2.5h0A2.5 2.5 0 0115.5 13"/></svg>} label="Ethnicity" value={profile.ethnicity} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>} label="Dress Code" value={profile.dressCode} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>} label="Civil Status" value={profile.civilStatus} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>} label="Children" value={profile.children} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>} label="Family Status" value={profile.familyStatus} />
          </Section>

          <Section title="Location & Education">
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>} label="Country" value={profile.country} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>} label="State / Province" value={profile.state} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>} label="City" value={profile.city} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 2l3 6.3L22 9.3l-5 4.9 1.2 6.9L12 18l-6.2 3.1L7 14.2 2 9.3l7-1z"/></svg>} label="Residency Status" value={profile.residencyStatus} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>} label="Education" value={profile.education} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 2l3 6.3L22 9.3l-5 4.9 1.2 6.9L12 18l-6.2 3.1L7 14.2 2 9.3l7-1z"/></svg>} label="Field of Study" value={profile.fieldOfStudy} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>} label="Occupation" value={profile.occupation} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>} label="Profession / Job Title" value={profile.profession} />
          </Section>

          <Section title="Family Details">
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>} label="Father's Ethnicity" value={profile.fatherEthnicity} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/></svg>} label="Father's Country" value={profile.fatherCountry} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>} label="Father's Occupation" value={profile.fatherOccupation} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>} label="Father's City" value={profile.fatherCity} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} label="Mother's Ethnicity" value={profile.motherEthnicity} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/></svg>} label="Mother's Country" value={profile.motherCountry} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>} label="Mother's Occupation" value={profile.motherOccupation} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>} label="Mother's City" value={profile.motherCity} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>} label="Total Siblings" value={profile.siblings != null ? `${profile.siblings}` : null} />
          </Section>

          <Section title="Additional Information">
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>} label="About Me" value={profile.aboutUs} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"/></svg>} label="Expectations" value={profile.expectations} />
          </Section>

          <button onClick={onClose}
            className="w-full mt-1 bg-[#1C3B35] text-white text-sm font-semibold py-3 rounded-2xl hover:bg-[#15302a] transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [initiating, setInitiating] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  // Privacy per-profile: { [profileId]: { showRealName, nickname, saving } }
  const [privacy, setPrivacy] = useState<Record<string, { showRealName: boolean; nickname: string; saving: boolean }>>({}); 
  // Boost per-profile: { [profileId]: { boosting, boostExpiresAt } }
  const [boost, setBoost] = useState<Record<string, { boosting: boolean; boostExpiresAt?: string | null }>>({});
  const [boostPlans, setBoostPlans] = useState<any[]>([
    { durationDays: 10, price: 4.99, name: '10 Days', description: 'Top listing for 10 days' },
    { durationDays: 15, price: 7.99, name: '15 Days', description: 'Top listing for 15 days' },
    { durationDays: 30, price: 14.99, name: '30 Days', description: 'Top listing for 30 days' },
  ]);

  const showToast = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 6000);
  };

  const load = () => {
    setLoading(true);
    profileApi.getMyProfiles().then((r) => setProfiles(r.data ?? [])).finally(() => setLoading(false));
    packagesApi.getActive('BOOST').then((r) => {
      if (r.data && r.data.length > 0) {
        setBoostPlans(r.data);
      }
    }).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  // Initialise privacy state from loaded profiles
  useEffect(() => {
    const initP: Record<string, { showRealName: boolean; nickname: string; saving: boolean }> = {};
    const initB: Record<string, { boosting: boolean; boostExpiresAt?: string | null }> = {};
    profiles.forEach(p => {
      initP[p.id] = { showRealName: p.showRealName ?? true, nickname: p.nickname ?? '', saving: false };
      initB[p.id] = { boosting: false, boostExpiresAt: p.boostExpiresAt ?? null };
    });
    setPrivacy(initP);
    setBoost(initB);
  }, [profiles]);

  const purchaseBoost = async (profileId: string, days: number) => {
    const plan = boostPlans.find(p => p.durationDays === days);
    if (!plan) return;
    const price = plan.price;

    setBoost(prev => ({ ...prev, [profileId]: { ...prev[profileId], boosting: true } }));
    try {
      await paymentApi.initiate({
        childProfileId: profileId,
        amount: price,
        method: 'GATEWAY',
        purpose: 'BOOST',
        days: days
      });
      showToast(`Boost payment initiated for ${days} days! Admin will approve shortly.`);
      load();
    } catch (e: any) {
      showToast(e.message ?? 'Failed to initiate boost payment', false);
    } finally {
      setBoost(prev => ({ ...prev, [profileId]: { ...prev[profileId], boosting: false } }));
    }
  };

  const savePrivacy = async (profileId: string) => {
    const ps = privacy[profileId];
    if (!ps) return;
    setPrivacy(prev => ({ ...prev, [profileId]: { ...prev[profileId], saving: true } }));
    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api';
      const token = localStorage.getItem('mn_token');
      const res = await fetch(`${BASE}/profile/privacy/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ showRealName: ps.showRealName, nickname: ps.nickname }),
      });
      if (!res.ok) throw new Error('Failed');
      showToast('Privacy settings saved!');
      load();
    } catch {
      showToast('Failed to save privacy settings', false);
    } finally {
      setPrivacy(prev => ({ ...prev, [profileId]: { ...prev[profileId], saving: false } }));
    }
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

      <div className="font-poppins space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[34px] xl:text-[37px] 2xl:text-[40px] font-poppins font-medium text-[#121514]">My Profiles</h1>
            <p className="text-[#121514AD]/68 title-sub-top mt-0.5">Manage your family members' matrimonial profiles</p>
          </div>
          <button onClick={() => router.push('/dashboard/create-profile')}
            className="text-sm bg-[#1C3B35] cursor-pointer text-white px-5 py-2.5 rounded-xl hover:bg-[#15302a]/90 transition font-semibold flex items-center gap-2">
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
            <button onClick={() => router.push('/dashboard/create-profile')}
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
                <div className="px-5 py-4 space-y-3">

                  {/* Gender avatar */}
                  <div className="flex items-center gap-3 py-1">
                    {p.gender === 'MALE' ? (
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="7" r="4" />
                            <path d="M12 13c-5 0-8 2.5-8 4v1h16v-1c0-1.5-3-4-8-4z" />
                            <path d="M18 2h4v4M18 2l4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Gender</p>
                          <p className="text-sm font-semibold text-blue-600">Male</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-rose-500" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="7" r="4" />
                            <path d="M12 13c-5 0-8 2.5-8 4v1h16v-1c0-1.5-3-4-8-4z" />
                            <path d="M12 17v4M10 19h4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Gender</p>
                          <p className="text-sm font-semibold text-rose-500">Female</p>
                        </div>
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

                  {/* ── Profile Status Selector ──────────────────────── */}
                  {['ACTIVE', 'PAUSED', 'INACTIVE'].includes(p.status) && (
                    <div className="mt-3 border border-gray-100 rounded-xl bg-gray-50 px-4 py-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Profile Visibility</p>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { value: 'ACTIVE',   label: 'Active',   dot: 'bg-green-500',  ring: 'ring-green-400',  text: 'text-green-700',  bg: 'bg-green-50',  desc: 'Visible in search' },
                          { value: 'PAUSED',   label: 'Paused',   dot: 'bg-amber-400',  ring: 'ring-amber-400',  text: 'text-amber-700',  bg: 'bg-amber-50',  desc: 'Temporarily hidden' },
                          { value: 'INACTIVE', label: 'Inactive', dot: 'bg-red-400',    ring: 'ring-red-400',    text: 'text-red-700',    bg: 'bg-red-50',    desc: 'Not participating' },
                        ] as const).map(opt => {
                          const isCurrent = p.status === opt.value;
                          const isLoading = statusUpdating === p.id;
                          return (
                            <button
                              key={opt.value}
                              disabled={isCurrent || isLoading}
                              onClick={async () => {
                                setStatusUpdating(p.id);
                                try {
                                  const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api';
                                  const token = localStorage.getItem('mn_token');
                                  const res = await fetch(`${BASE}/profile/status/${p.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                    body: JSON.stringify({ status: opt.value }),
                                  });
                                  if (!res.ok) throw new Error('Failed');
                                  showToast(`Profile status changed to ${opt.label}`);
                                  load();
                                } catch {
                                  showToast('Failed to update status', false);
                                } finally {
                                  setStatusUpdating(null);
                                }
                              }}
                              className={`relative flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 text-center transition-all ${
                                isCurrent
                                  ? `border-current ${opt.ring} ring-2 ring-offset-1 ${opt.bg} ${opt.text}`
                                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white disabled:opacity-50'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${isCurrent ? opt.dot : 'bg-gray-300'}`} />
                              <span className="text-[10px] font-bold leading-tight">{opt.label}</span>
                              <span className="text-[9px] leading-tight opacity-70">{opt.desc}</span>
                              {isLoading && isCurrent === false && statusUpdating === p.id && (
                                <span className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
                                  <svg className="w-3 h-3 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                  </svg>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}


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

                {/* ── Boost Your Profile ─────────────────────────── */}
                {p.status === 'ACTIVE' && boost[p.id] && (
                  <div className="mx-3 mb-4 rounded-2xl border border-[#DB9D30]/30 bg-gradient-to-br from-[#FFFBF0] to-[#FFF8E7] p-3 sm:p-4">
                    {/* Header */}
                    <div className="flex flex-wrap items-start gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-[#DB9D30] text-base flex-shrink-0">⚡</span>
                        <div className="min-w-0">
                          <p className="text-[12px] sm:text-[13px] font-bold text-[#8B5E00] font-poppins leading-tight">Boost Your Profile</p>
                          <p className="text-[9px] sm:text-[10px] text-[#A07830] font-poppins leading-tight">Appear at the top with a gold VIP badge</p>
                        </div>
                      </div>
                      {boost[p.id].boostExpiresAt && new Date(boost[p.id].boostExpiresAt!) > new Date() && (
                        <span className="inline-flex items-center gap-1 bg-[#DB9D30] text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-sm flex-shrink-0">
                          ✦ ACTIVE VIP
                        </span>
                      )}
                    </div>

                    {/* Active boost info */}
                    {boost[p.id].boostExpiresAt && new Date(boost[p.id].boostExpiresAt!) > new Date() ? (
                      <div className="bg-[#DB9D30]/10 rounded-xl px-3 py-2 text-[11px] text-[#8B5E00] font-poppins">
                        ✦ VIP boost active until{' '}
                        <strong>{new Date(boost[p.id].boostExpiresAt!).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                        {boostPlans.map((plan, idx) => {
                          const popular = idx === 1; // Middle one is popular styling
                          return (
                          <div key={plan.id ?? plan.durationDays} className={`relative rounded-xl border-2 p-2 sm:p-3 text-center cursor-pointer transition-all ${
                            popular
                              ? 'border-[#DB9D30] bg-[#DB9D30]/8 shadow-sm'
                              : 'border-[#DB9D30]/25 bg-white hover:border-[#DB9D30]/60'
                          }`}>
                            {popular && (
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#DB9D30] text-white text-[7px] sm:text-[8px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                                POPULAR
                              </span>
                            )}
                            <p className="text-[9px] sm:text-[11px] font-bold text-[#8B5E00] font-poppins leading-tight">{plan.name}</p>
                            <p className="text-[13px] sm:text-[16px] font-extrabold text-[#DB9D30] font-poppins mt-0.5 leading-tight">${plan.price}</p>
                            <p className="hidden sm:block text-[9px] text-[#A07830] font-poppins mt-0.5 leading-tight">{plan.description || `Top listing for ${plan.durationDays} days`}</p>
                            <button
                              onClick={() => purchaseBoost(p.id, plan.durationDays)}
                              disabled={boost[p.id]?.boosting}
                              className={`mt-1.5 sm:mt-2 w-full py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold font-poppins transition-all disabled:opacity-50 ${
                                plan.popular
                                  ? 'bg-[#DB9D30] text-white hover:bg-[#c98b26] shadow-sm'
                                  : 'bg-[#DB9D30]/15 text-[#8B5E00] hover:bg-[#DB9D30]/30 border border-[#DB9D30]/30'
                              }`}
                            >
                              {boost[p.id]?.boosting ? (
                                <span className="flex items-center justify-center gap-1">
                                  <svg className="w-2 h-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                  </svg>
                                </span>
                              ) : '⚡ Boost'}
                            </button>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

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
                    {/* View Details button */}
                    <button
                      onClick={() => router.push(`/dashboard/profiles/${p.id}`)}
                      className="text-xs border border-gray-200 text-gray-600 px-3.5 py-2 rounded-lg hover:bg-[#1C3B35]/5 hover:border-[#1C3B35] hover:text-[#1C3B35] transition font-semibold flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                      View Details
                    </button>
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
