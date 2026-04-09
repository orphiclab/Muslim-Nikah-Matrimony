// Shared localStorage data layer for Master File

export type City = { id: string; name: string };
export type Country = { id: string; name: string; cities: City[] };
export type SimpleItem = { id: string; value: string };

export type MasterData = {
  countries: Country[];
  education: SimpleItem[];
  occupation: SimpleItem[];
  dressCode: SimpleItem[];
  ethnicity: SimpleItem[];
  ageRange: { min: number; max: number };
};

export const LS_KEY = 'mn_master_data';
export const uid = () => Math.random().toString(36).slice(2, 10);

const DEFAULT_DATA: MasterData = {
  countries: [
    { id: 'c1', name: 'Sri Lanka', cities: [{ id: 'ci1', name: 'Colombo' }, { id: 'ci2', name: 'Kandy' }, { id: 'ci3', name: 'Galle' }, { id: 'ci4', name: 'Jaffna' }, { id: 'ci5', name: 'Negombo' }, { id: 'ci6', name: 'Matara' }, { id: 'ci7', name: 'Ratmalana' }, { id: 'ci8', name: 'Nuwara Eliya' }, { id: 'ci9', name: 'Vavuniya' }] },
    { id: 'c2', name: 'United Kingdom', cities: [{ id: 'ci10', name: 'London' }, { id: 'ci11', name: 'Birmingham' }, { id: 'ci12', name: 'Manchester' }, { id: 'ci13', name: 'Edinburgh' }, { id: 'ci14', name: 'Glasgow' }] },
    { id: 'c3', name: 'Australia', cities: [{ id: 'ci15', name: 'Sydney' }, { id: 'ci16', name: 'Melbourne' }, { id: 'ci17', name: 'Brisbane' }, { id: 'ci18', name: 'Perth' }] },
    { id: 'c4', name: 'Canada', cities: [{ id: 'ci19', name: 'Toronto' }, { id: 'ci20', name: 'Vancouver' }, { id: 'ci21', name: 'Ottawa' }, { id: 'ci22', name: 'Montreal' }] },
    { id: 'c5', name: 'UAE', cities: [{ id: 'ci23', name: 'Dubai' }, { id: 'ci24', name: 'Abu Dhabi' }, { id: 'ci25', name: 'Sharjah' }, { id: 'ci26', name: 'Ajman' }] },
    { id: 'c6', name: 'Saudi Arabia', cities: [{ id: 'ci27', name: 'Riyadh' }, { id: 'ci28', name: 'Jeddah' }, { id: 'ci29', name: 'Mecca' }, { id: 'ci30', name: 'Medina' }] },
    { id: 'c7', name: 'Qatar', cities: [{ id: 'ci31', name: 'Doha' }, { id: 'ci32', name: 'Al Wakrah' }] },
    { id: 'c8', name: 'USA', cities: [{ id: 'ci33', name: 'New York' }, { id: 'ci34', name: 'Los Angeles' }, { id: 'ci35', name: 'Chicago' }, { id: 'ci36', name: 'Houston' }, { id: 'ci37', name: 'San Francisco' }] },
    { id: 'c9', name: 'Malaysia', cities: [{ id: 'ci38', name: 'Kuala Lumpur' }, { id: 'ci39', name: 'Penang' }, { id: 'ci40', name: 'Johor Bahru' }, { id: 'ci41', name: 'Petaling Jaya' }] },
    { id: 'c_other', name: 'Other', cities: [] },
  ],
  education: [
    { id: 'e1', value: 'School' }, { id: 'e2', value: 'Diploma' }, { id: 'e3', value: 'Degree' },
    { id: 'e4', value: 'Bachelor of Arts' }, { id: 'e5', value: 'Bachelor of Engineering' },
    { id: 'e6', value: 'Masters' }, { id: 'e7', value: 'PhD' }, { id: 'e8', value: 'Other' },
  ],
  occupation: [
    { id: 'o1', value: 'Employed' }, { id: 'o2', value: 'Self Employed' }, { id: 'o3', value: 'Business Owner' },
    { id: 'o4', value: 'Student' }, { id: 'o5', value: 'Not Employed' },
    { id: 'o6', value: 'Engineer' }, { id: 'o7', value: 'Doctor' }, { id: 'o8', value: 'Teacher' },
    { id: 'o9', value: 'Accountant' }, { id: 'o10', value: 'IT Professional' },
    { id: 'o11', value: 'Government Employee' }, { id: 'o12', value: 'Private Sector' }, { id: 'o13', value: 'Other' },
  ],
  dressCode: [
    { id: 'd1', value: 'Hijab' }, { id: 'd2', value: 'Niqab' }, { id: 'd3', value: 'Casual Modest' },
    { id: 'd4', value: 'Islamic Formal' }, { id: 'd5', value: 'Traditional' }, { id: 'd6', value: 'Other' },
  ],
  ethnicity: [
    { id: 'eth1', value: 'Muslim' }, { id: 'eth2', value: 'Sri Lankan Moors' }, { id: 'eth3', value: 'Indian Moors' },
    { id: 'eth4', value: 'Malays' }, { id: 'eth5', value: 'Indian Malays' }, { id: 'eth6', value: 'Arab (Middle Eastern)' },
    { id: 'eth7', value: 'Tamil' }, { id: 'eth8', value: 'Indian' }, { id: 'eth9', value: 'Memons' },
    { id: 'eth10', value: 'Turkish' }, { id: 'eth11', value: 'European' }, { id: 'eth12', value: 'Other' },
  ],
  ageRange: { min: 18, max: 65 },
};

/** Flatten old 3-level data (states->cities) or keep 2-level data as-is */
function migrateCountry(c: any): Country {
  if (Array.isArray(c.cities)) {
    return { id: c.id ?? uid(), name: c.name ?? '', cities: c.cities };
  }
  // Old 3-level: flatten all cities from all states
  if (Array.isArray(c.states)) {
    const allCities: City[] = [];
    for (const s of c.states) {
      if (Array.isArray(s.cities)) allCities.push(...s.cities);
    }
    return { id: c.id ?? uid(), name: c.name ?? '', cities: allCities };
  }
  return { id: c.id ?? uid(), name: c.name ?? '', cities: [] };
}

export function loadMasterData(): MasterData {
  if (typeof window === 'undefined') return DEFAULT_DATA;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw) as any;
    return {
      countries: Array.isArray(parsed.countries) ? parsed.countries.map(migrateCountry) : DEFAULT_DATA.countries,
      education: Array.isArray(parsed.education) ? parsed.education : DEFAULT_DATA.education,
      occupation: Array.isArray(parsed.occupation) ? parsed.occupation : DEFAULT_DATA.occupation,
      dressCode: Array.isArray(parsed.dressCode) ? parsed.dressCode : DEFAULT_DATA.dressCode,
      ethnicity: Array.isArray(parsed.ethnicity) ? parsed.ethnicity : DEFAULT_DATA.ethnicity,
      ageRange: parsed.ageRange && typeof parsed.ageRange.min === 'number' && typeof parsed.ageRange.max === 'number'
        ? parsed.ageRange
        : DEFAULT_DATA.ageRange,
    };
  } catch { return DEFAULT_DATA; }
}

export function saveMasterData(data: MasterData) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}
