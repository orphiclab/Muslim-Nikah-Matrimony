import React from "react";
import Image from "next/image";
import MainButton from "@/components/ui/mainbtn";

const ReadySection = () => {
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
          Ready to Begin Your{" "}
          <span
            className="relative inline-block text-[#DB9D30] font-aref-ruqaa-ink font-bold"
          >
            <span className="relative inline-block pb-2">
              Journey
              <span className="text-[#010806] font-poppins font-medium">?</span>

              {/* Decorative sign underline */}
              <span className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 mt-1 flex justify-center">
                <svg
                  viewBox="0 0 281 9"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                  className="h-auto w-[120px] sm:w-[150px] md:w-[180px] lg:w-[210px] xl:w-[230px]"
                >
                  <path
                    d="M1.50009 5.87037C29.7761 3.61033 58.0522 1.35029 104.278 1.50801C150.505 1.66573 213.825 4.3097 279.063 7.03379"
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
          Join thousands of families who have found meaningful connections
          through our platform
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
          <MainButton
            px="px-7"
            py="py-2.5"
            className="text-[14px] sm:text-base font-poppins"
            type="button"
          >
            Create Profile
          </MainButton>

          <button
            type="button"
            className="border border-[#397466] text-[#397466] font-semibold px-7 py-2.5 rounded-full text-[14px] sm:text-base font-poppins hover:bg-[#397466]/10 transition-all duration-200"
          >
            View All Plans
          </button>
        </div>
      </div>
    </section>
  );
};

export default ReadySection;
