import React from "react";
import Image from "next/image";
import Link from "next/link";
import MainButton from "@/components/ui/mainbtn";

const PlanSection = () => {
  return (
    <section className="w-full bg-white margin-y ">
      <div className="containerpadding container mx-auto flex flex-col items-center text-center gap-4">
        <Image
          src="/images/your-journey/top.png"
          alt=""
          width={70}
          height={70}
          style={{ height: "auto" }}
          className="object-contain"
        />
        <h2 className="title font-poppins font-medium text-[#010806] leading-tight max-w-md lg:max-w-2xl xl:max-w-2xl 2xl:max-w-4xl">
          Choose the Right Plan
          <br />
          for Your{" "}
          <span className="relative inline-block text-[#DB9D30] font-aref-ruqaa-ink font-bold">
            <span className="relative inline-block pb-2">
              Journey
              <span className="text-[#010806] font-poppins font-medium">?</span>
              <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2">
                <svg
                  width="280"
                  height="18"
                  viewBox="0 0 280 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-[14px] w-[180px] sm:h-[16px] sm:w-[220px] md:w-[260px]"
                >
                  <path
                    d="M2 14C84 4 176 4 278 12"
                    stroke="#397466"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </span>
          </span>
        </h2>

        <p className="font-poppins text-[#0000008A]/55 text-[18px] sm:text-[22px] md:text-[26px] lg:text-[28px] xl:text-[28px] 2xl:text-[30px] leading-relaxed max-w-3xl">
          Select a plan that suits your needs and begin your journey towards
          finding a meaningful and blessed life partner.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
          <Link href="/register">
            <MainButton
              px="px-7"
              py="py-2.5"
              className="text-[14px] sm:text-base font-poppins"
              type="button"
            >
              Create Profile
            </MainButton>
          </Link>

          <Link
            href="/packages"
            className="border border-[#397466] text-[#DB9D30] font-semibold px-7 py-2.5 rounded-full text-[14px] sm:text-base font-poppins hover:bg-[#397466]/10 transition-all duration-200"
          >
            View All Plans
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PlanSection;
