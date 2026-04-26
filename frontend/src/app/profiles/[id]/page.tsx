'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { publicProfilesApi, profileApi } from '@/services/api';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';

/* ── helpers ─────────────────────────────────────────── */
const fmt = (val: any, suffix = '') =>
  val !== undefined && val !== null && val !== '' ? `${val}${suffix}` : '–';

const Badge = ({ label, color }: { label: string; color: string }) => (
  <span
    className={`inline-block text-[11px] font-semibold font-poppins px-2.5 py-0.5 rounded-full ${color}`}
  >
    {label}
  </span>
);

const SectionCard = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
    <h2 className="flex items-center gap-2 text-[15px] font-bold font-poppins text-[#1C3B35] mb-4">
      <span className="text-lg">{icon}</span>
      {title}
    </h2>
    {children}
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0 gap-3">
    <span className="text-[13px] text-gray-400 font-poppins flex-shrink-0 min-w-[120px]">{label}</span>
    <span className="text-[13px] font-medium text-gray-800 font-poppins text-right">{value}</span>
  </div>
);

/* ── Avatar placeholder ───────────────────────────────── */
const AvatarPlaceholder = ({ gender }: { gender?: string }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="120" height="120" rx="60" fill={gender === 'FEMALE' ? '#FCE7F3' : '#DBEAFE'} />
    <ellipse cx="60" cy="48" rx="22" ry="22" fill={gender === 'FEMALE' ? '#F9A8D4' : '#93C5FD'} />
    <ellipse cx="60" cy="104" rx="36" ry="24" fill={gender === 'FEMALE' ? '#F9A8D4' : '#93C5FD'} />
  </svg>
);

/* ── Skeleton ─────────────────────────────────────────── */
const Skeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 rounded w-1/3" />
    <div className="h-4 bg-gray-100 rounded w-1/2" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-40 bg-gray-100 rounded-2xl" />
      ))}
    </div>
  </div>
);

/* ── Decorative Islamic geometric corner ──────────────── */
const GeometricAccent = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="opacity-10">
    <path d="M40 0L52 28H80L57 45L66 73L40 56L14 73L23 45L0 28H28L40 0Z" fill="#DB9D30" />
  </svg>
);

