"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MENU_SECTIONS, PROTEINS, type MenuItem, type MenuSection } from "@/lib/catalog";
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
  Plates: "Every plate comes with one side.",
  "Daily Specials":
    "One every weekday — $9.99. Plus 50¢ wings the first Friday of the month and a full rack for $19.99 every other Thursday.",
  "Whole Cuts": "Order ahead — call 812-205-0559. Full rack needs 24 hours, whole brisket 3 days.",
};

function ItemRow({ item }: { item: MenuItem }) {
  const { add } = useCart();
  // 2 Meat / 3 Meat plates: the customer picks their proteins before adding.
  const need = item.proteinPicks ?? 0;
  const [picks, setPicks] = useState<string[]>([]);
  const ready = need === 0 || picks.length === need;
  const toggle = (p: string) =>
    setPicks((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : prev.length < need ? [...prev, p] : prev
    );
  const onAdd = () => {
    add({ id: item.id, title: item.title, price: item.price, proteins: need ? picks : undefined });
    if (need) setPicks([]);
  };
  return (
    <div className="py-3 border-b border-white/10">
      <div className="flex items-baseline gap-3">
        <span className="font-semibold text-lg text-white shrink-0">{item.title}</span>
        {item.bestSeller && (
          <span className="shrink-0 rounded-full bg-brand-primary/20 text-brand-primary text-[11px] font-bold uppercase tracking-wider px-2 py-0.5">
            Best Seller
          </span>
        )}
        <span className="flex-1 border-b border-dotted border-white/25 translate-y-[-4px]" />
        <span className="font-bold text-lg text-brand-primary shrink-0">
          ${item.price.toFixed(2)}
        </span>
        <button
          onClick={onAdd}
          disabled={!ready}
          className="shrink-0 px-4 py-1.5 rounded-full bg-brand-primary text-white text-sm font-semibold hover:opacity-80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={`Add ${item.title} to order`}
        >
          Add +
        </button>
      </div>
      {item.description && (
        <p className="mt-1 text-sm text-white/50 pr-24">{item.description}</p>
      )}
      {item.notice && (
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand-primary/90">
          {item.notice}
        </p>
      )}
      {need > 0 && (
        <div className="mt-2">
          <p className="text-xs text-white/60 mb-1.5">
            Pick {need} meats{picks.length < need ? ` — ${need - picks.length} to go` : ""}:
          </p>
          <div className="flex flex-wrap gap-2">
            {PROTEINS.map((p) => {
              const on = picks.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggle(p)}
                  aria-pressed={on}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    on
                      ? "bg-brand-primary border-brand-primary text-white"
                      : "border-white/25 text-white/80 hover:border-brand-primary"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
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
            <a href="tel:812-205-0559" className="text-brand-primary font-semibold hover:opacity-80">
              812-205-0559
            </a>
            .
          </p>
          <CateringForm />
        </section>
      </div>
    </div>
  );
}
