"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "./CartContext";
import Checkout, { type DeliveryQuote, type PlacedOrder } from "./Checkout";
import TipPicker from "./TipPicker";
import { NO_TIP, tipCentsFor, type TipChoice } from "@/lib/tips";
import { ItemRow, ItemSheet } from "../MenuWrapper";
import { useQuote } from "./useQuote";
import { business } from "@/lib/business";
import { getOpenStatus } from "@/lib/hours";
import type { MenuItem } from "@/lib/catalog";
import { DELIVERY_AREA_LABEL, DELIVERY_MIN_CENTS, DRIVER_TIP_FLATS_CENTS, serviceFeeCents } from "@/lib/delivery";
import { deliveryVisible, readOrderMode, saveOrderMode, type OrderMode } from "./orderMode";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function PickupCard() {
  const [status, setStatus] = useState<{ open: boolean; label: string } | null>(null);
  useEffect(() => setStatus(getOpenStatus()), []);
  return (
    <section aria-labelledby="pickup-h" className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h2 id="pickup-h" className="font-display text-xl tracking-wider uppercase">Pickup location</h2>
      <p className="mt-3 font-semibold text-white">{business.name}</p>
      <p className="text-white/70">{business.address.full}</p>
      <p className="mt-2 text-white/70">{business.hoursDisplay}</p>
      {status && (
        <p className="mt-1 flex items-center gap-2 text-sm">
          <span className={status.open ? "text-green-400" : "text-white/40"}>●</span>
          <span className={status.open ? "text-green-400 font-semibold" : "text-white/70"}>{status.label}</span>
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <a href={business.maps.directions} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full border border-white/20 hover:border-brand-primary transition-colors">
          Get directions
        </a>
        <a href={business.phoneHref} className="px-4 py-2 rounded-full border border-white/20 hover:border-brand-primary transition-colors">
          Call {business.phone}
        </a>
      </div>
    </section>
  );
}

// Shown in place of the cart once the card goes through.
function OrderPlaced({ order }: { order: PlacedOrder }) {
  const first = order.name.split(/\s+/)[0] || order.name;
  const delivery = order.mode === "DELIVERY";
  const row = (label: string, value: string) => (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-3 border-b border-white/10 last:border-0">
      <dt className="sm:w-32 shrink-0 text-xs uppercase tracking-[0.2em] text-white/40 pt-0.5">{label}</dt>
      <dd className="text-white">{value}</dd>
    </div>
  );
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16 md:py-24 text-center">
      <p className="text-5xl" aria-hidden>
        🍖
      </p>
      <h1 className="mt-4 font-display text-4xl md:text-5xl tracking-wider uppercase">Order placed!</h1>
      <p className="mt-4 text-lg text-white/75">
        Thanks, {first}!{" "}
        {delivery
          ? "Your order is in, and an Uber driver is booked to bring it to you. You'll get texts with live tracking."
          : order.channel === "DINE_IN"
            ? "Your order is in. Grab a seat and we'll bring it out."
            : "Your order is in and headed for the smoker."}
        {order.tipped && !delivery ? " And thanks for the tip, the crew appreciates it." : ""}
      </p>

      <dl className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-2 text-left">
        {row(
          "When",
          delivery
            ? order.when
              ? `Leaves our smoker ${order.when}, and reaches you about 15–30 minutes later`
              : "About 45–60 minutes"
            : order.when
              ? `Ready ${order.when}`
              : "Ready in about 15–20 minutes"
        )}
        {row(
          delivery ? "Delivering to" : order.channel === "DINE_IN" ? "Table" : "Pick up at",
          delivery ? order.address ?? "" : order.channel === "DINE_IN" ? order.table || "—" : `${business.name}, ${business.address.full}`
        )}
        {row("Confirmation", `Sent to ${order.email}`)}
      </dl>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {delivery && order.trackingUrl ? (
          <a
            href={order.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-7 py-3 rounded-full bg-brand-primary font-bold uppercase tracking-wide hover:opacity-85 transition-all"
          >
            Track your delivery
          </a>
        ) : order.channel !== "DINE_IN" ? (
          <a
            href={business.maps.directions}
            target="_blank"
            rel="noopener noreferrer"
            className="px-7 py-3 rounded-full bg-brand-primary font-bold uppercase tracking-wide hover:opacity-85 transition-all"
          >
            Get directions
          </a>
        ) : null}
        <Link
          href="/menu"
          className="px-7 py-3 rounded-full border border-white/30 font-bold uppercase tracking-wide hover:border-brand-primary hover:text-brand-primary transition-all"
        >
          Back to the menu
        </Link>
      </div>
      <p className="mt-6 text-sm text-white/50">
        Questions? Call{" "}
        <a href={business.phoneHref} className="text-brand-primary font-semibold">
          {business.phone}
        </a>
      </p>
    </div>
  );
}

export default function OrderPage({ extras, menu }: { extras: MenuItem[]; menu: MenuItem[] }) {
  const { items, totalCents, setQty, remove, replace } = useCart();
  // Square's exact Florida sales tax for this cart (estimated until it answers).
  const quote = useQuote(items, totalCents);
  const taxCents = quote.taxCents;
  // "Edit" on a cart line reopens the item panel with that line's choices.
  const byId = new Map(menu.map((m) => [m.id, m]));
  const [editing, setEditing] = useState<string | null>(null); // cart line key
  const editLine = editing ? items.find((i) => i.key === editing) : undefined;
  const editItem = editLine ? byId.get(editLine.id) : undefined;
  const [instructions, setInstructions] = useState("");
  // Optional tip, charged on top of the food: the crew's on pickup, the driver's on delivery.
  const [tip, setTip] = useState<TipChoice>(NO_TIP);
  const tipCents = tipCentsFor(tip, totalCents); // tip on the food, before tax
  // Paid: swap the cart for the confirmation (the cart itself is cleared).
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const done = placed !== null;
  useEffect(() => {
    if (placed) window.scrollTo({ top: 0 });
  }, [placed]);
  // Avoid a flash of "empty" before the saved cart loads from localStorage.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  // Pickup or delivery (Uber). Delivery adds Uber's fee + the 10% service fee.
  // Starts on whatever the customer picked on the menu. (Read lazily: the page
  // renders a blank shell until hydrated, so the server's "PICKUP" never shows.)
  const [mode, setMode] = useState<OrderMode>(readOrderMode);
  const canDeliver = hydrated && deliveryVisible();
  const isDelivery = canDeliver && mode === "DELIVERY";
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const deliveryFee = isDelivery ? deliveryQuote?.feeCents ?? 0 : 0;
  const serviceFee = isDelivery ? serviceFeeCents(totalCents) : 0;
  const chargeCents = totalCents + taxCents + tipCents + deliveryFee + serviceFee;
  const pickMode = (m: OrderMode) => {
    if (m === mode) return;
    setMode(m);
    saveOrderMode(m);
    setTip(NO_TIP); // a crew tip and a driver tip aren't the same thing
  };
  // Hide the phone summary bar once the payment section is on screen.
  const [payVisible, setPayVisible] = useState(false);
  useEffect(() => {
    const el = document.getElementById("payment");
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setPayVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [hydrated, items.length, done]);

  if (!hydrated) return <div className="container mx-auto max-w-5xl px-4 py-24" />;

  if (placed) return <OrderPlaced order={placed} />;

  if (items.length === 0 && !done) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl tracking-wider uppercase">Your order</h1>
        <p className="mt-4 text-white/60">Nothing in your order yet.</p>
        <Link href="/menu" className="inline-block mt-8 px-8 py-3 rounded-full bg-brand-primary font-bold hover:opacity-80 transition-all">
          Browse the menu
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-10 pb-32 lg:pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <h1 className="font-display text-4xl md:text-5xl tracking-wider uppercase">Your order</h1>
        {!done && (
          <Link href="/menu" className="text-brand-primary font-semibold hover:opacity-80">
            ← Add more from the menu
          </Link>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:items-start">
        {/* Left: review */}
        <div className="space-y-10">
          {!done && (
            <section aria-labelledby="review-h">
              <h2 id="review-h" className="font-display text-2xl tracking-wider uppercase border-b-2 border-brand-primary pb-2 mb-2">
                1. Review your order
              </h2>
              <ul className="divide-y divide-white/10">
                {items.map((i) => (
                  <li key={i.key} className="py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-lg leading-snug">{i.title}</p>
                      {i.detail && <p className="text-brand-primary text-sm">{i.detail}</p>}
                      {i.note && <p className="text-white/70 text-sm italic">Request: {i.note}</p>}
                      {i.leadDays && (
                        <p className="text-white/50 text-xs uppercase tracking-wider">Order {i.leadDays} days ahead</p>
                      )}
                      <p className="text-white/50 text-sm">
                        {money(Math.round(i.price * 100))} {i.unit === "lb" ? "per lb" : "each"}
                      </p>
                      <div className="mt-2 flex gap-4">
                        {byId.has(i.id) && (
                          <button type="button" onClick={() => setEditing(i.key)} className="text-sm text-white/60 hover:text-brand-primary">
                            Edit
                          </button>
                        )}
                        <button type="button" onClick={() => remove(i.key)} className="text-sm text-white/40 hover:text-brand-primary">
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="font-bold text-brand-primary">{money(Math.round(i.price * 100) * i.qty)}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setQty(i.key, i.qty - 1)} aria-label={`Decrease ${i.title}`} className="w-9 h-9 rounded-full border border-white/20 hover:border-brand-primary text-lg">
                          −
                        </button>
                        <span className="w-10 text-center font-semibold">
                          {i.qty}
                          {i.unit === "lb" ? " lb" : ""}
                        </span>
                        <button type="button" onClick={() => setQty(i.key, i.qty + 1)} aria-label={`Increase ${i.title}`} className="w-9 h-9 rounded-full border border-white/20 hover:border-brand-primary text-lg">
                          +
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!done && extras.length > 0 && (
            <section aria-labelledby="extras-h">
              <h2 id="extras-h" className="font-display text-2xl tracking-wider uppercase border-b-2 border-brand-primary pb-2 mb-1">
                Don&apos;t forget
              </h2>
              <p className="text-sm italic text-white/40 mb-2">Round it out with a side or extra sauce.</p>
              <div>
                {extras.map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {!done && (
            <section aria-labelledby="notes-h">
              <h2 id="notes-h" className="font-display text-2xl tracking-wider uppercase border-b-2 border-brand-primary pb-2 mb-3">
                Order instructions
              </h2>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value.slice(0, 300))}
                rows={3}
                placeholder="Anything the kitchen should know? Allergies, extra sauce on the side, etc."
                className="w-full p-3 text-base rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-brand-primary"
              />
              <p className="mt-1 text-xs text-white/40 text-right">{instructions.length}/300</p>
            </section>
          )}

          {!isDelivery && (
            <div className="lg:hidden">
              <PickupCard />
            </div>
          )}
        </div>

        {/* Right: pickup + pay (sticky on desktop) */}
        <aside className="space-y-6 lg:sticky lg:top-28">
          {!isDelivery && (
            <div className="hidden lg:block">
              <PickupCard />
            </div>
          )}
          <section id="payment" aria-labelledby="pay-h" className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 scroll-mt-28">
            {!done && (
              <>
                <h2 id="pay-h" className="font-display text-xl tracking-wider uppercase">
                  2. {isDelivery ? "Delivery" : "Pickup"} &amp; payment
                </h2>
                {canDeliver && (
                  <div className="mt-4">
                    <div
                      role="radiogroup"
                      aria-label="Pickup or delivery"
                      className="grid grid-cols-2 gap-1 p-1 rounded-full bg-black/40 border border-white/10"
                    >
                      {(["PICKUP", "DELIVERY"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          role="radio"
                          aria-checked={mode === m}
                          onClick={() => pickMode(m)}
                          className={`py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${
                            mode === m ? "bg-brand-primary text-white" : "text-white/60 hover:text-white"
                          }`}
                        >
                          {m === "PICKUP" ? "Pickup" : "Delivery"}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-white/50 text-center">
                      {isDelivery
                        ? `Delivered by Uber · ${money(DELIVERY_MIN_CENTS)} minimum · ${DELIVERY_AREA_LABEL}`
                        : "Pick it up at the window, no extra fees"}
                    </p>
                  </div>
                )}
                <div className="mt-4">
                  <TipPicker
                    subtotalCents={totalCents}
                    value={tip}
                    onChange={setTip}
                    {...(isDelivery
                      ? {
                          label: (
                            <>
                              Tip your driver? <span className="text-white/40">100% goes to them.</span>
                            </>
                          ),
                          flats: DRIVER_TIP_FLATS_CENTS,
                        }
                      : {})}
                  />
                </div>
                <dl className="mt-4 mb-5 border-b border-white/10 pb-4 space-y-1">
                  <div className="flex justify-between text-sm text-white/70">
                    <dt>Food</dt>
                    <dd>{money(totalCents)}</dd>
                  </div>
                  {isDelivery && (
                    <>
                      <div className="flex justify-between text-sm text-white/70">
                        <dt>Delivery (Uber)</dt>
                        <dd>{deliveryQuote ? money(deliveryQuote.feeCents) : <span className="text-white/40">add address</span>}</dd>
                      </div>
                      <div className="flex justify-between text-sm text-white/70">
                        <dt>Service fee</dt>
                        <dd>{money(serviceFee)}</dd>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-sm text-white/70">
                    <dt>Sales tax (6%)</dt>
                    <dd>{money(taxCents)}</dd>
                  </div>
                  {tipCents > 0 && (
                    <div className="flex justify-between text-sm text-white/70">
                      <dt>{isDelivery ? "Driver tip" : "Tip"}</dt>
                      <dd>{money(tipCents)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-1">
                    <dt>Total</dt>
                    <dd>{money(chargeCents)}</dd>
                  </div>
                </dl>
              </>
            )}
            <Checkout
              instructions={instructions}
              tipCents={tipCents}
              taxCents={taxCents}
              mode={isDelivery ? "DELIVERY" : "PICKUP"}
              feesCents={deliveryFee + serviceFee}
              onDeliveryQuote={setDeliveryQuote}
              onPlaced={setPlaced}
            />
          </section>
        </aside>
      </div>

      {/* Phone: sticky summary bar that jumps to payment */}
      {!done && !payVisible && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-brand-secondary/95 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">Total</p>
              <p className="text-xl font-bold">{money(chargeCents)}</p>
            </div>
            <a href="#payment" className="px-7 py-3 rounded-full bg-brand-primary font-bold hover:opacity-80 transition-all">
              Checkout →
            </a>
          </div>
        </div>
      )}
      {editLine && editItem && (
        <ItemSheet
          item={editItem}
          initial={{ picks: editLine.picks, note: editLine.note, qty: editLine.qty }}
          onSave={(input) => replace(editLine.key, input)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
