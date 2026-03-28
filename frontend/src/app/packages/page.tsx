'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { packagesApi, paymentApi, profileApi } from '@/services/api';
import Link from 'next/link';

type Package = {
  id: string; name: string; description?: string; price: number;
  currency: string; durationDays: number; features: string[];
  isActive: boolean; sortOrder: number;
};

// Fallback plans matching the old site
const FALLBACK: Package[] = [
  {
    id: '3months', name: '3 Months Membership', price: 7499.25, currency: 'LKR', durationDays: 90,
    features: ['Unlimited Profiles', 'Connect With Any User on muslimnikah.lk', 'View Mobile Number', 'View WhatsApp Number', 'Chat with Members'],
    isActive: true, sortOrder: 0,
  },
  {
    id: '6months', name: '6 Months Membership', price: 10004.33, currency: 'LKR', durationDays: 180,
    features: ['Unlimited Profiles', 'Connect With Any User on muslimnikah.lk', 'View Mobile Number', 'View WhatsApp Number', 'Chat with Members'],
    isActive: true, sortOrder: 1,
  },
  {
    id: '9months', name: '9 Months Membership', price: 14999.25, currency: 'LKR', durationDays: 270,
    features: ['Unlimited Profiles', 'Connect With Any User on muslimnikah.lk', 'View Mobile Number', 'View WhatsApp Number', 'Chat with Members'],
    isActive: true, sortOrder: 2,
  },
];

const ORIGINAL_PRICES: Record<string, number> = {
  '3months': 9999.00,
  '6months': 14999.00,
  '9months': 19999.00,
};

