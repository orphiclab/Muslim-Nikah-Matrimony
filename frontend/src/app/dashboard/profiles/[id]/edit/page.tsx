'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { profileApi } from '@/services/api';
import { loadMasterData } from '@/app/admin/master-file/data';

/* ── Types ─────────────────────────────────────────────────────── */
type FormState = {
  name: string;
  dateOfBirth: string;
  height: string;
  weight: string;
  complexion: string;
  appearance: string;
  dressCode: string;
  ethnicity: string;
  civilStatus: string;
  familyStatus: string;
  country: string;
  city: string;
  residentCountry: string;
  residentCity: string;
  residencyStatus: string;
  education: string;
  fieldOfStudy: string;
  occupation: string;
  profession: string;
  fatherEthnicity: string;
  fatherCountry: string;
  fatherCity: string;
  fatherOccupation: string;
  motherEthnicity: string;
  motherCountry: string;
  motherCity: string;
  motherOccupation: string;
  brothers: string;
  sisters: string;
  countryPreference: string;
  minAgePreference: string;
  maxAgePreference: string;
  aboutUs: string;
  expectations: string;
  extraQualification: string;
};

const EMPTY: FormState = {
  name: '', dateOfBirth: '', height: '', weight: '',
  complexion: '', appearance: '', dressCode: '', ethnicity: '',
  civilStatus: '', familyStatus: '',
  country: '', city: '', residentCountry: '', residentCity: '', residencyStatus: '',
  education: '', fieldOfStudy: '', occupation: '', profession: '',
  fatherEthnicity: '', fatherCountry: '', fatherCity: '', fatherOccupation: '',
  motherEthnicity: '', motherCountry: '', motherCity: '', motherOccupation: '',
  brothers: '', sisters: '', countryPreference: '', minAgePreference: '', maxAgePreference: '',
  aboutUs: '', expectations: '', extraQualification: '',
};

