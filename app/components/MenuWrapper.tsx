"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  MENU_SECTIONS,
  checkPicks,
  describePicks,
  picksPrice,
  type Choice,
  type ChoicePick,
  type MenuItem,
  type MenuSection,
} from "@/lib/catalog";
import { isSpecialAvailable, specialLabel } from "@/lib/specials";
import { business } from "@/lib/business";
import { useCart, type CartInput } from "./cart/CartContext";
import { announceAdded } from "./cart/AddedToast";
import CateringForm from "./CateringForm";

// Branded-menu section labels (mirrors the printed menu).
const SECTION_LABEL: Record<MenuSection, string> = {
  Plates: "Plates",
  Combos: "Combos & Racks",
  "Daily Specials": "The Smoke Schedule",
  "By the Pound": "By the Pound",
  "Whole Cuts": "Whole Cuts & Catering",
  Sides: "Sides",
  Extras: "Sauce & Extras",
};

const SECTION_NOTE: Partial<Record<MenuSection, string>> = {
  Plates: "Every plate comes with one side — pick it when you add the plate.",
  Combos: "Bring an appetite or bring a friend.",
  "Daily Specials":
    "One every weekday — $9.99, orderable on its day. Plus 50¢ wings the first Friday of the month and a full rack for $19.99 every other Thursday.",
  "By the Pound": "Smoked meat by the weight, sliced to order while it lasts. Plan on about ⅓–½ lb per person.",
  "Whole Cuts": `Smoked to order — order online at least 2 days ahead. Big order or need it sooner? Call ${business.phone}.`,
};

