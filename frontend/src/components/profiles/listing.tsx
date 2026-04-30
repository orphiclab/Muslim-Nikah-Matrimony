'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { publicProfilesApi, profileApi } from '@/services/api';
import { GenuineProfileCard } from '@/components/home/genuine/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadMasterData, MasterData } from '@/app/admin/master-file/data';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';

/* ─── Types ─────────────────────────────────────────────────────── */
type Profile = {
  id: string; memberId: string; name: string; gender: string; age: number;
  city: string; country: string; height: string; education: string;
  occupation: string; ethnicity: string; civilStatus: string; createdAt: string;
  isVip?: boolean;
  createdBy?: string;
};

type UserProfile = {
  id: string; memberId: string; name: string; gender: string; age: number; status: string; height: number | null;
};

type Filters = {
  memberId: string;
  minAge: string;
  maxAge: string;
  gender: string;
  country: string; city: string; ethnicity: string; civilStatus: string;
  education: string; occupation: string;
};

const EMPTY_FILTERS: Filters = {
  memberId: '',
  minAge: '', maxAge: '',
  gender: '', country: '', city: '', ethnicity: '', civilStatus: '', education: '', occupation: '',
};

const CIVIL_STATUSES = ['', 'Never Married', 'Widowed', 'Divorced', 'Separated', 'Other'];

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

