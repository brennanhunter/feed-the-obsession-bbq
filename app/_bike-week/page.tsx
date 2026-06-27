"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Typewriter from "typewriter-effect";

// Staggered line animation wrapper
function MenuLine({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.3 + index * 0.12, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function BikeWeekContent() {
  const searchParams = useSearchParams();
  const locationParam = searchParams.get("location");
  const [activeTab, setActiveTab] = useState<"obs" | "sorry-charlies">(
    locationParam === "sorry-charlies" ? "sorry-charlies" : "obs"
  );

  useEffect(() => {
    if (locationParam === "sorry-charlies") {
      setActiveTab("sorry-charlies");
    } else if (locationParam === "obs") {
      setActiveTab("obs");
    }
  }, [locationParam]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header bar */}
      <div className="bg-brand-secondary py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/logo.png"
              alt="FTO Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-display font-bold hidden sm:inline">FTO BBQ</span>
          </Link>
          <span className="text-white/50 text-sm uppercase tracking-widest">
            Veteran Owned
          </span>
        </div>
      </div>

      {/* Hero */}
      <div className="relative py-12 text-center">
        {/* Background logo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
          <Image
            src="/logo.png"
            alt="FTO Logo Background"
            width={600}
            height={600}
            className="w-[600px] h-[600px] object-contain"
          />
        </div>
        <h1 className="font-hellsrider text-5xl sm:text-6xl uppercase tracking-wider mb-3 [&_.Typewriter__cursor]:hidden relative z-10">
          <Typewriter
            options={{
              strings: ["Bike Week 2026"],
              autoStart: true,
              loop: false,
              delay: 70,
              cursor: "",
              deleteSpeed: Infinity,
            }}
          />
        </h1>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 96 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="h-1 bg-brand-primary mx-auto mb-4"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-white/60 text-lg uppercase tracking-widest"
        >
          February 25 &ndash; March 7
        </motion.p>
        {/* Full-width red line animating left to right */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className="absolute bottom-0 left-0 w-full h-1 bg-brand-primary origin-left"
        />
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-6 pt-10">
        <div className="flex justify-center gap-0">
          <button
            onClick={() => setActiveTab("obs")}
            className={`px-8 sm:px-12 py-4 font-extrabold text-lg uppercase tracking-widest cursor-pointer transition-all duration-200 border-b-4 ${
              activeTab === "obs"
                ? "text-white border-brand-primary bg-white/5"
                : "text-white/40 border-transparent hover:text-white/70 hover:border-white/20"
            }`}
          >
            OB&apos;s
          </button>
          <button
            onClick={() => setActiveTab("sorry-charlies")}
            className={`px-8 sm:px-12 py-4 font-extrabold text-lg uppercase tracking-widest cursor-pointer transition-all duration-200 border-b-4 ${
              activeTab === "sorry-charlies"
                ? "text-white border-brand-primary bg-white/5"
                : "text-white/40 border-transparent hover:text-white/70 hover:border-white/20"
            }`}
          >
            Sorry Charlie&apos;s
          </button>
        </div>

        {/* Tab content */}
        <div className="max-w-2xl mx-auto py-10">
          <AnimatePresence mode="wait">
            {activeTab === "obs" && (
              <motion.div
                key="obs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* OB's Main Menu */}
                <h2 className="font-hellsrider text-3xl sm:text-4xl text-center uppercase tracking-wider mb-2">
                  <Typewriter
                    key="obs-title"
                    options={{
                      strings: ["OB's Menu"],
                      autoStart: true,
                      loop: false,
                      delay: 60,
                      cursor: "_",
                      deleteSpeed: Infinity,
                    }}
                  />
                </h2>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: 64 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="h-1 bg-brand-primary mx-auto mb-8"
                />

                <div className="space-y-6 mb-12">
                  <MenuLine index={0}>
                    <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
                      <div>
                        <p className="text-xl font-bold uppercase tracking-wide">2 Hot Dogs (All Beef)</p>
                        <p className="text-white/50 text-sm mt-1">Served with a side of coleslaw</p>
                      </div>
                      <p className="text-brand-primary font-extrabold text-2xl ml-4 shrink-0">$10</p>
                    </div>
                  </MenuLine>

                  <MenuLine index={1}>
                    <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
                      <div>
                        <p className="text-xl font-bold uppercase tracking-wide">Sausage, Peppers &amp; Onions</p>
                        <p className="text-white/50 text-sm mt-1">Served with coleslaw</p>
                      </div>
                      <p className="text-brand-primary font-extrabold text-2xl ml-4 shrink-0">$12</p>
                    </div>
                  </MenuLine>
                </div>

                {/* Special Events */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="border-2 border-brand-primary p-6 sm:p-8"
                >
                  <h3 className="font-display text-2xl text-center uppercase tracking-wider mb-1 text-brand-primary">
                    Special Events
                  </h3>
                  <div className="w-12 h-1 bg-brand-primary mx-auto mb-6" />

                  <div className="space-y-6">
                    <MenuLine index={3}>
                      <div>
                        <p className="text-white/50 text-sm uppercase tracking-widest mb-2">
                          Wednesday, March 4 &mdash; Bike Night
                        </p>
                        <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
                          <p className="text-lg font-bold uppercase tracking-wide">Pulled Pork Sandwich w/ Slaw</p>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/10 pb-3 mt-3">
                          <p className="text-lg font-bold uppercase tracking-wide">Brisket Sandwich w/ Slaw</p>
                        </div>
                      </div>
                    </MenuLine>

                    <MenuLine index={4}>
                      <div>
                        <p className="text-white/50 text-sm uppercase tracking-widest mb-2">
                          Saturday, March 7 &mdash; OB&apos;s Birthday Party
                        </p>
                        <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
                          <p className="text-lg font-bold uppercase tracking-wide">Pulled Pork Sandwich w/ Slaw</p>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/10 pb-3 mt-3">
                          <p className="text-lg font-bold uppercase tracking-wide">Brisket Sandwich w/ Slaw</p>
                        </div>
                      </div>
                    </MenuLine>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === "sorry-charlies" && (
              <motion.div
                key="sorry-charlies"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="font-hellsrider text-3xl sm:text-4xl text-center uppercase tracking-wider mb-2">
                  <Typewriter
                    key="sc-title"
                    options={{
                      strings: ["Sorry Charlie's Menu"],
                      autoStart: true,
                      loop: false,
                      delay: 50,
                      cursor: "_",
                      deleteSpeed: Infinity,
                    }}
                  />
                </h2>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: 64 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="h-1 bg-brand-primary mx-auto mb-8"
                />

                {/* Mains */}
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/50 text-sm uppercase tracking-widest mb-4"
                >
                  Sandwiches
                </motion.h3>
                <div className="space-y-6 mb-10">
                  <MenuLine index={0}>
                    <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
                      <div>
                        <p className="text-xl font-bold uppercase tracking-wide">Brisket Sandwich</p>
                        <p className="text-white/50 text-sm mt-1">With choice of side</p>
                      </div>
                      <p className="text-brand-primary font-extrabold text-2xl ml-4 shrink-0">$18</p>
                    </div>
                  </MenuLine>

                  <MenuLine index={1}>
                    <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
                      <div>
                        <p className="text-xl font-bold uppercase tracking-wide">Pulled Pork Sandwich</p>
                        <p className="text-white/50 text-sm mt-1">With choice of side</p>
                      </div>
                      <p className="text-brand-primary font-extrabold text-2xl ml-4 shrink-0">$15</p>
                    </div>
                  </MenuLine>
                </div>

                {/* Sides */}
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-white/50 text-sm uppercase tracking-widest mb-4"
                >
                  Sides
                </motion.h3>
                <div className="space-y-4 mb-6">
                  <MenuLine index={2}>
                    <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
                      <p className="text-lg font-bold uppercase tracking-wide">Baked Beans</p>
                      <p className="text-white/40 text-sm">Included</p>
                    </div>
                  </MenuLine>
                  <MenuLine index={3}>
                    <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
                      <p className="text-lg font-bold uppercase tracking-wide">Coleslaw</p>
                      <p className="text-white/40 text-sm">Included</p>
                    </div>
                  </MenuLine>
                </div>

                <MenuLine index={4}>
                  <div className="bg-white/5 p-4 text-center">
                    <p className="text-white/60 text-sm uppercase tracking-wider">
                      Extra Side &mdash; <span className="text-brand-primary font-bold">$3</span>
                    </p>
                  </div>
                </MenuLine>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back link */}
        <div className="text-center pb-12">
          <Link
            href="/"
            className="text-white/40 text-sm uppercase tracking-widest hover:text-brand-primary transition-all"
          >
            &larr; Back to Main Site
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BikeWeekPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <BikeWeekContent />
    </Suspense>
  );
}