// One Square modifier list as a numbered step ("Pick your meats", "Pick your
// side", "Extra sauce"). Rules come from Square: a single pick swaps on tap;
// when doubles are allowed, tapping adds another and "−" takes one away.
function ChoiceStep({
  step, choice, counts, onAdd, onRemove,
}: {
  step: number;
  choice: Choice;
  counts: Record<string, number>;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const total = choice.options.reduce((s, o) => s + (counts[o.id] ?? 0), 0);
  const left = Math.max(choice.min - total, 0);
  const full = choice.max > 0 && total >= choice.max;
  const single = choice.max === 1;
  const done = choice.min > 0 && left === 0;
  const rule =
    choice.min > 0 && choice.min === choice.max
      ? `Pick ${choice.min}`
      : choice.min > 0
        ? `Pick at least ${choice.min}`
        : choice.max > 0
          ? `Optional · up to ${choice.max}`
          : "Optional";
  return (
    <section className="py-4 border-b border-white/10">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h4 className="font-semibold text-white">
          <span className="text-brand-primary mr-1.5">{step}.</span>
          {choice.name}
        </h4>
        <span className={`text-xs whitespace-nowrap ${done ? "text-green-400" : left > 0 ? "text-brand-primary" : "text-white/50"}`}>
          {done ? "✓ Done" : left > 0 ? `${rule} · ${left} to go` : rule}
          {choice.repeats && !single && !done ? " · doubles OK" : ""}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {choice.options.map((o) => {
          const n = counts[o.id] ?? 0;
          const on = n > 0;
          const tap = () => (single || !choice.repeats ? (on ? onRemove(o.id) : onAdd(o.id)) : onAdd(o.id));
          const disabled = !single && (choice.repeats ? full : !on && full);
          return (
            <span
              key={o.id}
              className={`inline-flex items-stretch rounded-full border text-sm transition-colors ${
                on ? "bg-brand-primary border-brand-primary text-white" : "border-white/25 text-white/85 hover:border-brand-primary"
              }`}
            >
              <button
                type="button"
                onClick={tap}
                disabled={disabled}
                aria-pressed={on}
                className={`px-4 py-2 disabled:cursor-not-allowed ${on ? "" : "disabled:opacity-40"}`}
              >
                {o.name}
                {n > 1 ? ` ×${n}` : ""}
                {o.price > 0 ? <span className="opacity-80"> +${o.price.toFixed(2)}</span> : null}
              </button>
              {on && choice.repeats && !single && (
                <button
                  type="button"
                  onClick={() => onRemove(o.id)}
                  aria-label={`Remove one ${o.name}`}
                  className="pl-2 pr-4 py-2 border-l border-white/30"
                >
                  −
                </button>
              )}
            </span>
          );
        })}
      </div>
      {/* Square options can't carry a description, so explain the one that needs it. */}
      {choice.options.some((o) => (counts[o.id] ?? 0) > 0 && /pitmaster/i.test(o.name)) && (
        <p className="mt-2 text-xs text-white/60">
          Pitmaster&apos;s Choice is our rotating side, picked by the pitmaster. It changes every week.
        </p>
      )}
    </section>
  );
}

// The "build your plate" panel: a bottom sheet on phones, a dialog on desktop.
// Steps follow Square's order (meats, then side, then sauce), then a special
// request, quantity, and one Add button with the running total.
// Also used by the cart's "Edit" (initial = the line's picks/request/qty, and
// onSave replaces that line instead of adding a new one).
export function ItemSheet({
  item,
  onClose,
  onAdded,
  initial,
  onSave,
}: {
  item: MenuItem;
  onClose: () => void;
  onAdded?: (msg: string) => void;
  initial?: { picks?: ChoicePick[]; note?: string; qty?: number };
  onSave?: (input: CartInput) => void;
}) {
  const { add } = useCart();
  const choices = item.choices ?? [];
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries((initial?.picks ?? []).map((p) => [p.id, p.qty]))
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [qty, setQty] = useState(initial?.qty ?? 1);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const extrasRef = useRef<HTMLDivElement | null>(null);

  // Lock the page behind the sheet; Escape closes it.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const totalIn = (c: Choice, cs: Record<string, number>) => c.options.reduce((s, o) => s + (cs[o.id] ?? 0), 0);
  const firstOpen = (cs: Record<string, number>) => {
    const i = choices.findIndex((c) => totalIn(c, cs) < c.min);
    return i < 0 ? choices.length : i;
  };

  // When a required step is finished, bring the next one into view.
  const advance = (before: Record<string, number>, after: Record<string, number>) => {
    const a = firstOpen(before);
    const b = firstOpen(after);
    if (b > a) {
      const el = b < choices.length ? stepRefs.current[b] : extrasRef.current;
      setTimeout(() => el?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 120);
    }
  };
  const addOption = (choice: Choice, id: string) =>
    setCounts((prev) => {
      let next = prev;
      const total = totalIn(choice, prev);
      if (choice.max === 1) {
        next = { ...prev };
        for (const o of choice.options) delete next[o.id];
        next[id] = 1;
      } else if (!(choice.max > 0 && total >= choice.max) && !(!choice.repeats && prev[id])) {
        next = { ...prev, [id]: (prev[id] ?? 0) + 1 };
      }
      advance(prev, next);
      return next;
    });
  const removeOption = (id: string) =>
    setCounts((prev) => {
      const next = { ...prev };
      if ((next[id] ?? 0) > 1) next[id] -= 1;
      else delete next[id];
      return next;
    });

  const picks: ChoicePick[] = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => ({ id, qty: n }));
  const checked = checkPicks(item, picks);
  const unitPrice = item.price + picksPrice(choices, checked.ok ? checked.picks : picks);
  const missing = choices
    .map((c) => {
      const left = c.min - totalIn(c, counts);
      return left > 0 ? `${left} more ${c.label.toLowerCase()}` : "";
    })
    .filter(Boolean);
  const lb = item.unit === "lb";

  const onAdd = () => {
    if (!checked.ok) return;
    const cleanNote = note.replace(/\s+/g, " ").trim().slice(0, 140);
    const input: CartInput = {
      id: item.id,
      title: item.title,
      price: unitPrice,
      qty,
      ...(checked.picks.length ? { picks: checked.picks, detail: describePicks(choices, checked.picks) } : {}),
      ...(cleanNote ? { note: cleanNote } : {}),
      ...(item.leadDays ? { leadDays: item.leadDays } : {}),
      ...(item.unit ? { unit: item.unit } : {}),
    };
    if (onSave) onSave(input);
    else {
      add(input);
      onAdded?.(`Added ${qty > 1 ? `${qty}${lb ? " lb" : "×"} ` : ""}${item.title}`);
    }
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby={`sheet-${item.id}`}>
      <button type="button" aria-hidden="true" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/75 cursor-default" />
      <div className="relative w-full sm:max-w-lg max-h-[92vh] flex flex-col bg-[#141414] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl">
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3 border-b border-white/10">
          <div className="min-w-0">
            <h3 id={`sheet-${item.id}`} className="font-display text-2xl tracking-wide text-white uppercase leading-tight">
              {item.title}
            </h3>
            <p className="text-brand-primary font-bold mt-1">
              ${item.price.toFixed(2)}
              {lb ? " / lb" : ""}
            </p>
            {item.description && <p className="text-sm text-white/55 mt-1">{item.description}</p>}
            {item.notice && (
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand-primary/90">{item.notice}</p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-white/60 hover:text-white text-2xl leading-none px-1">
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-5">
          {choices.map((c, i) => (
            <div key={c.id} ref={(el) => { stepRefs.current[i] = el; }}>
              <ChoiceStep
                step={i + 1}
                choice={c}
                counts={counts}
                onAdd={(id) => addOption(c, id)}
                onRemove={removeOption}
              />
            </div>
          ))}
          <div ref={extrasRef} className="py-4">
            <label htmlFor={`note-${item.id}`} className="block font-semibold text-white mb-2">
              {choices.length ? <span className="text-brand-primary mr-1.5">{choices.length + 1}.</span> : null}
              Special request <span className="text-white/45 font-normal text-sm">(optional)</span>
            </label>
            <textarea
              id={`note-${item.id}`}
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 140))}
              rows={2}
              placeholder="Anything for this item? e.g. extra crispy, cut in half"
              className="w-full p-3 rounded bg-black/40 border border-white/20 text-white text-sm focus:outline-none focus:border-brand-primary"
            />
            <div className="flex items-center justify-between mt-4">
              <span className="font-semibold text-white">{lb ? "Pounds" : "Quantity"}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Fewer" className="w-10 h-10 rounded-full border border-white/25 hover:border-brand-primary text-lg">
                  −
                </button>
                <span className="w-12 text-center font-semibold">
                  {qty}
                  {lb ? " lb" : ""}
                </span>
                <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="More" className="w-10 h-10 rounded-full border border-white/25 hover:border-brand-primary text-lg">
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-white/10">
          {missing.length > 0 && <p className="text-center text-sm text-white/60 mb-2">Pick {missing.join(" and ")}</p>}
          <button
            type="button"
            onClick={onAdd}
            disabled={!checked.ok}
            className="w-full py-3.5 rounded-full bg-brand-primary text-white font-bold text-lg hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {onSave ? "Save changes" : "Add to order"} · ${(unitPrice * qty).toFixed(2)}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ItemRow({ item }: { item: MenuItem }) {
  const [open, setOpen] = useState(false);
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

  const orderable = available && !item.soldOut;
  // "Pick 2 meats · 1 side" — what the panel will ask for, at a glance.
  const asks = (item.choices ?? [])
    .filter((c) => c.min > 0)
    .map((c) => `${c.min} ${c.label.toLowerCase()}`)
    .join(" · ");

  return (
    <div className={`py-3 border-b border-white/10 ${orderable ? "" : "opacity-60"}`}>
      {/* Title wraps on narrow screens; price + button never leave the viewport. */}
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-semibold text-lg text-white leading-snug">{item.title}</span>
          {item.bestSeller && (
            <span className="shrink-0 rounded-full bg-brand-primary/20 text-brand-primary text-[11px] font-bold uppercase tracking-wider px-2 py-0.5">
              Best Seller
            </span>
          )}
          {item.soldOut && (
            <span className="shrink-0 rounded-full bg-white/10 text-white/70 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5">
              Sold out
            </span>
          )}
          <span className="hidden sm:block flex-1 border-b border-dotted border-white/25 translate-y-[-4px]" />
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <span className="font-bold text-lg text-brand-primary">
            ${item.price.toFixed(2)}
            {item.unit === "lb" ? <span className="text-sm font-semibold"> /lb</span> : null}
          </span>
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
              onClick={() => setOpen(true)}
              disabled={!orderable}
              className="px-4 py-1.5 rounded-full bg-brand-primary text-white text-sm font-semibold hover:opacity-80 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              aria-label={`Add ${item.title} to order`}
            >
              Add +
            </button>
          )}
        </div>
      </div>
      {item.description && <p className="mt-1 text-sm text-white/50">{item.description}</p>}
      {orderable && asks && <p className="mt-1 text-xs text-white/40">Pick {asks}</p>}
      {item.notice && (
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand-primary/90">{item.notice}</p>
      )}
      {item.special && (
        <p className={`mt-1 text-xs font-semibold uppercase tracking-wider ${available ? "text-green-400" : "text-brand-primary/90"}`}>
          {available ? `On today — ${specialLabel(item.special)}` : `Not today — ${specialLabel(item.special)}`}
        </p>
      )}
      {open && <ItemSheet item={item} onClose={() => setOpen(false)} onAdded={announceAdded} />}
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
          <section
            key={section}
            id={section === "Daily Specials" ? "specials" : undefined}
            className="scroll-mt-28"
          >
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

        {/* Google review ask. No discount or incentive: Google's review policy
            forbids offering anything for reviews (flagged Nov 2026). */}
        <section
          id="review-offer"
          className="rounded-2xl border border-brand-primary/60 bg-brand-primary/10 p-6 md:p-8 text-center"
        >
          <h3 className="font-display text-3xl tracking-wider text-brand-primary uppercase">
            Love it? Tell Google.
          </h3>
          <p className="mt-3 text-white/80 max-w-xl mx-auto">
            A quick Google review helps more folks find the smoke. Photos welcome. Thanks for
            spreading the word.
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
