'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import NotificationBell from '@/components/ui/NotificationBell';

const ADMIN_LOGO_SRC = '/images/muslimLogo1.png';

/** Roles that may access the admin panel */
const ALLOWED_ROLES = ['ADMIN', 'MARKETING_MANAGER', 'STAFF'];

/** Role display config */
const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN: { label: 'Administrator', color: '#1C3B35', bg: '#EAF2EE' },
  MARKETING_MANAGER: { label: 'Marketing Manager', color: '#7c3aed', bg: '#f5f3ff' },
  STAFF: { label: 'Staff', color: '#1d4ed8', bg: '#eff6ff' },
};

const smsCampaignIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="13" y2="14" />
  </svg>
);

const smsCampaignSubItems = [
  { href: '/admin/sms-campaign', label: 'Dashboard', exact: true, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
  { href: '/admin/sms-campaign/send', label: 'Send Campaign', exact: false, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg> },
  { href: '/admin/sms-campaign/targeting', label: 'User Targeting', exact: false, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg> },
  { href: '/admin/sms-campaign/history', label: 'Campaign History', exact: false, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><polyline points="12 8 12 12 14 14" /><path d="M3.05 11a9 9 0 1 0 .5-3" /><polyline points="3 4 3 11 10 11" /></svg> },
  { href: '/admin/sms-campaign/templates', label: 'Templates', exact: false, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" /></svg> },
];

/** Nav items visible to ADMIN only */
const adminOnlyNavItems = [
  { href: '/admin', label: 'Dashboard', exact: true, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg> },
  { href: '/admin/analytics', label: 'Analytics', exact: false, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> },
  { href: '/admin/payments', label: 'Payment', exact: false, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg> },
  { href: '/admin/packages', label: 'Packages', exact: false, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg> },
  { href: '/admin/boosts', label: 'Boosts', exact: false, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg> },
  { href: '/admin/activity-log', label: 'Activity Log', exact: false, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg> },
  { href: '/admin/master-file', label: 'Master File', exact: false, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><line x1="9" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="15" y2="11" /></svg> },
];

/** Profiles nav item (ADMIN + STAFF) */
const profilesNavItem = {
  href: '/admin/profiles', label: 'Profiles', exact: false,
  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
};

const settingsNavItem = {
  href: '/admin/settings', label: 'Settings', exact: false,
  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
};

function NavLink({ item, active }: { item: { href: string; label: string; icon: React.ReactNode }; active: boolean }) {
  return (
    <Link href={item.href} className={`flex items-center gap-3 rounded-2xl py-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-black/15 focus-visible:ring-offset-2 ${active ? '' : 'hover:opacity-90'}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${active ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>{item.icon}</span>
      <span className={`text-lg leading-tight ${active ? 'font-semibold text-[#121514]' : 'font-medium text-[#7B7B7B]'}`}>{item.label}</span>
    </Link>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const smsCampaignOpen = pathname.startsWith('/admin/sms-campaign');
  const [smsExpanded, setSmsExpanded] = useState(smsCampaignOpen);
  const usersOpen = pathname.startsWith('/admin/users') || pathname.startsWith('/admin/edit-requests');
  const [usersExpanded, setUsersExpanded] = useState(usersOpen);

  useEffect(() => {
    const token = localStorage.getItem('mn_token');
    const raw = localStorage.getItem('mn_user');
    if (!token || !raw) { router.replace('/login'); return; }
    try {
      const u = JSON.parse(raw);
      if (!ALLOWED_ROLES.includes(u?.role)) { router.replace('/login'); return; }
      setUser(u);
    } catch { router.replace('/login'); return; }
    setChecking(false);
  }, [router]);

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F9]">
      <svg className="w-8 h-8 animate-spin text-[#1C3B35]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );

  const role: string = user?.role ?? 'ADMIN';
  const isAdmin = role === 'ADMIN';
  const isMarketing = role === 'MARKETING_MANAGER';
  const isStaff = role === 'STAFF';
  const roleMeta = ROLE_META[role] ?? ROLE_META['ADMIN'];

  const logout = () => {
    localStorage.removeItem('mn_token');
    localStorage.removeItem('mn_user');
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('mn_auth_change'));
    router.push('/login');
  };

  const isActive = (href: string, exact: boolean) => exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen flex font-poppins md:gap-5 md:p-3 bg-[#F4F6F9]">
      {/* ── Sidebar ── */}
      <aside className="hidden w-64 shrink-0 flex-col rounded-[40px] bg-white p-8 shadow-sm ring-1 ring-black/5 md:flex md:min-h-[calc(100vh-2.5rem)]">
        <div className="mb-8 shrink-0">
          <Link href="/" className="block outline-none focus-visible:ring-2 focus-visible:ring-black/20 rounded-lg">
            <img src={ADMIN_LOGO_SRC} alt="Muslim Nikah" className="h-auto w-full max-w-[220px] object-contain object-left" width={220} height={72} />
          </Link>
          {/* Role badge */}
          <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: roleMeta.bg, color: roleMeta.color }}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            {roleMeta.label}
          </span>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden pr-1">

            {/* ── ADMIN-only items ── */}
            {isAdmin && adminOnlyNavItems.map(item => (
              <NavLink key={item.href} item={item} active={isActive(item.href, item.exact)} />
            ))}

            {/* ── Profiles (ADMIN + STAFF) ── */}
            {(isAdmin || isStaff) && (
              <NavLink item={profilesNavItem} active={isActive(profilesNavItem.href, profilesNavItem.exact)} />
            )}

            {/* ── Users collapsible (ADMIN only) ── */}
            {isAdmin && (
              <div>
                <button type="button" onClick={() => setUsersExpanded(v => !v)}
                  className="flex w-full items-center gap-3 rounded-2xl py-1 transition-colors outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-black/15 focus-visible:ring-offset-2">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${usersOpen ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  </span>
                  <span className={`flex-1 text-left text-lg leading-tight ${usersOpen ? 'font-semibold text-[#121514]' : 'font-medium text-[#7B7B7B]'}`}>Users</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${usersExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
                {usersExpanded && (
                  <div className="mt-2 ml-3 flex flex-col gap-1 border-l-2 border-gray-100 pl-4">
                    {[{ href: '/admin/users', label: 'Manage Users' }, { href: '/admin/edit-requests', label: 'Edit Requests' }].map(sub => {
                      const subActive = pathname.startsWith(sub.href);
                      return (
                        <Link key={sub.href} href={sub.href}
                          className={`flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm transition-colors ${subActive ? 'bg-gray-100 font-semibold text-[#121514]' : 'font-medium text-[#7B7B7B] hover:bg-gray-50 hover:text-[#121514]'}`}>
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${subActive ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                          </span>
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── SMS Campaign collapsible (ADMIN + MARKETING_MANAGER) ── */}
            {(isAdmin || isMarketing) && (
              <div>
                <button type="button" onClick={() => setSmsExpanded(v => !v)}
                  className="flex w-full items-center gap-3 rounded-2xl py-1 transition-colors outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-black/15 focus-visible:ring-offset-2">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${smsCampaignOpen ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {smsCampaignIcon}
                  </span>
                  <span className={`flex-1 text-left text-lg leading-tight ${smsCampaignOpen ? 'font-semibold text-[#121514]' : 'font-medium text-[#7B7B7B]'}`}>SMS Campaign</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${smsExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
                {smsExpanded && (
                  <div className="mt-2 ml-3 flex flex-col gap-1 border-l-2 border-gray-100 pl-4">
                    {smsCampaignSubItems.map(sub => {
                      const subActive = sub.exact ? pathname === sub.href : pathname.startsWith(sub.href);
                      return (
                        <Link key={sub.href} href={sub.href}
                          className={`flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm transition-colors ${subActive ? 'bg-gray-100 font-semibold text-[#121514]' : 'font-medium text-[#7B7B7B] hover:bg-gray-50 hover:text-[#121514]'}`}>
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${subActive ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>{sub.icon}</span>
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Settings (all roles) ── */}
            <NavLink item={settingsNavItem} active={isActive(settingsNavItem.href, settingsNavItem.exact)} />
          </div>

          <div className="shrink-0 pt-8">
            <button type="button" onClick={logout}
              className="flex w-full items-center gap-4 rounded-2xl py-1 text-left transition-colors outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-black/15 focus-visible:ring-offset-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </span>
              <span className="text-lg font-medium text-gray-500">Log Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="bg-white border-b rounded-[40px] border-gray-100 px-8 py-3.5 flex items-center justify-end gap-4 flex-shrink-0">
          <NotificationBell />
          <div className="w-px h-6 bg-gray-200" />
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: roleMeta.color }}>
              {user?.email?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs md:text-sm font-semibold text-gray-800 leading-none">{user?.email?.split('@')[0] ?? 'Admin'}</p>
              <p className="text-[10px] md:text-[12px] mt-0.5" style={{ color: roleMeta.color }}>{roleMeta.label}</p>
            </div>
            <button type="button" onClick={logout} title="Log out"
              className="ml-1 inline-flex items-center gap-2 rounded-xl cursor-pointer bg-[#EAF2EE] px-3.5 py-2 text-sm font-semibold text-[#1C3B35] shadow-sm transition-all hover:bg-[#1C3B35] hover:text-white hover:shadow-md focus:outline-none active:scale-[0.98]">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" /><line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
              </svg>
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="px-8 py-7 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
