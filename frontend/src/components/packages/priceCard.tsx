"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { packagesApi } from "@/services/api";
import { useCurrency } from "@/hooks/useCurrency";

type Package = {
  id: string; name: string; description?: string; price: number;
  currency: string; durationDays: number; features: string[];
  isActive: boolean; sortOrder: number;
  discountPct?: number | null;
  originalPrice?: number | null;
  effectiveDiscountPct?: number;
};

type SiteDiscount = { active: boolean; pct: number; label: string };

// Fallback static plans
const FALLBACK: Package[] = [
  {
    id: "3months", name: "3 Months", price: 7499, currency: "LKR", durationDays: 90,
    features: ["Full profile access", "Unlimited messaging", "Privacy controls", "AI-powered suggestions"],
    isActive: true, sortOrder: 0,
  },
  {
    id: "6months", name: "6 Months", price: 10004, currency: "LKR", durationDays: 180,
    features: ["Everything in 3 months", "Priority support", "Advanced matching", "Profile boost", "Extended visibility"],
    isActive: true, sortOrder: 1,
  },
  {
    id: "9months", name: "9 Months", price: 14999, currency: "LKR", durationDays: 270,
    features: ["Everything in 6 months", "Dedicated advisor", "Premium placement", "Exclusive events access"],
    isActive: true, sortOrder: 2,
  },
];

function getEffective(pkg: Package, site: SiteDiscount) {
  // Backend already stacks discounts: effectiveDiscountPct = pkg+site combined
  // pkg.price is the final price after all discounts when effectiveDiscountPct is set
  const disc = (pkg as any).effectiveDiscountPct ?? pkg.discountPct ?? 0;
  const orig = pkg.originalPrice ?? pkg.price;

  if (disc <= 0) {
    // No package discount — apply site discount client-side (fallback data case)
    const siteDisc = site.active ? site.pct : 0;
    if (siteDisc <= 0) return { disc: 0, orig: pkg.price, final: pkg.price };
    const final = Math.round(pkg.price * (1 - siteDisc / 100) * 100) / 100;
    return { disc: siteDisc, orig: pkg.price, final };
  }

  // Backend pre-computed: pkg.price IS the final discounted price
  if ((pkg as any).effectiveDiscountPct != null) {
    return { disc, orig, final: pkg.price };
  }

  // Pure fallback calculation
  const final = Math.round(orig * (1 - disc / 100) * 100) / 100;
  return { disc, orig, final };
}

export default function PricingCards() {
  const [plans, setPlans] = useState<Package[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [siteDiscount, setSiteDiscount] = useState<SiteDiscount>({ active: false, pct: 0, label: "" });
  const { symbol, code, fmt } = useCurrency();

  useEffect(() => {
    packagesApi.getActive('SUBSCRIPTION')
      .then((r: any) => {
        const data: Package[] = r.data ?? [];
        const list = data.length > 0 ? data : FALLBACK;
        setPlans(list);
        if (r.siteDiscount) setSiteDiscount(r.siteDiscount);
        const mid = list[Math.floor(list.length / 2)];
        setSelectedId(mid?.id ?? list[0]?.id ?? "");
      })
      .catch(() => {
        setPlans(FALLBACK);
        setSelectedId(FALLBACK[1].id);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="w-full bg-white margin-y">
        <div className="containerpadding container mx-auto">
          <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:items-stretch sm:justify-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border-2 border-transparent bg-gray-100 animate-pulse h-80 sm:w-[300px] xl:w-[400px]" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-white margin-y">
      {/* Site-wide discount banner */}
      {siteDiscount.active && siteDiscount.pct > 0 && (
        <div className="containerpadding container mx-auto mb-6">
          <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl px-6 py-3">
            <span className="text-xl">🏷️</span>
            <p className="font-bold text-sm sm:text-base">
              LIMITED OFFER: <span className="text-yellow-200">{siteDiscount.pct}% OFF</span> all plans
              {siteDiscount.label && <> — {siteDiscount.label}</>}!
            </p>
            <span className="animate-bounce text-lg">🎉</span>
          </div>
        </div>
      )}

      <div className="containerpadding container mx-auto overflow-x-clip">
        <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:items-stretch sm:justify-center">
          {plans.map((plan, idx) => {
            const isSelected = selectedId === plan.id;
            const { disc, orig, final } = getEffective(plan, siteDiscount);
            const hasDiscount = disc > 0;

            const badge =
              idx === Math.floor(plans.length / 2) && plans.length > 1
                ? "Most Popular"
                : idx === plans.length - 1 && plans.length > 2
                ? "Best Value"
                : null;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedId(plan.id)}
                className={[
                  "relative flex w-full min-w-0 flex-1 cursor-pointer flex-col gap-5 rounded-2xl border-2 bg-white p-5 sm:p-7 shadow-md transition-all duration-300",
                  isSelected
                    ? "z-10 border-[#DB9D30] shadow-2xl sm:scale-[1.03]"
                    : "border-[#E5E7EB]/50 shadow-md hover:border-[#DB9D30]/40 hover:shadow-lg",
                ].join(" ")}
              >
                {/* Discount ribbon */}
                {hasDiscount && (
                  <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg rotate-12">
                    -{disc}%
                  </span>
                )}

                {/* Badge */}
                {badge && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#DB9D30] px-4 py-1 text-[13px] font-semibold text-white font-poppins shadow">
                    {badge}
                  </span>
                )}

                {/* Name */}
                <h3 className="font-poppins subtitle font-medium text-[#010806]">{plan.name}</h3>

                {/* Price */}
                <div className="flex flex-col gap-0.5">
                  {hasDiscount && (
                    <span className="text-sm text-gray-400 line-through font-poppins">
                      {fmt(orig)}
                    </span>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className={`font-poppins text-[28px] sm:text-[34px] md:text-[40px] lg:text-[50px] xl:text-[60px] font-semibold ${hasDiscount ? 'text-red-600' : 'text-[#397466]'}`}>
                      {hasDiscount ? final.toLocaleString() : plan.price.toLocaleString()}
                    </span>
                    <span className="font-poppins text-[15px] text-[#6B7280]">
                      {symbol} / {plan.durationDays} days
                    </span>
                  </div>
                  {hasDiscount && (
                    <span className="text-xs font-bold text-red-500">You save {fmt(Math.round(orig - final))}!</span>
                  )}
                </div>

                {/* Description */}
                {plan.description && (
                  <p className="font-poppins text-[14px] text-[#6B7280] -mt-3">{plan.description}</p>
                )}

                <hr className="border-dashed border-[#D1D5DB]" />

                {/* Features */}
                <ul className="flex flex-col gap-3 h-[200px]">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <CheckCircle2
                        className={["h-5 w-5 shrink-0", isSelected ? "text-[#DB9D30]" : "text-[#397466]"].join(" ")}
                      />
                      <span className="font-poppins text-[15px] sm:text-[16px] text-[#878787]">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <button
                  type="button"
                  className={[
                    "mt-auto w-full rounded-full py-3 text-base font-semibold font-poppins transition-all duration-200",
                    idx === Math.floor(plans.length / 2) ? "mb-4" : "",
                    isSelected
                      ? "bg-[#397466] text-white hover:bg-[#2e6055]"
                      : "border border-[#397466] bg-white text-[#397466] hover:bg-[#397466]/10",
                  ].join(" ")}
                >
                  Get Started
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
