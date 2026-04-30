"use client";

import { useState, useEffect, useRef } from "react";
import { authApi, profileApi } from "@/services/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronDown, Calendar, Eye, EyeOff } from "lucide-react";
import { CascadeLocation } from "@/components/ui/CascadeLocation";
import { loadMasterData, MasterData } from '@/app/admin/master-file/data';
import React from 'react';

// Generate every-inch heights from 4'0" to 8'0"
function buildHeights() {
  const opts: string[] = [];
  const map: Record<string, number> = {};
  for (let feet = 4; feet <= 8; feet++) {
    const maxInch = feet === 8 ? 0 : 11;
    for (let inch = 0; inch <= maxInch; inch++) {
      const label = `${feet}'${inch}"`;
      const cm = Math.round((feet * 12 + inch) * 2.54);
      opts.push(label);
      map[label] = cm;
    }
  }
  return { opts, map };
}
const { opts: HEIGHT_OPTIONS, map: HEIGHT_TO_CM } = buildHeights();
const WEIGHT_OPTIONS = Array.from({ length: 101 }, (_, i) => `${i + 40} kg`);

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
  optional,
}: {
  label: string;
  name: string;
  options: string[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600">
        {label} {!optional && <span className="text-red-400">*</span>}{optional && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
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
          className="w-full min-h-[44px] appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-base sm:text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition cursor-pointer [&::-webkit-date-and-time-value]:text-left [&::-webkit-inner-spin-button]:hidden [&::-webkit-clear-button]:hidden [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
        />
        <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
}

/* ─── Step Forms ─── */
/* ── Age helpers (minAge driven by admin master file) ── */
function getMaxBirthDate(minAge: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - minAge);
  return d.toISOString().split('T')[0];
}
function getMinBirthDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 100);
  return d.toISOString().split('T')[0];
}
function isAtLeastMinAge(dateStr: string, minAge: number): boolean {
  if (!dateStr) return false;
  const birth = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - minAge);
  return birth <= cutoff;
}

function Step1({
  data, onChange, fieldErrors, minAge = 18, masterData,
}: {
  data: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  fieldErrors?: Record<string, string>;
  minAge?: number;
  masterData?: MasterData | null;
}) {
  const maxBirth = getMaxBirthDate(minAge);
  const minBirth = getMinBirthDate();
  const ethnicityOpts = masterData?.ethnicity?.map(e => e.value) ?? ["Muslim", "Sri Lankan Moors", "Indian Moors", "Malays", "Indian Malays", "Arab (Middle Eastern)", "Tamil", "Indian", "Memons", "Turkish", "European", "Other"];
  const dressCodeOpts = masterData?.dressCode?.map(d => d.value) ?? ["Hijab", "Niqab", "Casual Modest", "Islamic Formal", "Traditional"];
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800">Your Personal Details</h2>
      <p className="mt-1 text-sm text-gray-500">Please provide your basic information</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField label="Created By" name="createdBy" options={["Self", "Parent", "Guardian", "Sibling"]} value={data.createdBy || ""} onChange={onChange} error={fieldErrors?.createdBy} />
        <SelectField label="Gender" name="gender" options={["Male", "Female"]} value={data.gender || ""} onChange={onChange} error={fieldErrors?.gender} />
        <div className="flex flex-col gap-1">
          <DateField label="Date of Birth" name="birthDate" value={data.birthDate || ""} onChange={onChange} max={maxBirth} min={minBirth} />
          {fieldErrors?.birthDate && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{fieldErrors.birthDate}</p>}
          {data.birthDate && !isAtLeastMinAge(data.birthDate, minAge) && (
            <p className="text-xs text-red-500 mt-1">⚠ You must be at least {minAge} years old to register.</p>
          )}
          <p className="text-[10px] text-gray-400">Must be at least {minAge} years old.</p>
        </div>
        <SelectField label="Height" name="height" options={HEIGHT_OPTIONS} value={data.height || ""} onChange={onChange} error={fieldErrors?.height} />
        <SelectField label="Weight" name="weight" options={WEIGHT_OPTIONS} value={data.weight || ""} onChange={onChange} optional />
        <SelectField label="Appearance" name="appearance" options={["Very Fair", "Fair", "Wheatish", "Wheatish Brown", "Dark"]} value={data.appearance || ""} onChange={onChange} error={fieldErrors?.appearance} />
        <SelectField label="Complexion" name="complexion" options={["Very Fair", "Fair", "Medium", "Olive", "Dark"]} value={data.complexion || ""} onChange={onChange} error={fieldErrors?.complexion} />
        <SelectField label="Ethnicity" name="ethnicity" options={ethnicityOpts} value={data.ethnicity || ""} onChange={onChange} error={fieldErrors?.ethnicity} />
        <SelectField label="Dress Code" name="dressCode" options={dressCodeOpts} value={data.dressCode || ""} onChange={onChange} error={fieldErrors?.dressCode} />
        <SelectField label="Family Status" name="familyStatus" options={["Upper Class", "Upper Middle Class", "Middle Class", "Lower Middle Class"]} value={data.familyStatus || ""} onChange={onChange} error={fieldErrors?.familyStatus} />
        <SelectField label="Civil Status" name="civilStatus" options={["Never Married", "Widowed", "Divorced", "Separated", "Other"]} value={data.civilStatus || ""} onChange={onChange} error={fieldErrors?.civilStatus} />
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
        <div className="sm:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PasswordField label="Password" name="password" placeholder="Create a password" value={data.password || ""} onChange={onChange} error={fieldErrors?.password} />
          <PasswordField label="Confirm Password" name="confirmPassword" placeholder="Confirm your password" value={data.confirmPassword || ""} onChange={onChange} error={fieldErrors?.confirmPassword} />
        </div>
      </div>
    </div>
  );
}

