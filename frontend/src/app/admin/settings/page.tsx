'use client';

import { useEffect, useState } from 'react';
import { adminApi, userApi } from '@/services/api';

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Types                                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */
type Tab = 'account' | 'security' | 'platform';

function getAdminRole(): string {
  if (typeof window === 'undefined') return 'ADMIN';
  try { return JSON.parse(localStorage.getItem('mn_user') ?? '{}')?.role ?? 'ADMIN'; }
  catch { return 'ADMIN'; }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Toast                                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold animate-slideUp"
      style={{
        background: ok
          ? 'linear-gradient(135deg,#1C3B35,#2a5548)'
          : 'linear-gradient(135deg,#dc2626,#b91c1c)',
        color: '#fff',
        boxShadow: ok
          ? '0 8px 32px rgba(28,59,53,0.35)'
          : '0 8px 32px rgba(220,38,38,0.35)',
      }}
    >
      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${ok ? 'bg-white/20' : 'bg-white/20'}`}>
        {ok ? '✓' : '✕'}
      </div>
      {msg}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Section wrapper                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */
function Section({
  icon, iconBg = '#EAF2EE', iconColor = '#1C3B35', title, subtitle, children,
}: {
  icon: React.ReactNode; iconBg?: string; iconColor?: string;
  title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 flex items-center gap-4 border-b border-gray-100">
        <div
          className="h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#121514]">{title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {/* Body */}
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  InputField                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */
function InputField({
  label, value, onChange, placeholder, type = 'text', mono = false, readOnly = false, hint,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; mono?: boolean; readOnly?: boolean; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200
          ${readOnly
            ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-50 border-gray-200 text-gray-800 focus:bg-white focus:border-[#1C3B35] focus:shadow-[0_0_0_3px_rgba(28,59,53,0.1)]'}
          ${mono ? 'font-mono' : ''}`}
      />
      {hint && <p className="text-[11px] text-gray-400 leading-snug">{hint}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  PasswordField                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */
function PasswordField({
  label, value, onChange, placeholder, show, onToggle, error, success,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; show: boolean; onToggle: () => void;
  error?: string; success?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full border rounded-xl px-4 py-2.5 pr-11 text-sm text-gray-800 bg-gray-50 focus:bg-white outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(28,59,53,0.1)]
            ${error ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-[#1C3B35]'}`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-0.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {show
              ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
              : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
          </svg>
        </button>
      </div>
      {error && <p className="text-xs text-red-500 font-medium flex items-center gap-1"><span>⚠</span>{error}</p>}
      {success && <p className="text-xs text-emerald-600 font-medium flex items-center gap-1"><span>✓</span>{success}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Strength Bar                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */
function StrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const configs = [
    { label: 'Weak', color: '#f87171', bg: 'bg-red-400' },
    { label: 'Fair', color: '#fbbf24', bg: 'bg-amber-400' },
    { label: 'Good', color: '#60a5fa', bg: 'bg-blue-400' },
    { label: 'Strong', color: '#34d399', bg: 'bg-emerald-400' },
  ];
  const cfg = configs[score - 1] ?? configs[0];
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? cfg.bg : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <span className="text-[11px] font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Primary Button                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */
function PrimaryBtn({
  onClick, loading, children, fullWidth = false,
}: {
  onClick: () => void; loading?: boolean; children: React.ReactNode; fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 text-sm px-5 py-2.5 text-white ${fullWidth ? 'w-full' : ''}`}
      style={{
        background: 'linear-gradient(135deg, #1C3B35 0%, #2a5548 100%)',
        boxShadow: '0 4px 14px rgba(28,59,53,0.3)',
      }}
      onMouseEnter={e => !loading && ((e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(28,59,53,0.4)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(28,59,53,0.3)')}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {loading ? 'Saving…' : children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Bank Block                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */
function BankBlock({
  index, accName, accNo, bankName, branch, onChange,
}: {
  index: number; accName: string; accNo: string; bankName: string; branch: string;
  onChange: (f: string, v: string) => void;
}) {
  const p = `bank${index}`;
  const colors = ['#1C3B35', '#2563eb'];
  const bgs = ['#EAF2EE', '#EFF6FF'];

  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ background: bgs[index - 1] }}
      >
        <div
          className="h-7 w-7 rounded-xl flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0"
          style={{ background: colors[index - 1] }}
        >
          {index}
        </div>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors[index - 1] }}>
          Bank Account #{index}
        </span>
      </div>
      <div className="p-4 bg-gray-50/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InputField label="Account Name" value={accName} onChange={v => onChange(`${p}AccName`, v)} placeholder="e.g. M T M Akram" />
        <InputField label="Account Number" value={accNo} onChange={v => onChange(`${p}AccNo`, v)} placeholder="e.g. 112054094468" mono />
        <InputField label="Bank" value={bankName} onChange={v => onChange(`${p}BankName`, v)} placeholder="e.g. Sampath Bank PLC" />
        <InputField label="Branch" value={branch} onChange={v => onChange(`${p}Branch`, v)} placeholder="e.g. Ratmalana" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Password Requirements                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */
function PwRequirements({ password }: { password: string }) {
  const reqs = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3.5 grid grid-cols-2 gap-2.5">
      {reqs.map(({ label, met }) => (
        <div key={label} className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-emerald-600' : 'text-gray-400'}`}>
          <div className={`h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${met ? 'bg-emerald-100' : 'bg-gray-200'}`}>
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              {met ? <polyline points="20 6 9 17 4 12" /> : <line x1="8" y1="8" x2="16" y2="16" />}
            </svg>
          </div>
          <span className="font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Stat Card (sidebar info pill)                                               */
/* ─────────────────────────────────────────────────────────────────────────── */
function InfoPill({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
      <div className="h-8 w-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500 shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-xs font-semibold text-gray-700 truncate mt-0.5">{value}</p>
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
  const [adminRole, setAdminRole] = useState<string>('ADMIN');

  useEffect(() => { setAdminRole(getAdminRole()); }, []);

  const canAccessPlatform = adminRole === 'ADMIN';

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
      showToast('Account updated successfully!');
    } catch (e: any) { showToast(e.message ?? 'Failed to update', false); }
    finally { setSavingAccount(false); }
  };

  const savePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { showToast('All password fields are required.', false); return; }
    if (newPw !== confirmPw) { showToast('New passwords do not match.', false); return; }
    if (newPw.length < 8) { showToast('Password must be at least 8 characters.', false); return; }
    setSavingPw(true);
    try {
      await userApi.changePassword({ currentPassword: currentPw, newPassword: newPw });
      showToast('Password changed successfully!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e: any) { showToast(e.message ?? 'Failed to change password', false); }
    finally { setSavingPw(false); }
  };

  const savePlatform = async () => {
    setSavingPlatform(true);
    try {
      await adminApi.updateSiteSettings({
        whatsappContact: whatsapp,
        bank1AccName: b1n, bank1AccNo: b1no, bank1BankName: b1b, bank1Branch: b1br,
        bank2AccName: b2n, bank2AccNo: b2no, bank2BankName: b2b, bank2Branch: b2br,
      });
      showToast('Platform settings saved!');
    } catch (e: any) { showToast(e.message ?? 'Failed to save', false); }
    finally { setSavingPlatform(false); }
  };

  /* ── Nav config ─────────────────────────────────────────────────────────── */
  const ALL_NAV: { key: Tab; label: string; desc: string; icon: React.ReactNode; accent: string }[] = [
    {
      key: 'account', label: 'My Account', desc: 'Profile & contact info',
      accent: '#1C3B35',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      key: 'security', label: 'Security', desc: 'Password & access',
      accent: '#2563eb',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
    {
      key: 'platform', label: 'Platform', desc: 'Currency, payments, banks',
      accent: '#7c3aed',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0M12 2v2M12 20v2M2 12h2M20 12h2" />
        </svg>
      ),
    },
  ];
  const NAV = canAccessPlatform ? ALL_NAV : ALL_NAV.filter(n => n.key !== 'platform');

  /* Loading */
  if (pageLoading) return (
    <div className="flex flex-col items-center justify-center h-72 gap-4">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-[#EAF2EE]" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#1C3B35] animate-spin" />
      </div>
      <p className="text-sm text-gray-400 font-medium">Loading settings…</p>
    </div>
  );

  const activeTab = NAV.find(n => n.key === tab)!;

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp .3s ease both; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn .25s ease both; }
      `}</style>

      <div className="font-poppins">
        {toast && <Toast msg={toast.msg} ok={toast.ok} />}

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#121514] tracking-tight">Settings</h1>
            <p className="text-sm text-gray-400 mt-1">Manage your admin account and platform configuration.</p>
          </div>
          {/* Active tab badge */}
          <div
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider text-white"
            style={{ background: `linear-gradient(135deg, ${activeTab.accent}, ${activeTab.accent}cc)`, boxShadow: `0 4px 14px ${activeTab.accent}40` }}
          >
            {activeTab.icon}
            {activeTab.label}
          </div>
        </div>

        {/* ── Layout ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar ───────────────────────────────────────────────────── */}
          <aside className="w-full lg:w-60 flex-shrink-0 flex flex-col gap-4">

            {/* Admin avatar card */}
            <div
              className="rounded-3xl p-5 flex flex-col items-center text-center overflow-hidden relative"
              style={{ background: 'linear-gradient(145deg, #1C3B35 0%, #2a5548 100%)', boxShadow: '0 8px 32px rgba(28,59,53,0.25)' }}
            >
              {/* Background decoration */}
              <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/5" />
              <div className="absolute -bottom-8 -left-4 h-28 w-28 rounded-full bg-white/5" />
              {/* Avatar */}
              <div className="relative h-16 w-16 rounded-2xl bg-white/15 flex items-center justify-center text-white text-2xl font-extrabold mb-3 border border-white/20">
                {adminEmail ? adminEmail[0].toUpperCase() : 'A'}
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-400 border-2 border-[#1C3B35] flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              </div>
              <p className="text-sm font-bold text-white truncate max-w-full">{adminEmail || 'Admin'}</p>
              {adminPhone && <p className="text-[11px] text-white/60 mt-0.5 truncate">{adminPhone}</p>}
              <span className="mt-2.5 text-[10px] font-extrabold px-3 py-1 rounded-full bg-white/15 text-white/90 uppercase tracking-widest border border-white/20">
                Administrator
              </span>
            </div>

            {/* Info pills */}
            <div className="flex flex-col gap-2">
              <InfoPill
                label="Role"
                value="Super Admin"
                icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
              />
              <InfoPill
                label="Status"
                value="Active & Verified"
                icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>}
              />
            </div>

            {/* Nav */}
            <nav className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="px-3 py-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 py-2">Navigation</p>
              </div>
              <div className="px-2 pb-2 flex flex-col gap-1">
                {NAV.map((n) => {
                  const active = tab === n.key;
                  return (
                    <button
                      key={n.key}
                      onClick={() => setTab(n.key)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all duration-200 ${active ? 'bg-gray-50' : 'hover:bg-gray-50/80'}`}
                    >
                      {/* Icon bubble */}
                      <span
                        className="flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200"
                        style={active
                          ? { background: n.accent, color: '#fff', boxShadow: `0 4px 12px ${n.accent}50` }
                          : { background: '#F4F6F9', color: '#9ca3af' }
                        }
                      >
                        {n.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate transition-colors ${active ? 'text-[#121514]' : 'text-gray-600'}`}>{n.label}</p>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{n.desc}</p>
                      </div>
                      {active && (
                        <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: n.accent }}>
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>
          </aside>

          {/* ── Content ───────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 animate-fadeIn" key={tab}>

            {/* ══════════════════════════════════════════════════════════════
                TAB: My Account
            ══════════════════════════════════════════════════════════════ */}
            {tab === 'account' && (
              <div className="space-y-5">
                <Section
                  title="Profile Information"
                  subtitle="Update your contact details and personal info."
                  iconBg="#EAF2EE"
                  iconColor="#1C3B35"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <InputField
                      label="Email Address"
                      value={adminEmail}
                      readOnly
                      hint="Email address cannot be changed from this panel."
                    />
                    <InputField
                      label="Phone Number"
                      value={adminPhone}
                      onChange={setAdminPhone}
                      placeholder="+94 7X XXX XXXX"
                      hint="Used for account recovery and contact."
                    />
                  </div>

                  {/* Info notice */}
                  <div className="flex items-start gap-3 bg-[#EAF2EE] rounded-2xl px-4 py-3.5 mb-5">
                    <svg className="w-4 h-4 text-[#1C3B35] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-xs text-[#1C3B35] font-medium leading-relaxed">
                      Changes to your contact details take effect <strong>immediately</strong> and will be reflected across the system.
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                    <p className="text-xs text-gray-400">Last updated: just now</p>
                    <PrimaryBtn onClick={saveAccount} loading={savingAccount}>Save Changes</PrimaryBtn>
                  </div>
                </Section>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB: Security
            ══════════════════════════════════════════════════════════════ */}
            {tab === 'security' && (
              <div className="space-y-5">
                <Section
                  title="Change Password"
                  subtitle="Use a strong password of at least 8 characters."
                  iconBg="#EFF6FF"
                  iconColor="#2563eb"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  }
                >
                  <div className="space-y-4 mb-5">
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

                    <PwRequirements password={newPw} />
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                    <p className="text-xs text-gray-400">You'll stay logged in after changing your password.</p>
                    <PrimaryBtn onClick={savePassword} loading={savingPw}>Update Password</PrimaryBtn>
                  </div>
                </Section>

                {/* Security tips */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <h3 className="text-sm font-bold text-[#121514]">Security Tips</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {[
                      'Use a unique password not used on other sites.',
                      'Enable 2FA when available for extra protection.',
                      'Never share your admin credentials with anyone.',
                      'Change your password regularly (every 90 days).',
                    ].map((tip) => (
                      <li key={tip} className="flex items-start gap-2.5 text-xs text-gray-500">
                        <div className="h-4 w-4 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        </div>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB: Platform
            ══════════════════════════════════════════════════════════════ */}
            {tab === 'platform' && (
              <div className="space-y-5">


                {/* WhatsApp */}
                <Section
                  title="WhatsApp Contact"
                  subtitle="Shown on the payment page so users can submit payment receipts."
                  iconBg="#F0FDF4"
                  iconColor="#16a34a"
                  icon={
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  }
                >
                  <div className="max-w-sm">
                    <InputField
                      label="WhatsApp Number"
                      value={whatsapp}
                      onChange={setWhatsapp}
                      placeholder="+94 705 687 697"
                      hint="Include country code. This number is shown on the checkout & payment confirmation page."
                    />
                  </div>
                </Section>

                {/* Bank Accounts */}
                <Section
                  title="Bank Account Details"
                  subtitle="Two bank accounts shown on the payment page for direct transfers."
                  iconBg="#EAF2EE"
                  iconColor="#1C3B35"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  }
                >
                  <div className="space-y-4">
                    {[1, 2].map(i => {
                      const v = getBankVals(i);
                      return <BankBlock key={i} index={i} {...v} onChange={(f, val) => bankSetters[f]?.(val)} />;
                    })}
                  </div>
                </Section>

                {/* Save bar */}
                <div
                  className="rounded-3xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  style={{ background: 'linear-gradient(135deg, #1C3B35 0%, #2a5548 100%)', boxShadow: '0 8px 32px rgba(28,59,53,0.25)' }}
                >
                  <div>
                    <p className="text-sm font-bold text-white">Ready to apply changes?</p>
                    <p className="text-xs text-white/60 mt-0.5">Currency, WhatsApp &amp; bank changes apply immediately across the platform.</p>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      type="button"
                      onClick={savePlatform}
                      disabled={savingPlatform}
                      className="inline-flex items-center gap-2 font-bold rounded-2xl transition-all duration-200 disabled:opacity-60 text-sm px-6 py-3 bg-white text-[#1C3B35] hover:bg-gray-50"
                      style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}
                    >
                      {savingPlatform ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                      {savingPlatform ? 'Saving…' : 'Save Platform Settings'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
