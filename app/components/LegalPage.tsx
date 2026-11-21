import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

// Shared shell for the plain-English policy pages (/privacy, /terms).
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="container mx-auto max-w-3xl px-5 pt-32 pb-20">
        <h1 className="font-display text-4xl md:text-5xl tracking-wider">{title}</h1>
        <p className="mt-2 text-sm text-white/50">Last updated {updated}</p>
        <div
          className="mt-8 space-y-4 leading-relaxed text-white/80
            [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:tracking-wider [&_h2]:text-white
            [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6
            [&_a]:text-brand-primary [&_a]:underline [&_strong]:text-white"
        >
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
