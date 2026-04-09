'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadMasterData, saveMasterData } from '../data';

export default function AgeRangePage() {
  const [min, setMin] = useState(18);
  const [max, setMax] = useState(65);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const data = loadMasterData();
    setMin(data.ageRange.min);
    setMax(data.ageRange.max);
  }, []);

  const handleSave = () => {
    setError('');
    if (!min || !max) { setError('Both values are required.'); return; }
    if (min < 1 || max > 120) { setError('Age must be between 1 and 120.'); return; }
    if (min >= max) { setError('Minimum age must be less than maximum age.'); return; }
    const data = loadMasterData();
    saveMasterData({ ...data, ageRange: { min, max } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="font-poppins space-y-6 max-w-lg">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/master-file"
          className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition shrink-0">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-[22px] font-semibold text-[#121514]">Age Range Settings</h1>
          <p className="text-gray-400 text-sm mt-0.5">Set the allowed minimum and maximum ages for profile filters.</p>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-6">
        {/* Info banner */}
        <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <span className="text-blue-500 text-lg shrink-0">ℹ️</span>
          <p className="text-[13px] text-blue-700 font-poppins leading-relaxed">
            This sets the <strong>global age range</strong> for all profile search filters — both the homepage filter bar and the profiles listing sidebar.
          </p>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-5">
          {/* Min age */}
          <div className="space-y-1.5">
            <label className="block text-[12px] font-semibold text-[#1C3B35] uppercase tracking-wide">
              Minimum Age
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={119}
                value={min}
                onChange={e => { setMin(Number(e.target.value)); setSaved(false); setError(''); }}
                className="w-full border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-[15px] font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/30 focus:border-[#1C3B35] transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 font-semibold">yrs</span>
            </div>
            <p className="text-[11px] text-gray-400">Allowed: 1 – 119</p>
          </div>

          {/* Max age */}
          <div className="space-y-1.5">
            <label className="block text-[12px] font-semibold text-[#1C3B35] uppercase tracking-wide">
              Maximum Age
            </label>
            <div className="relative">
              <input
                type="number"
                min={2}
                max={120}
                value={max}
                onChange={e => { setMax(Number(e.target.value)); setSaved(false); setError(''); }}
                className="w-full border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-[15px] font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/30 focus:border-[#1C3B35] transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 font-semibold">yrs</span>
            </div>
            <p className="text-[11px] text-gray-400">Allowed: 2 – 120</p>
          </div>
        </div>

        {/* Visual preview */}
        <div className="bg-[#F0F4F2] rounded-xl px-5 py-4 flex items-center justify-between">
          <div className="text-center">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Min</p>
            <p className="text-2xl font-bold text-[#1C3B35]">{min}</p>
            <p className="text-[10px] text-gray-400">years</p>
          </div>
          <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full relative overflow-hidden">
            <div
              className="absolute h-full bg-gradient-to-r from-[#1C3B35] to-[#DB9D30] rounded-full transition-all"
              style={{ left: `${((min - 1) / 119) * 100}%`, right: `${100 - ((max - 1) / 119) * 100}%` }}
            />
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Max</p>
            <p className="text-2xl font-bold text-[#1C3B35]">{max}</p>
            <p className="text-[10px] text-gray-400">years</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-[13px] text-red-500 font-semibold bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
            ⚠️ {error}
          </p>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          className={`w-full py-3 rounded-xl text-[14px] font-bold font-poppins transition-all duration-200 ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-[#1C3B35] hover:bg-[#15302a] text-white'
          }`}
        >
          {saved ? '✓ Saved Successfully' : 'Save Age Range'}
        </button>
      </div>
    </div>
  );
}
