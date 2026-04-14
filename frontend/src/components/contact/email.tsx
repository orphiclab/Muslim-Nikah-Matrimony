import React from "react";
import { Mail, PhoneCall, MapPin } from "lucide-react";

const CONTACT_ITEMS = [
  {
    icon: Mail,
    title: "Email Address",
    detail: "Info@muslimnikah.lk",
  },
  {
    icon: PhoneCall,
    title: "Contact Info",
    detail: "+94705687697",
  },
  {
    icon: MapPin,
    title: "Our Address",
    detail: "Galle Road, Ratmalana",
  },
] as const;

export default function ContactInfoSection() {
  return (
    <section className="w-full bg-white margin-y">
      <div className="containerpadding container mx-auto">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
          {CONTACT_ITEMS.map(({ icon: Icon, title, detail }) => (
            <div
              key={title}
              className="flex flex-col items-center gap-4 text-center"
            >
              {/* Icon circle */}
              <div className="flex h-16 w-16 lg:h-18 lg:w-18 xl:h-20 xl:w-20 items-center justify-center rounded-full bg-[#397466]">
                <Icon className="h-7 w-7 lg:h-8 lg:w-8 text-[#DB9D30]" strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h3 className="font-poppins ttext-[18px] sm:text-[19px] md:text-[20px] lg:text-[22px] xl:text-[24px] 2xl:text-[28px] font-medium text-[#0C0C0C]">
                {title}
              </h3>

              {/* Detail */}
              <p className="font-poppins title-sub-top text-[#878787] ">
                {detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
