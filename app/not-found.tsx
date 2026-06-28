import type { Metadata } from "next";
import Link from "next/link";
import Logo from "./components/Logo";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center text-center px-6">
      <Logo className="h-24 aspect-[2718/2896] text-brand-primary mb-8" />
      <p className="text-brand-primary font-display tracking-[0.3em] text-2xl mb-2">404</p>
      <h1 className="text-4xl md:text-5xl font-display tracking-wider mb-4">This Plate&apos;s Empty</h1>
      <p className="text-white/60 max-w-md mb-8">
        We couldn&apos;t find that page — but the smoker&apos;s still going. Let&apos;s get you back to the good stuff.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/"
          className="px-6 py-3 rounded-3xl bg-brand-primary text-white font-bold hover:opacity-80 transition-all"
        >
          Back Home
        </Link>
        <Link
          href="/menu"
          className="px-6 py-3 rounded-3xl border border-white/30 font-bold hover:border-brand-primary hover:text-brand-primary transition-all"
        >
          See the Menu
        </Link>
      </div>
    </div>
  );
}
