'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { profileApi } from '@/services/api';
import Link from 'next/link';

/* ─── Toggle ─────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1C3B35] ${checked ? 'bg-[#1C3B35]' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

/* ─── Section header ──────────────────────────────────────────────────── */
function SectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-xl bg-[#EAF2EE] flex items-center justify-center shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ─── Privacy Row ────────────────────────────────────────────────────── */
function PrivacyRow({
  icon, title, description, checked, onChange, locked, lockedReason,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange?: () => void;
  locked?: boolean;
  lockedReason?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 py-4 border-b border-gray-50 last:border-0 ${locked ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">{icon}</div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-800">{title}</p>
            {locked && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                Always Visible
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{lockedReason ?? description}</p>
        </div>
      </div>
      <div className="shrink-0">
        {locked
          ? <div className="h-7 w-12 rounded-full bg-[#1C3B35] relative flex items-center"><span className="absolute right-1 h-5 w-5 rounded-full bg-white shadow-sm" /></div>
          : <Toggle checked={checked} onChange={onChange!} />
        }
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function PrivacySettingsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [settings, setSettings] = useState({
    showAge: true,          // always true (locked)
    showGender: true,       // always true (locked)
    showCountry: true,
    showCity: true,
    showEducation: true,
    showOccupation: true,
    showEthnicity: true,
    showCivilStatus: true,
    showHeight: true,
    showWeight: true,
    showDressCode: true,
    showFamilyDetails: true,
    showAbout: true,
    showExpectations: true,
  });

  useEffect(() => {
    profileApi.getMyProfiles().then((r) => {
      const p = (r.data ?? []).find((x: any) => x.id === id);
      if (!p) { router.push('/dashboard/profiles'); return; }
      setProfile(p);
      setSettings({
        showAge:           true,
        showGender:        true,
        showCountry:       p.showCountry       ?? true,
        showCity:          p.showCity          ?? true,
        showEducation:     p.showEducation     ?? true,
        showOccupation:    p.showOccupation    ?? true,
        showEthnicity:     p.showEthnicity     ?? true,
        showCivilStatus:   p.showCivilStatus   ?? true,
        showHeight:        p.showHeight        ?? true,
        showWeight:        p.showWeight        ?? true,
        showDressCode:     p.showDressCode     ?? true,
        showFamilyDetails: p.showFamilyDetails ?? true,
        showAbout:         p.showAbout         ?? true,
        showExpectations:  p.showExpectations  ?? true,
      });
    }).catch(() => router.push('/dashboard/profiles'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const toggle = (key: keyof typeof settings) => {
    if (key === 'showAge' || key === 'showGender') return; // locked
    setSettings(s => ({ ...s, [key]: !(s as any)[key] }));
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api';
      const token = localStorage.getItem('mn_token');
      const res = await fetch(`${BASE}/profile/privacy/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save.');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save privacy settings.');
    } finally {
      setSaving(false);
    }
  };

  const iconCls = 'w-4 h-4 text-[#1C3B35]';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="w-6 h-6 animate-spin text-[#1C3B35]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );

  const initial = (profile?.name || '?')[0].toUpperCase();

  return (
    <div className="font-poppins space-y-6 max-w-2xl">

      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <Link href="/dashboard/profiles" className="hover:text-[#1C3B35] transition font-medium">My Profiles</Link>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
          <span className="text-gray-600 font-semibold">Privacy Settings</span>
        </div>

        {/* Profile identity strip */}
        <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-[#1C3B35] flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-white">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900">{profile?.name}</p>
            {profile?.memberId && <p className="text-xs text-gray-400 font-mono">{profile.memberId}</p>}
          </div>
          <div className="flex items-center gap-1.5 bg-[#EAF2EE] text-[#1C3B35] px-3 py-1.5 rounded-xl">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            <span className="text-xs font-bold">Privacy Control</span>
          </div>
        </div>
      </div>

      {/* Saved / Error banners */}
      {saved && (
        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-semibold">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
          Privacy settings saved successfully!
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {error}
        </div>
      )}


      {/* Profile Fields Privacy */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-[#F0F4F2] border-b border-gray-100">
          <SectionHeader
            icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
            title="Profile Field Visibility"
            description="Choose which details are visible to other members. Age and gender are always shown."
          />
        </div>
        <div className="px-5">
          <PrivacyRow
            icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>}
            title="Age"
            description="Your age calculated from date of birth"
            checked={true}
            locked
            lockedReason="Age is always visible to members — this cannot be hidden"
          />
          <PrivacyRow
            icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>}
            title="Gender"
            description="Male / Female"
            checked={true}
            locked
            lockedReason="Gender is always visible to members — this cannot be hidden"
          />
          <PrivacyRow
            icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>}
            title="Country"
            description="Your country of residence"
            checked={settings.showCountry}
            onChange={() => toggle('showCountry')}
          />
          <PrivacyRow
            icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>}
            title="City"
            description="Your city"
            checked={settings.showCity}
            onChange={() => toggle('showCity')}
          />
          <PrivacyRow
            icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>}
            title="Education"
            description="Your education level and field of study"
            checked={settings.showEducation}
            onChange={() => toggle('showEducation')}
          />
          <PrivacyRow
            icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>}
            title="Occupation"
            description="Your occupation and job title"
            checked={settings.showOccupation}
            onChange={() => toggle('showOccupation')}
          />
          <PrivacyRow
            icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945" /><path d="M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064" /></svg>}
            title="Ethnicity"
            description="Your ethnic background"
            checked={settings.showEthnicity}
            onChange={() => toggle('showEthnicity')}
          />
          <PrivacyRow
            icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>}
            title="Civil Status"
            description="Married, Divorced, Widowed, etc."
            checked={settings.showCivilStatus}
            onChange={() => toggle('showCivilStatus')}
          />
          <PrivacyRow
            icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" /></svg>}
            title="Height"
            description="Your height in cm"
            checked={settings.showHeight}
            onChange={() => toggle('showHeight')}
          />
          <PrivacyRow
            icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>}
            title="Weight"
            description="Your weight in kg"
            checked={settings.showWeight}
            onChange={() => toggle('showWeight')}
          />
          <PrivacyRow
            icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>}
            title="Dress Code"
            description="Your preferred dress code"
            checked={settings.showDressCode}
            onChange={() => toggle('showDressCode')}
          />
          <PrivacyRow
            icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}
            title="Family Details"
            description="Father's and mother's details"
            checked={settings.showFamilyDetails}
            onChange={() => toggle('showFamilyDetails')}
          />
          <PrivacyRow
            icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>}
            title="About Me"
            description="Your personal bio"
            checked={settings.showAbout}
            onChange={() => toggle('showAbout')}
          />
          <PrivacyRow
            icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>}
            title="Expectations"
            description="What you're looking for in a partner"
            checked={settings.showExpectations}
            onChange={() => toggle('showExpectations')}
          />
        </div>
      </div>

      {/* Info note */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-800">About Privacy Settings</p>
          <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
            Hiding a field means it will not appear on your public profile. You can update these settings at any time.
            Age and gender are always shown to help members find compatible matches.
          </p>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-[#1C3B35] text-white text-sm font-bold py-3.5 rounded-2xl hover:bg-[#15302a] transition shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
              Saving…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
              Save Privacy Settings
            </>
          )}
        </button>
        <Link href="/dashboard/profiles"
          className="px-5 py-3.5 border border-gray-200 text-sm font-semibold text-gray-600 rounded-2xl hover:bg-gray-50 transition text-center">
          Cancel
        </Link>
      </div>
    </div>
  );
}
