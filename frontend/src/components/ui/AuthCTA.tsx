'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import MainButton from '@/components/ui/mainbtn';

interface AuthCTAProps {
  /** Extra classes for the wrapper div */
  className?: string;
  /** Style variant — controls button colours to match dark/light backgrounds */
  variant?: 'dark' | 'light';
  primaryBtnClassName?: string;
  secondaryBtnClassName?: string;
}

/**
 * Shows different CTA buttons based on auth state:
 *  - Not logged in  → "Register Now"  +  "Login"
 *  - Logged in      → "Browse Profiles"  +  "See All Plans"
 */
export default function AuthCTA({
  className = 'flex items-center gap-4 flex-wrap',
  variant = 'light',
  primaryBtnClassName = '',
  secondaryBtnClassName = '',
}: AuthCTAProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('mn_token');
    setIsLoggedIn(!!token);
  }, []);

  // Dark variant = white border / gold text (used on dark/green backgrounds)
  const secondaryDark =
    'border border-white/60 text-[#DB9D30] font-semibold px-7 py-3 rounded-full text-[15px] font-poppins hover:bg-white/10 transition-all duration-200';
  // Light variant = green border / gold text (used on white backgrounds)
  const secondaryLight =
    'border border-[#397466] text-[#DB9D30] font-semibold px-7 py-2.5 rounded-full text-[14px] sm:text-base font-poppins hover:bg-[#397466]/10 transition-all duration-200';

  const secondaryCls =
    secondaryBtnClassName ||
    (variant === 'dark' ? secondaryDark : secondaryLight);

  // Prevent hydration mismatch — render nothing until mounted
  if (!mounted) return null;

  if (isLoggedIn) {
    return (
      <div className={className}>
        <Link href="/profiles">
          <MainButton className={`font-poppins ${primaryBtnClassName}`}>
            Browse Profiles
          </MainButton>
        </Link>
        <Link href="/packages" className={secondaryCls}>
          See All Plans
        </Link>
      </div>
    );
  }

  return (
    <div className={className}>
      <Link href="/register">
        <MainButton className={`font-poppins ${primaryBtnClassName}`}>
          Register Now
        </MainButton>
      </Link>
      <Link href="/login" className={secondaryCls}>
        Login
      </Link>
    </div>
  );
}
