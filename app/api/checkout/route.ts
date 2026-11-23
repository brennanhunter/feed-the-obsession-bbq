import { randomUUID } from "node:crypto";
import { square, LOCATION_ID } from "@/lib/square";
import { checkPicks, describePicks, getMenuMap, picksPrice, type ChoicePick } from "@/lib/catalog";
import { isSpecialAvailable, specialLabel } from "@/lib/specials";
import { sendEmail } from "@/lib/mailer";
import { orderConfirmationEmail, type OrderEmailLine, type OrderEmailDelivery } from "@/lib/order-email";
import { orderNotifyEmail } from "@/lib/order-notify";
import { etDaysAhead, formatPickupLabel } from "@/lib/hours";
import { business } from "@/lib/business";
import { MAX_TIP_CENTS } from "@/lib/tips";
import {
  addressLine,
  cleanAddress,
  deliveryAllowedOnServer,
  DELIVERY_MIN_CENTS,
  DELIVERY_AREA_LABEL,
  e164,
  MAX_DELIVERY_FEE_CENTS,
  PREP_MINUTES,
  SCHEDULED_PICKUP_WINDOW_MINUTES,
  serviceFeeCents,
  xtremeryFeeCents,
  type DeliveryAddress,
  zipDeliverable,
} from "@/lib/delivery";
import { createDelivery, pickupTimes, quoteDelivery, uberConfigured } from "@/lib/uber";

// Browser sends only Square catalog ids + quantities. The server validates each
// id against the live McSorleys menu and lets Square price the order from the
// catalog — so a tampered request can never change what gets charged.
type CartLine = { id: string; quantity: number; picks?: ChoicePick[]; note?: string };
type Body = {
  sourceId: string;
  items: CartLine[];
  channel: "DINE_IN" | "TAKE_OUT";
  table?: string;
  name: string;
  phone: string;
  email: string;
  pickupAt?: string; // ISO; when set, this is a SCHEDULED pickup (or scheduled delivery)
  instructions?: string; // free-text note for the kitchen
  tipCents?: number; // pickup: tip for the crew (Square tip). Delivery: tip for the driver (passed to Uber).
  fulfillment?: "PICKUP" | "DELIVERY";
  delivery?: Partial<DeliveryAddress> & { expectedFeeCents?: number };
};

