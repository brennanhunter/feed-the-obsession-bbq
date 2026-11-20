"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { ChoicePick } from "@/lib/catalog";

export type CartItem = {
  key: string; // id, plus the chosen options (same plate, different picks = separate line)
  id: string; // Square catalog (item variation) id
  title: string;
  price: number; // dollars, including any paid options
  qty: number;
  picks?: ChoicePick[]; // Square modifier ids + counts (meats, side, sauce, ...)
  detail?: string; // "Meats: Brisket ×2 + Ribs · Side: Beans", for display
  note?: string; // the customer's special request for this item
  leadDays?: number; // whole cuts: pickup must be this many days out
  unit?: "lb"; // sold by the pound
};

export type CartInput = Omit<CartItem, "key" | "qty"> & { qty?: number };

// Same item with different picks or a different request is its own line.
const keyOf = (i: { id: string; picks?: ChoicePick[]; note?: string }) =>
  [i.id, ...(i.picks ?? []).map((p) => `${p.id}:${p.qty}`), i.note ? `note:${i.note}` : ""].filter(Boolean).join("|");

type Ctx = {
  items: CartItem[];
  add: (i: CartInput) => void;
  replace: (key: string, i: CartInput) => void; // edit a line in place (same spot in the list)
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

  const lineOf = (i: Omit<CartInput, "qty">, key: string, qty: number): CartItem => ({
    key,
    id: i.id,
    title: i.title,
    price: i.price,
    qty,
    ...(i.picks?.length ? { picks: i.picks } : {}),
    ...(i.detail ? { detail: i.detail } : {}),
    ...(i.note ? { note: i.note } : {}),
    ...(i.leadDays ? { leadDays: i.leadDays } : {}),
    ...(i.unit ? { unit: i.unit } : {}),
  });

  const add: Ctx["add"] = ({ qty = 1, ...i }) =>
    setItems((prev) => {
      const key = keyOf(i);
      const n = Math.max(1, Math.floor(qty));
      const found = prev.find((p) => p.key === key);
      return found
        ? prev.map((p) => (p.key === key ? { ...p, qty: p.qty + n } : p))
        : [...prev, lineOf(i, key, n)];
    });

  // Replace an edited line where it sits; if the edit makes it identical to
  // another line, the two merge.
  const replace: Ctx["replace"] = (oldKey, { qty = 1, ...i }) =>
    setItems((prev) => {
      const key = keyOf(i);
      const n = Math.max(1, Math.floor(qty));
      const at = prev.findIndex((p) => p.key === oldKey);
      const rest = prev.filter((p) => p.key !== oldKey);
      if (rest.some((p) => p.key === key)) return rest.map((p) => (p.key === key ? { ...p, qty: p.qty + n } : p));
      const next = [...rest];
      next.splice(at < 0 ? next.length : at, 0, lineOf(i, key, n));
      return next;
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
    <CartCtx.Provider value={{ items, add, replace, remove, setQty, clear, count, totalCents }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used inside <CartProvider>");
  return c;
};
