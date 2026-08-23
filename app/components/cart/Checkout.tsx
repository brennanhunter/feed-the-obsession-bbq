"use client";

import { useRef, useState } from "react";
import Script from "next/script";
import { useCart } from "./CartContext";
import { business } from "@/lib/business";

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
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "paying" | "done" | "error">("idle");
  const [error, setError] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cardRef = useRef<any>(null);
  const initStarted = useRef(false); // reserve synchronously so the form attaches once

  // Online ordering is "live" only once Square keys are present.
  const configured = Boolean(APP_ID && LOCATION_ID);

  async function initSquare() {
    if (!configured || !window.Square || initStarted.current) return;
    initStarted.current = true;
    try {
      const payments = window.Square.payments(APP_ID!, LOCATION_ID!);
      const card = await payments.card();
      await card.attach("#card-container");
      cardRef.current = card;
    } catch (e) {
      initStarted.current = false; // allow a retry on failure
      console.error("Square card init failed:", e);
    }
  }

  async function pay() {
    setError("");
    if (!cardRef.current || items.length === 0) return;
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError("Please add your name, phone, and email.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("Please enter a valid email for your confirmation.");
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
          items: items.map((i) => ({ id: i.id, quantity: i.qty })),
          channel,
          table: channel === "DINE_IN" ? table.trim() : undefined,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
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
        <p className="text-white/70">We&apos;ll get it on the smoker — a confirmation is on its way to your email. See you soon!</p>
        {onDone && (
          <button onClick={onDone} className="mt-6 px-6 py-2 rounded-full bg-brand-primary">
            Close
          </button>
        )}
      </div>
    );
  }

  // Online ordering not live yet → friendly coming-soon + call to order.
  if (!configured) {
    return (
      <div className="text-center py-4 text-white">
        <p className="text-2xl font-display tracking-wider text-brand-primary mb-2">
          Online Ordering Coming Soon
        </p>
        <p className="text-white/70 mb-5">
          We&apos;re firing up online checkout. For now, give us a call and we&apos;ll get your
          order on the smoker.
        </p>
        <a
          href={business.phoneHref}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-brand-primary font-bold hover:opacity-80 transition-all"
        >
          📞 Call to Order — {business.phone}
        </a>
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
      <input
        type="email"
        placeholder="Email (for your confirmation)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-3 p-2 rounded bg-black/40 border border-white/20"
      />

      {/* Square injects the secure card fields here (PAN never touches our server). */}
      <div id="card-container" className="mb-4 p-3 rounded bg-white" />

      {error && <p className="mb-3 text-red-400 text-sm">{error}</p>}

      <button
        type="button"
        onClick={pay}
        disabled={status === "paying" || items.length === 0}
        className="w-full py-3 rounded-full bg-brand-primary font-bold disabled:opacity-50"
      >
        {status === "paying" ? "Processing…" : `Pay $${(totalCents / 100).toFixed(2)}`}
      </button>
      <p className="mt-3 text-xs text-white/40 text-center">Secure card payment by Square.</p>
    </div>
  );
}
