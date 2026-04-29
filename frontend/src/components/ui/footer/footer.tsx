import React from "react";
import Image from "next/image";
import Link from "next/link";
import FooterNewsletter from "@/components/ui/footer/FooterNewsletter";

const Footer = () => {
  return (
    <footer className="relative w-full overflow-hidden" style={{ backgroundColor: "#085140" }}>
      {/* Background SVG with low opacity */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none">
        <Image
          src="/images/footer/footerbg.svg"
          alt=""
          fill
          className="object-cover "
          priority={false}
        />
      </div>

      <div className="relative z-10 container mx-auto containerpadding  pt-12 pb-6">
        {/* Top Row: Brand info left, Subscribe right */}
        <div className="flex flex-col lg:flex-row justify-between gap-10 lg:gap-0">
          {/* Left: Brand */}
          <div className="max-w-sm">
            <h3 className="text-white font-medium text-[17px] sm:text-[18px] md:text-[19px] lg:text-[19px] xl:text-[23px] 2xl:text-[24px] font-poppins mb-3">
              Muslim Nikah
            </h3>
            <p className="text-white/55 footer-sub font-poppins leading-relaxed">
              A trusted matrimonial platform dedicated to helping families find
              meaningful and halal connections with complete privacy and respect.
            </p>
          </div>

          {/* Right: Subscribe + Social */}
          <div className="flex w-full min-w-0 flex-col items-stretch gap-5 lg:w-auto lg:items-start">
            <p className="text-white font-medium text-[17px] sm:text-[18px] md:text-[19px] lg:text-[19px] xl:text-[23px] 2xl:text-[24px]  font-poppins">
              Subscribe
            </p>
            <div className="flex w-full min-w-0 flex-col items-stretch gap-5 lg:items-end">
            <FooterNewsletter />

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {/* LinkedIn */}
              <a
                href="#"
                aria-label="LinkedIn"
                className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S.02 4.88.02 3.5C.02 2.12 1.13 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm6.5 0h3.84v2.19h.05C11.52 8.84 13.1 8 15.02 8 19.07 8 20 10.6 20 14.07V24h-4v-9.07c0-2.17-.04-4.96-3.02-4.96-3.03 0-3.49 2.36-3.49 4.8V24H7V8z" />
                </svg>
              </a>
              {/* Facebook */}
              <a
                href="https://www.facebook.com/muslimnikah.lk/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.676 0H1.324C.593 0 0 .593 0 1.324v21.352C0 23.408.593 24 1.324 24h11.494v-9.294H9.689v-3.621h3.129V8.41c0-3.099 1.894-4.785 4.659-4.785 1.325 0 2.464.097 2.796.141v3.24h-1.921c-1.5 0-1.792.721-1.792 1.771v2.311h3.584l-.465 3.63H16.56V24h6.115c.733 0 1.325-.592 1.325-1.324V1.324C24 .593 23.408 0 22.676 0" />
                </svg>
              </a>
              {/* Twitter / X */}
              <a
                href="#"
                aria-label="Twitter"
                className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        </div>

        {/* Large brand name — single line; fluid size capped at 180px (11.25rem) */}
        <div className="mt-8 mb-2 w-full select-none overflow-hidden">
          <h1
            className="flex justify-between w-full font-poppins text-[44px] sm:text-[56px] md:text-[84px] lg:text-[116px] xl:text-[148px] 2xl:text-[180px] font-semibold uppercase leading-none"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {"MUSLIM NIKAH".split("").map((char, index) => (
              <span key={index}>{char === " " ? "\u00A0" : char}</span>
            ))}
          </h1>
        </div>

        {/* Dashed divider */}
        <div className="border-t border-dashed border-white/30 my-4" />

        {/* Bottom Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between footer-sub gap-3 text-sm font-poppins text-white/60">
          <p>@ 2026 MuslimNikah. All right reserved.</p>
          <div className="flex items-center footer-sub  gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>

        <p className="mt-3 text-center text-xs md:text-sm font-poppins text-white/55">
          Designed by{" "}
          <a
            href="https://growthswitch.co/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-[#DB9D30] transition-colors  underline underline-offset-2"
          >
            Growth Switch
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
