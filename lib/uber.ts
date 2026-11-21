// Uber Direct API (server only — reads secret env vars). Xtremery's account;
// pickup is always FTO's shop. UBER_DIRECT_ENV=test uses Uber's sandbox keys and
// asks for a simulated "robo courier", so nothing real is dispatched or billed.
//
// Facts checked against the sandbox (2026-11-20): quote fee is in cents and the
// quote lives 15 minutes; a created delivery's `fee` = delivery fee + tip; ASAP
// = pickup_ready_dt only; scheduled = pickup_ready_dt + pickup_deadline_dt.
import { business } from "./business";
import { addressLine, type DeliveryAddress, e164 } from "./delivery";

const CUSTOMER_ID = process.env.UBER_DIRECT_CUSTOMER_ID ?? "";
const CLIENT_ID = process.env.UBER_DIRECT_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.UBER_DIRECT_CLIENT_SECRET ?? "";
const IS_TEST = process.env.UBER_DIRECT_ENV !== "live";

export const uberConfigured = () => Boolean(CUSTOMER_ID && CLIENT_ID && CLIENT_SECRET);

const PICKUP_PHONE = e164(business.phone)!;
// Uber wants the same address format in quote and create, or it flags a changed location.
const addressJson = (street: string, unit: string | undefined, city: string, zip: string) =>
  JSON.stringify({ street_address: unit ? [street, unit] : [street], city, state: "FL", zip_code: zip, country: "US" });
const PICKUP_ADDRESS = addressJson(business.address.street, undefined, business.address.city, business.address.zip);
const dropoffJson = (a: DeliveryAddress) => addressJson(a.street, a.unit, a.city, a.zip);

const iso = (d: Date) => new Date(Math.floor(d.getTime() / 1000) * 1000).toISOString().replace(".000Z", "Z");

let cachedToken: { value: string; expires: number } | null = null;
async function token(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.value;
  const res = await fetch("https://auth.uber.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "eats.deliveries",
    }),
  });
  if (!res.ok) throw new Error(`Uber auth failed (${res.status})`);
  const j = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: j.access_token, expires: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

async function api<T>(path: string, body: unknown): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const res = await fetch(`https://api.uber.com/v1/customers/${CUSTOMER_ID}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    let message = text.slice(0, 300);
    try {
      const j = JSON.parse(text) as { message?: string; code?: string };
      message = j.message || j.code || message;
    } catch {
      /* keep raw text */
    }
    return { ok: false, status: res.status, message };
  }
  return { ok: true, data: JSON.parse(text) as T };
}

// When the driver should come: ASAP = once the food is ready; scheduled = a
// window starting at the customer's chosen time.
export function pickupTimes(readyAt: Date, scheduled: boolean, windowMinutes: number) {
  return scheduled
    ? { pickup_ready_dt: iso(readyAt), pickup_deadline_dt: iso(new Date(readyAt.getTime() + windowMinutes * 60_000)) }
    : { pickup_ready_dt: iso(readyAt) };
}

export type UberQuote = { id: string; feeCents: number; dropoffEta: string; expires: string };

export async function quoteDelivery(opts: {
  dropoff: DeliveryAddress;
  dropoffPhone: string; // E.164
  valueCents: number;
  times: ReturnType<typeof pickupTimes>;
}): Promise<{ ok: true; quote: UberQuote } | { ok: false; message: string }> {
  const r = await api<{ id: string; fee: number; dropoff_eta: string; expires: string }>("/delivery_quotes", {
    pickup_address: PICKUP_ADDRESS,
    pickup_phone_number: PICKUP_PHONE,
    dropoff_address: dropoffJson(opts.dropoff),
    dropoff_phone_number: opts.dropoffPhone,
    manifest_total_value: opts.valueCents,
    ...opts.times,
  });
  if (!r.ok) return { ok: false, message: r.message };
  return { ok: true, quote: { id: r.data.id, feeCents: r.data.fee, dropoffEta: r.data.dropoff_eta, expires: r.data.expires } };
}

export type UberDelivery = { id: string; status: string; trackingUrl: string; chargedCents: number };

export async function createDelivery(opts: {
  quoteId: string;
  orderId: string; // Square order id (our external id + idempotency key)
  shortRef: string; // what the driver says at the window
  customerName: string;
  dropoff: DeliveryAddress;
  dropoffPhone: string; // E.164
  items: { name: string; quantity: number; priceCents: number }[];
  valueCents: number;
  tipCents: number;
  times: ReturnType<typeof pickupTimes>;
}): Promise<{ ok: true; delivery: UberDelivery } | { ok: false; message: string }> {
  const first = opts.customerName.split(/\s+/)[0] || opts.customerName;
  const r = await api<{ id: string; status: string; tracking_url: string; fee: number }>("/deliveries", {
    quote_id: opts.quoteId,
    external_id: opts.orderId,
    idempotency_key: opts.orderId,
    manifest_reference: opts.shortRef,
    pickup_name: business.name,
    pickup_business_name: business.name,
    pickup_address: PICKUP_ADDRESS,
    pickup_phone_number: PICKUP_PHONE,
    pickup_notes: `Online order ${opts.shortRef} for ${first}. Come to the order window and give the name or order number.`,
    dropoff_name: opts.customerName,
    dropoff_address: dropoffJson(opts.dropoff),
    dropoff_phone_number: opts.dropoffPhone,
    ...(opts.dropoff.notes ? { dropoff_notes: opts.dropoff.notes } : {}),
    manifest_items: opts.items.slice(0, 50).map((i) => ({
      name: i.name.slice(0, 100),
      quantity: i.quantity,
      size: "small",
      price: i.priceCents,
    })),
    manifest_total_value: opts.valueCents,
    tip: opts.tipCents,
    undeliverable_action: "leave_at_door", // food: don't drive it back
    ...opts.times,
    ...(IS_TEST ? { test_specifications: { robo_courier_specification: { mode: "auto" } } } : {}),
  });
  if (!r.ok) return { ok: false, message: r.message };
  return {
    ok: true,
    delivery: { id: r.data.id, status: r.data.status, trackingUrl: r.data.tracking_url, chargedCents: r.data.fee },
  };
}

export { addressLine };
