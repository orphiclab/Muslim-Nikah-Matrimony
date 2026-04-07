'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/services/api';
import { useCurrency } from '@/hooks/useCurrency';

/* ── Types ──────────────────────────────────────────────────────── */
type Package = {
  id: string; name: string; description?: string; price: number;
  currency: string; durationDays: number; features: string[];
  isActive: boolean; sortOrder: number; type: string;
  discountPct?: number | null; originalPrice?: number | null;
  isPopular?: boolean; createdAt: string;
  usdPrice?: number | null; usdOriginalPrice?: number | null;
};

type SiteSettings = { siteDiscountPct: number; siteDiscountLabel: string; siteDiscountActive: boolean };

const EMPTY_FORM = {
  name: '', description: '', price: '', currency: 'LKR',
  durationDays: '30', featuresRaw: '', isActive: true, sortOrder: '0',
  type: 'SUBSCRIPTION', discountPct: '', originalPrice: '', isPopular: false,
  // Dual-currency pricing
  lkrRegular: '', lkrSale: '',
  usdRegular: '', usdSale: '',
};
const EMPTY_SITE: SiteSettings = { siteDiscountPct: 0, siteDiscountLabel: '', siteDiscountActive: false };

type PageTab = 'subscriptions' | 'boosts';

/* ── Helpers ────────────────────────────────────────────────────── */
function effectivePrice(pkg: Package, site: SiteSettings) {
  const pkgDisc = pkg.discountPct ?? 0;
  const siteDisc = site.siteDiscountActive ? (site.siteDiscountPct ?? 0) : 0;
  const disc = Math.max(pkgDisc, siteDisc);
  const orig = pkg.originalPrice ?? pkg.price;
  if (disc <= 0) return { disc: 0, orig, final: pkg.price };
  const final = Math.round(orig * (1 - disc / 100) * 100) / 100;
  return { disc, orig, final };
}

