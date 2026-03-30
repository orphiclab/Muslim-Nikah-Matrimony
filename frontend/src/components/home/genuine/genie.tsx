import React from "react";
import Image from "next/image";
import GenuineProfileCards from "@/components/home/genuine/card";
import MainButton from "@/components/ui/mainbtn";

const COLUMN_ART_SRC = "/images/genuine/column-art.svg";

const columnArtImgLeft =
  "h-full min-h-0 w-auto max-w-[min(42vw,300px)] -translate-x-[8%] object-top-left object-contain";
const columnArtImgRight =
  "h-full min-h-0 w-auto max-w-[min(42vw,300px)] translate-x-[8%] scale-x-[-1] object-top-right object-contain";

const GenuineSection = () => {
  return (
    <section className="relative w-full overflow-hidden bg-[#E6EEEC] margin-y py-10">
      {/* Two stacked copies of column art — fills full section height */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-0 flex min-h-0 flex-col select-none"
        aria-hidden
      >
        <div className="flex min-h-0 flex-1 basis-0 items-start justify-start">
          <img src={COLUMN_ART_SRC} alt="" className={columnArtImgLeft} />
        </div>
        <div className="flex min-h-0 flex-1 basis-0 items-start justify-start">
          <img src={COLUMN_ART_SRC} alt="" className={columnArtImgLeft} />
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-0 flex min-h-0 flex-col select-none"
        aria-hidden
      >
        <div className="flex min-h-0 flex-1 basis-0 items-start justify-end">
          <img src={COLUMN_ART_SRC} alt="" className={columnArtImgRight} />
        </div>
        <div className="flex min-h-0 flex-1 basis-0 items-start justify-end">
          <img src={COLUMN_ART_SRC} alt="" className={columnArtImgRight} />
        </div>
      </div>

      <div className="containerpadding relative z-10 container mx-auto">
        {/* Title block (same style as about.tsx / safety/header.tsx) */}
        <div className="flex flex-col items-center text-center gap-4">
          <Image
            src="/images/your-journey/top.png"
            alt="Ornament"
            width={80}
            height={80}
            style={{ height: "auto" }}
            className="object-contain"
          />

          <p className="text-[#02100D] font-andada-pro title-sub-top font-light max-w-4xl">
            Each profile is verified to maintain trust, privacy, and meaningful
            connections
          </p>

          <h2 className="title font-poppins font-medium text-[#010806] leading-tight max-w-4xl">
            Genuine Profiles for
            <br />
            Meaningful{" "}
            <span className="font-aref-ruqaa-ink font-bold text-[#DB9D30]">
              Matches
            </span>
          </h2>
        </div>

        {/* Profiles grid  */}
        <div className="mt-12">
          <GenuineProfileCards />
        </div>

        <div className="mt-10 flex justify-center">
          <MainButton
            type="button"
            className="text-base font-medium px-8 py-3  lg:px-15 lg:py-3 font-poppins"
          >
            More Profiles
          </MainButton>
        </div>
      </div>
    </section>
  );
};

export default GenuineSection;
