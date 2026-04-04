'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { getApiOrigin } from '@/lib/apiOrigin';

const BACKEND_URL = getApiOrigin();

/**
 * Silently connects every page to the /traffic Socket.IO namespace.
 * Sends: initial presence via query param, then `page_change` on SPA navigation.
 * Admins pass role=ADMIN so the gateway adds them to admin_room.
 */
export function useTrafficBeacon() {
  const pathname = usePathname();
  const socketRef = useRef<Socket | null>(null);
  const pageRef = useRef<string>(pathname);

  useEffect(() => {
    // Read role from localStorage (safe on client)
    let role = 'GUEST';
    try {
      const u = JSON.parse(localStorage.getItem('mn_user') ?? '{}');
      if (u?.role) role = u.role;
    } catch { /* ignore */ }

    // Create socket if not connected yet
    if (!socketRef.current) {
      socketRef.current = io(`${BACKEND_URL}/traffic`, {
        transports: ['websocket'],
        reconnectionDelay: 2000,
        query: { page: pathname, role },
      });
    }

    return () => {
      // Keep socket alive across navigations — disconnect on unmount only
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On pathname change → send page_change event
  useEffect(() => {
    pageRef.current = pathname;
    if (socketRef.current?.connected) {
      socketRef.current.emit('page_change', { page: pathname });
    }
  }, [pathname]);

  // Cleanup on full unmount (app close)
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);
}
