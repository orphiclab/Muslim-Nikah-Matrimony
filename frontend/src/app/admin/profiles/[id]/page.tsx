'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/services/api';

type ProfileDetail = {
  id: string; memberId: string; name: string; nickname?: string; showRealName: boolean;
  gender: string; dateOfBirth: string; height?: number; weight?: number;
  complexion?: string; appearance?: string; dressCode?: string;
  ethnicity?: string; civilStatus?: string; children?: string;
  country?: string; city?: string; state?: string; residencyStatus?: string;
  education?: string; occupation?: string; fieldOfStudy?: string;
  profession?: string; annualIncome?: string;
  familyStatus?: string; fatherOccupation?: string; motherOccupation?: string;
  fatherEthnicity?: string; motherEthnicity?: string; siblings?: number;
  fatherCountry?: string; fatherCity?: string; motherCountry?: string; motherCity?: string;
  brothers?: number; sisters?: number;
  residentCountry?: string; residentCity?: string;
  minAgePreference?: number; maxAgePreference?: number; countryPreference?: string;
  minHeightPreference?: number; maxHeightPreference?: number;
  aboutUs?: string; expectations?: string;
  status: string; viewCount: number;
  boostExpiresAt?: string; rejectionReason?: string;
  createdAt: string; updatedAt: string;
  user?: { id: string; email: string; phone?: string; role: string };
  subscription?: {
    status: string; startDate?: string; endDate?: string; planName: string; planDurationDays: number;
  } | null;
  payments?: {
    id: string; amount: number; currency: string; status: string; purpose: string; method: string; createdAt: string;
  }[];
};

const statusColor: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  DRAFT: 'bg-gray-100 text-gray-500 border-gray-200',
  PAYMENT_PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  PAUSED: 'bg-orange-100 text-orange-700 border-orange-200',
  INACTIVE: 'bg-red-100 text-red-500 border-red-200',
  EXPIRED: 'bg-red-100 text-red-600 border-red-200',
};

const statusLabel: Record<string, string> = {
  ACTIVE: 'Active', DRAFT: 'Draft', PAYMENT_PENDING: 'Pending Payment',
  PAUSED: 'Paused', INACTIVE: 'Inactive', EXPIRED: 'Expired',
};

const paymentStatusColor: Record<string, string> = {
  SUCCESS: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-600',
};

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <span className="text-[#1C3B35]">{icon}</span>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800 font-medium">
        {value != null && value !== '' ? String(value) : <span className="text-gray-300 italic text-xs">Not set</span>}
      </span>
    </div>
  );
}

