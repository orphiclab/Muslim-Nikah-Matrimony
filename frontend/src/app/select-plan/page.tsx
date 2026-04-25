'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { packagesApi, paymentApi, profileApi, settingsApi } from '@/services/api';
import { useCurrency } from '@/hooks/useCurrency';
import Link from 'next/link';

type Package = {
  id: string; name: string; description?: string; price: number;
  currency: string; durationDays: number; features: string[];
  isActive: boolean; sortOrder: number;
  discountPct?: number | null;
  originalPrice?: number | null;
  effectiveDiscountPct?: number;
  usdPrice?: number | null;
  usdOriginalPrice?: number | null;
};

type SiteDiscount = { active: boolean; pct: number; label: string };

const FALLBACK: Package[] = [
  {
    id: '3months', name: '3 Months Membership', price: 7499, currency: 'LKR', durationDays: 90,
    features: ['Unlimited Profiles', 'Connect With Any User on muslimnikah.lk', 'View Mobile Number', 'View WhatsApp Number', 'Chat with Members'],
    isActive: true, sortOrder: 0,
  },
  {
    id: '6months', name: '6 Months Membership', price: 10004, currency: 'LKR', durationDays: 180,
    features: ['Unlimited Profiles', 'Connect With Any User on muslimnikah.lk', 'View Mobile Number', 'View WhatsApp Number', 'Chat with Members'],
    isActive: true, sortOrder: 1,
  },
  {
    id: '9months', name: '9 Months Membership', price: 14999, currency: 'LKR', durationDays: 270,
    features: ['Unlimited Profiles', 'Connect With Any User on muslimnikah.lk', 'View Mobile Number', 'View WhatsApp Number', 'Chat with Members'],
    isActive: true, sortOrder: 2,
  },
];

function getEffective(pkg: Package | null, site: SiteDiscount, currency: 'LKR' | 'USD' = 'LKR') {
  if (!pkg) return { disc: 0, orig: 0, final: 0 };

  // If USD selected and usdPrice available, use USD prices directly (no site discount stacking)
  if (currency === 'USD' && pkg.usdPrice != null) {
    const usdOrig = pkg.usdOriginalPrice ?? pkg.usdPrice;
    const hasDisc = usdOrig > pkg.usdPrice;
    return {
      disc: hasDisc ? Math.round((1 - pkg.usdPrice / usdOrig) * 100) : 0,
      orig: usdOrig,
      final: pkg.usdPrice,
    };
  }

  // LKR path (existing logic)
  const disc = (pkg as any).effectiveDiscountPct ?? pkg.discountPct ?? 0;
  const siteDisc = site.active ? site.pct : 0;
  const effectiveDisc = disc > 0 ? disc : siteDisc;
  const orig = pkg.originalPrice ?? pkg.price;
  if (effectiveDisc <= 0) return { disc: 0, orig: pkg.price, final: pkg.price };
  if ((pkg as any).effectiveDiscountPct != null) {
    return { disc: effectiveDisc, orig, final: pkg.price };
  }
  const final = Math.round(orig * (1 - effectiveDisc / 100) * 100) / 100;
  return { disc: effectiveDisc, orig, final };
}


