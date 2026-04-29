
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { CheckCircle2, X } from "lucide-react";
import MainButton from "@/components/ui/mainbtn";
import { RECAPTCHA_V3_ACTION } from "@/lib/recaptcha";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

const RECAPTCHA_SITE_KEY =
  typeof process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY === "string"
    ? process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY.trim()
    : "";

function getRecaptchaToken(siteKey: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }
    const g = window.grecaptcha;
    if (!g?.ready) {
      resolve(null);
      return;
    }
    g.ready(async () => {
      try {
        const token = await g.execute(siteKey, { action: RECAPTCHA_V3_ACTION });
        resolve(typeof token === "string" && token.length > 0 ? token : null);
      } catch {
        resolve(null);
      }
    });
  });
}

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

function isValidEmail(value: string) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
    value.trim(),
  );
}

function phoneDigitsOnly(phone: string) {
  return phone.replace(/[\s\-().+]/g, "");
}

function isValidPhoneOptional(phone: string) {
  const t = phone.trim();
  if (!t) return true;
  const d = phoneDigitsOnly(t);
  return /^\d+$/.test(d) && d.length >= 8 && d.length <= 15;
}

const MIN_MESSAGE_CHARS = 5;

type ToastState = {
  variant: "success" | "error";
  title: string;
  description?: string;
};

