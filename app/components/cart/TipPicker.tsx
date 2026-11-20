"use client";

import { useState } from "react";
import { FLAT_TIPS_UNDER_CENTS, MAX_TIP_CENTS, NO_TIP, TIP_FLATS_CENTS, TIP_PCTS, type TipChoice } from "@/lib/tips";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

// "No tip / 10% / 15% / 20% / Other" pills (percentages of the food total), or
// "No tip / $1 / $2 / $3 / Other" on small orders.
export default function TipPicker({
  subtotalCents,
  value,
  onChange,
}: {
  subtotalCents: number;
  value: TipChoice;
  onChange: (choice: TipChoice) => void;
}) {
  // The custom box keeps its own text so "5." or an empty field doesn't fight the parser.
  const [customOpen, setCustomOpen] = useState(value.kind === "custom");
  const [customText, setCustomText] = useState(value.kind === "custom" ? (value.cents / 100).toFixed(2) : "");

  const pill = (active: boolean) =>
    `min-w-0 px-1 py-2 rounded-full border text-sm font-semibold leading-tight transition-all ${
      active ? "bg-brand-primary border-brand-primary" : "border-white/20 hover:border-brand-primary"
    }`;

  function pickCustom(text: string) {
    setCustomText(text);
    const dollars = Number(text.replace(/[^0-9.]/g, ""));
    const cents = Number.isFinite(dollars) ? Math.round(dollars * 100) : 0;
    onChange(cents > 0 ? { kind: "custom", cents: Math.min(MAX_TIP_CENTS, cents) } : NO_TIP);
  }

  return (
    <div>
      <p className="text-sm text-white/70">
        Add a tip for the pit crew? <span className="text-white/40">Totally optional.</span>
      </p>
      <div className="mt-2 grid grid-cols-5 gap-2">
        <button
          type="button"
          onClick={() => {
            setCustomOpen(false);
            onChange(NO_TIP);
          }}
          className={pill(value.kind === "none" && !customOpen)}
        >
          No tip
        </button>
        {subtotalCents < FLAT_TIPS_UNDER_CENTS
          ? TIP_FLATS_CENTS.map((cents) => (
              <button
                key={cents}
                type="button"
                onClick={() => {
                  setCustomOpen(false);
                  onChange({ kind: "flat", cents });
                }}
                className={pill(value.kind === "flat" && value.cents === cents)}
              >
                {money(cents).replace(".00", "")}
              </button>
            ))
          : TIP_PCTS.map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => {
                  setCustomOpen(false);
                  onChange({ kind: "pct", pct });
                }}
                className={pill(value.kind === "pct" && value.pct === pct)}
              >
                {pct}%
                <span className="block text-xs font-normal text-white/60">
                  {money(Math.round((subtotalCents * pct) / 100))}
                </span>
              </button>
            ))}
        <button
          type="button"
          onClick={() => {
            setCustomOpen(true);
            pickCustom(customText);
          }}
          className={pill(customOpen)}
        >
          Other
        </button>
      </div>
      {customOpen && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-white/60">$</span>
          <input
            type="text"
            inputMode="decimal"
            autoFocus
            value={customText}
            onChange={(e) => pickCustom(e.target.value)}
            placeholder="0.00"
            aria-label="Custom tip amount in dollars"
            className="w-28 p-2 text-base rounded bg-black/40 border border-white/20 text-white focus:outline-none focus:border-brand-primary"
          />
          <span className="text-xs text-white/40">Up to {money(MAX_TIP_CENTS)}</span>
        </div>
      )}
    </div>
  );
}
