'use client';
/**
 * CascadeLocation — Country → City (2-level cascade)
 * Reads from master file localStorage. Falls back to built-in defaults.
 */

import { useEffect, useState } from 'react';

type City = { id: string; name: string };
type Country = { id: string; name: string; cities: City[] };

const FALLBACK_COUNTRIES: Country[] = [
  { id: 'c1', name: 'Sri Lanka', cities: [{ id: 'ci1', name: 'Colombo' }, { id: 'ci2', name: 'Kandy' }, { id: 'ci3', name: 'Galle' }, { id: 'ci4', name: 'Jaffna' }, { id: 'ci5', name: 'Negombo' }] },
  { id: 'c2', name: 'United Kingdom', cities: [{ id: 'ci6', name: 'London' }, { id: 'ci7', name: 'Birmingham' }, { id: 'ci8', name: 'Manchester' }] },
  { id: 'c3', name: 'Australia', cities: [{ id: 'ci9', name: 'Sydney' }, { id: 'ci10', name: 'Melbourne' }, { id: 'ci11', name: 'Brisbane' }] },
  { id: 'c4', name: 'Canada', cities: [{ id: 'ci12', name: 'Toronto' }, { id: 'ci13', name: 'Vancouver' }] },
  { id: 'c5', name: 'UAE', cities: [{ id: 'ci14', name: 'Dubai' }, { id: 'ci15', name: 'Abu Dhabi' }, { id: 'ci16', name: 'Sharjah' }] },
  { id: 'c6', name: 'Saudi Arabia', cities: [{ id: 'ci17', name: 'Riyadh' }, { id: 'ci18', name: 'Jeddah' }] },
  { id: 'c7', name: 'Qatar', cities: [{ id: 'ci19', name: 'Doha' }] },
  { id: 'c8', name: 'USA', cities: [{ id: 'ci20', name: 'New York' }, { id: 'ci21', name: 'Los Angeles' }, { id: 'ci22', name: 'Chicago' }] },
  { id: 'c9', name: 'Malaysia', cities: [{ id: 'ci23', name: 'Kuala Lumpur' }, { id: 'ci24', name: 'Penang' }] },
  { id: 'c_other', name: 'Other', cities: [] },
];

function loadCountries(): Country[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('mn_master_data') : null;
    if (!raw) return FALLBACK_COUNTRIES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.countries) || parsed.countries.length === 0) return FALLBACK_COUNTRIES;
    return parsed.countries.map((c: any): Country => {
      // Handle both 2-level (cities) and legacy 3-level (states->cities) formats
      if (Array.isArray(c.cities)) {
        return { id: c.id, name: c.name, cities: c.cities };
      }
      if (Array.isArray(c.states)) {
        const all: City[] = [];
        for (const s of c.states) if (Array.isArray(s.cities)) all.push(...s.cities);
        return { id: c.id, name: c.name, cities: all };
      }
      return { id: c.id, name: c.name, cities: [] };
    });
  } catch {
    return FALLBACK_COUNTRIES;
  }
}

const selectCls = (err?: string) =>
  `w-full border rounded-xl px-3.5 py-2.5 text-sm text-gray-700 outline-none focus:border-[#1C3B35] transition bg-gray-50 focus:bg-white appearance-none ${err ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`;

interface CascadeLocationProps {
  country: string;
  city: string;
  onChange: (field: 'country' | 'city', value: string) => void;
  errors?: { country?: string; city?: string };
  required?: boolean;
  countryLabel?: string;
  cityLabel?: string;
}

export function CascadeLocation({ country, city, onChange, errors = {}, required = true, countryLabel = 'Country', cityLabel = 'City' }: CascadeLocationProps) {
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => { setCountries(loadCountries()); }, []);

  const selectedCountry = countries.find(c => c.name === country);
  const cities = selectedCountry?.cities ?? [];

  const handleCountry = (v: string) => {
    onChange('country', v);
    onChange('city', ''); // reset city when country changes
  };

  return (
    <>
      {/* Country */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
          {countryLabel} {required && <span className="text-red-400">*</span>}
        </label>
        <div className="relative">
          <select value={country} onChange={e => handleCountry(e.target.value)} className={selectCls(errors.country)}>
            <option value="">Select Country</option>
            {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
          </span>
        </div>
        {errors.country && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.country}</p>}
      </div>

      {/* City */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
          {cityLabel} {required && <span className="text-red-400">*</span>}
        </label>
        <div className="relative">
          <select
            value={city}
            onChange={e => onChange('city', e.target.value)}
            disabled={!country || cities.length === 0}
            className={selectCls(errors.city) + ((!country || cities.length === 0) ? ' opacity-50 cursor-not-allowed' : '')}
          >
            <option value="">{!country ? 'Select country first' : cities.length === 0 ? 'No cities available' : 'Select City'}</option>
            {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
          </span>
        </div>
        {errors.city && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.city}</p>}
      </div>
    </>
  );
}
