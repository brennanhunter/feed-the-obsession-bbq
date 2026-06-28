"use client";

import { useState } from "react";
import type { MenuItem } from "@/lib/menu";
import type { CartSide } from "./CartContext";

export default function SidePicker({
  item,
  sides,
  required,
  onConfirm,
  onClose,
}: {
  item: MenuItem;
  sides: MenuItem[];
  required: number;
  onConfirm: (chosen: CartSide[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (id: number) =>
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : prev.length < required
        ? [...prev, id]
        : prev
    );

  const done = selected.length === required;

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-brand-secondary text-white rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-2xl font-display tracking-wider">{item.title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-2xl leading-none">
            ✕
          </button>
        </div>
        <p className="text-white/60 mb-5">
          Choose {required} sides{" "}
          <span className="text-brand-primary font-semibold">
            ({selected.length}/{required})
          </span>
        </p>

        <div className="grid grid-cols-1 gap-2 mb-6">
          {sides.map((s) => {
            const on = selected.includes(s.id);
            const disabled = !on && selected.length >= required;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                disabled={disabled}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  on ? "border-brand-primary bg-brand-primary/20" : "border-white/15 hover:border-white/40"
                } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <span>{s.title}</span>
                <span
                  className={`w-5 h-5 rounded-full border grid place-content-center text-xs ${
                    on ? "bg-brand-primary border-brand-primary" : "border-white/40"
                  }`}
                >
                  {on ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            const chosen = selected
              .map((id) => sides.find((x) => x.id === id))
              .filter((s): s is MenuItem => Boolean(s))
              .map((s) => ({ id: s.id, title: s.title }));
            onConfirm(chosen);
          }}
          disabled={!done}
          className="w-full py-3 rounded-full bg-brand-primary font-bold disabled:opacity-50"
        >
          Add to Order — ${item.price.toFixed(2)}
        </button>
      </div>
    </div>
  );
}
