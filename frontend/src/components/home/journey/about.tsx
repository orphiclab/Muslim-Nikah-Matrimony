import React from "react";
import Image from "next/image";

const About = () => {
  return (
    <section className="relative containerpadding container mx-auto bg-white overflow-hidden">

      {/* Left lantern */}
      <div className="absolute -left-4 top-[20%] lg:top-[30%]  -translate-y-1/2">
        <Image
          src="/images/your-journey/right-left.png"
          alt="Left lantern"
          width={160}
          height={220}
          className="h-auto w-20 object-contain sm:w-28 md:w-32 lg:w-40 xl:w-48 2xl:w-52"
        />
      </div>

      {/* Right lantern */}
      <div className="absolute -right-4 top-[20%] lg:top-[30%]  -translate-y-1/2">
        <Image
          src="/images/your-journey/right-left.png"
          alt="Right lantern"
          width={160}
          height={220}
          className="h-auto w-20 object-contain sm:w-28 md:w-32 lg:w-40 xl:w-48 2xl:w-52"
        />
      </div>

      <div className=" margin-y">
        <div className="flex flex-col items-center text-center gap-2">
          {/* Top decorative image */}
          <div className="mb-2 pt-5">
            <Image
              src="/images/your-journey/top.png"
              alt="Decorative ornament"
              width={80}
              height={80}
              style={{ height: "auto" }}
              className="object-contain"
            />
          </div>

          {/* Sub-heading */}
          <p className="text-[#02100D] font-andada-pro title-sub-top font-light ">
            Follow a trusted path built on faith, privacy, and family values.
          </p>

          {/* Main heading */}
          <h2 className=" title font-poppins font-[500] text-gray-900 leading-tight max-w-4xl">
            Your Journey Towards a{" "}
            <span className="text-[#DB9D30] font-aref-ruqaa-ink font-[700]">
              Blessed
            </span>{" "}
            Match
          </h2>
        </div>
      </div>
      
    </section>
  );
};

export default About;
