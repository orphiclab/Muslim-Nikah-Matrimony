'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { profileApi, paymentApi, packagesApi, settingsApi } from '@/services/api';
import { useCurrency } from '@/hooks/useCurrency';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';

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

/**
 * Returns true if the profile's subscription is expired.
 * Checks BOTH the backend status field AND the end date,
 * because the backend may still return 'ACTIVE' after the date passes.
 */
function isSubExpired(p: any): boolean {
  if (!p.subscription) return false;
  // If user has paid and is waiting for admin approval, do NOT show as expired
  if (p.status === 'PAYMENT_PENDING') return false;
  if (p.subscription.status === 'EXPIRED') return true;
  if (p.subscription.endDate && new Date(p.subscription.endDate) < new Date()) return true;
  return false;
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
        <div className="bg-[#1C3B35] rounded-t-3xl px-6 pt-6 pb-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-white/30">
                <ProfileAvatar gender={profile.gender} name={profile.name} className="w-full h-full" size={56} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{profile.name}</h2>
                {profile.memberId && <p className="text-xs text-white/60 font-mono mt-0.5">{profile.memberId}</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  {age && <span className="text-xs text-white/70">{age} yrs</span>}
                  {profile.gender && <span className="text-xs bg-white/15 text-white/80 px-2 py-0.5 rounded-full capitalize">{profile.gender.toLowerCase()}</span>}
                  {profile.status && <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${profile.status === 'ACTIVE' ? 'bg-green-400/20 text-green-200' : 'bg-white/10 text-white/60'}`}>{profile.status.replace('_', ' ')}</span>}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <div className="bg-gray-50 rounded-b-3xl px-4 py-4 space-y-3">
          <Section title="Personal Details">
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>} label="Created By" value={profile.createdBy} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>} label="Date of Birth" value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>} label="Height" value={profile.height ? `${profile.height} cm` : null} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>} label="Weight" value={profile.weight ? `${profile.weight} kg` : null} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>} label="Appearance" value={profile.appearance} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>} label="Complexion" value={profile.complexion} />
            <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945"/></svg>} label="Ethnicity" value={profile.ethnicity} />
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
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<Record<string, { showRealName: boolean; nickname: string; saving: boolean }>>({});
  const [boost, setBoost] = useState<Record<string, { boosting: boolean; boostExpiresAt?: string | null }>>({});
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [boostCurrency, setBoostCurrency] = useState<'LKR' | 'USD'>('LKR');
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
    paymentApi.myPayments().then((r) => setPayments(r.data ?? [])).catch(() => {});
    packagesApi.getActive('BOOST').then((r) => {
      if (r.data && r.data.length > 0) setBoostPlans(r.data);
    }).catch(() => {});
    settingsApi.get().then((r) => setSiteSettings(r)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

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

  const goToBoostPayment = (profileId: string, profileName: string, memberId: string, plan: any, currency: 'LKR' | 'USD') => {
    const amount = currency === 'USD' && plan.usdPrice != null ? plan.usdPrice : plan.price;
    const params = new URLSearchParams({
      profileId,
      profileName,
      memberId,
      planId:   plan.id ?? '',
      planName: plan.name ?? `${plan.durationDays} Day Boost`,
      days:     String(plan.durationDays),
      amount:   String(amount),
      currency,
    });
    router.push(`/boost-payment?${params.toString()}`);
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
            <p className="text-[#121514AD]/68 title-sub-top mt-0.5">Manage your family members&apos; matrimonial profiles</p>
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
              <div key={p.id} className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-shadow ${
                  isSubExpired(p) ? 'border-red-200 opacity-90' : 'border-gray-100'
                }`}>
                {/* Expired subscription notice strip */}
                {isSubExpired(p) && (
                  <div className="bg-red-600 text-white text-[10px] font-bold text-center py-1.5 tracking-widest uppercase flex items-center justify-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Subscription Expired — Hidden from public
                  </div>
                )}
                {/* Card header */}
                <div className={`px-5 py-4 border-b border-gray-50 flex items-center justify-between ${
                  isSubExpired(p) ? 'bg-red-50' :
                  p.status === 'ACTIVE' ? 'bg-green-50' :
                  p.status === 'PAYMENT_PENDING' ? 'bg-amber-50' :
                  p.status === 'DRAFT' && p.rejectionReason ? 'bg-red-50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <ProfileAvatar gender={p.gender} name={p.name} className="w-full h-full" size={40} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{p.name}</p>
                      {p.memberId && <p className="text-xs text-gray-400 font-mono">{p.memberId}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* View count badge */}
                    {(p.viewCount ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                        {p.viewCount}
                      </span>
                    )}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isSubExpired(p) ? 'bg-red-100 text-red-700' : statusBadge(p.status)
                    }`}>
                      {isSubExpired(p) ? 'EXPIRED' : p.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-5 py-4 space-y-3">
                  {/* Gender */}
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

                  {/* Subscription info — only shown when active, not date-expired, and not awaiting admin review */}
                  {p.subscription && p.subscription.status === 'ACTIVE' && !isSubExpired(p) && p.status !== 'PAYMENT_PENDING' && (
                    <div className="mt-2 rounded-lg px-3 py-2 text-xs flex items-center justify-between bg-green-50 text-green-700">
                      <span>Subscription: <strong>ACTIVE</strong></span>
                      {p.subscription.endDate && (
                        <span className="text-[10px] opacity-70">Expires {new Date(p.subscription.endDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  )}

                  {/* Payment pending — awaiting admin review notice */}
                  {p.status === 'PAYMENT_PENDING' && (
                    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-amber-800">Awaiting Admin Review</p>
                        <p className="text-[11px] text-amber-600 mt-0.5 leading-relaxed">
                          Your payment has been received. Your profile will be activated once the admin approves it.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Expired subscription — prominent banner */}
                  {isSubExpired(p) && (
                    <div className="mt-2 rounded-2xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-red-100 px-4 py-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-200 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-red-700">Subscription Expired</p>
                          {p.subscription.endDate && (
                            <p className="text-xs text-red-500 mt-0.5">
                              Expired on {new Date(p.subscription.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                          <p className="text-xs text-red-400 mt-1 leading-relaxed">
                            This profile is <strong>hidden</strong> from the public listing. Renew your subscription to make it visible again.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/select-plan?profileId=${p.id}`)}
                        className="w-full font-bold bg-red-600 text-white px-4 py-2.5 rounded-xl hover:bg-red-700 active:scale-[0.98] transition flex items-center justify-center gap-2 text-sm shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Re-Activate Subscription
                      </button>
                    </div>
                  )}

                  {/* Profile Status Selector (ACTIVE/PAUSED/INACTIVE only, hidden if subscription expired) */}
                  {['ACTIVE', 'PAUSED', 'INACTIVE'].includes(p.status) && !isSubExpired(p) && (
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
                              {isLoading && !isCurrent && statusUpdating === p.id && (
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



                </div>

                {/* Boost Your Profile (ACTIVE only, not expired) */}
                {p.status === 'ACTIVE' && boost[p.id] && !isSubExpired(p) && (
                  <div className="mx-3 mb-4 rounded-2xl border border-[#DB9D30]/30 bg-gradient-to-br from-[#FFFBF0] to-[#FFF8E7] p-3 sm:p-4">
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

                    {(() => {
                      // Check for a pending boost payment — block re-boosting until admin approves
                      const pendingBoost = payments.find(
                        pay => pay.childProfileId === p.id && pay.purpose === 'BOOST' && pay.status === 'PENDING'
                      );

                      if (pendingBoost) {
                        return (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-amber-800">Boost Payment Pending</p>
                              <p className="text-[11px] text-amber-600 mt-0.5 leading-relaxed">
                                Your boost payment has been received and is awaiting admin approval. Your profile will be boosted once it's confirmed.
                              </p>
                            </div>
                          </div>
                        );
                      }

                      if (boost[p.id].boostExpiresAt && new Date(boost[p.id].boostExpiresAt!) > new Date()) {
                        return (
                          <div className="bg-[#DB9D30]/10 rounded-xl px-3 py-2 text-[11px] text-[#8B5E00] font-poppins">
                            ✦ VIP boost active until{' '}
                            <strong>{new Date(boost[p.id].boostExpiresAt!).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                          </div>
                        );
                      }
                      return (
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                        {/* Currency toggle */}
                        <div className="col-span-3 flex items-center justify-between mb-1">
                          <p className="text-[10px] text-[#A07830] font-semibold uppercase tracking-wide">Select Currency</p>
                          <div className="inline-flex rounded-full border border-[#DB9D30]/40 overflow-hidden bg-white">
                            {(['LKR', 'USD'] as const).map(cur => (
                              <button
                                key={cur}
                                onClick={() => setBoostCurrency(cur)}
                                className={`px-3 py-1 text-[10px] font-bold transition-all ${
                                  boostCurrency === cur
                                    ? 'bg-[#DB9D30] text-white'
                                    : 'text-[#A07830] hover:bg-[#DB9D30]/10'
                                }`}
                              >
                                {cur === 'LKR' ? '🇱🇰 LKR' : '🇺🇸 USD'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {boostPlans.map((plan, idx) => {
                          const popular = plan.isPopular ?? idx === 1;
                          // Pick price based on currency
                          const hasUsd = boostCurrency === 'USD' && plan.usdPrice != null;
                          const displayPrice = hasUsd ? plan.usdPrice : plan.price;
                          const displayOrig  = hasUsd ? plan.usdOriginalPrice : plan.originalPrice;
                          const symbol       = hasUsd ? '$' : 'Rs.';
                          const payAmount    = hasUsd ? (plan.usdPrice ?? plan.price) : plan.price;
                          return (
                            <div key={plan.id ?? plan.durationDays} className={`relative rounded-xl border-2 p-2 sm:p-3 text-center cursor-pointer transition-all ${
                              popular ? 'border-[#DB9D30] bg-[#DB9D30]/8 shadow-sm' : 'border-[#DB9D30]/25 bg-white hover:border-[#DB9D30]/60'
                            }`}>
                              {popular && (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#DB9D30] text-white text-[7px] sm:text-[8px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                                  POPULAR
                                </span>
                              )}
                              <p className="text-[9px] sm:text-[11px] font-bold text-[#8B5E00] font-poppins leading-tight">{plan.name}</p>
                              {/* Sale price */}
                              <p className="text-[13px] sm:text-[16px] font-extrabold text-[#DB9D30] font-poppins mt-0.5 leading-tight">
                                {symbol} {Number(displayPrice).toFixed(2)}
                              </p>
                              {/* Strikethrough original */}
                              {displayOrig != null && displayOrig > displayPrice && (
                                <p className="text-[9px] text-[#A07830]/60 line-through leading-tight">
                                  {symbol} {Number(displayOrig).toFixed(2)}
                                </p>
                              )}
                              <p className="hidden sm:block text-[9px] text-[#A07830] font-poppins mt-0.5 leading-tight">{plan.description || `Top listing for ${plan.durationDays} days`}</p>
                              <button
                                onClick={() => goToBoostPayment(p.id, p.name ?? '', p.memberId ?? '', plan, boostCurrency)}
                                disabled={boost[p.id]?.boosting}
                                className={`mt-1.5 sm:mt-2 w-full py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold font-poppins transition-all disabled:opacity-50 ${
                                  popular
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
                      );
                    })()}
                  </div>
                )}

                {/* Card footer */}
                <div className="px-5 py-3 border-t border-gray-50">

                  {/* ── Rejection reason notice (DRAFT with rejectionReason = subscription rejected) ── */}
                  {p.status === 'DRAFT' && p.rejectionReason && (
                    <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 space-y-1.5">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <div>
                          <p className="text-xs font-bold text-red-700">
                            {p.rejectionReason === 'Payment not received' ? 'Payment Rejected' : 'Profile Rejected'}
                          </p>
                          <p className="text-xs text-red-600 leading-relaxed mt-0.5">{p.rejectionReason}</p>
                        </div>
                      </div>
                      {p.rejectionReason === 'Payment not received' ? (
                        <p className="text-[11px] text-red-400 pl-6">Please re-submit your payment to activate this profile.</p>
                      ) : (
                        <p className="text-[11px] text-red-400 pl-6">Please contact the admin to resolve this issue.</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-2 flex-wrap">

                      {/* Subscription expired → Re-Activate only */}
                      {isSubExpired(p) && (
                        <button
                          onClick={() => router.push(`/select-plan?profileId=${p.id}`)}
                          className="text-xs bg-red-600 text-white px-3.5 py-2 rounded-lg hover:bg-red-700 transition font-semibold flex items-center gap-1.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Re-Activate Subscription
                        </button>
                      )}

                      {/* DRAFT / EXPIRED → redirect to payment page */}
                      {!isSubExpired(p) && (p.status === 'DRAFT' || p.status === 'EXPIRED') && (
                        p.rejectionReason && p.rejectionReason !== 'Payment not received' ? (
                          /* Custom rejection reason → contact admin via WhatsApp */
                          <a
                            href={`https://wa.me/${(siteSettings?.whatsappContact ?? '').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs bg-green-600 text-white px-3.5 py-2 rounded-lg hover:bg-green-700 transition font-semibold flex items-center gap-1.5">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Contact Admin on WhatsApp
                          </a>
                        ) : (
                          /* Normal DRAFT or 'Payment not received' → Re-Activate / Activate */
                          <button
                            onClick={() => router.push(`/select-plan?profileId=${p.id}`)}
                            className="text-xs bg-[#1C3B35] text-white px-3.5 py-2 rounded-lg hover:bg-[#15302a] transition font-semibold flex items-center gap-1.5">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
                            </svg>
                            {p.status === 'EXPIRED' ? 'Renew' : (p.rejectionReason ? 'Re-Activate' : 'Activate')}
                          </button>
                        )
                      )}



                      {/* ACTIVE → Chat button */}
                      {p.status === 'ACTIVE' && (
                        <a href="/dashboard/chat"
                          className="text-xs border border-[#1C3B35] text-[#1C3B35] px-3.5 py-2 rounded-lg hover:bg-[#1C3B35]/5 transition font-semibold flex items-center gap-1.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          Chat
                        </a>
                      )}

                      {/* View Details */}
                      <button
                        onClick={() => router.push(`/dashboard/profiles/${p.id}`)}
                        className="text-xs border border-gray-200 text-gray-600 px-3.5 py-2 rounded-lg hover:bg-[#1C3B35]/5 hover:border-[#1C3B35] hover:text-[#1C3B35] transition font-semibold flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                        View Details
                      </button>

                      {/* Privacy Settings */}
                      {!isSubExpired(p) && p.status !== 'PAYMENT_PENDING' && (
                        <button
                          onClick={() => router.push(`/dashboard/profiles/privacy/${p.id}`)}
                          className="text-xs border border-gray-200 text-gray-600 px-3.5 py-2 rounded-lg hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition font-semibold flex items-center gap-1.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          </svg>
                          Privacy
                        </button>
                      )}
                    </div>

                    {/* Delete */}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
