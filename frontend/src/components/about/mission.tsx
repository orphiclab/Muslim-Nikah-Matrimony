import React from "react";
import Image from "next/image";
import AuthCTA from "@/components/ui/AuthCTA";

const MissionSection = () => {
  return (
    <section className="w-full bg-white margin-y">
      <div className="containerpadding container mx-auto">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">

          {/* ── Left: text ── */}
          <div className="flex flex-col gap-6 lg:w-1/2">
            <h2 className="title font-poppins font-medium text-[#010806] ">
              Our Mission
            </h2>

            <p className="title-sub-top font-poppins text-[#4B5563] leading-relaxed">
              To create a secure, private, and trusted environment where Muslim
              families can connect and find the right life partner with
              confidence and peace of mind, guided by faith, shared values, and
              sincere intentions towards a meaningful and lasting union.
            </p>

            <AuthCTA
              variant="light"
              className="flex flex-wrap items-center gap-4"
              primaryBtnClassName="text-base px-4 py-3 sm:px-8 sm:py-3 font-medium"
            />
          </div>

          {/* ── Right: combined image ── */}
          <div className="flex items-center justify-center lg:justify-end lg:w-1/2">
            <Image
              src="/images/about/mission/rightmission.png"
              alt="Our mission — three people giving thumbs up with gold badge"
              width={640}
              height={480}
              className="h-auto w-full max-w-[560px] object-contain"
            />
          </div>

        </div>
      </div>
    </section>
  );
};

export default MissionSection;
