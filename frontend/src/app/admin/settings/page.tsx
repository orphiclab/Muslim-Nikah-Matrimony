'use client';

import { useEffect, useState } from 'react';
import { adminApi, userApi } from '@/services/api';
import { bustCurrencyCache } from '@/hooks/useCurrency';

const CURRENCIES = [
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', flag: '🇱🇰', desc: 'Local Sri Lanka transactions' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', desc: 'International standard currency' },
];

type Tab = 'account' | 'platform';

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Toast                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold ${ok ? 'bg-[#1C3B35] text-white' : 'bg-red-500 text-white'}`}>
      <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold ${ok ? 'bg-white/20' : 'bg-white/20'}`}>
        {ok ? '✓' : '✕'}
      </div>
      {msg}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Shared Components                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */
function InputField({ label, value, onChange, placeholder, type = 'text', mono = false, readOnly = false, hint }: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; mono?: boolean; readOnly?: boolean; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <input
        type={type} value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder} readOnly={readOnly}
        className={`w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none transition
          ${readOnly ? 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed select-none'
                     : 'bg-gray-50 border-gray-200 text-gray-700 focus:bg-white focus:border-[#1C3B35] focus:shadow-[0_0_0_3px_rgba(28,59,53,0.08)]'}
          ${mono ? 'font-mono' : ''}`}
      />
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder, show, onToggle, error, success }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; show: boolean; onToggle: () => void;
  error?: string; success?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full border rounded-xl px-3.5 py-2.5 pr-10 text-sm text-gray-700 bg-gray-50 focus:bg-white outline-none transition focus:shadow-[0_0_0_3px_rgba(28,59,53,0.08)]
            ${error ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-[#1C3B35]'}`}
        />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {show
              ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
              : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
          </svg>
        </button>
      </div>
      {error && <p className="text-xs text-red-500 font-medium flex items-center gap-1"><span>⚠</span>{error}</p>}
      {success && <p className="text-xs text-green-600 font-medium flex items-center gap-1"><span>✓</span>{success}</p>}
    </div>
  );
}

function StrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const score = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const configs = [
    { label: 'Weak', color: 'bg-red-400', text: 'text-red-500' },
    { label: 'Fair', color: 'bg-amber-400', text: 'text-amber-600' },
    { label: 'Good', color: 'bg-blue-400', text: 'text-blue-600' },
    { label: 'Strong', color: 'bg-green-500', text: 'text-green-600' },
  ];
  const cfg = configs[score - 1] ?? configs[0];
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= score ? cfg.color : 'bg-gray-200'}`} />
        ))}
      </div>
      <span className={`text-[11px] font-bold ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
}

function Btn({ onClick, loading, children, variant = 'primary', size = 'md' }: {
  onClick: () => void; loading?: boolean; children: React.ReactNode;
  variant?: 'primary' | 'secondary'; size?: 'sm' | 'md';
}) {
  const base = 'inline-flex items-center gap-2 font-semibold rounded-xl transition-all disabled:opacity-60';
  const sizes = { sm: 'text-xs px-4 py-2', md: 'text-sm px-5 py-2.5' };
  const variants = {
    primary: 'bg-[#1C3B35] hover:bg-[#15302a] text-white shadow-sm',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200',
  };
  return (
    <button type="button" onClick={onClick} disabled={loading} className={`${base} ${sizes[size]} ${variants[variant]}`}>
      {loading
        ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
        : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}
      {loading ? 'Saving…' : children}
    </button>
  );
}

function Divider() {
  return <div className="border-t border-gray-100" />;
}

