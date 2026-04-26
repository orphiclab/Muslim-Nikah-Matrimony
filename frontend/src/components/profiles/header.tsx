'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import AuthCTA from '@/components/ui/AuthCTA';

gsap.registerPlugin(SplitText, ScrollTrigger, useGSAP);

const ProfilesHeader = () => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      if (!headingRef.current) return;

      const split = SplitText.create(headingRef.current, {
        type: 'words',
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.words, {
            opacity: 0,
            y: 40,
            duration: 1,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: {
              trigger: headingRef.current,
              start: 'top 85%',
              once: true,
            },
          });
        },
      });

      return () => split.revert();
    },
    { scope: headingRef },
  );

  return (
    <section className="relative w-full bg-[#085140] overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/about/abtheader.png"
          alt=""
          fill priority
          className="object-cover object-center"
        />
      </div>
      <div className="relative z-10 containerpadding container mx-auto flex min-h-[500px] sm:min-h-[600px] md:min-h-[500px] lg:min-h-[600px] flex-col items-center justify-center gap-5 text-center margin-y">
        <p className="font-andada-pro title-sub-top font-light text-white">
          Follow a trusted path built on faith, privacy, and family values.
        </p>
        <h1 ref={headingRef} className="title font-poppins font-medium text-white leading-tight max-w-4xl">
          Your Journey Towards{' '}
          <br />
          <span className="font-aref-ruqaa-ink font-bold text-[#DB9D30]">Blessed</span> Match
        </h1>
        <p className="paragraph font-poppins text-white max-w-4xl">
          Begin a meaningful journey guided by faith, trust, and sincere intentions. Our platform is designed to help you find a compatible life partner while honoring values, family involvement, and spiritual connection—leading you towards a truly blessed and lasting match.
        </p>
        <AuthCTA
          variant="dark"
          className="flex items-center justify-center gap-4 flex-wrap pt-2"
          primaryBtnClassName="px-7 py-3 text-[15px]"
        />
      </div>
    </section>
  );
};

export default ProfilesHeader;
