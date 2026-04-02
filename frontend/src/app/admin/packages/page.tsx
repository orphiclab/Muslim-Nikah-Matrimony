'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/services/api';

/* ── Types ─────────────────────────────────────────── */
type Package = {
  id: string; name: string; description?: string; price: number;
  currency: string; durationDays: number; features: string[];
  isActive: boolean; sortOrder: number; type: string;
  discountPct?: number | null; originalPrice?: number | null;
  createdAt: string;
};

type SiteSettings = {
  siteDiscountPct: number;
  siteDiscountLabel: string;
  siteDiscountActive: boolean;
};

const EMPTY_FORM = {
  name: '', description: '', price: '', currency: 'LKR',
  durationDays: '30', featuresRaw: '', isActive: true, sortOrder: '0',
  type: 'SUBSCRIPTION', discountPct: '', originalPrice: '',
};

const EMPTY_SITE: SiteSettings = { siteDiscountPct: 0, siteDiscountLabel: '', siteDiscountActive: false };

/* ── Helper: compute effective price ─────────────────── */
function effectivePrice(pkg: Package, site: SiteSettings) {
  const pkgDisc = pkg.discountPct ?? 0;
  const siteDisc = site.siteDiscountActive ? (site.siteDiscountPct ?? 0) : 0;
  const disc = Math.max(pkgDisc, siteDisc);
  const orig = pkg.originalPrice ?? pkg.price;
  if (disc <= 0) return { disc: 0, orig, final: pkg.price };
  const final = Math.round(orig * (1 - disc / 100) * 100) / 100;
  return { disc, orig, final };
}

