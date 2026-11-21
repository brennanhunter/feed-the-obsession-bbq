"use client";

import { useState, useSyncExternalStore } from "react";
import { business } from "@/lib/business";
import { DELIVERY_AREA_LABEL, DELIVERY_MIN_CENTS } from "@/lib/delivery";
import { deliveryVisible, readOrderMode, saveOrderMode, type OrderMode } from "./cart/orderMode";

const noopSubscribe = () => () => {};

// "Pickup or Delivery?" right under the menu title, so customers (e.g. from
// Google's Order online button) see delivery up front. The pick carries over
// to the order page.
export default function OrderModePicker() {
  // false during server render + hydration, true after: localStorage and the
  // delivery flag are client-only.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [mode, setMode] = useState<OrderMode>(readOrderMode);

  if (!mounted || !deliveryVisible()) return null;

  const pick = (m: OrderMode) => {
    setMode(m);
    saveOrderMode(m);
  };

  return (
    <div className="mt-8 w-full flex flex-col items-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">How do you want it?</p>
      <div
        role="radiogroup"
        aria-label="Pickup or delivery"
        className="mt-3 w-full max-w-sm grid grid-cols-2 gap-1 p-1 rounded-full bg-white/[0.06] border border-white/10"
      >
        {(["PICKUP", "DELIVERY"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => pick(m)}
            className={`py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${
              mode === m ? "bg-brand-primary text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {m === "PICKUP" ? "Pickup" : "Delivery"}
          </button>
        ))}
      </div>
      <p className="mt-3 max-w-md text-sm text-white/60">
        {mode === "DELIVERY"
          ? `Straight from our smoker to your door. Counter prices, no app markup. ${DELIVERY_AREA_LABEL}, $${DELIVERY_MIN_CENTS / 100} minimum.`
          : `Order ahead and grab it at our window, ${business.address.street}.`}
      </p>
    </div>
  );
}
