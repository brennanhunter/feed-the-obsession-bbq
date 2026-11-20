import Link from "next/link";
import { business } from "@/lib/business";
import HeroVideo from "./HeroVideo";

// Home hero, Jersey Mike's style: the food on video behind a big headline and
// one obvious button. The clip is vertical, so it's framed low to show the bark.
export default function Hero({ status }: { status: { open: boolean; label: string } }) {
  return (
    <section className="relative isolate overflow-hidden bg-black">
      <HeroVideo src="/pictures/hero/pulling-pork.mp4" poster="/pictures/hero/pulling-pork-poster.jpg" />
      {/* Darken for legible text: from the bottom on phones, from the left on desktop */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/35 md:bg-gradient-to-r md:from-black/90 md:via-black/60 md:to-black/20"
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />

      <div className="relative container mx-auto px-6 flex items-end md:items-center min-h-[620px] h-[calc(100svh-5.5rem)] max-h-[860px] md:h-[78svh] md:min-h-[560px] pb-14 md:pb-0">
        <div className="max-w-2xl">
          <p className="text-brand-primary font-bold uppercase tracking-[0.22em] sm:tracking-[0.28em] text-xs sm:text-sm drop-shadow">
            Veteran-owned · <span className="hidden sm:inline">Wood-smoked · </span>DeLand, FL
          </p>
          <h2 className="mt-4 font-display leading-[0.95] tracking-wide text-[clamp(2.5rem,10.5vw,4.25rem)] md:text-[clamp(3.5rem,6.6vw,6rem)] drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)]">
            FEED THE
            <br />
            <span className="text-brand-primary">OBSESSION</span>
          </h2>
          <p className="mt-5 max-w-md text-lg sm:text-xl text-white/85 leading-snug drop-shadow">
            Brisket, ribs, pulled pork and chicken, smoked low and slow over real wood and sliced to order.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/menu"
              className="inline-flex items-center px-8 py-3.5 rounded-full bg-brand-primary text-white font-bold uppercase tracking-wide shadow-lg shadow-black/40 hover:opacity-85 transition-all"
            >
              Order Online
            </Link>
            <a
              href={business.maps.directions}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-3.5 rounded-full border border-white/40 bg-black/20 backdrop-blur-sm text-white font-bold uppercase tracking-wide hover:border-brand-primary hover:text-brand-primary transition-all"
            >
              Get Directions
            </a>
          </div>
          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/75">
            <span>
              <span className="text-brand-primary tracking-widest">★★★★★</span>{" "}
              <span className="font-bold text-white">4.8</span> on Google
            </span>
            <span aria-hidden className="text-white/30">|</span>
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden
                className={`h-2 w-2 rounded-full ${status.open ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-white/40"}`}
              />
              {status.label}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
