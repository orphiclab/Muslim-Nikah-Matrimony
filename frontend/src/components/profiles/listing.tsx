'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { publicProfilesApi } from '@/services/api';
import { GenuineProfileCard } from '@/components/home/genuine/card';
import Link from 'next/link';

type Profile = {
  id: string; name: string; gender: string; age: number;
  city: string; country: string; height: string; education: string;
  occupation: string; ethnicity: string; civilStatus: string; createdAt: string;
};

type Filters = {
  minAge: string; maxAge: string; gender: string;
  city: string; ethnicity: string; civilStatus: string;
  education: string; occupation: string;
};

const EMPTY_FILTERS: Filters = {
  minAge: '17', maxAge: '60', gender: '',
  city: '', ethnicity: '', civilStatus: '',
  education: '', occupation: '',
};

const GENDERS = ['', 'MALE', 'FEMALE'];
const CIVIL_STATUSES = ['', 'Single', 'Divorced', 'Widowed'];
const EDUCATIONS = ['', 'School', 'Diploma', 'Degree', 'Masters', 'PhD'];

// Chevron icon for filter dropdowns
const Chevron = ({ open }: { open: boolean }) => (
  <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
    fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Collapsible filter section
function FilterSection({ label, children, defaultOpen = false }: {
  label: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 pb-3 mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full py-2 text-[13px] font-semibold text-[#1C3B35] font-poppins"
      >
        {label}
        <div className="flex items-center gap-2">
          {open && (
            <span className="text-[10px] text-[#DB9D30] font-normal">Reset</span>
          )}
          <Chevron open={open} />
        </div>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

// Age range slider display
function AgeRangeFilter({ min, max, onChange }: {
  min: string; max: string;
  onChange: (key: 'minAge' | 'maxAge', val: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] text-gray-500 font-poppins">
        <span>Age</span>
        <span className="font-semibold text-[#1C3B35]">{min} – {max}</span>
      </div>
      <div className="flex gap-2">
        <input type="number" min={17} max={80} value={min}
          onChange={e => onChange('minAge', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1C3B35] font-poppins" />
        <input type="number" min={17} max={80} value={max}
          onChange={e => onChange('maxAge', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1C3B35] font-poppins" />
      </div>
    </div>
  );
}

// Radio group
function RadioGroup({ options, value, onChange, labels }: {
  options: string[]; value: string;
  onChange: (v: string) => void;
  labels?: Record<string, string>;
}) {
  return (
    <div className="space-y-1.5">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer">
          <span
            onClick={() => onChange(value === opt ? '' : opt)}
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${value === opt ? 'border-[#1C3B35] bg-[#1C3B35]' : 'border-gray-300'}`}
          >
            {value === opt && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
          </span>
          <span className="text-[12px] text-gray-600 font-poppins">{(labels?.[opt] ?? opt) || 'Any'}</span>
        </label>
      ))}
    </div>
  );
}

// Text input filter
function TextFilter({ placeholder, value, onChange }: {
  placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <input
      type="text" placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1C3B35] font-poppins"
    />
  );
}

export default function ProfilesListing() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const PER_PAGE = 9;

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
    })
      .then(r => { setProfiles(r.data ?? []); setTotal(r.total ?? 0); })
      .catch(() => { setProfiles([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(applied); }, [applied, load]);

  const set = (key: keyof Filters) => (val: string) =>
    setFilters(f => ({ ...f, [key]: val }));

  const applyFilters = () => { setApplied({ ...filters }); setPage(1); };
  const resetFilters = () => { setFilters(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); setPage(1); };

  const paginated = profiles.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(profiles.length / PER_PAGE);

  // Map API profile → GenuineProfileCard props
  const toCardProps = (p: Profile) => ({
    name: p.name ?? 'Profile',
    city: p.city ?? '',
    isPrivate: true,
    isVerified: false,
    age: p.age,
    height: p.height ?? '–',
    maritalStatus: p.civilStatus ?? 'Single',
    education: p.education ?? '–',
    job: p.occupation ?? '–',
    joinedDaysAgo: Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 86400000),
  });

  return (
    <section className="bg-[#F8F9FA] min-h-screen">
      <div className="containerpadding container mx-auto py-10">
        <div className="flex gap-6 items-start">

          {/* ── Sidebar Filters ── */}
          <aside className="hidden lg:block w-[220px] xl:w-[250px] flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] font-bold text-[#1C3B35] font-poppins">
                {total} Results
              </span>
              <button onClick={resetFilters}
                className="text-[11px] text-[#DB9D30] font-semibold font-poppins hover:opacity-75 transition">
                Reset all
              </button>
            </div>

            {/* Age */}
            <FilterSection label="Age" defaultOpen>
              <AgeRangeFilter min={filters.minAge} max={filters.maxAge}
                onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))} />
            </FilterSection>

            {/* Gender */}
            <FilterSection label="Gender" defaultOpen>
              <RadioGroup
                options={GENDERS} value={filters.gender} onChange={set('gender')}
                labels={{ '': 'Any', 'MALE': 'Male', 'FEMALE': 'Female' }}
              />
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
              <RadioGroup
                options={CIVIL_STATUSES} value={filters.civilStatus} onChange={set('civilStatus')}
                labels={{ '': 'Any' }}
              />
            </FilterSection>

            {/* Education */}
            <FilterSection label="Education Level">
              <RadioGroup
                options={EDUCATIONS} value={filters.education} onChange={set('education')}
                labels={{ '': 'Any' }}
              />
            </FilterSection>

            {/* Occupation */}
            <FilterSection label="Profession">
              <TextFilter placeholder="e.g. Engineer" value={filters.occupation} onChange={set('occupation')} />
            </FilterSection>

            {/* Apply button */}
            <button onClick={applyFilters}
              className="mt-4 w-full bg-[#1C3B35] text-white text-[13px] font-semibold font-poppins py-2.5 rounded-xl hover:bg-[#15302a] transition">
              Apply Filters
            </button>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            {/* Mobile filter bar */}
            <div className="lg:hidden flex gap-2 mb-4 flex-wrap">
              {(['gender', 'city', 'education'] as (keyof Filters)[]).map(key => (
                <select key={key} value={filters[key]}
                  onChange={e => { setFilters(f => ({ ...f, [key]: e.target.value })); }}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 text-[12px] bg-white font-poppins outline-none focus:border-[#1C3B35]">
                  <option value="">{key.charAt(0).toUpperCase() + key.slice(1)}: Any</option>
                  {key === 'gender' && ['MALE', 'FEMALE'].map(v => <option key={v} value={v}>{v}</option>)}
                  {key === 'education' && EDUCATIONS.filter(Boolean).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              ))}
              <button onClick={applyFilters}
                className="bg-[#1C3B35] text-white text-[12px] px-4 py-1.5 rounded-xl font-semibold font-poppins">
                Search
              </button>
            </div>

            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-gray-500 font-poppins">
                {loading ? 'Loading…' : `Showing ${paginated.length} of ${total} profiles`}
              </p>
            </div>

            {/* Cards grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="rounded-[20px] bg-gray-100 animate-pulse h-80" />
                ))}
              </div>
            ) : paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 h-60 text-gray-400">
                <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p className="font-medium text-gray-600 font-poppins">No profiles found</p>
                <p className="text-xs mt-1">Try adjusting your filters</p>
                <button onClick={resetFilters}
                  className="mt-3 text-[12px] text-[#DB9D30] font-semibold font-poppins">
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {paginated.map(p => (
                  <Link key={p.id} href={`/profiles/${p.id}`} className="block">
                    <GenuineProfileCard {...toCardProps(p)} />
                  </Link>
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
                      <span key={`ellipsis-${i}`} className="text-gray-400 text-sm">…</span>
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

            {/* More Profiles button (only on last page) */}
            {page === totalPages && totalPages > 0 && (
              <div className="flex justify-center mt-6">
                <button
                  className="bg-[#DB9D30] hover:bg-[#c98b26] text-white font-poppins font-semibold text-[14px] px-8 py-3 rounded-full transition shadow-sm">
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
