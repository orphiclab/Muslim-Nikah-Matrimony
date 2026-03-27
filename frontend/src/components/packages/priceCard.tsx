"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { packagesApi } from "@/services/api";

type Package = {
  id: string; name: string; description?: string; price: number;
  currency: string; durationDays: number; features: string[];
  isActive: boolean; sortOrder: number;
};

// Fallback static plans if the API returns nothing yet
const FALLBACK: Package[] = [
  {
    id: "3months", name: "3 Months", price: 99, currency: "USD", durationDays: 90,
    features: ["Full profile access", "Unlimited messaging", "Privacy controls", "AI-powered suggestions"],
    isActive: true, sortOrder: 0,
  },
  {
    id: "6months", name: "6 Months", price: 199, currency: "USD", durationDays: 180,
    features: ["Everything in 3 months", "Priority support", "Advanced matching", "Profile boost", "Extended visibility"],
    isActive: true, sortOrder: 1,
  },
  {
    id: "9months", name: "9 Months", price: 229, currency: "USD", durationDays: 270,
    features: ["Everything in 6 months", "Dedicated advisor", "Premium placement", "Exclusive events access"],
    isActive: true, sortOrder: 2,
  },
];

export default function PricingCards() {
  const [plans, setPlans] = useState<Package[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    packagesApi.getActive()
      .then((r) => {
        const data: Package[] = r.data ?? [];
        const list = data.length > 0 ? data : FALLBACK;
        setPlans(list);
        // auto-select middle card (most popular effect)
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
          <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:items-start sm:justify-center">
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
      <div className="containerpadding container mx-auto">
        <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:items-start sm:justify-center">
          {plans.map((plan, idx) => {
            const isSelected = selectedId === plan.id;
            // Middle card gets "Most Popular" badge, last gets "Best Value"
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
                  "relative flex flex-1 cursor-pointer flex-col gap-5 rounded-2xl border-2 bg-white p-7 shadow-md transition-all duration-300",
                  isSelected
                    ? "z-10 scale-[1.05] border-[#DB9D30] shadow-2xl"
                    : " border-[#E5E7EB]/50 shadow-md hover:border-[#DB9D30]/40 hover:shadow-lg",
                ].join(" ")}
              >
                {/* Badge */}
                {badge && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#DB9D30] px-4 py-1 text-[13px] font-semibold text-white font-poppins shadow">
                    {badge}
                  </span>
                )}

                {/* Name / Duration */}
                <h3 className="font-poppins subtitle font-medium text-[#010806]">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-1">
                  <span className="font-poppins text-[28px] sm:text-[34px] md:text-[40px] lg:text-[50px] xl:text-[60px] font-semibold text-[#397466]">
                    ${plan.price}
                  </span>
                  <span className="font-poppins text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] xl:text-[18px] text-[#6B7280]">
                    {plan.durationDays} days
                  </span>
                </div>

                {/* Description */}
                {plan.description && (
                  <p className="font-poppins text-[14px] text-[#6B7280] -mt-3">
                    {plan.description}
                  </p>
                )}

                {/* Divider */}
                <hr className="border-dashed border-[#D1D5DB]" />

                {/* Features */}
                <ul className="flex flex-col gap-3 h-[200px]">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <CheckCircle2
                        className={[
                          "h-5 w-5 shrink-0",
                          isSelected ? "text-[#DB9D30]" : "text-[#397466]",
                        ].join(" ")}
                      />
                      <span className="font-poppins text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] xl:text-[18px] text-[#878787]">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <button
                  type="button"
                  className={[
                    "mt-auto w-full rounded-full py-3 text-base font-semibold font-poppins transition-all duration-200",
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