export default function PackagesPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Package[]>([]);
  const [selected, setSelected] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bankRef, setBankRef] = useState('');
  const [message, setMessage] = useState('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mn_token') : null;
    setIsLoggedIn(!!token);

    // Load packages
    packagesApi.getActive()
      .then((r) => {
        const data: Package[] = r.data ?? [];
        const list = data.length > 0 ? data : FALLBACK;
        setPlans(list);
        setSelected(list[0]);
      })
      .catch(() => {
        setPlans(FALLBACK);
        setSelected(FALLBACK[0]);
      })
      .finally(() => setLoading(false));

    // If logged in, load profiles for payment
    if (token) {
      profileApi.getMyProfiles()
        .then((r) => setProfiles(r.data ?? []))
        .catch(() => { });
    }
  }, []);

  const handleBankTransfer = async () => {
    if (!bankRef.trim()) { setMessage('Please enter your bank reference number.'); return; }
    if (!selected) { setMessage('Please select a package.'); return; }

    const profileId = profiles[0]?.id;
    if (!profileId) {
      setMessage('Please create a profile first before purchasing.');
      setTimeout(() => router.push('/dashboard/parent'), 2000);
      return;
    }

    setSubmitting(true);
    try {
      await paymentApi.initiate({
        childProfileId: profileId,
        amount: selected.price,
        method: 'BANK_TRANSFER',
        bankRef,
      });
      setMessage('✅ Payment submitted! Your account will be activated once the admin approves your transfer (usually within 24 hours).');
      setBankRef('');
    } catch (e: any) {
      setMessage(e.message ?? 'Payment submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const savings = selected
    ? ((ORIGINAL_PRICES[selected.id] ?? selected.price * 1.25) - selected.price)
    : 0;

  const savingsPct = selected
    ? Math.round((savings / (ORIGINAL_PRICES[selected.id] ?? selected.price * 1.25)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 font-poppins pt-24">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-[#1B6B4A] transition">🏠 Home</Link>
        <span>/</span>
        <span className="text-[#1B6B4A] font-medium">📦 Package</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Currency row */}
        <div className="flex items-center gap-4 mb-8">
          <label className="text-sm font-medium text-gray-600">Currency</label>
          <div className="relative">
            <select className="appearance-none border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 bg-white shadow-sm focus:outline-none focus:border-[#1B6B4A]">
              <option value="LKR">LKR</option>
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT: Package cards + features */}
          <div className="lg:col-span-2 space-y-6">

            {/* Package Cards */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const orig = ORIGINAL_PRICES[plan.id] ?? plan.price * 1.25;
                  const pct = Math.round(((orig - plan.price) / orig) * 100);
                  const isSelected = selected?.id === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelected(plan)}
                      className={`cursor-pointer rounded-xl border-2 p-5 text-center transition-all duration-200 ${
                        isSelected
                          ? 'border-[#1B6B4A] bg-[#e8f5f0] shadow-lg scale-[1.02]'
                          : 'border-gray-300 bg-white hover:border-[#1B6B4A]/50 hover:shadow'
                      }`}
                    >
                      <p className="font-semibold text-gray-800 text-sm mb-2">{plan.name}</p>
                      <p className="text-[#1B6B4A] font-bold text-lg">
                        Rs. {plan.price.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </p>
                      {pct > 0 && (
                        <p className="text-red-500 text-xs font-semibold mt-1">SAVE {pct}.00%</p>
                      )}
                      <p className="text-gray-400 text-xs line-through mt-0.5">
                        Rs. {orig.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </p>
                      <p className={`text-xs font-semibold mt-3 ${isSelected ? 'text-[#1B6B4A]' : 'text-[#DB9D30]'}`}>
                        {isSelected ? '✓ Selected' : 'Select Package'}
                      </p>
                    </div>
                  );
                })}
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
                    {selected ? `Rs ${selected.price.toLocaleString('en-LK', { minimumFractionDigits: 2 })}` : 'Rs 0.00'}
                  </span>
                </div>
                {savingsPct > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Savings</span>
                    <span className="font-semibold text-red-500">-Rs {savings.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-sm font-bold">
                  <span>Total</span>
                  <span className="text-[#1B6B4A]">
                    {selected ? `Rs ${selected.price.toLocaleString('en-LK', { minimumFractionDigits: 2 })}` : 'Rs 0.00'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-[#1B3A2D] text-white rounded-xl p-5 text-sm space-y-4">
              <p className="text-center text-white/90 leading-relaxed">
                Please deposit/transfer the amount to the bank account mentioned below and send the receipt to{' '}
                <span className="font-bold text-[#F5C518]">+94 705 687 697</span> WhatsApp
              </p>
              <p className="text-center text-white/70 text-xs">Mention your Username on the WhatsApp</p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/10 rounded-lg p-3 space-y-1">
                  <p className="font-bold text-[#F5C518]">Bank Account</p>
                  <p>Acc Name: M T M Akram</p>
                  <p>Acc No: 112054094468</p>
                  <p>Bank: Sampath Bank PLC</p>
                  <p>Branch: Ratmalana</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 space-y-1">
                  <p className="font-bold text-[#F5C518]">Bank Account</p>
                  <p>Acc Name: M T M Akram</p>
                  <p>Acc No: 89870069</p>
                  <p>Bank: BOC</p>
                  <p>Branch: Anuradhapura</p>
                </div>
              </div>

              {isLoggedIn ? (
                <div className="space-y-3 pt-2">
                  <input
                    type="text"
                    placeholder="Enter bank reference / slip number"
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                    className="w-full rounded-lg bg-white/15 border border-white/20 px-3 py-2.5 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#F5C518]"
                  />
                  <button
                    onClick={handleBankTransfer}
                    disabled={submitting}
                    className="w-full rounded-lg bg-[#1B6EDD] hover:bg-[#1559b8] disabled:opacity-60 text-white font-semibold py-3 transition-all duration-200"
                  >
                    {submitting ? 'Submitting...' : 'Continue With Plans'}
                  </button>
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
                <div className={`text-xs rounded-lg px-3 py-2 text-center ${message.startsWith('✅') ? 'bg-green-800/50 text-green-200' : 'bg-red-800/50 text-red-200'}`}>
                  {message}
                </div>
              )}
            </div>

            {/* Already paid? */}
            {isLoggedIn && (
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