/* ─── Premium "Searching as" custom dropdown ──────────────────── */
function SearchingAsDropdown({
  profiles, selected, onSelect, compact = false,
}: {
  profiles: UserProfile[];
  selected: UserProfile | null;
  onSelect: (p: UserProfile) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const genderColor = (g: string) =>
    g === 'MALE' ? { bg: 'bg-blue-100', text: 'text-blue-600', dot: 'bg-blue-400' }
                 : { bg: 'bg-pink-100', text: 'text-pink-600', dot: 'bg-pink-400' };

  const genderLabel = (g: string) => g === 'MALE' ? 'Male' : 'Female';

  if (!selected) return null;
  const sc = genderColor(selected.gender);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2.5 rounded-xl border transition-all ${
          open
            ? 'border-[#1C3B35] bg-white shadow-md ring-2 ring-[#1C3B35]/10'
            : 'border-[#1C3B35]/25 bg-[#1C3B35]/4 hover:border-[#1C3B35]/50 hover:bg-[#1C3B35]/8'
        } ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2.5'}`}
      >
        <div className="shrink-0 rounded-full overflow-hidden" style={{ width: compact ? 28 : 36, height: compact ? 28 : 36 }}>
          <ProfileAvatar gender={selected.gender} name={selected.name} size={compact ? 28 : 36} className="w-full h-full" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className={`font-mono font-bold text-[#1C3B35] truncate leading-tight ${
            compact ? 'text-[11px]' : 'text-[12px]'
          }`}>
            {selected.memberId || selected.name || 'Profile'}
          </p>
          <p className={`leading-none mt-0.5 ${
            compact ? 'text-[9px]' : 'text-[10px]'
          } ${sc.text}`}>
            {genderLabel(selected.gender)}{selected.age ? ` · ${selected.age} yrs` : ''}
          </p>
        </div>
        <svg
          className={`shrink-0 w-3.5 h-3.5 text-[#1C3B35]/50 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-[300] left-0 right-0 mt-1.5 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <p className="px-3 pt-2.5 pb-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-400 font-poppins">
            Switch Profile
          </p>
          <div className="pb-2">
            {profiles.map(p => {
              const c = genderColor(p.gender);
              const isActive = p.id === selected.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onSelect(p); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 transition-colors ${
                    isActive
                      ? 'bg-[#1C3B35] text-white'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 ${isActive ? 'ring-2 ring-white/40' : ''}`}>
                    <ProfileAvatar gender={p.gender} name={p.name} size={32} className="w-full h-full" />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className={`text-[12px] font-mono font-bold truncate leading-tight ${
                      isActive ? 'text-white' : 'text-[#1C3B35]'
                    }`}>
                      {p.memberId || p.name || 'Profile'}
                    </p>
                    <p className={`text-[10px] leading-none mt-0.5 ${
                      isActive ? 'text-white/70' : c.text
                    }`}>
                      {genderLabel(p.gender)}{p.age ? ` · ${p.age} yrs` : ''}
                    </p>
                  </div>
                  {/* Checkmark */}
                  {isActive && (
                    <svg className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
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
  const [masterData, setMasterData] = useState<MasterData | null>(null);
  const [ageRangeDefaults, setAgeRangeDefaults] = useState({ min: 18, max: 65 });

  const [activeProfiles, setActiveProfiles] = useState<any[]>([]);

  /* ── 0. Load master data for filter dropdowns ── */
  useEffect(() => {
    const md = loadMasterData();
    setMasterData(md);
    setAgeRangeDefaults(md.ageRange);
  }, []);

  /* ── 1. Check login & load user's active profiles ── */
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mn_token') : null;
    setIsLoggedIn(!!token);
    if (!token) { setProfilesLoading(false); return; }

    profileApi.getMyProfiles()
      .then(r => {
        const active: UserProfile[] = (r.data ?? [])
          .filter((p: any) => {
            if (p.status !== 'ACTIVE') return false;
            if (p.subscription?.status === 'EXPIRED') return false;
            // Also treat as expired if endDate has already passed
            if (p.subscription?.endDate && new Date(p.subscription.endDate) < new Date()) return false;
            return true;
          })
          .map((p: any) => {
            const dob = p.dateOfBirth ? new Date(p.dateOfBirth) : null;
            const computedAge = dob
              ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
              : 0;
            return {
              id: p.id,
              memberId: p.memberId ?? '',
              name: p.name?.trim() && p.name.trim() !== 'Profile' ? p.name.trim() : '',
              gender: p.gender ?? '',
              age: p.age ?? computedAge,       // API may or may not return age
              height: (p.height && p.height > 0) ? p.height : null,
              status: p.status,
            };
          });
        setUserProfiles(active);
        setActiveProfiles(active);
        if (active.length > 0) {
          const first = active[0];
          setSelectedProfile(first);
          // Auto-apply smart gender filter (opposite gender) on initial load
          const oppositeGender = first.gender === 'MALE' ? 'FEMALE' : 'MALE';
          const smart: Filters = { ...EMPTY_FILTERS, gender: oppositeGender };
          setFilters(smart);
          setApplied(smart);
        }
      })
      .catch(() => {})
      .finally(() => setProfilesLoading(false));
  }, []);


  /* ── 3. Load profiles list ── */
  const load = useCallback((f: Filters) => {
    setLoading(true);
    publicProfilesApi.list({
      gender: f.gender || undefined,
      city: f.city || undefined,
      ethnicity: f.ethnicity || undefined,
      civilStatus: f.civilStatus || undefined,
      education: f.education || undefined,
      occupation: f.occupation || undefined,
      memberId: f.memberId || undefined,
      minAge: f.minAge ? parseInt(f.minAge) : undefined,
      maxAge: f.maxAge ? parseInt(f.maxAge) : undefined,
      viewerProfileId: selectedProfile?.id || undefined,
    })
      .then(r => {
        // Exclude the viewer's own profiles from the results
        const ownIds = new Set(userProfiles.map(p => p.id));
        const filtered = (r.data ?? []).filter((p: Profile) => !ownIds.has(p.id));
        setProfiles(filtered);
        setTotal(filtered.length);
      })
      .catch(() => { setProfiles([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [userProfiles, selectedProfile]);

  useEffect(() => { load(applied); }, [applied, load]);

  /* ── Helpers ── */
  const set = (key: keyof Filters) => (val: string) =>
    setFilters(f => ({ ...f, [key]: val }));

  const applyFilters = () => { setApplied({ ...filters }); setPage(1); };

  const resetFilters = () => {
    if (selectedProfile) {
      const oppositeGender = selectedProfile.gender === 'MALE' ? 'FEMALE' : 'MALE';
      const smart: Filters = { ...EMPTY_FILTERS, gender: oppositeGender };
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
    if (/^USR-\d+$/.test(up)) { setApplied(f => ({ ...f, memberId: up })); setPage(1); }
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

  /* ── canChat: checks if viewer can chat with target ── */
  const canChat = (target: Profile): boolean => {
    if (!selectedProfile) return true;

    const vAge  = selectedProfile.age   ?? 0;
    const vHeight = selectedProfile.height != null ? Number(selectedProfile.height) : null;

    const tAge  = target.age ?? 0;
    const rawH  = (target as any).height;
    const tHeight = rawH != null && rawH !== '' ? Number(rawH) : null;

    // Normalise: treat 0 as unknown
    const vH = vHeight && vHeight > 0 ? vHeight : null;
    const tH = tHeight && tHeight > 0 ? tHeight : null;

    console.log('[canChat]', {
      viewer: { gender: selectedProfile.gender, age: vAge, height: vH },
      target: { id: target.id, name: target.name, age: tAge, height: tH, rawH },
    });

    if (selectedProfile.gender === 'MALE') {
      if (tAge > vAge) return false;           // target older than viewer
      if (vH && tH && tH > vH) return false;  // target taller than viewer
      return true;
    } else if (selectedProfile.gender === 'FEMALE') {
      if (tAge < vAge) return false;           // target younger than viewer
      if (vH && tH && tH < vH) return false;  // target shorter than viewer
      return true;
    }
    return true;
  };

  /* ── Derived ── */
  const paginated = profiles.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(profiles.length / PER_PAGE);

  const ageHint = null;

  const toCardProps = (p: Profile) => {
    // Detect email-prefix-style names: no spaces, contains digits, all lowercase
    // e.g. "pmihindu7", "user123", "test_user" — not a real display name
    const looksLikeEmailPrefix = (n: string) => {
      if (!n) return true;
      const trimmed = n.trim();
      // Has no spaces AND (contains digits OR is all lowercase without capitals)
      const noSpaces = !trimmed.includes(' ');
      const hasDigits = /\d/.test(trimmed);
      const allLowerOrUnder = /^[a-z0-9_.-]+$/.test(trimmed);
      return noSpaces && (hasDigits || allLowerOrUnder);
    };

    const rawName = (p as any).nickname?.trim() || p.name?.trim() || '';
    const isPlaceholder = !rawName || rawName === p.memberId || rawName === 'Profile' || looksLikeEmailPrefix(rawName);
    const displayName = isPlaceholder ? (p.memberId ?? 'Profile') : rawName;
    return {
      name: displayName,
      city: p.city ?? '',
      isPrivate: true,
      isVerified: false,
      age: p.age,
      height: p.height ? `${p.height} cm` : '–',
      maritalStatus: p.civilStatus ?? 'Single',
      education: p.education ?? '–',
      job: p.occupation ?? '–',
      joinedMs: Date.now() - new Date(p.createdAt).getTime(),
      createdBy: p.createdBy ?? undefined,
    };
  };

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
              <SearchingAsDropdown
                profiles={userProfiles}
                selected={selectedProfile}
                onSelect={found => {
                  setSelectedProfile(found);
                  const opp = found.gender === 'MALE' ? 'FEMALE' : 'MALE';
                  const smart: Filters = { ...EMPTY_FILTERS, gender: opp };
                  setFilters(smart); setApplied(smart); setPage(1);
                }}
              />

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
          <input type="text" placeholder="e.g. USR-1" value={filters.memberId}
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
        <p className="text-[10px] text-gray-400 font-poppins mt-1">Format: USR-1</p>
      </div>

      <div className="border-t border-gray-100 pt-3">

        {/* Age Range */}
        <FilterSection label="Age Range">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span>Range</span>
              <span className="font-semibold text-[#1C3B35] font-poppins">
                {filters.minAge || ageRangeDefaults.min} – {filters.maxAge || ageRangeDefaults.max}
              </span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] text-gray-400 font-poppins mb-0.5">Min</label>
                <input
                  type="number"
                  min={ageRangeDefaults.min}
                  max={ageRangeDefaults.max - 1}
                  placeholder={String(ageRangeDefaults.min)}
                  value={filters.minAge}
                  onChange={e => setFilters(f => ({ ...f, minAge: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1C3B35] font-poppins"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-gray-400 font-poppins mb-0.5">Max</label>
                <input
                  type="number"
                  min={ageRangeDefaults.min + 1}
                  max={ageRangeDefaults.max}
                  placeholder={String(ageRangeDefaults.max)}
                  value={filters.maxAge}
                  onChange={e => setFilters(f => ({ ...f, maxAge: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1C3B35] font-poppins"
                />
              </div>
            </div>
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

        {/* Country */}
        <FilterSection label="Country">
          <select
            value={filters.country}
            onChange={e => setFilters(f => ({ ...f, country: e.target.value, city: '' }))}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1C3B35] font-poppins"
          >
            <option value="">Any Country</option>
            {(masterData?.countries ?? []).map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </FilterSection>

        {/* City — cascades from Country */}
        <FilterSection label="City">
          <select
            value={filters.city}
            onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
            disabled={!filters.country}
            className={`w-full border rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1C3B35] font-poppins ${
              filters.country ? 'border-gray-200' : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
          >
            <option value="">{filters.country ? 'Any City' : 'Select country first'}</option>
            {filters.country && (masterData?.countries.find(c => c.name === filters.country)?.cities ?? [])
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(ci => <option key={ci.id} value={ci.name}>{ci.name}</option>)
            }
          </select>
        </FilterSection>

        {/* Ethnicity — master data dropdown */}
        <FilterSection label="Ethnicity">
          <select
            value={filters.ethnicity}
            onChange={e => setFilters(f => ({ ...f, ethnicity: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1C3B35] font-poppins"
          >
            <option value="">Any Ethnicity</option>
            {(masterData?.ethnicity ?? []).map(e => (
              <option key={e.id} value={e.value}>{e.value}</option>
            ))}
          </select>
        </FilterSection>

        <FilterSection label="Civil Status">
          <RadioGroup options={CIVIL_STATUSES} value={filters.civilStatus} onChange={set('civilStatus')} labels={{ '': 'Any' }} />
        </FilterSection>

        <FilterSection label="Education Level">
          {masterData ? (
            <RadioGroup
              options={['', ...masterData.education.map(e => e.value)]}
              value={filters.education}
              onChange={set('education')}
              labels={{ '': 'Any' }}
            />
          ) : (
            <RadioGroup options={CIVIL_STATUSES} value={filters.education} onChange={set('education')} labels={{ '': 'Any' }} />
          )}
        </FilterSection>

        <FilterSection label="Profession">
          {masterData ? (
            <select
              value={filters.occupation}
              onChange={e => setFilters(f => ({ ...f, occupation: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#1C3B35] font-poppins"
            >
              <option value="">Any Occupation</option>
              {masterData.occupation.map(o => (
                <option key={o.id} value={o.value}>{o.value}</option>
              ))}
            </select>
          ) : (
            <TextFilter placeholder="e.g. Engineer" value={filters.occupation} onChange={set('occupation')} />
          )}
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
                <div className="bg-white border border-gray-100 rounded-2xl px-3 py-2.5 shadow-sm">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 font-poppins mb-1.5">Searching as</p>
                  <SearchingAsDropdown
                    profiles={userProfiles}
                    selected={selectedProfile}
                    compact
                    onSelect={found => {
                      setSelectedProfile(found);
                      const opp = found.gender === 'MALE' ? 'FEMALE' : 'MALE';
                      const smart: Filters = { ...EMPTY_FILTERS, gender: opp };
                      setFilters(smart); setApplied(smart); setPage(1);
                    }}
                  />
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
                <input type="text" placeholder="Search by Member ID (e.g. USR-1)"
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
                        gender={p.gender}
                        chatDisabled={isLoggedIn && !!selectedProfile && !canChat(p)}
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


          </div>
        </div>
      </div>
    </section>
  );
}
