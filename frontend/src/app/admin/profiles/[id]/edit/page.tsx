'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/services/api';
import { CascadeLocation } from '@/components/ui/CascadeLocation';

// ── Load countries from masterfile ────────────────────────────────────────
function loadCountryNames(): string[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('mn_master_data') : null;
    if (!raw) return FALLBACK_COUNTRIES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.countries) || parsed.countries.length === 0) return FALLBACK_COUNTRIES;
    return parsed.countries.map((c: any) => c.name as string);
  } catch { return FALLBACK_COUNTRIES; }
}
const FALLBACK_COUNTRIES = ['Sri Lanka','United Kingdom','Australia','Canada','UAE','Saudi Arabia','Qatar','USA','Malaysia','Other'];

// ── Multi-country select ──────────────────────────────────────────────────
function MultiCountrySelect({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { setCountries(loadCountryNames()); }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const toggle = (c: string) => onChange(selected.includes(c) ? selected.filter(x => x !== c) : [...selected, c]);
  const filtered = countries.filter(c => c.toLowerCase().includes(search.toLowerCase()) && !selected.includes(c));
  return (
    <div className="flex flex-col gap-1.5 sm:col-span-2" ref={ref}>
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Country Preference <span className="text-gray-400 normal-case font-normal">(select multiple)</span></label>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(c => (
            <span key={c} className="inline-flex items-center gap-1 bg-[#1C3B35]/10 text-[#1C3B35] text-xs font-semibold px-2.5 py-1 rounded-full">
              {c}
              <button type="button" onClick={() => toggle(c)} className="ml-0.5 text-[#1C3B35]/60 hover:text-[#1C3B35] leading-none transition">×</button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <button type="button" onClick={() => { setOpen(o => !o); setSearch(''); }}
          className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white hover:border-[#1C3B35]/40 focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/15 transition">
          <span className={selected.length === 0 ? 'text-gray-400' : 'text-gray-700 font-medium'}>
            {selected.length === 0 ? 'Select countries…' : `${selected.length} selected`}
          </span>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {open && (
          <div className="absolute z-[200] mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="px-3 pt-2.5 pb-1.5 border-b border-gray-100">
              <input autoFocus type="text" placeholder="Search country…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20 focus:border-[#1C3B35] transition"/>
            </div>
            <ul className="max-h-48 overflow-y-auto py-1">
              {filtered.length === 0 ? <li className="px-4 py-2.5 text-xs text-gray-400 italic">No countries found</li> :
                filtered.map(c => (
                  <li key={c}><button type="button" onClick={() => toggle(c)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#1C3B35]/5 flex items-center gap-2 transition">
                    <span className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"/>{c}
                  </button></li>
                ))}
            </ul>
            {selected.length > 0 && (
              <div className="border-t border-gray-100 py-1">
                {selected.map(c => (
                  <button key={c} type="button" onClick={() => toggle(c)}
                    className="w-full text-left px-4 py-2 text-sm text-[#1C3B35] font-medium hover:bg-[#1C3B35]/5 flex items-center gap-2 transition">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>{c}
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

// ── Helpers ───────────────────────────────────────────────────────────────
const sel = (opts: string[], val: string, set: (v: string) => void, label: string, required = false) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    <select value={val} onChange={e => set(e.target.value)}
      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1C3B35] focus:ring-2 focus:ring-[#1C3B35]/15 transition bg-white">
      <option value="">— Select —</option>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const inp = (val: string | number, set: (v: string) => void, label: string, type = 'text', placeholder = '', required = false) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1C3B35] focus:ring-2 focus:ring-[#1C3B35]/15 transition bg-white"
    />
  </div>
);

const ETHNICITIES = ['Muslim','Sri Lankan Moors','Indian Moors','Malays','Indian Malays','Arab (Middle Eastern)','Tamil','Indian','Memons','Turkish','European','Other'];

const STATUS_OPTIONS = [
  { value: 'ACTIVE',    label: 'Active',    color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'PAUSED',    label: 'Paused',    color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'INACTIVE',  label: 'Inactive',  color: 'bg-red-100 text-red-500 border-red-200' },
  { value: 'SUSPENDED', label: 'Suspended', color: 'bg-red-200 text-red-700 border-red-300' },
  { value: 'DRAFT',     label: 'Draft',     color: 'bg-gray-100 text-gray-500 border-gray-200' },
];

type FormState = {
  dateOfBirth: string;
  height: string; weight: string;
  complexion: string; appearance: string; dressCode: string;
  ethnicity: string; civilStatus: string; familyStatus: string;
  // Origin location (cascade)
  country: string; city: string;
  // Resident location (cascade)
  residentCountry: string; residentCity: string;
  residencyStatus: string;
  education: string; fieldOfStudy: string; occupation: string; profession: string;
  // Family
  siblings: string;
  fatherEthnicity: string; fatherCountry: string; fatherCity: string; fatherOccupation: string;
  motherEthnicity: string; motherCountry: string; motherCity: string; motherOccupation: string;
  // Preferences
  minAgePreference: string; maxAgePreference: string; countryPreference: string;
  aboutUs: string; expectations: string; extraQualification: string;
};

const EMPTY: FormState = {
  dateOfBirth: '', height: '', weight: '',
  complexion: '', appearance: '', dressCode: '', ethnicity: '', civilStatus: '', familyStatus: '',
  country: '', city: '', residentCountry: '', residentCity: '', residencyStatus: '',
  education: '', fieldOfStudy: '', occupation: '', profession: '',
  siblings: '',
  fatherEthnicity: '', fatherCountry: '', fatherCity: '', fatherOccupation: '',
  motherEthnicity: '', motherCountry: '', motherCity: '', motherOccupation: '',
  minAgePreference: '', maxAgePreference: '', countryPreference: '',
  aboutUs: '', expectations: '', extraQualification: '',
};

function mapToForm(p: any): FormState {
  const fmt = (v: any) => (v == null ? '' : String(v));
  const fmtDate = (v: any) => {
    if (!v) return '';
    try { return new Date(v).toISOString().slice(0, 10); } catch { return ''; }
  };
  return {
    dateOfBirth: fmtDate(p.dateOfBirth),
    height: fmt(p.height), weight: fmt(p.weight),
    complexion: fmt(p.complexion), appearance: fmt(p.appearance), dressCode: fmt(p.dressCode),
    ethnicity: fmt(p.ethnicity), civilStatus: fmt(p.civilStatus), familyStatus: fmt(p.familyStatus),
    country: fmt(p.country), city: fmt(p.city),
    residentCountry: fmt(p.residentCountry), residentCity: fmt(p.residentCity),
    residencyStatus: fmt(p.residencyStatus),
    education: fmt(p.education), fieldOfStudy: fmt(p.fieldOfStudy),
    occupation: fmt(p.occupation), profession: fmt(p.profession),
    siblings: fmt(p.siblings),
    fatherEthnicity: fmt(p.fatherEthnicity), fatherCountry: fmt(p.fatherCountry),
    fatherCity: fmt(p.fatherCity), fatherOccupation: fmt(p.fatherOccupation),
    motherEthnicity: fmt(p.motherEthnicity), motherCountry: fmt(p.motherCountry),
    motherCity: fmt(p.motherCity), motherOccupation: fmt(p.motherOccupation),
    minAgePreference: fmt(p.minAgePreference), maxAgePreference: fmt(p.maxAgePreference),
    countryPreference: fmt(p.countryPreference),
    aboutUs: fmt(p.aboutUs), expectations: fmt(p.expectations), extraQualification: fmt(p.extraQualification),
  };
}

// ── Card wrapper ──────────────────────────────────────────────────────────
function Card({ title, icon, children, cols = 2, overflow = 'overflow-hidden' }: { title: string; icon: string; children: React.ReactNode; cols?: number; overflow?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 ${overflow}`}>
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
        <span className="text-base">{icon}</span>
        <h2 className="text-sm font-bold text-gray-700">{title}</h2>
      </div>
      <div className={`px-5 py-5 grid grid-cols-1 sm:grid-cols-${cols} gap-4`}>{children}</div>
    </div>
  );
}

// Divider label inside a 2-col grid (spans both columns)
function SubLabel({ label }: { label: string }) {
  return (
    <div className="sm:col-span-2 flex items-center gap-3 mt-2">
      <span className="text-[11px] font-bold text-[#1C3B35] uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AdminProfileEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Status management
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);

  const setF = (k: keyof FormState) => (v: string) => setForm(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (!id) return;
    adminApi.getProfile(id)
      .then(r => {
        setProfile(r.data);
        setForm(mapToForm(r.data));
        setNewStatus(r.data.status);
      })
      .catch(() => setMsg({ text: 'Failed to load profile', ok: false }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await adminApi.adminUpdateProfile(id, { ...form });
      setMsg({ text: '✅ Profile updated successfully.', ok: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      setMsg({ text: `❌ ${e.message ?? 'Save failed'}`, ok: false });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus) return;
    setStatusSaving(true);
    setMsg(null);
    try {
      await adminApi.updateProfileStatus(id, newStatus, statusReason);
      setProfile((prev: any) => ({ ...prev, status: newStatus }));
      setMsg({ text: `✅ Status changed to ${newStatus}.`, ok: true });
      setStatusReason('');
    } catch (e: any) {
      setMsg({ text: `❌ ${e.message ?? 'Status change failed'}`, ok: false });
    } finally {
      setStatusSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="w-8 h-8 animate-spin text-[#1C3B35]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>
  );

  if (!profile) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <span className="text-4xl">⚠️</span>
      <p className="text-gray-500 text-sm">Profile not found</p>
      <button onClick={() => router.back()} className="text-sm text-[#1C3B35] font-semibold hover:underline">← Go back</button>
    </div>
  );

  const currentStatusCfg = STATUS_OPTIONS.find(s => s.value === profile.status);

  return (
    <div className="font-poppins space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/admin/profiles" className="hover:text-[#1C3B35] transition font-medium">Profiles</Link>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
        <Link href={`/admin/profiles/${id}`} className="hover:text-[#1C3B35] transition font-medium truncate">{profile.name}</Link>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium">Edit</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#121514]">Edit Profile — {profile.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{profile.memberId} · {profile.user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1 rounded-full font-bold border ${currentStatusCfg?.color ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {currentStatusCfg?.label ?? profile.status}
          </span>
          <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            ← Back
          </button>
        </div>
      </div>

      {/* Toast */}
      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium border ${msg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {/* ── Status Control Panel ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <span className="text-base">🔧</span>
          <h2 className="text-sm font-bold text-gray-700">Profile Status Control</h2>
        </div>
        <div className="px-5 py-5 space-y-4">
          <p className="text-xs text-gray-500">Change the visibility/access status of this profile. Suspended profiles cannot be seen or accessed by members.</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setNewStatus(opt.value)}
                className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition-all ${
                  newStatus === opt.value
                    ? `${opt.color} border-current ring-2 ring-offset-1 ring-current/30`
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {(newStatus === 'INACTIVE' || newStatus === 'SUSPENDED' || newStatus === 'DRAFT') && (
            <input
              value={statusReason}
              onChange={e => setStatusReason(e.target.value)}
              placeholder="Reason (optional — will be shown to the user)"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C3B35] focus:ring-2 focus:ring-[#1C3B35]/15 transition"
            />
          )}
          <button
            onClick={handleStatusChange}
            disabled={statusSaving || newStatus === profile.status}
            className="flex items-center gap-2 bg-[#1C3B35] hover:bg-[#15302a] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-50"
          >
            {statusSaving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
            {statusSaving ? 'Updating…' : 'Apply Status Change'}
          </button>
        </div>
      </div>

      {/* ── Personal Information ── */}
      <Card title="Personal Information" icon="👤">
        {inp(form.dateOfBirth, setF('dateOfBirth'), 'Date of Birth', 'date', '', true)}
        {inp(form.height, setF('height'), 'Height (cm)', 'number', 'e.g. 165')}
        {inp(form.weight, setF('weight'), 'Weight (kg)', 'number', 'e.g. 60')}
        {sel(['Very Fair','Fair','Wheatish','Brown','Dark Brown'], form.complexion, setF('complexion'), 'Complexion')}
        {sel(['Very Fair','Fair','Decent','Good Looking','Handsome','Beautiful'], form.appearance, setF('appearance'), 'Appearance')}
        {sel(['Hijab','Niqab','Casual Modest','Islamic Formal','Traditional'], form.dressCode, setF('dressCode'), 'Dress Code')}
        {sel(ETHNICITIES, form.ethnicity, setF('ethnicity'), 'Ethnicity')}
        {sel(['Single','Divorced','Widowed'], form.civilStatus, setF('civilStatus'), 'Civil Status')}
        {sel(['Upper Class','Upper Middle Class','Middle Class','Lower Middle Class'], form.familyStatus, setF('familyStatus'), 'Family Status')}
      </Card>

      {/* ── Location & Residency ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <span className="text-base">📍</span>
          <h2 className="text-sm font-bold text-gray-700">Location &amp; Residency</h2>
        </div>
        <div className="px-5 py-5 space-y-5">
          {/* Origin */}
          <div>
            <p className="text-[11px] font-bold text-[#1C3B35] uppercase tracking-widest mb-3">Country of Origin</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CascadeLocation
                country={form.country}
                city={form.city}
                onChange={(field, value) => {
                  if (field === 'country') { setF('country')(value); setF('city')(''); }
                  else setF('city')(value);
                }}
                required={false}
                countryLabel="Country"
                cityLabel="City"
              />
            </div>
          </div>

          {/* Residency */}
          <div className="border-t border-gray-100 pt-5">
            <p className="text-[11px] font-bold text-[#1C3B35] uppercase tracking-widest mb-3">Resident Location</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CascadeLocation
                country={form.residentCountry}
                city={form.residentCity}
                onChange={(field, value) => {
                  if (field === 'country') { setF('residentCountry')(value); setF('residentCity')(''); }
                  else setF('residentCity')(value);
                }}
                required={false}
                countryLabel="Resident Country"
                cityLabel="Resident City"
              />
            </div>
          </div>

          {/* Residency status */}
          <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sel(['Citizen','Permanent Resident','Student Visa','Work Visa','Other'], form.residencyStatus, setF('residencyStatus'), 'Residency Status')}
          </div>
        </div>
      </div>

      {/* ── Education & Career ── */}
      <Card title="Education &amp; Career" icon="🎓">
        {sel(['School','O/L','A/L','Diploma','HND',"Bachelor's Degree","Master's Degree",'PhD','Professional Qualification'], form.education, setF('education'), 'Education')}
        {inp(form.fieldOfStudy, setF('fieldOfStudy'), 'Field of Study')}
        {inp(form.occupation, setF('occupation'), 'Occupation')}
        {inp(form.profession, setF('profession'), 'Profession / Job Title')}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Extra Qualification</label>
          <textarea value={form.extraQualification} onChange={e => setF('extraQualification')(e.target.value)}
            rows={3} placeholder="Additional qualifications, certifications, skills…"
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1C3B35] focus:ring-2 focus:ring-[#1C3B35]/15 transition resize-none"
          />
        </div>
      </Card>

      {/* ── Family Details ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <span className="text-base">👨‍👩‍👧</span>
          <h2 className="text-sm font-bold text-gray-700">Family Details</h2>
        </div>
        <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Siblings — full row */}
          <div className="sm:col-span-2">
            {inp(form.siblings, setF('siblings'), 'Total Siblings', 'number', 'e.g. 3')}
          </div>

          {/* Father section */}
          <SubLabel label="Father" />
          {sel(ETHNICITIES, form.fatherEthnicity, setF('fatherEthnicity'), "Father's Ethnicity")}
          {inp(form.fatherOccupation, setF('fatherOccupation'), "Father's Occupation")}
          <div className="sm:col-span-2">
            <CascadeLocation
              country={form.fatherCountry} city={form.fatherCity}
              onChange={(field, val) => { if (field === 'country') { setF('fatherCountry')(val); setF('fatherCity')(''); } else setF('fatherCity')(val); }}
              required={false} countryLabel="Father's Country" cityLabel="Father's City"
            />
          </div>

          {/* Mother section */}
          <SubLabel label="Mother" />
          {sel(ETHNICITIES, form.motherEthnicity, setF('motherEthnicity'), "Mother's Ethnicity")}
          {inp(form.motherOccupation, setF('motherOccupation'), "Mother's Occupation")}
          <div className="sm:col-span-2">
            <CascadeLocation
              country={form.motherCountry} city={form.motherCity}
              onChange={(field, val) => { if (field === 'country') { setF('motherCountry')(val); setF('motherCity')(''); } else setF('motherCity')(val); }}
              required={false} countryLabel="Mother's Country" cityLabel="Mother's City"
            />
          </div>
        </div>
      </div>

      {/* ── Partner Preferences ── */}
      <Card title="Partner Preferences" icon="💑" overflow="overflow-visible">
        {inp(form.minAgePreference, setF('minAgePreference'), 'Min Age', 'number', 'e.g. 22')}
        {inp(form.maxAgePreference, setF('maxAgePreference'), 'Max Age', 'number', 'e.g. 35')}
        <MultiCountrySelect
          selected={form.countryPreference ? form.countryPreference.split(',').map(s => s.trim()).filter(Boolean) : []}
          onChange={vals => setF('countryPreference')(vals.join(','))}
        />
      </Card>

      {/* ── About & Expectations ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <span className="text-base">💬</span>
          <h2 className="text-sm font-bold text-gray-700">About &amp; Expectations</h2>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">About Me</label>
            <textarea value={form.aboutUs} onChange={e => setF('aboutUs')(e.target.value)} rows={4} placeholder="About this person…"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1C3B35] focus:ring-2 focus:ring-[#1C3B35]/15 transition resize-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Expectations</label>
            <textarea value={form.expectations} onChange={e => setF('expectations')(e.target.value)} rows={4} placeholder="What they're looking for…"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1C3B35] focus:ring-2 focus:ring-[#1C3B35]/15 transition resize-none"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3 pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#1C3B35] hover:bg-[#15302a] text-white font-bold text-sm px-8 py-3 rounded-xl transition shadow-sm disabled:opacity-50"
        >
          {saving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
          {saving ? 'Saving…' : '💾 Save All Changes'}
        </button>
        <button onClick={() => router.push(`/admin/profiles/${id}`)} className="text-sm text-gray-500 hover:text-gray-700 transition font-medium px-4 py-3">
          Cancel
        </button>
      </div>
    </div>
  );
}