const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
const usd = (cents: number) => ({ amount: BigInt(cents), currency: "USD" as const });

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
  const name = body.name.trim();
  const instructions = String(body.instructions ?? "").trim().slice(0, 300) || undefined;
  const isDelivery = body.fulfillment === "DELIVERY";

  // Optional tip. Pickup: Square takes it as tip_money on the payment (for the
  // crew). Delivery: it's the driver's — a line on the order, handed to Uber.
  const tipCents = body.tipCents == null ? 0 : Number(body.tipCents);
  if (!Number.isInteger(tipCents) || tipCents < 0 || tipCents > MAX_TIP_CENTS) {
    return new Response(`Tip must be between $0 and $${MAX_TIP_CENTS / 100}`, { status: 400 });
  }

  // Delivery basics before touching the menu or Square.
  let dropoff: DeliveryAddress | null = null;
  let dropoffPhone: string | null = null;
  if (isDelivery) {
    if (!deliveryAllowedOnServer() || !uberConfigured()) {
      return new Response("Delivery isn't available yet — please choose pickup", { status: 400 });
    }
    dropoff = cleanAddress(body.delivery);
    if (!dropoff) return new Response("Please enter your delivery address (street, city and 5-digit ZIP)", { status: 400 });
    if (!zipDeliverable(dropoff.zip)) {
      return new Response(`We deliver to ${DELIVERY_AREA_LABEL} for now — please choose pickup`, { status: 400 });
    }
    dropoffPhone = e164(body.phone);
    if (!dropoffPhone) return new Response("Please enter a 10-digit phone number so the driver can reach you", { status: 400 });
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
    // Whole cuts are smoked to order: pickup at least N days out (shop's calendar).
    if (item.leadDays) {
      if (!pickupAt || etDaysAhead(new Date(pickupAt)) < item.leadDays) {
        return new Response(
          `The ${item.title} needs ${item.leadDays} days' notice — please choose a pickup time ${item.leadDays} or more days out`,
          { status: 400 }
        );
      }
    }
    // A special request for this item ("extra crispy", "cut in half") rides on
    // the Square line item as its note, so it prints with that item.
    const itemNote = String(line.note ?? "").replace(/\s+/g, " ").trim().slice(0, 140);
    const detail = [describePicks(item.choices, picks), itemNote ? `Request: ${itemNote}` : ""].filter(Boolean).join(" · ") || undefined;
    lineItems.push({
      catalogObjectId: item.id,
      quantity: String(qty),
      ...(picks.length ? { modifiers: picks.map((p) => ({ catalogObjectId: p.id, quantity: String(p.qty) })) } : {}),
      ...(itemNote ? { note: itemNote } : {}),
    });
    emailLines.push({
      title: item.title,
      qty,
      price: item.price + picksPrice(item.choices, picks),
      ...(detail ? { detail } : {}),
    });
  }
  // Food subtotal from the same catalog prices Square uses (pre-tax).
  const foodCentsCalc = emailLines.reduce((s, l) => s + Math.round(l.price * 100) * l.qty, 0);

  // Delivery: minimum, fresh Uber price, and the fee lines on the order.
  let deliveryFee = 0;
  let serviceFee = 0;
  let uberQuoteId = "";
  let uberTimes: ReturnType<typeof pickupTimes> | null = null;
  if (isDelivery && dropoff && dropoffPhone) {
    if (foodCentsCalc < DELIVERY_MIN_CENTS) {
      return new Response(`Delivery starts at $${DELIVERY_MIN_CENTS / 100} in food — add a little more, or choose pickup`, {
        status: 400,
      });
    }
    const scheduled = Boolean(pickupAt) && new Date(pickupAt!).getTime() > Date.now() + 30 * 60_000;
    const readyAt = scheduled ? new Date(pickupAt!) : new Date(Date.now() + PREP_MINUTES * 60_000);
    uberTimes = pickupTimes(readyAt, scheduled, SCHEDULED_PICKUP_WINDOW_MINUTES);
    const q = await quoteDelivery({ dropoff, dropoffPhone, valueCents: foodCentsCalc, times: uberTimes });
    if (!q.ok) {
      console.warn("[checkout] Uber quote refused:", q.message);
      return new Response("Sorry, we can't deliver to that address right now — please choose pickup", { status: 422 });
    }
    if (q.quote.feeCents > MAX_DELIVERY_FEE_CENTS) {
      return new Response("That address is a little far for us to deliver hot BBQ — please choose pickup", { status: 422 });
    }
    // The price the customer saw may be a few minutes old; don't surprise them.
    const expected = Number(body.delivery?.expectedFeeCents);
    if (Number.isFinite(expected) && q.quote.feeCents > expected + 50) {
      return new Response(
        `The delivery price just changed to $${(q.quote.feeCents / 100).toFixed(2)}. Please check the new total and tap Pay again.`,
        { status: 409 }
      );
    }
    deliveryFee = q.quote.feeCents;
    serviceFee = serviceFeeCents(foodCentsCalc);
    uberQuoteId = q.quote.id;
  }

  const channelNote = isDelivery
    ? "UBER DELIVERY · hand to the Uber driver"
    : body.channel === "DINE_IN"
      ? `DINE-IN · bring out to ${name}`
      : "TAKE-OUT";
  const whenNote = isDelivery ? `Driver pickup: ${pickupLabel === "ASAP" ? `~${PREP_MINUTES} min` : pickupLabel}` : `Pickup: ${pickupLabel}`;
  const note = `${channelNote} · ${whenNote}${instructions ? ` · Note: ${instructions}` : ""}`.slice(0, 500);

  try {
    // 1) Create the order with a PICKUP fulfillment (how it reaches the kitchen).
    //    Delivery orders are pickups too — by the Uber driver — so the register
    //    and printer handle them exactly like every other online order.
    const orderRes = await square.orders.create({
      idempotencyKey: randomUUID(),
      order: {
        locationId: LOCATION_ID,
        lineItems,
        ...(isDelivery
          ? {
              serviceCharges: [
                { name: "Delivery (Uber)", amountMoney: usd(deliveryFee), calculationPhase: "TOTAL_PHASE" as const, taxable: false },
                { name: "Service fee", amountMoney: usd(serviceFee), calculationPhase: "TOTAL_PHASE" as const, taxable: false },
                ...(tipCents > 0
                  ? [{ name: "Driver tip (100% to driver)", amountMoney: usd(tipCents), calculationPhase: "TOTAL_PHASE" as const, taxable: false }]
                  : []),
              ],
            }
          : {}),
        fulfillments: [
          {
            type: "PICKUP",
            state: "PROPOSED",
            pickupDetails: {
              recipient: {
                displayName: isDelivery ? `UBER: ${name}` : name,
                phoneNumber: body.phone.trim(),
                emailAddress: email,
              },
              scheduleType,
              ...(pickupAt ? { pickupAt } : {}),
              note,
            },
          },
        ],
        // Apply the catalog's sales tax (Florida 6%, set on every menu item in
        // Square) the same way the POS does; the API skips it unless asked.
        pricingOptions: { autoApplyTaxes: true },
        metadata: {
          channel: isDelivery ? "DELIVERY" : body.channel,
          ...(body.table?.trim() && !isDelivery ? { table: body.table.trim() } : {}),
          ...(isDelivery && dropoff ? { deliver_to: addressLine(dropoff).slice(0, 255) } : {}),
        },
      },
    });

    const order = orderRes.order;
    const orderId = order?.id;
    const amount = order?.totalMoney?.amount; // BigInt, server-computed by Square (includes delivery lines)
    if (!orderId || amount == null) {
      return new Response("Could not create the order", { status: 502 });
    }
    const orderTotal = Number(amount);
    const taxCents = Number(order?.totalTaxMoney?.amount ?? 0); // Florida sales tax, applied by Square
    const serviceChargeCents = Number(order?.totalServiceChargeMoney?.amount ?? 0);
    const foodCents = orderTotal - taxCents - serviceChargeCents; // food only
    const squareTip = isDelivery ? 0 : tipCents;
    const chargedCents = orderTotal + squareTip;

    // 2) Charge the card for Square's computed total (plus any crew tip) and apply it to the order.
    const payRes = await square.payments.create({
      idempotencyKey: randomUUID(),
      sourceId: body.sourceId,
      orderId,
      locationId: LOCATION_ID,
      amountMoney: { amount, currency: "USD" },
      ...(squareTip > 0 ? { tipMoney: usd(squareTip) } : {}),
      buyerEmailAddress: email, // Square records it (and can send its own receipt)
      autocomplete: true,
    });

    // 3) Delivery: book the Uber driver now that the card went through.
    let delivery: OrderEmailDelivery | undefined;
    if (isDelivery && dropoff && dropoffPhone && uberTimes) {
      const shortRef = `#${orderId.slice(-5).toUpperCase()}`;
      const booked = await createDelivery({
        quoteId: uberQuoteId,
        orderId,
        shortRef,
        customerName: name,
        dropoff,
        dropoffPhone,
        items: emailLines.map((l) => ({ name: l.title, quantity: l.qty, priceCents: Math.round(l.price * 100) })),
        valueCents: foodCents,
        tipCents,
        times: uberTimes,
      }).catch((e: unknown) => ({ ok: false as const, message: e instanceof Error ? e.message : String(e) }));

      if (!booked.ok) {
        // No driver = no delivery. Give the money back and warn the kitchen
        // before anyone starts cooking.
        console.error("[checkout] Uber booking failed after payment:", booked.message);
        const paymentId = payRes.payment?.id;
        let refunded = false;
        if (paymentId) {
          try {
            await square.refunds.refundPayment({
              idempotencyKey: randomUUID(),
              paymentId,
              amountMoney: { amount, currency: "USD" },
              reason: "Delivery driver could not be booked",
            });
            refunded = true;
          } catch (e) {
            console.error("[checkout] refund after failed delivery booking failed", e);
          }
        }
        // Mark the ticket canceled so the register/order manager shows it's not one to cook.
        try {
          const latest = (await square.orders.get({ orderId })).order;
          const uid = latest?.fulfillments?.[0]?.uid;
          if (latest?.version != null && uid) {
            await square.orders.update({
              orderId,
              idempotencyKey: randomUUID(),
              order: { locationId: LOCATION_ID, version: latest.version, fulfillments: [{ uid, state: "CANCELED" }] },
            });
          }
        } catch (e) {
          console.error("[checkout] couldn't cancel the ticket after failed delivery booking", e);
        }
        // Who must hear "don't cook" right away: Xtremery + the owner (ORDER_ALERT_TO).
        const alertTo = (process.env.ORDER_ALERT_TO ?? process.env.ORDER_NOTIFY_TO ?? "hunter@xtremery.com")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        await sendEmail({
          to: alertTo,
          subject: `⚠️ DON'T COOK — delivery for ${name} couldn't be booked${refunded ? " (refunded)" : " (REFUND FAILED)"}`,
          html: `<p>Order ${orderId} (${shortRef}) was paid, but Uber wouldn't book a driver: ${booked.message}</p><p>${
            refunded ? "The customer was refunded automatically." : "<strong>The automatic refund failed — refund it in Square.</strong>"
          } Customer: ${name}, ${body.phone.trim()}, ${email}. Address: ${addressLine(dropoff)}.</p>`,
          replyTo: email,
        });
        return new Response(
          refunded
            ? "We couldn't book a delivery driver just now, so we refunded your card. Please try pickup, or call us."
            : `We couldn't book a delivery driver. Please call us at ${business.phone} and we'll make it right.`,
          { status: 502 }
        );
      }

      delivery = {
        address: addressLine(dropoff),
        notes: dropoff.notes,
        trackingUrl: booked.delivery.trackingUrl,
        feeCents: deliveryFee,
        serviceFeeCents: serviceFee,
        xtremeryCents: xtremeryFeeCents(foodCentsCalc),
        driverTipCents: tipCents,
      };
    }

    // 4) Send our branded confirmation. Never fail the order if the email hiccups.
    const { subject, html } = orderConfirmationEmail({
      name,
      items: emailLines,
      totalCents: chargedCents,
      subtotalCents: foodCents,
      taxCents,
      tipCents: squareTip,
      channel: body.channel,
      table: body.table?.trim(),
      pickup: pickupLabel,
      instructions,
      delivery,
    });
    await sendEmail({ to: email, subject, html, replyTo: business.email });

    // Internal copy for sales/profit tracking.
    const notifyTo = (process.env.ORDER_NOTIFY_TO ?? "hunter@xtremery.com")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const notify = orderNotifyEmail({
      orderId,
      name,
      email,
      phone: body.phone.trim(),
      items: emailLines,
      totalCents: chargedCents,
      subtotalCents: foodCents,
      taxCents,
      tipCents: squareTip,
      channel: body.channel,
      table: body.table?.trim(),
      pickup: pickupLabel,
      instructions,
      delivery,
    });
    await sendEmail({ to: notifyTo, subject: notify.subject, html: notify.html, replyTo: email });

    return Response.json({ ok: true, orderId, ...(delivery ? { trackingUrl: delivery.trackingUrl } : {}) });
  } catch (err: unknown) {
    const e = err as { errors?: { detail?: string }[]; message?: string };
    const detail = e?.errors?.[0]?.detail || e?.message || "Payment failed";
    console.error("Checkout error:", err);
    return new Response(detail, { status: 502 });
  }
}
