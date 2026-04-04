'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getApiOrigin } from '@/lib/apiOrigin';

const BACKEND_URL = getApiOrigin();

interface PageStat { page: string; count: number }
interface TrafficStats { total: number; pages: PageStat[]; timestamp: number }

// Friendly page names
function pageName(page: string) {
  const map: Record<string, string> = {
    '/': 'Home',
    '/profiles': 'Browse Profiles',
    '/packages': 'Packages',
    '/about': 'About Us',
    '/contact': 'Contact',
    '/login': 'Login',
    '/register': 'Register',
    '/select-plan': 'Select Plan',
    '/dashboard/parent': 'Dashboard Home',
    '/dashboard/profiles': 'My Profiles',
    '/dashboard/members': 'Browse Members',
    '/dashboard/chat': 'Messages',
    '/dashboard/subscription': 'Subscription',
  };
  return map[page] ?? page;
}

// Page emoji
function pageIcon(page: string) {
  if (page === '/') return '🏠';
  if (page.includes('profiles')) return '👤';
  if (page.includes('packages') || page.includes('plan')) return '💳';
  if (page.includes('chat') || page.includes('messages')) return '💬';
  if (page.includes('login')) return '🔑';
  if (page.includes('register')) return '📝';
  if (page.includes('about')) return 'ℹ️';
  if (page.includes('contact')) return '📞';
  if (page.includes('dashboard')) return '📊';
  if (page.includes('subscription')) return '⭐';
  return '📄';
}

// Mini pulse animation dot
function PulseDot({ color = '#22C55E' }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
      <span
        className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
        style={{ backgroundColor: color }}
      />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: color }} />
    </span>
  );
}

// Tiny sparkline history bar
function HistoryBar({ history }: { history: number[] }) {
  const max = Math.max(...history, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {history.map((v, i) => (
        <div
          key={i}
          className="w-1.5 rounded-sm transition-all duration-300"
          style={{
            height: `${Math.max(4, Math.round((v / max) * 32))}px`,
            backgroundColor: i === history.length - 1 ? '#1C3B35' : '#D1EAE2',
          }}
        />
      ))}
    </div>
  );
}

export default function LiveTrafficWidget() {
  const [stats, setStats] = useState<TrafficStats | null>(null);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState<number[]>(Array(20).fill(0));
  const [lastUpdated, setLastUpdated] = useState<string>('—');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('mn_token') ?? '';

    const socket = io(`${BACKEND_URL}/traffic`, {
      transports: ['websocket'],
      query: {
        page: '/admin/analytics',
        role: 'ADMIN',
      },
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('traffic_update', (data: TrafficStats) => {
      setStats(data);
      setHistory((prev) => {
        const next = [...prev.slice(1), data.total];
        return next;
      });
      setLastUpdated(new Date(data.timestamp).toLocaleTimeString());
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const total = stats?.total ?? 0;
  const pages = stats?.pages ?? [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <h2 className="font-medium font-poppins text-[#121514] subtitle">Live Site Traffic</h2>
            <p className="text-[11px] md:text-sm lg:text-base text-gray-400">Real-time active visitors</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <>
              <PulseDot color="#22C55E" />
              <span className="text-[11px] md:text-sm lg:text-base font-semibold text-emerald-600">Live</span>
            </>
          ) : (
            <>
              <PulseDot color="#EF4444" />
              <span className="text-[11px] font-semibold text-red-500">Connecting…</span>
            </>
          )}
        </div>
      </div>

      {/* Big counter */}
      <div className="px-6 pt-5 pb-2 flex items-end gap-5">
        <div>
          <p className="text-[11px] text-gray-400 font-medium mb-0.5">RIGHT NOW</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-gray-900 tabular-nums leading-none">
              {total}
            </span>
            <span className="text-sm font-medium text-gray-400">visitor{total !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="flex-1 pb-1">
          <HistoryBar history={history} />
          <p className="text-[10px] text-gray-300 mt-1 text-right">last 20 updates</p>
        </div>
      </div>

      {/* Page breakdown */}
      <div className="px-6 pb-5">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Pages — {pages.length} active
        </p>

        {pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-300">
            <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <p className="text-sm">No visitors right now</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pages.map(({ page, count }) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={page} className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <span className="text-base flex-shrink-0">{pageIcon(page)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">{pageName(page)}</span>
                      <span className="text-xs font-bold text-gray-600 ml-2 flex-shrink-0">
                        {count} <span className="font-normal text-gray-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-500 to-emerald-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{page}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">
          Auto-updates via WebSocket · Updated: <span className="font-semibold text-gray-600">{lastUpdated}</span>
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Real-time
        </div>
      </div>
    </div>
  );
}
