'use client';

import { usePathname } from 'next/navigation';
import FooterInner from './footer';

export default function FooterWrapper() {
  const pathname = usePathname();
  // Hide on all internal dashboard / admin routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) return null;
  return <FooterInner />;
}