function Step3({
  data, onChange, onLocationChange, onResidentLocationChange, fieldErrors, masterData,
}: {
  data: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  onLocationChange: (field: 'country' | 'city', value: string) => void;
  onResidentLocationChange: (field: 'residentCountry' | 'residentCity', value: string) => void;
  fieldErrors?: Record<string, string>;
  masterData?: MasterData | null;
}) {
  const educationOpts = masterData?.education?.map(e => e.value) ?? ["High School","Diploma","Bachelor's Degree","Master's Degree","Doctorate (PhD)","Other"];
  const occupationOpts = masterData?.occupation?.map(o => o.value) ?? ["Employed","Self Employed","Business Owner","Student","Not Employed"];
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800">Location &amp; Education</h2>
      <p className="mt-1 text-sm text-gray-500">Tell us where you are based and your qualifications</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CascadeLocation
          country={data.country || ''}
          city={data.city || ''}
          onChange={onLocationChange}
          errors={{ country: fieldErrors?.country, city: fieldErrors?.city }}
          required
        />

        {/* ── Resident Country & City (from masterfile) ── */}
        <CascadeLocation
          country={data.residentCountry || ''}
          city={data.residentCity || ''}
          onChange={(field, value) =>
            onResidentLocationChange(
              field === 'country' ? 'residentCountry' : 'residentCity',
              value
            )
          }
          errors={{ country: fieldErrors?.residentCountry, city: fieldErrors?.residentCity }}
          required={true}
          countryLabel="Resident Country"
          cityLabel="Resident City"
        />

        {/* Residency Status after Resident Country/City, spacer keeps grid aligned */}
        <SelectField label="Residency Status" name="residencyStatus" options={["Citizen", "Permanent Resident", "Work Visa", "Student Visa", "Other"]} value={data.residencyStatus || ""} onChange={onChange} error={fieldErrors?.residencyStatus} />
        <div className="hidden sm:block" />

        <SelectField label="Education" name="education" options={educationOpts} value={data.education || ""} onChange={onChange} error={fieldErrors?.education} />
        <TextField label="Field of Study" name="fieldOfStudy" placeholder="e.g. Computer Science" value={data.fieldOfStudy || ""} onChange={onChange} optional />
        <SelectField label="Occupation" name="occupation" options={occupationOpts} value={data.occupation || ""} onChange={onChange} error={fieldErrors?.occupation} />
        <TextField label="Profession / Job Title" name="profession" placeholder="e.g. Software Engineer" value={data.profession || ""} onChange={onChange} optional />
      </div>
    </div>
  );
}

