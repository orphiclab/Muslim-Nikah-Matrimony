"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";

const PLANS = [
  {
    id: "3months",
    duration: "3 Months",
    price: 99,
    badge: null,
    features: [
      "Full profile access",
      "Unlimited messaging",
      "Privacy controls",
      "AI-powered suggestions",
    ],
  },
  {
    id: "6months",
    duration: "6 Months",
    price: 199,
    badge: "Most Popular",
    features: [
      "Everything in 6 months",
      "Priority support",
      "Advanced matching",
      "Profile boost",
      "Extended visibility",
    ],
  },
  {
    id: "9months",
    duration: "9 Months",
    price: 229,
    badge: "Best Value",
    features: [
      "Everything in 9 months",
      "Dedicated advisor",
      "Premium placement",
      "Exclusive events access",
    ],
  },
] as const;

type PlanId = (typeof PLANS)[number]["id"];

export default function PricingCards() {
  const [selected, setSelected] = useState<PlanId>("6months");

  return (
    <section className="w-full bg-white margin-y">
      <div className="containerpadding container mx-auto">
        <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:items-start sm:justify-center">
          {PLANS.map((plan) => {
            const isSelected = selected === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className={[
                  "relative flex cursor-pointer flex-col gap-5 rounded-2xl border-2 bg-white p-7 shadow-md transition-all duration-300 sm:w-[300px] xl:w-[400px]",
                  isSelected
                    ? "scale-[1.04] border-[#DB9D30] shadow-xl"
                    : "border-transparent hover:scale-[1.02] hover:border-[#DB9D30]/50 hover:shadow-lg",
                ].join(" ")}
              >
                {/* Badge */}
                {plan.badge && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#DB9D30] px-4 py-1 text-[13px] font-semibold text-white font-poppins shadow">
                    {plan.badge}
                  </span>
                )}

                {/* Duration */}
                <h3 className="font-poppins subtitle font-medium text-[#010806]">
                  {plan.duration}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-1">
                  <span className="font-poppins text-[28px] sm:text-[34px] md:text-[40px] lg:text-[50px] xl:text-[60px] font-semibold text-[#397466]">
                    $ {plan.price}
                  </span>
                  <span className="font-poppins text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] xl:text-[18px]  text-[#6B7280]">
                    one-time
                  </span>
                </div>

                {/* Divider */}
                <hr className="border-dashed border-[#D1D5DB]" />

                {/* Features */}
                <ul className="flex flex-col gap-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <CheckCircle2
                        className={[
                          "h-5 w-5 shrink-0",
                          isSelected ? "text-[#DB9D30]" : "text-[#397466]",
                        ].join(" ")}
                      />
                      <span className="font-poppins text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] xl:text-[18px]  text-[#878787]">
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
