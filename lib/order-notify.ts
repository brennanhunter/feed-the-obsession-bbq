import { business } from "./business";
import type { OrderEmailLine } from "./order-email";

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
  totalCents: number;
  channel: "DINE_IN" | "TAKE_OUT";
  table?: string;
  pickup?: string;
}): { subject: string; html: string } {
  const { orderId, name, email, phone, items, totalCents, channel, table, pickup } = opts;
  const total = totalCents / 100;
  const fulfillment =
    channel === "DINE_IN" ? `Dine-in${table ? ` · Table ${esc(table)}` : ""}` : "Take-out";

  const when = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:4px 12px 4px 0">${esc(i.title)} &times;${i.qty}</td><td style="padding:4px 0;text-align:right">${money(i.price * i.qty)}</td></tr>`
    )
    .join("");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:520px">
    <h2 style="margin:0 0 4px">New online order — ${money(total)}</h2>
    <p style="margin:0 0 16px;color:#666;font-size:13px">${esc(when)} ET · ${fulfillment} · Pickup: ${esc(pickup || "ASAP")} · Order ${esc(orderId)}</p>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:12px">
      ${rows}
      <tr><td style="padding:10px 0 0;border-top:2px solid #111;font-weight:bold">Total</td>
          <td style="padding:10px 0 0;border-top:2px solid #111;font-weight:bold;text-align:right">${money(total)}</td></tr>
    </table>

    <p style="margin:0;font-size:14px;line-height:1.6">
      <strong>Customer:</strong> ${esc(name)}<br/>
      <strong>Phone:</strong> ${esc(phone)}<br/>
      <strong>Email:</strong> ${esc(email)}
    </p>
    <p style="margin:16px 0 0;color:#999;font-size:12px">${esc(business.name)} · automated order notification</p>
  </div>`;

  return { subject: `🧾 Order ${money(total)} — ${esc(name)} (${fulfillment})`, html };
}
