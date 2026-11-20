"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { ChoicePick } from "@/lib/catalog";

export type CartItem = {
  key: string; // id, plus the chosen options (same plate, different picks = separate line)
  id: string; // Square catalog (item variation) id
  title: string;
  price: number; // dollars, including any paid options
  qty: number;
  picks?: ChoicePick[]; // Square modifier ids + counts (meats, side, ...)
  detail?: string; // "Meats: Brisket ×2 + Ribs · Side: Beans", for display
};

type AddInput = { id: string; title: string; price: number; picks?: ChoicePick[]; detail?: string };

const keyOf = (i: { id: string; picks?: ChoicePick[] }) =>
  [i.id, ...(i.picks ?? []).map((p) => `${p.id}:${p.qty}`)].join("|");

type Ctx = {
  items: CartItem[];
  add: (i: AddInput) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  count: number;
  totalCents: number;
};

const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Persist the cart so it survives navigation (home ↔ /menu) and reloads.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fto-cart");
      if (saved) {
        // Lines saved by the older menu (fixed meat/side lists, Nov 2026) can't be
        // checked out against Square's options, so they're dropped; re-add them.
        const parsed = JSON.parse(saved) as (Partial<CartItem> & { proteins?: unknown; side?: unknown })[];
        setItems(
          parsed
            .filter((i): i is CartItem => Boolean(i && i.id && i.key) && i.proteins == null && i.side == null)
            .map((i) => ({ ...i, key: keyOf(i) }))
        );
      }
    } catch {
      /* ignore bad/blocked storage */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("fto-cart", JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const add: Ctx["add"] = (i) =>
    setItems((prev) => {
      const key = keyOf(i);
      const found = prev.find((p) => p.key === key);
      return found
        ? prev.map((p) => (p.key === key ? { ...p, qty: p.qty + 1 } : p))
        : [
            ...prev,
            {
              key,
              id: i.id,
              title: i.title,
              price: i.price,
              qty: 1,
              ...(i.picks?.length ? { picks: i.picks } : {}),
              ...(i.detail ? { detail: i.detail } : {}),
            },
          ];
    });

  const remove: Ctx["remove"] = (key) =>
    setItems((prev) => prev.filter((p) => p.key !== key));

  const setQty: Ctx["setQty"] = (key, qty) =>
    setItems((prev) =>
      qty <= 0
        ? prev.filter((p) => p.key !== key)
        : prev.map((p) => (p.key === key ? { ...p, qty } : p))
    );

  const clear = () => setItems([]);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const totalCents = items.reduce((s, i) => s + Math.round(i.price * 100) * i.qty, 0);

  return (
    <CartCtx.Provider value={{ items, add, remove, setQty, clear, count, totalCents }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used inside <CartProvider>");
  return c;
};
