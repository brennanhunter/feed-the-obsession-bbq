"use client";

import { useEffect, useState } from "react";
import type { CartItem } from "./CartContext";

// Fallback until Square's exact quote arrives (or if it can't be reached).
export const SALES_TAX_RATE = 0.06;

export type Quote = { subtotalCents: number; taxCents: number; totalCents: number; exact: boolean };

// Square's exact tax for the current cart (debounced), via /api/quote.
export function useQuote(items: CartItem[], foodCents: number): Quote {
  const estimate: Quote = {
    subtotalCents: foodCents,
    taxCents: Math.round(foodCents * SALES_TAX_RATE),
    totalCents: foodCents + Math.round(foodCents * SALES_TAX_RATE),
    exact: false,
  };
  const [quote, setQuote] = useState<{ key: string; q: Quote } | null>(null);
  const key = JSON.stringify(items.map((i) => [i.id, i.qty, i.picks ?? []]));

  useEffect(() => {
    if (!items.length) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: items.map((i) => ({ id: i.id, quantity: i.qty, picks: i.picks })) }),
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const q = (await res.json()) as Omit<Quote, "exact">;
        setQuote({ key, q: { ...q, exact: true } });
      } catch {
        /* keep the estimate */
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Only trust a quote for exactly this cart and food total.
  return quote && quote.key === key && quote.q.subtotalCents === foodCents ? quote.q : estimate;
}
