// Daily run before opening (Vercel cron, see vercel.json):
//  1. Refills the counter on items that are on sale. Never brings back
//     anything sold out; that's the crew's call.
//  2. Emails the crew what's still marked sold out (morning check).
// Vercel sends CRON_SECRET as a Bearer token.
import { syncStock } from "@/lib/stock-sync";
import { stockReminder } from "@/lib/stock-reminder";
import { sendEmail } from "@/lib/mailer";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return new Response("Unauthorized", { status: 401 });
  const r = await syncStock({ morning: true });
  const mail = stockReminder(r);
  const to = (process.env.STOCK_REMINDER_TO ?? process.env.ORDER_NOTIFY_TO ?? "hunter@xtremery.com")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const sent = await sendEmail({ to, ...mail });
  console.log("[stock-sync:morning]", JSON.stringify({ ...r, emailed: sent.ok }));
  return Response.json({ ...r, emailed: sent.ok });
}
