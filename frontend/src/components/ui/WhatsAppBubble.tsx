'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const WHATSAPP_NUMBER = '713708788';
const WHATSAPP_MESSAGE = 'Hello! I found you on Muslim Nikah Matrimony and would like to know more.';

export default function WhatsAppBubble() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [tooltip, setTooltip] = useState(true);
  const inDashboard = pathname?.startsWith('/dashboard');
  const inChatPage = pathname?.startsWith('/dashboard/chat');

  // Show bubble after a short delay so it doesn't flash on initial load
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 1200);
    const t2 = setTimeout(() => setTooltip(false), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <div
      className={`fixed right-4 sm:right-6 z-[9999] flex flex-col items-end gap-2 transition-all duration-500 ${
        inChatPage
          ? 'bottom-24 sm:bottom-6'
          : inDashboard
            ? 'bottom-20 sm:bottom-6'
            : 'bottom-16 sm:bottom-6'
      } ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
      }`}
    >
      {/* Tooltip bubble */}
      {tooltip && (
        <div className="relative bg-white rounded-2xl shadow-xl px-4 py-2.5 max-w-[200px] mr-1 animate-fade-in">
          <p className="text-[12px] font-semibold text-gray-700 font-poppins leading-snug">
            Chat with us on WhatsApp! 👋
          </p>
          {/* Triangle pointer */}
          <div className="absolute -bottom-2 right-5 w-0 h-0"
            style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid white' }} />
        </div>
      )}

      {/* WhatsApp button */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        className="group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
      >
        {/* Ping ring animation */}
        <span className="absolute inset-0 rounded-full animate-ping opacity-30"
          style={{ background: '#25D366' }} />

        {/* WhatsApp SVG icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="w-7 h-7 sm:w-8 sm:h-8 fill-white relative z-10"
        >
          <path d="M16.003 2C8.28 2 2 8.28 2 16.003c0 2.478.65 4.8 1.785 6.81L2 30l7.374-1.757A13.94 13.94 0 0016.003 30C23.72 30 30 23.72 30 16.003 30 8.28 23.72 2 16.003 2zm0 25.5a11.44 11.44 0 01-5.83-1.597l-.418-.25-4.377 1.044 1.074-4.265-.275-.437A11.46 11.46 0 014.5 16.003c0-6.348 5.155-11.503 11.503-11.503S27.5 9.655 27.5 16.003 22.35 27.5 16.003 27.5zm6.32-8.62c-.347-.174-2.053-1.013-2.372-1.128-.318-.117-.55-.174-.78.174-.23.347-.895 1.128-1.098 1.36-.202.232-.404.26-.751.087-.347-.174-1.465-.54-2.79-1.72-1.031-.92-1.727-2.054-1.93-2.4-.202-.347-.022-.535.152-.708.157-.156.347-.405.52-.607.174-.203.232-.347.347-.578.116-.232.058-.434-.029-.608-.087-.173-.78-1.882-1.069-2.576-.282-.676-.568-.585-.78-.596l-.665-.012c-.23 0-.607.087-.925.434-.318.348-1.214 1.186-1.214 2.893s1.243 3.355 1.416 3.586c.173.231 2.447 3.735 5.93 5.237.829.358 1.476.572 1.98.732.832.265 1.59.228 2.19.138.668-.1 2.053-.84 2.343-1.65.29-.812.29-1.508.203-1.65-.086-.145-.317-.232-.664-.406z"/>
        </svg>
      </a>
    </div>
  );
}
