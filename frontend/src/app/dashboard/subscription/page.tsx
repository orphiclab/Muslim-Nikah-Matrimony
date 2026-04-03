'use client';

import { useEffect, useState } from 'react';
import { subscriptionApi, paymentApi, packagesApi } from '@/services/api';

type Profile = {
  id: string; name: string; memberId?: string;
  subscription?: { status: string; endDate?: string } | null;
};

type Payment = {
  id: string; amount: number; currency: string; method: string;
  status: string; bankRef?: string; childProfileId: string; createdAt: string;
  purpose?: string;
};

export default function SubscriptionPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [initiating, setInitiating] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<any>(null);

  // Bank transfer form state
  const [bankForm, setBankForm] = useState<{ profileId: string; ref: string } | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([subscriptionApi.mySubscriptions(), paymentApi.myPayments(), packagesApi.getActive('SUBSCRIPTION')])
      .then(([s, p, pkg]) => {
        setProfiles(s.data ?? []);
        setPayments(p.data ?? []);
        if (pkg.data && pkg.data.length > 0) setActivePlan(pkg.data[0]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const getPendingPayment = (profileId: string) =>
    payments.find(p => p.childProfileId === profileId && p.status === 'PENDING' && p.purpose !== 'BOOST');

  const initiate = async (profileId: string, method: 'GATEWAY' | 'BANK_TRANSFER', bankRef?: string) => {
    setInitiating(profileId);
    try {
      const res = await paymentApi.initiate({
        childProfileId: profileId,
        amount: activePlan ? activePlan.price : 29.99,
        method,
        bankRef,
      });
      setBankForm(null);
      setMessage({
        text: method === 'BANK_TRANSFER'
          ? `✅ Order submitted! Payment ID: ${res.data.id} — Admin will review and approve your account shortly.`
          : `✅ Payment initiated. Payment ID: ${res.data.id}`,
        ok: true,
      });
      setTimeout(() => setMessage(null), 10000);
      load();
    } catch (e: any) {
      setMessage({ text: e.message ?? 'Something went wrong', ok: false });
    } finally {
      setInitiating(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Loading...
    </div>
  );

  return (
    <div className="font-poppins max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[34px] xl:text-[37px] 2xl:text-[40px] font-poppins font-medium text-[#121514]">Subscriptions</h1>
        <p className="text-[#121514AD]/68 title-sub-top mt-0.5">Manage subscriptions for each profile independently</p>
      </div>

      {/* Toast */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${message.ok
          ? 'bg-green-50 text-green-800 border-green-100'
          : 'bg-red-50 text-red-700 border-red-100'}`}>
          {message.text}
        </div>
      )}

      {/* Plan banner */}
      <div className="bg-gradient-to-br from-[#1B6B4A] to-[#2d9966] rounded-2xl p-6 text-white flex items-center justify-between">
        <div>
          <p className="font-bold text-xl">{activePlan ? activePlan.name : 'Standard Plan'}</p>
          <p className="text-white/80 text-sm mt-1">{activePlan?.durationDays ? `${activePlan.durationDays}-day access` : '30-day access'} · Full profile visibility · Unlimited messaging</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">${activePlan ? activePlan.price : '29.99'}</p>
          <p className="text-white/70 text-sm">per profile {activePlan?.durationDays ? `/ ${activePlan.durationDays} days` : '/ month'}</p>
        </div>
      </div>

      {/* Profile subscriptions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-medium font-poppins text-[#121514] subtitle mb-4">Profile Subscriptions</h2>

        {profiles.length === 0 ? (
          <p className="text-gray-400 text-sm">No profiles found. Create a profile first.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {profiles.map((profile) => {
              const pending = getPendingPayment(profile.id);
              const isActive = profile.subscription?.status === 'ACTIVE';
              const isExpired = profile.subscription?.status === 'EXPIRED';

              return (
                <div key={profile.id} className="rounded-xl border border-gray-100 overflow-hidden">
                  {/* Profile header */}
                  <div className={`flex items-center justify-between p-4 ${
                    isActive ? 'bg-green-50' : pending ? 'bg-amber-50' : 'bg-gray-50'
                  }`}>
                    <div>
                      <p className="font-semibold text-gray-800">{profile.name}</p>
                      {profile.memberId && <p className="text-xs text-gray-400 mt-0.5">{profile.memberId}</p>}
                    </div>
                    {/* Status badge */}
                    {isActive && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">
                        ✓ Active
                      </span>
                    )}
                    {isExpired && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-100 text-red-700">
                        Expired
                      </span>
                    )}
                    {pending && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        Pending Approval
                      </span>
                    )}
                    {!isActive && !pending && !isExpired && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                        No Subscription
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Active info */}
                    {isActive && profile.subscription?.endDate && (
                      <p className="text-sm text-gray-600">
                        Expires: <span className="font-medium">{new Date(profile.subscription.endDate).toLocaleDateString()}</span>
                      </p>
                    )}

                    {/* Pending payment info */}
                    {pending && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-amber-500 text-lg">⏳</span>
                          <div>
                            <p className="text-sm font-semibold text-amber-800">Awaiting Admin Approval</p>
                            <p className="text-xs text-amber-600 mt-0.5">
                              Your payment has been received. An admin will review and activate your profile shortly.
                            </p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg border border-amber-100 p-3 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Payment ID</span>
                            <span className="font-mono text-gray-600 select-all">{pending.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Amount</span>
                            <span className="font-semibold text-gray-700">${pending.amount} {pending.currency}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Method</span>
                            <span className="text-gray-700">{pending.method === 'BANK_TRANSFER' ? '🏦 Bank Transfer' : '💳 Online'}</span>
                          </div>
                          {pending.bankRef && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Bank Ref</span>
                              <span className="font-mono font-semibold text-[#1B6B4A]">{pending.bankRef}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-400">Submitted</span>
                            <span className="text-gray-700">{new Date(pending.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment buttons */}
                    {!isActive && !pending && (
                      <div className="space-y-3">
                        {/* Bank transfer form */}
                        {bankForm?.profileId === profile.id ? (
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                            <p className="text-sm font-semibold text-blue-800">🏦 Bank Transfer Details</p>
                            <div className="bg-white rounded-lg border border-blue-100 p-3 text-xs space-y-1.5">
                              <p className="text-gray-500">Transfer <span className="font-bold text-gray-800">${activePlan ? activePlan.price : '29.99'}</span> to:</p>
                              <p><span className="text-gray-400">Bank:</span> <span className="font-medium">Islamic Bank of Australia</span></p>
                              <p><span className="text-gray-400">BSB:</span> <span className="font-mono">062-000</span></p>
                              <p><span className="text-gray-400">Account:</span> <span className="font-mono">1234 5678</span></p>
                              <p><span className="text-gray-400">Reference:</span> <span className="font-mono font-semibold text-[#1B6B4A]">{profile.memberId ?? profile.id.slice(0, 8)}</span></p>
                            </div>
                            <input
                              type="text"
                              placeholder="Enter your bank transaction reference / receipt no."
                              value={bankForm.ref}
                              onChange={e => setBankForm({ ...bankForm, ref: e.target.value })}
                              className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1B6B4A] transition"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => setBankForm(null)}
                                className="flex-1 border border-gray-200 text-gray-600 text-xs font-semibold py-2 rounded-xl hover:bg-gray-50 transition">
                                Cancel
                              </button>
                              <button
                                disabled={!bankForm.ref.trim() || initiating === profile.id}
                                onClick={() => initiate(profile.id, 'BANK_TRANSFER', bankForm.ref)}
                                className="flex-1 bg-[#1B6B4A] text-white text-xs font-semibold py-2 rounded-xl hover:bg-[#155a3d] transition disabled:opacity-50 flex items-center justify-center gap-1.5">
                                {initiating === profile.id ? (
                                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                  </svg>
                                ) : '📤'} Submit Payment
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              disabled={initiating === profile.id}
                              onClick={() => initiate(profile.id, 'GATEWAY')}
                              className="flex-1 bg-[#1B6B4A] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#155a3d] transition disabled:opacity-50 flex items-center justify-center gap-2">
                              {initiating === profile.id
                                ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                                : '💳'} Pay Online (${activePlan ? activePlan.price : '29.99'})
                            </button>
                            <button
                              onClick={() => setBankForm({ profileId: profile.id, ref: '' })}
                              className="flex-1 border border-[#1B6B4A] text-[#1B6B4A] text-sm font-semibold py-2.5 rounded-xl hover:bg-[#1B6B4A]/5 transition flex items-center justify-center gap-2">
                              🏦 Bank Transfer
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Renew if expired */}
                    {isExpired && !pending && (
                      <div className="flex gap-2">
                        <button onClick={() => initiate(profile.id, 'GATEWAY')}
                          className="flex-1 bg-[#1B6B4A] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#155a3d] transition flex items-center justify-center gap-2">
                          💳 Renew Online
                        </button>
                        <button onClick={() => setBankForm({ profileId: profile.id, ref: '' })}
                          className="flex-1 border border-[#1B6B4A] text-[#1B6B4A] text-sm font-semibold py-2.5 rounded-xl hover:bg-[#1B6B4A]/5 transition flex items-center justify-center gap-2">
                          🏦 Bank Transfer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-medium font-poppins text-[#121514] subtitle mb-4">Payment History</h2>
        {payments.length === 0 ? (
          <p className="text-gray-400 text-sm">No payments yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-700">
                      {p.method === 'BANK_TRANSFER' ? '🏦' : '💳'} ${p.amount} {p.currency}
                    </p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      p.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                      p.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>{p.status}</span>
                    {p.purpose === 'BOOST' && (
                      <span className="text-[9px] font-bold bg-[#DB9D30] text-white px-1.5 py-0.5 rounded shadow-sm">⚡ BOOST</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono select-all">{p.id.slice(0, 20)}…</p>
                  {p.bankRef && <p className="text-xs text-gray-500">Ref: {p.bankRef}</p>}
                  <p className="text-xs text-gray-300 mt-0.5">{new Date(p.createdAt).toLocaleString()}</p>
                </div>
                {p.status === 'PENDING' && (
                  <div className="ml-4 text-right flex-shrink-0">
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg font-medium">⏳ Awaiting</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
