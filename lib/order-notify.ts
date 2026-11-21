import { business } from "./business";
import type { OrderEmailDelivery, OrderEmailLine } from "./order-email";

const money = (n: number) => `$${n.toFixed(2)}`;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Internal "you got an order" copy for tracking sales/profit — plain and
// scannable, with the total in the subject line.
export function orderNotifyEmail(opts: {
  orderId: string;
  name: string;
  email: string;
  phone: string;
  items: OrderEmailLine[];
  totalCents: number; // charged to the card (food + tax + tip)
  subtotalCents?: number; // food only (the number sales tracking cares about)
  taxCents?: number;
  tipCents?: number;
  channel: "DINE_IN" | "TAKE_OUT";
  table?: string;
  pickup?: string;
  instructions?: string;
  delivery?: OrderEmailDelivery;
}): { subject: string; html: string } {
  const { orderId, name, email, phone, items, totalCents, channel, table, pickup, instructions, delivery } = opts;
  const total = totalCents / 100;
  const tax = (opts.taxCents ?? 0) / 100;
  const tip = (opts.tipCents ?? 0) / 100;
  const dFee = (delivery?.feeCents ?? 0) / 100;
  const dService = (delivery?.serviceFeeCents ?? 0) / 100;
  const dTip = (delivery?.driverTipCents ?? 0) / 100;
  const food = opts.subtotalCents != null ? opts.subtotalCents / 100 : total - tax - tip - dFee - dService - dTip;
  const fulfillment = delivery
    ? "UBER DELIVERY"
    : channel === "DINE_IN"
      ? `Dine-in${table ? ` · Table ${esc(table)}` : ""}`
      : "Take-out";
  const line = (label: string, v: number) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#666">${label}</td><td style="padding:4px 0;text-align:right;color:#666">${money(v)}</td></tr>`;

  const when = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:4px 12px 4px 0">${esc(i.title)}${i.detail ? ` (${esc(i.detail)})` : ""} &times;${i.qty}</td><td style="padding:4px 0;text-align:right">${money(i.price * i.qty)}</td></tr>`
    )
    .join("");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:520px">
    <h2 style="margin:0 0 4px">New online order — ${money(total)}</h2>
    <p style="margin:0 0 16px;color:#666;font-size:13px">${esc(when)} ET · ${fulfillment} · Pickup: ${esc(pickup || "ASAP")} · Order ${esc(orderId)}</p>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:12px">
      ${rows}
      <tr><td style="padding:10px 0 0;border-top:2px solid #111;font-weight:bold">Food</td>
          <td style="padding:10px 0 0;border-top:2px solid #111;font-weight:bold;text-align:right">${money(food)}</td></tr>
      ${delivery ? line("Delivery (Uber, paid by Xtremery card)", dFee) + line("Service fee (10%, Xtremery)", dService) : ""}
      ${tax > 0 ? `<tr><td style="padding:4px 12px 4px 0;color:#666">Sales tax</td><td style="padding:4px 0;text-align:right;color:#666">${money(tax)}</td></tr>` : ""}
      ${delivery && dTip > 0 ? line("Driver tip (to Uber driver)", dTip) : ""}
      ${tip > 0 ? `<tr><td style="padding:4px 12px 4px 0;color:#666">Tip</td><td style="padding:4px 0;text-align:right;color:#666">${money(tip)}</td></tr>` : ""}
      ${tax > 0 || tip > 0 || delivery ? `<tr><td style="padding:6px 0 0;font-weight:bold">Charged</td><td style="padding:6px 0 0;font-weight:bold;text-align:right">${money(total)}</td></tr>` : ""}
    </table>

    ${
      delivery
        ? `<p style="margin:0 0 12px;padding:10px 12px;background:#eef6ff;border-left:4px solid #111;font-size:14px"><strong>Deliver to:</strong> ${esc(delivery.address)}${
            delivery.notes ? `<br/><strong>Driver note:</strong> ${esc(delivery.notes)}` : ""
          }${delivery.trackingUrl ? `<br/><a href="${esc(delivery.trackingUrl)}">Uber tracking</a>` : ""}<br/><span style="color:#666">Reimburse Xtremery: ${money(dFee + dTip + dService)} (delivery ${money(dFee)} + driver tip ${money(dTip)} + service fee ${money(dService)})</span></p>`
        : ""
    }
    ${instructions ? `<p style="margin:0 0 12px;padding:10px 12px;background:#fff7e6;border-left:4px solid #d4202a;font-size:14px"><strong>Kitchen note:</strong> ${esc(instructions)}</p>` : ""}
    <p style="margin:0;font-size:14px;line-height:1.6">
      <strong>Customer:</strong> ${esc(name)}<br/>
      <strong>Phone:</strong> ${esc(phone)}<br/>
      <strong>Email:</strong> ${esc(email)}
    </p>
    <p style="margin:16px 0 0;color:#999;font-size:12px">${esc(business.name)} · automated order notification</p>
  </div>`;

  const tipNote = tip > 0 ? ` + ${money(tip)} tip` : "";
  return { subject: `🧾 Order ${money(food)}${tipNote} — ${esc(name)} (${fulfillment})`, html };
}
