import React from "react";
import Image from "next/image";
import EverythingFourCards from "@/components/home/everthing/4cards";

const COLUMN_ART_SRC = "/images/genuine/column-art.svg";

const columnArtImgLeft =
  "h-full min-h-0 w-auto max-w-[min(42vw,300px)] -translate-x-[8%] object-top-left object-contain";
const columnArtImgRight =
  "h-full min-h-0 w-auto max-w-[min(42vw,300px)] translate-x-[8%] scale-x-[-1] object-top-right object-contain";

const EverythingSection = () => {
  return (
    <section className="relative w-full overflow-hidden bg-[#E6EEEC] margin-y py-10">
      {/* Left column art — two stacked copies */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-0 flex min-h-0 flex-col select-none"
        aria-hidden
      >
        <div className="flex min-h-0 flex-1 basis-0 items-start justify-start">
          <img src={COLUMN_ART_SRC} alt="" className={columnArtImgLeft} />
        </div>
        {/* <div className="flex min-h-0 flex-1 basis-0 items-start justify-start">
          <img src={COLUMN_ART_SRC} alt="" className={columnArtImgLeft} />
        </div> */}
      </div>

      {/* Right column art — mirrored, two stacked copies */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-0 flex min-h-0 flex-col select-none"
        aria-hidden
      >
        <div className="flex min-h-0 flex-1 basis-0 items-start justify-end">
          <img src={COLUMN_ART_SRC} alt="" className={columnArtImgRight} />
        </div>
        {/* <div className="flex min-h-0 flex-1 basis-0 items-start justify-end">
          <img src={COLUMN_ART_SRC} alt="" className={columnArtImgRight} />
        </div> */}
      </div>

      <div className="containerpadding relative z-10 container mx-auto">
        <div className="flex flex-col items-center text-center gap-4">
          <Image
            src="/images/your-journey/top.png"
            alt="Ornament"
            width={80}
            height={80}
            className="object-contain"
          />

          <p className="text-[#02100D] font-andada-pro title-sub-top font-light max-w-4xl">
            Secure, private, and faith-guided matchmaking for families
          </p>

          <h2 className="title font-poppins font-medium text-[#010806] leading-tight max-w-4xl">
            Everything You Need for
            <br />
            a{" "}
            <span className="font-aref-ruqaa-ink font-bold text-[#DB9D30]">
              Blessed
            </span>{" "}
            Match
          </h2>
        </div>

        <div className="mt-12 w-full">
          <EverythingFourCards />
        </div>
      </div>
    </section>
  );
};

export default EverythingSection;
