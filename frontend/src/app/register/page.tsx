"use client";

import { useState, useEffect, useRef } from "react";
import { authApi, profileApi } from "@/services/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronDown, Calendar, Eye, EyeOff } from "lucide-react";

const STEPS = [
  { id: 1, label: "Account Details" },
  { id: 2, label: "Personal Details" },
  { id: 3, label: "Location & Education" },
  { id: 4, label: "Family Details" },
  { id: 5, label: "Additional Details" },
];

/* ─── Reusable Field Components ─── */
function SelectField({
  label,
  name,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  name: string;
  options: string[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600">
        {label} <span className="text-red-400">*</span>
      </label>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full appearance-none rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition ${
            error ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
          }`}
        >
          <option value="">{`Select ${label}`}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  );
}

function TextField({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  optional,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600">
        {label}{!optional && <span className="text-red-400"> *</span>}{optional && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition ${
          error ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
        }`}
      />
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  );
}

function PasswordField({
  label,
  name,
  placeholder,
  value,
  onChange,
  error,
}: {
  label: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600">{label} <span className="text-red-400">*</span></label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          className={`w-full rounded-lg border bg-white px-4 py-2.5 pr-11 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition ${
            error ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1B6B4A] transition p-1"
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  );
}

/* ─── Country Codes ─── */
const COUNTRY_CODES = [
  { flag: '🇱🇰', code: '+94',  name: 'Sri Lanka' },
  { flag: '🇮🇳', code: '+91',  name: 'India' },
  { flag: '🇵🇰', code: '+92',  name: 'Pakistan' },
  { flag: '🇧🇩', code: '+880', name: 'Bangladesh' },
  { flag: '🇲🇾', code: '+60',  name: 'Malaysia' },
  { flag: '🇸🇦', code: '+966', name: 'Saudi Arabia' },
  { flag: '🇦🇪', code: '+971', name: 'UAE' },
  { flag: '🇶🇦', code: '+974', name: 'Qatar' },
  { flag: '🇰🇼', code: '+965', name: 'Kuwait' },
  { flag: '🇬🇧', code: '+44',  name: 'UK' },
  { flag: '🇦🇺', code: '+61',  name: 'Australia' },
  { flag: '🇨🇦', code: '+1',   name: 'Canada' },
  { flag: '🇺🇸', code: '+1',   name: 'USA' },
  { flag: '🇩🇪', code: '+49',  name: 'Germany' },
  { flag: '🇫🇷', code: '+33',  name: 'France' },
  { flag: '🇮🇩', code: '+62',  name: 'Indonesia' },
  { flag: '🇸🇬', code: '+65',  name: 'Singapore' },
  { flag: '🇿🇦', code: '+27',  name: 'South Africa' },
  { flag: '🇳🇬', code: '+234', name: 'Nigeria' },
  { flag: '🇪🇬', code: '+20',  name: 'Egypt' },
  { flag: '🇹🇷', code: '+90',  name: 'Turkey' },
  { flag: '🇮🇷', code: '+98',  name: 'Iran' },
  { flag: '🇲🇻', code: '+960', name: 'Maldives' },
  { flag: '🇳🇵', code: '+977', name: 'Nepal' },
  { flag: '🇴🇲', code: '+968', name: 'Oman' },
  { flag: '🇧🇭', code: '+973', name: 'Bahrain' },
];

