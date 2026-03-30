import React from "react";
import Image from "next/image";

const ContactHero = () => {
  return (
    <section className="relative w-full bg-[#085140] overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/about/abtheader.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
        />
        {/* dark teal overlay so text stays readable */}
        {/* <div className="absolute inset-0 bg-[#0D3B2E]/90" /> */}
      </div>

      {/* Content */}
      <div className="relative z-10 containerpadding container mx-auto flex min-h-[500px] sm:min-h-[600px] md:min-h-[500px] lg:min-h-[600px] flex-col items-center justify-center gap-5  text-center margin-y">
        {/* Eyebrow */}
        <p className="font-andada-pro title-sub-top font-light text-white ">
        Guided by faith, rooted in family values.
        </p>

        {/* Heading */}
        <h1 className="title font-poppins font-medium text-white leading-tight max-w-4xl">
        Get in Touch for Support
          <br />
          and {" "}
          <span className="font-aref-ruqaa-ink font-bold text-[#DB9D30]">
          Guidance
          </span>
        </h1>

        {/* Description */}
        <p className="paragraph font-poppins text-white  max-w-4xl">
        Reach out to us for support, guidance, or any questions you may have. Our team is here to assist you with care and professionalism, ensuring a smooth and reassuring experience throughout your journey.
        </p>
      </div>
    </section>
  );
};

export default ContactHero;
