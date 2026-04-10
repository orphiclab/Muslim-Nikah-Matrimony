'use client';

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { loadMasterData } from "@/app/admin/master-file/data";

export type ProfileCardProps = {
    name: string;
    city: string;
    country?: string;
    gender?: string;
    isPrivate: boolean;
    isVerified: boolean;
    age: number;
    height: string;
    maritalStatus: string;
    education: string;
    job: string;
    joinedDaysAgo: number;
    profileImage?: string;
    memberId?: string;
    isVip?: boolean;
    onChatClick?: (e: React.MouseEvent) => void;
    onViewClick?: (e: React.MouseEvent) => void;
    hideFooter?: boolean;
    chatDisabled?: boolean;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function calcAge(dob?: string): number {
    if (!dob) return 0;
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function cmToFeet(cm?: number): string {
    if (!cm) return '–';
    const totalInches = Math.round(cm / 2.54);
    const ft = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${ft}' ${inches}"`;
}

function daysAgo(iso?: string): number {
    if (!iso) return 0;
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function mapApiToCard(p: any): ProfileCardProps {
    return {
        name: p.name ?? 'Profile',
        city: p.city ?? '–',
        country: p.country ?? '',
        gender: p.gender ?? '',
        isPrivate: false,
        isVerified: false,
        age: p.age ?? calcAge(p.dateOfBirth),
        height: cmToFeet(p.height),
        maritalStatus: p.civilStatus ?? 'Single',
        education: p.education ?? '–',
        job: p.occupation ?? '–',
        joinedDaysAgo: daysAgo(p.createdAt),
        memberId: p.memberId,
        isVip: !!p.isVip,
    };
}

// ── Filter state ──────────────────────────────────────────────────────────────
type Filters = {
    maritalStatus: string;
    city: string;
    country: string;
};

const INITIAL_FILTERS: Filters = {
    maritalStatus: '',
    city: '',
    country: '',
};

const MARITAL_OPTIONS = [
    { value: '', label: 'Any Status' },
    { value: 'Never Married', label: 'Never Married' },
    { value: 'Widowed', label: 'Widowed' },
    { value: 'Divorced', label: 'Divorced' },
    { value: 'Separated', label: 'Separated' },
    { value: 'Other', label: 'Other' },
];

// ── FilterBar ─────────────────────────────────────────────────────────────────
const FilterBar = ({
    filters,
    onChange,
    onReset,
    cities,
    countries,
}: {
    filters: Filters;
    onChange: (f: Filters) => void;
    onReset: () => void;
    cities: string[];
    countries: string[];
}) => {
    const set = (key: keyof Filters, val: string) => {
        if (key === 'country') {
            onChange({ ...filters, country: val, city: '' });
        } else {
            onChange({ ...filters, [key]: val });
        }
    };

    const hasActive =
        filters.maritalStatus || filters.city || filters.country;

    return (
        <div className="w-full mt-8 mb-2">
            <div className="rounded-2xl border border-[#dbe6e1] bg-white shadow-sm px-4 py-4 sm:px-5 sm:py-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {/* Age range */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-[#1C3B35] uppercase tracking-wide font-poppins">Age Range</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={ageMin}
                                max={ageMax - 1}
                                placeholder={String(ageMin)}
                                value={filters.ageMin}
                                onChange={e => set('ageMin', e.target.value)}
                                className="h-10 w-full border border-gray-200 rounded-xl px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20 focus:border-[#1C3B35] bg-white transition placeholder-gray-300"
                            />
                            <span className="text-gray-300 text-sm font-bold">-</span>
                            <input
                                type="number"
                                min={ageMin + 1}
                                max={ageMax}
                                placeholder={String(ageMax)}
                                value={filters.ageMax}
                                onChange={e => set('ageMax', e.target.value)}
                                className="h-10 w-full border border-gray-200 rounded-xl px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20 focus:border-[#1C3B35] bg-white transition placeholder-gray-300"
                            />
                        </div>
                    </div>

                    {/* Marital Status */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] tex font-semibold text-[#1C3B35] uppercase tracking-wide font-poppins">Marital Status</label>
                        <select
                            value={filters.maritalStatus}
                            onChange={e => set('maritalStatus', e.target.value)}
                            className="h-10 border border-gray-200 rounded-xl px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20 focus:border-[#1C3B35] bg-white transition appearance-none cursor-pointer"
                        >
                            {MARITAL_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Country */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-[#1C3B35] uppercase tracking-wide font-poppins">Country</label>
                        {countries.length > 0 ? (
                            <select
                                value={filters.country}
                                onChange={e => set('country', e.target.value)}
                                className="h-10 border border-gray-200 rounded-xl px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20 focus:border-[#1C3B35] bg-white transition appearance-none cursor-pointer"
                            >
                                <option value="">Any Country</option>
                                {countries.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        ) : (
                            <input
                                type="text"
                                placeholder="Any country"
                                value={filters.country}
                                onChange={e => set('country', e.target.value)}
                                className="h-10 border border-gray-200 rounded-xl px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20 focus:border-[#1C3B35] bg-white transition placeholder-gray-300"
                            />
                        )}
                    </div>

                    {/* City — disabled until country is selected */}
                    <div className="flex flex-col gap-1.5">
                        <label className={`text-[11px] font-semibold uppercase tracking-wide font-poppins ${filters.country ? 'text-[#1C3B35]' : 'text-gray-300'}`}>City</label>
                        <select
                            value={filters.city}
                            onChange={e => set('city', e.target.value)}
                            disabled={!filters.country}
                            className={`h-10 border rounded-xl px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1C3B35]/20 focus:border-[#1C3B35] appearance-none transition ${
                                filters.country
                                    ? 'border-gray-200 text-gray-700 bg-white cursor-pointer'
                                    : 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed'
                            }`}
                        >
                            <option value="">{filters.country ? 'Any City' : 'Select country first'}</option>
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Clear button area */}
                    <div className="flex items-end">
                        {hasActive ? (
                            <button
                                onClick={onReset}
                                className="h-10 w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-[#1C3B35] border border-[#1C3B35]/25 bg-[#EAF2EE] hover:bg-[#dcebe4] rounded-xl transition font-poppins"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Clear Filters
                            </button>
                        ) : (
                            <div className="hidden lg:block h-10 w-full" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Decorative border SVG ─────────────────────────────────────────────────────
const DecorativeBorder = () => (
    <svg
        width="202"
        height="199"
        viewBox="0 0 202 199"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
    >
        <defs>
            <path
                id="decor-border-shape"
                d="M100.365 198.987L93.6102 192.095C93.2703 191.749 92.9092 191.366 92.5226 190.966C91.7876 190.191 91.0272 189.391 90.2965 188.718C86.7535 185.45 82.2419 182.621 76.0946 179.817C73.9535 178.84 71.4683 177.661 69.0553 176.082C63.2267 172.263 58.9699 166.962 56.6971 160.713C52.8397 159.555 49.3859 157.581 46.4248 154.835C43.2132 151.854 41.0381 148.359 39.7976 144.162C33.1788 141.804 27.6051 137.248 23.6415 130.936C22.2693 128.755 21.2497 126.54 20.4298 124.768C17.7024 118.86 14.8773 114.443 11.534 110.873C10.884 110.178 10.0768 109.424 9.22719 108.624C8.74713 108.174 8.25856 107.719 7.77001 107.247L0 99.7653L8.02915 92.5568C8.32653 92.2915 8.62395 92.0262 8.92132 91.7694L9.09972 91.6094C9.52454 91.2346 9.94089 90.8683 10.3445 90.481C13.5901 87.3483 16.4449 83.3146 19.0788 78.1482C19.5122 77.2935 19.9455 76.3545 20.4001 75.3608C20.6932 74.7166 20.9906 74.0766 21.2922 73.4408C23.5948 68.586 26.4835 64.7122 30.1243 61.6006C33.0259 59.1206 36.2461 57.2385 39.7126 55.9922C40.8851 51.9079 42.9626 48.4384 46.0468 45.4068C48.9271 42.5773 52.3852 40.5562 56.3403 39.3941C58.8 32.5982 63.4348 27.1245 70.1258 23.1203C72.063 21.9623 73.979 21.095 75.6656 20.3329L75.7803 20.2823C81.8808 17.5286 86.4179 14.6781 90.0544 11.3054C90.7256 10.6822 91.4563 9.91589 92.2252 9.10325C92.6925 8.61061 93.1301 8.15589 93.5762 7.69694L101.087 0L108.377 7.89903C108.674 8.22325 108.968 8.54746 109.261 8.86746C109.745 9.4022 110.2 9.90748 110.616 10.3243C114.167 13.8823 118.607 16.8507 124.588 19.6634C125.043 19.8781 125.502 20.0844 125.956 20.295C127.528 21.015 129.312 21.8318 131.122 22.8718C137.902 26.775 142.796 32.4593 145.328 39.352C149.483 40.5352 152.992 42.5815 156.034 45.5963C158.986 48.5226 161.021 51.9206 162.241 55.9543C169.148 58.3964 174.684 63.007 178.711 69.6597C179.888 71.6008 180.78 73.5292 181.57 75.2345L181.778 75.6808C184.459 81.4408 187.237 85.7567 190.53 89.2599C191.192 89.963 192 90.7209 192.854 91.521C193.329 91.9673 193.805 92.4136 194.285 92.8726L202 100.296L194.09 107.513C193.78 107.799 193.465 108.077 193.155 108.355L193.074 108.426C192.505 108.936 191.97 109.412 191.52 109.858C187.794 113.53 184.701 118.174 181.778 124.469L181.494 125.088C180.878 126.422 180.181 127.934 179.297 129.488C175.283 136.528 169.437 141.572 162.347 144.132C159.832 152.456 153.816 158.494 145.668 160.882C143.204 167.568 138.404 173.177 131.734 177.139C129.877 178.242 128.046 179.067 126.432 179.796L126.271 179.871C120.756 182.356 116.355 185.05 112.816 188.103C111.635 189.122 110.459 190.154 109.286 191.185L100.365 199V198.987ZM96.0401 189.754L100.543 194.347L107.039 188.655C108.216 187.619 109.397 186.579 110.59 185.551C114.38 182.28 119.053 179.417 124.869 176.793L125.022 176.726C126.564 176.031 128.301 175.248 129.996 174.242C136.335 170.478 140.63 165.336 142.758 158.957L143.047 158.086L143.943 157.859C151.722 155.871 157.181 150.376 159.326 142.389L159.56 141.513L160.431 141.227C167.19 139.012 172.547 134.502 176.353 127.825C177.165 126.401 177.832 124.957 178.418 123.681L178.707 123.058C181.804 116.384 185.117 111.429 189.136 107.466C189.65 106.957 190.266 106.41 190.814 105.925L190.891 105.854C191.192 105.584 191.494 105.315 191.8 105.037L197.076 100.224L191.932 95.2768C191.464 94.8305 190.997 94.3884 190.534 93.9547C189.638 93.1168 188.792 92.3252 188.057 91.542C184.514 87.7694 181.545 83.1714 178.711 77.0829L178.503 76.6324C177.751 75.0071 176.897 73.1671 175.814 71.3818C172.054 65.167 166.846 60.9522 160.333 58.8512L159.454 58.569L159.22 57.6848C158.201 53.8532 156.378 50.6742 153.646 47.9668C150.834 45.1836 147.554 43.352 143.616 42.3668L142.716 42.1394L142.423 41.2636C140.256 34.7751 135.766 29.4151 129.431 25.7687C127.758 24.8045 126.054 24.0255 124.546 23.3392C124.079 23.1245 123.611 22.9097 123.144 22.6908C116.797 19.7055 112.052 16.5265 108.216 12.6822C107.761 12.2275 107.268 11.6801 106.746 11.1033C106.465 10.7917 106.181 10.4759 105.888 10.1643L101.028 4.8969L96.0189 10.0254C95.5814 10.4717 95.1565 10.918 94.7402 11.3601C93.8906 12.2528 93.1259 13.0528 92.3782 13.7475C88.4655 17.377 83.6395 20.4213 77.1864 23.3308L77.0802 23.3771C75.4701 24.1013 73.6519 24.9266 71.8846 25.9834C65.6269 29.7266 61.3872 34.8761 59.2716 41.2846L58.9827 42.1562L58.0863 42.3878C54.3478 43.3478 51.1022 45.1626 48.4385 47.7774C45.588 50.5774 43.7357 53.8153 42.7713 57.6764L42.5462 58.5775L41.6541 58.868C38.2809 59.9627 35.1458 61.7354 32.3419 64.1312C29.0708 66.927 26.4581 70.4344 24.3637 74.8555C24.0706 75.4787 23.7817 76.1019 23.4928 76.7292C23.017 77.765 22.5752 78.7335 22.1079 79.6514C19.304 85.1546 16.2325 89.483 12.715 92.8768C12.2774 93.2978 11.8186 93.702 11.3556 94.1105L11.2069 94.2452C10.8883 94.5231 10.5994 94.78 10.3105 95.0368L4.95767 99.841L10.1363 104.831C10.6121 105.29 11.0879 105.736 11.5595 106.174C12.4516 107.012 13.297 107.799 14.0235 108.578C17.6217 112.422 20.638 117.117 23.5183 123.361C24.2957 125.05 25.2686 127.155C26.526 129.155C30.2348 135.062 35.4899 139.248 41.7263 141.256L42.6099 141.543L42.8436 142.435C43.8674 146.389 45.8004 149.639 48.7529 152.376C51.527 154.945 54.7939 156.743 58.4644 157.711L59.3523 157.947L59.6369 158.814C61.6124 164.789 65.4145 169.657 70.9373 173.278C73.1506 174.726 75.4999 175.838 77.5263 176.764C84.0091 179.724 88.8012 182.739 92.6161 186.259C93.4275 187.008 94.2262 187.846 94.9993 188.663C95.3689 189.05 95.7215 189.421 96.0487 189.758L96.0401 189.754Z"
            />
        </defs>
        <use href="#decor-border-shape" fill="#DB9D30" />
        <use
            href="#decor-border-shape"
            fill="#FFFFFF"
            transform="translate(101 99.5) scale(0.95) translate(-101 -99.5)"
        />
        <use
            href="#decor-border-shape"
            fill="#DB9D30"
            transform="translate(101 99.5) scale(0.89) translate(-101 -99.5)"
        />
    </svg>
);

const VerifiedIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
    >
        <circle cx="12" cy="12" r="12" fill="#22C55E" />
        <path
            d="M7 12.5L10.5 16L17 9"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const InfoRow = ({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) => (
    <div className="flex justify-between items-start py-[5px] gap-2">
        <span className="text-[12px] md:text-[13px] lg:text-[14px] text-[#010806A1]/65 font-poppins flex-shrink-0">{label}</span>
        <span className="text-[12px] md:text-[13px] lg:text-[14px] font-medium text-[#010806CC]/80 font-poppins text-right break-words min-w-0">
            {value}
        </span>
    </div>
);

const GenuineProfileCard = ({
    name,
    city,
    isPrivate,
    isVerified,
    age,
    height,
    maritalStatus,
    education,
    job,
    joinedDaysAgo,
    profileImage,
    memberId,
    isVip,
    gender,
    onChatClick,
    onViewClick,
    hideFooter,
    chatDisabled = false,
}: ProfileCardProps) => {
    return (
        <div className="relative bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.10)] w-full flex-shrink-0 overflow-hidden pb-5">

            {/* VIP Banner */}
            {isVip ? (
                <div className="w-full bg-gradient-to-r from-[#E8BE1A] to-[#DB9D30] text-white text-[9px] sm:text-[10px] font-extrabold text-center py-[5px] tracking-[0.15em] flex items-center justify-center gap-1.5 font-poppins">
                    ✦ VIP BOOSTED
                </div>
            ) : (
                <div className="h-[21px] sm:h-[23px]" />
            )}

            <div className="px-4 pt-2">
                {/* Member ID + badge row */}
                <div className="flex items-center justify-between mb-2">
                    {memberId ? (
                        <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border tracking-widest ${
                            isVip
                                ? 'bg-[#F5C518]/15 text-[#9A6E00] border-[#DB9D30]/40'
                                : 'bg-[#1C3B35]/8 text-[#1C3B35] border-[#1C3B35]/20'
                        }`}>
                            🪪 {memberId}
                        </span>
                    ) : <div />}
                    <span className="flex items-center gap-1 bg-[#DB9D3030] border border-gray-200 rounded-full px-2.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-[#DB9D30] font-poppins shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#DB9D30] inline-block" />
                        {isPrivate ? "Private" : "Public"}
                    </span>
                </div>

                {/* Profile picture */}
                <div className="relative w-[90px] h-[90px] sm:w-[110px] sm:h-[110px] lg:w-[120px] lg:h-[120px] xl:w-[130px] xl:h-[130px] 2xl:w-[140px] 2xl:h-[140px] mx-auto mt-1 mb-3">
                    <div className="absolute inset-0 w-full h-full">
                        <DecorativeBorder />
                    </div>
                    <div className="absolute inset-[25px] rounded-full overflow-hidden bg-gray-100">
                        {profileImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={profileImage}
                                alt={name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <ProfileAvatar gender={gender} name={name} className="w-full h-full" size={160} />
                        )}
                    </div>
                    {isVerified && (
                        <div className="absolute bottom-5 right-5 w-6 h-6 z-10">
                            <VerifiedIcon />
                        </div>
                    )}
                </div>

                {/* Name & city */}
                <div className="text-center mb-3">
                    <h3 className="text-[15px] xl:text-[18px] 2xl:text-[20px] font-medium text-[#010806] font-poppins leading-tight">
                        {name}
                    </h3>
                    <p className="text-[12px] xl:text-[14px] 2xl:text-[17px] text-gray-500 font-poppins mt-0.5">
                        Live In{" "}
                        <span className="text-[#22C55E] font-medium">{city}</span>
                    </p>
                </div>

                {/* Info rows */}
                <div className="divide-gray-100">
                    <InfoRow label="Age:" value={`${age} Years`} />
                    <InfoRow label="Height:" value={height} />
                    <InfoRow label="Marital Status:" value={maritalStatus} />
                    <InfoRow label="Education:" value={education} />
                    <InfoRow label="Job:" value={job} />
                </div>

                {!hideFooter && (
                    <>
                        <div className="border-t border-dashed border-gray-700 mt-2 mb-3" />
                        <p className="text-center text-[11px] lg:text-[13px] xl:text-[15px] 2xl:text-[17px] text-[#010806A1]/80 font-poppins mb-3">
                            Joined {joinedDaysAgo} days ago
                        </p>
                        <div className="flex gap-2 w-full">
                            <button onClick={onViewClick} className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-[#1C3B35] transition-all duration-150 text-[12px] sm:text-[13px] lg:text-[14px] font-medium font-poppins py-2 rounded-xl shadow-sm">
                                View
                            </button>
                            {chatDisabled ? (
                                <div
                                    title="Age or height criteria not matched"
                                    className="flex-[1.5] bg-gray-200 text-gray-400 text-[12px] sm:text-[13px] lg:text-[14px] font-medium font-poppins py-2 rounded-xl flex items-center justify-center gap-1 cursor-not-allowed select-none"
                                >
                                    <span className="text-xs">🔒</span> Chat
                                </div>
                            ) : (
                                <button onClick={onChatClick} className="flex-[1.5] bg-[#1B6B4A] hover:bg-[#155a3d] active:scale-[0.98] transition-all duration-150 text-white text-[12px] sm:text-[13px] lg:text-[14px] font-medium font-poppins py-2 rounded-xl shadow-sm flex items-center justify-center gap-1">
                                    <span className="text-xs sm:text-sm">💬</span> Chat
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
    <div className="relative bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.10)] w-full overflow-hidden pb-5 animate-pulse">
        <div className="h-[21px] bg-gray-100" />
        <div className="px-4 pt-2">
            <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-20 bg-gray-200 rounded-full" />
                <div className="h-4 w-14 bg-gray-200 rounded-full" />
            </div>
            <div className="w-[110px] h-[110px] rounded-full bg-gray-200 mx-auto mt-1 mb-3" />
            <div className="text-center mb-3 space-y-2">
                <div className="h-4 w-28 bg-gray-200 rounded mx-auto" />
                <div className="h-3 w-20 bg-gray-100 rounded mx-auto" />
            </div>
            <div className="space-y-2 mb-3">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex justify-between">
                        <div className="h-3 w-16 bg-gray-100 rounded" />
                        <div className="h-3 w-20 bg-gray-200 rounded" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// ── GenuineProfileCards (main export) ─────────────────────────────────────────
const GenuineProfileCards = () => {
    const router = useRouter();
    const [allProfiles, setAllProfiles] = useState<ProfileCardProps[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);

    useEffect(() => {
        const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api';
        fetch(`${BASE}/profiles/public?status=ACTIVE`)
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(d => {
                const items: any[] = d.data ?? [];
                setAllProfiles(items.slice(0, 40).map(mapApiToCard));
            })
            .catch(() => setAllProfiles([]))
            .finally(() => setLoading(false));
    }, []);

    // Load master data for filter dropdowns
    const masterData = loadMasterData();
    const masterCountries = masterData.countries.map(c => c.name).sort();

    // Derive cities: if a country is selected, show only that country's cities; else all
    const selectedCountryData = masterData.countries.find(c => c.name === filters.country);
    const masterCities = selectedCountryData
        ? selectedCountryData.cities.map(ci => ci.name).sort()
        : masterData.countries.flatMap(c => c.cities.map(ci => ci.name)).sort();

    const cities = masterCities;
    const countries = masterCountries;

    // Apply filters
    const displayed = useMemo(() => {
        return allProfiles
            .filter(p => {
                if (filters.maritalStatus && !p.maritalStatus.toLowerCase().includes(filters.maritalStatus.toLowerCase())) return false;
                if (filters.city && p.city !== filters.city && !p.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
                if (filters.country && p.country !== filters.country && !(p.country ?? '').toLowerCase().includes(filters.country.toLowerCase())) return false;
                return true;
            })
            .slice(0, 8);
    }, [allProfiles, filters]);

    const handleChatClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const token = typeof window !== 'undefined' ? localStorage.getItem('mn_token') : null;
        router.push(token ? '/dashboard/chat' : '/login');
    };

    const handleViewClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const token = typeof window !== 'undefined' ? localStorage.getItem('mn_token') : null;
        router.push(token ? '/profiles' : '/login');
    };

    if (loading) {
        return (
            <div>
                <div className="w-full mt-8 mb-2">
                    <div className="bg-white/80 backdrop-blur-sm border border-white shadow-lg rounded-2xl px-4 py-4 h-16 animate-pulse bg-gray-100" />
                </div>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6 xl:grid-cols-4 justify-items-center">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Filter bar */}
            <FilterBar
                filters={filters}
                onChange={setFilters}
                onReset={() => setFilters(INITIAL_FILTERS)}
                cities={cities}
                countries={countries}
            />

            {/* Result count hint */}
            {(filters.maritalStatus || filters.city || filters.country) && (
                <p className="text-center text-xs text-gray-500 font-poppins mt-3 mb-1">
                    Showing <span className="font-semibold text-[#1C3B35]">{displayed.length}</span> profile{displayed.length !== 1 ? 's' : ''} matching your filters
                </p>
            )}

            {/* Cards grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6 xl:grid-cols-4 justify-items-center">
                {displayed.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center py-12 text-gray-400">
                        <span className="text-5xl mb-3">🔍</span>
                        <p className="font-semibold text-gray-500 font-poppins">No profiles match your filters</p>
                        <p className="text-sm mt-1 font-poppins">Try adjusting or clearing your filters</p>
                    </div>
                ) : (
                    displayed.map((profile, idx) => (
                        <GenuineProfileCard
                            key={idx}
                            {...profile}
                            onChatClick={handleChatClick}
                            onViewClick={handleViewClick}
                            hideFooter
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export { GenuineProfileCard, GenuineProfileCards };
export default GenuineProfileCards;