/* ── Field component ────────────────────────────────────────────── */
const ChevronDown = () => (
  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

function Field({
  label, name, value, onChange, type = 'text', options, disabled, rows, maxLength,
}: {
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (k: keyof FormState, v: string) => void;
  type?: string;
  options?: { value: string; label: string }[];
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
}) {
  const base =
    'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20 focus:border-[#1C3B35] transition bg-white placeholder-gray-300 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed';

  const blockDigitsKb = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key >= '0' && e.key <= '9') e.preventDefault();
  };
  const blockDigitsPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/[0-9]/g, '');
    document.execCommand('insertText', false, text);
  };
  const blockNonNumeric = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(e.key) && !['Backspace','Delete','Tab','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
  };

  const MAX_TEXT = 300;
  const len = rows ? (value ?? '').length : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      {options ? (
        <div className="relative">
          <select
            name={name}
            value={value}
            disabled={disabled}
            onChange={e => onChange(name, e.target.value)}
            className={`${base} appearance-none cursor-pointer pr-9`}
          >
            <option value="">— Select —</option>
            {/* Ensure the currently saved value is always present as an option
                even if master data hasn't loaded yet or the value is from a
                legacy/different label set — prevents falling back to blank. */}
            {value && !options.some(o => o.value === value) && (
              <option key={`__current__${value}`} value={value}>{value}</option>
            )}
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown />
        </div>
      ) : rows ? (
        <>
          <textarea
            name={name}
            value={value}
            rows={rows}
            disabled={disabled}
            onChange={e => onChange(name, e.target.value)}
            maxLength={MAX_TEXT}
            onKeyDown={blockDigitsKb}
            onPaste={blockDigitsPaste}
            className={`${base} resize-none`}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
          <p className={`text-[10px] text-right -mt-1 ${len >= MAX_TEXT ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>{len}/{MAX_TEXT}</p>
        </>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          disabled={disabled}
          maxLength={maxLength}
          onKeyDown={type === 'number' && maxLength ? blockNonNumeric : undefined}
          onChange={e => onChange(name, e.target.value)}
          className={base}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      )}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-5 py-3.5 bg-[#F0F4F2] border-b border-gray-100 rounded-t-2xl">
        <h3 className="text-xs font-bold text-[#1C3B35] uppercase tracking-wider">{title}</h3>
      </div>
      <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-b-2xl">{children}</div>
    </div>
  );
}

/* ── Multi-Country Select ────────────────────────────────────────── */
function MultiCountrySelect({
  selected,
  onChange,
  countries,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
  countries: string[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (country: string) => {
    if (selected.includes(country)) {
      onChange(selected.filter(c => c !== country));
    } else {
      onChange([...selected, country]);
    }
  };

  const filtered = countries.filter(
    c => c.toLowerCase().includes(search.toLowerCase()) && !selected.includes(c)
  );

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
        Country Preference
        <span className="ml-1.5 text-[10px] font-normal text-gray-400 normal-case">(select multiple)</span>
      </label>

      {/* Selected pill tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1">
          {selected.map(c => (
            <span
              key={c}
              className="inline-flex items-center gap-1 bg-[#1C3B35]/10 text-[#1C3B35] text-xs font-semibold px-2.5 py-1 rounded-full"
            >
              {c}
              <button
                type="button"
                onClick={() => toggle(c)}
                className="ml-0.5 text-[#1C3B35]/60 hover:text-[#1C3B35] rounded-full leading-none text-sm transition"
                aria-label={`Remove ${c}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setOpen(o => !o); setSearch(''); }}
          className="w-full flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 bg-white hover:border-[#1C3B35]/40 focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20 focus:border-[#1C3B35] transition"
        >
          <span className={selected.length === 0 ? 'text-gray-300' : 'text-gray-700 font-medium'}>
            {selected.length === 0 ? 'Select countries…' : `${selected.length} selected`}
          </span>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-[200] mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Search */}
            <div className="px-3 pt-2.5 pb-1.5 border-b border-gray-100">
              <input
                type="text"
                autoFocus
                placeholder="Search country…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20 focus:border-[#1C3B35] transition"
              />
            </div>
            {/* Options list */}
            <ul className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-4 py-2.5 text-xs text-gray-400 italic">No countries found</li>
              ) : (
                filtered.map(c => (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => toggle(c)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#1C3B35]/5 flex items-center gap-2 transition"
                    >
                      <span className="w-4 h-4 rounded border border-gray-300 bg-white flex items-center justify-center flex-shrink-0" />
                      {c}
                    </button>
                  </li>
                ))
              )}
            </ul>
            {/* Already selected at bottom */}
            {selected.length > 0 && (
              <div className="border-t border-gray-100 py-1">
                {selected.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggle(c)}
                    className="w-full text-left px-4 py-2 text-sm text-[#1C3B35] font-medium hover:bg-[#1C3B35]/5 flex items-center gap-2 transition"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────── */
const CIVIL_STATUS_OPTS = [
  { value: 'Never Married', label: 'Never Married' },
  { value: 'Divorced', label: 'Divorced' },
  { value: 'Widowed', label: 'Widowed' },
  { value: 'Separated', label: 'Separated' },
  { value: 'Other', label: 'Other' },
];
const COMPLEXION_OPTS = [
  { value: 'Very Fair', label: 'Very Fair' },
  { value: 'Fair', label: 'Fair' },
  { value: 'Wheatish', label: 'Wheatish' },
  { value: 'Olive', label: 'Olive' },
  { value: 'Brown', label: 'Brown' },
  { value: 'Dark', label: 'Dark' },
];
const APPEARANCE_OPTS = [
  { value: 'Very Fair', label: 'Very Fair' },
  { value: 'Fair', label: 'Fair' },
  { value: 'Average', label: 'Average' },
  { value: 'Good Looking', label: 'Good Looking' },
  { value: 'Very Good Looking', label: 'Very Good Looking' },
];
const DRESS_CODE_OPTS = [
  { value: 'Traditional', label: 'Traditional' },
  { value: 'Modern', label: 'Modern' },
  { value: 'Hijab', label: 'Hijab' },
  { value: 'Niqab', label: 'Niqab' },
  { value: 'Casual', label: 'Casual' },
  { value: 'Formal', label: 'Formal' },
];
const FAMILY_STATUS_OPTS = [
  { value: 'Upper Class', label: 'Upper Class' },
  { value: 'Upper Middle Class', label: 'Upper Middle Class' },
  { value: 'Middle Class', label: 'Middle Class' },
  { value: 'Lower Middle Class', label: 'Lower Middle Class' },
  { value: 'Lower Class', label: 'Lower Class' },
  { value: 'Rich', label: 'Rich' },
];
const RESIDENCY_OPTS = [
  { value: 'Citizen', label: 'Citizen' },
  { value: 'Permanent Resident', label: 'Permanent Resident' },
  { value: 'Visa Holder', label: 'Visa Holder' },
  { value: 'Student Visa', label: 'Student Visa' },
  { value: 'Work Visa', label: 'Work Visa' },
  { value: 'Other', label: 'Other' },
];

/* ── Page ──────────────────────────────────────────────────────── */
export default function EditProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [gender, setGender] = useState('');
  const [form, setForm] = useState<FormState>(EMPTY);
  const [countryPrefList, setCountryPrefList] = useState<string[]>([]);
  const [masterCountries, setMasterCountries] = useState<string[]>([]);
  const [masterData, setMasterData] = useState<import('@/app/admin/master-file/data').MasterData | null>(null);
  const [educationOpts, setEducationOpts] = useState<{ value: string; label: string }[]>([]);
  const [occupationOpts, setOccupationOpts] = useState<{ value: string; label: string }[]>([]);
  const [dressCodeOpts, setDressCodeOpts] = useState<{ value: string; label: string }[]>([]);
  const [ethnicityOpts, setEthnicityOpts] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load master data (countries, education, occupation, dressCode, ethnicity)
  useEffect(() => {
    const md = loadMasterData();
    setMasterData(md);
    setMasterCountries(md.countries.map(c => c.name).sort());
    setEducationOpts(md.education.map(e => ({ value: e.value, label: e.value })));
    setOccupationOpts(md.occupation.map(o => ({ value: o.value, label: o.value })));
    setDressCodeOpts(md.dressCode.map(d => ({ value: d.value, label: d.value })));
    setEthnicityOpts(md.ethnicity.map(e => ({ value: e.value, label: e.value })));
  }, []);

  // Helper: get city options for a given country name
  const citiesFor = (countryName: string) => {
    if (!masterData || !countryName) return [];
    const found = masterData.countries.find(c => c.name === countryName);
    return (found?.cities ?? []).map(ci => ({ value: ci.name, label: ci.name }));
  };

  useEffect(() => {
    if (!id) return;
    profileApi.getOne(id)
      .then((r) => {
        const p = r.data ?? r;
        setGender(p.gender ?? '');
        setForm({
          name: p.name ?? '',
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
          height: p.height != null ? String(p.height) : '',
          weight: p.weight != null ? String(p.weight) : '',
          complexion: p.complexion ?? '',
          appearance: p.appearance ?? '',
          dressCode: p.dressCode ?? '',
          ethnicity: p.ethnicity ?? '',
          civilStatus: p.civilStatus ?? '',
          familyStatus: p.familyStatus ?? '',
          country: p.country ?? '',
          city: p.city ?? '',
          residentCountry: p.residentCountry ?? '',
          residentCity: p.residentCity ?? '',
          residencyStatus: p.residencyStatus ?? '',
          education: p.education ?? '',
          fieldOfStudy: p.fieldOfStudy ?? '',
          occupation: p.occupation ?? '',
          profession: p.profession ?? '',
          fatherEthnicity: p.fatherEthnicity ?? '',
          fatherCountry: p.fatherCountry ?? '',
          fatherCity: p.fatherCity ?? '',
          fatherOccupation: p.fatherOccupation ?? '',
          motherEthnicity: p.motherEthnicity ?? '',
          motherCountry: p.motherCountry ?? '',
          motherCity: p.motherCity ?? '',
          motherOccupation: p.motherOccupation ?? '',
          brothers: p.brothers != null ? String(p.brothers) : '',
          sisters: p.sisters != null ? String(p.sisters) : '',
          countryPreference: p.countryPreference ?? '',
          minAgePreference: p.minAgePreference != null ? String(p.minAgePreference) : '',
          maxAgePreference: p.maxAgePreference != null ? String(p.maxAgePreference) : '',
          aboutUs: p.aboutUs ?? '',
          expectations: p.expectations ?? '',
          extraQualification: p.extraQualification ?? '',
        });
        // parse comma-separated country preference into array
        const prefStr = p.countryPreference?.trim() ?? '';
        if (prefStr) {
          setCountryPrefList(prefStr.split(',').map((s: string) => s.trim()).filter(Boolean));
        }
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Keep form.countryPreference in sync with countryPrefList
  const handleCountryPrefChange = (list: string[]) => {
    setCountryPrefList(list);
    setForm(f => ({ ...f, countryPreference: list.join(',') }));
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const payload: any = { ...form };

      // Always include gender (backend requires it, but it's locked/read-only for the user)
      payload.gender = gender;

      // Convert numeric fields
      if (payload.height) payload.height = Number(payload.height);
      if (payload.weight) payload.weight = Number(payload.weight);
      if (payload.brothers !== '' && payload.brothers != null) payload.brothers = Number(payload.brothers);
      else delete payload.brothers;
      if (payload.sisters !== '' && payload.sisters != null) payload.sisters = Number(payload.sisters);
      else delete payload.sisters;
      // Compute total siblings from brothers + sisters
      const b = payload.brothers ?? 0;
      const s = payload.sisters ?? 0;
      if (payload.brothers != null || payload.sisters != null) payload.siblings = b + s;

      // Fields that must always be sent (even as empty string) so backend can
      // detect clears and apply them correctly.
      // Do NOT strip these to undefined.
      const ALWAYS_SEND = new Set(['name', 'gender', 'countryPreference', 'dateOfBirth',
        'aboutUs', 'expectations', 'extraQualification']);

      // Strip empty strings → undefined for truly optional fields only
      Object.keys(payload).forEach(k => {
        if (!ALWAYS_SEND.has(k) && payload[k] === '') payload[k] = undefined;
      });

      await profileApi.submitEditRequest(id, payload);
      setSuccess(true);
      setTimeout(() => router.push(`/dashboard/profiles/${id}`), 1500);
    } catch (e: any) {
      setError(e.message ?? 'Failed to submit edit request');
    } finally {
      setSaving(false);
    }
  };


  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400 font-poppins">
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Loading profile…
    </div>
  );

  if (error && !form.name) return (
    <div className="text-center py-16 font-poppins">
      <p className="text-red-500 mb-4">{error}</p>
      <button onClick={() => router.back()} className="text-sm text-[#1C3B35] underline">Go back</button>
    </div>
  );

  return (
    <div className="font-poppins space-y-6 max-w-4xl mx-auto pb-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/dashboard/profiles" className="hover:text-[#1C3B35] transition">My Profiles</Link>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
        <Link href={`/dashboard/profiles/${id}`} className="hover:text-[#1C3B35] transition truncate">{form.name || 'Profile'}</Link>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
        <span className="text-gray-600 font-medium">Edit</span>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-br from-[#1C3B35] to-[#2d6352] rounded-2xl px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center ring-2 ring-white/30 flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Edit Profile</h1>
            <p className="text-xs text-white/60 mt-0.5">Update your profile information</p>
          </div>
        </div>
        {/* Gender — read-only locked badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">Gender:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white text-xs font-semibold">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            {gender === 'MALE' ? '♂ Male' : '♀ Female'}
            <span className="text-white/50 text-[9px] ml-0.5">(locked)</span>
          </span>
        </div>
      </div>

      {/* ── Under-review info banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div>
          <p className="text-xs font-semibold text-amber-700">Changes require admin approval</p>
          <p className="text-xs text-amber-600 mt-0.5">Your updated profile will be reviewed by our team before going live. You'll receive an SMS once it's approved.</p>
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          Edit request submitted! Our team will review and approve it shortly.
        </div>
      )}

      {/* ── Personal Details ──────────────────────────────────────────── */}
      <SectionCard title="Personal Details">
        <Field label="Date of Birth" name="dateOfBirth" value={form.dateOfBirth} onChange={set} type="date" />
        <Field label="Height (cm)" name="height" value={form.height} onChange={set} type="number" />
        <Field label="Weight (kg)" name="weight" value={form.weight} onChange={set} type="number" />
        <Field label="Complexion" name="complexion" value={form.complexion} onChange={set} options={COMPLEXION_OPTS} />
        <Field label="Appearance" name="appearance" value={form.appearance} onChange={set} options={APPEARANCE_OPTS} />
        <Field label="Dress Code" name="dressCode" value={form.dressCode} onChange={set} options={dressCodeOpts.length ? dressCodeOpts : DRESS_CODE_OPTS} />
        <Field label="Ethnicity" name="ethnicity" value={form.ethnicity} onChange={set} options={ethnicityOpts.length ? ethnicityOpts : undefined} />
        <Field label="Civil Status" name="civilStatus" value={form.civilStatus} onChange={set} options={CIVIL_STATUS_OPTS} />
        <Field label="Family Status" name="familyStatus" value={form.familyStatus} onChange={set} options={FAMILY_STATUS_OPTS} />
      </SectionCard>

      {/* ── Location & Education ──────────────────────────────────────── */}
      <SectionCard title="Location & Education">
        <Field label="Country" name="country" value={form.country}
          onChange={(k, v) => { set(k, v); set('city', ''); }}
          options={masterCountries.length ? masterCountries.map(c => ({ value: c, label: c })) : undefined} />
        <Field label="City" name="city" value={form.city} onChange={set}
          options={citiesFor(form.country).length ? citiesFor(form.country) : undefined} />
        <Field label="Resident Country" name="residentCountry" value={form.residentCountry}
          onChange={(k, v) => { set(k, v); set('residentCity', ''); }}
          options={masterCountries.length ? masterCountries.map(c => ({ value: c, label: c })) : undefined} />
        <Field label="Resident City" name="residentCity" value={form.residentCity} onChange={set}
          options={citiesFor(form.residentCountry).length ? citiesFor(form.residentCountry) : undefined} />
        <Field label="Residency Status" name="residencyStatus" value={form.residencyStatus} onChange={set} options={RESIDENCY_OPTS} />
        <Field label="Education" name="education" value={form.education} onChange={set}
          options={educationOpts.length ? educationOpts : undefined} />
        <Field label="Field of Study" name="fieldOfStudy" value={form.fieldOfStudy} onChange={set} />
        <Field label="Occupation" name="occupation" value={form.occupation} onChange={set}
          options={occupationOpts.length ? occupationOpts : undefined} />
        <Field label="Profession / Job Title" name="profession" value={form.profession} onChange={set} />
      </SectionCard>

      {/* ── Family Details ────────────────────────────────────────────── */}
      <SectionCard title="Family Details">
        <Field label="Father's Ethnicity" name="fatherEthnicity" value={form.fatherEthnicity} onChange={set}
          options={ethnicityOpts.length ? ethnicityOpts : undefined} />
        <Field label="Father's Country" name="fatherCountry" value={form.fatherCountry}
          onChange={(k, v) => { set(k, v); set('fatherCity', ''); }}
          options={masterCountries.length ? masterCountries.map(c => ({ value: c, label: c })) : undefined} />
        <Field label="Father's City" name="fatherCity" value={form.fatherCity} onChange={set}
          options={citiesFor(form.fatherCountry).length ? citiesFor(form.fatherCountry) : undefined} />
        <Field label="Father's Occupation" name="fatherOccupation" value={form.fatherOccupation} onChange={set} />
        <Field label="Mother's Ethnicity" name="motherEthnicity" value={form.motherEthnicity} onChange={set}
          options={ethnicityOpts.length ? ethnicityOpts : undefined} />
        <Field label="Mother's Country" name="motherCountry" value={form.motherCountry}
          onChange={(k, v) => { set(k, v); set('motherCity', ''); }}
          options={masterCountries.length ? masterCountries.map(c => ({ value: c, label: c })) : undefined} />
        <Field label="Mother's City" name="motherCity" value={form.motherCity} onChange={set}
          options={citiesFor(form.motherCountry).length ? citiesFor(form.motherCountry) : undefined} />
        <Field label="Mother's Occupation" name="motherOccupation" value={form.motherOccupation} onChange={set} />
        <Field label="No. of Brothers" name="brothers" value={form.brothers} onChange={set} type="number" maxLength={2} />
        <Field label="No. of Sisters" name="sisters" value={form.sisters} onChange={set} type="number" maxLength={2} />
      </SectionCard>

      {/* ── Preferences ───────────────────────────────────────────────── */}
      <SectionCard title="Partner Preferences">
        <div className="sm:col-span-2">
          <MultiCountrySelect
            selected={countryPrefList}
            onChange={handleCountryPrefChange}
            countries={masterCountries}
          />
        </div>
        <Field label="Min Age Preference" name="minAgePreference" value={form.minAgePreference} onChange={set} type="number" maxLength={2} />
        <Field label="Max Age Preference" name="maxAgePreference" value={form.maxAgePreference} onChange={set} type="number" maxLength={2} />
      </SectionCard>

      {/* ── About & Expectations ──────────────────────────────────────── */}
      <SectionCard title="About & Expectations">
        <div className="sm:col-span-2">
          <Field label="About Me" name="aboutUs" value={form.aboutUs} onChange={set} rows={4} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Expectations" name="expectations" value={form.expectations} onChange={set} rows={4} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Extra Qualification (optional)" name="extraQualification" value={form.extraQualification} onChange={set} rows={3} />
        </div>
      </SectionCard>

      {/* ── Action buttons ────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <Link
          href={`/dashboard/profiles/${id}`}
          className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-3 rounded-2xl hover:bg-gray-50 transition flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={saving || success}
          className="flex-1 bg-[#1C3B35] text-white text-sm font-semibold py-3 rounded-2xl hover:bg-[#15302a] transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Submitting…
            </>
          ) : (
            <>
        
              Submit for Review
            </>
          )}
        </button>
      </div>

    </div>
  );
}
