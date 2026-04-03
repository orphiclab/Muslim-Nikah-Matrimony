'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { profileApi } from '@/services/api';

// ── Constants matching registration flow ─────────────────────────────────────
const STEPS = ['Personal', 'Location & Edu', 'Family', 'Preferences', 'Review'];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const COUNTRIES = ['Sri Lanka','United Kingdom','Australia','Canada','UAE','Saudi Arabia','Qatar','USA','Malaysia','Other'];
const ETHNICITIES = ['Arab','South Asian','African','South East Asian','European','Other'];
const OCCUPATIONS_GENERAL = ['Employed','Self Employed','Business Owner','Student','Not Employed'];
const FATHER_OCCUPATIONS = ['Business','Government Employee','Private Sector','Retired','Not Employed','Deceased'];
const MOTHER_OCCUPATIONS = ['Business','Government Employee','Private Sector','Homemaker','Retired','Not Employed'];
const EDUCATIONS = ["High School","Diploma","Bachelor's Degree","Master's Degree","Doctorate (PhD)","Other"];
const RESIDENCY_STATUSES = ['Citizen','Permanent Resident','Work Visa','Student Visa','Other'];
const STATES = ['Western Province','Central Province','Southern Province','Northern Province','Eastern Province','Other'];
const APPEARANCES = ['Very Fair','Fair','Wheatish','Wheatish Brown','Dark'];
const COMPLEXIONS = ['Very Fair','Fair','Medium','Olive','Dark'];
const DRESS_CODES = ['Hijab','Niqab','Casual Modest','Islamic Formal','Traditional'];
const FAMILY_STATUSES = ['Upper Class','Upper Middle Class','Middle Class','Lower Middle Class'];
const CIVIL_STATUSES = ['Never Married','Widowed','Divorced','Separated','Other'];
const CHILDREN_OPTS = ['No','Yes - 1','Yes - 2','Yes - 3','Yes - 3+'];
const CREATED_BY_OPTS = ['Self','Parent','Guardian','Sibling'];

// ── Shared field components ───────────────────────────────────────────────────
const sel = (err?: string) =>
  `w-full border rounded-xl px-3.5 py-2.5 text-sm text-gray-700 outline-none focus:border-[#1C3B35] transition bg-gray-50 focus:bg-white ${err ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`;

function Field({ label, name, value, onChange, type = 'text', placeholder = '', required = false, error, optional = false }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
        {optional && <span className="text-gray-400 font-normal"> (optional)</span>}
      </label>
      <input type={type} name={name} value={value ?? ''} onChange={onChange} placeholder={placeholder}
        className={sel(error)} />
      {error && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  );
}

