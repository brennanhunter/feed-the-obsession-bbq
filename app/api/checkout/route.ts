import { randomUUID } from "node:crypto";
import { square, LOCATION_ID } from "@/lib/square";
import { checkPicks, describePicks, getMenuMap, picksPrice, type ChoicePick } from "@/lib/catalog";
import { isSpecialAvailable, specialLabel } from "@/lib/specials";
import { sendEmail } from "@/lib/mailer";
import { orderConfirmationEmail, type OrderEmailLine } from "@/lib/order-email";
import { orderNotifyEmail } from "@/lib/order-notify";
import { formatPickupLabel } from "@/lib/hours";
import { business } from "@/lib/business";
import { MAX_TIP_CENTS } from "@/lib/tips";

// Browser sends only Square catalog ids + quantities. The server validates each
// id against the live McSorleys menu and lets Square price the order from the
// catalog — so a tampered request can never change what gets charged.
type CartLine = { id: string; quantity: number; picks?: ChoicePick[] };
type Body = {
  sourceId: string;
  items: CartLine[];
  channel: "DINE_IN" | "TAKE_OUT";
  table?: string;
  name: string;
  phone: string;
  email: string;
  pickupAt?: string; // ISO; when set, this is a SCHEDULED pickup
  instructions?: string; // free-text note for the kitchen
  tipCents?: number; // optional tip, integer cents, charged on top of the order
};

