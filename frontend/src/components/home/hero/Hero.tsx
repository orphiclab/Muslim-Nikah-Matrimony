"use client";

import React from "react";
import Image from "next/image";
import { ShieldCheck, Users } from "lucide-react";
import AuthCTA from "@/components/ui/AuthCTA";

const Hero = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/images/hero/gemMobile.png"
          alt="Muslim Nikah Matrimony Hero"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 0vw"
          className="object-cover md:hidden"
          quality={100}
        />
        <Image
          src="/images/hero/HeroFInal.png"
          alt="Muslim Nikah Matrimony Hero"
          fill
          priority
          sizes="100vw"
          className="object-cover hidden md:block"
          quality={100}
        />
      </div>

      {/* Hero Content — left side */}
      <div className="relative z-10 flex items-center h-full  my-[20px] sm:my-[30px] md:my-[30px] lg:my-[50px] xl:my-[70px] 2xl:my-[60px]  ">
        <div className="containerpadding container mx-auto  w-full">
          <div className="max-w-3xl flex flex-col gap-4">
            {/* Badge */}
            <div data-aos="fade-left" data-aos-duration="1500" suppressHydrationWarning className="inline-flex w-fit items-center gap-2 bg-white/15 backdrop-blur-sm border title-sub-top border-white/30 text-white font-poppins text-sm font-normal px-6 py-2 rounded-full">
              Privacy-First Platform
            </div>

            {/* Heading */}
            <h1 data-aos="fade-right" data-aos-duration="1500" data-aos-easing="ease-in-out" suppressHydrationWarning className="text-4xl lg:text-6xl xl:text-[75px] font-semibold text-white font-poppins ">
              Find a Meaningful <br />
              Match with{" "}
              <span className="text-[#DB9D30] font-aref-ruqaa-ink font-bold">
                Trust,
              </span>
              <br />
              Privacy &{" "}
              <span className="text-[#DB9D30] font-aref-ruqaa-ink font-bold">
                Faith
              </span>
            </h1>

            {/* Description */}
            <p data-aos="fade-right" data-aos-duration="1500" data-aos-easing="ease-in-out" suppressHydrationWarning className="text-white/80 text-base lg:text-[20px] font-poppins leading-relaxed max-w-sm sm:max-w-md lg:max-w-xl xl:max-w-2xl  ">
              Built on trust, privacy, and values, our system helps families
              connect with the right matches through a refined and secure
              digital experience.
            </p>

            {/* Buttons — dynamic based on auth */}
            <AuthCTA
              variant="dark"
              className="flex items-center gap-4 flex-wrap"
              primaryBtnClassName="text-base px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-3 font-medium"
              secondaryBtnClassName="text-[#DB9D30] border font-medium px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-3 rounded-full text-base bg-white font-poppins hover:bg-[#FFFFFF]/80 transition-all duration-200"
            />

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-5 pt-2 max-w-xl">
              <div className="flex items-center gap-2 text-white text-sm lg:text-[20px] font-medium font-poppins ">
                <ShieldCheck className="w-5 h-5 lg:w-6 lg:h-6 text-[#DB9D30]" />
                Privacy-First
              </div>
              <div className="flex items-center gap-2 text-white text-sm lg:text-[20px]  font-medium font-poppins ">
                <ShieldCheck className="w-5 h-5 lg:w-6 lg:h-6 text-[#DB9D30]" />
                Verified Profiles
              </div>
              <div className="flex items-center gap-2 text-white text-sm lg:text-[20px]  font-medium font-poppins ">
                <Users className="w-5 h-5 lg:w-6 lg:h-6 text-[#DB9D30]" />
                Parent-Managed
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