function PhoneField({
  label, name, value, onChange, error, optional,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (fullNumber: string, fieldName: string) => void;
  error?: string;
  optional?: boolean;
}) {
  // Parse existing value for dial code
  const detectDialCode = (val: string) => {
    const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    for (const c of sorted) {
      if (val.startsWith(c.code)) return c.code;
    }
    return '+94';
  };
  const [dialCode, setDialCode] = useState(() => detectDialCode(value || ''));
  const [localNum, setLocalNum] = useState(() => {
    const dc = detectDialCode(value || '');
    return (value || '').replace(dc, '').trimStart();
  });

  const handleDialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setDialCode(newCode);
    onChange(localNum ? `${newCode}${localNum}` : '', name);
  };

  const handleNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setLocalNum(raw);
    onChange(raw ? `${dialCode}${raw}` : '', name);
  };

  const selected = COUNTRY_CODES.find(c => c.code === dialCode) ?? COUNTRY_CODES[0];

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600">
        {label}{!optional && <span className="text-red-400"> *</span>}{optional && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
      </label>
      <div className={`flex rounded-lg border bg-white shadow-sm overflow-hidden transition focus-within:border-[#1B6B4A] focus-within:ring-2 focus-within:ring-[#1B6B4A]/20 ${
        error ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
      }`}>
        {/* Country code selector */}
        <div className="relative flex-shrink-0">
          <select
            value={dialCode}
            onChange={handleDialChange}
            className="h-full appearance-none bg-gray-50 border-r border-gray-200 pl-2 pr-6 text-sm text-gray-700 outline-none cursor-pointer hover:bg-gray-100 transition"
            style={{ minWidth: '80px' }}
          >
            {COUNTRY_CODES.map((c, i) => (
              <option key={i} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">▼</span>
          {/* Visible label inside the box */}
          <span className="pointer-events-none absolute inset-0 flex items-center pl-2 text-sm text-gray-700 bg-gray-50 border-r border-gray-200">
            {selected.flag} {selected.code}
            <ChevronDown className="ml-1 h-3 w-3 text-gray-400" />
          </span>
        </div>
        {/* Number input */}
        <input
          type="tel"
          name={name}
          value={localNum}
          placeholder="76 XXXX XXX"
          onChange={handleNumChange}
          className="flex-1 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none"
        />
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  );
}

function DateField({
  label,
  name,
  value,
  onChange,
  max,
  min,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  max?: string;
  min?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <div
        className="relative cursor-pointer"
        onClick={() => { try { inputRef.current?.showPicker(); } catch { inputRef.current?.click(); } }}
      >
        <input
          ref={inputRef}
          type="date"
          name={name}
          value={value}
          onChange={onChange}
          max={max}
          min={min}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
        />
        <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
}

/* ─── Step Forms ─── */
/* ── Age helpers ── */
function getMaxBirthDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 16);
  return d.toISOString().split("T")[0];
}
function getMinBirthDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 100);
  return d.toISOString().split("T")[0];
}
function isAtLeast16(dateStr: string): boolean {
  if (!dateStr) return false;
  const birth = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 16);
  return birth <= cutoff;
}

function Step1({
  data, onChange, fieldErrors,
}: {
  data: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  fieldErrors?: Record<string, string>;
}) {
  const maxBirth = getMaxBirthDate();
  const minBirth = getMinBirthDate();
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800">Your Personal Details</h2>
      <p className="mt-1 text-sm text-gray-500">Please provide your basic information</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="First Name" name="firstName" placeholder="Enter your first name" value={data.firstName || ""} onChange={onChange} error={fieldErrors?.firstName} />
        <TextField label="Last Name" name="lastName" placeholder="Enter your last name" value={data.lastName || ""} onChange={onChange} error={fieldErrors?.lastName} />
        <SelectField label="Created By" name="createdBy" options={["Self", "Parent", "Guardian", "Sibling"]} value={data.createdBy || ""} onChange={onChange} error={fieldErrors?.createdBy} />
        <SelectField label="Gender" name="gender" options={["Male", "Female"]} value={data.gender || ""} onChange={onChange} error={fieldErrors?.gender} />
        <div className="flex flex-col gap-1">
          <DateField label="Birth Date" name="birthDate" value={data.birthDate || ""} onChange={onChange} max={maxBirth} min={minBirth} />
          {fieldErrors?.birthDate && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{fieldErrors.birthDate}</p>}
          {data.birthDate && !isAtLeast16(data.birthDate) && (
            <p className="text-xs text-red-500 mt-1">⚠ You must be at least 16 years old to register.</p>
          )}
        </div>
        <SelectField label="Height" name="height" options={["4'0\"","4'5\"","4'10\"","5'0\"","5'2\"","5'4\"","5'6\"","5'8\"","5'10\"","6'0\"","6'2\"","6'4\"","6'6\""]} value={data.height || ""} onChange={onChange} error={fieldErrors?.height} />
        <SelectField label="Appearance" name="appearance" options={["Very Fair", "Fair", "Wheatish", "Wheatish Brown", "Dark"]} value={data.appearance || ""} onChange={onChange} error={fieldErrors?.appearance} />
        <SelectField label="Complexion" name="complexion" options={["Very Fair", "Fair", "Medium", "Olive", "Dark"]} value={data.complexion || ""} onChange={onChange} error={fieldErrors?.complexion} />
        <SelectField label="Ethnicity" name="ethnicity" options={["Arab", "South Asian", "African", "South East Asian", "European", "Other"]} value={data.ethnicity || ""} onChange={onChange} error={fieldErrors?.ethnicity} />
        <SelectField label="Dress Code" name="dressCode" options={["Hijab", "Niqab", "Casual Modest", "Islamic Formal", "Traditional"]} value={data.dressCode || ""} onChange={onChange} error={fieldErrors?.dressCode} />
        <SelectField label="Family Status" name="familyStatus" options={["Upper Class", "Upper Middle Class", "Middle Class", "Lower Middle Class"]} value={data.familyStatus || ""} onChange={onChange} error={fieldErrors?.familyStatus} />
        <SelectField label="Civil Status" name="civilStatus" options={["Never Married", "Widowed", "Divorced", "Separated", "Other"]} value={data.civilStatus || ""} onChange={onChange} error={fieldErrors?.civilStatus} />
        <SelectField label="Children" name="children" options={["No", "Yes - 1", "Yes - 2", "Yes - 3", "Yes - 3+"]} value={data.children || ""} onChange={onChange} error={fieldErrors?.children} />
      </div>
    </div>
  );
}

