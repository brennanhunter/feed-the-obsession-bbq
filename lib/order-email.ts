import { business } from "./business";

export type OrderEmailLine = { title: string; qty: number; price: number };

const money = (n: number) => `$${n.toFixed(2)}`;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Branded-menu palette (black / cream / FTO red).
const BLACK = "#0d0d0d";
const CREAM = "#f5efe1";
const RED = "#d4202a";
const INK = "#1c1917";
const HEAVY = "'Arial Black', 'Arial Narrow Bold', Impact, Helvetica, sans-serif";

export function orderConfirmationEmail(opts: {
  name: string;
  items: OrderEmailLine[];
  totalCents: number;
  channel: "DINE_IN" | "TAKE_OUT";
  table?: string;
  pickup?: string; // "ASAP" or a scheduled-time label
}): { subject: string; html: string } {
  const { name, items, totalCents, channel, table, pickup } = opts;
  const fulfillment =
    channel === "DINE_IN" ? `Dine-in${table ? ` · Table ${esc(table)}` : ""}` : "Take-out (pickup)";
  const logo = `${business.url}/logo-red.png`;

  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:9px 0;font-family:Arial,Helvetica,sans-serif;font-weight:bold;text-transform:uppercase;letter-spacing:.3px;color:${INK};font-size:15px;white-space:nowrap;vertical-align:bottom">
          ${esc(i.title)}${i.qty > 1 ? ` &times;${i.qty}` : ""}
        </td>
        <td style="padding:9px 8px;width:100%;vertical-align:bottom">
          <div style="border-bottom:2px dotted #c3b79c;height:11px"></div>
        </td>
        <td style="padding:9px 0;font-family:Arial,Helvetica,sans-serif;font-weight:bold;color:${RED};font-size:15px;white-space:nowrap;text-align:right;vertical-align:bottom">
          ${money(i.price * i.qty)}
        </td>
      </tr>`
    )
    .join("");

  const html = `
  <div style="background:${BLACK};margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:600px;margin:0 auto;background:${CREAM};border-radius:4px;overflow:hidden">

      <!-- Header -->
      <div style="background:${BLACK};padding:30px 24px 22px;text-align:center">
        <img src="${logo}" width="86" alt="Feed The Obsession BBQ" style="display:inline-block;border:0;margin-bottom:12px" />
        <div style="font-family:${HEAVY};font-size:30px;font-weight:900;letter-spacing:1px;color:#fff;line-height:1">
          FEED <span style="color:${RED}">THE</span> OBSESSION
        </div>
        <div style="color:#c9c2b4;font-size:11px;letter-spacing:3px;margin-top:10px">
          VETERAN-OWNED &bull; WOOD-SMOKED &bull; DELAND, FLORIDA
        </div>
      </div>
      <div style="height:8px;background:${RED}"></div>

      <!-- Body -->
      <div style="padding:30px 26px">
        <h1 style="margin:0 0 6px;font-family:${HEAVY};font-size:22px;color:${INK};letter-spacing:.5px">
          ORDER CONFIRMED — THANKS, ${esc(name).toUpperCase()}! 🍖
        </h1>
        <p style="margin:0 0 22px;color:#5b544a;font-size:15px;line-height:1.5">
          We got your order and it&rsquo;s headed for the smoker. Here&rsquo;s what&rsquo;s on the ticket:
        </p>

        <div style="font-family:${HEAVY};font-size:19px;letter-spacing:1px;color:${INK};border-bottom:3px solid ${RED};padding-bottom:6px;margin-bottom:6px">
          YOUR ORDER
        </div>
        <table style="width:100%;border-collapse:collapse">${rows}
          <tr>
            <td colspan="3" style="padding:14px 0 0;border-top:2px solid ${INK}"></td>
          </tr>
          <tr>
            <td style="font-family:${HEAVY};font-size:18px;color:${INK}">TOTAL</td>
            <td></td>
            <td style="font-family:${HEAVY};font-size:18px;color:${RED};text-align:right">${money(totalCents / 100)}</td>
          </tr>
        </table>

        <div style="background:#ece4d3;border-left:4px solid ${RED};padding:14px 16px;margin:24px 0">
          <div style="color:#8a8069;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Fulfillment</div>
          <div style="color:${INK};font-size:16px;font-weight:bold">${fulfillment}</div>
          <div style="color:${INK};font-size:15px;margin-top:6px"><strong>Pickup:</strong> ${esc(pickup || "ASAP")}</div>
        </div>

        <p style="margin:0 0 4px;color:${INK};font-size:15px;line-height:1.6"><strong>Pickup:</strong> ${esc(business.address.full)}</p>
        <p style="margin:0 0 4px;color:${INK};font-size:15px;line-height:1.6"><strong>Hours:</strong> ${business.hoursDisplay}</p>
        <p style="margin:0 0 22px;color:${INK};font-size:15px;line-height:1.6"><strong>Questions?</strong> Call <a href="${business.phoneHref}" style="color:${RED};text-decoration:none;font-weight:bold">${business.phone}</a></p>

        <div style="text-align:center">
          <a href="${business.maps.directions}" style="display:inline-block;background:${RED};color:#fff;text-decoration:none;font-family:${HEAVY};font-size:14px;letter-spacing:1px;padding:13px 30px;border-radius:999px">GET DIRECTIONS</a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background:${BLACK};padding:20px 24px;text-align:center">
        <p style="margin:0;color:#9b9384;font-size:12px;line-height:1.5">
          Love it? <a href="${business.maps.review}" style="color:${RED};text-decoration:none;font-weight:bold">Leave us a Google review</a><br/>
          ${esc(business.name)} &bull; ${esc(business.address.full)}
        </p>
      </div>
    </div>
  </div>`;

  return { subject: `Your Feed The Obsession BBQ order is confirmed 🍖`, html };
}
