'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mn_token');
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

// ─── Type icon mapping ─────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  PAYMENT_APPROVED:         { icon: '✅', color: '#16a34a', bg: '#f0fdf4' },
  PAYMENT_REJECTED:         { icon: '❌', color: '#dc2626', bg: '#fef2f2' },
  BOOST_ACTIVATED:          { icon: '⚡', color: '#d97706', bg: '#fffbeb' },
  BOOST_EXPIRING_DAY:       { icon: '⏰', color: '#d97706', bg: '#fffbeb' },
  BOOST_EXPIRED:            { icon: '📉', color: '#6b7280', bg: '#f9fafb' },
  SUBSCRIPTION_ACTIVATED:   { icon: '🎉', color: '#2563eb', bg: '#eff6ff' },
  SUBSCRIPTION_EXPIRING_WEEK:{ icon: '⚠️', color: '#ca8a04', bg: '#fefce8' },
  SUBSCRIPTION_EXPIRING_DAY: { icon: '🚨', color: '#dc2626', bg: '#fef2f2' },
  SUBSCRIPTION_EXPIRED:     { icon: '📴', color: '#6b7280', bg: '#f9fafb' },
  NEW_MESSAGE:              { icon: '💬', color: '#7c3aed', bg: '#f5f3ff' },
  PROFILE_VISIBILITY_CHANGED: { icon: '👁️', color: '#0891b2', bg: '#ecfeff' },
  NEW_USER_REGISTERED:      { icon: '👤', color: '#16a34a', bg: '#f0fdf4' },
  NEW_SUBSCRIPTION_PAYMENT: { icon: '💳', color: '#2563eb', bg: '#eff6ff' },
  NEW_BOOST_PAYMENT:        { icon: '⚡', color: '#d97706', bg: '#fffbeb' },
  PAYMENT_PENDING_ADMIN:    { icon: '⏳', color: '#ca8a04', bg: '#fefce8' },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? { icon: '🔔', color: '#6b7280', bg: '#f9fafb' };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  meta?: Record<string, any>;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const unread = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    const data = await apiFetch('/notifications');
    if (data?.data) setNotifications(data.data);
  }, []);

  // Poll every 15s
  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 15000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    await apiFetch(`/notifications/${id}/read`, { method: 'POST' });
  };

  const markAllRead = async () => {
    setLoading(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await apiFetch('/notifications/read-all', { method: 'POST' });
    setLoading(false);
  };

  const handleOpen = () => {
    setOpen((o) => !o);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        id="notification-bell-btn"
        type="button"
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-gray-50 transition text-gray-500 focus:outline-none"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          id="notification-dropdown"
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-[999] rounded-2xl bg-white shadow-2xl shadow-black/10 ring-1 ring-black/5 overflow-hidden animate-in"
          style={{ animationDuration: '150ms' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 text-sm">Notifications</span>
              {unread > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-100 px-1.5 text-[10px] font-bold text-red-600">
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                disabled={loading}
                className="text-xs text-[#1C3B35] font-medium hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-400">
                <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = getConfig(n.type);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => markRead(n.id)}
                    className={`w-full text-left px-4 py-3 flex gap-3 items-start transition-colors hover:bg-gray-50 ${
                      n.isRead ? 'opacity-70' : ''
                    }`}
                  >
                    {/* Icon */}
                    <span
                      className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full text-base"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {cfg.icon}
                    </span>
                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm leading-tight truncate ${n.isRead ? 'font-normal text-gray-600' : 'font-semibold text-gray-800'}`}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                      <p className="mt-1 text-[10px] text-gray-400">{timeAgo(n.createdAt)}</p>
                    </div>
                    {/* Unread dot */}
                    {!n.isRead && (
                      <span className="shrink-0 mt-1.5 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 text-center">
              <p className="text-xs text-gray-400">Showing last 60 notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
