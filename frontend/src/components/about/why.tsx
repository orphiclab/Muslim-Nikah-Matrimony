import React from "react";
import Image from "next/image";
import AboutFourCards from "@/components/about/4cards";

const WhyChooseSection = () => {
  return (
    <section className="w-full bg-[#E6EEEC] margin-y py-12">
      <div className="flex flex-col gap-10">
        {/* Header */}
        <div className="containerpadding container mx-auto flex flex-col items-center text-center gap-5">
          <Image
            src="/images/your-journey/top.png"
            alt=""
            width={70}
            height={70}
            style={{ height: "auto" }}
            className="object-contain"
          />

        <h2 className="title font-poppins font-medium text-[#010806] leading-tight">
          Why Choose Our{" "}
          <span className="font-aref-ruqaa-ink font-bold text-[#DB9D30]">
            Platform
          </span>
        </h2>

          <p className="title-sub-top font-poppins text-[#02100DA8]/66 leading-relaxed max-w-4xl">
            Built on trust, privacy, and Islamic values, our platform offers a
            secure and meaningful matchmaking experience designed for families.
          </p>
        </div>

        {/* Cards */}
        <AboutFourCards />
      </div>
    </section>
  );
};

export default WhyChooseSection;