function Select({ label, name, value, onChange, options, required = false, error, placeholder = 'Select' }: {
  label: string; name: string; value: string; onChange: any;
  options: (string | { value: string; label: string })[];
  required?: boolean; error?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select name={name} value={value ?? ''} onChange={onChange} className={sel(error)}>
        <option value="">{placeholder}</option>
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value;
          const l = typeof o === 'string' ? o : o.label;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
      {error && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  );
}

function DobPicker({ day, month, year, onChange, error }: {
  day: string; month: string; year: string;
  onChange: (field: 'dob_day' | 'dob_month' | 'dob_year', value: string) => void;
  error?: string;
}) {
  const maxYear = new Date().getFullYear() - 16;
  const years = Array.from({ length: maxYear - 1939 }, (_, i) => maxYear - i);
  const daysInMonth = month && year ? new Date(Number(year), Number(month), 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const s = sel(error);
  return (
    <div className="col-span-2">
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
        Date of Birth <span className="text-red-400">*</span>
      </label>
      <div className="grid grid-cols-3 gap-2">
        <select value={day} onChange={e => onChange('dob_day', e.target.value)} className={s}>
          <option value="">Day</option>
          {days.map(d => <option key={d} value={String(d)}>{d}</option>)}
        </select>
        <select value={month} onChange={e => onChange('dob_month', e.target.value)} className={s}>
          <option value="">Month</option>
          {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
        </select>
        <select value={year} onChange={e => onChange('dob_year', e.target.value)} className={s}>
          <option value="">Year</option>
          {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
        </select>
      </div>
      {error && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  );
}

// ── Step icons ────────────────────────────────────────────────────────────────
const STEP_ICONS = [
  <svg key="p" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  <svg key="l" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  <svg key="f" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  <svg key="h" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  <svg key="c" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CreateProfilePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<any>({
    // Personal
    firstName: '', lastName: '', createdBy: '', gender: 'MALE',
    dob_day: '', dob_month: '', dob_year: '', dateOfBirth: '',
    height: '', appearance: '', complexion: '', ethnicity: '',
    dressCode: '', familyStatus: '', civilStatus: '', children: '',
    // Location & Edu
    country: '', state: '', city: '', residencyStatus: '',
    education: '', fieldOfStudy: '', occupation: '', profession: '',
    // Family
    fatherEthnicity: '', fatherCountry: '', fatherOccupation: '', fatherCity: '',
    motherEthnicity: '', motherCountry: '', motherOccupation: '', motherCity: '',
    brothers: '', sisters: '',
    // Preferences
    minAgePreference: '', maxAgePreference: '', countryPreference: '', minHeightPreference: '',
  });
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  const handleField = (e: any) => {
    const { name, value } = e.target;
    setForm((f: any) => ({ ...f, [name]: value }));
    setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleDob = (field: 'dob_day' | 'dob_month' | 'dob_year', value: string) => {
    setForm((f: any) => {
      const next = { ...f, [field]: value };
      if (next.dob_day && next.dob_month && next.dob_year) {
        const d = String(next.dob_day).padStart(2, '0');
        const m = String(next.dob_month).padStart(2, '0');
        next.dateOfBirth = `${next.dob_year}-${m}-${d}`;
      } else { next.dateOfBirth = ''; }
      return next;
    });
    setFieldErrors(prev => { const n = { ...prev }; delete n.dateOfBirth; return n; });
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const calcAge = (dob: string): number | null => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  // ── Validation matching registration flow ──────────────────────────────────
  const validateStep = (s: number): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!form.firstName?.trim()) errs.firstName = 'First name is required.';
      if (!form.lastName?.trim()) errs.lastName = 'Last name is required.';
      if (!form.createdBy) errs.createdBy = 'Please select who is creating this profile.';
      if (!form.gender) errs.gender = 'Please select a gender.';
      if (!form.dateOfBirth) {
        errs.dateOfBirth = 'Date of birth is required.';
      } else {
        const birth = new Date(form.dateOfBirth);
        const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear() - 16);
        if (birth > cutoff) errs.dateOfBirth = 'You must be at least 16 years old.';
      }
      if (!form.height) {
        errs.height = 'Please enter a height.';
      } else {
        const h = parseInt(form.height, 10);
        if (isNaN(h) || h < 100 || h > 250) errs.height = 'Height must be between 100 and 250 cm.';
      }
      if (!form.appearance) errs.appearance = 'Please select an appearance.';
      if (!form.complexion) errs.complexion = 'Please select a complexion.';
      if (!form.ethnicity) errs.ethnicity = 'Please select an ethnicity.';
      if (!form.dressCode) errs.dressCode = 'Please select a dress code.';
      if (!form.familyStatus) errs.familyStatus = 'Please select a family status.';
      if (!form.civilStatus) errs.civilStatus = 'Please select a civil status.';
      if (!form.children) errs.children = 'Please select children status.';
    }
    if (s === 1) {
      if (!form.country) errs.country = 'Please select a country.';
      if (!form.state) errs.state = 'Please select a state/province.';
      if (!form.city?.trim()) errs.city = 'City is required.';
      if (!form.residencyStatus) errs.residencyStatus = 'Please select a residency status.';
      if (!form.education) errs.education = 'Please select an education level.';
      if (!form.occupation) errs.occupation = 'Please select an occupation.';
    }
    if (s === 2) {
      if (!form.fatherEthnicity) errs.fatherEthnicity = "Please select father's ethnicity.";
      if (!form.fatherCountry) errs.fatherCountry = "Please select father's country.";
      if (!form.fatherOccupation) errs.fatherOccupation = "Please select father's occupation.";
      if (!form.fatherCity?.trim()) errs.fatherCity = "Father's city is required.";
      if (!form.motherEthnicity) errs.motherEthnicity = "Please select mother's ethnicity.";
      if (!form.motherCountry) errs.motherCountry = "Please select mother's country.";
      if (!form.motherOccupation) errs.motherOccupation = "Please select mother's occupation.";
      if (!form.motherCity?.trim()) errs.motherCity = "Mother's city is required.";
    }
    if (s === 3) {
      const minA = form.minAgePreference ? Number(form.minAgePreference) : null;
      const maxA = form.maxAgePreference ? Number(form.maxAgePreference) : null;
      const minH = form.minHeightPreference ? Number(form.minHeightPreference) : null;
      const personAge = calcAge(form.dateOfBirth);
      const personHeight = form.height ? parseInt(form.height, 10) : null;
      const isFemale = form.gender === 'FEMALE';
      const isMale   = form.gender === 'MALE';

      // Age range sanity
      if (minA !== null && minA < 16) errs.minAgePreference = 'Minimum age must be at least 16.';
      if (maxA !== null && maxA < 16) errs.maxAgePreference = 'Maximum age must be at least 16.';
      if (maxA !== null && minA !== null && maxA <= minA) errs.maxAgePreference = 'Max age must be greater than min age.';

      // Gender-based age rules
      if (isFemale && personAge !== null) {
        if (minA !== null && minA < personAge) errs.minAgePreference = `Female preference: age must be ≥ your age (${personAge}).`;
        if (maxA !== null && maxA < personAge) errs.maxAgePreference = `Female preference: age must be ≥ your age (${personAge}).`;
      }
      if (isMale && personAge !== null) {
        if (minA !== null && minA > personAge) errs.minAgePreference = `Male preference: age must be ≤ your age (${personAge}).`;
        if (maxA !== null && maxA > personAge) errs.maxAgePreference = `Male preference: age must be ≤ your age (${personAge}).`;
      }

      // Height range sanity
      if (minH !== null && (minH < 100 || minH > 250)) errs.minHeightPreference = 'Height must be between 100–250 cm.';

      // Gender-based height rules
      if (isFemale && personHeight !== null && minH !== null && minH < personHeight)
        errs.minHeightPreference = `Female preference: must be ≥ your height (${personHeight} cm).`;
      if (isMale && personHeight !== null && minH !== null && minH > personHeight)
        errs.minHeightPreference = `Male preference: must be ≤ your height (${personHeight} cm).`;
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setStep(s => s + 1);
  };

  const handleCreate = async () => {
    // Run all validations
    const allErrs = { ...validateStep(0), ...validateStep(1), ...validateStep(2), ...validateStep(3) };
    if (Object.keys(allErrs).length > 0) {
      setFieldErrors(allErrs);
      if (Object.keys(validateStep(0)).length > 0) setStep(0);
      else if (Object.keys(validateStep(1)).length > 0) setStep(1);
      else if (Object.keys(validateStep(2)).length > 0) setStep(2);
      else setStep(3);
      return;
    }
    setSaving(true); setApiError('');
    try {
      const toInt = (v: any) => { const n = parseInt(v, 10); return isNaN(n) ? undefined : n; };
      // Only send fields the backend DTO accepts
      const payload: Record<string, any> = {
        name:                `${form.firstName.trim()} ${form.lastName.trim()}`,
        gender:              form.gender,        // already 'MALE'/'FEMALE'
        dateOfBirth:         form.dateOfBirth,
        height:              form.height ? toInt(form.height) : undefined,
        appearance:          form.appearance     || undefined,
        complexion:          form.complexion     || undefined,
        ethnicity:           form.ethnicity      || undefined,
        dressCode:           form.dressCode      || undefined,
        civilStatus:         form.civilStatus    || undefined,
        children:            form.children       || undefined,
        country:             form.country        || undefined,
        state:               form.state          || undefined,
        city:                form.city           || undefined,
        residencyStatus:     form.residencyStatus|| undefined,
        education:           form.education      || undefined,
        fieldOfStudy:        form.fieldOfStudy   || undefined,
        occupation:          form.occupation     || undefined,
        profession:          form.profession     || undefined,
        familyStatus:        form.familyStatus   || undefined,
        createdBy:           form.createdBy      || undefined,
        fatherEthnicity:     form.fatherEthnicity|| undefined,
        fatherCountry:       form.fatherCountry  || undefined,
        fatherOccupation:    form.fatherOccupation|| undefined,
        fatherCity:          form.fatherCity     || undefined,
        motherEthnicity:     form.motherEthnicity|| undefined,
        motherCountry:       form.motherCountry  || undefined,
        motherOccupation:    form.motherOccupation|| undefined,
        motherCity:          form.motherCity     || undefined,
        siblings:            (parseInt(form.brothers||'0') + parseInt(form.sisters||'0')) || undefined,
        minAgePreference:    form.minAgePreference ? toInt(form.minAgePreference) : undefined,
        maxAgePreference:    form.maxAgePreference ? toInt(form.maxAgePreference) : undefined,
        minHeightPreference: form.minHeightPreference ? toInt(form.minHeightPreference) : undefined,
        countryPreference:   form.countryPreference || undefined,
      };
      // Strip undefined
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
      const res = await profileApi.create(payload);
      const newId = res?.data?.id ?? res?.id ?? '';
      router.push(`/select-plan?profileId=${encodeURIComponent(newId)}`);
    } catch (e: any) {
      setApiError(e.message ?? 'Failed to create profile. Please try again.');
    } finally { setSaving(false); }
  };

  const g2 = 'grid grid-cols-2 gap-4';

  return (
    <div className="min-h-screen bg-[#F5F7F5] font-poppins">
      {/* Top bar */}
      <div className="bg-[#1C3B35] px-6 py-4 flex items-center gap-4 shadow-sm">
        <button onClick={() => router.push('/dashboard/profiles')}
          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">Create New Profile</h1>
          <p className="text-xs text-white/60 mt-0.5">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Step indicators */}
        <div className="flex items-center justify-between mb-6 px-2">
          {STEPS.map((label, i) => {
            const done = i < step; const active = i === step;
            return (
              <div key={label} className="flex flex-col items-center gap-1.5 flex-1">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                  done ? 'bg-[#1C3B35] text-white' : active ? 'bg-white border-2 border-[#1C3B35] text-[#1C3B35]' : 'bg-white border-2 border-gray-200 text-gray-300'
                }`}>
                  {done
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    : STEP_ICONS[i]}
                </div>
                <span className={`text-[10px] font-semibold hidden sm:block ${active ? 'text-[#1C3B35]' : done ? 'text-[#1C3B35]/60' : 'text-gray-300'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-[#1C3B35]' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#F0F4F2] border-b border-gray-100 px-6 py-4">
            <h2 className="font-bold text-[#1C3B35] text-base">{STEPS[step]}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {['Fill in personal details','Where are you based?','About your family','What are you looking for?','Review before creating'][step]}
            </p>
          </div>

          <div className="px-6 py-6 space-y-4">

            {/* ── Step 0: Personal Details ──────────────────────────────── */}
            {step === 0 && (
              <>
                <div className={g2}>
                  <Field label="First Name" name="firstName" value={form.firstName} onChange={handleField} placeholder="e.g. Ahmed" required error={fieldErrors.firstName} />
                  <Field label="Last Name" name="lastName" value={form.lastName} onChange={handleField} placeholder="e.g. Hassan" required error={fieldErrors.lastName} />
                </div>
                <div className={g2}>
                  <Select label="Created By" name="createdBy" value={form.createdBy} onChange={handleField} options={CREATED_BY_OPTS} required error={fieldErrors.createdBy} />
                  <Select label="Gender" name="gender" value={form.gender} onChange={handleField}
                    options={[
                      { value: 'MALE', label: 'Male' },
                      { value: 'FEMALE', label: 'Female' },
                    ]}
                    required error={fieldErrors.gender} />
                </div>
                <div className="grid grid-cols-1">
                  <DobPicker day={form.dob_day} month={form.dob_month} year={form.dob_year} onChange={handleDob} error={fieldErrors.dateOfBirth} />
                </div>
                <div className={g2}>
                  <Field label="Height (cm)" name="height" value={form.height} onChange={handleField} type="number" placeholder="e.g. 170" error={fieldErrors.height} />
                  <Select label="Appearance" name="appearance" value={form.appearance} onChange={handleField} options={APPEARANCES} required error={fieldErrors.appearance} />
                </div>
                <div className={g2}>
                  <Select label="Complexion" name="complexion" value={form.complexion} onChange={handleField} options={COMPLEXIONS} required error={fieldErrors.complexion} />
                  <Select label="Ethnicity" name="ethnicity" value={form.ethnicity} onChange={handleField} options={ETHNICITIES} required error={fieldErrors.ethnicity} />
                </div>
                <div className={g2}>
                  <Select label="Dress Code" name="dressCode" value={form.dressCode} onChange={handleField} options={DRESS_CODES} required error={fieldErrors.dressCode} />
                  <Select label="Family Status" name="familyStatus" value={form.familyStatus} onChange={handleField} options={FAMILY_STATUSES} required error={fieldErrors.familyStatus} />
                </div>
                <div className={g2}>
                  <Select label="Civil Status" name="civilStatus" value={form.civilStatus} onChange={handleField} options={CIVIL_STATUSES} required error={fieldErrors.civilStatus} />
                  <Select label="Children" name="children" value={form.children} onChange={handleField} options={CHILDREN_OPTS} required error={fieldErrors.children} />
                </div>
              </>
            )}

            {/* ── Step 1: Location & Education ─────────────────────────── */}
            {step === 1 && (
              <>
                <div className={g2}>
                  <Select label="Country" name="country" value={form.country} onChange={handleField} options={COUNTRIES} required error={fieldErrors.country} />
                  <Select label="State / Province" name="state" value={form.state} onChange={handleField} options={STATES} required error={fieldErrors.state} />
                </div>
                <div className={g2}>
                  <Field label="City" name="city" value={form.city} onChange={handleField} placeholder="Enter your city" required error={fieldErrors.city} />
                  <Select label="Residency Status" name="residencyStatus" value={form.residencyStatus} onChange={handleField} options={RESIDENCY_STATUSES} required error={fieldErrors.residencyStatus} />
                </div>
                <div className={g2}>
                  <Select label="Education" name="education" value={form.education} onChange={handleField} options={EDUCATIONS} required error={fieldErrors.education} />
                  <Field label="Field of Study" name="fieldOfStudy" value={form.fieldOfStudy} onChange={handleField} placeholder="e.g. Computer Science" optional />
                </div>
                <div className={g2}>
                  <Select label="Occupation" name="occupation" value={form.occupation} onChange={handleField} options={OCCUPATIONS_GENERAL} required error={fieldErrors.occupation} />
                  <Field label="Profession / Job Title" name="profession" value={form.profession} onChange={handleField} placeholder="e.g. Software Engineer" optional />
                </div>
              </>
            )}

            {/* ── Step 2: Family Details ────────────────────────────────── */}
            {step === 2 && (
              <>
                <p className="text-xs font-bold text-[#1C3B35] uppercase tracking-wide">Father's Details</p>
                <div className={g2}>
                  <Select label="Ethnicity" name="fatherEthnicity" value={form.fatherEthnicity} onChange={handleField} options={ETHNICITIES} required error={fieldErrors.fatherEthnicity} />
                  <Select label="Country" name="fatherCountry" value={form.fatherCountry} onChange={handleField} options={COUNTRIES} required error={fieldErrors.fatherCountry} />
                </div>
                <div className={g2}>
                  <Select label="Occupation" name="fatherOccupation" value={form.fatherOccupation} onChange={handleField} options={FATHER_OCCUPATIONS} required error={fieldErrors.fatherOccupation} />
                  <Field label="City" name="fatherCity" value={form.fatherCity} onChange={handleField} placeholder="Enter city" required error={fieldErrors.fatherCity} />
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-bold text-[#1C3B35] uppercase tracking-wide mb-3">Mother's Details</p>
                </div>
                <div className={g2}>
                  <Select label="Ethnicity" name="motherEthnicity" value={form.motherEthnicity} onChange={handleField} options={ETHNICITIES} required error={fieldErrors.motherEthnicity} />
                  <Select label="Country" name="motherCountry" value={form.motherCountry} onChange={handleField} options={COUNTRIES} required error={fieldErrors.motherCountry} />
                </div>
                <div className={g2}>
                  <Select label="Occupation" name="motherOccupation" value={form.motherOccupation} onChange={handleField} options={MOTHER_OCCUPATIONS} required error={fieldErrors.motherOccupation} />
                  <Field label="City" name="motherCity" value={form.motherCity} onChange={handleField} placeholder="Enter city" required error={fieldErrors.motherCity} />
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-semibold text-gray-500 mb-3">Sibling's Details <span className="text-gray-400 font-normal">(optional)</span></p>
                  <div className={g2}>
                    <Field label="Number of Brothers" name="brothers" value={form.brothers} onChange={handleField} type="number" placeholder="e.g. 2" optional />
                    <Field label="Number of Sisters" name="sisters" value={form.sisters} onChange={handleField} type="number" placeholder="e.g. 1" optional />
                  </div>
                </div>
              </>
            )}

            {/* ── Step 3: Preferences (gender-aware) ───────────────────── */}
            {step === 3 && (() => {
              const personAge = calcAge(form.dateOfBirth);
              const personHeight = form.height ? parseInt(form.height, 10) : null;
              const isFemale = form.gender === 'FEMALE';
              const isMale   = form.gender === 'MALE';
              const ageMin  = isFemale && personAge ? personAge : 16;
              const ageMax  = isMale   && personAge ? personAge : undefined;
              const hMin    = isFemale && personHeight ? personHeight : 100;
              const hMax    = isMale   && personHeight ? personHeight : 250;
              return (
                <>
                  {/* Gender hint */}
                  <div className={`text-xs rounded-xl px-4 py-3 border ${
                    isFemale ? 'bg-pink-50 border-pink-100 text-pink-700' : 'bg-blue-50 border-blue-100 text-blue-700'
                  }`}>
                    {isFemale ? (
                      <>
                        <span className="font-bold">🌸 Female preferences:</span><br/>
                        • Age preference must be <strong>≥ your age ({personAge ?? '?'})</strong> — you prefer someone older or same age.<br/>
                        • Min Height must be <strong>≥ your height ({personHeight ? `${personHeight} cm` : '?'})</strong> — you prefer someone taller or same height.
                      </>
                    ) : (
                      <>
                        <span className="font-bold">🔵 Male preferences:</span><br/>
                        • Age preference must be <strong>≤ your age ({personAge ?? '?'})</strong> — you prefer someone younger or same age.<br/>
                        • Min Height must be <strong>≤ your height ({personHeight ? `${personHeight} cm` : '?'})</strong> — you prefer someone shorter or same height.
                      </>
                    )}
                  </div>

                  <div className={g2}>
                    <Field label="Min Age Preference" name="minAgePreference" value={form.minAgePreference}
                      onChange={handleField} type="number"
                      placeholder={isFemale ? `≥ ${personAge ?? 16}` : `≤ ${personAge ?? ''}`}
                      error={fieldErrors.minAgePreference} optional />
                    <Field label="Max Age Preference" name="maxAgePreference" value={form.maxAgePreference}
                      onChange={handleField} type="number"
                      placeholder={isFemale ? `≥ ${personAge ?? 16}` : `≤ ${personAge ?? ''}`}
                      error={fieldErrors.maxAgePreference} optional />
                  </div>
                  <Field label="Country Preference" name="countryPreference" value={form.countryPreference}
                    onChange={handleField} placeholder="Any country" optional />
                  <Field label="Min Height Preference (cm)" name="minHeightPreference" value={form.minHeightPreference}
                    onChange={handleField} type="number"
                    placeholder={isFemale ? `≥ ${personHeight ?? 160} cm` : `≤ ${personHeight ?? 180} cm`}
                    error={fieldErrors.minHeightPreference} optional />
                  <p className="text-xs text-gray-400">
                    {isFemale
                      ? `Valid range — Age: ≥${ageMin} | Height: ${hMin}–250 cm`
                      : `Valid range — Age: 16–${ageMax ?? '?'} | Height: 100–${hMax} cm`}
                  </p>
                </>
              );
            })()}

            {/* ── Step 4: Review ────────────────────────────────────────── */}
            {step === 4 && (
              <>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  {([
                    ['First Name', form.firstName], ['Last Name', form.lastName],
                    ['Created By', form.createdBy], ['Gender', form.gender],
                    ['Date of Birth', form.dateOfBirth], ['Height', form.height],
                    ['Appearance', form.appearance], ['Complexion', form.complexion],
                    ['Ethnicity', form.ethnicity], ['Dress Code', form.dressCode],
                    ['Family Status', form.familyStatus], ['Civil Status', form.civilStatus],
                    ['Children', form.children],
                    ['Country', form.country], ['State', form.state], ['City', form.city],
                    ['Residency Status', form.residencyStatus], ['Education', form.education],
                    ['Field of Study', form.fieldOfStudy], ['Occupation', form.occupation],
                    ['Profession', form.profession],
                    ["Father's Ethnicity", form.fatherEthnicity], ["Father's Country", form.fatherCountry],
                    ["Father's Occupation", form.fatherOccupation], ["Father's City", form.fatherCity],
                    ["Mother's Ethnicity", form.motherEthnicity], ["Mother's Country", form.motherCountry],
                    ["Mother's Occupation", form.motherOccupation], ["Mother's City", form.motherCity],
                    ['Brothers', form.brothers], ['Sisters', form.sisters],
                    ['Min Age Pref.', form.minAgePreference], ['Max Age Pref.', form.maxAgePreference],
                    ['Country Pref.', form.countryPreference],
                    ['Min Height Pref.', form.minHeightPreference ? `${form.minHeightPreference} cm` : ''],
                  ] as [string, string][]).filter(([, v]) => v).map(([k, v], i) => (
                    <div key={k} className={`flex items-center justify-between px-4 py-2.5 ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                      <span className="text-gray-400 text-xs font-medium">{k}</span>
                      <span className="font-semibold text-gray-700 text-xs">{v}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 text-center pt-1">
                  ✨ A personal bio and expectations will be auto-generated. You can update them anytime.
                </p>
                {apiError && (
                  <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-600 flex items-center gap-2">
                    <span>⚠</span>{apiError}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer navigation */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between gap-3 bg-gray-50/50">
            <button
              onClick={() => { setStep(s => Math.max(0, s - 1)); setFieldErrors({}); }}
              disabled={step === 0}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-100 transition disabled:opacity-30"
            >← Back</button>

            {step < STEPS.length - 1 ? (
              <button onClick={handleNext}
                className="px-6 py-2.5 bg-[#1C3B35] text-white rounded-xl text-sm font-semibold hover:bg-[#15302a] transition">
                Next →
              </button>
            ) : (
              <button onClick={handleCreate} disabled={saving}
                className="px-6 py-2.5 bg-[#1C3B35] text-white rounded-xl text-sm font-semibold hover:bg-[#15302a] transition disabled:opacity-50 flex items-center gap-2">
                {saving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                {saving ? 'Creating…' : '✓ Create Profile'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
