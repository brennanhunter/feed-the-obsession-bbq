# Live Online Ordering with Square — Dine-In & Take-Out

A full walkthrough for adding **live order taking** to the Feed The Obsession BBQ site
(Next.js 16 App Router / React 19 / TypeScript / Tailwind 4) so customers can order
for **take-out** or **dine-in**, pay by card, and have orders land in the kitchen in real time.

> **Where the project is today:** the menu is hard-coded in
> `app/components/MenuWrapper.tsx` and the round red "add to cart" buttons are purely
> decorative — there is no cart, no checkout, and no backend. This guide takes you from
> that starting point all the way to taking real money and feeding live tickets to the
> kitchen.

---

## Table of contents

1. [Pick your path (read this first)](#1-pick-your-path-read-this-first)
2. [How "dine-in" vs "take-out" actually works in Square](#2-how-dine-in-vs-take-out-actually-works-in-square)
3. [One-time Square account & developer setup](#3-one-time-square-account--developer-setup)
4. [Path A — Square Online (no-code, fastest to live)](#4-path-a--square-online-no-code-fastest-to-live)
5. [Path B — Hosted Checkout / Payment Links (custom cart, Square-hosted payment)](#5-path-b--hosted-checkout--payment-links-custom-cart-square-hosted-payment)
6. [Path C — Fully custom in the Next.js app](#6-path-c--fully-custom-in-the-nextjs-app)
7. [The kitchen side — how staff actually "take" live orders](#7-the-kitchen-side--how-staff-actually-take-live-orders)
8. [Webhooks (keep your site in sync)](#8-webhooks-keep-your-site-in-sync)
9. [Testing in the Square Sandbox](#9-testing-in-the-square-sandbox)
10. [Go-live checklist](#10-go-live-checklist)
11. [Costs & fees](#11-costs--fees)

---

## 1. Pick your path (read this first)

There are three legitimate ways to take Square orders. **Decide before you write code** —
they have very different effort, control, and compliance trade-offs.

| | **A. Square Online** | **B. Hosted Checkout** | **C. Fully custom** |
|---|---|---|---|
| Where customer orders | Square-hosted page (can embed/link from this site) | Your cart on this site → redirect to Square page to pay | 100% on this site |
| Dev effort | Almost none (point-and-click) | Low–medium | Medium–high |
| Native **dine-in (QR table) ordering** | ✅ Built in | ⚠️ DIY (tag as pickup) | ⚠️ DIY (tag as pickup) |
| Take-out / pickup | ✅ | ✅ | ✅ |
| Card data touches your servers | Never | Never | Never (tokenized in browser) |
| PCI burden | Lowest (Square's problem) | Low (SAQ A) | Higher (SAQ A-EP) |
| Menu/taxes/modifiers managed in | Square Dashboard | Square Catalog or ad-hoc | Square Catalog or ad-hoc |
| Best when | You want to be live **this week** | You want your branding on the menu but Square to own payment | You want the whole flow on-brand and in-app |

### Recommendation for this business

- **Want live ordering fastest, with real dine-in QR-code table ordering, zero PCI headache?**
  → **Path A (Square Online).** For a small BBQ shop this is genuinely the right call to
  start. You can still drive customers to it from a nice "Order Now" button on this site.
- **Want the cart and menu to live on this custom site, but not own a card form?**
  → **Path B (Hosted Checkout).** Best balance of branding + simplicity.
- **Want the entire experience (menu → cart → pay) inside this Next.js app, wired to the
  existing `MenuWrapper`?**
  → **Path C (Fully custom).** Most polish, most work. Full build below.

You can also **start with A to go live, then graduate to B or C** later — the Square
account, locations, and menu you set up are reused by all three.

---

## 2. How "dine-in" vs "take-out" actually works in Square

This is the single most important thing to understand before building.

The **Square Orders API supports exactly three fulfillment types: `PICKUP`, `SHIPMENT`,
and `DELIVERY`.** There is **no `DINE_IN` fulfillment type.**

So:

- **Take-out** = a `PICKUP` fulfillment. Easy.
- **Dine-in** = *also* modeled as a `PICKUP` fulfillment, but **tagged** so the kitchen
  knows it's eat-in and which table. You tag it two ways:
  1. A human-readable **fulfillment note** the kitchen sees on the ticket
     (e.g. `"DINE-IN · Table 5"` vs `"TAKE-OUT"`).
  2. Structured **order `metadata`** (string→string map) for your own reporting,
     e.g. `{ channel: "DINE_IN", table: "5" }`.

> **Exception:** Square's *no-code* product (**Square Online**, Path A) has a true,
> first-class **dine-in / self-serve QR ordering** feature. If native dine-in is important
> and you don't want to fake it with tagged pickups, that alone is a strong reason to use
> Path A.

**Visibility rule (applies to all custom paths):** an order only appears for the kitchen
(in Order Manager / POS / KDS) once it **has a fulfillment AND is paid**. So the flow is
always: build order → attach a `PICKUP` fulfillment → take payment → it appears live.

---

## 3. One-time Square account & developer setup

Do this once; it's shared by every path.

1. **Create / log into Square** at <https://squareup.com> and finish business setup
   (legal name, bank account for payouts, etc.). Payouts require business verification —
   start this early, it can take a day or two.
2. **Create a developer application** at <https://developer.squareup.com/apps> →
   **+** → name it `FTOBBQ Online Ordering`.
3. From the app's **Credentials** page, grab both environments:
   - **Sandbox**: Application ID, Access Token, and a **Sandbox test Location ID**
     (Sandbox → *Locations*).
   - **Production**: Application ID, Access Token, and your real **Location ID**.
4. Note your **Location ID** — every order/payment is tied to a location. Find production
   location IDs in **Dashboard → Account & Settings → Business → Locations**, or via the
   API (`client.locations.list()`).
5. (For webhooks, Section 8) create a **Webhook Subscription** and copy its
   **Signature Key**.
6. (For Apple Pay / Google Pay in Path C) you'll later **register your domain** in the
   Developer Dashboard.

### Environment variables

Create `.env.local` (never commit it — `.gitignore` already ignores `.env*`):

```bash
# --- Server only (NEVER prefix these with NEXT_PUBLIC_) ---
SQUARE_ACCESS_TOKEN=EAAA...            # sandbox token while developing
SQUARE_ENVIRONMENT=sandbox             # "sandbox" | "production"
SQUARE_LOCATION_ID=L...                # sandbox location while developing
SQUARE_WEBHOOK_SIGNATURE_KEY=...       # from the webhook subscription (Section 8)

# --- Safe to expose to the browser (Web Payments SDK needs these) ---
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sandbox-sq0idb-...
NEXT_PUBLIC_SQUARE_LOCATION_ID=L...
```

> ⚠️ The **Access Token is a secret** — it can move money. Keep it server-side only.
> The **Application ID** and **Location ID** are public and used by the browser SDK.

---

## 4. Path A — Square Online (no-code, fastest to live)

Use this to be taking real orders, including **dine-in QR ordering**, with no backend code.

1. **Dashboard → Online → Get Started** to create a free **Square Online** site.
2. **Build the menu**: add Items (Brisket Plate $20, Ribs Plate $20, Pulled Pork $15,
   sides $4–$5, etc. — mirror `MenuWrapper.tsx`), with categories, photos, modifiers
   ("choose 2 sides"), and sold-out toggles.
3. **Enable fulfillment methods** under **Online → Fulfillment / Settings**:
   - **Pickup** (take-out): set prep time, pickup hours, and an optional pickup window.
   - **Dine-in / Self-serve ordering**: enable it, then **generate QR codes per table**.
     Customers scan, order, and pay from their phone; the order drops straight into your
     POS/KDS tagged with the table.
4. **Connect orders to the kitchen**: orders flow automatically into the **Square POS app**,
   **Dashboard → Orders (Order Manager)**, and **Square KDS** (see Section 7).
5. **Surface it on this site.** Two options:
   - **Link out (simplest):** point the "Order Now" / menu buttons at your Square Online
     ordering URL. In `MenuWrapper.tsx`, change the decorative cart button to an anchor:
     ```tsx
     <a
       href="https://your-site.square.site/order"
       target="_blank"
       rel="noopener noreferrer"
       className="px-6 py-2 rounded-3xl bg-red-600 hover:opacity-80 transition-all"
     >
       Order Online
     </a>
     ```
   - **Embed:** Square provides an "Order Online" embed/button snippet you can drop into a
     section/iframe.
6. **Done.** You're live. Taxes, receipts, refunds, and order management are all handled by
   Square.

**When to outgrow this:** when you want the menu and cart fully on-brand inside the Next.js
app → move to Path B or C below. Your Square account, items, and locations carry over.

---

## 5. Path B — Hosted Checkout / Payment Links (custom cart, Square-hosted payment)

Build the cart on this site, but hand off the **payment page** to Square (PCI burden stays
low, no card form to build). After the customer checks out, you create a Square
**Payment Link** tied to an **order** and redirect to it.

### 5.1 Install the SDK

```bash
npm i square
```

### 5.2 Server client — `lib/square.ts`

```ts
import { SquareClient, SquareEnvironment } from "square";

export const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment:
    process.env.SQUARE_ENVIRONMENT === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

export const LOCATION_ID = process.env.SQUARE_LOCATION_ID!;
```

### 5.3 Create-checkout route — `app/api/checkout/route.ts`

```ts
import { randomUUID } from "node:crypto";
import { square, LOCATION_ID } from "@/lib/square";

type CartLine = { name: string; quantity: number; cents: number };
type Body = {
  items: CartLine[];
  channel: "DINE_IN" | "TAKE_OUT";
  table?: string;
  name: string;
  phone: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  const note =
    body.channel === "DINE_IN"
      ? `DINE-IN · Table ${body.table ?? "?"}`
      : "TAKE-OUT";

  const res = await square.checkout.paymentLinks.create({
    idempotencyKey: randomUUID(),
    order: {
      locationId: LOCATION_ID,
      lineItems: body.items.map((i) => ({
        name: i.name,
        quantity: String(i.quantity),
        basePriceMoney: { amount: BigInt(i.cents), currency: "USD" },
      })),
      // Pickup fulfillment = how it reaches the kitchen. Dine-in is a tagged pickup.
      fulfillments: [
        {
          type: "PICKUP",
          state: "PROPOSED",
          pickupDetails: {
            recipient: { displayName: body.name, phoneNumber: body.phone },
            scheduleType: "ASAP",
            note,
          },
        },
      ],
      metadata: {
        channel: body.channel,
        ...(body.table ? { table: body.table } : {}),
      },
    },
    checkoutOptions: {
      redirectUrl: "https://feedtheobsessionbbq.com/order/thank-you",
      askForShippingAddress: false,
    },
  });

  // BigInt isn't JSON-serializable — only return the URL.
  return Response.json({ url: res.paymentLink?.url });
}
```

### 5.4 Client — POST the cart, then redirect

```ts
const r = await fetch("/api/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    items: cart.map((i) => ({ name: i.title, quantity: i.qty, cents: i.price * 100 })),
    channel,          // "DINE_IN" | "TAKE_OUT"
    table,            // when dine-in
    name, phone,
  }),
});
const { url } = await r.json();
window.location.href = url; // Square's hosted, PCI-handled checkout page
```

Square collects payment, emails the receipt, and pushes the paid order to your kitchen.
Use the webhook in Section 8 to confirm payment server-side before showing "order placed."

---

## 6. Path C — Fully custom in the Next.js app

Everything — menu, cart, **and the card form** — lives on this site. The card number is
tokenized **in the browser** by Square's Web Payments SDK and never touches your server;
you send only a one-time `token` to your backend.

### Flow

```
Browser                              Your Next.js server                 Square
───────                              ───────────────────                 ──────
add to cart (MenuWrapper)
choose Dine-in/Take-out
card.tokenize()  ──token──►  POST /api/checkout
                                     orders.create()        ───────────►  creates order
                                     payments.create(orderId, token) ──►  charges card,
                                                                          pays the order
                             ◄── { ok, orderId } ───
show "Order placed!"                                         order now LIVE in kitchen ▲
```

### 6.1 Install + server client

```bash
npm i square
```

`lib/square.ts` — same as [5.2](#52-server-client--libsquarets).

### 6.2 Cart state — `app/components/cart/CartContext.tsx`

```tsx
"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export type CartItem = { id: number; title: string; price: number; qty: number }; // price in dollars
type Ctx = {
  items: CartItem[];
  add: (i: Omit<CartItem, "qty">) => void;
  remove: (id: number) => void;
  clear: () => void;
  totalCents: number;
};

const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const add: Ctx["add"] = (i) =>
    setItems((prev) => {
      const found = prev.find((p) => p.id === i.id);
      return found
        ? prev.map((p) => (p.id === i.id ? { ...p, qty: p.qty + 1 } : p))
        : [...prev, { ...i, qty: 1 }];
    });

  const remove: Ctx["remove"] = (id) =>
    setItems((prev) => prev.filter((p) => p.id !== id));

  const clear = () => setItems([]);
  const totalCents = items.reduce((s, i) => s + i.price * 100 * i.qty, 0);

  return (
    <CartCtx.Provider value={{ items, add, remove, clear, totalCents }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used inside <CartProvider>");
  return c;
};
```

Wrap the app once in `app/layout.tsx`:

```tsx
import { CartProvider } from "./components/cart/CartContext";
// ...
<body>
  <CartProvider>{children}</CartProvider>
</body>
```

### 6.3 Wire the existing menu buttons

In `app/components/MenuWrapper.tsx`, the round red button currently does nothing. Make it
add to the cart:

```tsx
// top of file
import { useCart } from "./cart/CartContext";
// inside MenuWrapper():
const { add } = useCart();
// the existing button:
<button
  onClick={() => add({ id: item.id, title: item.title, price: item.price })}
  className="w-10 h-10 rounded-full bg-red-600 grid place-content-center hover:opacity-70 transition-all"
  aria-label={`Add ${item.title} to order`}
>
  {/* existing cart SVG */}
</button>
```

### 6.4 The Web Payments card form + dine-in/take-out — `app/components/cart/Checkout.tsx`

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useCart } from "./CartContext";

const APP_ID = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!;
const LOCATION_ID = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!;

declare global {
  interface Window { Square?: any }
}

export default function Checkout() {
  const { items, totalCents, clear } = useCart();
  const [channel, setChannel] = useState<"DINE_IN" | "TAKE_OUT">("TAKE_OUT");
  const [table, setTable] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "paying" | "done" | "error">("idle");
  const cardRef = useRef<any>(null);

  // Initialize the Square card form once the SDK script has loaded.
  async function initSquare() {
    if (!window.Square || cardRef.current) return;
    const payments = window.Square.payments(APP_ID, LOCATION_ID);
    const card = await payments.card();
    await card.attach("#card-container");
    cardRef.current = card;
  }

  async function pay() {
    if (!cardRef.current || items.length === 0) return;
    setStatus("paying");
    try {
      const result = await cardRef.current.tokenize(); // PAN tokenized in-browser
      if (result.status !== "OK") throw new Error("Card tokenization failed");

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: result.token,
          items: items.map((i) => ({ name: i.title, quantity: i.qty, cents: i.price * 100 })),
          channel,
          table: channel === "DINE_IN" ? table : undefined,
          name,
          phone,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      clear();
      setStatus("done");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }

  return (
    <div className="max-w-md mx-auto text-white">
      {/* Load prod script in production; sandbox while testing */}
      <Script
        src={
          process.env.NODE_ENV === "production"
            ? "https://web.squarecdn.com/v1/square.js"
            : "https://sandbox.web.squarecdn.com/v1/square.js"
        }
        onLoad={initSquare}
      />

      {/* Dine-in vs Take-out */}
      <div className="flex gap-3 mb-4">
        {(["TAKE_OUT", "DINE_IN"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setChannel(c)}
            className={`px-4 py-2 rounded-full ${channel === c ? "bg-red-600" : "border border-white/20"}`}
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
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)}
        className="w-full mb-3 p-2 rounded bg-black/40 border border-white/20" />
      <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)}
        className="w-full mb-3 p-2 rounded bg-black/40 border border-white/20" />

      {/* Square injects the secure card fields here */}
      <div id="card-container" className="mb-4" />

      <button
        onClick={pay}
        disabled={status === "paying" || items.length === 0}
        className="w-full py-3 rounded-full bg-red-600 font-bold disabled:opacity-50"
      >
        {status === "paying" ? "Processing…" : `Pay $${(totalCents / 100).toFixed(2)}`}
      </button>

      {status === "done" && <p className="mt-4 text-green-400">Order placed! 🍖</p>}
      {status === "error" && <p className="mt-4 text-red-400">Something went wrong — try again.</p>}
    </div>
  );
}
```

### 6.5 The order + payment route — `app/api/checkout/route.ts`

```ts
import { randomUUID } from "node:crypto";
import { square, LOCATION_ID } from "@/lib/square";

type CartLine = { name: string; quantity: number; cents: number };
type Body = {
  sourceId: string;
  items: CartLine[];
  channel: "DINE_IN" | "TAKE_OUT";
  table?: string;
  name: string;
  phone: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  if (!body.items?.length) return new Response("Empty cart", { status: 400 });

  const note =
    body.channel === "DINE_IN" ? `DINE-IN · Table ${body.table ?? "?"}` : "TAKE-OUT";

  // 1) Create the order (with a PICKUP fulfillment so it reaches the kitchen).
  const orderRes = await square.orders.create({
    idempotencyKey: randomUUID(),
    order: {
      locationId: LOCATION_ID,
      lineItems: body.items.map((i) => ({
        name: i.name,
        quantity: String(i.quantity),
        basePriceMoney: { amount: BigInt(i.cents), currency: "USD" },
      })),
      fulfillments: [
        {
          type: "PICKUP",
          state: "PROPOSED",
          pickupDetails: {
            recipient: { displayName: body.name, phoneNumber: body.phone },
            scheduleType: "ASAP",
            note,
          },
        },
      ],
      metadata: {
        channel: body.channel,
        ...(body.table ? { table: body.table } : {}),
      },
    },
  });

  const order = orderRes.order;
  const orderId = order?.id;
  const amount = order?.totalMoney?.amount; // BigInt, includes any taxes Square applied
  if (!orderId || amount == null) return new Response("Order failed", { status: 502 });

  // 2) Charge the card and apply the payment to the order (pays it in full).
  await square.payments.create({
    idempotencyKey: randomUUID(),
    sourceId: body.sourceId,     // one-time token from card.tokenize()
    orderId,                     // ties payment to the order
    locationId: LOCATION_ID,
    amountMoney: { amount, currency: "USD" },
    autocomplete: true,          // capture immediately
  });

  // Order now has a fulfillment AND is paid → it appears live in the kitchen.
  return Response.json({ ok: true, orderId });
}
```

> **Gotchas baked into the code above**
> - **Money is `BigInt` and in cents.** The menu stores dollars (`price: 20`), so multiply
>   by 100. `BigInt` can't be `JSON.stringify`-ed — never return the raw Square objects;
>   return plain fields (`orderId`, a number total, etc.).
> - **Trust the server total, not the client.** Charge `order.totalMoney.amount` returned by
>   `orders.create`, not a number the browser sent — otherwise a tampered request could
>   underpay. Better still, sync prices from Square Catalog (below) so the client can't pick
>   the price at all.
> - **Idempotency keys** (`randomUUID()`) prevent a retry/double-click from creating two
>   orders or double-charging.

### 6.6 (Recommended) Manage the menu in Square Catalog instead of hard-coding

Hard-coded prices in `MenuWrapper.tsx` drift from what the kitchen/Square think things cost,
and they don't carry **taxes or modifiers** ("choose 2 sides"). The robust version:

1. Create the items in **Square Dashboard → Items** (or via the **Catalog API**).
2. Fetch them server-side (`square.catalog.list()` / `searchCatalogItems`) and render the
   menu from that data.
3. In the order, reference **`catalogObjectId`** on each line item instead of an ad-hoc
   `name` + `basePriceMoney`. Square then applies the correct price, **tax**, and modifiers
   automatically, and item names match the kitchen ticket exactly.

This is optional for a first launch but is the right long-term setup.

---

## 7. The kitchen side — how staff actually "take" live orders

"Live order taking" is only half code — the staff need to *see and act on* tickets. Once an
order is **paid + has a fulfillment** (every path above does this), Square pushes it to:

- **Square Dashboard → Orders (Order Manager)** — web view of incoming orders with
  Accept / Mark Ready / Complete actions, prep times, and the pickup/dine-in note + table.
- **Square Point of Sale app** (phone/tablet) — the **Orders** tab buzzes on new orders;
  staff accept and fulfill from there. Good for a small counter setup.
- **Square KDS (Kitchen Display System)** — a dedicated kitchen screen (part of
  **Square for Restaurants**) that shows tickets, the **TAKE-OUT / DINE-IN · Table N** note,
  and bump-bar workflow. This is the best "live" experience for a busy line.
- **Ticket/receipt printers** — Square can auto-print kitchen tickets on a connected printer.

**Set this up before launch:**
1. Install the **Square POS app** on the shop's device and sign in.
2. Turn on **new-order notifications/sounds** so nothing is missed.
3. Decide the display: POS Orders tab is free; **KDS / Square for Restaurants** is a paid
   upgrade but far nicer for a kitchen with tickets flying.
4. Set **prep times and busy/pause-ordering** controls so the site can't take orders you
   can't cook (Square Online and Order Manager both expose this).

> Reality check: a custom site (Path C) is great for the *customer* experience, but you
> still rely on Square POS/Order Manager/KDS for the *kitchen* experience. You don't have to
> build a kitchen screen — Square already has one.

---

## 8. Webhooks (keep your site in sync)

Card payment can succeed or fail asynchronously, and orders change state as the kitchen
works them. Subscribe to webhooks so your site reflects reality (and to confirm payment
server-side rather than trusting the browser).

1. **Developer Dashboard → your app → Webhooks → Subscriptions → Add.**
2. URL: `https://feedtheobsessionbbq.com/api/square/webhook`. Copy the **Signature Key**
   into `SQUARE_WEBHOOK_SIGNATURE_KEY`.
3. Subscribe to events like `payment.updated`, `order.updated`, `order.fulfillment.updated`.

`app/api/square/webhook/route.ts`:

```ts
import { SquareClient } from "square";

export async function POST(req: Request) {
  const body = await req.text(); // raw body required for signature check
  const signature = req.headers.get("x-square-hmacsha256-signature") ?? "";
  const notificationUrl = "https://feedtheobsessionbbq.com/api/square/webhook";

  const valid = await SquareClient.verifyWebhookSignature?.({
    requestBody: body,
    signatureHeader: signature,
    signatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY!,
    notificationUrl,
  });
  // (Helper name can vary by SDK version — see square's WebhooksHelper /
  // verifySignature in the docs; the point is: verify before trusting the payload.)
  if (!valid) return new Response("bad signature", { status: 401 });

  const event = JSON.parse(body);
  switch (event.type) {
    case "payment.updated":
      // mark order paid, send confirmation text/email, etc.
      break;
    case "order.fulfillment.updated":
      // e.g. "your order is ready for pickup"
      break;
  }
  return new Response("ok");
}
```

> Always **verify the signature** before acting — otherwise anyone can POST fake "paid"
> events. Test webhooks with the Sandbox's event-send tool in the Developer Dashboard.

---

## 9. Testing in the Square Sandbox

Do **all** of this against Sandbox before touching production money.

- Keep `SQUARE_ENVIRONMENT=sandbox`, sandbox token, sandbox location, and the
  **sandbox** Web Payments script (`sandbox.web.squarecdn.com/v1/square.js`).
- **Test card** in the card form: `4111 1111 1111 1111`, any future expiry, any CVV,
  any ZIP. Square publishes more test values (declines, SCA challenges) in
  *Sandbox Payments* docs — test a decline path too.
- Place a **take-out** order and a **dine-in** order; confirm the note shows
  `TAKE-OUT` vs `DINE-IN · Table N` and the `metadata` is set.
- Open the **Sandbox Seller Dashboard** (linked from the Developer Dashboard) and confirm
  the order shows up in **Orders** as **paid**, with the correct line items and total.
- Trigger and verify a **webhook** event.
- Confirm the server **rejects a tampered total** (charges the server-computed amount).

---

## 10. Go-live checklist

- [ ] Business verification complete and **bank account / payouts** active in Square.
- [ ] Swap `.env.local` (and Vercel project env vars) to **production**: token,
      `SQUARE_ENVIRONMENT=production`, prod `SQUARE_LOCATION_ID`, prod
      `NEXT_PUBLIC_SQUARE_APPLICATION_ID`, prod `NEXT_PUBLIC_SQUARE_LOCATION_ID`.
- [ ] Web Payments script points to **`https://web.squarecdn.com/v1/square.js`** in prod.
- [ ] Site is served over **HTTPS** with a proper **Content Security Policy** — Square
      requires a Secure Context for the Web Payments SDK (enforced since **Oct 1, 2025**).
      Allow `*.squarecdn.com` / `*.square.com` in `script-src`/`connect-src`/`frame-src`.
- [ ] (If using Apple Pay / Google Pay) **register your production domain** in the
      Developer Dashboard and host the association file.
- [ ] **PCI**: Path A/B → SAQ A; Path C → SAQ A-EP (card form on your page). Confirm/attest
      via Square.
- [ ] Real **end-to-end test order** on production with a real card (then refund it).
- [ ] **Kitchen device** ready: Square POS app installed, signed in, sound on, KDS/printer
      configured, prep times + pause-ordering set.
- [ ] Webhook subscription switched to the **production** signature key + URL.
- [ ] Set Vercel env vars for **Production** (and Preview, if you want preview testing
      against sandbox): `vercel env add ...` or the dashboard.

---

## 11. Costs & fees

- **Square Online**, the Orders/Payments APIs, Order Manager, and the POS app are **free to
  use** — Square makes money on the **per-transaction processing fee** (commonly ~2.6% +
  ~$0.10 for online/keyed card-not-present; confirm current US rates on Square's pricing
  page).
- **Square KDS / Square for Restaurants** has a **paid plan** above the free tier — optional
  but recommended for a real kitchen line.
- No monthly fee is required to *start* taking online orders.

---

### Quick start, in one breath

> Go live this week with **Path A (Square Online)** — including real **dine-in QR ordering** —
> and link to it from an "Order Online" button on this site. When you want the cart and
> menu fully on-brand inside the Next.js app, build **Path C**: tokenize the card in the
> browser, create an **order + payment** server-side, model dine-in and take-out as
> **tagged `PICKUP` fulfillments**, and let **Square POS / Order Manager / KDS** be the
> kitchen's live order screen.
