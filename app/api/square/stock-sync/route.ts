// Morning top-up (Vercel cron, see vercel.json): every in-stock item the
// Ingredients switches control goes back to a full count before opening, and
// anything the webhook missed gets fixed. Vercel sends CRON_SECRET.
import { syncStock, STOCK_FULL } from "@/lib/stock-sync";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return new Response("Unauthorized", { status: 401 });
  const r = await syncStock({ topUpBelow: STOCK_FULL });
  console.log("[stock-sync:morning]", JSON.stringify(r));
  return Response.json(r);
}
