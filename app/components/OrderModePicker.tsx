"use client";

import { useState, useSyncExternalStore } from "react";
import { business } from "@/lib/business";
import { DELIVERY_AREA_LABEL, DELIVERY_MIN_CENTS } from "@/lib/delivery";
import { MODE_LABEL, modesAvailable, readOrderMode, saveOrderMode, type OrderMode } from "./cart/orderMode";

const noopSubscribe = () => () => {};

// "Dine-in, Pickup or Delivery?" right under the menu title, so customers (e.g.
// from Google's Order online button) see delivery up front, and customers who
// scanned the bar card at McSorley's see they're ordering dine-in. The pick
// carries over to the order page.
export default function OrderModePicker() {
  // false during server render + hydration, true after: localStorage and the
  // delivery flag are client-only.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [mode, setMode] = useState<OrderMode>(readOrderMode);

  if (!mounted) return null;
  const modes = modesAvailable();
  const current: OrderMode = modes.includes(mode) ? mode : "PICKUP";

  const pick = (m: OrderMode) => {
    setMode(m);
    saveOrderMode(m);
  };

  return (
    <div className="mt-8 w-full flex flex-col items-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">How do you want it?</p>
      <div
        role="radiogroup"
        aria-label="Dine-in, pickup or delivery"
        className={`mt-3 w-full max-w-md grid ${modes.length === 3 ? "grid-cols-3" : "grid-cols-2"} gap-1 p-1 rounded-full bg-white/[0.06] border border-white/10`}
      >
        {modes.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={current === m}
            onClick={() => pick(m)}
            className={`py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${
              current === m ? "bg-brand-primary text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>
      {current === "DINE_IN" ? (
        <div className="mt-4 w-full max-w-md rounded-2xl border border-brand-primary/60 bg-brand-primary/10 px-5 py-4">
          <p className="font-display text-xl tracking-wider uppercase">At McSorley&apos;s? You&apos;re in the right place.</p>
          <p className="mt-1 text-sm text-white/75">
            Order and pay right here on your phone. We&apos;ll bring your food out to you and call your name.
          </p>
        </div>
      ) : (
        <p className="mt-3 max-w-md text-sm text-white/60">
          {current === "DELIVERY"
            ? `Straight from our smoker to your door. Counter prices, no app markup. ${DELIVERY_AREA_LABEL}, $${DELIVERY_MIN_CENTS / 100} minimum.`
            : `Order ahead and grab it at our window, ${business.address.street}.`}
        </p>
      )}
    </div>
  );
}
