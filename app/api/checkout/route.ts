import { randomUUID } from "node:crypto";
import { square, LOCATION_ID } from "@/lib/square";
import { getMenuMap } from "@/lib/catalog";
import { sendEmail } from "@/lib/mailer";
import { orderConfirmationEmail, type OrderEmailLine } from "@/lib/order-email";
import { orderNotifyEmail } from "@/lib/order-notify";
import { business } from "@/lib/business";

// Browser sends only Square catalog ids + quantities. The server validates each
// id against the live McSorleys menu and lets Square price the order from the
// catalog — so a tampered request can never change what gets charged.
type CartLine = { id: string; quantity: number };
type Body = {
  sourceId: string;
  items: CartLine[];
  channel: "DINE_IN" | "TAKE_OUT";
  table?: string;
  name: string;
  phone: string;
  email: string;
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
    lineItems.push({ catalogObjectId: item.id, quantity: String(qty) });
    emailLines.push({ title: item.title, qty, price: item.price });
  }

  const note =
    body.channel === "DINE_IN"
      ? `DINE-IN · Table ${body.table?.trim() || "?"}`
      : "TAKE-OUT";

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
              scheduleType: "ASAP",
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

    // 2) Charge the card for Square's computed total and apply it to the order.
    await square.payments.create({
      idempotencyKey: randomUUID(),
      sourceId: body.sourceId,
      orderId,
      locationId: LOCATION_ID,
      amountMoney: { amount, currency: "USD" },
      buyerEmailAddress: email, // Square records it (and can send its own receipt)
      autocomplete: true,
    });

    // 3) Send our branded confirmation. Never fail the order if the email hiccups.
    const { subject, html } = orderConfirmationEmail({
      name: body.name.trim(),
      items: emailLines,
      totalCents: Number(amount),
      channel: body.channel,
      table: body.table?.trim(),
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
      totalCents: Number(amount),
      channel: body.channel,
      table: body.table?.trim(),
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