function Step2({
  data, onChange, onPhoneChange, fieldErrors,
}: {
  data: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  onPhoneChange: (fullNumber: string, fieldName: string) => void;
  fieldErrors?: Record<string, string>;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800">Account Details</h2>
      <p className="mt-1 text-sm text-gray-500">Set up your login credentials</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Email Address" name="email" type="email" placeholder="Enter your email" value={data.email || ""} onChange={onChange} error={fieldErrors?.email} />
        <PhoneField label="Phone Number" name="phone" value={data.phone || ""} onChange={onPhoneChange} error={fieldErrors?.phone} />
        <PhoneField label="WhatsApp Number" name="whatsappNumber" value={data.whatsappNumber || ""} onChange={onPhoneChange} error={fieldErrors?.whatsappNumber} />
        <PasswordField label="Password" name="password" placeholder="Create a password" value={data.password || ""} onChange={onChange} error={fieldErrors?.password} />
        <PasswordField label="Confirm Password" name="confirmPassword" placeholder="Confirm your password" value={data.confirmPassword || ""} onChange={onChange} error={fieldErrors?.confirmPassword} />
      </div>
    </div>
  );
}

function Step3({
  data, onChange, fieldErrors,
}: {
  data: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  fieldErrors?: Record<string, string>;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800">Location &amp; Education</h2>
      <p className="mt-1 text-sm text-gray-500">Tell us where you are based and your qualifications</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField label="Country" name="country" options={["Sri Lanka", "United Kingdom", "Australia", "Canada", "UAE", "Saudi Arabia", "Qatar", "USA", "Malaysia", "Other"]} value={data.country || ""} onChange={onChange} error={fieldErrors?.country} />
        <SelectField label="State / Province" name="state" options={["Western Province", "Central Province", "Southern Province", "Northern Province", "Eastern Province", "Other"]} value={data.state || ""} onChange={onChange} error={fieldErrors?.state} />
        <TextField label="City" name="city" placeholder="Enter your city" value={data.city || ""} onChange={onChange} error={fieldErrors?.city} />
        <SelectField label="Residency Status" name="residencyStatus" options={["Citizen", "Permanent Resident", "Work Visa", "Student Visa", "Other"]} value={data.residencyStatus || ""} onChange={onChange} error={fieldErrors?.residencyStatus} />
        <SelectField label="Education" name="education" options={["High School","Diploma","Bachelor's Degree","Master's Degree","Doctorate (PhD)","Other"]} value={data.education || ""} onChange={onChange} error={fieldErrors?.education} />
        <TextField label="Field of Study" name="fieldOfStudy" placeholder="e.g. Computer Science" value={data.fieldOfStudy || ""} onChange={onChange} optional />
        <SelectField label="Occupation" name="occupation" options={["Employed","Self Employed","Business Owner","Student","Not Employed"]} value={data.occupation || ""} onChange={onChange} error={fieldErrors?.occupation} />
        <TextField label="Profession / Job Title" name="profession" placeholder="e.g. Software Engineer" value={data.profession || ""} onChange={onChange} optional />
      </div>
    </div>
  );
}

