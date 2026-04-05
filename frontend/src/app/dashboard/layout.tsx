'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { subscriptionApi, profileApi } from '@/services/api';

const MEMBER_LOGO_SRC = '/images/logo%201.png';

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('mn_token');
    if (!token) { router.replace('/login'); return; }

    // Check JWT expiry without a library — decode the payload and check exp
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
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
        const profiles: any[] = profRes.data ?? [];
        // If user has ANY profile (in any status), let them into the dashboard
        if (profiles.length > 0) {
          setChecking(false);
          return;
        }
        // No profiles at all — check subscriptions as a fallback
        return subscriptionApi.mySubscriptions()
          .then((subRes) => {
            const hasAny = (subRes.data ?? []).length > 0;
            if (hasAny) {
              setChecking(false);
            } else {
              router.replace('/select-plan');
            }
          })
          .catch(() => {
            // Can't verify subscription — redirect to be safe
            router.replace('/select-plan');
          });
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
            height={72}
          />
        </Link>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 md:text-sm">
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

        <div className="shrink-0 pt-8">
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
    <div className="flex min-h-screen bg-[#F4F6F9] font-poppins md:gap-5 md:p-3">
      {/* Desktop sidebar — same shell as admin */}
      <aside className="hidden w-64 shrink-0 flex-col rounded-[40px] bg-white p-8 shadow-sm ring-1 ring-black/5 md:flex md:min-h-[calc(100vh-2.5rem)]">
        <SidebarInner />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
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

      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 bg-white px-4 py-3.5 sm:px-8 md:rounded-[40px]">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="shrink-0 rounded-xl p-2 text-gray-500 transition hover:bg-gray-50 md:hidden"
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="hidden min-w-0 items-center gap-2 text-sm text-gray-400 md:flex">
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
            <button type="button" className="relative rounded-xl p-2 text-gray-500 transition hover:bg-gray-50">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            </button>
            <div className="hidden h-6 w-px bg-gray-200 sm:block" />
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1C3B35] text-sm font-bold text-white">
                {user?.email?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold leading-none text-gray-800 md:text-sm">
                  {user?.email?.split('@')[0] ?? 'Member'}
                </p>
                <p className="mt-0.5 text-[10px] text-gray-400 md:text-[12px]">{user?.email ?? ''}</p>
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
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 md:px-8 md:py-7">{children}</div>
        </main>
      </div>
    </div>
  );
}
