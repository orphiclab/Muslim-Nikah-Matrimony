'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  {
    href: '/admin', label: 'Dashboard', exact: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/admin/users', label: 'Membership', exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/admin/chat', label: 'Chat', exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: '/admin/profiles', label: 'Master File', exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    href: '/admin/posts', label: 'User Posts', exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M4 6h16M4 10h16M4 14h10" /><rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    ),
  },
  {
    href: '/admin/payments', label: 'Payment', exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    href: '/admin/packages', label: 'Packages', exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    href: '/admin/profile', label: 'Profile', exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('mn_user');
    if (u) setUser(JSON.parse(u));
  }, []);

  const logout = () => {
    localStorage.removeItem('mn_token');
    localStorage.removeItem('mn_user');
    router.push('/login');
  };

  const isActive = (item: { href: string; exact: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className={`min-h-screen flex font-poppins ${dark ? 'bg-gray-900' : 'bg-[#F4F6F9]'}`}>
      {/* ── Sidebar ── */}
      <aside className="w-60 bg-[#1C3B35] text-white flex flex-col shadow-2xl min-h-screen hidden md:flex flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <a href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#D4A843] flex items-center justify-center flex-shrink-0">
              <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold leading-tight tracking-wide">Muslim Nikah</p>
              <p className="text-[10px] text-white/50 leading-tight">Admin Panel</p>
            </div>
          </a>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <a key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 ${
                  active
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                }`}>
                <span className={active ? 'text-white' : 'text-white/50'}>{item.icon}</span>
                {item.label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D4A843]" />}
              </a>
            );
          })}
        </nav>

        {/* Log Out */}
        <div className="px-3 pb-5 border-t border-white/10 pt-3">
          <button onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-[13.5px] font-medium text-white/60 hover:text-white hover:bg-white/8 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log Out
          </button>
        </div>
      </aside>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top header */}
        <header className="bg-white border-b border-gray-100 px-8 py-3.5 flex items-center justify-end gap-4 flex-shrink-0">
          {/* Bell */}
          <button className="relative p-2 rounded-xl hover:bg-gray-50 transition text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
          </button>
          {/* Dark mode toggle */}
          <button onClick={() => setDark((d) => !d)}
            className="p-2 rounded-xl hover:bg-gray-50 transition text-gray-500">
            {dark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          {/* Divider */}
          <div className="w-px h-6 bg-gray-200" />
          {/* User */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-[#1C3B35] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-gray-800 leading-none">{user?.email?.split('@')[0] ?? 'Admin'}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{user?.email ?? 'admin@muslimnikah.com'}</p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="px-8 py-7 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