function Step4({
  data, onChange, fieldErrors,
}: {
  data: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  fieldErrors?: Record<string, string>;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800">Family Details</h2>
      <p className="mt-1 text-sm text-gray-500">Information about your family</p>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Father's Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Ethnicity" name="fatherEthnicity" options={["Arab","South Asian","African","South East Asian","European","Other"]} value={data.fatherEthnicity || ""} onChange={onChange} error={fieldErrors?.fatherEthnicity} />
          <SelectField label="Country" name="fatherCountry" options={["Sri Lanka","United Kingdom","Australia","Canada","UAE","Saudi Arabia","Qatar","USA","Malaysia","Other"]} value={data.fatherCountry || ""} onChange={onChange} error={fieldErrors?.fatherCountry} />
          <SelectField label="Occupation" name="fatherOccupation" options={["Business","Government Employee","Private Sector","Retired","Not Employed","Deceased"]} value={data.fatherOccupation || ""} onChange={onChange} error={fieldErrors?.fatherOccupation} />
          <TextField label="City" name="fatherCity" placeholder="Enter City" value={data.fatherCity || ""} onChange={onChange} error={fieldErrors?.fatherCity} />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Mother's Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Ethnicity" name="motherEthnicity" options={["Arab","South Asian","African","South East Asian","European","Other"]} value={data.motherEthnicity || ""} onChange={onChange} error={fieldErrors?.motherEthnicity} />
          <SelectField label="Country" name="motherCountry" options={["Sri Lanka","United Kingdom","Australia","Canada","UAE","Saudi Arabia","Qatar","USA","Malaysia","Other"]} value={data.motherCountry || ""} onChange={onChange} error={fieldErrors?.motherCountry} />
          <SelectField label="Occupation" name="motherOccupation" options={["Business","Government Employee","Private Sector","Homemaker","Retired","Not Employed"]} value={data.motherOccupation || ""} onChange={onChange} error={fieldErrors?.motherOccupation} />
          <TextField label="City" name="motherCity" placeholder="Enter City" value={data.motherCity || ""} onChange={onChange} error={fieldErrors?.motherCity} />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Sibling's Details <span className="text-gray-400 text-xs font-normal">(optional)</span>
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Number of Brothers <span className="text-gray-400 text-xs">(optional)</span></label>
            <input type="number" name="brothers" min="0" max="20" value={data.brothers || "0"} onChange={onChange}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Number of Sisters <span className="text-gray-400 text-xs">(optional)</span></label>
            <input type="number" name="sisters" min="0" max="20" value={data.sisters || "0"} onChange={onChange}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition" />
          </div>
        </div>
      </div>
    </div>
  );
}

const LOOKING_COUNTRIES = [
  'Any Country',
  'Sri Lanka','United Kingdom','Australia','Canada',
  'UAE','Saudi Arabia','Qatar','USA','Malaysia','Other',
];

const blockDigits = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key >= '0' && e.key <= '9') e.preventDefault();
};
const stripDigitsOnPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
  e.preventDefault();
  const text = e.clipboardData.getData('text').replace(/[0-9]/g, '');
  document.execCommand('insertText', false, text);
};

