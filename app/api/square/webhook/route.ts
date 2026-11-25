// Square → website notice when the catalog changes (the crew marks an
// ingredient sold out or back). Re-syncs stock so the register and DoorDash
// follow the Ingredients switches. Subscription: Square Developer app, event
// catalog.version.updated, URL below; its signature key is the env var.
import crypto from "node:crypto";
import { after } from "next/server";
import { syncStockSoon } from "@/lib/stock-sync";

export const runtime = "nodejs";

// Must match the subscription's notification URL exactly (it's signed).
const URL_SIGNED = process.env.SQUARE_WEBHOOK_URL || "https://www.feedtheobsessionbbq.com/api/square/webhook";

function signedBySquare(body: string, signature: string, key: string): boolean {
  const expected = crypto.createHmac("sha256", key).update(URL_SIGNED + body).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const body = await req.text();
  if (!key || !signedBySquare(body, req.headers.get("x-square-hmacsha256-signature") || "", key))
    return new Response("Bad signature", { status: 401 });

  let type = "";
  try {
    type = JSON.parse(body)?.type || "";
  } catch {
    return new Response("Bad body", { status: 400 });
  }
  // Answer Square right away (it wants a 2xx within 10s); sync after.
  if (type === "catalog.version.updated")
    after(async () => {
      try {
        const r = await syncStockSoon();
        if (r.zeroed.length || r.restocked.length || r.tracked.length || r.picksHidden.length || r.picksShown.length)
          console.log("[stock-sync]", JSON.stringify(r));
      } catch (e) {
        console.error("[stock-sync] failed", e);
      }
    });
  return new Response("ok");
}
