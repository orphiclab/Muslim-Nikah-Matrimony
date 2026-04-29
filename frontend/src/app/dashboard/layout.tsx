'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { profileApi } from '@/services/api';
import NotificationBell from '@/components/ui/NotificationBell';

const MEMBER_LOGO_SRC = '/images/muslimLogo1.png';

const navItems = [
  {
    href: '/dashboard/parent', label: 'Overview', exact: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/dashboard/profiles', label: 'My Profiles', exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: '/profiles', label: 'Browse Members', exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/dashboard/subscription', label: 'Subscription', exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    href: '/dashboard/boosts', label: 'Boosts', exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/chat', label: 'Messages', exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/settings', label: 'Settings', exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('mn_token');
    if (!token) { router.replace('/login'); return; }

    // Check JWT expiry without a library — decode the payload and check exp
    try {
      // JWT uses base64url — must convert -→+ and _→/ before atob()
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(b64));
      if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
        // Token is expired — clear stale session and redirect to login
        localStorage.removeItem('mn_token');
        localStorage.removeItem('mn_user');
        router.replace('/login');
        return;
      }
    } catch {
      // Malformed token — treat as expired
      localStorage.removeItem('mn_token');
      localStorage.removeItem('mn_user');
      router.replace('/login');
      return;
    }

    const u = JSON.parse(localStorage.getItem('mn_user') ?? '{}');
    setUser(u);

    if (u.role === 'ADMIN') { setChecking(false); return; }

    // Fetch profiles to decide whether the user needs to select a plan
    profileApi.getMyProfiles()
      .then((profRes) => {
        const fetchedProfiles: any[] = profRes.data ?? [];
        setProfiles(fetchedProfiles);

        if (fetchedProfiles.length === 0) {
          // No profiles at all — redirect to select a plan
          router.replace('/select-plan');
          return;
        }

        // If the user has exactly one profile and it has NO active subscription,
        // always redirect them to the purchase page for that profile.
        // Exception: PAYMENT_PENDING means payment was submitted — let them in.
        if (fetchedProfiles.length === 1) {
          const solo = fetchedProfiles[0];
          const hasActiveSub = solo.subscription?.status === 'ACTIVE';
          const hasPendingPayment = solo.status === 'PAYMENT_PENDING';
          if (!hasActiveSub && !hasPendingPayment) {
            router.replace(`/select-plan?profileId=${encodeURIComponent(solo.id)}`);
            return;
          }
        }

        // Multiple profiles, or the single profile already has an active subscription
        setChecking(false);
      })
      .catch((err: any) => {
        // If the token is invalid/expired, profileApi will throw 401
        // In that case clear auth and redirect to login
        const status = err?.status ?? err?.statusCode;
        if (status === 401) {
          localStorage.removeItem('mn_token');
          localStorage.removeItem('mn_user');
          router.replace('/login');
        } else {
          // Network/server error — don't kick the user out, just show dashboard
          setChecking(false);
        }
      });
  }, [router]);

  const logout = () => {
    localStorage.removeItem('mn_token');
    localStorage.removeItem('mn_user');
    window.dispatchEvent(new Event('mn_auth_change'));
    router.push('/login');
  };

  useEffect(() => {
    const stored = parseInt(localStorage.getItem('mn_unread') ?? '0', 10);
    if (!isNaN(stored)) setTotalUnread(stored);

    const handler = (e: Event) => {
      const count = (e as CustomEvent<number>).detail ?? 0;
      setTotalUnread(count);
    };
    window.addEventListener('mn_unread_change', handler);
    return () => window.removeEventListener('mn_unread_change', handler);
  }, []);

  const isActive = (item: { href: string; exact: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F9] font-poppins">
      <div className="text-center">
        <svg className="mx-auto mb-3 h-8 w-8 animate-spin text-[#1C3B35]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-sm text-gray-500">Checking your membership...</p>
      </div>
    </div>
  );

  const SidebarInner = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="mb-10 shrink-0">
        <Link
          href="/"
          onClick={onNavigate}
          className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
        >
          <img
            src={MEMBER_LOGO_SRC}
            alt="Muslim Nikah"
            className="h-auto w-full max-w-[220px] object-contain object-left"
            width={220}
            height={44}
          />
        </Link>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 lg:text-sm">
          Member Dashboard
        </p>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden pr-1">
          {navItems.map((item) => {
            const active = isActive(item);
            const isMessages = item.href === '/dashboard/chat';
            const showBadge = isMessages && totalUnread > 0 && !active;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-2xl py-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-black/15 focus-visible:ring-offset-2 ${
                  active ? '' : 'hover:opacity-90'
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                    active ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {item.icon}
                </span>
                <span
                  className={`min-w-0 flex-1 text-lg leading-tight ${
                    active ? 'font-semibold text-[#121514]' : 'font-medium text-[#7B7B7B]'
                  }`}
                >
                  {item.label}
                </span>
                {showBadge && (
                  <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#22C55E] px-1.5 text-[10px] font-bold text-white shadow">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="shrink-0 pt-8 flex flex-col gap-3">
          {/* Go to Website */}
          <Link
            href="/"
            onClick={onNavigate}
            className="flex w-full items-center gap-3 rounded-2xl py-1 text-left transition-colors outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-black/15 focus-visible:ring-offset-2"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </span>
            <span className="text-lg font-medium text-[#7B7B7B]">Go to Website</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              logout();
            }}
            className="flex w-full items-center gap-4 rounded-2xl py-1 text-left transition-colors outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-black/15 focus-visible:ring-offset-2"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span className="text-lg font-medium text-gray-500">Log Out</span>
          </button>
        </div>
      </nav>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#F4F6F9] font-poppins lg:gap-5 lg:p-3">
      {/* Desktop sidebar — same shell as admin */}
      <aside className="hidden w-64 shrink-0 flex-col rounded-[40px] bg-white p-8 shadow-sm ring-1 ring-black/5 lg:flex lg:min-h-[calc(100vh-2.5rem)]">
        <SidebarInner />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[min(100%,18rem)] overflow-y-auto rounded-r-[32px] bg-white p-8 shadow-xl ring-1 ring-black/5">
            <SidebarInner onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-visible lg:overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3.5 sm:px-6 xl:px-8 lg:rounded-[40px]">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="shrink-0 rounded-xl p-2 text-gray-500 transition hover:bg-gray-50 lg:hidden"
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="hidden min-w-0 items-center gap-2 text-sm text-gray-400 xl:flex">
              <span>Member</span>
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="font-medium capitalize text-gray-700">
                {navItems.find((n) => isActive(n))?.label ?? 'Overview'}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <NotificationBell />
            {/* Go to Website — header */}
            <Link
              href="/"
              title="Go to Website"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#EAF2EE] px-3 py-2 text-sm font-semibold text-[#1C3B35] shadow-sm transition-all hover:bg-[#1C3B35] hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C3B35]/35 focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span className="hidden sm:inline">Website</span>
            </Link>
            <div className="hidden h-6 w-px bg-gray-200 sm:block" />
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1C3B35] text-sm font-bold text-white">
                {user?.email?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="hidden xl:block">
                <p className="text-xs font-semibold leading-none text-gray-800 lg:text-sm">
                  {user?.email?.split('@')[0] ?? 'Member'}
                </p>
                <p className="mt-0.5 text-[10px] text-gray-400 lg:text-[12px]">{user?.email ?? ''}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Log out"
                className="ml-1 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#EAF2EE] px-3 py-2 text-sm font-semibold text-[#1C3B35] shadow-sm transition-all hover:bg-[#1C3B35] hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C3B35]/35 focus-visible:ring-offset-2 active:scale-[0.98] sm:px-3.5"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
                </svg>
                <span className="hidden xl:inline">Log out</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            {/* Suspended profile banner */}
            {profiles.filter(p => p.status === 'SUSPENDED').map(p => (
              <div key={p.id} className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-red-700">
                    Profile Suspended — {p.memberId} {p.name ? `(${p.name})` : ''}
                  </p>
                  <p className="mt-0.5 text-xs text-red-600">
                    This profile has been suspended by the admin and is not visible to other members.
                    {p.rejectionReason ? ` Reason: ${p.rejectionReason}` : ''}
                    {' '}Please contact support for more information.
                  </p>
                </div>
              </div>
            ))}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
