"use client";

import { useState } from "react";
import { useCart } from "./CartContext";
import Checkout from "./Checkout";

export default function CartWidget() {
  const { items, count, totalCents, setQty, remove } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating cart button — only appears once there's something to order,
          so it doesn't compete with the hero's CTA on an empty cart. */}
      {count > 0 && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[70] flex items-center gap-2 px-5 py-3 rounded-full bg-brand-primary text-white font-bold shadow-lg hover:opacity-90 transition-all"
        >
          🛒 View Order
          <span className="ml-1 bg-white text-brand-primary rounded-full px-2 text-sm font-bold">{count}</span>
        </button>
      )}

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-brand-secondary text-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-2xl font-display tracking-wider">YOUR ORDER</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close cart" className="text-2xl leading-none">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <p className="text-white/60 text-center mt-10">Your cart is empty. Add some BBQ! 🍖</p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {items.map((i) => (
                    <li key={i.uid} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{i.title}</p>
                        {i.sides && i.sides.length > 0 && (
                          <p className="text-white/50 text-sm">Sides: {i.sides.map((s) => s.title).join(", ")}</p>
                        )}
                        <p className="text-white/60 text-sm">${i.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => setQty(i.uid, i.qty - 1)} aria-label="Decrease" className="w-7 h-7 rounded-full border border-white/20 hover:border-brand-primary">
                          −
                        </button>
                        <span className="w-6 text-center">{i.qty}</span>
                        <button type="button" onClick={() => setQty(i.uid, i.qty + 1)} aria-label="Increase" className="w-7 h-7 rounded-full border border-white/20 hover:border-brand-primary">
                          +
                        </button>
                        <button type="button" onClick={() => remove(i.uid)} aria-label="Remove item" className="ml-1 text-white/40 hover:text-brand-primary">
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-5 border-t border-white/10">
                <div className="flex justify-between mb-4 text-lg font-bold">
                  <span>Total</span>
                  <span>${(totalCents / 100).toFixed(2)}</span>
                </div>
                <Checkout onDone={() => setOpen(false)} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
