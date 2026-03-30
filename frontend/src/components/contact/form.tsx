import React from "react";
import { CheckCircle2 } from "lucide-react";
import MainButton from "@/components/ui/mainbtn";

const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 2xl:h-8 2xl:w-8">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 2xl:h-8 2xl:w-8">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 2xl:h-8 2xl:w-8">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const FEATURES = [
  {
    title: "Personalized Guidance",
    desc: "Receive support tailored to your matchmaking journey.",
  },
  {
    title: "Private & Secure Communication",
    desc: "Your information and conversations are handled with complete confidentiality.",
  },
  {
    title: "Faith-Centered Support",
    desc: "Our team understands your values and is here to help you every step of the way.",
  },
  {
    title: "Quick Response Time",
    desc: "We aim to respond to all enquiries within 24 hours.",
  },
] as const;

export default function ContactFormSection() {
  return (
    <section className="w-full bg-white margin-y py-10">
      <div className="containerpadding container mx-auto">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">

          {/* ── Left: text + features + social ── */}
          <div className="flex flex-col gap-6 lg:w-6/12">
            <h2 className="text-[20px] sm:text-[22px] md:text-[24px] lg:text-[28px] xl:text-[32px] 2xl:text-[40px]  font-poppins font-medium text-[#010806] leading-tight">
              Talk to Our Support Team Today
            </h2>

            <p className="font-poppins title-sub-top text-[#878787] leading-relaxed">
              Get in touch with our team for any questions or support throughout
              your journey. We&apos;re here to guide you with care, privacy, and
              professionalism.
            </p>

            {/* Feature list */}
            <ul className="flex flex-col gap-4">
              {FEATURES.map(({ title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 2xl:h-8 2xl:w-8 shrink-0 text-[#DB9D30]" />
                  <div>
                    <p className="font-poppins subtitle font-medium text-[#010806]">
                      {title}
                    </p>
                    <p className="font-poppins title-sub-top text-[#02100DA8]/66 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Social icons */}
            <div className="flex items-center gap-5 pt-2">
              <a
                href="#"
                aria-label="WhatsApp"
                className="text-[#010806] transition-colors hover:text-[#25D366]"
              >
                <WhatsAppIcon />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="text-[#010806] transition-colors hover:text-[#E1306C]"
              >
                <InstagramIcon />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="text-[#010806] transition-colors hover:text-[#1877F2]"
              >
                <FacebookIcon />
              </a>
            </div>
          </div>

          {/* ── Right: form ── */}
          <div className="flex-1 rounded-3xl bg-[#E6EEEC] p-6">
            <h3 className="mb-6 font-poppins text-[18px] md:text-[19px] lg:text-[20px] xl:text-[20px] 2xl:text-[30px] font-medium text-[#010806]">
              Please enter your information
            </h3>

            <form className="flex flex-col gap-5">
              {/* First / Last name */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="font-poppins title-sub-top font-medium text-[#02100DA8]/66">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    className="rounded-lg font-poppins  border border-transparent bg-white px-4 py-2.5 text-[14px] text-[#010806] outline-none transition focus:border-[#397466] focus:ring-2 focus:ring-[#397466]/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-poppins title-sub-top  font-medium text-[#02100DA8]/66">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    className="rounded-lg font-poppins  border border-transparent bg-white px-4 py-2.5 text-[14px] text-[#010806] outline-none transition focus:border-[#397466] focus:ring-2 focus:ring-[#397466]/20"
                  />
                </div>
              </div>

              {/* Email / Phone */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="font-poppins title-sub-top font-medium text-[#02100DA8]/66">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder=""
                    className="rounded-lg font-poppins  border border-transparent bg-white px-4 py-2.5 text-[14px] text-[#010806] outline-none transition focus:border-[#397466] focus:ring-2 focus:ring-[#397466]/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-poppins title-sub-top font-medium text-[#02100DA8]/66">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder=""
                    className="rounded-lg font-poppins  border border-transparent bg-white px-4 py-2.5 text-[14px] text-[#010806] outline-none transition focus:border-[#397466] focus:ring-2 focus:ring-[#397466]/20"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="font-poppins title-sub-top font-medium text-[#02100DA8]/66">
                  Message
                </label>
                <textarea
                  rows={12}
                  placeholder=""
                  className="resize-none font-poppins  rounded-lg border border-transparent bg-white px-4 py-2.5 text-[14px] text-[#010806] outline-none transition focus:border-[#397466] focus:ring-2 focus:ring-[#397466]/20"
                />
              </div>

              {/* Submit */}
              <MainButton
                type="submit"
                className="w-full py-3 text-base font-semibold font-poppins"
              >
                Send Message
              </MainButton>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
