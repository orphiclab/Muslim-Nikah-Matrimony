import React from "react";
import type { LucideIcon } from "lucide-react";

type SafetyCardProps = {
  Icon: LucideIcon;
  title: string;
  description: string;
};

const ICON_CLASS =
  "h-[22px] w-[22px] shrink-0 text-[#DB9D30] lg:h-[28px] lg:w-[28px]";

const SafetyCard = ({ Icon, title, description }: SafetyCardProps) => {
  return (
    <div className="relative mx-auto w-full max-w-[315px]  ">
      <div className="relative">
        <svg
          viewBox="0 0 315 277"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <rect width="315" height="277" rx="25" fill="#397466" />
        </svg>

        <div className="relative z-10 flex h-full flex-col px-7 pb-10 pt-7">
          <div className="h-11 w-11 lg:h-14 lg:w-14">
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-white">
              <Icon className={ICON_CLASS} aria-hidden />
            </div>
          </div>

          <h3 className="mt-4 font-poppins  font-medium subtitle text-white h-auto lg:h-15 xl:h-auto ">
            {title}
          </h3>
          <p className="mt-3 font-aref-ruqaa-ink paragraph text-white h-auto lg:h-20 ">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SafetyCard;
