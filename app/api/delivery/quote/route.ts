import {
  cleanAddress,
  DELIVERY_AREA_LABEL,
  deliveryAllowedOnServer,
  e164,
  MAX_DELIVERY_FEE_CENTS,
  PREP_MINUTES,
  SCHEDULED_PICKUP_WINDOW_MINUTES,
  zipDeliverable,
} from "@/lib/delivery";
import { pickupTimes, quoteDelivery, uberConfigured } from "@/lib/uber";
import { business } from "@/lib/business";

// Live Uber delivery price + ETA for an address, shown on the order page before
// paying. Checkout asks Uber again at payment time (quotes only last 15 minutes).
export async function POST(req: Request) {
  if (!deliveryAllowedOnServer() || !uberConfigured()) {
    return new Response("Delivery isn't available yet", { status: 404 });
  }
  let body: { address?: unknown; phone?: string; pickupAt?: string; foodCents?: number };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request body", { status: 400 });
  }
  const address = cleanAddress(body.address as never);
  if (!address) return new Response("Please enter your street address, city and 5-digit ZIP", { status: 400 });
  if (!zipDeliverable(address.zip)) {
    return new Response(`We deliver to ${DELIVERY_AREA_LABEL} for now. Pickup is always open!`, { status: 422 });
  }

  // The phone isn't required to price it; FTO's line stands in until checkout.
  const phone = (body.phone && e164(body.phone)) || e164(business.phone)!;
  let readyAt = new Date(Date.now() + PREP_MINUTES * 60_000);
  let scheduled = false;
  if (body.pickupAt) {
    const d = new Date(body.pickupAt);
    if (!isNaN(d.getTime()) && d.getTime() > Date.now() + 30 * 60_000) {
      readyAt = d;
      scheduled = true;
    }
  }
  const valueCents = Math.max(0, Math.min(100_000, Math.round(Number(body.foodCents) || 0)));

  try {
    const r = await quoteDelivery({
      dropoff: address,
      dropoffPhone: phone,
      valueCents,
      times: pickupTimes(readyAt, scheduled, SCHEDULED_PICKUP_WINDOW_MINUTES),
    });
    if (!r.ok) {
      console.warn("[delivery quote] Uber said no:", r.message);
      return new Response("Sorry, we can't deliver to that address right now. Pickup is always open!", { status: 422 });
    }
    if (r.quote.feeCents > MAX_DELIVERY_FEE_CENTS) {
      return new Response("That address is a little far for us to deliver hot BBQ. Pickup is always open!", { status: 422 });
    }
    return Response.json({ feeCents: r.quote.feeCents, dropoffEta: r.quote.dropoffEta });
  } catch (e) {
    console.error("[delivery quote] failed", e);
    return new Response("Couldn't get a delivery price — please try again", { status: 502 });
  }
}