/* ── Quick Profile Modal ─────────────────────────────────────── */
function ProfileModal({
  onCreated, onClose,
}: { onCreated: (id: string) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('MALE');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!name.trim()) { setErr('Please enter a name.'); return; }
    if (!dateOfBirth) { setErr('Please select a date of birth.'); return; }
    setSaving(true); setErr('');
    try {
      const res = await profileApi.create({ name: name.trim(), gender, dateOfBirth });
      const id = res.data?.id;
      if (!id) throw new Error('Profile creation failed');
      onCreated(id);
    } catch (e: any) {
      setErr(e.message ?? 'Failed to create profile');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-800">Create Your Profile</h2>
            <p className="text-xs text-gray-400 mt-0.5">Enter the details of the person seeking marriage</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Ahmed Hassan"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 outline-none focus:border-[#1C3B35] transition bg-gray-50 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Gender <span className="text-red-400">*</span>
              </label>
              <select
                value={gender} onChange={e => setGender(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 outline-none focus:border-[#1C3B35] transition bg-gray-50"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Date of Birth <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={e => setDateOfBirth(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 outline-none focus:border-[#1C3B35] transition bg-gray-50"
              />
            </div>
          </div>

          {err && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{err}</p>
          )}

          <p className="text-xs text-gray-400">
            You can add more details (education, location, preferences) after your account is activated.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !name.trim() || !dateOfBirth}
            className="flex-1 bg-[#1C3B35] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#15302a] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : '✓'} {saving ? 'Creating...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SelectPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProfileId = searchParams.get('profileId') ?? '';
  const fromCreateProfile = !!preselectedProfileId;
  const { symbol, fmt } = useCurrency();

  const [plans, setPlans] = useState<Package[]>([]);
  const [selected, setSelected] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bankRef, setBankRef] = useState('');
  const [message, setMessage] = useState('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [siteDiscount, setSiteDiscount] = useState<SiteDiscount>({ active: false, pct: 0, label: '' });
  const [currency, setCurrency] = useState<'LKR' | 'USD'>('LKR');
  const [whatsappContact, setWhatsappContact] = useState('+94 705 687 697');
  const [bank1, setBank1] = useState({ accName: 'M T M Akram', accNo: '112054094468', bankName: 'Sampath Bank PLC', branch: 'Ratmalana' });
  const [bank2, setBank2] = useState({ accName: 'M T M Akram', accNo: '89870069', bankName: 'BOC', branch: 'Anuradhapura' });

  const reloadProfiles = (showLoadingSpinner = false) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mn_token') : null;
    if (token) {
      if (showLoadingSpinner) setProfilesLoading(true);
      profileApi.getMyProfiles()
        .then((r) => setProfiles(r.data ?? []))
        .catch(() => { })
        .finally(() => setProfilesLoading(false));
    } else {
      setProfilesLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mn_token') : null;
    setIsLoggedIn(!!token);

    packagesApi.getActive('SUBSCRIPTION')
      .then((r: any) => {
        const data: Package[] = r.data ?? [];
        const list = data.length > 0 ? data : FALLBACK;
        setPlans(list);
        setSelected(list[0]);
        if (r.siteDiscount) setSiteDiscount(r.siteDiscount);
      })
      .catch(() => {
        setPlans(FALLBACK);
        setSelected(FALLBACK[0]);
      })
      .finally(() => setLoading(false));

    // Load site settings for bank/whatsapp details
    settingsApi.get()
      .then((r: any) => {
        const d = r.data ?? {};
        if (d.whatsappContact) setWhatsappContact(d.whatsappContact);
        if (d.bank1AccName) setBank1({ accName: d.bank1AccName, accNo: d.bank1AccNo ?? '', bankName: d.bank1BankName ?? '', branch: d.bank1Branch ?? '' });
        if (d.bank2AccName) setBank2({ accName: d.bank2AccName, accNo: d.bank2AccNo ?? '', bankName: d.bank2BankName ?? '', branch: d.bank2Branch ?? '' });
      })
      .catch(() => { /* use defaults */ });

    // Always load real profiles from API (even if profileId is in URL)
    reloadProfiles(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onProfileCreated = async (profileId: string) => {
    setShowProfileModal(false);
    // Reload full profile list so we have the actual name
    reloadProfiles();

    // If user was trying to do bank transfer, proceed now
    if (pendingAction === 'bank') {
      setPendingAction(null);
      await doSubmitPayment(profileId);
    }
  };

  const doSubmitPayment = async (profileId: string) => {
    if (!bankRef.trim()) { setMessage('Please enter your bank reference number.'); return; }
    if (!selected) { setMessage('Please select a package.'); return; }

    setSubmitting(true);
    const { final } = getEffective(selected, siteDiscount, currency);
    try {
      await paymentApi.initiate({
        childProfileId: profileId,
        amount: final,
        method: 'BANK_TRANSFER',
        bankRef,
        currency,
        packageId: (selected as any).id,
        packageDurationDays: selected.durationDays,
      });
      // ✅ Redirect to parent dashboard after successful submission
      router.push('/dashboard/parent');
    } catch (e: any) {
      const errMsg = e.message ?? 'Payment submission failed.';
      // Surface backend one-plan-per-profile error clearly
      setMessage(errMsg);
      setSubmitting(false);
    }
  };

  const handleBankTransfer = async () => {
    if (!bankRef.trim()) { setMessage('Please enter your bank reference / slip number.'); return; }
    if (!selected) { setMessage('Please select a package.'); return; }

    // Use preselected profile ID if came from create-profile, else use first profile
    const profileId = preselectedProfileId || profiles[0]?.id;
    if (!profileId) {
      setPendingAction('bank');
      setShowProfileModal(true);
      return;
    }

    await doSubmitPayment(profileId);
  };

  // Currency-aware format helpers
  const currSymbol = currency === 'USD' ? '$' : 'Rs.';
  const fmtAmt = (n: number) => `${currSymbol} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const { disc: selDisc, orig: selOrig, final: selFinal } = getEffective(selected, siteDiscount, currency);

  // Check if any plan has a USD price set
  const hasUsdPrices = plans.some(p => p.usdPrice != null);

  return (
    <div className="min-h-screen bg-gray-50 font-poppins pt-24">

      {/* Profile creation modal */}
      {showProfileModal && (
        <ProfileModal
          onCreated={onProfileCreated}
          onClose={() => { setShowProfileModal(false); setPendingAction(null); }}
        />
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-[#1B6B4A] transition">🏠 Home</Link>
          <span>/</span>
          <span className="text-[#1B6B4A] font-medium">📦 Select Package</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Profile created success banner (from create-profile flow) */}
        {fromCreateProfile && (
          <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
            <span className="text-green-500 text-xl mt-0.5">✅</span>
            <div>
              <p className="font-bold text-green-800 text-sm">Profile created successfully!</p>
              <p className="text-green-700 text-xs mt-0.5">Now select a membership plan and pay via bank transfer to activate your profile.</p>
            </div>
          </div>
        )}

        {/* Welcome banner */}
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-[#1B6B4A] to-[#2d9966] text-white">
          <h1 className="text-xl font-bold">{fromCreateProfile ? '🎉 Almost there! Activate your profile' : '🎉 Welcome to Muslim Nikah!'}</h1>
          <p className="text-white/80 text-sm mt-1">
            {fromCreateProfile
              ? 'Select a membership plan below, transfer payment to our bank account, enter the slip number and submit.'
              : 'Your account is ready. Select a membership plan to get started and find your perfect match.'}
          </p>
        </div>

        {/* Currency toggle */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-sm font-medium text-gray-600">Currency</span>
          <div className="inline-flex rounded-full border border-gray-300 overflow-hidden bg-white shadow-sm">
            {(['LKR', 'USD'] as const).map(cur => (
              <button
                key={cur}
                onClick={() => setCurrency(cur)}
                disabled={cur === 'USD' && !hasUsdPrices}
                title={cur === 'USD' && !hasUsdPrices ? 'USD pricing not available for these packages' : undefined}
                className={`px-5 py-2 text-sm font-semibold transition-all ${
                  currency === cur
                    ? 'bg-[#1B6B4A] text-white'
                    : 'text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {cur === 'LKR' ? '🇱🇰 LKR' : '🇺🇸 USD'}
              </button>
            ))}
          </div>
          {currency === 'USD' && !hasUsdPrices && (
            <span className="text-xs text-amber-600 font-medium">USD pricing not set for these packages</span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT: Package cards + features */}
          <div className="lg:col-span-2 space-y-6">

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Site discount banner */}
                {siteDiscount.active && siteDiscount.pct > 0 && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    <span className="text-base">🏷️</span>
                    <p className="text-sm font-bold text-red-700">
                      {siteDiscount.pct}% OFF{siteDiscount.label ? ` — ${siteDiscount.label}` : ''}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {plans.map((plan) => {
                    const { disc, orig, final } = getEffective(plan, siteDiscount, currency);
                    const hasDiscount = disc > 0;
                    const isSelected = selected?.id === plan.id;
                    // Show N/A if USD selected but no USD price set
                    const noUsd = currency === 'USD' && plan.usdPrice == null;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => !noUsd && setSelected(plan)}
                        className={`cursor-pointer rounded-xl border-2 p-5 text-center transition-all duration-200 ${
                          noUsd ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' :
                          isSelected
                            ? 'border-[#1B6B4A] bg-[#e8f5f0] shadow-lg scale-[1.02]'
                            : 'border-gray-300 bg-white hover:border-[#1B6B4A]/50 hover:shadow'
                        }`}
                      >
                        <p className="font-semibold text-gray-800 text-sm mb-2">{plan.name}</p>
                        {noUsd ? (
                          <p className="text-gray-400 text-sm font-medium">N/A in USD</p>
                        ) : hasDiscount ? (
                          <>
                            <p className="text-red-600 font-bold text-lg">
                              {fmtAmt(final)}
                            </p>
                            <p className="text-gray-400 text-xs line-through">
                              {fmtAmt(orig)}
                            </p>
                            <p className="text-red-500 text-xs font-bold">SAVE {disc}%</p>
                          </>
                        ) : (
                          <p className="text-[#1B6B4A] font-bold text-lg">
                            {fmtAmt(final)}
                          </p>
                        )}
                        <p className={`text-xs font-semibold mt-3 ${isSelected ? 'text-[#1B6B4A]' : 'text-[#DB9D30]'}`}>
                          {noUsd ? '' : isSelected ? '✓ Selected' : 'Select Package'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Features Banner */}
            <div className="rounded-xl bg-[#F5C518] px-8 py-5">
              <h2 className="text-2xl sm:text-3xl font-black text-[#1B3A2D] mb-4">View Unlimited Profiles</h2>
              <ul className="space-y-2">
                {[
                  'Unlimited Profiles',
                  'Connect With Any User on muslimnikah.lk',
                  'View Mobile Number',
                  'View WhatsApp Number',
                  'Chat with Members',
                  'Advanced Search & Filters',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[#1B3A2D] font-medium">
                    <span className="text-[#1B3A2D] font-bold">◆</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-[#1B3A2D] text-white text-center py-4">
                <h3 className="font-bold text-lg tracking-wide">ORDER SUMMARY</h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Package</span>
                  <span className="font-semibold text-[#1B6B4A]">
                    {selected ? fmtAmt(selDisc > 0 ? selFinal : selFinal) : `${currSymbol} 0.00`}
                  </span>
                </div>
                {selDisc > 0 && selOrig - selFinal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Savings ({selDisc}% off)</span>
                    <span className="font-semibold text-red-500">-{fmtAmt(selOrig - selFinal)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-sm font-bold">
                  <span>Total</span>
                  <span className="text-[#1B6B4A]">
                    {selected ? fmtAmt(selFinal) : `${currSymbol} 0.00`}
                  </span>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-[#1B3A2D] text-white rounded-xl p-5 text-sm space-y-4">
              <p className="text-center text-white/90 leading-relaxed">
                Please deposit/transfer the amount to the bank account mentioned below and send the receipt to{' '}
                <a href={`https://wa.me/${whatsappContact.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="font-bold text-[#F5C518] hover:underline">{whatsappContact}</a> WhatsApp
              </p>
              <p className="text-center text-white/70 text-xs">Mention your Username on the WhatsApp</p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/10 rounded-lg p-3 space-y-1">
                  <p className="font-bold text-[#F5C518]">Bank Account</p>
                  <p>Acc Name: {bank1.accName}</p>
                  <p>Acc No: {bank1.accNo}</p>
                  <p>Bank: {bank1.bankName}</p>
                  <p>Branch: {bank1.branch}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 space-y-1">
                  <p className="font-bold text-[#F5C518]">Bank Account</p>
                  <p>Acc Name: {bank2.accName}</p>
                  <p>Acc No: {bank2.accNo}</p>
                  <p>Bank: {bank2.bankName}</p>
                  <p>Branch: {bank2.branch}</p>
                </div>
              </div>

              {isLoggedIn ? (
                <div className="space-y-3 pt-2">
                  {/* Profile status indicator */}
                  {profilesLoading ? (
                    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-xs">
                      <svg className="w-3.5 h-3.5 text-white/50 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span className="text-white/50">Loading your profile...</span>
                    </div>
                  ) : (() => {
                    // When a specific profileId is in the URL, check THAT profile's status
                    const activeProfile = preselectedProfileId
                      ? profiles.find((p: any) => p.id === preselectedProfileId) ?? profiles[0]
                      : profiles[0];
                    const isPending = activeProfile?.status === 'PAYMENT_PENDING';
                    return activeProfile ? (
                      <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-xs">
                        <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-white/80">Profile: <strong className="text-white">{activeProfile?.name ?? 'Your Profile'}</strong>
                          {isPending && (
                            <span className="ml-1 text-amber-300">(awaiting approval)</span>
                          )}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-lg px-3 py-2 text-xs">
                        <svg className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span className="text-amber-200">No profile yet - one will be created when you click submit</span>
                      </div>
                    );
                  })()}

                  {/* If THIS profile already has a pending payment, block re-submission */}
                  {!profilesLoading && (() => {
                    const activeProfile = preselectedProfileId
                      ? profiles.find((p: any) => p.id === preselectedProfileId) ?? null
                      : profiles[0];
                    const isPending = activeProfile?.status === 'PAYMENT_PENDING';
                    return isPending;
                  })() ? (
                    <div className="space-y-3">
                      <div className="bg-green-700/30 border border-green-500/40 rounded-lg px-4 py-3 text-center">
                        <p className="text-green-300 font-semibold text-sm">✅ Payment Already Submitted</p>
                        <p className="text-green-200/70 text-xs mt-1">
                          Your payment is awaiting admin approval. You&apos;ll be notified once your profile is activated.
                        </p>
                      </div>
                      <Link
                        href="/dashboard/parent"
                        className="block w-full text-center rounded-lg bg-[#1B6B4A] hover:bg-[#15563d] text-white font-semibold py-3 transition"
                      >
                        Go to My Dashboard →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Email / Mobile Number"
                        value={bankRef}
                        onChange={(e) => setBankRef(e.target.value)}
                        className="w-full rounded-lg bg-white/15 border border-white/20 px-3 py-2.5 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#F5C518]"
                      />
                      <p className="flex items-start gap-1.5 text-[11px] text-white/50 leading-relaxed -mt-1">
                        <svg className="w-3 h-3 shrink-0 mt-0.5 text-[#F5C518]/70" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        When making a deposit or bank transfer, please include your registered email address or mobile number so we can identify your payment.
                      </p>

                      <button
                        onClick={handleBankTransfer}
                        disabled={submitting || !bankRef.trim() || profilesLoading}
                        className="w-full rounded-lg bg-[#1B6EDD] hover:bg-[#1559b8] disabled:opacity-60 text-white font-semibold py-3 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        ) : null}
                        {submitting ? 'Submitting...' : 'Submit Payment'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <Link href="/login" className="block w-full text-center rounded-lg bg-[#1B6EDD] hover:bg-[#1559b8] text-white font-semibold py-3 transition">
                    Login to Continue
                  </Link>
                  <Link href="/register" className="block w-full text-center rounded-lg border border-white/30 hover:bg-white/10 text-white font-medium py-2.5 transition text-sm">
                    Create Account
                  </Link>
                </div>
              )}

              {message && (
                <div className={`text-xs rounded-lg px-3 py-2.5 text-center leading-relaxed ${message.startsWith('✅') ? 'bg-green-800/50 text-green-200' : 'bg-red-800/50 text-red-200'}`}>
                  {message}
                </div>
              )}
            </div>

            {isLoggedIn && profiles[0]?.status !== 'PAYMENT_PENDING' && (
              <p className="text-center text-xs text-gray-400">
                Already paid?{' '}
                <Link href="/dashboard/parent" className="text-[#1B6B4A] font-medium hover:underline">
                  Go to Dashboard
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
