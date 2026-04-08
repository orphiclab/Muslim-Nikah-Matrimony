import React from "react";

const CARD_PATH =
  "M309.943 216.819V242.616C309.961 281.733 309.961 319.219 309.961 333.86C309.961 368.765 276.528 369.171 274.998 369.171H274.936C273.697 396.011 246.103 397.438 240.203 397.438C239.495 397.438 239.106 397.424 239.106 397.424C239.106 397.424 236.823 423.781 197.454 434.455C173.886 441.898 154.98 459.428 154.98 459.428C154.98 459.428 136.074 441.898 112.506 434.455C73.1375 423.781 70.8549 397.424 70.8549 397.424C70.8549 397.424 70.4657 397.438 69.7579 397.438C63.857 397.438 36.2812 396.011 35.0249 369.171H34.9896C33.4325 369.171 0 368.765 0 333.86C0 319.219 -9.71912e-06 281.733 0.0176841 242.616V216.819C-9.71912e-06 177.702 0 140.216 0 125.575C0 90.6698 33.4325 90.2641 34.9896 90.2641H35.0249C36.2812 63.4241 63.857 61.9761 69.7579 61.9761C70.4657 61.9761 70.8549 62.0041 70.8549 62.0041C70.8549 62.0041 73.1375 35.6468 112.506 24.9723C136.066 17.5296 154.971 0 154.971 0C154.971 0 173.877 17.5296 197.445 24.9723C236.814 35.6468 239.097 62.0041 239.097 62.0041C239.097 62.0041 239.486 61.9761 240.194 61.9761C246.095 61.9761 273.688 63.4241 274.927 90.2641H274.989C276.519 90.2641 309.952 90.6698 309.952 125.575C309.952 140.216 309.952 177.702 309.934 216.819H309.943Z";

const STEPS = [
  {
    step: 1,
    title: "Create Account",
    description:
      "Sign up as a parent or guardian with secure credentials",
  },
  {
    step: 2,
    title: "Add Basic Details",
    description:
      "Share essential information while keeping names private",
  },
  {
    step: 3,
    title: "Choose Subscription",
    description: "Select a plan that fits your timeline and needs",
  },
  {
    step: 4,
    title: "Activate Profile",
    description: "Go live and start connecting with compatible matches",
  },
] as const;

function JourneyCard({
  step,
  title,
  description,
}: (typeof STEPS)[number]) {
  return (
    <div className="relative">
      {/* Background SVG — separate layer; inner padding only affects text */}
      <div className="relative aspect-310/460 w-full">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 310 460"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path d={CARD_PATH} fill="#397466" />
        </svg>

        <div className="relative z-10 flex h-full flex-col items-center px-4 pb-10 pt-4 text-center text-white sm:px-8 sm:pt-14 lg:pt-8 xl:pt-16">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 lg:h-11 lg:w-11 shrink-0 items-center justify-center rounded-full bg-[#DB9D30] text-lg font-bold text-white shadow-sm mb-4 lg:mb-6 xl:mb-10">
            {step}
          </div>
          <div className="flex flex-col gap-0 lg:gap-4">
            <h3 className="font-poppins text-[16px] sm:text-[17px] md:text-[20px] lg:text-[20px] xl:text-[22px] 2xl:text-[25px] font-medium min-h-[3rem] lg:min-h-fit xl:min-h-[3.5rem] flex items-center justify-center leading-tight lg:whitespace-nowrap lg:text-[16px] xl:text-[20px] 2xl:subtitle">
              {title}
            </h3>
            <p className="font-aref-ruqaa-ink max-w-[320px] paragraph text-white/90">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const JourneyCards = () => {
  return (
    <section className="containerpadding container mx-auto bg-white">
      <div className="grid grid-cols-2 gap-0 sm:grid-cols-2  sm:gap-6 lg:grid-cols-4 lg:gap-5 xl:gap-8">
        {STEPS.map((item) => (
          <JourneyCard key={item.step} {...item} />
        ))}
      </div>
    </section>
  );
};

export default JourneyCards;
