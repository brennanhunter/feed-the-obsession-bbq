"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BikeWeekModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Small delay so the page loads first, then the modal fades in
    const timer = setTimeout(() => setIsOpen(true), 500);

    // Listen for header button clicks to reopen the modal
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-bike-week-modal', handleOpen);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('open-bike-week-modal', handleOpen);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="relative mx-4 max-w-lg w-full bg-black border-y-4 border-brand-primary p-8 sm:p-10 text-center">
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-4 text-white/50 hover:text-brand-primary transition-all text-2xl font-bold cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Heading */}
        <h2 className="font-hellsrider text-4xl sm:text-5xl text-white mb-2 uppercase tracking-wider">
          Bike Week 2026
        </h2>

        {/* Red accent line */}
        <div className="w-24 h-1 bg-brand-primary mx-auto mb-6" />

        {/* Subheading */}
        <p className="text-brand-primary text-lg sm:text-xl font-bold uppercase tracking-wider mb-2">
          Welcome, You Beautiful Degenerates.
        </p>

        {/* Body copy */}
        <p className="text-white/80 text-sm sm:text-base mb-2 leading-relaxed">
          Strap in, throttle up, and get ready to stuff your face with the
          meanest damn BBQ in the game. We don&apos;t do weak sauce and we
          don&apos;t do excuses — just big smoke, cold drinks, and zero apologies.
        </p>
        <p className="text-white/50 text-sm mb-8 italic">
          Now quit standing around and pick your pit stop.
        </p>

        {/* Location buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push("/bike-week?location=obs")}
            className="font-hellsrider px-8 py-4 bg-brand-primary text-white text-lg uppercase tracking-widest cursor-pointer hover:bg-brand-primary transition-all duration-200"
          >
            OB&apos;s
          </button>
          <button
            onClick={() => router.push("/bike-week?location=sorry-charlies")}
            className="font-hellsrider px-8 py-4 bg-brand-primary text-white text-lg uppercase tracking-widest cursor-pointer hover:bg-brand-primary transition-all duration-200"
          >
            Sorry Charlie&apos;s
          </button>
        </div>

        {/* Bottom flavor text */}
        <p className="text-white/30 text-xs mt-6 uppercase tracking-wider">
          Veteran Owned
        </p>
      </div>
    </div>
  );
}
