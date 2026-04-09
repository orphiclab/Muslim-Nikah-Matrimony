'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { loadMasterData, saveMasterData, uid, type SimpleItem } from '../data';

function InlineInput({ value, onSave, onCancel, placeholder }: {
  value?: string; onSave: (v: string) => void; onCancel: () => void; placeholder?: string;
}) {
  const [v, setV] = useState(value ?? '');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="flex items-center gap-2 flex-1">
      <input ref={ref} value={v} onChange={e => setV(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && v.trim()) onSave(v.trim()); if (e.key === 'Escape') onCancel(); }}
        placeholder={placeholder ?? 'Enter value…'}
        className="flex-1 border border-[#1C3B35]/40 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#1C3B35]/20 focus:border-[#1C3B35]"
      />
      <button onClick={() => v.trim() && onSave(v.trim())} className="text-xs font-bold text-white bg-[#1C3B35] px-3 py-1.5 rounded-lg hover:bg-[#15302a] transition">✓</button>
      <button onClick={onCancel} className="text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">✕</button>
    </div>
  );
}

function DeleteModal({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
          </div>
          <div><h3 className="font-semibold text-gray-900 text-sm">Delete Item</h3><p className="text-xs text-gray-500">This cannot be undone.</p></div>
        </div>
        <p className="text-sm text-gray-600 mb-5">Delete <strong>"{label}"</strong>?</p>
        <div className="flex gap-2.5">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function EducationPage() {
  const [items, setItems] = useState<SimpleItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SimpleItem | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setItems(loadMasterData().education); setMounted(true); }, []);

  const persist = (next: SimpleItem[]) => {
    setItems(next);
    const data = loadMasterData();
    saveMasterData({ ...data, education: next });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  if (!mounted) return <div className="flex items-center justify-center h-40"><svg className="w-6 h-6 animate-spin text-[#1C3B35]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg></div>;

  return (
    <div className="font-poppins space-y-5 max-w-2xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/admin/master-file" className="hover:text-[#1C3B35] transition font-medium">Master File</Link>
            <span>›</span><span className="text-gray-700 font-medium">Education</span>
          </div>
          <h1 className="text-[22px] sm:text-[26px] font-medium text-[#121514] flex items-center gap-2">🎓 Education
            <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-[#EAF2EE] text-[#1C3B35]">{items.length}</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-xl"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>Saved</span>}
          <button onClick={() => { setAdding(true); setEditId(null); }}
            className="flex items-center gap-1.5 bg-[#1C3B35] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#15302a] transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {adding && (
            <div className="px-5 py-3">
              <InlineInput placeholder="e.g. Bachelor of Science"
                onSave={v => { persist([...items, { id: uid(), value: v }]); setAdding(false); }}
                onCancel={() => setAdding(false)} />
            </div>
          )}
          {items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition">
              <span className="text-xs text-gray-300 font-mono w-5 shrink-0">{i + 1}</span>
              {editId === item.id
                ? <InlineInput value={item.value}
                    onSave={v => { persist(items.map(x => x.id === item.id ? { ...x, value: v } : x)); setEditId(null); }}
                    onCancel={() => setEditId(null)} />
                : <>
                    <span className="flex-1 text-sm font-medium text-gray-800">{item.value}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => { setEditId(item.id); setAdding(false); }}
                        className="p-1.5 text-gray-400 hover:text-[#1C3B35] hover:bg-[#EAF2EE] rounded-lg transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button onClick={() => setDeleteTarget(item)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                      </button>
                    </div>
                  </>
              }
            </div>
          ))}
          {items.length === 0 && !adding && (
            <p className="text-center text-sm text-gray-400 py-10">No items yet. Click "Add" to get started.</p>
          )}
        </div>
      </div>

      {deleteTarget && <DeleteModal label={deleteTarget.value}
        onConfirm={() => { persist(items.filter(x => x.id !== deleteTarget.id)); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