/* ── Discount badge ──────────────────────────────────── */
function DiscBadge({ pct }: { pct: number }) {
  if (!pct) return null;
  return (
    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
      -{pct}%
    </span>
  );
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(EMPTY_SITE);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [savingSite, setSavingSite] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [siteForm, setSiteForm] = useState<SiteSettings>(EMPTY_SITE);

  const showToast = (text: string, ok: boolean) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const load = () => {
    setLoading(true);
    Promise.all([
      adminApi.getPackages().then(r => r.data ?? []).catch(() => []),
      adminApi.getSiteSettings().then(r => r.data ?? EMPTY_SITE).catch(() => EMPTY_SITE),
    ]).then(([pkgs, site]) => {
      setPackages(pkgs);
      setSiteSettings(site);
      setSiteForm(site);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  /* Package CRUD */
  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (pkg: Package) => {
    setEditing(pkg);
    setForm({
      name: pkg.name, description: pkg.description ?? '',
      price: String(pkg.price), currency: pkg.currency,
      durationDays: String(pkg.durationDays),
      featuresRaw: pkg.features.join('\n'),
      isActive: pkg.isActive, sortOrder: String(pkg.sortOrder),
      type: pkg.type || 'SUBSCRIPTION',
      discountPct: pkg.discountPct != null ? String(pkg.discountPct) : '',
      originalPrice: pkg.originalPrice != null ? String(pkg.originalPrice) : '',
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.price || !form.durationDays) {
      showToast('Name, price and duration are required.', false); return;
    }
    setSaving(true);
    const body = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: parseFloat(form.price),
      currency: form.currency,
      durationDays: parseInt(form.durationDays),
      features: form.featuresRaw.split('\n').map(f => f.trim()).filter(Boolean),
      isActive: form.isActive,
      sortOrder: parseInt(form.sortOrder) || 0,
      type: form.type,
      // Explicitly send null to clear these fields, not undefined (which JSON.stringify drops)
      discountPct: form.discountPct !== '' ? parseFloat(form.discountPct) : null,
      originalPrice: form.originalPrice !== '' ? parseFloat(form.originalPrice) : null,
    };
    try {
      if (editing) {
        await adminApi.updatePackage(editing.id, body);
        showToast('Package updated! ✓', true);
      } else {
        await adminApi.createPackage({
          ...body,
          discountPct: body.discountPct ?? undefined,
          originalPrice: body.originalPrice ?? undefined,
        });
        showToast('Package created! ✓', true);
      }
      setShowModal(false); load();
    } catch (e: any) { showToast(e.message ?? 'Save failed', false); }
    finally { setSaving(false); }
  };

  const deletePackage = async (id: string) => {
    if (!confirm('Delete this package? This cannot be undone.')) return;
    setDeleting(id);
    try { await adminApi.deletePackage(id); showToast('Package deleted.', true); load(); }
    catch (e: any) { showToast(e.message, false); }
    finally { setDeleting(null); }
  };

  const toggleActive = async (pkg: Package) => {
    try { await adminApi.updatePackage(pkg.id, { isActive: !pkg.isActive }); load(); }
    catch (e: any) { showToast(e.message, false); }
  };

  /* Site settings */
  const saveSiteSettings = async () => {
    setSavingSite(true);
    try {
      await adminApi.updateSiteSettings({
        siteDiscountPct: siteForm.siteDiscountPct,
        siteDiscountLabel: siteForm.siteDiscountLabel,
        siteDiscountActive: siteForm.siteDiscountActive,
      });
      setSiteSettings(siteForm);
      showToast('Site-wide discount saved!', true);
    } catch (e: any) { showToast(e.message, false); }
    finally { setSavingSite(false); }
  };

  const field = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="font-poppins space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[34px] xl:text-[37px] 2xl:text-[40px] font-poppins font-medium text-[#121514]">Packages & Discounts</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage subscription plans, per-package and site-wide discounts</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-[#1C3B35] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#15302a] transition shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Package
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`px-5 py-3.5 rounded-xl text-sm font-medium border ${toast.ok ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          {toast.text}
        </div>
      )}

      {/* ── Site-Wide Discount Panel ── */}
      <div className="bg-gradient-to-r from-[#1C3B35] to-[#2d5e53] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🏷️</span>
              <h2 className="font-bold text-lg">Site-Wide Discount</h2>
              {siteSettings.siteDiscountActive && siteSettings.siteDiscountPct > 0 && (
                <span className="bg-amber-400 text-[#1C3B35] text-[11px] font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                  ACTIVE • -{siteSettings.siteDiscountPct}%
                </span>
              )}
            </div>
            <p className="text-white/60 text-sm">Applied automatically on top of all packages. Highest discount wins.</p>
          </div>
          {/* Master toggle */}
          <button
            onClick={() => setSiteForm(f => ({ ...f, siteDiscountActive: !f.siteDiscountActive }))}
            className={`flex-shrink-0 w-12 h-6 rounded-full relative transition-colors focus:outline-none ${siteForm.siteDiscountActive ? 'bg-amber-400' : 'bg-white/20'}`}
            title={siteForm.siteDiscountActive ? 'Disable site discount' : 'Enable site discount'}>
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${siteForm.siteDiscountActive ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">Discount Percentage (%)</label>
            <input
              type="number" min="0" max="100" step="0.5"
              value={siteForm.siteDiscountPct}
              onChange={e => setSiteForm(f => ({ ...f, siteDiscountPct: parseFloat(e.target.value) || 0 }))}
              className="w-full bg-white/15 border border-white/20 rounded-xl px-3.5 py-2.5 text-white placeholder-white/40 text-sm focus:outline-none focus:border-amber-400 transition"
              placeholder="e.g. 20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">Discount Label</label>
            <input
              type="text"
              value={siteForm.siteDiscountLabel}
              onChange={e => setSiteForm(f => ({ ...f, siteDiscountLabel: e.target.value }))}
              className="w-full bg-white/15 border border-white/20 rounded-xl px-3.5 py-2.5 text-white placeholder-white/40 text-sm focus:outline-none focus:border-amber-400 transition"
              placeholder="e.g. Eid Special Offer"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={saveSiteSettings}
              disabled={savingSite}
              className="w-full bg-amber-400 hover:bg-amber-300 text-[#1C3B35] font-bold py-2.5 rounded-xl text-sm transition disabled:opacity-60 flex items-center justify-center gap-2">
              {savingSite && <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10" /></svg>}
              {savingSite ? 'Saving…' : '💾 Save Site Discount'}
            </button>
          </div>
        </div>

        {siteForm.siteDiscountActive && siteForm.siteDiscountPct > 0 && (
          <div className="mt-4 bg-white/10 rounded-xl px-4 py-3 flex items-center gap-2 text-sm">
            <span className="text-amber-300 font-bold">ℹ️</span>
            <span className="text-white/80">
              All packages show <strong className="text-amber-300">{siteForm.siteDiscountPct}% off</strong>
              {siteForm.siteDiscountLabel && <> — <em>"{siteForm.siteDiscountLabel}"</em></>} to all visitors
            </span>
          </div>
        )}
      </div>

      {/* ── Package Cards ── */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
      ) : packages.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 h-60 text-gray-400">
          <div className="h-16 w-16 rounded-2xl bg-[#EAF2EE] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#1C3B35]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <p className="font-medium text-gray-600 mb-1">No packages yet</p>
          <p className="text-xs">Click "Add Package" to create your first subscription plan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {packages.map((pkg) => {
            const { disc, orig, final } = effectivePrice(pkg, siteSettings);
            const hasDiscount = disc > 0;
            return (
              <div key={pkg.id}
                className={`bg-white rounded-2xl border overflow-hidden flex flex-col transition-all hover:shadow-md ${pkg.isActive ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
                {/* Card header */}
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-800 text-base leading-tight">{pkg.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide flex-shrink-0 ${pkg.type === 'BOOST' ? 'bg-amber-100 text-amber-700' : 'bg-[#1C3B35]/10 text-[#1C3B35]'}`}>
                          {pkg.type === 'BOOST' ? '⚡ BOOST' : '✓ SUB'}
                        </span>
                        {hasDiscount && <DiscBadge pct={disc} />}
                      </div>
                      {pkg.description && <p className="text-gray-400 text-xs mt-1 leading-relaxed">{pkg.description}</p>}
                    </div>
                    {/* Active toggle */}
                    <button onClick={() => toggleActive(pkg)}
                      className={`flex-shrink-0 mt-0.5 w-11 h-6 rounded-full relative transition-colors focus:outline-none ${pkg.isActive ? 'bg-[#1C3B35]' : 'bg-gray-200'}`}>
                      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${pkg.isActive ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="flex items-end gap-1.5 mb-1">
                    {hasDiscount ? (
                      <>
                        <span className="text-2xl font-bold text-red-600">{pkg.currency} {final.toLocaleString()}</span>
                        <span className="text-sm text-gray-400 line-through mb-0.5">{orig.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-[#1C3B35]">{pkg.currency} {pkg.price.toLocaleString()}</span>
                    )}
                  </div>

                  {/* Package discount info */}
                  {pkg.discountPct != null && pkg.discountPct > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium mb-1">
                      <span>📦 Package discount: -{pkg.discountPct}%</span>
                    </div>
                  )}
                  {siteSettings.siteDiscountActive && siteSettings.siteDiscountPct > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium mb-1">
                      <span>🏷️ Site discount: -{siteSettings.siteDiscountPct}%</span>
                      {siteSettings.siteDiscountLabel && <span className="text-gray-400">({siteSettings.siteDiscountLabel})</span>}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {pkg.durationDays} days access
                  </div>
                </div>

                {/* Features */}
                {pkg.features.length > 0 && (
                  <div className="px-6 pb-4 flex-1">
                    <div className="h-px bg-gray-100 mb-3" />
                    <ul className="space-y-1.5">
                      {pkg.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <svg className="w-3.5 h-3.5 text-[#1C3B35] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Footer */}
                <div className="px-6 pb-5">
                  <div className="h-px bg-gray-100 mb-3" />
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${pkg.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(pkg)}
                        className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#EAF2EE] hover:text-[#1C3B35] hover:border-[#1C3B35]/20 transition">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button onClick={() => deletePackage(pkg.id)} disabled={deleting === pkg.id}
                        className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition disabled:opacity-40">
                        {deleting === pkg.id ? <span className="text-xs">…</span> : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
              <div>
                <h2 className="font-bold text-gray-800 text-lg">{editing ? 'Edit Package' : 'New Package'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editing ? 'Update plan details and discounts' : 'Create a new subscription plan'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="h-8 w-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Package Name <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={field('name')} placeholder="e.g. Premium 6 Months"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C3B35] focus:ring-2 focus:ring-[#1C3B35]/10 transition" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={field('description')} rows={2}
                  placeholder="Short description…"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C3B35] focus:ring-2 focus:ring-[#1C3B35]/10 transition resize-none" />
              </div>

              {/* Price + Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Price <span className="text-red-500">*</span></label>
                  <input value={form.price} onChange={field('price')} type="number" min="0" step="0.01" placeholder="9999"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C3B35] focus:ring-2 focus:ring-[#1C3B35]/10 transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Currency</label>
                  <select value={form.currency} onChange={field('currency')}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C3B35] focus:ring-2 focus:ring-[#1C3B35]/10 transition bg-white">
                    <option>LKR</option><option>USD</option><option>GBP</option><option>AUD</option><option>CAD</option>
                  </select>
                </div>
              </div>

              {/* ── Per-Package Discount ── */}
              <div className="p-4 bg-red-50 rounded-xl border border-red-100 space-y-3">
                <p className="text-xs font-bold text-red-700 flex items-center gap-1.5">📦 Package-Specific Discount <span className="font-normal text-red-400">(optional)</span></p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Discount % <span className="text-gray-400">(0–100)</span></label>
                    <input value={form.discountPct} onChange={field('discountPct')} type="number" min="0" max="100" step="0.5" placeholder="e.g. 25"
                      className="w-full border border-red-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Original Price (strikethrough)</label>
                    <input value={form.originalPrice} onChange={field('originalPrice')} type="number" min="0" step="0.01" placeholder="Auto if blank"
                      className="w-full border border-red-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition bg-white" />
                  </div>
                </div>
                {form.discountPct && parseFloat(form.discountPct) > 0 && form.price && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">Preview:</span>
                    <span className="text-gray-400 line-through">{form.currency} {form.originalPrice || (parseFloat(form.price) / (1 - parseFloat(form.discountPct) / 100)).toFixed(2)}</span>
                    <span className="text-red-600 font-bold">{form.currency} {parseFloat(form.price).toFixed(2)}</span>
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">-{form.discountPct}%</span>
                  </div>
                )}
              </div>

              {/* Type + Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Package Type</label>
                  <select value={form.type} onChange={field('type')}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C3B35] focus:ring-2 focus:ring-[#1C3B35]/10 transition bg-white">
                    <option value="SUBSCRIPTION">Subscription</option>
                    <option value="BOOST">Profile Boost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Duration (days) <span className="text-red-500">*</span></label>
                  <input value={form.durationDays} onChange={field('durationDays')} type="number" min="1" placeholder="30"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C3B35] focus:ring-2 focus:ring-[#1C3B35]/10 transition" />
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Sort Order</label>
                <input value={form.sortOrder} onChange={field('sortOrder')} type="number" min="0" placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C3B35] focus:ring-2 focus:ring-[#1C3B35]/10 transition" />
              </div>

              {/* Features */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Features <span className="text-gray-400 font-normal">(one per line)</span></label>
                <textarea value={form.featuresRaw} onChange={field('featuresRaw')} rows={5}
                  placeholder={"Unlimited profile views\nContact details access\nPriority support"}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C3B35] focus:ring-2 focus:ring-[#1C3B35]/10 transition resize-none font-mono" />
              </div>

              {/* Active */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Active</p>
                  <p className="text-xs text-gray-400 mt-0.5">Visible to members when enabled</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none ${form.isActive ? 'bg-[#1C3B35]' : 'bg-gray-300'}`}>
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${form.isActive ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white rounded-b-2xl">
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#1C3B35] text-white hover:bg-[#15302a] transition disabled:opacity-50 flex items-center gap-2">
                {saving && <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10" /></svg>}
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