function BankBlock({ index, accName, accNo, bankName, branch, onChange }: {
  index: number; accName: string; accNo: string; bankName: string; branch: string;
  onChange: (f: string, v: string) => void;
}) {
  const p = `bank${index}`;
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="h-6 w-6 rounded-full bg-[#1C3B35] text-white text-[10px] font-extrabold flex items-center justify-center">{index}</span>
        <span className="text-xs font-bold text-[#1C3B35] uppercase tracking-wider">Bank Account {index}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InputField label="Account Name" value={accName} onChange={v => onChange(`${p}AccName`, v)} placeholder="e.g. M T M Akram" />
        <InputField label="Account No." value={accNo} onChange={v => onChange(`${p}AccNo`, v)} placeholder="e.g. 112054094468" mono />
        <InputField label="Bank" value={bankName} onChange={v => onChange(`${p}BankName`, v)} placeholder="e.g. Sampath Bank PLC" />
        <InputField label="Branch" value={branch} onChange={v => onChange(`${p}Branch`, v)} placeholder="e.g. Ratmalana" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Page                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */
export default function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>('account');
  const [pageLoading, setPageLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  /* Account */
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  /* Password */
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  /* Platform */
  const [currency, setCurrency] = useState('LKR');
  const [whatsapp, setWhatsapp] = useState('+94 705 687 697');
  const [b1n, setB1n] = useState('M T M Akram');
  const [b1no, setB1no] = useState('112054094468');
  const [b1b, setB1b] = useState('Sampath Bank PLC');
  const [b1br, setB1br] = useState('Ratmalana');
  const [b2n, setB2n] = useState('M T M Akram');
  const [b2no, setB2no] = useState('89870069');
  const [b2b, setB2b] = useState('BOC');
  const [b2br, setB2br] = useState('Anuradhapura');
  const [savingPlatform, setSavingPlatform] = useState(false);

  const bankSetters: Record<string, (v: string) => void> = {
    bank1AccName: setB1n, bank1AccNo: setB1no, bank1BankName: setB1b, bank1Branch: setB1br,
    bank2AccName: setB2n, bank2AccNo: setB2no, bank2BankName: setB2b, bank2Branch: setB2br,
  };
  const getBankVals = (idx: number) => idx === 1
    ? { accName: b1n, accNo: b1no, bankName: b1b, branch: b1br }
    : { accName: b2n, accNo: b2no, bankName: b2b, branch: b2br };

  /* Load */
  useEffect(() => {
    Promise.all([userApi.getMe(), adminApi.getSiteSettings()])
      .then(([me, s]) => {
        setAdminEmail(me.data?.email ?? '');
        setAdminPhone(me.data?.phone ?? '');
        const d = s.data ?? {};
        setCurrency(d.platformCurrency ?? 'LKR');
        setWhatsapp(d.whatsappContact ?? '+94 705 687 697');
        setB1n(d.bank1AccName ?? 'M T M Akram'); setB1no(d.bank1AccNo ?? '112054094468');
        setB1b(d.bank1BankName ?? 'Sampath Bank PLC'); setB1br(d.bank1Branch ?? 'Ratmalana');
        setB2n(d.bank2AccName ?? 'M T M Akram'); setB2no(d.bank2AccNo ?? '89870069');
        setB2b(d.bank2BankName ?? 'BOC'); setB2br(d.bank2Branch ?? 'Anuradhapura');
      })
      .catch(() => showToast('Failed to load settings', false))
      .finally(() => setPageLoading(false));
  }, []);

  const saveAccount = async () => {
    setSavingAccount(true);
    try {
      await userApi.updateMe({ phone: adminPhone.trim() || undefined });
      showToast('Account updated!');
    } catch (e: any) { showToast(e.message ?? 'Failed', false); }
    finally { setSavingAccount(false); }
  };

  const savePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { showToast('All fields required.', false); return; }
    if (newPw !== confirmPw) { showToast('New passwords do not match.', false); return; }
    if (newPw.length < 8) { showToast('Password must be at least 8 characters.', false); return; }
    setSavingPw(true);
    try {
      await userApi.changePassword({ currentPassword: currentPw, newPassword: newPw });
      showToast('Password changed!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e: any) { showToast(e.message ?? 'Failed', false); }
    finally { setSavingPw(false); }
  };

  const savePlatform = async () => {
    setSavingPlatform(true);
    try {
      await adminApi.updateSiteSettings({
        platformCurrency: currency, whatsappContact: whatsapp,
        bank1AccName: b1n, bank1AccNo: b1no, bank1BankName: b1b, bank1Branch: b1br,
        bank2AccName: b2n, bank2AccNo: b2no, bank2BankName: b2b, bank2Branch: b2br,
      });
      bustCurrencyCache();
      showToast('Platform settings saved!');
    } catch (e: any) { showToast(e.message ?? 'Failed', false); }
    finally { setSavingPlatform(false); }
  };

  if (pageLoading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400 font-poppins">
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      Loading settings…
    </div>
  );

  /* ── Sidebar nav items ─────────────────────────────────────────────────── */
  const NAV: { key: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      key: 'account', label: 'Account & Security', desc: 'Profile, password',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    },
    {
      key: 'platform', label: 'Platform Settings', desc: 'Currency, payments, bank',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>,
    },
  ];

  return (
    <div className="font-poppins max-w-5xl">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="mb-7">
        <h1 className="text-[26px] font-semibold text-[#121514]">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your admin account and configure platform settings.</p>
      </div>

      {/* ── Layout: sidebar + content ─────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5">

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <aside className="w-full lg:w-56 flex-shrink-0">
          {/* Admin avatar card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-3 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-2xl bg-[#1C3B35] flex items-center justify-center text-white text-xl font-bold mb-3">
              {adminEmail ? adminEmail[0].toUpperCase() : 'A'}
            </div>
            <p className="text-sm font-semibold text-gray-800 truncate max-w-full">{adminEmail || 'Admin'}</p>
            <span className="mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 uppercase tracking-wide">Administrator</span>
          </div>

          {/* Nav */}
          <nav className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {NAV.map((n, i) => (
              <button
                key={n.key}
                onClick={() => setTab(n.key)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition group ${i > 0 ? 'border-t border-gray-50' : ''} ${tab === n.key ? 'bg-[#EAF2EE]' : 'hover:bg-gray-50'}`}
              >
                <span className={`flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center transition ${tab === n.key ? 'bg-[#1C3B35] text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
                  {n.icon}
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${tab === n.key ? 'text-[#1C3B35]' : 'text-gray-700'}`}>{n.label}</p>
                  <p className="text-[10px] text-gray-400 truncate">{n.desc}</p>
                </div>
                {tab === n.key && (
                  <svg className="w-3.5 h-3.5 text-[#1C3B35] ml-auto flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Content Panel ──────────────────────────────────────────────── */}
        <div className="flex-1 space-y-5">

          {/* ════════════════════════════════════════════════════════════════
              TAB: Account & Security
          ════════════════════════════════════════════════════════════════ */}
          {tab === 'account' && (
            <>
              {/* Profile info */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="h-8 w-8 rounded-xl bg-[#1C3B35]/8 flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#1C3B35]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#121514]">Profile Information</h2>
                      <p className="text-xs text-gray-400">Update your contact details.</p>
                    </div>
                  </div>
                </div>
                <Divider />
                <div className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Email Address"
                      value={adminEmail} readOnly
                      hint="Email cannot be changed from this panel."
                    />
                    <InputField
                      label="Phone Number"
                      value={adminPhone} onChange={setAdminPhone}
                      placeholder="+94 7X XXX XXXX"
                      hint="Used for account recovery and contact."
                    />
                  </div>
                  <Divider />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">Changes take effect immediately.</p>
                    <Btn onClick={saveAccount} loading={savingAccount}>Update Profile</Btn>
                  </div>
                </div>
              </div>

              {/* Change password */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#121514]">Change Password</h2>
                      <p className="text-xs text-gray-400">Use a strong password of at least 8 characters.</p>
                    </div>
                  </div>
                </div>
                <Divider />
                <div className="px-6 py-5 space-y-4">
                  <PasswordField
                    label="Current Password"
                    value={currentPw} onChange={setCurrentPw}
                    placeholder="Enter your current password"
                    show={showPw.current} onToggle={() => setShowPw(s => ({ ...s, current: !s.current }))}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <PasswordField
                        label="New Password"
                        value={newPw} onChange={setNewPw}
                        placeholder="At least 8 characters"
                        show={showPw.new} onToggle={() => setShowPw(s => ({ ...s, new: !s.new }))}
                      />
                      <StrengthBar password={newPw} />
                    </div>
                    <PasswordField
                      label="Confirm New Password"
                      value={confirmPw} onChange={setConfirmPw}
                      placeholder="Re-enter new password"
                      show={showPw.confirm} onToggle={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                      error={confirmPw && confirmPw !== newPw ? 'Passwords do not match' : undefined}
                      success={confirmPw && confirmPw === newPw && newPw ? 'Passwords match' : undefined}
                    />
                  </div>

                  {/* Requirements */}
                  <div className="bg-gray-50 rounded-xl px-4 py-3 grid grid-cols-2 gap-2">
                    {[
                      ['8+ characters', newPw.length >= 8],
                      ['Uppercase letter', /[A-Z]/.test(newPw)],
                      ['Number', /[0-9]/.test(newPw)],
                      ['Special character', /[^A-Za-z0-9]/.test(newPw)],
                    ].map(([label, met]) => (
                      <div key={label as string} className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          {met ? <polyline points="20 6 9 17 4 12"/> : <circle cx="12" cy="12" r="9"/>}
                        </svg>
                        {label as string}
                      </div>
                    ))}
                  </div>

                  <Divider />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">You'll remain logged in after changing your password.</p>
                    <Btn onClick={savePassword} loading={savingPw}>Change Password</Btn>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB: Platform Settings
          ════════════════════════════════════════════════════════════════ */}
          {tab === 'platform' && (
            <>
              {/* Currency */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="h-8 w-8 rounded-xl bg-[#1C3B35]/8 flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#1C3B35]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H9m0 0h4.5a1.5 1.5 0 010 3H9"/></svg>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#121514]">Platform Currency</h2>
                      <p className="text-xs text-gray-400">All prices will display in the selected currency.</p>
                    </div>
                  </div>
                </div>
                <Divider />
                <div className="px-6 py-5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CURRENCIES.map((c) => {
                      const sel = currency === c.code;
                      return (
                        <button key={c.code} type="button" onClick={() => setCurrency(c.code)}
                          className={`relative flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${sel ? 'border-[#1C3B35] bg-[#1C3B35]/5' : 'border-gray-200 hover:border-[#1C3B35]/30 bg-gray-50'}`}>
                          <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${sel ? 'border-[#1C3B35] bg-[#1C3B35]' : 'border-gray-300'}`}>
                            {sel && <div className="h-1.5 w-1.5 rounded-full bg-white"/>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{c.flag}</span>
                              <span className="text-sm font-bold text-gray-800">{c.code}</span>
                              <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 rounded">{c.symbol}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
                          </div>
                          {sel && (
                            <div className="h-5 w-5 rounded-full bg-[#1C3B35] flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-start gap-2 bg-[#EAF2EE] rounded-xl px-4 py-3">
                    <svg className="w-4 h-4 text-[#1C3B35] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p className="text-xs text-[#1C3B35]">
                      Changing currency only changes the <strong>symbol</strong> shown. Package prices are stored as numbers and will not be recalculated.
                    </p>
                  </div>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="h-8 w-8 rounded-xl bg-green-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#121514]">WhatsApp Contact</h2>
                      <p className="text-xs text-gray-400">Shown on the payment page for receipt submission.</p>
                    </div>
                  </div>
                </div>
                <Divider />
                <div className="px-6 py-5">
                  <InputField
                    label="WhatsApp Number"
                    value={whatsapp} onChange={setWhatsapp}
                    placeholder="+94 705 687 697"
                    hint="Include country code. Displayed on the checkout/payment page."
                  />
                </div>
              </div>

              {/* Bank Accounts */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="h-8 w-8 rounded-xl bg-[#1C3B35]/8 flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#1C3B35]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#121514]">Bank Account Details</h2>
                      <p className="text-xs text-gray-400">Two accounts displayed on the payment page for transfers.</p>
                    </div>
                  </div>
                </div>
                <Divider />
                <div className="px-6 py-5 space-y-4">
                  {[1, 2].map(i => {
                    const v = getBankVals(i);
                    return <BankBlock key={i} index={i} {...v} onChange={(f, val) => bankSetters[f]?.(val)} />;
                  })}
                </div>
              </div>

              {/* Save bar */}
              <div className="bg-white rounded-2xl border border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
                <p className="text-xs text-gray-400">Currency, WhatsApp & bank changes apply immediately across the platform.</p>
                <Btn onClick={savePlatform} loading={savingPlatform}>Save Platform Settings</Btn>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
