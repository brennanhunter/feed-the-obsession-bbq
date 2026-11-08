"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MENU_SECTIONS, PROTEINS, SIDES, type MenuItem, type MenuSection } from "@/lib/catalog";
import { isSpecialAvailable, specialLabel } from "@/lib/specials";
import { business } from "@/lib/business";
import { useCart } from "./cart/CartContext";
import CateringForm from "./CateringForm";

// Branded-menu section labels (mirrors the printed menu).
const SECTION_LABEL: Record<MenuSection, string> = {
  Plates: "Plates",
  Combos: "Combos & Racks",
  "Daily Specials": "The Smoke Schedule",
  "Whole Cuts": "Whole Cuts & Catering",
  Sides: "Sides",
  Extras: "Sauce & Extras",
};

const SECTION_NOTE: Partial<Record<MenuSection, string>> = {
  Plates: "Every plate comes with one side — pick it when you add the plate.",
  "Daily Specials":
    "One every weekday — $9.99, orderable on its day. Plus 50¢ wings the first Friday of the month and a full rack for $19.99 every other Thursday.",
  "Whole Cuts": "Order ahead — call 386-507-4309. Full rack needs 24 hours, whole brisket 3 days.",
};

function Chips({
  label, options, picked, onToggle,
}: { label: string; options: readonly string[]; picked: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="mt-2">
      <p className="text-xs text-white/60 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((p) => {
          const on = picked.includes(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => onToggle(p)}
              aria-pressed={on}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                on ? "bg-brand-primary border-brand-primary text-white" : "border-white/25 text-white/80 hover:border-brand-primary"
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ItemRow({ item }: { item: MenuItem }) {
  const { add } = useCart();
  // 2 Meat / 3 Meat plates: the customer picks their proteins before adding.
  const need = item.proteinPicks ?? 0;
  const [picks, setPicks] = useState<string[]>([]);
  // Plates with a side (and the Side item): pick which side.
  const needSide = (item.sidePicks ?? 0) > 0;
  const [side, setSide] = useState<string>("");
  // Smoke Schedule items are only orderable on their day (shop time). Computed on
  // the client so the page can stay cached and the day can roll over.
  const [available, setAvailable] = useState(true);
  useEffect(() => {
    if (!item.special) return;
    const tick = () => setAvailable(isSpecialAvailable(item.special!));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [item.special]);

  const ready = available && (need === 0 || picks.length === need) && (!needSide || side !== "");
  const toggle = (p: string) =>
    setPicks((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : prev.length < need ? [...prev, p] : prev
    );
  const onAdd = () => {
    add({
      id: item.id,
      title: item.title,
      price: item.price,
      proteins: need ? picks : undefined,
      side: needSide ? side : undefined,
    });
    if (need) setPicks([]);
    if (needSide) setSide("");
  };
  const missing: string[] = [];
  if (need && picks.length < need) missing.push(`${need - picks.length} meat${need - picks.length === 1 ? "" : "s"}`);
  if (needSide && !side) missing.push("a side");

  return (
    <div className={`py-3 border-b border-white/10 ${available ? "" : "opacity-60"}`}>
      {/* Title wraps on narrow screens; price + button never leave the viewport. */}
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-semibold text-lg text-white leading-snug">{item.title}</span>
          {item.bestSeller && (
            <span className="shrink-0 rounded-full bg-brand-primary/20 text-brand-primary text-[11px] font-bold uppercase tracking-wider px-2 py-0.5">
              Best Seller
            </span>
          )}
          <span className="hidden sm:block flex-1 border-b border-dotted border-white/25 translate-y-[-4px]" />
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <span className="font-bold text-lg text-brand-primary">${item.price.toFixed(2)}</span>
          {item.callToOrder ? (
            <a
              href={business.phoneHref}
              className="px-4 py-1.5 rounded-full border border-brand-primary text-brand-primary text-sm font-semibold hover:bg-brand-primary hover:text-white transition-all whitespace-nowrap"
              aria-label={`Call to order ${item.title}`}
            >
              Call to order
            </a>
          ) : (
            <button
              onClick={onAdd}
              disabled={!ready}
              className="px-4 py-1.5 rounded-full bg-brand-primary text-white text-sm font-semibold hover:opacity-80 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              aria-label={`Add ${item.title} to order`}
              title={!available && item.special ? specialLabel(item.special) : missing.length ? `Pick ${missing.join(" and ")}` : undefined}
            >
              Add +
            </button>
          )}
        </div>
      </div>
      {item.description && <p className="mt-1 text-sm text-white/50">{item.description}</p>}
      {item.notice && (
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand-primary/90">{item.notice}</p>
      )}
      {item.special && (
        <p className={`mt-1 text-xs font-semibold uppercase tracking-wider ${available ? "text-green-400" : "text-brand-primary/90"}`}>
          {available ? `On today — ${specialLabel(item.special)}` : `Not today — ${specialLabel(item.special)}`}
        </p>
      )}
      {available && need > 0 && (
        <Chips
          label={`Pick ${need} meats${picks.length < need ? ` — ${need - picks.length} to go` : ""}:`}
          options={PROTEINS}
          picked={picks}
          onToggle={toggle}
        />
      )}
      {available && needSide && (
        <Chips
          label={side ? `Side: ${side}` : "Pick your side:"}
          options={SIDES}
          picked={side ? [side] : []}
          onToggle={(v) => setSide((prev) => (prev === v ? "" : v))}
        />
      )}
    </div>
  );
}

export default function MenuWrapper({ items }: { items: MenuItem[] }) {
  const sections = MENU_SECTIONS.filter((s) => items.some((i) => i.section === s));

  return (
    <div id="menu" className="container mx-auto max-w-4xl px-4 mb-16 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center w-full text-center mb-12"
      >
        <h2 className="text-[40px] font-display tracking-wider">OUR MENU</h2>
        <p className="mt-4 text-white/60 max-w-xl">
          Our menu varies week to week based on what we&apos;re smoking. Follow us for weekly updates.
        </p>
      </motion.div>

      <div className="space-y-14">
        {sections.map((section) => (
          <section key={section}>
            <h3 className="font-display text-3xl tracking-wider text-white border-b-2 border-brand-primary pb-2 mb-1 uppercase">
              {SECTION_LABEL[section]}
            </h3>
            {SECTION_NOTE[section] && (
              <p className="text-sm italic text-white/40 mb-4">{SECTION_NOTE[section]}</p>
            )}
            <div className={SECTION_NOTE[section] ? "" : "mt-4"}>
              {items
                .filter((i) => i.section === section)
                .map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}
            </div>
          </section>
        ))}

        {/* Google review offer (owner's sheet, Oct 2026) */}
        <section
          id="review-offer"
          className="rounded-2xl border border-brand-primary/60 bg-brand-primary/10 p-6 md:p-8 text-center"
        >
          <h3 className="font-display text-3xl tracking-wider text-brand-primary uppercase">
            Love it? Tell Google.
          </h3>
          <p className="mt-3 text-white/80 max-w-xl mx-auto">
            Leave us a Google review and take <span className="font-bold text-white">10% off</span> your
            next visit — <span className="font-bold text-white">15%</span> with a photo,{" "}
            <span className="font-bold text-white">20%</span> with a video. Show it at the counter.
          </p>
          <a
            href={business.maps.review}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-5 px-7 py-3 rounded-full bg-brand-primary text-white font-bold hover:opacity-80 transition-all"
          >
            Leave a review →
          </a>
        </section>

        {/* Catering — call for pricing */}
        <section id="catering">
          <h3 className="font-display text-3xl tracking-wider text-white border-b-2 border-brand-primary pb-2 mb-4 uppercase">
            Catering
          </h3>
          <p className="text-white/60 mb-2">
            Parties, weddings, corporate events, and special occasions — full-service wood-smoked BBQ.
          </p>
          <p className="text-white/60 mb-6">
            Send us your details below, or call{" "}
            <a href="tel:386-507-4309" className="text-brand-primary font-semibold hover:opacity-80">
              386-507-4309
            </a>
            .
          </p>
          <CateringForm />
        </section>
      </div>
    </div>
  );
}
