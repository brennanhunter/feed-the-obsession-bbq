import Link from "next/link";
import type { MenuItem } from "@/lib/catalog";
import Reveal from "./Reveal";

// The plates most people come for, in this order. Names match Square.
const PICKS = [
  "Brisket Plate With 1 Side",
  "Rib Plate With 1 Side",
  "Pulled Pork Plate With 1 Side",
  "2 Meat Plate",
  "3 Meat Plate",
  "Chicken Plate",
];
// Stand-ins when one of the picks is sold out, so the grid stays full.
const BACKUPS = ["Sampler", "Sliced Pork Plate", "Slider", "Chicken Salad Plate"];

export default function Favorites({ items }: { items: MenuItem[] }) {
  const cards = [...PICKS, ...BACKUPS]
    .map((name) => items.find((i) => i.title === name && !i.soldOut))
    .filter((i): i is MenuItem => Boolean(i))
    .slice(0, PICKS.length);
  return (
    <section id="menu" className="bg-black py-20 md:py-24">
      <div className="container mx-auto px-6 max-w-6xl">
        <Reveal className="text-center">
          <p className="text-brand-primary font-bold uppercase tracking-[0.28em] text-xs sm:text-sm">
            Off the pit
          </p>
          <h2 className="mt-3 text-[clamp(2.1rem,7vw,3rem)] font-display tracking-wider">FAN FAVORITES</h2>
          <p className="mt-3 text-white/60 max-w-xl mx-auto">
            Order online for pickup, or pull up and dine in.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((item, i) => (
            <Reveal key={item.id} delay={i * 0.06}>
              <Link
                href="/menu"
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 transition-all hover:-translate-y-1 hover:border-brand-primary/60"
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-6 bottom-6 w-1 rounded-r bg-brand-primary/70 group-hover:bg-brand-primary transition-colors"
                />
                {item.bestSeller && (
                  <span className="mb-2 self-start rounded-full bg-brand-primary/20 text-brand-primary text-[11px] font-bold uppercase tracking-wider px-2 py-0.5">
                    Best seller
                  </span>
                )}
                <h3 className="font-sans font-bold uppercase text-2xl leading-tight tracking-wide">{item.title}</h3>
                {item.description && <p className="mt-2 text-white/55">{item.description}</p>}
                <div className="mt-auto pt-6 flex items-center justify-between">
                  <span className="text-2xl font-bold text-brand-primary">${item.price.toFixed(2)}</span>
                  <span className="font-bold uppercase tracking-wide text-sm text-white/70 group-hover:text-white transition-colors">
                    Order →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/menu"
            className="inline-flex items-center px-8 py-3 rounded-full bg-brand-primary text-white font-bold uppercase tracking-wide hover:opacity-85 transition-all"
          >
            See the full menu
          </Link>
        </div>
      </div>
    </section>
  );
}
