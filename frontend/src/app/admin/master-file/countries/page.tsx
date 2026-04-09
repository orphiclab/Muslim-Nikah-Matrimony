'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { loadMasterData, saveMasterData, uid } from '../data';
import type { Country, City } from '../data';

function InlineInput({ value, onSave, onCancel, placeholder }: {
  value?: string; onSave: (v: string) => void; onCancel: () => void; placeholder?: string;
}) {
  const [v, setV] = useState(value ?? '');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
      <input ref={ref} value={v} onChange={e => setV(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && v.trim()) onSave(v.trim()); if (e.key === 'Escape') onCancel(); }}
        placeholder={placeholder ?? 'Enter name…'}
        className="flex-1 border-b-2 border-[#1C3B35] bg-transparent px-1 py-0.5 text-sm outline-none font-medium text-gray-800 placeholder:text-gray-400"
      />
      <button onClick={e => { e.stopPropagation(); v.trim() && onSave(v.trim()); }}
        className="flex items-center gap-1 text-xs font-bold text-white bg-[#1C3B35] px-2.5 py-1 rounded-lg hover:bg-[#15302a] transition">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg> Save
      </button>
      <button onClick={e => { e.stopPropagation(); onCancel(); }}
        className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded-lg hover:bg-gray-100 transition">✕</button>
    </div>
  );
}