function Step4({
  data, onChange, onFamilyLocationChange, fieldErrors,
}: {
  data: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  onFamilyLocationChange: (parent: 'father' | 'mother', field: 'Country' | 'City', value: string) => void;
  fieldErrors?: Record<string, string>;
}) {
  const [masterData, setMasterData] = React.useState<MasterData | null>(null);
  React.useEffect(() => { setMasterData(loadMasterData()); }, []);

  const selectCls = 'w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition appearance-none';
  const errCls = (e?: string) => e ? selectCls + ' border-red-400' : selectCls;

  const fatherCities = masterData && data.fatherCountry
    ? (masterData.countries.find(c => c.name === data.fatherCountry)?.cities.map(ci => ci.name) ?? [])
    : [];
  const motherCities = masterData && data.motherCountry
    ? (masterData.countries.find(c => c.name === data.motherCountry)?.cities.map(ci => ci.name) ?? [])
    : [];
  const countryOptions = masterData ? masterData.countries.map(c => c.name) : ['Sri Lanka','United Kingdom','Australia','Canada','UAE','Saudi Arabia','Qatar','USA','Malaysia','Other'];

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800">Family Details</h2>
      <p className="mt-1 text-sm text-gray-500">Information about your family</p>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Father's Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Ethnicity" name="fatherEthnicity" options={["Muslim","Sri Lankan Moors","Indian Moors","Malays","Indian Malays","Arab (Middle Eastern)","Tamil","Indian","Memons","Turkish","European","Other"]} value={data.fatherEthnicity || ""} onChange={onChange} error={fieldErrors?.fatherEthnicity} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Country</label>
            <select
              value={data.fatherCountry || ''}
              onChange={e => onFamilyLocationChange('father', 'Country', e.target.value)}
              className={errCls(fieldErrors?.fatherCountry)}
            >
              <option value="">Select Country</option>
              {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {fieldErrors?.fatherCountry && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.fatherCountry}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className={`text-sm font-medium ${data.fatherCountry ? 'text-gray-600' : 'text-gray-300'}`}>City</label>
            <select
              value={data.fatherCity || ''}
              onChange={e => onFamilyLocationChange('father', 'City', e.target.value)}
              disabled={!data.fatherCountry}
              className={`${errCls(fieldErrors?.fatherCity)} ${!data.fatherCountry ? 'cursor-not-allowed bg-gray-50 text-gray-300' : ''}`}
            >
              <option value="">{data.fatherCountry ? 'Select City' : 'Select country first'}</option>
              {fatherCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {fieldErrors?.fatherCity && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.fatherCity}</p>}
          </div>
          <SelectField label="Occupation" name="fatherOccupation" options={["Business","Government Employee","Private Sector","Retired","Not Employed","Deceased"]} value={data.fatherOccupation || ""} onChange={onChange} error={fieldErrors?.fatherOccupation} />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Mother's Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Ethnicity" name="motherEthnicity" options={["Muslim","Sri Lankan Moors","Indian Moors","Malays","Indian Malays","Arab (Middle Eastern)","Tamil","Indian","Memons","Turkish","European","Other"]} value={data.motherEthnicity || ""} onChange={onChange} error={fieldErrors?.motherEthnicity} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Country</label>
            <select
              value={data.motherCountry || ''}
              onChange={e => onFamilyLocationChange('mother', 'Country', e.target.value)}
              className={errCls(fieldErrors?.motherCountry)}
            >
              <option value="">Select Country</option>
              {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {fieldErrors?.motherCountry && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.motherCountry}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className={`text-sm font-medium ${data.motherCountry ? 'text-gray-600' : 'text-gray-300'}`}>City</label>
            <select
              value={data.motherCity || ''}
              onChange={e => onFamilyLocationChange('mother', 'City', e.target.value)}
              disabled={!data.motherCountry}
              className={`${errCls(fieldErrors?.motherCity)} ${!data.motherCountry ? 'cursor-not-allowed bg-gray-50 text-gray-300' : ''}`}
            >
              <option value="">{data.motherCountry ? 'Select City' : 'Select country first'}</option>
              {motherCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {fieldErrors?.motherCity && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.motherCity}</p>}
          </div>
          <SelectField label="Occupation" name="motherOccupation" options={["Business","Government Employee","Private Sector","Homemaker","Retired","Not Employed"]} value={data.motherOccupation || ""} onChange={onChange} error={fieldErrors?.motherOccupation} />
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


const blockDigits = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key >= '0' && e.key <= '9') e.preventDefault();
};
const stripDigitsOnPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
  e.preventDefault();
  const text = e.clipboardData.getData('text').replace(/[0-9]/g, '');
  document.execCommand('insertText', false, text);
};