function Step5({ data, onChange, lookingFor, setLookingFor, agreedTerms, setAgreedTerms }: {
  data: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => void;
  lookingFor: string;
  setLookingFor: (v: string) => void;
  agreedTerms: boolean;
  setAgreedTerms: (v: boolean) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800">Additional Details</h2>
      <p className="mt-1 text-sm text-gray-500">Tell us more about yourself</p>

      {/* ── Looking Country ───────────────────────────────────── */}
      <div className="mt-6 flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600">
          Looking Country <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <select
            name="countryPreference"
            value={data.countryPreference || ''}
            onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>}
            className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition"
          >
            <option value="">Select looking country</option>
            {LOOKING_COUNTRIES.map((c) => (
              <option key={c} value={c === 'Any Country' ? '' : c}>{c}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">Only profiles from this country will be shown to you in browse results.</p>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600">Additional Information</label>
        <textarea
          name="about"
          value={data.about || ""}
          onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
          rows={4}
          placeholder="Tell us more about yourself....."
          onKeyDown={blockDigits}
          onPaste={stripDigitsOnPaste}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition resize-none"
        />
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600">Your Expectations</label>
        <textarea
          name="expectations"
          value={data.expectations || ""}
          onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
          rows={4}
          placeholder="What are you looking for in partner......"
          onKeyDown={blockDigits}
          onPaste={stripDigitsOnPaste}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition resize-none"
        />
      </div>

      <label className="mt-5 flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={agreedTerms}
          onChange={(e) => setAgreedTerms(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 accent-[#1B6B4A]"
        />
        <span className="text-sm text-gray-500">
          I agree and accept the{" "}
          <Link href="/terms" className="text-[#1B6B4A] font-medium hover:underline">terms and conditions</Link>
        </span>
      </label>
    </div>
  );
}

/* ─── Main Page ─── */
export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [lookingFor, setLookingFor] = useState("Male");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect already-logged-in users
  useEffect(() => {
    const token = localStorage.getItem('mn_token');
    if (token) router.replace('/dashboard/parent');
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  };

  // Handler for PhoneField — receives (fullNumber, fieldName)
  const handlePhoneChange = (fullNumber: string, fieldName: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: fullNumber }));
    setFieldErrors((prev) => { const n = { ...prev }; delete n[fieldName]; return n; });
  };

  const [checking, setChecking] = useState(false);

  const handleNext = async () => {
    // Step 1 = Account Details — all fields required
    if (currentStep === 1) {
      const errs: Record<string, string> = {};
      if (!formData.email?.trim()) {
        errs.email = 'Email address is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errs.email = 'Please enter a valid email address.';
      }
      if (!formData.phone?.trim()) errs.phone = 'Phone number is required.';
      if (!formData.whatsappNumber?.trim()) errs.whatsappNumber = 'WhatsApp number is required.';
      if (!formData.password) {
        errs.password = 'Password is required.';
      } else if (formData.password.length < 8) {
        errs.password = 'Password must be at least 8 characters.';
      }
      if (!formData.confirmPassword) {
        errs.confirmPassword = 'Please confirm your password.';
      } else if (formData.password !== formData.confirmPassword) {
        errs.confirmPassword = 'Passwords do not match.';
      }
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        return;
      }

      // Check uniqueness against the database
      setChecking(true);
      try {
        const res = await authApi.checkAvailability({
          email: formData.email,
          phone: formData.phone,
          whatsappNumber: formData.whatsappNumber,
        });
        if (res.taken && Object.keys(res.taken).length > 0) {
          setFieldErrors(res.taken);
          return;
        }
      } catch {
        // If network error, allow proceeding (server will catch it on submit)
      } finally {
        setChecking(false);
      }

      setFieldErrors({});
    }
    // Step 2 = Personal Details (Step1 component) — all fields required
    if (currentStep === 2) {
      const errs: Record<string, string> = {};
      if (!formData.firstName?.trim()) errs.firstName = 'First name is required.';
      if (!formData.lastName?.trim()) errs.lastName = 'Last name is required.';
      if (!formData.createdBy) errs.createdBy = 'Please select who is creating this profile.';
      if (!formData.gender) errs.gender = 'Please select a gender.';
      if (!formData.birthDate) {
        errs.birthDate = 'Birth date is required.';
      } else if (!isAtLeast16(formData.birthDate)) {
        errs.birthDate = 'You must be at least 16 years old to register.';
      }
      if (!formData.height) errs.height = 'Please select a height.';
      if (!formData.appearance) errs.appearance = 'Please select an appearance.';
      if (!formData.complexion) errs.complexion = 'Please select a complexion.';
      if (!formData.ethnicity) errs.ethnicity = 'Please select an ethnicity.';
      if (!formData.dressCode) errs.dressCode = 'Please select a dress code.';
      if (!formData.familyStatus) errs.familyStatus = 'Please select a family status.';
      if (!formData.civilStatus) errs.civilStatus = 'Please select a civil status.';
      if (!formData.children) errs.children = 'Please select children status.';
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        return;
      }
      setFieldErrors({});
    }
    // Step 3 = Location & Education — 6 required, 2 optional
    if (currentStep === 3) {
      const errs: Record<string, string> = {};
      if (!formData.country) errs.country = 'Please select a country.';
      if (!formData.state) errs.state = 'Please select a state/province.';
      if (!formData.city?.trim()) errs.city = 'City is required.';
      if (!formData.residencyStatus) errs.residencyStatus = 'Please select a residency status.';
      if (!formData.education) errs.education = 'Please select an education level.';
      if (!formData.occupation) errs.occupation = 'Please select an occupation.';
      // fieldOfStudy and profession are optional — not validated
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        return;
      }
      setFieldErrors({});
    }
    // Step 4 = Family Details — Father & Mother required, Siblings optional
    if (currentStep === 4) {
      const errs: Record<string, string> = {};
      // Father's Details
      if (!formData.fatherEthnicity) errs.fatherEthnicity = 'Please select father\'s ethnicity.';
      if (!formData.fatherCountry) errs.fatherCountry = 'Please select father\'s country.';
      if (!formData.fatherOccupation) errs.fatherOccupation = 'Please select father\'s occupation.';
      if (!formData.fatherCity?.trim()) errs.fatherCity = 'Father\'s city is required.';
      // Mother's Details
      if (!formData.motherEthnicity) errs.motherEthnicity = 'Please select mother\'s ethnicity.';
      if (!formData.motherCountry) errs.motherCountry = 'Please select mother\'s country.';
      if (!formData.motherOccupation) errs.motherOccupation = 'Please select mother\'s occupation.';
      if (!formData.motherCity?.trim()) errs.motherCity = 'Mother\'s city is required.';
      // brothers / sisters are optional — not validated
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        return;
      }
      setFieldErrors({});
    }
    setError('');
    if (currentStep < 5) {
      const nextStep = currentStep + 1;

      // ── Auto-generate bio & expectations when entering Step 5 ──────
      if (nextStep === 5) {
        const firstName = formData.firstName || '';
        const gender = formData.gender || 'Male';
        const pronoun = gender === 'Female' ? 'She' : 'He';
        const pronoun2 = gender === 'Female' ? 'her' : 'his';
        const city = formData.city || '';
        const country = formData.country || '';
        const location = [city, country].filter(Boolean).join(', ');
        const education = formData.education || '';
        const occupation = formData.occupation || '';
        const profession = formData.profession || '';
        const ethnicity = formData.ethnicity || '';
        const civilStatus = formData.civilStatus || '';
        const children = formData.children || '';
        const familyStatus = formData.familyStatus || '';
        const dressCode = formData.dressCode || '';

        // Build about text
        let aboutParts: string[] = [];
        if (firstName) aboutParts.push(`${firstName} is a sincere and practising Muslim${ethnicity ? ` of ${ethnicity} background` : ''}`);
        if (location) aboutParts.push(`currently living in ${location}`);
        if (occupation && profession) aboutParts.push(`working as a ${profession} (${occupation})`);
        else if (occupation) aboutParts.push(`currently ${occupation.toLowerCase()}`);
        if (education) aboutParts.push(`holding a ${education}`);
        if (familyStatus) aboutParts.push(`${pronoun} comes from a ${familyStatus.toLowerCase()} family`);
        if (dressCode) aboutParts.push(`and follows a ${dressCode.toLowerCase()} dress code`);
        if (civilStatus && civilStatus !== 'Never Married') aboutParts.push(`${pronoun} is ${civilStatus.toLowerCase()}`);
        if (children && children !== 'No') aboutParts.push(`with ${children.replace('Yes - ', '')} ${parseInt(children.replace('Yes - ', '')) === 1 ? 'child' : 'children'}`);

        const autoAbout = aboutParts.length > 0
          ? aboutParts.join(', ').replace(/,\s*$/, '') + '. ' +
            `${pronoun} is looking for a life partner who shares ${pronoun2} values and commitment to Islam.`
          : '';

        // Build expectations text
        const countryPref = formData.countryPreference && formData.countryPreference !== 'Any Country' ? formData.countryPreference : '';
        let expParts: string[] = [];
        expParts.push(`Looking for a ${gender === 'Female' ? 'righteous, caring and responsible' : 'pious, educated and family-oriented'} Muslim partner`);
        if (countryPref) expParts.push(`preferably from ${countryPref}`);
        expParts.push('who values family, is kind-hearted and ready for a serious commitment');
        expParts.push('The ideal match should be respectful, honest and practising in their faith');

        const autoExpectations = expParts.join('. ') + '.';

        setFormData(prev => ({
          ...prev,
          about: prev.about?.trim() ? prev.about : autoAbout,
          expectations: prev.expectations?.trim() ? prev.expectations : autoExpectations,
        }));
      }

      setCurrentStep(nextStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      setError("Email and password are required (Step 1).");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // Step 1: Create the user account
      const res = await authApi.register({
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        whatsappNumber: formData.whatsappNumber || undefined,
      });
      localStorage.setItem("mn_token", res.token);
      localStorage.setItem("mn_user", JSON.stringify(res.user));

      // Step 2: Auto-create a profile using the details already filled in the form
      // (so the user never sees the "Create Your Profile" popup on the next page)
      try {
        const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(" ").trim();
        const genderMap: Record<string, string> = { Male: "MALE", Female: "FEMALE" };

        // Height: DTO expects an integer in cm (100–250). The form stores strings like "5'6\""
        const heightStrToNum: Record<string, number> = {
          "4'0\"": 122, "4'5\"": 135, "4'10\"": 147,
          "5'0\"": 152, "5'2\"": 157, "5'4\"": 163,
          "5'6\"": 168, "5'8\"": 173, "5'10\"": 178,
          "6'0\"": 183, "6'2\"": 188, "6'4\"": 193, "6'6\"": 198,
        };
        const heightNum = formData.height ? (heightStrToNum[formData.height] ?? undefined) : undefined;

        // Build profile payload — include every collected field
        const profilePayload: Record<string, any> = {
          // Required
          name: fullName || formData.email.split('@')[0],
          gender: genderMap[formData.gender] ?? 'MALE',
          dateOfBirth: formData.birthDate || new Date(Date.now() - 20 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],

          // Step 2 — Personal Details
          ...(formData.createdBy && { createdBy: formData.createdBy }),
          ...(heightNum !== undefined && { height: heightNum }),
          ...(formData.appearance && { appearance: formData.appearance }),
          ...(formData.complexion && { complexion: formData.complexion }),
          ...(formData.ethnicity && { ethnicity: formData.ethnicity }),
          ...(formData.dressCode && { dressCode: formData.dressCode }),
          ...(formData.familyStatus && { familyStatus: formData.familyStatus }),
          ...(formData.civilStatus && { civilStatus: formData.civilStatus }),
          ...(formData.children && { children: formData.children }),

          // Step 3 — Location & Education
          ...(formData.country && { country: formData.country }),
          ...(formData.state && { state: formData.state }),
          ...(formData.city && { city: formData.city }),
          ...(formData.residencyStatus && { residencyStatus: formData.residencyStatus }),
          ...(formData.education && { education: formData.education }),
          ...(formData.fieldOfStudy && { fieldOfStudy: formData.fieldOfStudy }),
          ...(formData.occupation && { occupation: formData.occupation }),
          ...(formData.profession && { profession: formData.profession }),

          // Step 4 — Family Details
          ...(formData.fatherOccupation && { fatherOccupation: formData.fatherOccupation }),
          ...(formData.motherOccupation && { motherOccupation: formData.motherOccupation }),
          ...((formData.brothers || formData.sisters) && {
            siblings: (parseInt(formData.brothers || '0') + parseInt(formData.sisters || '0')),
          }),

          // Step 5 — Additional Details
          ...(formData.about && { aboutUs: formData.about }),
          ...(formData.expectations && { expectations: formData.expectations }),
          ...(formData.countryPreference && { countryPreference: formData.countryPreference }),

          // Contact from account details
          ...(formData.phone && { phone: formData.phone }),
        };

        await profileApi.create(profilePayload);
      } catch (profileErr: any) {
        // Log so we can see exactly what went wrong (visible in browser console)
        console.error("[Register] Auto-profile creation failed:", profileErr?.message ?? profileErr);
        // Still continue to select-plan — the modal is the fallback
      }

      // Redirect to plan selection
      router.push("/select-plan");
    } catch (e: any) {
      setError(e.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-poppins bg-gray-50 pt-24 pb-8 px-4 min-h-screen">
      <div className="w-full max-w-5xl mx-auto rounded-2xl bg-white shadow-md overflow-hidden flex flex-col md:flex-row">

        {/* ── Left Sidebar — hidden on mobile ── */}
        <aside className="hidden md:flex w-64 bg-[#F0F4F2] px-7 py-8 flex-col flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Create Account</h2>
          <p className="mt-1 text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-[#1B6B4A] font-semibold hover:underline">Log in</Link>
          </p>

          <nav className="mt-6 flex flex-col gap-0">
            {STEPS.map((step, idx) => {
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;
              const isUpcoming = currentStep < step.id;
              return (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all duration-300 ${
                      isCompleted ? "bg-[#1B6B4A] text-white" : ""
                    } ${
                      isActive ? "bg-[#1B6B4A] text-white" : ""
                    } ${
                      isUpcoming ? "bg-white border-2 border-gray-300 text-gray-400" : ""
                    }`}>
                      {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 mt-1 transition-all duration-300 ${
                        isCompleted ? "bg-[#1B6B4A]" : "bg-gray-200"
                      }`} />
                    )}
                  </div>
                  <span className={`pt-0.5 text-sm font-medium transition-all duration-300 ${
                    isActive || isCompleted ? "text-[#1B6B4A]" : "text-gray-400"
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ── Right Form Area ── */}
        <main className="flex-1 flex flex-col">

          {/* Mobile-only: compact horizontal step progress */}
          <div className="md:hidden bg-[#F0F4F2] px-5 pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-gray-800">Create Account</span>
              <span className="text-xs text-[#1B6B4A] font-medium">Step {currentStep} of {STEPS.length}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
              <div
                className="bg-[#1B6B4A] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              />
            </div>
            {/* Step dots */}
            <div className="flex items-center justify-between">
              {STEPS.map((step) => {
                const isCompleted = currentStep > step.id;
                const isActive = currentStep === step.id;
                return (
                  <div key={step.id} className="flex flex-col items-center gap-1">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isCompleted ? "bg-[#1B6B4A] text-white" : ""
                    } ${
                      isActive ? "bg-[#1B6B4A] text-white ring-2 ring-[#1B6B4A]/30 ring-offset-1" : ""
                    } ${
                      !isCompleted && !isActive ? "bg-white border-2 border-gray-300 text-gray-400" : ""
                    }`}>
                      {isCompleted ? <Check className="h-3 w-3" /> : step.id}
                    </div>
                    <span className={`text-[9px] font-medium text-center leading-tight max-w-[48px] ${
                      isActive || isCompleted ? "text-[#1B6B4A]" : "text-gray-400"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-[#1B6B4A] font-semibold">Log in</Link>
            </p>
          </div>

          {/* Form Content */}
          <div className="flex-1 px-5 py-6 md:px-8 md:py-8">
            <div className="flex-1">
              {currentStep === 1 && <Step2 data={formData} onChange={handleChange} onPhoneChange={handlePhoneChange} fieldErrors={fieldErrors} />}
              {currentStep === 2 && <Step1 data={formData} onChange={handleChange} fieldErrors={fieldErrors} />}
              {currentStep === 3 && <Step3 data={formData} onChange={handleChange} fieldErrors={fieldErrors} />}
              {currentStep === 4 && <Step4 data={formData} onChange={handleChange} fieldErrors={fieldErrors} />}
              {currentStep === 5 && <Step5 data={formData} onChange={handleChange} lookingFor={lookingFor} setLookingFor={setLookingFor} agreedTerms={agreedTerms} setAgreedTerms={setAgreedTerms} />}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  currentStep === 1
                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border-[#1B6B4A] text-[#1B6B4A] hover:bg-[#1B6B4A]/5 active:scale-95"
                }`}
              >
                Back
              </button>

              {currentStep < 5 ? (
                <button
                  onClick={handleNext}
                  disabled={checking}
                  className="px-7 py-2.5 rounded-xl bg-[#1B6B4A] text-white text-sm font-semibold hover:bg-[#155a3d] active:scale-95 transition-all duration-200 shadow-md disabled:opacity-70 flex items-center gap-2"
                >
                  {checking && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {checking ? 'Checking…' : 'Next'}
                </button>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  {error && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 w-full">{error}</p>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !agreedTerms}
                    className="px-7 py-2.5 rounded-xl bg-[#1B6B4A] text-white text-sm font-semibold hover:bg-[#155a3d] active:scale-95 transition-all duration-200 shadow-md disabled:opacity-60"
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
