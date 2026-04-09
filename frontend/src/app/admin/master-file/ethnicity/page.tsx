'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadMasterData, saveMasterData, uid, SimpleItem } from '../data';

export default function EthnicityPage() {
  const [items, setItems] = useState<SimpleItem[]>([]);
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setItems(loadMasterData().ethnicity);
  }, []);

  const add = () => {
    const v = newValue.trim();
    if (!v) { setError('Enter an ethnicity name.'); return; }
    if (items.some(i => i.value.toLowerCase() === v.toLowerCase())) { setError('Already exists.'); return; }
    setItems(prev => [...prev, { id: uid(), value: v }]);
    setNewValue('');
    setError('');
    setSaved(false);
  };

  const remove = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    setSaved(false);
  };

  const save = () => {
    const data = loadMasterData();
    saveMasterData({ ...data, ethnicity: items });
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
          <h1 className="text-[22px] font-semibold text-[#121514]">Ethnicity</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage ethnicity options for profile filters and forms.</p>
        </div>
      </div>

      {/* Add new */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-3">
        <label className="block text-[12px] font-semibold text-[#1C3B35] uppercase tracking-wide">Add Ethnicity</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newValue}
            onChange={e => { setNewValue(e.target.value); setError(''); setSaved(false); }}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="e.g. Sri Lankan Moors"
            className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-[#1C3B35] transition"
          />
          <button onClick={add}
            className="bg-[#1C3B35] hover:bg-[#15302a] text-white text-[13px] font-semibold px-4 rounded-xl transition">
            Add
          </button>
        </div>
        {error && <p className="text-[12px] text-red-500">⚠️ {error}</p>}
      </div>

      {/* List */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[12px] font-semibold text-[#1C3B35] uppercase tracking-wide">
            Ethnicities <span className="text-gray-400 font-normal normal-case">({items.length})</span>
          </p>
        </div>
        {items.length === 0 ? (
          <p className="text-[13px] text-gray-400 text-center py-4">No ethnicities yet.</p>
        ) : (
          <ul className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {items.map(item => (
              <li key={item.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3.5 py-2.5 group">
                <span className="text-[13px] text-gray-700 font-medium">{item.value}</span>
                <button onClick={() => remove(item.id)}
                  className="text-gray-300 hover:text-red-400 transition text-lg leading-none opacity-0 group-hover:opacity-100">
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <button onClick={save}
          className={`w-full mt-2 py-2.5 rounded-xl text-[14px] font-bold transition-all ${
            saved ? 'bg-green-500 text-white' : 'bg-[#1C3B35] hover:bg-[#15302a] text-white'
          }`}>
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
