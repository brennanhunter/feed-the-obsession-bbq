"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

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
      <div className="bg-[#222831] py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-display font-bold hover:text-red-600 transition-all">
            FTO BBQ
          </Link>
          <span className="text-white/50 text-sm uppercase tracking-widest">
            Veteran Owned
          </span>
        </div>
      </div>

      {/* Hero */}
      <div className="border-b-4 border-red-600 py-12 text-center">
        <h1 className="font-hellsrider text-5xl sm:text-6xl uppercase tracking-wider mb-3">
          Bike Week 2026
        </h1>
        <div className="w-24 h-1 bg-red-600 mx-auto mb-4" />
        <p className="text-white/60 text-lg uppercase tracking-widest">
          February 25 &ndash; March 7
        </p>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-6 pt-10">
        <div className="flex justify-center gap-0">
          <button
            onClick={() => setActiveTab("obs")}
            className={`px-8 sm:px-12 py-4 font-extrabold text-lg uppercase tracking-widest cursor-pointer transition-all duration-200 border-b-4 ${
              activeTab === "obs"
                ? "text-white border-red-600 bg-white/5"
                : "text-white/40 border-transparent hover:text-white/70 hover:border-white/20"
            }`}
          >
            OB&apos;s
          </button>
          <button
            onClick={() => setActiveTab("sorry-charlies")}
            className={`px-8 sm:px-12 py-4 font-extrabold text-lg uppercase tracking-widest cursor-pointer transition-all duration-200 border-b-4 ${
              activeTab === "sorry-charlies"
                ? "text-white border-red-600 bg-white/5"
                : "text-white/40 border-transparent hover:text-white/70 hover:border-white/20"
            }`}
          >
            Sorry Charlie&apos;s
          </button>
        </div>

        {/* Tab content */}
        <div className="max-w-2xl mx-auto py-10">
          {activeTab === "obs" && (
            <div>
              {/* OB's Main Menu */}
              <h2 className="font-hellsrider text-3xl sm:text-4xl text-center uppercase tracking-wider mb-2">
                OB&apos;s Menu
              </h2>
              <div className="w-16 h-1 bg-red-600 mx-auto mb-8" />

              <div className="space-y-6 mb-12">
                <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
                  <div>
                    <p className="text-xl font-bold uppercase tracking-wide">2 Hot Dogs (All Beef)</p>
                    <p className="text-white/50 text-sm mt-1">Served with a side of coleslaw</p>
                  </div>
                  <p className="text-red-600 font-extrabold text-2xl ml-4 shrink-0">$10</p>
                </div>

                <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
                  <div>
                    <p className="text-xl font-bold uppercase tracking-wide">Sausage, Peppers &amp; Onions</p>
                    <p className="text-white/50 text-sm mt-1">Served with coleslaw</p>
                  </div>
                  <p className="text-red-600 font-extrabold text-2xl ml-4 shrink-0">$12</p>
                </div>
              </div>

              {/* Special Events */}
              <div className="border-2 border-red-600 p-6 sm:p-8">
                <h3 className="font-display text-2xl text-center uppercase tracking-wider mb-1 text-red-600">
                  Special Events
                </h3>
                <div className="w-12 h-1 bg-red-600 mx-auto mb-6" />

                <div className="space-y-6">
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
                </div>
              </div>
            </div>
          )}

          {activeTab === "sorry-charlies" && (
            <div>
              <h2 className="font-hellsrider text-3xl sm:text-4xl text-center uppercase tracking-wider mb-2">
                Sorry Charlie&apos;s Menu
              </h2>
              <div className="w-16 h-1 bg-red-600 mx-auto mb-8" />

              {/* Mains */}
              <h3 className="text-white/50 text-sm uppercase tracking-widest mb-4">Sandwiches</h3>
              <div className="space-y-6 mb-10">
                <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
                  <div>
                    <p className="text-xl font-bold uppercase tracking-wide">Brisket Sandwich</p>
                    <p className="text-white/50 text-sm mt-1">With choice of side</p>
                  </div>
                  <p className="text-red-600 font-extrabold text-2xl ml-4 shrink-0">$18</p>
                </div>

                <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
                  <div>
                    <p className="text-xl font-bold uppercase tracking-wide">Pulled Pork Sandwich</p>
                    <p className="text-white/50 text-sm mt-1">With choice of side</p>
                  </div>
                  <p className="text-red-600 font-extrabold text-2xl ml-4 shrink-0">$15</p>
                </div>
              </div>

              {/* Sides */}
              <h3 className="text-white/50 text-sm uppercase tracking-widest mb-4">Sides</h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
                  <p className="text-lg font-bold uppercase tracking-wide">Baked Beans</p>
                  <p className="text-white/40 text-sm">Included</p>
                </div>
                <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
                  <p className="text-lg font-bold uppercase tracking-wide">Coleslaw</p>
                  <p className="text-white/40 text-sm">Included</p>
                </div>
              </div>

              <div className="bg-white/5 p-4 text-center">
                <p className="text-white/60 text-sm uppercase tracking-wider">
                  Extra Side &mdash; <span className="text-red-600 font-bold">$3</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="text-center pb-12">
          <Link
            href="/"
            className="text-white/40 text-sm uppercase tracking-widest hover:text-red-600 transition-all"
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
