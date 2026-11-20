import { square, LOCATION_ID } from "@/lib/square";
import { checkPicks, getMenuMap, type ChoicePick } from "@/lib/catalog";

// Exact totals for the cart, from Square itself (same pricing + Florida sales
// tax the checkout will charge), so the order page shows tax to the cent before
// paying. Nothing is created in Square: orders.calculate is a dry run.
type Line = { id: string; quantity: number; picks?: ChoicePick[] };

export async function POST(req: Request) {
  let body: { items?: Line[] };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request body", { status: 400 });
  }
  const lines = Array.isArray(body.items) ? body.items.slice(0, 100) : [];
  if (lines.length === 0) return Response.json({ subtotalCents: 0, taxCents: 0, totalCents: 0 });

  const menu = await getMenuMap();
  const lineItems = [];
  for (const line of lines) {
    const item = menu.get(String(line.id));
    const qty = Math.floor(Number(line.quantity));
    if (!item || !Number.isFinite(qty) || qty < 1) continue; // checkout reports bad lines
    let picks: ChoicePick[] = [];
    if (item.choices?.length) {
      const checked = checkPicks(item, Array.isArray(line.picks) ? line.picks : []);
      if (checked.ok) picks = checked.picks;
    }
    lineItems.push({
      catalogObjectId: item.id,
      quantity: String(qty),
      ...(picks.length ? { modifiers: picks.map((p) => ({ catalogObjectId: p.id, quantity: String(p.qty) })) } : {}),
    });
  }
  if (lineItems.length === 0) return Response.json({ subtotalCents: 0, taxCents: 0, totalCents: 0 });

  try {
    const res = await square.orders.calculate({
      order: { locationId: LOCATION_ID, lineItems, pricingOptions: { autoApplyTaxes: true } },
    });
    const total = Number(res.order?.totalMoney?.amount ?? 0);
    const tax = Number(res.order?.totalTaxMoney?.amount ?? 0);
    return Response.json({ subtotalCents: total - tax, taxCents: tax, totalCents: total });
  } catch (e) {
    console.error("[quote] Square calculate failed", e);
    return new Response("Couldn't price the order", { status: 502 });
  }
}
