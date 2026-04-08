'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { publicProfilesApi, profileApi } from '@/services/api';
import { GenuineProfileCard } from '@/components/home/genuine/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ─── Types ─────────────────────────────────────────────────────── */
type Profile = {
  id: string; memberId: string; name: string; gender: string; age: number;
  city: string; country: string; height: string; education: string;
  occupation: string; ethnicity: string; civilStatus: string; createdAt: string;
  isVip?: boolean;
};

type UserProfile = {
  id: string; name: string; gender: string; age: number; status: string;
};

type Filters = {
  memberId: string;
  minAge: string; maxAge: string; gender: string;
  city: string; ethnicity: string; civilStatus: string;
  education: string; occupation: string;
};

const EMPTY_FILTERS: Filters = {
  memberId: '', minAge: '17', maxAge: '60',
  gender: '', city: '', ethnicity: '', civilStatus: '', education: '', occupation: '',
};

const CIVIL_STATUSES = ['', 'Single', 'Divorced', 'Widowed'];
const EDUCATIONS = ['', 'School', 'Diploma', 'Degree', 'Masters', 'PhD'];

/* ─── Small UI helpers ───────────────────────────────────────────── */
const Chevron = ({ open }: { open: boolean }) => (
  <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
    fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

function FilterSection({ label, children, defaultOpen = false }: {
  label: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 pb-3 mb-1">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full py-2 text-[13px] font-semibold text-[#1C3B35] font-poppins">
        {label}
        <Chevron open={open} />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

function RadioGroup({ options, value, onChange, labels }: {
  options: string[]; value: string;
  onChange: (v: string) => void;
  labels?: Record<string, string>;
}) {
  return (
    <div className="space-y-1.5">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer"
          onClick={() => onChange(value === opt ? '' : opt)}>
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${value === opt ? 'border-[#1C3B35] bg-[#1C3B35]' : 'border-gray-300'}`}>
            {value === opt && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
          </span>
          <span className="text-[12px] text-gray-600 font-poppins">{(labels?.[opt] ?? opt) || 'Any'}</span>
        </label>
      ))}
    </div>
  );
}

function TextFilter({ placeholder, value, onChange }: {
  placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <input type="text" placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1C3B35] font-poppins"
    />
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function ProfilesListing() {
  const router = useRouter();

  /* Auth & user profiles */
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [profilesLoading, setProfilesLoading] = useState(true);

  /* Listing state */
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const PER_PAGE = 9;

  const [activeProfiles, setActiveProfiles] = useState<any[]>([]);

  /* ── 1. Check login & load user's active profiles ── */
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mn_token') : null;
    setIsLoggedIn(!!token);
    if (!token) { setProfilesLoading(false); return; }

    profileApi.getMyProfiles()
      .then(r => {
        const active: UserProfile[] = (r.data ?? [])
          .filter((p: any) => p.status === 'ACTIVE')
          .map((p: any) => ({
            id: p.id,
            name: p.name ?? 'Profile',
            gender: p.gender ?? '',
            age: p.age ?? 0,
            status: p.status,
          }));
        setUserProfiles(active);
        setActiveProfiles(active);
        if (active.length > 0) {
          setSelectedProfile(active[0]);
        }
      })
      .catch(() => {})
      .finally(() => setProfilesLoading(false));
  }, []);

  /* ── 2. Auto-apply smart filters when selected profile changes ── */
  useEffect(() => {
    if (!selectedProfile) return;

    const oppositeGender = selectedProfile.gender === 'MALE' ? 'FEMALE' : 'MALE';
    const age = selectedProfile.age ?? 0;

    setFilters(f => ({
      ...f,
      gender: oppositeGender,
      // Female sees men aged profile.age+ (older men preferred)
      // Male sees women aged up to profile.age (younger women preferred)
      minAge: selectedProfile.gender === 'FEMALE' ? String(age) : '17',
      maxAge: selectedProfile.gender === 'MALE' ? String(age) : '60',
    }));

    setApplied(f => ({
      ...f,
      gender: oppositeGender,
      minAge: selectedProfile.gender === 'FEMALE' ? String(age) : '17',
      maxAge: selectedProfile.gender === 'MALE' ? String(age) : '60',
    }));
    setPage(1);
  }, [selectedProfile]);

  /* ── 3. Load profiles list ── */
  const load = useCallback((f: Filters) => {
    setLoading(true);
    publicProfilesApi.list({
      minAge: parseInt(f.minAge) || undefined,
      maxAge: parseInt(f.maxAge) || undefined,
      gender: f.gender || undefined,
      city: f.city || undefined,
      ethnicity: f.ethnicity || undefined,
      civilStatus: f.civilStatus || undefined,
      education: f.education || undefined,
      occupation: f.occupation || undefined,
      memberId: f.memberId || undefined,
    })
      .then(r => { setProfiles(r.data ?? []); setTotal(r.total ?? 0); })
      .catch(() => { setProfiles([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(applied); }, [applied, load]);

  /* ── Helpers ── */
  const set = (key: keyof Filters) => (val: string) =>
    setFilters(f => ({ ...f, [key]: val }));

  const applyFilters = () => { setApplied({ ...filters }); setPage(1); };

  const resetFilters = () => {
    if (selectedProfile) {
      // Keep profile-based auto filters, reset the rest
      const oppositeGender = selectedProfile.gender === 'MALE' ? 'FEMALE' : 'MALE';
      const age = selectedProfile.age ?? 0;
      const smart: Filters = {
        ...EMPTY_FILTERS,
        gender: oppositeGender,
        minAge: selectedProfile.gender === 'FEMALE' ? String(age) : '17',
        maxAge: selectedProfile.gender === 'MALE' ? String(age) : '60',
      };
      setFilters(smart);
      setApplied(smart);
    } else {
      setFilters(EMPTY_FILTERS);
      setApplied(EMPTY_FILTERS);
    }
    setPage(1);
  };

  const handleMemberIdChange = (val: string) => {
    const up = val.toUpperCase();
    setFilters(f => ({ ...f, memberId: up }));
    if (/^MN-\d{6}$/.test(up)) { setApplied(f => ({ ...f, memberId: up })); setPage(1); }
  };

  /* ── Auth-guarded button handlers ── */
  const isLoggedInNow = () => !!localStorage.getItem('mn_token');

  const handleChatClick = (e: React.MouseEvent, p: Profile) => {
    e.preventDefault();
    if (!isLoggedInNow()) { router.push('/login'); return; }
    if (activeProfiles.length === 0) { router.push('/dashboard/profiles'); return; }
    router.push(`/dashboard/chat?start=${p.id}&name=${encodeURIComponent(p.name ?? '')}`);
  };

  const handleViewClick = (p: Profile) => {
    if (!isLoggedInNow()) { router.push('/login'); return; }
    router.push(`/profiles/${p.id}`);
  };

  /* ── Derived ── */
  const paginated = profiles.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(profiles.length / PER_PAGE);

  /* Age constraint hint message */
  const ageHint = selectedProfile
    ? selectedProfile.gender === 'FEMALE'
      ? `You can select matches aged ${selectedProfile.age}+ based on your profile.`
      : `You can select matches aged ${selectedProfile.age} and below based on your profile.`
    : null;

  const toCardProps = (p: Profile) => ({
    name: p.name ?? 'Profile',
    city: p.city ?? '',
    isPrivate: true,
    isVerified: false,
    age: p.age,
    height: p.height ? `${p.height} cm` : '–',
    maritalStatus: p.civilStatus ?? 'Single',
    education: p.education ?? '–',
    job: p.occupation ?? '–',
    joinedDaysAgo: Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 86400000),
  });

  /* ════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!isSidebarOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', onEsc);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onEsc);
    };
  }, [isSidebarOpen]);

  const sidebarFilters = (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] font-bold text-[#1C3B35] font-poppins">{total} Results</span>
        <button onClick={resetFilters}
          className="text-[11px] text-[#DB9D30] font-semibold font-poppins hover:opacity-75 transition">
          Reset all
        </button>
      </div>

      {/* ── Profile Selector (logged in only) ── */}
      {isLoggedIn && (
        <div className="mb-4">
          {profilesLoading ? (
            <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
          ) : userProfiles.length === 0 ? (
            /* No active profile warning */
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <p className="text-[11px] text-amber-700 font-poppins font-semibold mb-1.5">
                No Active Profile
              </p>
              <p className="text-[10px] text-amber-600 font-poppins leading-relaxed mb-2">
                You don't have an active profile. Please activate your profile to start searching for matches.
              </p>
              <Link href="/dashboard/profiles"
                className="inline-block text-[10px] font-bold text-white bg-[#1C3B35] px-3 py-1 rounded-lg hover:bg-[#15302a] transition font-poppins">
                Activate Profile →
              </Link>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-[#1C3B35] font-poppins mb-1.5 uppercase tracking-wide">
                Searching as
              </label>
              <div className="relative">
                <select
                  value={selectedProfile?.id ?? ''}
                  onChange={e => {
                    const found = userProfiles.find(p => p.id === e.target.value);
                    setSelectedProfile(found ?? null);
                  }}
                  className="w-full border border-[#1C3B35]/30 bg-[#1C3B35]/5 rounded-xl px-3 py-2 text-[12px] font-semibold text-[#1C3B35] font-poppins outline-none focus:border-[#1C3B35] appearance-none pr-7 cursor-pointer"
                >
                  {userProfiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gender === 'MALE' ? '♂ Male' : '♀ Female'}, {p.age}y)
                    </option>
                  ))}
                </select>
                <Chevron open={false} />
              </div>

              {/* Smart filter info badge */}
              {selectedProfile && (
                <div className="mt-2 bg-[#1C3B35]/5 border border-[#1C3B35]/15 rounded-lg px-2.5 py-2">
                  <p className="text-[10px] text-[#1C3B35] font-poppins font-semibold mb-0.5">
                    Smart Filters Active
                  </p>
                  <p className="text-[10px] text-gray-500 font-poppins leading-relaxed">
                    Showing {selectedProfile.gender === 'MALE' ? 'Female' : 'Male'} profiles only.
                    {ageHint && <> {ageHint}</>}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Member ID Search ── */}
      <div className="mb-4">
        <label className="block text-[12px] font-semibold text-[#1C3B35] font-poppins mb-1.5">
          Search by Member ID
        </label>
        <div className="relative">
          <input type="text" placeholder="e.g. MN-000001" value={filters.memberId}
            onChange={e => handleMemberIdChange(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-[12px] outline-none focus:border-[#1C3B35] font-poppins uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal"
          />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {filters.memberId && (
            <button onClick={() => { setFilters(f => ({ ...f, memberId: '' })); setApplied(f => ({ ...f, memberId: '' })); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              ✕
            </button>
          )}
        </div>
        <p className="text-[10px] text-gray-400 font-poppins mt-1">Format: MN-000001</p>
      </div>

      <div className="border-t border-gray-100 pt-3">
        {/* Age Filter — with profile-based constraints */}
        <FilterSection label="Age" defaultOpen>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-gray-500 font-poppins">
              <span>Range</span>
              <span className="font-semibold text-[#1C3B35]">{filters.minAge} – {filters.maxAge}</span>
            </div>
            <div className="flex gap-2">
              <input type="number" min={17} max={80}
                value={filters.minAge}
                onChange={e => setFilters(f => ({ ...f, minAge: e.target.value }))}
                readOnly={!!selectedProfile && selectedProfile.gender === 'FEMALE'}
                className={`w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1C3B35] font-poppins ${selectedProfile?.gender === 'FEMALE' ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
              />
              <input type="number" min={17} max={80}
                value={filters.maxAge}
                onChange={e => setFilters(f => ({ ...f, maxAge: e.target.value }))}
                readOnly={!!selectedProfile && selectedProfile.gender === 'MALE'}
                className={`w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1C3B35] font-poppins ${selectedProfile?.gender === 'MALE' ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
              />
            </div>
            {ageHint && (
              <p className="text-[10px] text-[#1C3B35]/70 font-poppins leading-relaxed">
                {ageHint}
              </p>
            )}
          </div>
        </FilterSection>

        {!selectedProfile && (
          <FilterSection label="Gender" defaultOpen>
            <RadioGroup
              options={['', 'MALE', 'FEMALE']} value={filters.gender}
              onChange={set('gender')}
              labels={{ '': 'Any', 'MALE': 'Male', 'FEMALE': 'Female' }}
            />
          </FilterSection>
        )}

        <FilterSection label="City">
          <TextFilter placeholder="e.g. Colombo" value={filters.city} onChange={set('city')} />
        </FilterSection>

        <FilterSection label="Ethnicity">
          <TextFilter placeholder="e.g. Malay, Arab" value={filters.ethnicity} onChange={set('ethnicity')} />
        </FilterSection>

        <FilterSection label="Civil Status">
          <RadioGroup options={CIVIL_STATUSES} value={filters.civilStatus} onChange={set('civilStatus')} labels={{ '': 'Any' }} />
        </FilterSection>

        <FilterSection label="Education Level">
          <RadioGroup options={EDUCATIONS} value={filters.education} onChange={set('education')} labels={{ '': 'Any' }} />
        </FilterSection>

        <FilterSection label="Profession">
          <TextFilter placeholder="e.g. Engineer" value={filters.occupation} onChange={set('occupation')} />
        </FilterSection>
      </div>

      <button onClick={() => { applyFilters(); setIsSidebarOpen(false); }}
        className="mt-4 w-full bg-[#1C3B35] text-white text-[13px] font-semibold font-poppins py-2.5 rounded-xl hover:bg-[#15302a] transition">
        Apply Filters
      </button>
    </>
  );

  return (
    <section className="bg-[#F8F9FA] min-h-screen">
      <div className="containerpadding container mx-auto py-10">
        <div className="flex gap-6 items-start">

          {/* Mobile/Tablet Sidebar Drawer */}
          <div
            className={`lg:hidden fixed inset-0 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            style={{ zIndex: 99999 }}
          >
            <button
              aria-label="Close filters"
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-black/30"
            />
            <aside
              className={`absolute left-0 top-0 h-full w-[90vw] max-w-sm bg-white shadow-2xl border-r border-gray-200 overflow-y-auto transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
              style={{ zIndex: 100000 }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
                <h2 className="text-[18px] sm:text-[20px] font-poppins text-[#1C3B35] font-poppins">Sort and filter</h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-[#1C3B35] p-1"
                  aria-label="Close filters panel"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                {sidebarFilters}
              </div>
            </aside>
          </div>

          {/* ── Sidebar ── */}
          <aside className="hidden lg:block w-[230px] xl:w-[255px] shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-6">
            {sidebarFilters}
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">

            {/* Mobile top bar */}
            <div className="lg:hidden mb-4 space-y-2">
              {/* Mobile profile selector */}
              {isLoggedIn && userProfiles.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#1C3B35] font-poppins whitespace-nowrap">Searching as:</span>
                  <select
                    value={selectedProfile?.id ?? ''}
                    onChange={e => {
                      const found = userProfiles.find(p => p.id === e.target.value);
                      setSelectedProfile(found ?? null);
                    }}
                    className="flex-1 border-0 bg-transparent text-[12px] font-semibold text-[#1C3B35] font-poppins outline-none"
                  >
                    {userProfiles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.gender === 'MALE' ? '♂' : '♀'} {p.age}y)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isLoggedIn && userProfiles.length === 0 && !profilesLoading && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-amber-700 font-poppins">No active profile found.</p>
                  <Link href="/dashboard/profiles"
                    className="text-[10px] font-bold text-[#1C3B35] bg-amber-100 px-2 py-1 rounded-lg whitespace-nowrap font-poppins">
                    Activate →
                  </Link>
                </div>
              )}

              <div className="relative">
                <input type="text" placeholder="Search by Member ID (e.g. MN-000001)"
                  value={filters.memberId}
                  onChange={e => handleMemberIdChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-[13px] outline-none focus:border-[#1C3B35] font-poppins uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal bg-white shadow-sm"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              <button
                onClick={() => setIsSidebarOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-[#1C3B35] text-white text-[13px] px-4 py-2.5 rounded-xl font-semibold font-poppins"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18m-14.25 7.5h10.5m-7.5 7.5h4.5" />
                </svg>
                Sort and Filter
              </button>
            </div>

            {/* Smart filter info banner (mobile) */}
            {selectedProfile && (
              <div className="lg:hidden mb-3 bg-[#1C3B35]/5 border border-[#1C3B35]/15 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <span className="text-base shrink-0">💡</span>
                <p className="text-[11px] text-[#1C3B35] font-poppins leading-relaxed">
                  <strong>Smart Filters Active:</strong> Showing {selectedProfile.gender === 'MALE' ? 'Female' : 'Male'} profiles only.
                  {ageHint && <> {ageHint}</>}
                </p>
              </div>
            )}

            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-gray-500 font-poppins">
                {loading ? 'Searching…' : `Showing ${paginated.length} of ${total} profiles`}
              </p>
            </div>

            {/* Cards grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-[20px] bg-gray-100 animate-pulse h-80" />
                ))}
              </div>
            ) : paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 h-60 text-gray-400">
                <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p className="font-medium text-gray-600 font-poppins">No profiles found</p>
                <p className="text-xs mt-1 text-gray-400">
                  {applied.memberId ? `No profile with ID "${applied.memberId}"` : 'Try adjusting your filters'}
                </p>
                <button onClick={resetFilters}
                  className="mt-3 text-[12px] text-[#DB9D30] font-semibold font-poppins">
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {paginated.map(p => (
                  <div key={p.id} className="block group">
                    <div className={p.isVip ? 'ring-2 ring-[#DB9D30]/60 rounded-[20px] shadow-lg shadow-[#DB9D30]/10' : ''}>
                      <GenuineProfileCard
                        {...toCardProps(p)}
                        memberId={p.memberId}
                        isVip={p.isVip}
                        onChatClick={(e) => handleChatClick(e, p)}
                        onViewClick={() => handleViewClick(p)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button onClick={() => setPage(pg => Math.max(1, pg - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-full border border-gray-200 text-[12px] font-semibold text-gray-600 font-poppins hover:border-[#1C3B35] hover:text-[#1C3B35] disabled:opacity-40 transition">
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(pg => pg === 1 || pg === totalPages || Math.abs(pg - page) <= 1)
                  .reduce<(number | '…')[]>((acc, pg, i, arr) => {
                    if (i > 0 && pg - (arr[i - 1] as number) > 1) acc.push('…');
                    acc.push(pg); return acc;
                  }, [])
                  .map((pg, i) =>
                    pg === '…' ? (
                      <span key={`e-${i}`} className="text-gray-400 text-sm">…</span>
                    ) : (
                      <button key={pg} onClick={() => setPage(pg as number)}
                        className={`w-8 h-8 rounded-full text-[12px] font-semibold font-poppins transition ${page === pg ? 'bg-[#1C3B35] text-white' : 'border border-gray-200 text-gray-600 hover:border-[#1C3B35] hover:text-[#1C3B35]'}`}>
                        {pg}
                      </button>
                    )
                  )}
                <button onClick={() => setPage(pg => Math.min(totalPages, pg + 1))} disabled={page === totalPages}
                  className="px-4 py-2 rounded-full border border-gray-200 text-[12px] font-semibold text-gray-600 font-poppins hover:border-[#1C3B35] hover:text-[#1C3B35] disabled:opacity-40 transition">
                  Next
                </button>
              </div>
            )}

            {/* More Profiles CTA */}
            {page === totalPages && totalPages > 0 && (
              <div className="flex justify-center mt-6">
                <button className="bg-[#DB9D30] hover:bg-[#c98b26] text-white font-poppins font-semibold text-[14px] px-8 py-3 rounded-full transition shadow-sm">
                  More Profiles
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
