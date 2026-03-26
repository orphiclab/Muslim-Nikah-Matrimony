import React from "react";
import SafetyCard from "@/components/home/safety/card";
import {
  CircleCheckBig ,
  Eye,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";

const SAFETY_CARDS = [
  {
    Icon: ShieldCheck,
    title: "Secure Data",
    description: "Bank-level encryption protects all your information",
  },
  {
    Icon: CircleCheckBig,
    title: "Admin Verification",
    description: "Every profile is manually reviewed for authenticity",
  },
  {
    Icon: Eye,
    title: "Controlled Visibility",
    description: "You decide what others can see at every step",
  },
  {
    Icon: MessageSquareText,
    title: "Safe Messaging",
    description: "In-app messaging keeps your contact info private",
  },
];

const SafetyCards = () => {
  return (
    <section className="containerpadding container mx-auto bg-white">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {SAFETY_CARDS.map((card) => (
          <SafetyCard key={card.title} {...card} />
        ))}
      </div>

      {/* Center pill  */}
      <div className="mt-10 flex justify-center">
        <div className="flex items-center gap-3 rounded-full bg-[#E6EEEC] px-7 py-3 text-[#010806]">
          <ShieldCheck className="h-8 w-8 lg:h-8 lg:w-8 text-[#DB9D30]" />
          <p className="title-sub-top font-medium font-poppins text-center">
            Trusted by over 10,000+ families worldwide
          </p>
        </div>
      </div>
    </section>
  );
};

export default SafetyCards;