function ContactToast({
  toast,
  onClose,
}: {
  toast: ToastState;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 5200);
    return () => clearTimeout(t);
  }, [onClose]);

  const isSuccess = toast.variant === "success";

  return (
    <div
      role="status"
      className="fixed right-4 top-24 z-200 w-[min(100vw-2rem,22rem)] animate-in fade-in slide-in-from-right-4 duration-300 md:right-8"
    >
      <div
        className={`overflow-hidden rounded-xl border bg-[#F7F9F8] shadow-lg ${
          isSuccess ? "border-[#E6EEEC]" : "border-red-100"
        }`}
      >
        <div
          className={`h-1.5 w-full ${isSuccess ? "bg-[#DB9D30]" : "bg-red-500"}`}
        />
        <div className="flex items-start gap-3 p-4 pr-2">
          <div className="min-w-0 flex-1">
            <p
              className={`font-poppins text-sm font-semibold ${
                isSuccess ? "text-[#1D6B3A]" : "text-[#B42318]"
              }`}
            >
              {toast.title}
            </p>
            {toast.description ? (
              <p className="mt-1 font-poppins text-xs leading-relaxed text-[#5c6562]">
                {toast.description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-[#878787] transition hover:bg-black/5 hover:text-[#010806]"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

const inputBase =
  "rounded-lg font-poppins border bg-white px-4 py-2.5 text-[14px] text-[#010806] outline-none transition focus:ring-2 focus:ring-[#397466]/20";

export default function ContactFormSection() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [messageError, setMessageError] = useState("");

  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [toast, setToast] = useState<ToastState | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const canSubmit = useMemo(() => {
    const namesOk = firstName.trim() && lastName.trim();
    const emailOk = email.trim() && isValidEmail(email);
    const phoneOk = isValidPhoneOptional(phone);
    const msgOk = message.trim().length >= MIN_MESSAGE_CHARS;
    return Boolean(namesOk && emailOk && phoneOk && msgOk && status !== "submitting");
  }, [email, firstName, lastName, message, phone, status]);

  function validateFields(): boolean {
    let ok = true;
    if (!email.trim()) {
      setEmailError("Email is required.");
      ok = false;
    } else if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address.");
      ok = false;
    } else {
      setEmailError("");
    }

    if (!isValidPhoneOptional(phone)) {
      setPhoneError(
        "Use 8–15 digits only, or leave blank. Spaces and + are allowed.",
      );
      ok = false;
    } else {
      setPhoneError("");
    }

    const msg = message.trim();
    if (!msg) {
      setMessageError("Message is required.");
      ok = false;
    } else if (msg.length < MIN_MESSAGE_CHARS) {
      setMessageError(
        `Please enter at least ${MIN_MESSAGE_CHARS} characters.`,
      );
      ok = false;
    } else {
      setMessageError("");
    }

    return ok;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateFields()) return;

    setStatus("submitting");

    try {
      let recaptchaToken: string | undefined;
      if (RECAPTCHA_SITE_KEY) {
        recaptchaToken = (await getRecaptchaToken(RECAPTCHA_SITE_KEY)) ?? undefined;
        if (!recaptchaToken) {
          setStatus("idle");
          setToast({
            variant: "error",
            title: "Security check failed",
            description:
              "Could not verify the form. Disable blockers or wait a moment and try again.",
          });
          return;
        }
      }

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email: email.trim(),
          phone: phone.trim(),
          message,
          ...(recaptchaToken ? { recaptchaToken } : {}),
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        details?: string;
      } | null;

      if (!res.ok || !data || data.ok !== true) {
        if (res.status === 400 && data?.error) {
          const errLower = data.error.toLowerCase();
          if (
            errLower.includes("email") ||
            errLower.includes("phone") ||
            errLower.includes("message") ||
            errLower.includes("short")
          ) {
            if (errLower.includes("email")) {
              setEmailError(data.error);
            }
            if (errLower.includes("phone")) {
              setPhoneError(data.error);
            }
            if (errLower.includes("message") || errLower.includes("short")) {
              setMessageError(data.error);
            }
          }
          setToast({
            variant: "error",
            title: "Please check the form",
            description: data.error,
          });
        } else {
          console.error("[ContactForm] Send failed", {
            status: res.status,
            error: data?.error,
            details: data?.details,
          });
          setToast({
            variant: "error",
            title: "Message failed to send",
            description:
              "Something went wrong on our side. Please try again later.",
          });
        }
        setStatus("idle");
        return;
      }

      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setEmailError("");
      setPhoneError("");
      setMessageError("");
      setStatus("idle");
      setToast({
        variant: "success",
        title: "Message sent successfully",
        description: "We'll get back to you soon.",
      });
    } catch (err) {
      console.error("[ContactForm] Network or unexpected error", err);
      setStatus("idle");
      setToast({
        variant: "error",
        title: "Message failed to send",
        description:
          "Could not reach the server. Check your connection and try again.",
      });
    }
  }

  return (
    <section className="w-full bg-white margin-y py-10">
      {RECAPTCHA_SITE_KEY ? (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY)}`}
          strategy="afterInteractive"
        />
      ) : null}
      {toast ? (
        <ContactToast toast={toast} onClose={dismissToast} />
      ) : null}

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
                href="https://www.facebook.com/muslimnikah.lk/"
                target="_blank"
                rel="noopener noreferrer"
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

            <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
              {/* First / Last name */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="font-poppins title-sub-top font-medium text-[#02100DA8]/66">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="John"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`${inputBase} border-transparent focus:border-[#397466]`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-poppins title-sub-top  font-medium text-[#02100DA8]/66">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Doe"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`${inputBase} border-transparent focus:border-[#397466]`}
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
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    onBlur={() => {
                      if (email.trim() && !isValidEmail(email)) {
                        setEmailError("Enter a valid email address.");
                      }
                    }}
                    className={`${inputBase} ${
                      emailError
                        ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                        : "border-transparent focus:border-[#397466]"
                    }`}
                  />
                  {emailError ? (
                    <p className="font-poppins text-xs text-[#B42318]">
                      {emailError}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-poppins title-sub-top font-medium text-[#02100DA8]/66">
                    Phone <span className="font-normal opacity-70">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+94 77 123 4567"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError("");
                    }}
                    onBlur={() => {
                      if (phone.trim() && !isValidPhoneOptional(phone)) {
                        setPhoneError(
                          "Use 8–15 digits, or leave blank.",
                        );
                      }
                    }}
                    className={`${inputBase} ${
                      phoneError
                        ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                        : "border-transparent focus:border-[#397466]"
                    }`}
                  />
                  {phoneError ? (
                    <p className="font-poppins text-xs text-[#B42318]">
                      {phoneError}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="font-poppins title-sub-top font-medium text-[#02100DA8]/66">
                  Message
                </label>
                <textarea
                  rows={12}
                  placeholder="Enter your message"
                  value={message}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMessage(v);
                    if (
                      messageError &&
                      v.trim().length >= MIN_MESSAGE_CHARS
                    ) {
                      setMessageError("");
                    }
                  }}
                  onBlur={() => {
                    const t = message.trim();
                    if (t && t.length < MIN_MESSAGE_CHARS) {
                      setMessageError(
                        `Please enter at least ${MIN_MESSAGE_CHARS} characters.`,
                      );
                    } else if (!t) {
                      setMessageError("");
                    }
                  }}
                  className={`resize-none ${inputBase} ${
                    messageError
                      ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                      : "border-transparent focus:border-[#397466]"
                  }`}
                />
                {messageError ? (
                  <p className="font-poppins text-xs text-[#B42318]">
                    {messageError}
                  </p>
                ) : null}
              </div>

              {/* Submit */}
              <MainButton
                type="submit"
                disabled={!canSubmit}
                className="w-full py-3 text-base font-semibold font-poppins"
              >
                {status === "submitting" ? "Sending..." : "Send Message"}
              </MainButton>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
