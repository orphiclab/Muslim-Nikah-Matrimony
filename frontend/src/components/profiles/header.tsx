import React from 'react';
import Image from 'next/image';

const ProfilesHeader = () => {
  return (
    <section className="relative w-full bg-[#085140] overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/about/abtheader.png"
          alt=""
          fill priority
          className="object-cover object-center"
        />
      </div>
      <div className="relative z-10 containerpadding container mx-auto flex min-h-[500px] sm:min-h-[600px] md:min-h-[500px] lg:min-h-[600px] flex-col items-center justify-center gap-5 text-center margin-y">
        <p className="font-andada-pro title-sub-top font-light text-white">
          Follow a trusted path built on faith, privacy, and family values.
        </p>
        <h1 className="title font-poppins font-medium text-white leading-tight max-w-4xl">
          Your Journey Towards a{' '}
          <br />
          <span className="font-aref-ruqaa-ink font-bold text-[#DB9D30]">Blessed</span> Match
        </h1>
        <p className="paragraph font-poppins text-white max-w-4xl">
          Begin a meaningful journey guided by faith, trust, and sincere intentions. Our platform is designed to help you find a compatible life partner while honouring values, family involvement, and spiritual connection.
        </p>
      </div>
    </section>
  );
};

export default ProfilesHeader;
