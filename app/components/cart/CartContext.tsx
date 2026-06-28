"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CartSide = { id: number; title: string };

export type CartItem = {
  uid: string; // unique per item + chosen sides combo
  id: number;
  title: string;
  price: number; // dollars (base price; included sides are free)
  qty: number;
  sides?: CartSide[]; // for plates that come with chosen sides
};

type AddInput = { id: number; title: string; price: number; sides?: CartSide[] };

type Ctx = {
  items: CartItem[];
  add: (i: AddInput) => void;
  remove: (uid: string) => void;
  setQty: (uid: string, qty: number) => void;
  clear: () => void;
  count: number;
  totalCents: number;
};

const CartCtx = createContext<Ctx | null>(null);

// Same item + same sides stack together; different sides are separate lines.
function makeUid(id: number, sides?: CartSide[]) {
  if (!sides || sides.length === 0) return String(id);
  return `${id}:${sides
    .map((s) => s.id)
    .sort((a, b) => a - b)
    .join("-")}`;
}

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

  const add: Ctx["add"] = (i) => {
    const uid = makeUid(i.id, i.sides);
    setItems((prev) => {
      const found = prev.find((p) => p.uid === uid);
      return found
        ? prev.map((p) => (p.uid === uid ? { ...p, qty: p.qty + 1 } : p))
        : [...prev, { uid, id: i.id, title: i.title, price: i.price, qty: 1, sides: i.sides }];
    });
  };

  const remove: Ctx["remove"] = (uid) =>
    setItems((prev) => prev.filter((p) => p.uid !== uid));

  const setQty: Ctx["setQty"] = (uid, qty) =>
    setItems((prev) =>
      qty <= 0
        ? prev.filter((p) => p.uid !== uid)
        : prev.map((p) => (p.uid === uid ? { ...p, qty } : p))
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
