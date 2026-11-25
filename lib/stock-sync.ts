// One tap for the crew: marking "Ribs (ingredient)" sold out in Square puts
// ribs out everywhere, not just on the website.
//   - Every item made with it gets a stock count of 0. Square then marks the
//     item sold out by itself (and back in stock above 0), and the register
//     and DoorDash follow (DoorDash in about 1–2 minutes).
//   - Every combo / slider / side pick named for it is set "hidden online",
//     which takes it off DoorDash's picks (and the website's).
// Modifier picks can't carry stock counts and the API can't mark anything
// sold out directly, so these are the two levers we have (tested Nov 25 2026).
//
// Runs on Square's catalog.version.updated webhook and once each morning.
// Safe to run any time: it only changes what's out of line.
import crypto from "node:crypto";
import { square, LOCATION_ID } from "./square";
import { buildMenu, ingredientSwitches } from "./catalog";

const IN_STOCK = 100; // "plenty": the count an in-stock item is kept at
const TOP_UP_BELOW = 30; // during the day, refill an in-stock item below this

export type SyncResult = {
  out: string[]; // ingredients the crew has switched off
  zeroed: string[];
  restocked: string[];
  tracked: string[]; // items whose stock tracking was turned on this run
  picksHidden: string[];
  picksShown: string[];
  skipped: string[]; // hand-marked sold out with no stock tracking yet: left alone
  dryRun: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Obj = any;

// The menu as the Ingredients switches alone would have it: every other
// sold-out flag (the crew's hand-marked plates, our own zeros) cleared.
function menuFromSwitches(objects: Obj[], everySwitchOut: boolean) {
  const sw = ingredientSwitches(objects);
  const copy: Obj[] = structuredClone(objects);
  for (const o of copy) {
    const isSwitch = sw.ids.has(o.id);
    for (const v of o.itemData?.variations || []) {
      if (!v.itemVariationData) continue;
      if (isSwitch) {
        if (everySwitchOut) v.itemVariationData.locationOverrides = [{ locationId: LOCATION_ID, soldOut: true }];
      } else v.itemVariationData.locationOverrides = [];
    }
    for (const m of o.modifierListData?.modifiers || []) {
      if (!m.modifierData) continue;
      m.modifierData.locationOverrides = [];
      m.modifierData.hiddenOnline = false;
    }
  }
  return buildMenu(copy);
}

export async function syncStock(
  opts: { topUpBelow?: number; dryRun?: boolean; objects?: Obj[]; counts?: Map<string, number> } = {}
): Promise<SyncResult> {
  const topUpBelow = opts.topUpBelow ?? TOP_UP_BELOW;
  const dryRun = opts.dryRun === true;
  // `objects` / `counts` let tests feed a catalog in (with dryRun).
  const objects: Obj[] = opts.objects ?? [];
  if (!opts.objects)
    for await (const o of await square.catalog.list({ types: "ITEM,CATEGORY,MODIFIER_LIST" })) objects.push(o);

  const sw = ingredientSwitches(objects);
  const result: SyncResult = { out: [...sw.out].map((s) => s.trim()), zeroed: [], restocked: [], tracked: [], picksHidden: [], picksShown: [], skipped: [], dryRun };

  // Items an ingredient can shut off, and which of them should be off now.
  const shouldBeOut = new Set(menuFromSwitches(objects, false).filter((i) => i.soldOut).map((i) => i.id));
  const managed = menuFromSwitches(objects, true).filter((i) => i.soldOut);

  // Current state of those variations in Square.
  const variations = new Map<string, Obj>();
  for (const o of objects) for (const v of o.itemData?.variations || []) variations.set(v.id, v);
  const counts = opts.counts ?? new Map<string, number>();
  if (!opts.counts && managed.length) {
    const page = await square.inventory.batchGetCounts({ catalogObjectIds: managed.map((i) => i.id), locationIds: [LOCATION_ID] });
    for await (const c of page)
      if (c.state === "IN_STOCK" && c.catalogObjectId) counts.set(c.catalogObjectId, Number(c.quantity ?? 0));
  }

  const setCount: { id: string; qty: number }[] = [];
  const turnOnTracking: Obj[] = [];
  for (const item of managed) {
    const v = variations.get(item.id);
    if (!v?.itemVariationData) continue;
    const d = v.itemVariationData;
    const here = (d.locationOverrides || []).find((l: Obj) => l?.locationId === LOCATION_ID) || {};
    const tracked = here.trackInventory ?? d.trackInventory === true;
    const handMarked = here.soldOut === true; // sold out now (by hand, or by our 0)
    const count = counts.get(item.id);
    const startTracking = () => {
      turnOnTracking.push({ ...v, itemVariationData: { ...d, trackInventory: true, inventoryAlertType: "NONE" } });
      result.tracked.push(item.title);
    };

    if (shouldBeOut.has(item.id)) {
      if (count !== 0) {
        setCount.push({ id: item.id, qty: 0 });
        result.zeroed.push(item.title);
      }
      if (!tracked) startTracking();
      continue;
    }
    if (!tracked) {
      // Never take over an item the crew marked sold out by hand: switching
      // tracking on could put it back on sale. It joins once they unmark it.
      if (handMarked) result.skipped.push(item.title);
      else {
        setCount.push({ id: item.id, qty: IN_STOCK });
        startTracking();
      }
      continue;
    }
    if (count == null || count <= 0) {
      setCount.push({ id: item.id, qty: IN_STOCK });
      result.restocked.push(item.title);
    } else if (!handMarked && count < topUpBelow) setCount.push({ id: item.id, qty: IN_STOCK });
  }

  // Combo / slider / side picks named for an ingredient: hidden online while
  // it's out. (Square: a pick can't be sold out or counted by an app.)
  const pickChanges: Obj[] = [];
  for (const o of objects) {
    if (o.type !== "MODIFIER_LIST" || o.isDeleted) continue;
    for (const m of o.modifierListData?.modifiers || []) {
      if (!m?.modifierData || m.isDeleted) continue;
      const ings = sw.of(m.modifierData.name || "");
      if (!ings.length) continue;
      const hide = ings.some((g) => sw.out.has(g));
      if ((m.modifierData.hiddenOnline === true) === hide) continue;
      pickChanges.push({ ...m, modifierData: { ...m.modifierData, hiddenOnline: hide } });
      (hide ? result.picksHidden : result.picksShown).push(`${o.modifierListData.name}: ${m.modifierData.name}`);
    }
  }

  if (dryRun) return result;

  // Counts first, then tracking: a variation switched to tracked with no count
  // reads as 0 and would flash sold out.
  const now = new Date().toISOString();
  for (let i = 0; i < setCount.length; i += 100)
    await square.inventory.batchCreateChanges({
      idempotencyKey: crypto.randomUUID(),
      changes: setCount.slice(i, i + 100).map((c) => ({
        type: "PHYSICAL_COUNT" as const,
        physicalCount: { catalogObjectId: c.id, state: "IN_STOCK" as const, locationId: LOCATION_ID, quantity: String(c.qty), occurredAt: now },
      })),
    });
  const upserts = [...turnOnTracking, ...pickChanges];
  if (upserts.length)
    await square.catalog.batchUpsert({ idempotencyKey: crypto.randomUUID(), batches: [{ objects: upserts }] });
  return result;
}

// One sync at a time per server; a change that lands mid-run gets one re-run.
let running: Promise<SyncResult> | null = null;
let again = false;
export function syncStockSoon(opts?: { topUpBelow?: number }): Promise<SyncResult> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    try {
      let r = await syncStock(opts);
      while (again) {
        again = false;
        r = await syncStock(opts);
      }
      return r;
    } finally {
      running = null;
    }
  })();
  return running;
}

export const STOCK_FULL = IN_STOCK;
