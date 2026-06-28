import { randomUUID } from "node:crypto";
import { square, LOCATION_ID } from "@/lib/square";
import { getMenuItem } from "@/lib/menu";

// Browser sends only item IDs + quantities; the server looks up prices itself,
// so a tampered request can never change what gets charged.
type CartLine = { id: number; quantity: number };
type Body = {
  sourceId: string;
  items: CartLine[];
  channel: "DINE_IN" | "TAKE_OUT";
  table?: string;
  name: string;
  phone: string;
};

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

  // Build line items from SERVER-SIDE prices.
  const lineItems = [];
  for (const line of body.items) {
    const item = getMenuItem(Number(line.id));
    const qty = Math.floor(Number(line.quantity));
    if (!item || !Number.isFinite(qty) || qty < 1) {
      return new Response("Invalid item in cart", { status: 400 });
    }
    lineItems.push({
      name: item.title,
      quantity: String(qty),
      basePriceMoney: { amount: BigInt(Math.round(item.price * 100)), currency: "USD" as const },
    });
  }

  const note =
    body.channel === "DINE_IN"
      ? `DINE-IN · Table ${body.table?.trim() || "?"}`
      : "TAKE-OUT";

  try {
    // 1) Create the order with a PICKUP fulfillment (how it reaches the kitchen).
    //    Dine-in is modeled as a tagged pickup (Square has no DINE_IN fulfillment).
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
              recipient: { displayName: body.name.trim(), phoneNumber: body.phone.trim() },
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
    const amount = order?.totalMoney?.amount; // BigInt, server-computed
    if (!orderId || amount == null) {
      return new Response("Could not create the order", { status: 502 });
    }

    // 2) Charge the card for the SERVER total and apply it to the order.
    //    Order now has a fulfillment AND is paid → it appears live in the kitchen.
    await square.payments.create({
      idempotencyKey: randomUUID(),
      sourceId: body.sourceId,
      orderId,
      locationId: LOCATION_ID,
      amountMoney: { amount, currency: "USD" },
      autocomplete: true,
    });

    return Response.json({ ok: true, orderId });
  } catch (err: unknown) {
    const e = err as { errors?: { detail?: string }[]; message?: string };
    const detail = e?.errors?.[0]?.detail || e?.message || "Payment failed";
    console.error("Checkout error:", err);
    return new Response(detail, { status: 502 });
  }
}
