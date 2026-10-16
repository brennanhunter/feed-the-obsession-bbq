"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CartItem = {
  key: string; // id, plus the protein picks for 2/3 Meat plates
  id: string; // Square catalog (item variation) id
  title: string;
  price: number; // dollars
  qty: number;
  proteins?: string[]; // 2 Meat / 3 Meat plates only
};

type AddInput = { id: string; title: string; price: number; proteins?: string[] };

// Same plate with different meats is a separate line.
const keyOf = (i: { id: string; proteins?: string[] }) =>
  i.proteins?.length ? `${i.id}|${i.proteins.join("+")}` : i.id;

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
        // Carts saved before protein picks existed have no key — derive it.
        const parsed = JSON.parse(saved) as Partial<CartItem>[];
        setItems(
          parsed
            .filter((i): i is CartItem & Partial<CartItem> => Boolean(i && i.id))
            .map((i) => ({ ...i, key: i.key ?? keyOf({ id: i.id, proteins: i.proteins }) }))
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
              ...(i.proteins?.length ? { proteins: i.proteins } : {}),
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
