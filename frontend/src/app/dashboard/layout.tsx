'use client';

import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem('mn_token');
    localStorage.removeItem('mn_user');
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard/parent', label: 'Overview', icon: '🏠' },
    { href: '/dashboard/profiles', label: 'My Profiles', icon: '👤' },
    { href: '/dashboard/subscription', label: 'Subscription', icon: '💳' },
    { href: '/dashboard/chat', label: 'Messages', icon: '💬' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-poppins">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1B6B4A] text-white flex flex-col shadow-xl min-h-screen hidden md:flex flex-shrink-0">
        <div className="px-6 py-5 border-b border-white/10">
          <a href="/" className="block">
            <h1 className="font-bold text-lg tracking-wide">Muslim Nikah</h1>
            <p className="text-white/60 text-xs mt-0.5">Member Dashboard</p>
          </a>
        </div>

        <nav className="flex-1 px-4 py-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <a key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}>
                <span className="text-base">{item.icon}</span>
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <button onClick={logout}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition w-full">
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden w-full fixed top-0 left-0 right-0 z-50 bg-[#1B6B4A] px-4 py-3 flex items-center justify-between shadow-md">
        <span className="text-white font-bold text-sm tracking-wide">Muslim Nikah</span>
        <div className="flex gap-3">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}
              className={`text-lg ${pathname === item.href ? 'opacity-100' : 'opacity-50'}`}
              title={item.label}>
              {item.icon}
            </a>
          ))}
          <button onClick={logout} className="text-lg opacity-50 hover:opacity-100">🚪</button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto md:pt-0 pt-14">
        <div className="px-6 py-8 max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