export default function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerProfile, setViewerProfile] = useState<{ id: string; gender: string; age: number; height: number } | null>(null);

  // ── Auth guard — redirect to login if not logged in ──
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('mn_token')) {
      router.replace('/login');
    }
  }, [router]);

  // ── Load viewer's active profile for eligibility check ──
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mn_token') : null;
    if (!token) return;
    profileApi.getMyProfiles().then((r: any) => {
      const active = (r.data ?? []).find((p: any) => p.status === 'ACTIVE');
      if (active) {
        const dob = active.dateOfBirth ? new Date(active.dateOfBirth) : null;
        const computedAge = dob
          ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 0;
        setViewerProfile({
          id: active.id,
          gender: active.gender ?? '',
          age: active.age ?? computedAge,
          height: active.height ?? 0,
        });
      }
    }).catch(() => {});
  }, []);

  // Fetch the public profile — wait briefly for viewer identity, then fetch once.
  const hasFetched = React.useRef(false);
  useEffect(() => {
    if (!id) return;
    if (typeof window !== 'undefined' && !localStorage.getItem('mn_token')) return;
    if (hasFetched.current) return;

    const doFetch = (vpId?: string) => {
      if (hasFetched.current) return;
      hasFetched.current = true;
      publicProfilesApi
        .getById(id, vpId)
        .then((r) => setProfile(r.data))
        .catch(() => setError('Profile not found or no longer active.'))
        .finally(() => setLoading(false));
    };

    if (viewerProfile) {
      doFetch(viewerProfile.id);
    } else {
      // Wait up to 400ms for viewer profile to load, then fetch anyway
      const t = setTimeout(() => doFetch(undefined), 400);
      return () => clearTimeout(t);
    }
  }, [id, viewerProfile]);


  // ── Eligibility: viewer qualifies if they meet the profile's stated preferences ──
  const canInteract = (): boolean => {
    if (!viewerProfile || !profile) return false;

    // Must be opposite gender
    const viewerGender = viewerProfile.gender;
    const profileGender = profile.gender;
    if (!viewerGender || !profileGender) return false;
    if (viewerGender === profileGender) return false; // same gender → no match

    const vAge = viewerProfile.age;

    // Check if viewer's age satisfies the viewed profile's age preference
    const minPref = profile.minAgePreference ? Number(profile.minAgePreference) : null;
    const maxPref = profile.maxAgePreference ? Number(profile.maxAgePreference) : null;

    if (minPref !== null && vAge < minPref) return false;
    if (maxPref !== null && vAge > maxPref) return false;

    return true;
  };
  const eligible = canInteract();


  const handleChat = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mn_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    router.push(`/dashboard/chat?start=${id}&name=${encodeURIComponent(profile?.name ?? '')}`);
  };

  /* ── Error state ─────────────────────────────────────── */
  if (error) {
    return (
      <main className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-5xl">🔒</div>
        <h1 className="text-xl font-bold text-gray-700 font-poppins text-center">{error}</h1>
        <Link
          href="/profiles"
          className="bg-[#1C3B35] text-white font-poppins font-semibold text-[14px] px-8 py-3 rounded-full hover:bg-[#15302a] transition"
        >
          ← Back to Profiles
        </Link>
      </main>
    );
  }

  /* ── Loading state ───────────────────────────────────── */
  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F9FA] pt-28 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton />
        </div>
      </main>
    );
  }

  if (!profile) return null;

  const isVip = profile.isVip;
  const joinedDays = Math.floor(
    (Date.now() - new Date(profile.createdAt).getTime()) / 86400000
  );

  return (
    <>
      {/* ── SEO head title ─────────────────────────────── */}
      <title>{`${profile.name ?? 'Profile'} | Muslim Nikah`}</title>

      <main className="min-h-screen bg-[#F8F9FA] pt-24 pb-20">

        {/* ── Hero banner ─────────────────────────────── */}
        <div
          className={`relative overflow-hidden ${
            isVip
              ? 'bg-gradient-to-br from-[#1C3B35] via-[#294d42] to-[#1C3B35]'
              : 'bg-gradient-to-br from-[#1C3B35] to-[#2a5247]'
          }`}
        >
          {/* Decorative accents */}
          <div className="absolute top-0 right-0 rotate-45 translate-x-8 -translate-y-8">
            <GeometricAccent />
          </div>
          <div className="absolute bottom-0 left-0 -rotate-12 -translate-x-4 translate-y-4">
            <GeometricAccent />
          </div>
          {isVip && (
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#E8BE1A] via-[#DB9D30] to-[#E8BE1A]" />
          )}

          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-10 relative z-10">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden ring-4 ${
                  isVip ? 'ring-[#DB9D30]' : 'ring-white/30'
                } shadow-2xl`}
              >
                <ProfileAvatar gender={profile.gender} name={profile.name} className="w-full h-full" size={144} />
              </div>
              {isVip && (
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-[#E8BE1A] to-[#DB9D30] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-lg tracking-widest font-poppins">
                  ✦ VIP
                </div>
              )}
            </div>

            {/* Name / meta */}
            <div className="flex-1 text-center sm:text-left pb-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                {profile.memberId && (
                  <span className="text-[10px] font-mono font-bold text-[#DB9D30]/90 bg-white/10 px-2 py-0.5 rounded-full tracking-widest border border-white/20">
                    🪪 {profile.memberId}
                  </span>
                )}
                {isVip && (
                  <span className="text-[10px] font-extrabold text-[#E8BE1A] bg-[#E8BE1A]/15 px-2 py-0.5 rounded-full border border-[#E8BE1A]/30 tracking-wider font-poppins">
                    ✦ VIP BOOSTED
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white font-poppins leading-tight">
                {profile.name}
                {profile._meta?.nameIsNickname && (
                  <span className="ml-2 text-[12px] text-white/50 font-normal">(nickname)</span>
                )}
              </h1>

              <p className="text-white/70 font-poppins text-[14px] mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
                {profile.age && <span>🎂 {profile.age} years</span>}
                {profile.city && <span>📍 {profile.city}{profile.country ? `, ${profile.country}` : ''}</span>}
                {profile.gender && <span>{profile.gender === 'MALE' ? '♂' : '♀'} {profile.gender === 'MALE' ? 'Male' : 'Female'}</span>}
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                <span className="text-[12px] text-white/60 font-poppins">
                  👁 {(profile.viewCount ?? 0).toLocaleString()} views
                </span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span className="text-[12px] text-white/60 font-poppins">
                  🕐 Joined {joinedDays} days ago
                </span>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3 pb-2 flex-shrink-0">
              <Link
                href="/profiles"
                className="flex items-center gap-1.5 border border-white/30 text-white/80 hover:text-white hover:border-white/60 text-[13px] font-semibold font-poppins px-4 py-2.5 rounded-xl transition"
              >
                ← Back
              </Link>
              {eligible ? (
                <button
                  onClick={handleChat}
                  className="flex items-center gap-2 bg-[#DB9D30] hover:bg-[#c98b26] text-white text-[13px] font-bold font-poppins px-5 py-2.5 rounded-xl transition shadow-lg shadow-[#DB9D30]/30"
                >
                  💬 Send Message
                </button>
              ) : (
                <div
                  title="Age or height criteria not matched"
                  className="flex items-center gap-2 bg-white/20 text-white/50 text-[13px] font-bold font-poppins px-5 py-2.5 rounded-xl cursor-not-allowed select-none"
                >
                  🔒 Send Message
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Body content ─────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left column — quick summary card */}
          <div className="lg:col-span-1 space-y-5">
            <SectionCard title="Quick Summary" icon="📋">
              <InfoRow label="Age" value={fmt(profile.age, ' years')} />
              <InfoRow label="Height" value={profile.height ? `${profile.height} cm` : '–'} />
              <InfoRow label="Weight" value={profile.weight ? `${profile.weight} kg` : '–'} />
              <InfoRow label="Civil Status" value={fmt(profile.civilStatus)} />
              <InfoRow label="Complexion" value={fmt(profile.complexion)} />
              <InfoRow label="Appearance" value={fmt(profile.appearance)} />
              <InfoRow label="Dress Code" value={fmt(profile.dressCode)} />
              <InfoRow label="Ethnicity" value={fmt(profile.ethnicity)} />
            </SectionCard>

            {/* Location */}
            <SectionCard title="Location" icon="🌍">
              <InfoRow label="Country" value={fmt(profile.country)} />
              <InfoRow label="City" value={fmt(profile.city)} />
            </SectionCard>
          </div>

          {/* Right column — detail sections */}
          <div className="lg:col-span-2 space-y-5">

            {/* About */}
            {profile.aboutUs && (
              <SectionCard title="About" icon="✨">
                <p className="text-[13.5px] text-gray-600 font-poppins leading-relaxed whitespace-pre-wrap">
                  {profile.aboutUs}
                </p>
              </SectionCard>
            )}

            {/* Partner Expectations */}
            {profile.expectations && (
              <SectionCard title="Looking For" icon="🤝">
                <p className="text-[13.5px] text-gray-600 font-poppins leading-relaxed whitespace-pre-wrap">
                  {profile.expectations}
                </p>
              </SectionCard>
            )}

            {/* Education & Career */}
            <SectionCard title="Education & Career" icon="🎓">
              <InfoRow label="Education"       value={fmt(profile.education)} />
              {profile.fieldOfStudy && <InfoRow label="Field of Study"  value={fmt(profile.fieldOfStudy)} />}
              <InfoRow label="Occupation"      value={fmt(profile.occupation)} />
              {profile.profession   && <InfoRow label="Profession / Job Title" value={fmt(profile.profession)} />}
              {profile.residencyStatus && <InfoRow label="Residency Status" value={fmt(profile.residencyStatus)} />}
              {profile.state        && <InfoRow label="State / Province" value={fmt(profile.state)} />}
            </SectionCard>

            {/* Family Background */}
            <SectionCard title="Family Background" icon="👨‍👩‍👧‍👦">
              {profile.createdBy    && <InfoRow label="Profile Created By" value={fmt(profile.createdBy)} />}
              <InfoRow label="Family Status"       value={fmt(profile.familyStatus)} />
              <InfoRow label="Siblings"            value={profile.siblings != null ? String(profile.siblings) : '–'} />
            </SectionCard>

            {/* Father's Details */}
            {(profile.fatherEthnicity || profile.fatherCountry || profile.fatherCity || profile.fatherOccupation) && (
              <SectionCard title="Father's Details" icon="👨">
                <InfoRow label="Ethnicity"   value={fmt(profile.fatherEthnicity)} />
                <InfoRow label="Country"     value={fmt(profile.fatherCountry)} />
                <InfoRow label="City"        value={fmt(profile.fatherCity)} />
                <InfoRow label="Occupation"  value={fmt(profile.fatherOccupation)} />
              </SectionCard>
            )}

            {/* Mother's Details */}
            {(profile.motherEthnicity || profile.motherCountry || profile.motherCity || profile.motherOccupation) && (
              <SectionCard title="Mother's Details" icon="👩">
                <InfoRow label="Ethnicity"   value={fmt(profile.motherEthnicity)} />
                <InfoRow label="Country"     value={fmt(profile.motherCountry)} />
                <InfoRow label="City"        value={fmt(profile.motherCity)} />
                <InfoRow label="Occupation"  value={fmt(profile.motherOccupation)} />
              </SectionCard>
            )}

            {/* Partner Preferences */}
            <SectionCard title="Partner Preferences" icon="💑">
              {profile.minAgePreference && <InfoRow label="Preferred Min Age" value={`${profile.minAgePreference} yrs`} />}
              {profile.maxAgePreference && <InfoRow label="Preferred Max Age" value={`${profile.maxAgePreference} yrs`} />}
              <InfoRow label="Country Preference" value={fmt(profile.countryPreference)} />
            </SectionCard>

            {/* Contact Information — only visible when profiles match */}
            {eligible && ((profile._meta?.phoneVisible && profile.phone) || (profile._meta?.whatsappVisible && profile.whatsappNumber)) ? (
              <SectionCard title="Contact Information" icon="📱">
                <div className="space-y-1">
                  {profile._meta?.phoneVisible && profile.phone && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-50 gap-3">
                      <div className="flex items-center gap-2 text-gray-400 min-w-[120px]">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.5a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.69a16 16 0 006.22 6.22l1.21-1.21a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                        </svg>
                        <span className="text-[13px] font-poppins">Mobile</span>
                      </div>
                      <a href={`tel:${profile.phone}`} className="text-[13px] font-semibold text-[#1C3B35] font-poppins hover:underline">
                        {profile.phone}
                      </a>
                    </div>
                  )}
                  {profile._meta?.whatsappVisible && profile.whatsappNumber && (
                    <div className="flex items-center justify-between py-2 gap-3">
                      <div className="flex items-center gap-2 text-gray-400 min-w-[120px]">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <span className="text-[13px] font-poppins">WhatsApp</span>
                      </div>
                      <a
                        href={`https://wa.me/${profile.whatsappNumber.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] font-semibold text-[#25D366] font-poppins hover:underline flex items-center gap-1"
                      >
                        {profile.whatsappNumber}
                        <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              </SectionCard>
            ) : !eligible ? (
              /* Not a match — show friendly notice instead of contact */
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🔒</span>
                <div>
                  <p className="text-[14px] font-bold text-amber-800 font-poppins">Contact details not available</p>
                  <p className="text-[12.5px] text-amber-700 font-poppins mt-1 leading-relaxed">
                    Your profile does not match this member's partner preferences. Contact information and messaging are only available for compatible matches.
                  </p>
                </div>
              </div>
            ) : null}

            {/* CTA card */}
            <div className="bg-gradient-to-br from-[#1C3B35] to-[#2a5247] rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="flex-1">
                <p className="text-white font-bold font-poppins text-[16px]">
                  Interested in {profile.name}?
                </p>
                {eligible ? (
                  <p className="text-white/60 font-poppins text-[13px] mt-1">
                    Send an interest message and start your journey together.
                  </p>
                ) : (
                  <p className="text-amber-300/80 font-poppins text-[12px] mt-1">
                    Your profile does not match this member's preferences. Messaging is not available.
                  </p>
                )}
              </div>
              {eligible ? (
                <button
                  onClick={handleChat}
                  className="flex-shrink-0 bg-[#DB9D30] hover:bg-[#c98b26] text-white font-bold font-poppins text-[14px] px-7 py-3 rounded-xl transition shadow-lg"
                >
                  💬 Send Message
                </button>
              ) : (
                <div className="flex-shrink-0 bg-white/10 text-white/30 font-poppins text-[13px] px-5 py-2.5 rounded-xl select-none border border-white/10">
                  Not a match
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
