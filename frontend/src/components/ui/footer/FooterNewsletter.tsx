"use client";

import React, { useState } from "react";

function isValidEmail(value: string) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
    value.trim(),
  );
}

export default function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setMessage("Please enter your email.");
      setStatus("error");
      return;
    }
    if (!isValidEmail(trimmed)) {
      setMessage("Please enter a valid email address.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        details?: string;
      } | null;

      if (!res.ok || !data?.ok) {
        if (res.status === 400 && data?.error) {
          setMessage(data.error);
        } else {
          console.error("[FooterNewsletter] Subscribe failed", {
            status: res.status,
            error: data?.error,
            details: data?.details,
          });
          setMessage("Something went wrong. Please try again later.");
        }
        setStatus("error");
        return;
      }

      setEmail("");
      setStatus("success");
      setMessage("Thanks! You're subscribed.");
    } catch (err) {
      console.error("[FooterNewsletter] Network error", err);
      setStatus("error");
      setMessage("Could not connect. Check your network and try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubscribe}
      className="flex w-full max-w-full min-w-0 flex-col gap-1.5 sm:max-w-[18rem]"
    >
      <div className="flex w-full min-w-0 items-center overflow-hidden rounded-full bg-white shadow-md">
        <input
          type="email"
          name="newsletter-email"
          placeholder="Enter email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error" || status === "success") {
              setStatus("idle");
              setMessage("");
            }
          }}
          disabled={status === "loading"}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-poppins text-sm text-gray-700 outline-none placeholder:text-gray-400 disabled:opacity-60 sm:px-5 sm:py-3"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="m-0.5 flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-full text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:h-11 sm:w-11"
          style={{ backgroundColor: "#DB9D30" }}
          aria-label="Subscribe to newsletter"
        >
          {status === "loading" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          )}
        </button>
      </div>
      {message ? (
        <p
          className={`font-poppins text-xs sm:text-sm ${
            status === "success" ? "text-emerald-200" : "text-red-200"
          }`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