/* ─── Multi-Country Select ──────────────────────────────────────── */
function MultiCountrySelect({
  selected, onChange, countries,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
  countries: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (country: string) => {
    if (selected.includes(country)) onChange(selected.filter(c => c !== country));
    else onChange([...selected, country]);
  };

  const filtered = countries.filter(
    c => c.toLowerCase().includes(search.toLowerCase()) && !selected.includes(c)
  );

  return (
    <div className="flex flex-col gap-1" ref={ref}>
      <label className="text-sm font-medium text-gray-600">
        Looking Country{' '}
        <span className="text-gray-400 text-xs font-normal">(optional, select multiple)</span>
      </label>

      {/* Pill tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1">
          {selected.map(c => (
            <span
              key={c}
              className="inline-flex items-center gap-1 bg-[#1B6B4A]/10 text-[#1B6B4A] text-xs font-semibold px-2.5 py-1 rounded-full"
            >
              {c}
              <button
                type="button"
                onClick={() => toggle(c)}
                className="ml-0.5 text-[#1B6B4A]/60 hover:text-[#1B6B4A] leading-none text-sm transition"
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
          className="w-full flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 bg-white hover:border-[#1B6B4A]/40 focus:outline-none focus:ring-2 focus:ring-[#1B6B4A]/20 focus:border-[#1B6B4A] transition"
        >
          <span className={selected.length === 0 ? 'text-gray-400' : 'text-gray-700 font-medium'}>
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
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1B6B4A]/20 focus:border-[#1B6B4A] transition"
              />
            </div>
            {/* Options */}
            <ul className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-4 py-2.5 text-xs text-gray-400 italic">No countries found</li>
              ) : (
                filtered.map(c => (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => toggle(c)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#1B6B4A]/5 flex items-center gap-2 transition"
                    >
                      <span className="w-4 h-4 rounded border border-gray-300 bg-white flex-shrink-0" />
                      {c}
                    </button>
                  </li>
                ))
              )}
            </ul>
            {/* Selected items at bottom with checkmark */}
            {selected.length > 0 && (
              <div className="border-t border-gray-100 py-1">
                {selected.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggle(c)}
                    className="w-full text-left px-4 py-2 text-sm text-[#1B6B4A] font-medium hover:bg-[#1B6B4A]/5 flex items-center gap-2 transition"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
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


function Step5({ data, onChange, lookingFor, setLookingFor, agreedTerms, setAgreedTerms, countryPrefSelected, setCountryPrefSelected, minAgePref, setMinAgePref, maxAgePref, setMaxAgePref }: {
  data: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => void;
  lookingFor: string;
  setLookingFor: (v: string) => void;
  agreedTerms: boolean;
  setAgreedTerms: (v: boolean) => void;
  countryPrefSelected: string[];
  setCountryPrefSelected: (v: string[]) => void;
  minAgePref: string;
  setMinAgePref: (v: string) => void;
  maxAgePref: string;
  setMaxAgePref: (v: string) => void;
}) {
  const [masterData, setMasterData] = React.useState<MasterData | null>(null);
  React.useEffect(() => { setMasterData(loadMasterData()); }, []);

  const countryOptions = masterData
    ? masterData.countries.map((c) => c.name).sort()
    : ['Sri Lanka', 'United Kingdom', 'Australia', 'Canada', 'UAE', 'Saudi Arabia', 'Qatar', 'USA', 'Malaysia', 'Other'];

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800">Additional Details</h2>
      <p className="mt-1 text-sm text-gray-500">Tell us more about yourself</p>

      {/* ── Looking Country (multi-select) ──────────────────── */}
      <div className="mt-6">
        <MultiCountrySelect
          selected={countryPrefSelected}
          onChange={setCountryPrefSelected}
          countries={countryOptions}
        />
        <p className="text-xs text-gray-400 mt-1">Only profiles from selected countries will be shown to you in browse results.</p>
      </div>

      {/* ── Preferred Age Range ───────────────────────────── */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Preferred Age Range <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-0.5">Min Age</label>
            <input
              type="number"
              min={18} max={80}
              placeholder="e.g. 22"
              value={minAgePref}
              onChange={e => setMinAgePref(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition"
            />
          </div>
          <span className="text-gray-400 text-sm mt-5">–</span>
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-0.5">Max Age</label>
            <input
              type="number"
              min={18} max={80}
              placeholder="e.g. 35"
              value={maxAgePref}
              onChange={e => setMaxAgePref(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">Only profiles within this age range will be shown to you in browse results.</p>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600">Additional Information</label>
        <textarea
          name="about"
          value={data.about || ""}
          onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
          rows={4}
          placeholder="Tell us more about yourself....."
          maxLength={500}
          onKeyDown={blockDigits}
          onPaste={stripDigitsOnPaste}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition resize-none"
        />
        <p className="text-[10px] text-right mt-0.5 text-gray-400">{(data.about || '').length}/500</p>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600">Tell us more about Expectations</label>
        <textarea
          name="expectations"
          value={data.expectations || ""}
          onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
          rows={4}
          placeholder="What are you looking for in partner......"
          maxLength={500}
          onKeyDown={blockDigits}
          onPaste={stripDigitsOnPaste}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition resize-none"
        />
        <p className="text-[10px] text-right mt-0.5 text-gray-400">{(data.expectations || '').length}/500</p>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600">
          Extra Qualification <span className="text-gray-400 text-xs font-normal">(optional)</span>
        </label>
        <textarea
          name="extraQualification"
          value={data.extraQualification || ""}
          onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
          rows={3}
          placeholder="Any additional qualifications, certifications or skills..."
          maxLength={500}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition resize-none"
        />
        <p className="text-[10px] text-right mt-0.5 text-gray-400">{(data.extraQualification || '').length}/500</p>
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
  const [countryPrefSelected, setCountryPrefSelected] = useState<string[]>([]);
  const [minAgePref, setMinAgePref] = useState('');
  const [maxAgePref, setMaxAgePref] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [masterData, setMasterData] = useState<MasterData | null>(null);
  useEffect(() => { setMasterData(loadMasterData()); }, []);
  const minAge = masterData?.ageRange?.min ?? 18;

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

  // Cascading location handler
  const handleLocationChange = (field: 'country' | 'city', value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'country') { next.city = ''; }
      return next;
    });
    setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  // Resident Country / City cascade handler
  const handleResidentLocationChange = (field: 'residentCountry' | 'residentCity', value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'residentCountry') { next.residentCity = ''; }
      return next;
    });
  };

  // Cascading family location handler (father/mother country → clears city)
  const handleFamilyLocationChange = (parent: 'father' | 'mother', field: 'Country' | 'City', value: string) => {
    const key = `${parent}${field}` as string;
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      if (field === 'Country') { next[`${parent}City`] = ''; }
      return next;
    });
    setFieldErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
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
      // firstName and lastName are optional — not validated
      if (!formData.createdBy) errs.createdBy = 'Please select who is creating this profile.';
      if (!formData.gender) errs.gender = 'Please select a gender.';
      if (!formData.birthDate) {
        errs.birthDate = 'Birth date is required.';
      } else if (!isAtLeastMinAge(formData.birthDate, minAge)) {
        errs.birthDate = `You must be at least ${minAge} years old to register.`;
      }
      if (!formData.height) errs.height = 'Please select a height.';
      if (!formData.appearance) errs.appearance = 'Please select an appearance.';
      if (!formData.complexion) errs.complexion = 'Please select a complexion.';
      if (!formData.ethnicity) errs.ethnicity = 'Please select an ethnicity.';
      if (!formData.dressCode) errs.dressCode = 'Please select a dress code.';
      if (!formData.familyStatus) errs.familyStatus = 'Please select a family status.';
      if (!formData.civilStatus) errs.civilStatus = 'Please select a civil status.';
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        return;
      }
      setFieldErrors({});
    }
    // Step 3 = Location & Education
    if (currentStep === 3) {
      const errs: Record<string, string> = {};
      if (!formData.country) errs.country = 'Please select a country.';
      if (!formData.city) errs.city = 'Please select a city.';
      if (!formData.residentCountry) errs.residentCountry = 'Please select a resident country.';
      if (!formData.residentCity) errs.residentCity = 'Please select a resident city.';
      if (!formData.residencyStatus) errs.residencyStatus = 'Please select a residency status.';
      if (!formData.education) errs.education = 'Please select an education level.';
      if (!formData.occupation) errs.occupation = 'Please select an occupation.';
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
      // brothers / sisters — validated
      if (formData.brothers && (isNaN(Number(formData.brothers)) || Number(formData.brothers) < 0 || Number(formData.brothers) > 20))
        errs.brothers = 'Must be a number between 0 and 20.';
      if (formData.sisters && (isNaN(Number(formData.sisters)) || Number(formData.sisters) < 0 || Number(formData.sisters) > 20))
        errs.sisters = 'Must be a number between 0 and 20.';
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
        const countryPref = formData.countryPreference?.trim() || '';
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
      // Scroll to top so the new step is visible from the beginning on mobile
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

      // Step 2: Auto-create a profile using the details already filled in the form.
      // Important: keep payload strictly aligned with backend CreateChildProfileDto
      // so validation doesn't reject it and leave user with "No profile yet".
      const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(" ").trim();
      const genderMap: Record<string, string> = { Male: "MALE", Female: "FEMALE" };

      // Height: DTO expects an integer in cm. The form stores strings like "5'6"".
      const heightNum = formData.height ? (HEIGHT_TO_CM[formData.height] ?? undefined) : undefined;

      // If no name provided, use member ID (from register response) or email prefix.
      const profileName = fullName || res.user?.memberId || formData.email.split('@')[0];

      const profilePayload: Record<string, any> = {
        // Required
        name: profileName,
        gender: genderMap[formData.gender] ?? 'MALE',
        dateOfBirth: formData.birthDate || new Date(Date.now() - 20 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],

        // Personal details
        ...(formData.createdBy && { createdBy: formData.createdBy }),
        ...(heightNum !== undefined && { height: heightNum }),
        ...(formData.weight && { weight: parseInt(formData.weight, 10) }),
        ...(formData.appearance && { appearance: formData.appearance }),
        ...(formData.complexion && { complexion: formData.complexion }),
        ...(formData.ethnicity && { ethnicity: formData.ethnicity }),
        ...(formData.dressCode && { dressCode: formData.dressCode }),
        ...(formData.familyStatus && { familyStatus: formData.familyStatus }),
        ...(formData.civilStatus && { civilStatus: formData.civilStatus }),

        // Location & education (DTO-supported keys only)
        ...(formData.country && { country: formData.country }),
        ...(formData.city && { city: formData.city }),
        ...(formData.residentCountry && { residentCountry: formData.residentCountry }),
        ...(formData.residentCity && { residentCity: formData.residentCity }),
        ...(formData.residencyStatus && { residencyStatus: formData.residencyStatus }),
        ...(formData.education && { education: formData.education }),
        ...(formData.fieldOfStudy && { fieldOfStudy: formData.fieldOfStudy }),
        ...(formData.occupation && { occupation: formData.occupation }),
        ...(formData.profession && { profession: formData.profession }),

        // Family details
        ...(formData.fatherEthnicity && { fatherEthnicity: formData.fatherEthnicity }),
        ...(formData.fatherCountry && { fatherCountry: formData.fatherCountry }),
        ...(formData.fatherCity && { fatherCity: formData.fatherCity }),
        ...(formData.fatherOccupation && { fatherOccupation: formData.fatherOccupation }),
        ...(formData.motherEthnicity && { motherEthnicity: formData.motherEthnicity }),
        ...(formData.motherCountry && { motherCountry: formData.motherCountry }),
        ...(formData.motherCity && { motherCity: formData.motherCity }),
        ...(formData.motherOccupation && { motherOccupation: formData.motherOccupation }),
        ...(formData.brothers && { brothers: parseInt(formData.brothers, 10) }),
        ...(formData.sisters && { sisters: parseInt(formData.sisters, 10) }),
        ...((formData.brothers || formData.sisters) && {
          siblings: parseInt(formData.brothers || '0', 10) + parseInt(formData.sisters || '0', 10),
        }),

        // Additional details
        ...(formData.about && { aboutUs: formData.about }),
        ...(formData.expectations && { expectations: formData.expectations }),
        ...(formData.extraQualification && { extraQualification: formData.extraQualification }),
        ...(countryPrefSelected.length > 0 && { countryPreference: countryPrefSelected.join(',') }),
        ...(minAgePref && { minAgePreference: parseInt(minAgePref, 10) }),
        ...(maxAgePref && { maxAgePreference: parseInt(maxAgePref, 10) }),

        // Contact from account details
        ...(formData.phone && { phone: formData.phone }),
      };

      try {
        await profileApi.create(profilePayload);
      } catch (profileErr: any) {
        const msg = profileErr?.message ?? 'Failed to create profile';
        console.error("[Register] Auto-profile creation failed:", msg);
        setError(`Account created, but profile creation failed: ${msg}. Please try again.`);
        return;
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
              {currentStep === 2 && <Step1 data={formData} onChange={handleChange} fieldErrors={fieldErrors} minAge={minAge} masterData={masterData} />}
              {currentStep === 3 && <Step3 data={formData} onChange={handleChange} onLocationChange={handleLocationChange} onResidentLocationChange={handleResidentLocationChange} fieldErrors={fieldErrors} masterData={masterData} />}
              {currentStep === 4 && <Step4 data={formData} onChange={handleChange} onFamilyLocationChange={handleFamilyLocationChange} fieldErrors={fieldErrors} />}
              {currentStep === 5 && <Step5 data={formData} onChange={handleChange} lookingFor={lookingFor} setLookingFor={setLookingFor} agreedTerms={agreedTerms} setAgreedTerms={setAgreedTerms} countryPrefSelected={countryPrefSelected} setCountryPrefSelected={setCountryPrefSelected} minAgePref={minAgePref} setMinAgePref={setMinAgePref} maxAgePref={maxAgePref} setMaxAgePref={setMaxAgePref} />}
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
