import React from "react";
import Image from "next/image";

const SafetyHeader = () => {
  return (
    <section className="w-full bg-white margin-y containerpadding container mx-auto ">
      <div className="flex flex-col items-center text-center gap-4">
        {/* Top ornament */}
        <div className="pt-2">
          <Image
            src="/images/your-journey/top.png"
            alt="Ornament"
            width={80}
            height={80}
            style={{ height: "auto" }}
            className="object-contain"
          />
        </div>

        {/* Subtitle */}
        <p className="text-[#02100D] font-andada-pro title-sub-top font-light max-w-4xl">
          Multiple layers of protection ensure your family&apos;s privacy and
          security at every interaction
        </p>

        {/* Title */}
        <h2 className="title font-poppins font-medium text-[#010806] leading-tight max-w-4xl">
          Your Safety is Our
          <span className="block text-[#DB9D30] font-aref-ruqaa-ink font-bold">
            Priority
          </span>
        </h2>
      </div>
    </section>
  );
};

export default SafetyHeader;

