'use client';

import type { LucideIcon } from 'lucide-react';

const HIGHLIGHT_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export type AdminStatCardItem = {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
};

export function AdminStatCard({
  item,
  selected,
  onSelect,
}: {
  item: AdminStatCardItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const { label, value, sub, icon: Icon } = item;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative w-full cursor-pointer overflow-hidden rounded-2xl p-5 text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        selected
          ? 'text-white ring-1 ring-black/5 hover:ring-black/10 focus-visible:ring-[#3d6b5d]'
          : 'border border-gray-100 bg-white text-gray-800 hover:border-gray-200 focus-visible:ring-[#1C3B35]/30'
      }`}
    >
      {selected && (
        <>
          <div
            className="absolute inset-0 bg-linear-to-br from-[#3d6b5d] via-[#5c8678] to-[#9fb1ac]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-overlay"
            style={{ backgroundImage: HIGHLIGHT_GRAIN }}
            aria-hidden
          />
        </>
      )}
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p
            className={`mb-1 truncate text-xs font-medium md:text-sm lg:text-base ${selected ? 'text-white/90' : 'text-gray-500'}`}
          >
            {label}
          </p>
          <p
            className={`text-2xl font-semibold leading-none tracking-tight md:text-3xl lg:text-4xl ${selected ? 'text-white' : 'text-gray-800'}`}
          >
            {value}
          </p>
          {sub && (
            <p className={`mt-2 text-[10px] md:text-[12px] ${selected ? 'text-white/75' : 'text-gray-400'}`}>{sub}</p>
          )}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-md">
          <Icon className={`h-5 w-5 ${selected ? 'text-[#3d6b5d]' : 'text-[#1C3B35]'}`} strokeWidth={2} aria-hidden />
        </div>
      </div>
    </button>
  );
}
