import Image from "next/image";
import { business } from "@/lib/business";
import Reveal from "./Reveal";

export default function Story() {
  return (
    <section id="about" className="relative overflow-hidden bg-brand-secondary py-20 md:py-28 border-t border-white/5">
      <div className="container mx-auto px-6 max-w-6xl grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        <Reveal>
          <p className="text-brand-primary font-bold uppercase tracking-[0.28em] text-xs sm:text-sm">Our story</p>
          <h2 className="mt-3 text-[clamp(1.6rem,7.5vw,2.6rem)] md:text-[min(3.7vw,2.6rem)] leading-[1.05] font-display tracking-wider">
            VETERAN‑OWNED.
            <br />
            FAMILY‑BUILT.
          </h2>
          <p className="mt-6 text-lg text-white/75 leading-relaxed">
            FTO started under a tent with a smoker we built ourselves. Now the pit is planted on New York Ave
            in DeLand: same wood smoke, same low and slow, and a dining room the family renovated by hand.
          </p>
          <p className="mt-4 text-lg text-white/75">Pull up, come hungry.</p>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-white/70">
            <a href={business.phoneHref} className="hover:text-brand-primary transition-colors">
              <span className="block text-xs uppercase tracking-[0.2em] text-white/40">Call</span>
              <span className="text-xl font-bold text-white">{business.phone}</span>
            </a>
            <a
              href={business.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-primary transition-colors"
            >
              <span className="block text-xs uppercase tracking-[0.2em] text-white/40">Daily specials</span>
              <span className="text-xl font-bold text-white">Facebook →</span>
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="relative pb-16 sm:pb-20">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <Image
              src="/pictures/business/ScooterCookingInGrass.jpg"
              alt="Cooking under the FTO tent beside the smoker"
              width={2048}
              height={1536}
              sizes="(min-width: 768px) 560px, 100vw"
              className="w-full h-auto"
            />
          </div>
          <div className="absolute -bottom-2 right-[-4px] sm:right-[-16px] w-[52%] rotate-[3deg] overflow-hidden rounded-xl border-4 border-black shadow-2xl">
            <Image
              src="/gallery/painting-open1.jpg"
              alt="The family painting the DeLand dining room before opening"
              width={600}
              height={450}
              sizes="(min-width: 768px) 290px, 52vw"
              className="w-full h-auto"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
