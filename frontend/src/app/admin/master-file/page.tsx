'use client';

import Link from 'next/link';

const SECTIONS = [
  {
    label: 'Countries',
    description: 'Manage countries and their cities',
    href: '/admin/master-file/countries',
    emoji: '🌍',
    color: 'from-blue-50 to-blue-100/60 border-blue-100',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    label: 'Education',
    description: 'Manage education level options',
    href: '/admin/master-file/education',
    emoji: '🎓',
    color: 'from-emerald-50 to-emerald-100/60 border-emerald-100',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    label: 'Occupation',
    description: 'Manage occupation / job options',
    href: '/admin/master-file/occupation',
    emoji: '💼',
    color: 'from-amber-50 to-amber-100/60 border-amber-100',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    label: 'Dress Code',
    description: 'Manage dress code options',
    href: '/admin/master-file/dress-code',
    emoji: '👗',
    color: 'from-purple-50 to-purple-100/60 border-purple-100',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    label: 'Age Range',
    description: 'Set min & max age for profile filters',
    href: '/admin/master-file/age-range',
    emoji: '🎂',
    color: 'from-rose-50 to-rose-100/60 border-rose-100',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
  {
    label: 'Ethnicity',
    description: 'Manage ethnicity options',
    href: '/admin/master-file/ethnicity',
    emoji: '🌐',
    color: 'from-teal-50 to-teal-100/60 border-teal-100',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
  },
];

export default function MasterFilePage() {
  return (
    <div className="font-poppins space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] sm:text-[28px] font-poppins font-medium text-[#121514]">Master File</h1>
        <p className="text-gray-400 text-sm mt-0.5">Select a category to manage its list items.</p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
        {SECTIONS.map(s => (
          <Link
            key={s.href}
            href={s.href}
            className={`group flex items-center gap-4 bg-gradient-to-br ${s.color} border rounded-2xl px-5 py-5 hover:shadow-md transition-all duration-150 hover:-translate-y-0.5`}
          >
            <div className={`w-14 h-14 rounded-2xl ${s.iconBg} flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform`}>
              {s.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-semibold text-gray-900">{s.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
