'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { profileApi } from '@/services/api';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';

/* ── helpers ─────────────────────────────────────────────────────────── */
const statusConfig: Record<string, { label: string; cls: string }> = {
  ACTIVE:          { label: 'Active',          cls: 'bg-green-100 text-green-700' },
  PAUSED:          { label: 'Paused',          cls: 'bg-amber-100 text-amber-700' },
  INACTIVE:        { label: 'Inactive',        cls: 'bg-gray-100 text-gray-500' },
  DRAFT:           { label: 'Draft',           cls: 'bg-gray-100 text-gray-500' },
  PAYMENT_PENDING: { label: 'Payment Pending', cls: 'bg-yellow-100 text-yellow-700' },
  EXPIRED:         { label: 'Expired',         cls: 'bg-red-100 text-red-600' },
};

function calcAge(dob: string) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function fmtDateTime(dt: string) {
  try {
    return new Date(dt).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dt; }
}

/* ── sub-components ──────────────────────────────────────────────────── */
const iconCls = 'w-4 h-4 text-[#1C3B35] flex-shrink-0';

function InfoRow({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value?: string | number | null }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-[#1C3B35]/8 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-800 font-medium mt-0.5">{String(value)}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const nodes = Array.isArray(children) ? children : [children];
  const hasContent = nodes.some((c) => c !== null && c !== false && c !== undefined);
  if (!hasContent) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 bg-[#F0F4F2] border-b border-gray-100">
        <h3 className="text-xs font-bold text-[#1C3B35] uppercase tracking-wider">{title}</h3>
      </div>
      <div className="px-5 divide-y divide-gray-50 grid grid-cols-1 sm:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────────────────── */
export default function ProfileDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [views, setViews] = useState<any[]>([]);
  const [viewTotal, setViewTotal] = useState(0);
  const [viewsExpanded, setViewsExpanded] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    profileApi.getOne(params.id)
      .then((r) => setProfile(r.data ?? r))
      .catch((e) => setError(e.message ?? 'Failed to load profile'))
      .finally(() => setLoading(false));

    // Fetch who viewed this profile (auth-guarded on backend)
    profileApi.getProfileViews(params.id, 100)
      .then((r) => { setViews(r.data ?? []); setViewTotal(r.total ?? 0); })
      .catch(() => {}); // silently fail if not owner
  }, [params?.id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400 font-poppins">
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Loading profile…
    </div>
  );

  if (error || !profile) return (
    <div className="text-center py-16 font-poppins">
      <p className="text-red-500 mb-4">{error || 'Profile not found.'}</p>
      <button onClick={() => router.back()} className="text-sm text-[#1C3B35] underline">Go back</button>
    </div>
  );

  const age = calcAge(profile.dateOfBirth);
  const initial = (profile.name || '?')[0].toUpperCase();
  const status = statusConfig[profile.status] ?? { label: profile.status, cls: 'bg-gray-100 text-gray-500' };

  return (
    <div className="font-poppins space-y-6 max-w-4xl mx-auto">

      {/* ── Breadcrumb ──────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/dashboard/profiles" className="hover:text-[#1C3B35] transition">My Profiles</Link>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-gray-600 font-medium truncate">{profile.name}</span>
      </nav>

      {/* ── Hero header card ─────────────────────────────────────────── */}
      <div className="rounded-3xl overflow-hidden shadow-sm border border-white/50">
        {/* teal top strip */}
        <div className="bg-gradient-to-br from-[#1C3B35] to-[#2d6352] px-6 pt-7 pb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="h-16 w-16 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-white/30">
                <ProfileAvatar gender={profile.gender} name={profile.name} className="w-full h-full" size={64} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">{profile.name}</h1>
                {profile.memberId && (
                  <p className="text-xs text-white/60 font-mono mt-0.5">{profile.memberId}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {age && <span className="text-xs text-white/70">{age} yrs</span>}
                  {profile.gender && (
                    <span className="text-xs bg-white/15 text-white/90 px-2 py-0.5 rounded-full capitalize">
                      {profile.gender === 'MALE' ? '♂ Male' : '♀ Female'}
                    </span>
                  )}
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${status.cls}`}>
                    {status.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <Link
                href={`/dashboard/profiles/${params?.id}/edit`}
                className="flex items-center gap-1.5 bg-white text-[#1C3B35] text-xs font-semibold px-3.5 py-2 rounded-xl transition hover:bg-white/90"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Link>
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="bg-[#F7F9F8] border-t border-[#1C3B35]/10 grid grid-cols-3 divide-x divide-gray-200">
          {[
            { label: 'Height', value: profile.height ? `${profile.height} cm` : '—' },
            { label: 'Weight', value: profile.weight ? `${profile.weight} kg` : '—' },
            { label: 'Civil Status', value: profile.civilStatus || '—' },
            { label: 'Country', value: profile.country || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 py-3 text-center">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
              <p className="text-sm font-bold text-[#1C3B35] mt-0.5 truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Detail sections ───────────────────────────────────────────── */}
      <Section title="Personal Details">
        <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>} label="Created By" value={profile.createdBy} />
        <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>} label="Date of Birth" value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined} />
        <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>} label="Height" value={profile.height ? `${profile.height} cm` : undefined} />
        <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>} label="Weight" value={profile.weight ? `${profile.weight} kg` : undefined} />
        <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>} label="Appearance" value={profile.appearance} />
        <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>} label="Complexion" value={profile.complexion} />
        <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945"/></svg>} label="Ethnicity" value={profile.ethnicity} />
        <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>} label="Dress Code" value={profile.dressCode} />
        <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>} label="Civil Status" value={profile.civilStatus} />
        <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>} label="Family Status" value={profile.familyStatus} />
      </Section>

      <Section title="Location & Education">
        <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>} label="Country" value={profile.country} />
        <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>} label="City" value={profile.city} />
        <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>} label="Resident Country" value={profile.residentCountry} />
        <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>} label="Resident City" value={profile.residentCity} />
        <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 2l3 6.3L22 9.3l-5 4.9 1.2 6.9L12 18l-6.2 3.1L7 14.2 2 9.3l7-1z"/></svg>} label="Residency Status" value={profile.residencyStatus} />
        <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>} label="Education" value={profile.education} />
        <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg>} label="Field of Study" value={profile.fieldOfStudy} />
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
        <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>} label="Total Siblings" value={profile.siblings != null ? String(profile.siblings) : undefined} />
      </Section>

      {(profile.minAgePreference || profile.maxAgePreference || profile.countryPreference || profile.minHeightPreference) && (
        <Section title="Partner Preferences">
          <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>} label="Min Age Preference" value={profile.minAgePreference} />
          <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>} label="Max Age Preference" value={profile.maxAgePreference} />
          <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>} label="Country Preference" value={profile.countryPreference} />
          <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>} label="Min Height Preference" value={profile.minHeightPreference ? `${profile.minHeightPreference} cm` : undefined} />
        </Section>
      )}

      {(profile.aboutUs || profile.expectations || profile.extraQualification) && (
        <Section title="About & Expectations">
          <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>} label="About Me" value={profile.aboutUs} />
          <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"/></svg>} label="Expectations" value={profile.expectations} />
          <InfoRow icon={<svg className={iconCls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>} label="Extra Qualification" value={profile.extraQualification} />
        </Section>
      )}

      {/* ── Who Viewed My Profile ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#1C3B35]/5 to-transparent border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#1C3B35]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <h3 className="text-xs font-bold text-[#1C3B35] uppercase tracking-wider">Who Viewed My Profile</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-[#1C3B35] text-white text-xs font-bold px-3 py-1 rounded-full">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              {viewTotal} {viewTotal === 1 ? 'view' : 'views'}
            </span>
          </div>
        </div>

        {/* Viewer list */}
        {views.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <p className="text-sm text-gray-400 font-medium">No views yet</p>
            <p className="text-xs text-gray-300 mt-1">When someone views your profile, it will appear here</p>
          </div>
        ) : (
          <div>
            <div className="divide-y divide-gray-50">
              {(viewsExpanded ? views : views.slice(0, 5)).map((v: any, i: number) => (
                <div key={v.id ?? i} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition">
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                    v.viewerGender === 'MALE' ? 'bg-blue-400' :
                    v.viewerGender === 'FEMALE' ? 'bg-pink-400' : 'bg-gray-300'
                  }`}>
                    {v.viewerGender === 'MALE' ? '♂' : v.viewerGender === 'FEMALE' ? '♀' : '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {v.viewerMemberId && (
                        <span className="text-sm font-semibold text-gray-700 font-mono">{v.viewerMemberId}</span>
                      )}
                      {v.viewerGender && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          v.viewerGender === 'MALE'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-pink-100 text-pink-600'
                        }`}>
                          {v.viewerGender === 'MALE' ? '♂ Male' : '♀ Female'}
                        </span>
                      )}
                    </div>
                    {v.viewerCountry && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">🌍 {v.viewerCountry}</p>
                    )}
                  </div>

                  {/* Date/time */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] text-gray-500 font-medium">{fmtDateTime(v.viewedAt)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Show more / less toggle */}
            {views.length > 5 && (
              <div className="px-5 py-3 border-t border-gray-50">
                <button
                  onClick={() => setViewsExpanded(v => !v)}
                  className="text-xs font-semibold text-[#1C3B35] hover:underline flex items-center gap-1"
                >
                  <svg className={`w-3.5 h-3.5 transition-transform ${viewsExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  {viewsExpanded ? `Show less` : `Show all ${views.length} views`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer actions ────────────────────────────────────────────── */}
      <div className="flex gap-3 pb-4">
        <button
          onClick={() => router.back()}
          className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-3 rounded-2xl hover:bg-gray-50 transition flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <Link
          href={`/dashboard/profiles/${params?.id}/edit`}
          className="flex-1 bg-[#1C3B35] text-white text-sm font-semibold py-3 rounded-2xl hover:bg-[#15302a] transition text-center flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Profile
        </Link>
      </div>

    </div>
  );
}