function DeleteModal({ label, sublabel, onConfirm, onCancel }: { label: string; sublabel?: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-gray-100">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-11 w-11 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Delete "{label}"?</h3>
            {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
          </div>
        </div>
        <div className="flex gap-2.5">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addingCountry, setAddingCountry] = useState(false);
  const [editCountryId, setEditCountryId] = useState<string | null>(null);
  const [addingCityFor, setAddingCityFor] = useState<string | null>(null);
  const [editCity, setEditCity] = useState<{ cid: string; cityId: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ label: string; sublabel?: string; onConfirm: () => void } | null>(null);

  useEffect(() => { setCountries(loadMasterData().countries); setMounted(true); }, []);

  const persist = (next: Country[]) => {
    setCountries(next);
    saveMasterData({ ...loadMasterData(), countries: next });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateCountry = (cid: string, fn: (c: Country) => Country) =>
    persist(countries.map(c => c.id === cid ? fn(c) : c));

  const totalCities = countries.reduce((a, c) => a + (c.cities?.length ?? 0), 0);

  if (!mounted) return (
    <div className="flex items-center justify-center h-64">
      <svg className="w-7 h-7 animate-spin text-[#1C3B35]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );

  return (
    <div className="font-poppins space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
            <Link href="/admin/master-file" className="hover:text-[#1C3B35] transition font-medium">Master File</Link>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-gray-600 font-semibold">Countries</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <span className="text-3xl">🌍</span> Countries &amp; Cities
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">{countries.length} countries</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">{totalCities} cities</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-xl">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg> Saved
            </span>
          )}
          <button onClick={() => { setAddingCountry(true); setEditCountryId(null); }}
            className="flex items-center gap-2 bg-[#1C3B35] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#15302a] transition shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Country
          </button>
        </div>
      </div>

      {/* Add Country inline */}
      {addingCountry && (
        <div className="bg-white border-2 border-[#1C3B35]/30 border-dashed rounded-2xl px-5 py-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">New Country</p>
          <InlineInput placeholder="Country name…"
            onSave={v => { persist([...countries, { id: uid(), name: v, cities: [] }]); setAddingCountry(false); }}
            onCancel={() => setAddingCountry(false)} />
        </div>
      )}

      {/* Country cards */}
      <div className="space-y-3">
        {countries.map(country => {
          const isOpen = expanded === country.id;
          const cityCount = country.cities?.length ?? 0;

          return (
            <div key={country.id}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${isOpen ? 'border-[#1C3B35]/20 shadow-md' : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'}`}>

              {/* Country row */}
              <div className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
                onClick={() => setExpanded(isOpen ? null : country.id)}>

                <div className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all ${isOpen ? 'bg-[#1C3B35] text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
                </div>

                <div className="flex-1 min-w-0">
                  {editCountryId === country.id ? (
                    <InlineInput value={country.name}
                      onSave={v => { updateCountry(country.id, c => ({ ...c, name: v })); setEditCountryId(null); }}
                      onCancel={() => setEditCountryId(null)} />
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">{country.name}</span>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {cityCount} {cityCount === 1 ? 'city' : 'cities'}
                      </span>
                    </div>
                  )}
                </div>

                {editCountryId !== country.id && (
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditCountryId(country.id); setExpanded(country.id); }}
                      className="p-2 text-gray-400 hover:text-[#1C3B35] hover:bg-[#EAF2EE] rounded-xl transition" title="Rename">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    <button onClick={() => setDeleteTarget({ label: country.name, sublabel: cityCount > 0 ? `${cityCount} cities will also be deleted.` : undefined, onConfirm: () => { persist(countries.filter(c => c.id !== country.id)); setDeleteTarget(null); } })}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition" title="Delete">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Cities panel */}
              {isOpen && (
                <div className="border-t border-gray-50 bg-gray-50/40 px-5 py-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Cities</p>

                  {/* Add city inline */}
                  {addingCityFor === country.id && (
                    <div className="mb-3 bg-white border border-emerald-200 border-dashed rounded-xl px-4 py-3">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1.5">New City</p>
                      <InlineInput placeholder="City name…"
                        onSave={v => { updateCountry(country.id, c => ({ ...c, cities: [...(c.cities ?? []), { id: uid(), name: v }] })); setAddingCityFor(null); }}
                        onCancel={() => setAddingCityFor(null)} />
                    </div>
                  )}

                  {/* City chips */}
                  <div className="flex flex-wrap gap-2">
                    {(country.cities ?? []).map(city => (
                      <div key={city.id}
                        className="group flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg pl-3 pr-1.5 py-1.5 hover:border-[#1C3B35]/30 hover:bg-[#EAF2EE]/60 transition">
                        {editCity?.cid === country.id && editCity?.cityId === city.id ? (
                          <InlineInput value={city.name}
                            onSave={v => { updateCountry(country.id, c => ({ ...c, cities: (c.cities ?? []).map(ci => ci.id === city.id ? { ...ci, name: v } : ci) })); setEditCity(null); }}
                            onCancel={() => setEditCity(null)} />
                        ) : (
                          <>
                            <span className="text-sm font-medium text-gray-700">{city.name}</span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                              <button onClick={() => setEditCity({ cid: country.id, cityId: city.id })}
                                className="p-1 text-gray-400 hover:text-[#1C3B35] rounded-md transition">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                              </button>
                              <button onClick={() => setDeleteTarget({ label: city.name, onConfirm: () => { updateCountry(country.id, c => ({ ...c, cities: (c.cities ?? []).filter(ci => ci.id !== city.id) })); setDeleteTarget(null); } })}
                                className="p-1 text-gray-400 hover:text-red-500 rounded-md transition">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}

                    {/* Add city button chip */}
                    {addingCityFor !== country.id && (
                      <button onClick={() => setAddingCityFor(country.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 border-dashed px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        Add City
                      </button>
                    )}
                  </div>

                  {(country.cities ?? []).length === 0 && addingCityFor !== country.id && (
                    <p className="text-xs text-gray-400 italic mt-2">No cities yet. Click "Add City" to begin.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {countries.length === 0 && !addingCountry && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="text-5xl mb-3">🌍</div>
            <p className="text-gray-500 font-medium">No countries yet.</p>
            <p className="text-gray-400 text-sm mt-1">Click "Add Country" to get started.</p>
          </div>
        )}
      </div>

      {deleteTarget && (
        <DeleteModal label={deleteTarget.label} sublabel={deleteTarget.sublabel}
          onConfirm={deleteTarget.onConfirm} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
