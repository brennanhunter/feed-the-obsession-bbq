"use client";

import { useRef, useState, useEffect } from "react";
import Script from "next/script";
import { useCart } from "./CartContext";
import { business } from "@/lib/business";
import { getOpenStatus, getPickupOptions, type PickupOption } from "@/lib/hours";
import { addressLine, cleanAddress, DELIVERY_AREA_LABEL, DELIVERY_MIN_CENTS, zipDeliverable } from "@/lib/delivery";

export type DeliveryQuote = { feeCents: number; dropoffEta: string };
// What the confirmation page needs once the card goes through.
export type PlacedOrder = {
  mode: "DINE_IN" | "PICKUP" | "DELIVERY";
  channel: "TAKE_OUT" | "DINE_IN";
  table?: string;
  name: string;
  email: string;
  when: string | null; // "Tomorrow at 12:00 PM", or null for ASAP
  address?: string; // delivery address
  trackingUrl?: string;
  tipped: boolean;
};
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const etTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });

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

export default function Checkout({
  onDone,
  instructions,
  tipCents = 0,
  taxCents = 0,
  mode = "PICKUP",
  feesCents = 0,
  onDeliveryQuote,
  onPlaced,
}: {
  onDone?: () => void;
  instructions?: string;
  tipCents?: number; // optional tip picked on the order page (crew tip, or the driver's on delivery)
  taxCents?: number; // Florida sales tax from Square's quote (Square applies it at checkout)
  mode?: "DINE_IN" | "PICKUP" | "DELIVERY";
  feesCents?: number; // delivery: Uber fee + service fee, shown in the Pay amount
  onDeliveryQuote?: (q: DeliveryQuote | null) => void; // live Uber price, up to the order page's totals
  onPlaced?: (order: PlacedOrder) => void; // paid: the order page swaps to the confirmation
}) {
  const { items, totalCents, clear } = useCart();
  const isDelivery = mode === "DELIVERY";
  const channel: "TAKE_OUT" | "DINE_IN" = mode === "DINE_IN" ? "DINE_IN" : "TAKE_OUT";
  // Delivery address (remembered on this device with the name/phone/email).
  const [street, setStreet] = useState("");
  const [unit, setUnit] = useState("");
  const [city, setCity] = useState("DeLand");
  const [zip, setZip] = useState("");
  const [dropNotes, setDropNotes] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [tipped, setTipped] = useState(false); // remembered past clear() for the thank-you
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "paying" | "done" | "error">("idle");
  const [error, setError] = useState("");
  // Open/closed status — computed client-side (Eastern time) to avoid SSR mismatch.
  const [openStatus, setOpenStatus] = useState<{ open: boolean; label: string } | null>(null);
  const [pickupOpts, setPickupOpts] = useState<{ asap: boolean; slots: PickupOption[] } | null>(null);
  const [pickup, setPickup] = useState<string>("asap"); // "asap" or a slot ISO
  // Repeat customers: name, phone and email are remembered on this device (only
  // here, in the browser) after a successful order, and filled in next time.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("fto-customer") || "null") as
        | {
            name?: string;
            phone?: string;
            email?: string;
            address?: { street?: string; unit?: string; city?: string; zip?: string; notes?: string };
          }
        | null;
      if (saved) {
        if (saved.name) setName(saved.name);
        if (saved.phone) setPhone(saved.phone);
        if (saved.email) setEmail(saved.email);
        if (saved.address?.street) setStreet(saved.address.street);
        if (saved.address?.unit) setUnit(saved.address.unit);
        if (saved.address?.city) setCity(saved.address.city);
        if (saved.address?.zip) setZip(saved.address.zip);
        if (saved.address?.notes) setDropNotes(saved.address.notes);
      }
    } catch {
      /* storage blocked or bad data: start blank */
    }
  }, []);

  // Whole cuts in the cart push the earliest pickup out by their notice period.
  const leadDays = items.reduce((m, i) => Math.max(m, i.leadDays ?? 0), 0);
  useEffect(() => {
    setOpenStatus(getOpenStatus());
    const opts = getPickupOptions(leadDays);
    setPickupOpts(opts);
    setPickup((prev) =>
      prev !== "asap" && opts.slots.some((s) => s.iso === prev) ? prev : opts.asap ? "asap" : opts.slots[0]?.iso ?? ""
    );
  }, [leadDays]);
  const pickupDays: string[] = [];
  if (pickupOpts?.asap) pickupDays.push("Today");
  for (const sl of pickupOpts?.slots ?? []) if (!pickupDays.includes(sl.day)) pickupDays.push(sl.day);
  const pickupDay =
    pickup === "asap" ? "Today" : pickupOpts?.slots.find((sl) => sl.iso === pickup)?.day ?? pickupDays[0] ?? "";
  // Live Uber price for the address + delivery time (debounced). Keyed by the
  // inputs so a stale answer is never shown for a different address or time.
  const addr = isDelivery ? cleanAddress({ street, unit, city, zip, notes: dropNotes }) : null;
  const zipOk = addr ? zipDeliverable(addr.zip) : false;
  const [requote, setRequote] = useState(0);
  const quoteKey = addr && zipOk ? JSON.stringify([addr.street, addr.unit, addr.city, addr.zip, pickup, requote]) : "";
  const [dq, setDq] = useState<{ key: string; quote?: DeliveryQuote; error?: string } | null>(null);
  useEffect(() => {
    if (!quoteKey || !addr) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/delivery/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: addr, phone, pickupAt: pickup === "asap" ? undefined : pickup, foodCents: totalCents }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          setDq({ key: quoteKey, error: (await res.text()) || "Couldn't price delivery to that address." });
          return;
        }
        setDq({ key: quoteKey, quote: (await res.json()) as DeliveryQuote });
      } catch (e) {
        if ((e as Error).name !== "AbortError") setDq({ key: quoteKey, error: "Couldn't reach Uber — check your connection." });
      }
    }, 600);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey]);
  const liveQuote = isDelivery && dq && dq.key === quoteKey ? dq : null;
  const deliveryQuote = liveQuote?.quote ?? null;
  useEffect(() => {
    onDeliveryQuote?.(deliveryQuote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryQuote?.feeCents, deliveryQuote?.dropoffEta]);
  const underMin = isDelivery && totalCents < DELIVERY_MIN_CENTS;

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
    if (isDelivery) {
      if (!addr) {
        setError("Please enter your delivery address (street, city and ZIP).");
        return;
      }
      if (underMin) {
        setError(`Delivery starts at ${money(DELIVERY_MIN_CENTS)} in food.`);
        return;
      }
      if (!deliveryQuote) {
        setError("Waiting on the delivery price — give it a second.");
        return;
      }
      if (phone.replace(/\D/g, "").length < 10) {
        setError("Please enter a 10-digit phone number so the driver can reach you.");
        return;
      }
    }
    if (!pickup) {
      setError("Please choose a pickup time.");
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
          items: items.map((i) => ({ id: i.id, quantity: i.qty, picks: i.picks, note: i.note })),
          channel: isDelivery ? "TAKE_OUT" : channel,
          ...(isDelivery && addr
            ? { fulfillment: "DELIVERY", delivery: { ...addr, expectedFeeCents: deliveryQuote?.feeCents } }
            : {}),
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          pickupAt: pickup === "asap" ? undefined : pickup,
          instructions: instructions?.trim() || undefined,
          tipCents: tipCents > 0 ? tipCents : undefined,
        }),
      });
      if (res.status === 409) setRequote((n) => n + 1); // delivery price moved: re-price, ask again
      if (!res.ok) throw new Error((await res.text()) || "Payment failed.");
      const ok = (await res.json().catch(() => ({}))) as { trackingUrl?: string };
      if (ok.trackingUrl) setTrackingUrl(ok.trackingUrl);
      setTipped(tipCents > 0);
      try {
        localStorage.setItem(
          "fto-customer",
          JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            ...(addr ? { address: { street: addr.street, unit: addr.unit, city: addr.city, zip: addr.zip, notes: addr.notes } } : {}),
          })
        );
      } catch {
        /* ignore */
      }
      const slot = pickup === "asap" ? undefined : pickupOpts?.slots.find((s) => s.iso === pickup);
      onPlaced?.({
        mode,
        channel: isDelivery ? "TAKE_OUT" : channel,
        name: name.trim(),
        email: email.trim(),
        when: slot ? `${slot.day} at ${slot.time}` : null,
        address: addr ? addressLine(addr) : undefined,
        trackingUrl: ok.trackingUrl,
        tipped: tipCents > 0,
      });
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
        {trackingUrl ? (
          <>
            <p className="text-white/70">
              We&apos;re firing it up, and an Uber driver is booked to bring it to you. You&apos;ll get texts with
              live tracking, and a confirmation is on its way to your email.
            </p>
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 px-6 py-2 rounded-full border border-white/30 hover:border-brand-primary font-semibold"
            >
              Track your delivery →
            </a>
          </>
        ) : (
          <p className="text-white/70">
            We&apos;ll get it on the smoker — a confirmation is on its way to your email.
            {tipped ? " And thanks for the tip, the crew appreciates it." : ""} See you soon!
          </p>
        )}
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

      {/* Confidence cues */}
      <div className="mb-4 rounded-xl bg-black/40 border border-white/10 p-3.5 text-sm space-y-1.5">
        {openStatus && (
          <p className="flex items-center gap-2">
            <span className={openStatus.open ? "text-green-400" : "text-white/50"}>●</span>
            <span className={openStatus.open ? "text-green-400 font-semibold" : "text-white/70"}>
              {openStatus.label}
            </span>
          </p>
        )}
        <p className="text-white/70">
          {isDelivery ? "🚗 Delivered by Uber, with live tracking by text" : "⏱️ Most orders ready in ~15–20 min"}
        </p>
        <p className="text-white/70">✉️ Email confirmation sent instantly</p>
      </div>

      {/* Pickup time — scheduling is required when we're closed */}
      {pickupOpts && (
        <div className="mb-4">
          <label className="block text-sm mb-1.5">
            {leadDays > 0 ? (
              <span className="text-brand-primary font-semibold">
                Whole cuts are smoked to order — pick a time {leadDays} or more days out
              </span>
            ) : pickupOpts.asap ? (
              <span className="text-white/70">{isDelivery ? "Delivery time" : channel === "DINE_IN" ? "Ready time" : "Pickup time"}</span>
            ) : (
              <span className="text-brand-primary font-semibold">
                We&apos;re closed right now — schedule a {isDelivery ? "delivery" : "pickup"} time
              </span>
            )}
          </label>
          {/* Day, then time (like Jersey Mike's): shorter lists, and orders days ahead read clearly. */}
          <div className="grid grid-cols-2 gap-2">
            <select
              aria-label="Pickup day"
              value={pickupDay}
              onChange={(e) => {
                const day = e.target.value;
                setPickup(day === "Today" && pickupOpts.asap ? "asap" : pickupOpts.slots.find((s) => s.day === day)?.iso ?? "");
              }}
              className="w-full p-3 rounded bg-black/40 border border-white/20 text-white focus:outline-none focus:border-brand-primary"
            >
              {pickupDays.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              aria-label="Pickup time"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="w-full p-3 rounded bg-black/40 border border-white/20 text-white focus:outline-none focus:border-brand-primary"
            >
              {pickupDay === "Today" && pickupOpts.asap && (
                <option value="asap">{isDelivery ? "ASAP (about 45–60 min)" : "ASAP (~20 min)"}</option>
              )}
              {pickupOpts.slots
                .filter((s) => s.day === pickupDay)
                .map((s) => (
                  <option key={s.iso} value={s.iso}>
                    {s.time}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {/* Delivery address + the live Uber price */}
      {isDelivery && (
        <div className="mb-4 space-y-3">
          {pickup !== "asap" && (
            <p className="-mt-2 text-xs text-white/50">That&apos;s when it leaves our smoker; it reaches you about 15–30 minutes later.</p>
          )}
          <input
            placeholder="Street address"
            autoComplete="address-line1"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="w-full p-2.5 text-base rounded bg-black/40 border border-white/20"
          />
          <div className="grid grid-cols-[1fr_7rem] gap-2">
            <input
              placeholder="Apt / suite (optional)"
              autoComplete="address-line2"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full p-2.5 text-base rounded bg-black/40 border border-white/20"
            />
            <input
              placeholder="ZIP"
              inputMode="numeric"
              autoComplete="postal-code"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
              className="w-full p-2.5 text-base rounded bg-black/40 border border-white/20"
            />
          </div>
          <input
            placeholder="City"
            autoComplete="address-level2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full p-2.5 text-base rounded bg-black/40 border border-white/20"
          />
          <input
            placeholder="Notes for the driver (gate code, which door…)"
            value={dropNotes}
            onChange={(e) => setDropNotes(e.target.value.slice(0, 200))}
            className="w-full p-2.5 text-base rounded bg-black/40 border border-white/20"
          />
          <div className="rounded-xl bg-black/40 border border-white/10 p-3 text-sm" aria-live="polite">
            {!addr ? (
              <p className="text-white/60">Add your address to see the delivery price.</p>
            ) : !zipOk ? (
              <p className="text-brand-primary">We deliver to {DELIVERY_AREA_LABEL} for now. Pickup is always open!</p>
            ) : liveQuote?.error ? (
              <p className="text-brand-primary">{liveQuote.error}</p>
            ) : deliveryQuote ? (
              <p className="text-white">
                <span className="text-green-400">●</span> Uber delivery <strong>{money(deliveryQuote.feeCents)}</strong>
                {pickup === "asap" && <> · arrives around <strong>{etTime(deliveryQuote.dropoffEta)}</strong></>}
              </p>
            ) : (
              <p className="text-white/60">Checking Uber&apos;s price…</p>
            )}
          </div>
          {underMin && (
            <p className="text-sm text-brand-primary">
              Delivery starts at {money(DELIVERY_MIN_CENTS)} in food. Add {money(DELIVERY_MIN_CENTS - totalCents)} more, or
              switch to pickup.
            </p>
          )}
        </div>
      )}

      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full mb-3 p-2.5 text-base rounded bg-black/40 border border-white/20"
      />
      <input
        placeholder={isDelivery ? "Phone (the driver texts you here)" : "Phone"}
        type="tel"
        autoComplete="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full mb-3 p-2.5 text-base rounded bg-black/40 border border-white/20"
      />
      <input
        type="email"
        placeholder="Email (for your confirmation)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-3 p-2.5 text-base rounded bg-black/40 border border-white/20"
      />

      {/* Square injects the secure card fields here (PAN never touches our server). */}
      <p className="text-sm text-white/70 mb-1.5">Card details</p>
      <div id="card-container" className="mb-4 p-3 rounded-xl bg-white" />

      {error && <p className="mb-3 text-red-400 text-sm">{error}</p>}

      <button
        type="button"
        onClick={pay}
        disabled={status === "paying" || items.length === 0 || (isDelivery && (underMin || !deliveryQuote))}
        className="w-full py-3 rounded-full bg-brand-primary font-bold disabled:opacity-50"
      >
        {status === "paying" ? "Processing…" : `Pay ${money(totalCents + taxCents + tipCents + feesCents)}`}
      </button>
      <p className="mt-3 text-xs text-white/50 text-center leading-relaxed">
        🔒 Secure checkout by Square. Your card details go straight to Square and never touch our servers.
        <br />
        Questions? Call <a href={business.phoneHref} className="text-brand-primary font-semibold">{business.phone}</a>.
      </p>
    </div>
  );
}
