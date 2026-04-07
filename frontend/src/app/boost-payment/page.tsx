'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { paymentApi, settingsApi } from '@/services/api';
import Link from 'next/link';

function BoostPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const profileId    = searchParams.get('profileId')    ?? '';
  const profileName  = searchParams.get('profileName')  ?? '';
  const memberId     = searchParams.get('memberId')     ?? '';
  const planId     = searchParams.get('planId')      ?? '';
  const planName   = searchParams.get('planName')    ?? 'Boost';
  const days       = parseInt(searchParams.get('days') ?? '7');
  const amount     = parseFloat(searchParams.get('amount') ?? '0');
  const currency   = searchParams.get('currency')   ?? 'LKR';
  const symbol     = currency === 'USD' ? '$' : 'Rs.';

  const [bankRef,    setBankRef]    = useState('');
  const [remark,     setRemark]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message,    setMessage]    = useState('');
  const [whatsapp,   setWhatsapp]   = useState('+94 705 687 697');
  const [bank1, setBank1] = useState({ accName: 'M T M Akram', accNo: '112054094468', bankName: 'Sampath Bank PLC', branch: 'Ratmalana' });
  const [bank2, setBank2] = useState({ accName: 'M T M Akram', accNo: '89870069',     bankName: 'BOC',              branch: 'Anuradhapura' });

  useEffect(() => {
    settingsApi.get().then((r: any) => {
      const d = r.data ?? {};
      if (d.whatsappContact) setWhatsapp(d.whatsappContact);
      if (d.bank1AccName)    setBank1({ accName: d.bank1AccName, accNo: d.bank1AccNo ?? '', bankName: d.bank1BankName ?? '', branch: d.bank1Branch ?? '' });
      if (d.bank2AccName)    setBank2({ accName: d.bank2AccName, accNo: d.bank2AccNo ?? '', bankName: d.bank2BankName ?? '', branch: d.bank2Branch ?? '' });
    }).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!bankRef.trim()) { setMessage('Please enter your bank reference / slip number.'); return; }
    if (!profileId)       { setMessage('Profile ID is missing. Please go back and try again.'); return; }
    setSubmitting(true); setMessage('');
    try {
      await paymentApi.initiate({
        childProfileId: profileId,
        amount,
        method: 'BANK_TRANSFER',
        bankRef: bankRef.trim(),
        purpose: 'BOOST',
        days,
        currency,
        packageId: planId || undefined,
        packageDurationDays: days,
      });
      router.push('/dashboard/profiles?boostSubmitted=1');
    } catch (e: any) {
      setMessage(e.message ?? 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-poppins pt-24">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-[#1B6B4A] transition">🏠 Home</Link>
          <span>/</span>
          <Link href="/dashboard/profiles" className="hover:text-[#DB9D30] transition">My Profiles</Link>
          <span>/</span>
          <span className="text-[#DB9D30] font-medium">⚡ Boost Payment</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Hero banner */}
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-[#8B5E00] to-[#DB9D30] text-white flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">⚡</div>
          <div>
            <h1 className="text-xl font-bold">Boost Your Profile</h1>
            <p className="text-white/80 text-sm mt-0.5">Transfer payment to our bank account and submit your slip reference below</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* LEFT — Plan summary + bank details */}
          <div className="lg:col-span-3 space-y-5">

            {/* Plan Summary Card */}
            <div className="bg-white rounded-2xl border border-[#DB9D30]/30 overflow-hidden shadow-sm">
              <div className="px-5 py-4 bg-gradient-to-r from-[#FFFBF0] to-[#FFF3D0] border-b border-[#DB9D30]/20 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-[#A07830] uppercase tracking-wide">Selected Boost Plan</p>
                  <h2 className="text-lg font-bold text-[#8B5E00] mt-0.5">{planName}</h2>
                </div>
                <span className="bg-[#DB9D30] text-white text-xs font-bold px-3 py-1 rounded-full">{days} Days</span>
              </div>
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4 text-[#DB9D30]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>Your profile will appear at the <strong>top of search</strong> for {days} days</span>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-2xl font-extrabold text-[#DB9D30]">{symbol} {amount.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-400">{currency} · one-time</p>
                </div>
              </div>
            </div>

            {/* Profile Info Card */}
            {profileName && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-[#F0F4F2] border-b border-gray-100">
                  <p className="text-[10px] font-bold text-[#1C3B35] uppercase tracking-wide">Boosting Profile</p>
                </div>
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#1C3B35] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{profileName[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{profileName}</p>
                    {memberId && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{memberId}</p>}
                  </div>
                  <div className="ml-auto">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">⚡ VIP Boost</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Details */}
            <div className="bg-[#1B3A2D] text-white rounded-2xl p-5 text-sm space-y-4">
              <div className="text-center space-y-1">
                <p className="font-bold text-[#F5C518] text-base">💳 Bank Transfer Details</p>
                <p className="text-white/80 text-xs leading-relaxed">
                  Deposit <strong className="text-[#F5C518]">{symbol} {amount.toFixed(2)}</strong> to one of the accounts below,
                  then enter your slip / reference number.
                </p>
                <p className="text-white/60 text-xs">
                  Also send receipt to{' '}
                  <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="font-bold text-[#F5C518] hover:underline">{whatsapp}</a> on WhatsApp
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/10 rounded-xl p-3.5 space-y-1.5">
                  <p className="font-bold text-[#F5C518] text-[11px] uppercase tracking-wide">Bank Account 1</p>
                  <p><span className="text-white/50">Name:</span> {bank1.accName}</p>
                  <p><span className="text-white/50">Acc No:</span> <strong>{bank1.accNo}</strong></p>
                  <p><span className="text-white/50">Bank:</span> {bank1.bankName}</p>
                  <p><span className="text-white/50">Branch:</span> {bank1.branch}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3.5 space-y-1.5">
                  <p className="font-bold text-[#F5C518] text-[11px] uppercase tracking-wide">Bank Account 2</p>
                  <p><span className="text-white/50">Name:</span> {bank2.accName}</p>
                  <p><span className="text-white/50">Acc No:</span> <strong>{bank2.accNo}</strong></p>
                  <p><span className="text-white/50">Bank:</span> {bank2.bankName}</p>
                  <p><span className="text-white/50">Branch:</span> {bank2.branch}</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Submit form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-28">
              <div className="bg-[#1B3A2D] text-white text-center py-4">
                <h3 className="font-bold text-lg tracking-wide">SUBMIT PAYMENT</h3>
                <p className="text-white/60 text-xs mt-0.5">Enter your slip details below</p>
              </div>

              <div className="p-5 space-y-4">
                {/* Summary line */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-amber-700">{planName}</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">{days} days boost</p>
                  </div>
                  <p className="text-lg font-extrabold text-amber-700">{symbol} {amount.toFixed(2)}</p>
                </div>

                {/* Reference number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Bank Reference / Slip Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={bankRef}
                    onChange={e => setBankRef(e.target.value)}
                    placeholder="e.g. TXN123456789"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#DB9D30] focus:ring-2 focus:ring-[#DB9D30]/10 transition bg-white"
                  />
                </div>

                {/* Remark */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Remark (optional)</label>
                  <textarea
                    value={remark}
                    onChange={e => setRemark(e.target.value)}
                    rows={2}
                    placeholder="Your name or any note about the transfer…"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#DB9D30] focus:ring-2 focus:ring-[#DB9D30]/10 transition bg-white resize-none"
                  />
                </div>

                {/* Error / success message */}
                {message && (
                  <div className={`text-xs rounded-xl px-3 py-2.5 text-center leading-relaxed ${
                    message.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
                  }`}>
                    {message}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !bankRef.trim()}
                  className="w-full rounded-xl bg-[#DB9D30] hover:bg-[#c98b26] disabled:opacity-60 text-white font-bold py-3 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  {submitting ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  ) : <span>⚡</span>}
                  {submitting ? 'Submitting…' : 'Submit Boost Payment'}
                </button>

                <button
                  onClick={() => router.back()}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 transition py-1"
                >
                  ← Go back
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function BoostPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>}>
      <BoostPaymentContent />
    </Suspense>
  );
}
