import { business } from "./business";

export type OrderEmailLine = { title: string; qty: number; price: number };

const money = (n: number) => `$${n.toFixed(2)}`;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const RED = "#c0392b";
const INK = "#161311";

export function orderConfirmationEmail(opts: {
  name: string;
  items: OrderEmailLine[];
  totalCents: number;
  channel: "DINE_IN" | "TAKE_OUT";
  table?: string;
}): { subject: string; html: string } {
  const { name, items, totalCents, channel, table } = opts;
  const fulfillment =
    channel === "DINE_IN" ? `Dine-in${table ? ` · Table ${esc(table)}` : ""}` : "Take-out (pickup)";

  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:${INK};font-size:15px">
          <strong>${esc(i.title)}</strong> ${i.qty > 1 ? `&times;${i.qty}` : ""}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:${INK};font-size:15px;text-align:right;white-space:nowrap">
          ${money(i.price * i.qty)}
        </td>
      </tr>`
    )
    .join("");

  const html = `
  <div style="background:#f4f1ec;padding:24px 0;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e6e1d8">
      <div style="background:${INK};padding:28px 24px;text-align:center">
        <div style="color:#fff;font-size:24px;font-weight:800;letter-spacing:1px">FEED THE OBSESSION <span style="color:${RED}">BBQ</span></div>
        <div style="color:#c9c3ba;font-size:12px;letter-spacing:2px;margin-top:6px">VETERAN-OWNED · WOOD-SMOKED · DELAND, FL</div>
      </div>

      <div style="padding:28px 24px">
        <h1 style="margin:0 0 6px;color:${INK};font-size:22px">Order confirmed — thanks, ${esc(name)}! 🍖</h1>
        <p style="margin:0 0 20px;color:#5b544d;font-size:15px;line-height:1.5">
          We got your order and it's headed for the smoker. Here's what you ordered:
        </p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:8px">${rows}
          <tr>
            <td style="padding:14px 0 0;color:${INK};font-size:17px;font-weight:800">Total</td>
            <td style="padding:14px 0 0;color:${RED};font-size:17px;font-weight:800;text-align:right">${money(totalCents / 100)}</td>
          </tr>
        </table>

        <div style="background:#f7f4ee;border-radius:10px;padding:16px 18px;margin:22px 0">
          <p style="margin:0 0 4px;color:#8a8177;font-size:12px;letter-spacing:1px;text-transform:uppercase">Fulfillment</p>
          <p style="margin:0;color:${INK};font-size:16px;font-weight:700">${fulfillment}</p>
        </div>

        <p style="margin:0 0 4px;color:${INK};font-size:15px;line-height:1.6"><strong>Pickup:</strong> ${esc(business.address.full)}</p>
        <p style="margin:0 0 4px;color:${INK};font-size:15px;line-height:1.6"><strong>Hours:</strong> ${business.hoursDisplay}</p>
        <p style="margin:0 0 20px;color:${INK};font-size:15px;line-height:1.6"><strong>Questions?</strong> Call us at <a href="${business.phoneHref}" style="color:${RED};text-decoration:none">${business.phone}</a></p>

        <div style="text-align:center;margin-top:8px">
          <a href="${business.maps.directions}" style="display:inline-block;background:${RED};color:#fff;text-decoration:none;font-weight:700;padding:12px 26px;border-radius:999px;font-size:15px">Get Directions</a>
        </div>
      </div>

      <div style="background:#faf8f4;padding:18px 24px;text-align:center;border-top:1px solid #eee">
        <p style="margin:0;color:#8a8177;font-size:12px">
          Love it? <a href="${business.maps.review}" style="color:${RED};text-decoration:none">Leave us a Google review</a> · ${esc(business.name)}
        </p>
      </div>
    </div>
  </div>`;

  return { subject: `Your Feed The Obsession BBQ order is confirmed 🍖`, html };
}
