import React from "react";

export default function Loading() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-[#F4F6F9]"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-12 w-12 rounded-full border-4 border-[#1B6B4A]/20 border-t-[#DB9D30] animate-spin"
          aria-hidden
        />
        <p className="font-poppins text-sm font-medium text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

