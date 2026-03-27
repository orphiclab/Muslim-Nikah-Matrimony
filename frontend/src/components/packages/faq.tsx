"use client";

import React, { useState } from "react";
import Image from "next/image";

const FAQS = [
  {
    question: "How do I create an account?",
    answer:
      "Simply click 'Create Profile', fill in your basic details, and follow the guided setup. Your profile will be reviewed and activated within 24 hours.",
  },
  {
    question: "Is my personal information kept private?",
    answer:
      "Yes, your privacy is our priority. All your personal information is securely stored and only shared according to your privacy settings. You have full control over what others can see.",
  },
  {
    question: "Can family members manage my profile?",
    answer:
      "Yes. Our Multi-Child Profile Management feature allows a parent or guardian to manage profiles for multiple family members from a single account.",
  },
  {
    question: "How do I find a suitable match?",
    answer:
      "Our smart matching system uses your preferences, values, and profile details to suggest compatible matches. You can also browse and filter profiles manually at any time.",
  },
  {
    question: "Is this platform only for Muslims?",
    answer:
      "Yes. MuslimNikah is designed specifically for Muslim families seeking meaningful, halal connections guided by faith, privacy, and family values.",
  },
] as const;

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section className="w-full bg-[#E6EEEC] margin-y py-12">
      <div className="containerpadding container mx-auto flex flex-col gap-12">
        {/* ── Title block (kept from original) ── */}
        <div className="flex flex-col items-center text-center gap-4">
          <Image
            src="/images/your-journey/top.png"
            alt=""
            width={70}
            height={70}
            className="object-contain"
          />

          <p className="font-andada-pro title-sub-top font-light text-[#4B5563] max-w-2xl">
            Find clear answers to common questions about creating your profile
            and finding the right match.
          </p>

          <h2 className="title font-poppins font-medium text-[#010806] leading-tight">
            Frequently Asked
            <br />
            <span className="font-aref-ruqaa-ink font-bold text-[#DB9D30]">
              Questions
            </span>
          </h2>
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
          {/* Left — subtitle + mosque image */}
          <div className="flex flex-col gap-6 lg:w-2/5">
            <p className="font-poppins title-sub-top text-[#4B5563] leading-relaxed">
              Everything you need to know to start your journey with confidence
              and peace of mind.
            </p>

            <div className="overflow-hidden ">
              <Image
                src="/images/packages/faq.png"
                alt="Mosque illustration"
                width={480}
                height={480}
                className="h-auto w-full object-contain"
              />
            </div>
          </div>

          {/* Right — accordion */}
          <div className="flex flex-1 flex-col gap-3">
            {FAQS.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={i} className="flex flex-col ">
                  {/* Question row — always teal, never changes */}
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    className="flex w-full items-center justify-between gap-4 rounded-t-full py-8 rounded-br-full bg-[#397466] px-6 py-4 text-left text-white transition-colors duration-200 hover:bg-[#2e6055]"
                  >
                    <span className="font-poppins text-[15px] lg:text-[16px] xl:text-[18px] font-semibold">
                      {faq.question}
                    </span>

                    {/* +/– icon */}
                    <span
                      className={[
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl font-light leading-none transition-all duration-300",
                        isOpen
                          ? "bg-[#5a9e8a] text-white"
                          : "bg-white/20 text-white",
                      ].join(" ")}
                    >
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {/* Answer — separate floating card below */}
                  <div
                    className={[
                      "overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 ease-in-out flex items-center",
                      isOpen
                        ? "h-30 opacity-100"
                        : "max-h-0 opacity-0 shadow-none",
                    ].join(" ")}
                  >
                    <p className="mx-auto w-[90%]  font-poppins text-[15px] lg:text-[16px]  text-[#4B5563] leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
