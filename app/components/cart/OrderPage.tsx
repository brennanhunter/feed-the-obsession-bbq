"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "./CartContext";
import Checkout from "./Checkout";
import { ItemRow } from "../MenuWrapper";
import { business } from "@/lib/business";
import { getOpenStatus } from "@/lib/hours";
import type { MenuItem } from "@/lib/catalog";

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

export default function OrderPage({ extras }: { extras: MenuItem[] }) {
  const { items, totalCents, setQty, remove } = useCart();
  const [instructions, setInstructions] = useState("");
  const [done, setDone] = useState(false);
  // Avoid a flash of "empty" before the saved cart loads from localStorage.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
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
                      {(i.proteins || i.side) && (
                        <p className="text-brand-primary text-sm">
                          {[i.proteins?.join(" + "), i.side ? `Side: ${i.side}` : null].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <p className="text-white/50 text-sm">{money(Math.round(i.price * 100))} each</p>
                      <button type="button" onClick={() => remove(i.key)} className="mt-2 text-sm text-white/40 hover:text-brand-primary">
                        Remove
                      </button>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="font-bold text-brand-primary">{money(Math.round(i.price * 100) * i.qty)}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setQty(i.key, i.qty - 1)} aria-label={`Decrease ${i.title}`} className="w-9 h-9 rounded-full border border-white/20 hover:border-brand-primary text-lg">
                          −
                        </button>
                        <span className="w-8 text-center font-semibold">{i.qty}</span>
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

          <div className="lg:hidden">
            <PickupCard />
          </div>
        </div>

        {/* Right: pickup + pay (sticky on desktop) */}
        <aside className="space-y-6 lg:sticky lg:top-28">
          <div className="hidden lg:block">
            <PickupCard />
          </div>
          <section id="payment" aria-labelledby="pay-h" className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 scroll-mt-28">
            {!done && (
              <>
                <h2 id="pay-h" className="font-display text-xl tracking-wider uppercase">2. Pickup &amp; payment</h2>
                <div className="mt-4 mb-5 flex justify-between text-lg font-bold border-b border-white/10 pb-4">
                  <span>Total</span>
                  <span>{money(totalCents)}</span>
                </div>
              </>
            )}
            <Checkout instructions={instructions} onDone={() => setDone(true)} />
          </section>
        </aside>
      </div>

      {/* Phone: sticky summary bar that jumps to payment */}
      {!done && !payVisible && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-brand-secondary/95 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">Total</p>
              <p className="text-xl font-bold">{money(totalCents)}</p>
            </div>
            <a href="#payment" className="px-7 py-3 rounded-full bg-brand-primary font-bold hover:opacity-80 transition-all">
              Checkout →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
