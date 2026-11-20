import Image from "next/image";
import { business } from "@/lib/business";
import Reveal from "./Reveal";

const INQUIRY = `${business.emailHref}?subject=${encodeURIComponent("Custom smoker inquiry")}`;

// Custom smoker builds: a side business, so a compact band instead of a full section.
export default function SmokerStrip() {
  return (
    <section className="relative overflow-hidden bg-black py-16 md:py-20 border-t border-white/5">
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-10%] top-1/2 -translate-y-1/2 h-[80vw] w-[80vw] max-h-[700px] max-w-[700px] rounded-full bg-[radial-gradient(circle,rgba(193,40,45,0.28)_0%,transparent_65%)]"
      />
      <div className="relative container mx-auto px-6 max-w-6xl grid md:grid-cols-[1.2fr_1fr] gap-8 md:gap-12 items-center">
        <Reveal>
          <Image
            src="/pictures/cutouts/smoker-trailer.png"
            alt="FTO's red trailer smoker"
            width={1400}
            height={630}
            sizes="(min-width: 768px) 640px, 100vw"
            className="w-full h-auto drop-shadow-[0_25px_30px_rgba(0,0,0,0.75)]"
          />
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-brand-primary font-bold uppercase tracking-[0.28em] text-xs sm:text-sm">
            Custom builds
          </p>
          <h2 className="mt-3 text-[clamp(1.9rem,6vw,2.6rem)] leading-[1.05] font-display tracking-wider">
            WE BUILD SMOKERS TOO
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Want your own pit? We design and build custom smokers for backyards and businesses.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              href={INQUIRY}
              className="inline-flex items-center px-7 py-3 rounded-full border border-white/30 text-white font-bold uppercase tracking-wide hover:border-brand-primary hover:text-brand-primary transition-all"
            >
              Ask about a build
            </a>
            <a href={business.phoneHref} className="text-white/60 hover:text-white transition-colors">
              or call {business.phone}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
