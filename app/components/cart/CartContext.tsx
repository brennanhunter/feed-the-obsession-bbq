"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CartItem = {
  id: string; // Square catalog (item variation) id
  title: string;
  price: number; // dollars
  qty: number;
};

type AddInput = { id: string; title: string; price: number };

type Ctx = {
  items: CartItem[];
  add: (i: AddInput) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
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
      if (saved) setItems(JSON.parse(saved));
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
      const found = prev.find((p) => p.id === i.id);
      return found
        ? prev.map((p) => (p.id === i.id ? { ...p, qty: p.qty + 1 } : p))
        : [...prev, { id: i.id, title: i.title, price: i.price, qty: 1 }];
    });

  const remove: Ctx["remove"] = (id) =>
    setItems((prev) => prev.filter((p) => p.id !== id));

  const setQty: Ctx["setQty"] = (id, qty) =>
    setItems((prev) =>
      qty <= 0
        ? prev.filter((p) => p.id !== id)
        : prev.map((p) => (p.id === id ? { ...p, qty } : p))
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