/* ── Toggle component ───────────────────────────────────────────── */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)}
      className={`flex-shrink-0 w-11 h-6 rounded-full relative transition-colors focus:outline-none ${on ? 'bg-[#1C3B35]' : 'bg-gray-200'}`}>
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${on ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

/* ── Modal form field ───────────────────────────────────────────── */
function MField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
const inp = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1C3B35] focus:ring-2 focus:ring-[#1C3B35]/10 transition bg-white';

/* ── Package Card ───────────────────────────────────────────────── */
function PackageCard({ pkg, siteSettings, isBoost, onEdit, onDelete, onToggle, deleting }: {
  pkg: Package; siteSettings: SiteSettings; isBoost: boolean;
  onEdit: () => void; onDelete: () => void; onToggle: () => void; deleting: boolean;
}) {
  const { fmt } = useCurrency();
  const { disc, orig, final } = effectivePrice(pkg, siteSettings);
  const hasDisc = disc > 0;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden flex flex-col transition-all hover:shadow-md ${pkg.isActive ? (isBoost ? 'border-amber-100' : 'border-gray-100') : 'border-gray-100 opacity-55'}`}>
      {/* Popular ribbon */}
      {pkg.isPopular && (
        <div className={`text-center text-[10px] font-bold py-1 tracking-wider ${isBoost ? 'bg-amber-400 text-[#1C3B35]' : 'bg-[#1C3B35] text-white'}`}>
          ⭐ MOST POPULAR
        </div>
      )}

      <div className="px-5 pt-5 pb-4 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-800 text-base leading-tight">{pkg.name}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide flex-shrink-0 ${isBoost ? 'bg-amber-100 text-amber-700' : 'bg-[#1C3B35]/10 text-[#1C3B35]'}`}>
                {isBoost ? '⚡ BOOST' : '✓ SUB'}
              </span>
              {hasDisc && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{disc}%</span>}
            </div>
            {pkg.description && <p className="text-gray-400 text-xs mt-1 leading-relaxed">{pkg.description}</p>}
          </div>
          <Toggle on={pkg.isActive} onChange={onToggle} />
        </div>

        {/* LKR Price */}
        <div className="flex items-end gap-1.5 mb-1">
          {hasDisc ? (
            <>
              <span className="text-2xl font-bold text-red-600">{fmt(final)}</span>
              <span className="text-sm text-gray-400 line-through mb-0.5">{fmt(orig)}</span>
            </>
          ) : (
            <span className={`text-2xl font-bold ${isBoost ? 'text-amber-600' : 'text-[#1C3B35]'}`}>{fmt(pkg.price)}</span>
          )}
        </div>

        {/* USD Price */}
        {pkg.usdPrice != null && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">USD</span>
            {pkg.usdOriginalPrice != null && pkg.usdOriginalPrice > pkg.usdPrice ? (
              <>
                <span className="text-sm font-semibold text-gray-700">${pkg.usdPrice.toFixed(2)}</span>
                <span className="text-xs text-gray-400 line-through">${pkg.usdOriginalPrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-sm font-semibold text-gray-700">${pkg.usdPrice.toFixed(2)}</span>
            )}
          </div>
        )}

        {/* Duration */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {pkg.durationDays} days {isBoost ? 'boost' : 'access'}
        </div>

        {/* Features */}
        {pkg.features.length > 0 && (
          <ul className="space-y-1.5">
            {pkg.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <svg className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isBoost ? 'text-amber-500' : 'text-[#1C3B35]'}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-5">
        <div className="h-px bg-gray-100 mb-3" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${pkg.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {pkg.isActive ? 'Active' : 'Inactive'}
            </span>
            {pkg.isPopular && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${isBoost ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                Popular
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit}
              className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#EAF2EE] hover:text-[#1C3B35] hover:border-[#1C3B35]/20 transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button onClick={onDelete} disabled={deleting}
              className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition disabled:opacity-40">
              {deleting ? <span className="text-xs">…</span> : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────── */
function Empty({ isBoost, onAdd }: { isBoost: boolean; onAdd: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-200 h-56 gap-3">
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-2xl ${isBoost ? 'bg-amber-50' : 'bg-[#EAF2EE]'}`}>
        {isBoost ? '⚡' : '📦'}
      </div>
      <div className="text-center">
        <p className="font-semibold text-gray-600 text-sm">No {isBoost ? 'boost' : 'subscription'} packages yet</p>
        <p className="text-xs text-gray-400 mt-0.5">Create your first {isBoost ? 'boost' : 'subscription'} plan</p>
      </div>
      <button onClick={onAdd}
        className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${isBoost ? 'bg-amber-400 text-[#1C3B35] hover:bg-amber-300' : 'bg-[#1C3B35] text-white hover:bg-[#15302a]'}`}>
        + Add Package
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(EMPTY_SITE);
  const [loading, setLoading] = useState(true);
  const [pageTab, setPageTab] = useState<PageTab>('subscriptions');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [savingSite, setSavingSite] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [siteForm, setSiteForm] = useState<SiteSettings>(EMPTY_SITE);
  const { fmt } = useCurrency();

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

  const subPackages = packages.filter(p => p.type !== 'BOOST');
  const boostPackages = packages.filter(p => p.type === 'BOOST');

  /* ── CRUD ─────────────────────────────────────────────────────── */
  const openCreate = (type: 'SUBSCRIPTION' | 'BOOST') => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, type, durationDays: type === 'BOOST' ? '7' : '30' });
    setShowModal(true);
  };

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
      isPopular: pkg.isPopular ?? false,
      // Dual-currency: prefill from stored fields
      lkrRegular: pkg.originalPrice != null ? String(pkg.originalPrice) : '',
      lkrSale: String(pkg.price),
      usdRegular: pkg.usdOriginalPrice != null ? String(pkg.usdOriginalPrice) : '',
      usdSale: pkg.usdPrice != null ? String(pkg.usdPrice) : '',
    });
    setShowModal(true);
  };

  const save = async () => {
    // Use lkrRegular as the primary required price (lkrSale is optional sale price)
    const primaryPrice = form.lkrSale || form.lkrRegular || form.price;
    if (!form.name.trim() || !primaryPrice || !form.durationDays) {
      showToast('Name, LKR price and duration are required.', false); return;
    }
    setSaving(true);

    // Derive price & originalPrice from new dual-currency fields
    const lkrSaleVal  = form.lkrSale    !== '' ? parseFloat(form.lkrSale)    : null;
    const lkrRegVal   = form.lkrRegular  !== '' ? parseFloat(form.lkrRegular)  : null;
    // Main price = sale price if set, else regular price
    const finalPrice  = lkrSaleVal ?? lkrRegVal ?? parseFloat(form.price);
    // Strikethrough = regular price when sale is set, else null
    const finalOrig   = lkrSaleVal && lkrRegVal ? lkrRegVal : (form.originalPrice !== '' ? parseFloat(form.originalPrice) : null);
    // Auto-compute discount %
    const autoDisc    = finalOrig && finalOrig > finalPrice
      ? Math.round((1 - finalPrice / finalOrig) * 100 * 10) / 10
      : (form.discountPct !== '' ? parseFloat(form.discountPct) : null);

    const usdSaleVal = form.usdSale !== '' ? parseFloat(form.usdSale) : null;
    const usdRegVal  = form.usdRegular !== '' ? parseFloat(form.usdRegular) : null;

    const body = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: finalPrice,
      currency: 'LKR',
      durationDays: parseInt(form.durationDays),
      features: form.featuresRaw.split('\n').map(f => f.trim()).filter(Boolean),
      isActive: form.isActive,
      sortOrder: parseInt(form.sortOrder) || 0,
      type: form.type,
      isPopular: form.isPopular,
      discountPct: autoDisc,
      originalPrice: finalOrig,
      usdPrice: usdSaleVal ?? usdRegVal ?? null,
      usdOriginalPrice: usdSaleVal && usdRegVal ? usdRegVal : null,
    };
    try {
      if (editing) {
        await adminApi.updatePackage(editing.id, body);
        showToast('Package updated! ✓', true);
      } else {
        await adminApi.createPackage({ ...body, discountPct: body.discountPct ?? undefined, originalPrice: body.originalPrice ?? undefined });
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

  const saveSiteSettings = async () => {
    setSavingSite(true);
    try {
      await adminApi.updateSiteSettings(siteForm);
      setSiteSettings(siteForm);
      showToast('Site-wide discount saved!', true);
    } catch (e: any) { showToast(e.message, false); }
    finally { setSavingSite(false); }
  };

  const f = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(x => ({ ...x, [key]: e.target.value }));

  const isBoostTab = pageTab === 'boosts';
  const displayPkgs = isBoostTab ? boostPackages : subPackages;

  return (
    <div className="font-poppins space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[200] px-5 py-3.5 rounded-xl text-sm font-semibold shadow-xl flex items-center gap-2 ${toast.ok ? 'bg-[#1C3B35] text-white' : 'bg-red-500 text-white'}`}>
          <span>{toast.ok ? '✓' : '✕'}</span>
          {toast.text}
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[34px] xl:text-[37px] 2xl:text-[40px] font-poppins font-medium text-[#121514]">
            Packages & Discounts
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage subscription plans, boost packages, and site-wide discounts</p>
        </div>
        <button
          onClick={() => openCreate(isBoostTab ? 'BOOST' : 'SUBSCRIPTION')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm ${isBoostTab ? 'bg-amber-400 text-[#1C3B35] hover:bg-amber-300' : 'bg-[#1C3B35] text-white hover:bg-[#15302a]'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add {isBoostTab ? 'Boost' : 'Subscription'}
        </button>
      </div>

      {/* ── Site-wide Discount ───────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#1C3B35] to-[#2d5e53] rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🏷️</span>
              <h2 className="font-bold">Site-Wide Discount</h2>
              {siteSettings.siteDiscountActive && siteSettings.siteDiscountPct > 0 && (
                <span className="bg-amber-400 text-[#1C3B35] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ACTIVE -{siteSettings.siteDiscountPct}%
                </span>
              )}
            </div>
            <p className="text-white/60 text-xs mt-0.5">Applied automatically on top of all packages.</p>
          </div>
          <button
            onClick={() => setSiteForm(f => ({ ...f, siteDiscountActive: !f.siteDiscountActive }))}
            className={`flex-shrink-0 w-12 h-6 rounded-full relative transition-colors ${siteForm.siteDiscountActive ? 'bg-amber-400' : 'bg-white/20'}`}>
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${siteForm.siteDiscountActive ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">Discount %</label>
            <input type="number" min="0" max="100" step="0.5"
              value={siteForm.siteDiscountPct}
              onChange={e => setSiteForm(f => ({ ...f, siteDiscountPct: parseFloat(e.target.value) || 0 }))}
              className="w-full bg-white/15 border border-white/20 rounded-xl px-3.5 py-2.5 text-white placeholder-white/40 text-sm focus:outline-none focus:border-amber-400 transition"
              placeholder="e.g. 20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">Label</label>
            <input type="text"
              value={siteForm.siteDiscountLabel}
              onChange={e => setSiteForm(f => ({ ...f, siteDiscountLabel: e.target.value }))}
              className="w-full bg-white/15 border border-white/20 rounded-xl px-3.5 py-2.5 text-white placeholder-white/40 text-sm focus:outline-none focus:border-amber-400 transition"
              placeholder="e.g. Eid Special" />
          </div>
          <div className="flex items-end">
            <button onClick={saveSiteSettings} disabled={savingSite}
              className="w-full bg-amber-400 hover:bg-amber-300 text-[#1C3B35] font-bold py-2.5 rounded-xl text-sm transition disabled:opacity-60 flex items-center justify-center gap-2">
              {savingSite && <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/></svg>}
              {savingSite ? 'Saving…' : '💾 Save Discount'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab switcher ─────────────────────────────────────────── */}
      <div className="flex gap-2 bg-white rounded-2xl border border-gray-100 p-1.5">
        {([
          { key: 'subscriptions' as PageTab, label: 'Subscription Plans', icon: '✓', count: subPackages.length, accent: '#1C3B35', activeBg: 'bg-[#1C3B35]' },
          { key: 'boosts' as PageTab, label: 'Boost Packages', icon: '⚡', count: boostPackages.length, accent: '#DB9D30', activeBg: 'bg-amber-400' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setPageTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${pageTab === t.key ? `${t.activeBg} ${t.key === 'boosts' ? 'text-[#1C3B35]' : 'text-white'} shadow-sm` : 'text-gray-500 hover:bg-gray-50'}`}>
            <span>{t.icon}</span>
            {t.label}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${pageTab === t.key ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Package Grid ─────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center h-48 gap-2 text-gray-400 text-sm">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
          Loading…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {displayPkgs.length === 0
            ? <Empty isBoost={isBoostTab} onAdd={() => openCreate(isBoostTab ? 'BOOST' : 'SUBSCRIPTION')} />
            : displayPkgs.map(pkg => (
              <PackageCard
                key={pkg.id} pkg={pkg} siteSettings={siteSettings} isBoost={isBoostTab}
                onEdit={() => openEdit(pkg)}
                onDelete={() => deletePackage(pkg.id)}
                onToggle={() => toggleActive(pkg)}
                deleting={deleting === pkg.id}
              />
            ))
          }
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-lg ${form.type === 'BOOST' ? 'bg-amber-100' : 'bg-[#EAF2EE]'}`}>
                  {form.type === 'BOOST' ? '⚡' : '📦'}
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">{editing ? 'Edit' : 'New'} {form.type === 'BOOST' ? 'Boost' : 'Subscription'} Package</h2>
                  <p className="text-xs text-gray-400">{editing ? 'Update package details' : 'Create a new plan'}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)}
                className="h-8 w-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Name */}
              <MField label="Package Name" required>
                <input value={form.name} onChange={f('name')} placeholder={form.type === 'BOOST' ? 'e.g. 7-Day Boost' : 'e.g. Gold Plan'} className={inp} />
              </MField>

              {/* Description */}
              <MField label="Description">
                <textarea value={form.description} onChange={f('description')} rows={2}
                  placeholder="Short description…" className={`${inp} resize-none`} />
              </MField>

              {/* ── LKR Pricing Block ─────────────────────── */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">🇱🇰 LKR — Sri Lankan Rupee</span>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4">
                  <MField label="Regular Price" required>
                    <input value={form.lkrRegular} onChange={f('lkrRegular')} type="number" min="0" step="0.01" placeholder="e.g. 1,000" className={inp} />
                  </MField>
                  <MField label="Sale Price">
                    <input value={form.lkrSale} onChange={f('lkrSale')} type="number" min="0" step="0.01" placeholder="e.g. 950" className={inp} />
                  </MField>
                </div>
                {form.lkrRegular && form.lkrSale && parseFloat(form.lkrRegular) > 0 && parseFloat(form.lkrSale) > 0 && (
                  <div className="px-4 pb-3 flex items-center gap-2 text-xs">
                    <span className="text-gray-400">Preview:</span>
                    <span className="text-gray-400 line-through">Rs. {parseFloat(form.lkrRegular).toFixed(2)}</span>
                    <span className="font-bold text-red-600">Rs. {parseFloat(form.lkrSale).toFixed(2)}</span>
                    {parseFloat(form.lkrRegular) > parseFloat(form.lkrSale) && (
                      <span className="bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                        -{Math.round((1 - parseFloat(form.lkrSale) / parseFloat(form.lkrRegular)) * 100)}%
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* ── USD Pricing Block ─────────────────────── */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">🇺🇸 USD — US Dollar</span>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4">
                  <MField label="Regular Price">
                    <input value={form.usdRegular} onChange={f('usdRegular')} type="number" min="0" step="0.01" placeholder="e.g. 10.00" className={inp} />
                  </MField>
                  <MField label="Sale Price">
                    <input value={form.usdSale} onChange={f('usdSale')} type="number" min="0" step="0.01" placeholder="e.g. 8.99" className={inp} />
                  </MField>
                </div>
                {form.usdRegular && form.usdSale && parseFloat(form.usdRegular) > 0 && parseFloat(form.usdSale) > 0 && (
                  <div className="px-4 pb-3 flex items-center gap-2 text-xs">
                    <span className="text-gray-400">Preview:</span>
                    <span className="text-gray-400 line-through">${parseFloat(form.usdRegular).toFixed(2)}</span>
                    <span className="font-bold text-red-600">${parseFloat(form.usdSale).toFixed(2)}</span>
                    {parseFloat(form.usdRegular) > parseFloat(form.usdSale) && (
                      <span className="bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                        -{Math.round((1 - parseFloat(form.usdSale) / parseFloat(form.usdRegular)) * 100)}%
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Duration (full width, no Package Type) */}
              <MField label="Duration (days)" required>
                <input value={form.durationDays} onChange={f('durationDays')} type="number" min="1" placeholder="7" className={inp} />
              </MField>

              {/* Features — subscription only */}
              {form.type !== 'BOOST' && (
                <MField label="Features (one per line)">
                  <textarea value={form.featuresRaw} onChange={f('featuresRaw')} rows={4}
                    placeholder={'Unlimited profile views\nContact access\nPriority support'}
                    className={`${inp} resize-none font-mono text-xs`} />
                </MField>
              )}

              {/* Sort */}
              <MField label="Sort Order">
                <input value={form.sortOrder} onChange={f('sortOrder')} type="number" min="0" placeholder="0" className={inp} />
              </MField>

              {/* Toggles */}
              <div className="space-y-3">
                {/* Active */}
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Active</p>
                    <p className="text-xs text-gray-400 mt-0.5">Visible to members when enabled</p>
                  </div>
                  <Toggle on={form.isActive} onChange={v => setForm(x => ({ ...x, isActive: v }))} />
                </div>
                {/* Popular */}
                <div className={`flex items-center justify-between p-3.5 rounded-xl border ${form.type === 'BOOST' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">⭐ Mark as Popular</p>
                    <p className="text-xs text-gray-400 mt-0.5">Highlights this package with a "Most Popular" ribbon</p>
                  </div>
                  <Toggle on={form.isPopular} onChange={v => setForm(x => ({ ...x, isPopular: v }))} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white rounded-b-2xl">
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2 ${form.type === 'BOOST' ? 'bg-amber-400 text-[#1C3B35] hover:bg-amber-300' : 'bg-[#1C3B35] text-white hover:bg-[#15302a]'}`}>
                {saving && <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/></svg>}
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
