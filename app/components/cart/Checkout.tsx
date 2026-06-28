"use client";

import { useRef, useState } from "react";
import Script from "next/script";
import { useCart } from "./CartContext";

const APP_ID = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
const LOCATION_ID = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
const ENV = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT;

const SCRIPT_SRC =
  ENV === "production"
    ? "https://web.squarecdn.com/v1/square.js"
    : "https://sandbox.web.squarecdn.com/v1/square.js";

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => {
        card: () => Promise<{
          attach: (sel: string) => Promise<void>;
          tokenize: () => Promise<{ status: string; token?: string }>;
        }>;
      };
    };
  }
}

export default function Checkout({ onDone }: { onDone?: () => void }) {
  const { items, totalCents, clear } = useCart();
  const [channel, setChannel] = useState<"TAKE_OUT" | "DINE_IN">("TAKE_OUT");
  const [table, setTable] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "paying" | "done" | "error">("idle");
  const [error, setError] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cardRef = useRef<any>(null);

  const configured = Boolean(APP_ID && LOCATION_ID);

  async function initSquare() {
    if (!configured || !window.Square || cardRef.current) return;
    try {
      const payments = window.Square.payments(APP_ID!, LOCATION_ID!);
      const card = await payments.card();
      await card.attach("#card-container");
      cardRef.current = card;
    } catch (e) {
      console.error("Square card init failed:", e);
    }
  }

  async function pay() {
    setError("");
    if (!cardRef.current || items.length === 0) return;
    if (!name.trim() || !phone.trim()) {
      setError("Please add your name and phone.");
      return;
    }
    if (channel === "DINE_IN" && !table.trim()) {
      setError("Please enter your table number.");
      return;
    }
    setStatus("paying");
    try {
      const result = await cardRef.current.tokenize();
      if (result.status !== "OK") throw new Error("Card couldn't be read — check the details and try again.");

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: result.token,
          items: items.map((i) => ({ id: i.id, quantity: i.qty, sides: i.sides?.map((s) => s.id) ?? [] })),
          channel,
          table: channel === "DINE_IN" ? table.trim() : undefined,
          name: name.trim(),
          phone: phone.trim(),
        }),
      });
      if (!res.ok) throw new Error((await res.text()) || "Payment failed.");
      clear();
      setStatus("done");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="text-center py-8">
        <p className="text-2xl text-green-400 font-bold mb-2">Order placed! 🍖</p>
        <p className="text-white/70">We&apos;ll get it on the smoker. See you soon!</p>
        {onDone && (
          <button onClick={onDone} className="mt-6 px-6 py-2 rounded-full bg-brand-primary">
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="text-white">
      <Script
        src={SCRIPT_SRC}
        strategy="afterInteractive"
        onLoad={() => {
          void initSquare();
        }}
        onReady={() => {
          void initSquare();
        }}
      />

      {/* Dine-in vs Take-out */}
      <div className="flex gap-3 mb-4">
        {(["TAKE_OUT", "DINE_IN"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setChannel(c)}
            className={`flex-1 py-2 rounded-full border transition-all ${
              channel === c ? "bg-brand-primary border-brand-primary" : "border-white/20 hover:border-brand-primary"
            }`}
          >
            {c === "TAKE_OUT" ? "Take-out" : "Dine-in"}
          </button>
        ))}
      </div>

      {channel === "DINE_IN" && (
        <input
          placeholder="Table number"
          value={table}
          onChange={(e) => setTable(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-black/40 border border-white/20"
        />
      )}
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full mb-3 p-2 rounded bg-black/40 border border-white/20"
      />
      <input
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full mb-3 p-2 rounded bg-black/40 border border-white/20"
      />

      {configured ? (
        // Square injects the secure card fields here (PAN never touches our server).
        <div id="card-container" className="mb-4 p-3 rounded bg-white" />
      ) : (
        <p className="mb-4 text-sm text-yellow-400">
          Card form will appear once Square keys are added to <code>.env.local</code>
          {" "}(NEXT_PUBLIC_SQUARE_APPLICATION_ID + LOCATION_ID), then restart the dev server.
        </p>
      )}

      {error && <p className="mb-3 text-red-400 text-sm">{error}</p>}

      <button
        type="button"
        onClick={pay}
        disabled={status === "paying" || items.length === 0 || !configured}
        className="w-full py-3 rounded-full bg-brand-primary font-bold disabled:opacity-50"
      >
        {status === "paying" ? "Processing…" : `Pay $${(totalCents / 100).toFixed(2)}`}
      </button>
    </div>
  );
}
