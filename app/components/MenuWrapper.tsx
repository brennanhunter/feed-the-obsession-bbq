"use client";

import { motion } from "framer-motion";
import { MENU_SECTIONS, type MenuItem, type MenuSection } from "@/lib/catalog";
import { useCart } from "./cart/CartContext";

// Branded-menu section labels (mirrors the printed menu).
const SECTION_LABEL: Record<MenuSection, string> = {
  Plates: "Plates",
  Combos: "Combos & Racks",
  "Daily Specials": "The Smoke Schedule",
  "Whole Cuts": "Whole Cuts & Catering",
  Sides: "Sides",
};

const SECTION_NOTE: Partial<Record<MenuSection, string>> = {
  Plates: "Every plate comes with one side.",
  "Daily Specials": "One every weekday — $9.99. Follow us for what's on.",
  "Whole Cuts": "Order a day ahead — call 812-205-0559.",
};

function ItemRow({ item }: { item: MenuItem }) {
  const { add } = useCart();
  return (
    <div className="py-3 border-b border-white/10">
      <div className="flex items-baseline gap-3">
        <span className="font-semibold text-lg text-white shrink-0">{item.title}</span>
        <span className="flex-1 border-b border-dotted border-white/25 translate-y-[-4px]" />
        <span className="font-bold text-lg text-brand-primary shrink-0">
          ${item.price.toFixed(2)}
        </span>
        <button
          onClick={() => add({ id: item.id, title: item.title, price: item.price })}
          className="shrink-0 px-4 py-1.5 rounded-full bg-brand-primary text-white text-sm font-semibold hover:opacity-80 transition-all"
          aria-label={`Add ${item.title} to order`}
        >
          Add +
        </button>
      </div>
      {item.description && (
        <p className="mt-1 text-sm text-white/50 pr-24">{item.description}</p>
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
          <p className="text-white/60 mb-4">
            Parties, weddings, corporate events, and special occasions — full-service wood-smoked BBQ.
            Call for pricing &amp; availability.
          </p>
          <a
            href="tel:812-205-0559"
            className="inline-block font-display text-3xl md:text-4xl text-brand-primary tracking-wider hover:opacity-80 transition-all"
          >
            812-205-0559
          </a>
        </section>
      </div>
    </div>
  );
}