const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response("Bad request body", { status: 400 });
  }

  if (!body.sourceId) return new Response("Missing payment token", { status: 400 });
  if (!Array.isArray(body.items) || body.items.length === 0)
    return new Response("Your cart is empty", { status: 400 });
  if (!body.name?.trim() || !body.phone?.trim())
    return new Response("Name and phone are required", { status: 400 });
  if (!body.email?.trim() || !emailOk(body.email.trim()))
    return new Response("A valid email is required for your confirmation", { status: 400 });

  const email = body.email.trim();
  const instructions = String(body.instructions ?? "").trim().slice(0, 300) || undefined;

  // Optional tip. Square takes it as tip_money on the payment, separate from the
  // order total (which must still equal what Square priced the food at).
  const tipCents = body.tipCents == null ? 0 : Number(body.tipCents);
  if (!Number.isInteger(tipCents) || tipCents < 0 || tipCents > MAX_TIP_CENTS) {
    return new Response(`Tip must be between $0 and $${MAX_TIP_CENTS / 100}`, { status: 400 });
  }

  // Scheduled pickup (required when ordering outside hours; optional otherwise).
  let scheduleType: "ASAP" | "SCHEDULED" = "ASAP";
  let pickupAt: string | undefined;
  if (body.pickupAt) {
    const d = new Date(body.pickupAt);
    const ms = d.getTime();
    if (isNaN(ms) || ms < Date.now() - 60_000 || ms > Date.now() + 8 * 86_400_000) {
      return new Response("Please choose a valid pickup time", { status: 400 });
    }
    scheduleType = "SCHEDULED";
    pickupAt = d.toISOString();
  }
  const pickupLabel = pickupAt ? formatPickupLabel(pickupAt) : "ASAP";
  const servedAt = pickupAt ? new Date(pickupAt) : new Date();

  // Validate every cart line against the live menu, then reference the catalog
  // object so Square applies the correct price and any configured tax. We also
  // capture titles/prices here to build the confirmation email.
  const menu = await getMenuMap();
  const lineItems = [];
  const emailLines: OrderEmailLine[] = [];
  for (const line of body.items) {
    const item = menu.get(String(line.id));
    const qty = Math.floor(Number(line.quantity));
    if (!item || !Number.isFinite(qty) || qty < 1) {
      return new Response("Invalid item in cart", { status: 400 });
    }
    // The owner's "Sold out" toggle in Square wins over whatever is in the cart.
    if (item.soldOut) {
      return new Response(`${item.title} is sold out right now — please remove it from your order`, {
        status: 400,
      });
    }
    // Smoke Schedule items only on their day (checked against the pickup day).
    if (item.special && !isSpecialAvailable(item.special, servedAt)) {
      return new Response(`${item.title} is ${specialLabel(item.special).toLowerCase()} — not available for that pickup time`, {
        status: 400,
      });
    }
    // Choices (meats, side, ...) are the item's Square modifier lists: checked
    // against Square's own min/max/doubles rules, then sent as modifiers so the
    // ticket reads exactly like a POS or DoorDash order.
    let picks: ChoicePick[] = [];
    if (item.choices?.length) {
      const checked = checkPicks(item, Array.isArray(line.picks) ? line.picks : []);
      if (!checked.ok) return new Response(checked.error, { status: 400 });
      picks = checked.picks;
    }
    const detail = describePicks(item.choices, picks) || undefined;
    lineItems.push({
      catalogObjectId: item.id,
      quantity: String(qty),
      ...(picks.length ? { modifiers: picks.map((p) => ({ catalogObjectId: p.id, quantity: String(p.qty) })) } : {}),
    });
    emailLines.push({
      title: item.title,
      qty,
      price: item.price + picksPrice(item.choices, picks),
      ...(detail ? { detail } : {}),
    });
  }

  const channelNote =
    body.channel === "DINE_IN"
      ? `DINE-IN · Table ${body.table?.trim() || "?"}`
      : "TAKE-OUT";
  const note = `${channelNote} · Pickup: ${pickupLabel}${instructions ? ` · Note: ${instructions}` : ""}`.slice(0, 500);

  try {
    // 1) Create the order with a PICKUP fulfillment (how it reaches the kitchen).
    const orderRes = await square.orders.create({
      idempotencyKey: randomUUID(),
      order: {
        locationId: LOCATION_ID,
        lineItems,
        fulfillments: [
          {
            type: "PICKUP",
            state: "PROPOSED",
            pickupDetails: {
              recipient: {
                displayName: body.name.trim(),
                phoneNumber: body.phone.trim(),
                emailAddress: email,
              },
              scheduleType,
              ...(pickupAt ? { pickupAt } : {}),
              note,
            },
          },
        ],
        metadata: {
          channel: body.channel,
          ...(body.table?.trim() ? { table: body.table.trim() } : {}),
        },
      },
    });

    const order = orderRes.order;
    const orderId = order?.id;
    const amount = order?.totalMoney?.amount; // BigInt, server-computed by Square
    if (!orderId || amount == null) {
      return new Response("Could not create the order", { status: 502 });
    }
    const foodCents = Number(amount);
    const taxCents = Number(order?.totalTaxMoney?.amount ?? 0); // 0 today; shown if ever enabled
    const chargedCents = foodCents + tipCents;

    // 2) Charge the card for Square's computed total (plus any tip) and apply it to the order.
    await square.payments.create({
      idempotencyKey: randomUUID(),
      sourceId: body.sourceId,
      orderId,
      locationId: LOCATION_ID,
      amountMoney: { amount, currency: "USD" },
      ...(tipCents > 0 ? { tipMoney: { amount: BigInt(tipCents), currency: "USD" } } : {}),
      buyerEmailAddress: email, // Square records it (and can send its own receipt)
      autocomplete: true,
    });

    // 3) Send our branded confirmation. Never fail the order if the email hiccups.
    const { subject, html } = orderConfirmationEmail({
      name: body.name.trim(),
      items: emailLines,
      totalCents: chargedCents,
      subtotalCents: foodCents - taxCents,
      taxCents,
      tipCents,
      channel: body.channel,
      table: body.table?.trim(),
      pickup: pickupLabel,
      instructions,
    });
    await sendEmail({ to: email, subject, html, replyTo: business.email });

    // Internal copy for sales/profit tracking.
    const notifyTo = (process.env.ORDER_NOTIFY_TO ?? "hunter@xtremery.com")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const notify = orderNotifyEmail({
      orderId,
      name: body.name.trim(),
      email,
      phone: body.phone.trim(),
      items: emailLines,
      totalCents: chargedCents,
      subtotalCents: foodCents - taxCents,
      taxCents,
      tipCents,
      channel: body.channel,
      table: body.table?.trim(),
      pickup: pickupLabel,
      instructions,
    });
    await sendEmail({ to: notifyTo, subject: notify.subject, html: notify.html, replyTo: email });

    return Response.json({ ok: true, orderId });
  } catch (err: unknown) {
    const e = err as { errors?: { detail?: string }[]; message?: string };
    const detail = e?.errors?.[0]?.detail || e?.message || "Payment failed";
    console.error("Checkout error:", err);
    return new Response(detail, { status: 502 });
  }
}
