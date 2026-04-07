'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { profileApi } from '@/services/api';
import { GenuineProfileCard } from '@/components/home/genuine/card';

type Profile = {
  id: string; memberId: string; name: string; gender: string;
  dateOfBirth?: string; city: string; country: string;
  height?: number; education?: string; occupation?: string;
  civilStatus?: string; ethnicity?: string; createdAt: string;
  aboutUs?: string; isVip?: boolean; boostExpiresAt?: string | null;
  _meta?: { contactVisible?: boolean };
};

type Filters = {
  search: string; gender: string; city: string;
  minAge: string; maxAge: string; civilStatus: string;
  education: string; ethnicity: string;
};

const EMPTY: Filters = {
  search: '', gender: '', city: '',
  minAge: '17', maxAge: '60', civilStatus: '',
  education: '', ethnicity: '',
};

const GENDERS = ['', 'MALE', 'FEMALE'];
const CIVIL_STATUSES = ['', 'Never Married', 'Widowed', 'Divorced', 'Separated', 'Other'];
const EDUCATIONS = ['', 'School', 'Diploma', 'Degree', 'Bachelor of Arts', 'Bachelor of Engineering', 'Masters', 'PhD'];

function calcAge(dob?: string): number {
  if (!dob) return 0;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

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
        {label}<Chevron open={open} />
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
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${value === opt ? 'border-[#1C3B35] bg-[#1C3B35]' : 'border-gray-300'}`}>
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
      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1C3B35] font-poppins" />
  );
}

const PER_PAGE = 9;

export default function BrowseMembersPage() {
  const router = useRouter();
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Load my active profile for viewer context
  useEffect(() => {
    profileApi.getMyProfiles().then(r => {
      const active = (r.data ?? []).find((p: any) => p.status === 'ACTIVE');
      setMyProfile(active ?? null);
    }).catch(() => {});
  }, []);

  // Load visible profiles
  const load = useCallback((viewerId: string) => {
    if (!viewerId) { setAllProfiles([]); setLoading(false); return; }
    setLoading(true);
    const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api';
    const token = localStorage.getItem('mn_token');
    fetch(`${BASE}/profile/list/${viewerId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setAllProfiles(d.data ?? []))
      .catch(() => setAllProfiles([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (myProfile?.id) load(myProfile.id);
    else if (!loading) setLoading(false);
  }, [myProfile, load]);

  // Client-side filter
  const filtered = allProfiles.filter(p => {
    const age = calcAge(p.dateOfBirth);
    const s = applied.search.toLowerCase();
    if (s && !(p.name?.toLowerCase().includes(s) || p.city?.toLowerCase().includes(s) || p.occupation?.toLowerCase().includes(s) || p.memberId?.toLowerCase().includes(s))) return false;
    if (applied.gender && p.gender !== applied.gender) return false;
    if (applied.city && !p.city?.toLowerCase().includes(applied.city.toLowerCase())) return false;
    if (applied.minAge && age < parseInt(applied.minAge)) return false;
    if (applied.maxAge && age > parseInt(applied.maxAge)) return false;
    if (applied.civilStatus && p.civilStatus !== applied.civilStatus) return false;
    if (applied.education && !p.education?.toLowerCase().includes(applied.education.toLowerCase())) return false;
    if (applied.ethnicity && !p.ethnicity?.toLowerCase().includes(applied.ethnicity.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const set = (key: keyof Filters) => (val: string) => setFilters(f => ({ ...f, [key]: val }));
  const applyFilters = () => { setApplied({ ...filters }); setPage(1); setMobileFiltersOpen(false); };
  const resetFilters = () => { setFilters(EMPTY); setApplied(EMPTY); setPage(1); };

  const toCardProps = (p: Profile) => ({
    name: p.name ?? 'Profile',
    city: p.city ?? '',
    isPrivate: !p._meta?.contactVisible,
    isVerified: false,
    age: calcAge(p.dateOfBirth),
    height: p.height ? `${p.height} cm` : '–',
    maritalStatus: p.civilStatus ?? 'Single',
    education: p.education ?? '–',
    job: p.occupation ?? '–',
    joinedDaysAgo: Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 86400000),
  });

  const handleChat = (p: Profile) => {
    router.push(`/dashboard/chat?start=${p.id}&name=${encodeURIComponent(p.name ?? '')}`);
  };

  const handleView = (p: Profile) => {
    router.push(`/dashboard/members/${p.id}?viewer=${myProfile?.id ?? ''}`);
  };

  // No active profile state
  if (!loading && !myProfile) return (
    <div className="font-poppins flex flex-col items-center justify-center py-24 text-gray-400">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <p className="font-semibold text-gray-600 text-lg">Active subscription required</p>
      <p className="text-sm mt-1 text-center max-w-xs">You need an active paid profile to browse members and start conversations.</p>
      <a href="/dashboard/subscription" className="mt-4 bg-[#1C3B35] text-white px-6 py-2.5 rounded-xl hover:bg-[#15302a] transition font-semibold text-sm">
        Get Subscription
      </a>
    </div>
  );

  return (
    <section className="bg-[#F8F9FA] -m-6 min-h-screen font-poppins">
      <div className="container mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[34px] xl:text-[37px] 2xl:text-[40px] font-poppins font-medium text-[#121514]">Browse Members</h1>
            <p className="text-[#121514AD]/68 title-sub-top mt-0.5">
              {loading ? 'Loading…' : `${filtered.length} member${filtered.length !== 1 ? 's' : ''} available`}
            </p>
          </div>
          {/* Mobile filter toggle */}
          <button onClick={() => setMobileFiltersOpen(o => !o)}
            className="lg:hidden flex items-center gap-2 border border-gray-200 bg-white px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
            </svg>
            Filters
            {Object.values(applied).some((v, i) => v !== Object.values(EMPTY)[i]) && (
              <span className="w-2 h-2 rounded-full bg-[#DB9D30]" />
            )}
          </button>
        </div>

        <div className="flex gap-6 items-start">

          {/* ── Sidebar filters ── */}
          <aside className={`${mobileFiltersOpen ? 'block' : 'hidden'} lg:block w-full lg:w-[240px] xl:w-[260px] flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-4 z-10`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] font-bold text-[#1C3B35]">{filtered.length} Results</span>
              <button onClick={resetFilters}
                className="text-[11px] text-[#DB9D30] font-semibold hover:opacity-75 transition">
                Reset all
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <label className="block text-[12px] font-semibold text-[#1C3B35] mb-1.5">Search</label>
              <div className="relative">
                <input type="text" placeholder="Name, city, occupation…" value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-[12px] outline-none focus:border-[#1C3B35]" />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              {/* Age */}
              <FilterSection label="Age" defaultOpen>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>Range</span>
                    <span className="font-semibold text-[#1C3B35]">{filters.minAge} – {filters.maxAge}</span>
                  </div>
                  <div className="flex gap-2">
                    <input type="number" min={17} max={80} value={filters.minAge}
                      onChange={e => setFilters(f => ({ ...f, minAge: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1C3B35]" />
                    <input type="number" min={17} max={80} value={filters.maxAge}
                      onChange={e => setFilters(f => ({ ...f, maxAge: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1C3B35]" />
                  </div>
                </div>
              </FilterSection>

              {/* Gender */}
              <FilterSection label="Gender" defaultOpen>
                <RadioGroup options={GENDERS} value={filters.gender} onChange={set('gender')}
                  labels={{ '': 'Any', 'MALE': 'Male', 'FEMALE': 'Female' }} />
              </FilterSection>

              {/* City */}
              <FilterSection label="City">
                <TextFilter placeholder="e.g. Colombo" value={filters.city} onChange={set('city')} />
              </FilterSection>

              {/* Ethnicity */}
              <FilterSection label="Ethnicity">
                <TextFilter placeholder="e.g. Malay, Arab" value={filters.ethnicity} onChange={set('ethnicity')} />
              </FilterSection>

              {/* Civil Status */}
              <FilterSection label="Civil Status">
                <RadioGroup options={CIVIL_STATUSES} value={filters.civilStatus} onChange={set('civilStatus')}
                  labels={{ '': 'Any' }} />
              </FilterSection>

              {/* Education */}
              <FilterSection label="Education Level">
                <RadioGroup options={EDUCATIONS} value={filters.education} onChange={set('education')}
                  labels={{ '': 'Any' }} />
              </FilterSection>
            </div>

            <button onClick={applyFilters}
              className="mt-4 w-full bg-[#1C3B35] text-white text-[13px] font-semibold py-2.5 rounded-xl hover:bg-[#15302a] transition">
              Apply Filters
            </button>
          </aside>

          {/* ── Main grid ── */}
          <div className="flex-1 min-w-0">

            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-gray-500">
                {loading ? 'Searching…' : `Showing ${paginated.length} of ${filtered.length} profiles`}
              </p>
            </div>

            {/* Cards */}
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
                <p className="font-medium text-gray-600">No profiles found</p>
                <p className="text-xs mt-1 text-gray-400">Try adjusting your filters</p>
                <button onClick={resetFilters}
                  className="mt-3 text-[12px] text-[#DB9D30] font-semibold">Clear all filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {paginated.map(p => (
                  <div key={p.id} className="block group">
                    {/* VIP Boost badge row */}
                    <div className="flex items-center gap-1.5 mb-1.5 px-1">
                      {p.isVip && (
                        <span className="inline-flex items-center gap-1 bg-[#DB9D30] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
                          ⚡ VIP BOOST
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 bg-[#1C3B35]/8 text-[#1C3B35] text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-[#1C3B35]/20 tracking-widest group-hover:bg-[#1C3B35]/15 transition">
                        🪪 {p.memberId}
                      </span>
                    </div>
                    {/* Card with gold border for VIP */}
                    <div className={p.isVip ? 'rounded-[20px] ring-2 ring-[#DB9D30] ring-offset-1 shadow-lg' : ''}>
                      <GenuineProfileCard
                        {...toCardProps(p)}
                        onChatClick={() => handleChat(p)}
                        onViewClick={() => handleView(p)}
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
                  className="px-4 py-2 rounded-full border border-gray-200 text-[12px] font-semibold text-gray-600 hover:border-[#1C3B35] hover:text-[#1C3B35] disabled:opacity-40 transition">
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
                        className={`w-8 h-8 rounded-full text-[12px] font-semibold transition ${page === pg ? 'bg-[#1C3B35] text-white' : 'border border-gray-200 text-gray-600 hover:border-[#1C3B35] hover:text-[#1C3B35]'}`}>
                        {pg}
                      </button>
                    )
                  )}
                <button onClick={() => setPage(pg => Math.min(totalPages, pg + 1))} disabled={page === totalPages}
                  className="px-4 py-2 rounded-full border border-gray-200 text-[12px] font-semibold text-gray-600 hover:border-[#1C3B35] hover:text-[#1C3B35] disabled:opacity-40 transition">
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