function calcAge(dob: string) {
  const d = new Date(dob);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export default function AdminProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    adminApi.getProfile(id)
      .then((r) => setProfile(r.data))
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="w-8 h-8 animate-spin text-[#1C3B35]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );

  if (error || !profile) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <span className="text-4xl">⚠️</span>
      <p className="text-gray-500 text-sm">{error || 'Profile not found'}</p>
      <button onClick={() => router.back()} className="text-sm text-[#1C3B35] font-semibold hover:underline">← Go back</button>
    </div>
  );

  const age = profile.dateOfBirth ? calcAge(profile.dateOfBirth) : null;
  const isVip = profile.boostExpiresAt && new Date(profile.boostExpiresAt) > new Date();

  return (
    <div className="font-poppins space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/admin/profiles" className="hover:text-[#1C3B35] transition font-medium">Profiles</Link>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
        <span className="text-gray-700 font-medium truncate">{profile.name}</span>
      </div>

      {/* Hero header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar */}
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ${profile.gender === 'FEMALE' ? 'bg-pink-500' : 'bg-blue-500'}`}>
            {(profile.name?.[0] ?? '?').toUpperCase()}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-semibold text-[#121514]">{profile.name}</h1>
              {profile.nickname && !profile.showRealName && (
                <span className="text-xs text-gray-400 italic">"{profile.nickname}"</span>
              )}
              <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">{profile.memberId}</span>
              {isVip && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⚡ Boosted</span>}
            </div>
            <p className="text-sm text-gray-500">
              {profile.gender === 'FEMALE' ? '♀ Female' : '♂ Male'}
              {age ? ` · ${age} years old` : ''}
              {profile.city || profile.country ? ` · ${[profile.city, profile.country].filter(Boolean).join(', ')}` : ''}
            </p>
            {profile.user && (
              <p className="text-xs text-gray-400 mt-1">
                Account:&nbsp;
                <Link href={`/admin/users/${profile.user.id}`} className="text-[#1C3B35] hover:underline font-medium">
                  {profile.user.email}
                </Link>
              </p>
            )}
          </div>
          {/* Status + back */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${statusColor[profile.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
              {statusLabel[profile.status] ?? profile.status}
            </span>
            <div className="flex gap-1.5 text-xs text-gray-400">
              <span>Views: <strong className="text-gray-700">{profile.viewCount}</strong></span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/admin/profiles/${id}/edit`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C3B35] text-white text-sm font-semibold hover:bg-[#15302a] transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit Profile
              </button>
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Subscription bar */}
        {profile.subscription && (
          <div className={`mt-4 px-4 py-3 rounded-xl flex items-center justify-between gap-3 flex-wrap ${
            profile.subscription.status === 'ACTIVE' ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                profile.subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                profile.subscription.status === 'EXPIRED' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
              }`}>{profile.subscription.status}</span>
              <span className="text-sm font-medium text-gray-700">
                Plan: <strong>{profile.subscription.planName}</strong> ({profile.subscription.planDurationDays} days)
              </span>
            </div>
            <div className="text-xs text-gray-500 flex gap-4">
              {profile.subscription.startDate && <span>Start: {new Date(profile.subscription.startDate).toLocaleDateString()}</span>}
              {profile.subscription.endDate && <span>Expires: {new Date(profile.subscription.endDate).toLocaleDateString()}</span>}
            </div>
          </div>
        )}

        {/* Rejection reason */}
        {profile.rejectionReason && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
            <strong>Rejection reason:</strong> {profile.rejectionReason}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Personal Info */}
        <Section title="Personal Information" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Full Name" value={profile.name} />
            <Field label="Date of Birth" value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null} />
            <Field label="Age" value={age ? `${age} years` : null} />
            <Field label="Gender" value={profile.gender === 'FEMALE' ? 'Female' : 'Male'} />
            <Field label="Height" value={profile.height ? `${profile.height} cm` : null} />
            <Field label="Weight" value={profile.weight ? `${profile.weight} kg` : null} />
            <Field label="Complexion" value={profile.complexion} />
            <Field label="Appearance" value={profile.appearance} />
            <Field label="Dress Code" value={profile.dressCode} />
            <Field label="Ethnicity" value={profile.ethnicity} />
            <Field label="Civil Status" value={profile.civilStatus} />
          </div>
        </Section>

        {/* Location & Education */}
        <Section title="Location & Education" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Country" value={profile.country} />
            <Field label="City" value={profile.city} />
            <Field label="Resident Country" value={profile.residentCountry} />
            <Field label="Resident City" value={profile.residentCity} />
            <Field label="State" value={profile.state} />
            <Field label="Residency Status" value={profile.residencyStatus} />
            <Field label="Education" value={profile.education} />
            <Field label="Field of Study" value={profile.fieldOfStudy} />
            <Field label="Occupation" value={profile.occupation} />
            <Field label="Profession" value={profile.profession} />
          </div>
        </Section>

        {/* Family Details */}
        <Section title="Family Details" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Family Status" value={profile.familyStatus} />
            <Field label="Siblings" value={profile.siblings} />
            <Field label="Brothers" value={profile.brothers} />
            <Field label="Sisters" value={profile.sisters} />
            <Field label="Father Ethnicity" value={profile.fatherEthnicity} />
            <Field label="Father Country" value={profile.fatherCountry} />
            <Field label="Father City" value={profile.fatherCity} />
            <Field label="Father Occupation" value={profile.fatherOccupation} />
            <Field label="Mother Ethnicity" value={profile.motherEthnicity} />
            <Field label="Mother Country" value={profile.motherCountry} />
            <Field label="Mother City" value={profile.motherCity} />
            <Field label="Mother Occupation" value={profile.motherOccupation} />
          </div>
        </Section>

        {/* Preferences */}
        <Section title="Partner Preferences" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Country Pref." value={profile.countryPreference} />
            <Field label="Min Age" value={profile.minAgePreference} />
            <Field label="Max Age" value={profile.maxAgePreference} />
            <Field label="Min Height (cm)" value={profile.minHeightPreference} />
            <Field label="Max Height (cm)" value={profile.maxHeightPreference} />
          </div>
        </Section>
      </div>

      {/* About & Expectations */}
      {(profile.aboutUs || profile.expectations) && (
        <Section title="About & Expectations" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.aboutUs && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">About Us</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.aboutUs}</p>
              </div>
            )}
            {profile.expectations && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Expectations</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.expectations}</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Payment History */}
      {profile.payments && profile.payments.length > 0 && (
        <Section title="Payment History" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>}>
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Date', 'Amount', 'Purpose', 'Method', 'Status'].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {profile.payments.map(pay => (
                  <tr key={pay.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 text-xs text-gray-500">{new Date(pay.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-800">{pay.currency} {pay.amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-xs text-gray-500 capitalize">{pay.purpose.toLowerCase()}</td>
                    <td className="px-5 py-3 text-xs text-gray-500 capitalize">{pay.method.replace('_', ' ').toLowerCase()}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${paymentStatusColor[pay.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {pay.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Meta */}
      <p className="text-xs text-gray-400 text-center pb-4">
        Profile ID: <span className="font-mono">{id}</span>
        · Created {new Date(profile.createdAt).toLocaleString()}
        · Updated {new Date(profile.updatedAt).toLocaleString()}
      </p>
    </div>
  );
}
