// Live menu, sourced from the Square Catalog (the "McSorleys" category = the
// current FTO menu). Imported by the server pages (to render the menu) and by
// /api/checkout (to validate ids + charge Square's price, never the browser's).
import { square, LOCATION_ID } from "./square";
import { specialRuleFor, type SpecialRule } from "./specials";

export type MenuSection =
  | "Plates"
  | "Combos"
  | "Daily Specials"
  | "By the Pound"
  | "Whole Cuts"
  | "Sides"
  | "Extras";

export type MenuItem = {
  id: string; // Square ITEM_VARIATION id — used as catalogObjectId at checkout
  title: string;
  price: number; // US dollars
  description: string;
  image: string;
  section: MenuSection;
  bestSeller?: boolean;
  notice?: string; // lead time / ordering rule shown under the item
  choices?: Choice[]; // Square modifier lists on the item ("Pick your meats", "Pick your side", "Extra sauce")
  leadDays?: number; // whole cuts: pickup must be at least this many days out
  unit?: "lb"; // sold by the pound: quantity is pounds
  special?: SpecialRule; // Smoke Schedule items: which day(s) they can be ordered
  callToOrder?: boolean; // listed online but ordered by phone (owner's call)
  soldOut?: boolean; // the owner's "Sold out" toggle in Square, for the shop location
};

// Choices come straight from the Square modifier lists attached to each item —
// the same lists the POS and DoorDash use — so the owner edits options, counts
// and prices in Square and every channel follows. Nothing here is hardcoded.
export type ChoiceOption = { id: string; name: string; price: number }; // Square MODIFIER id; price in dollars
export type Choice = {
  id: string; // Square MODIFIER_LIST id
  name: string; // as shown to customers, e.g. "Pick your meats"
  label: string; // short ticket label, e.g. "Meats"
  min: number; // 0 = optional
  max: number; // 0 = no limit
  repeats: boolean; // Square's allow_quantities: the same option more than once (double brisket)
  options: ChoiceOption[];
};
export type ChoicePick = { id: string; qty: number }; // a chosen option and how many

const ticketLabel = (listName: string) => {
  const s = listName.replace(/^(pick|choose|select)\s+(your\s+|a\s+)?/i, "").trim() || listName;
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// "Meats: Brisket ×2 + Ribs · Side: Beans" — for the cart, emails and the kitchen.
export function describePicks(choices: Choice[] | undefined, picks: ChoicePick[]): string {
  if (!choices?.length || !picks.length) return "";
  const qty = new Map(picks.map((p) => [p.id, p.qty]));
  return choices
    .map((c) => {
      const chosen = c.options
        .filter((o) => (qty.get(o.id) ?? 0) > 0)
        .map((o) => (qty.get(o.id)! > 1 ? `${o.name} ×${qty.get(o.id)}` : o.name));
      return chosen.length ? `${c.label}: ${chosen.join(" + ")}` : "";
    })
    .filter(Boolean)
    .join(" · ");
}

// Dollars the chosen options add on top of the item price (0 for free options).
export function picksPrice(choices: Choice[] | undefined, picks: ChoicePick[]): number {
  const price = new Map((choices ?? []).flatMap((c) => c.options.map((o) => [o.id, o.price] as const)));
  return picks.reduce((s, p) => s + (price.get(p.id) ?? 0) * p.qty, 0);
}

// Checks a set of picks against the item's Square rules. Used by checkout (the
// source of truth) and by the menu to know when "Add" can be pressed.
export function checkPicks(
  item: Pick<MenuItem, "title" | "choices">,
  picks: ChoicePick[]
): { ok: true; picks: ChoicePick[] } | { ok: false; error: string } {
  const merged = new Map<string, number>();
  for (const p of picks) {
    const n = Math.floor(Number(p?.qty));
    if (!p?.id || !Number.isFinite(n) || n < 1) return { ok: false, error: `Invalid choice for the ${item.title}` };
    merged.set(String(p.id), (merged.get(String(p.id)) ?? 0) + n);
  }
  const known = new Set((item.choices ?? []).flatMap((c) => c.options.map((o) => o.id)));
  for (const id of merged.keys())
    if (!known.has(id)) return { ok: false, error: `That option isn't available for the ${item.title} right now` };
  for (const c of item.choices ?? []) {
    const counts = c.options.map((o) => merged.get(o.id) ?? 0);
    const total = counts.reduce((s, n) => s + n, 0);
    const what = c.label.toLowerCase();
    if (!c.repeats && counts.some((n) => n > 1))
      return { ok: false, error: `Each ${what} choice can only be picked once for the ${item.title}` };
    if (total < c.min)
      return {
        ok: false,
        error: `Please pick ${c.max === c.min ? c.min : `at least ${c.min}`} ${what} for the ${item.title}`,
      };
    if (c.max > 0 && total > c.max)
      return { ok: false, error: `Please pick no more than ${c.max} ${what} for the ${item.title}` };
  }
  // Stable order (choice, then option order) so the same picks always match.
  const order = (item.choices ?? []).flatMap((c) => c.options.map((o) => o.id));
  return {
    ok: true,
    picks: [...merged.entries()]
      .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
      .map(([id, qty]) => ({ id, qty })),
  };
}

// Only this Square category is the live online menu; the account also holds old
// event menus (OB'S, Sorry Charlie's, St. Judes) we deliberately ignore.
const MENU_CATEGORY = "mcsorleys";

export const MENU_SECTIONS: MenuSection[] = [
  "Plates",
  "Combos",
  "Daily Specials",
  "By the Pound",
  "Whole Cuts",
  "Sides",
  "Extras",
];

const money = (m?: { amount?: bigint | number | null } | null) =>
  m && m.amount != null ? Number(m.amount) / 100 : 0;

function sectionFor(name: string): MenuSection {
  const n = name.toLowerCase();
  if (n.includes("special")) return "Daily Specials";
  // Brisket and ribs sold by weight (owner, Nov 2026).
  if (n.includes("pound") || /\blb\b/.test(n)) return "By the Pound";
  // The full rack needs 24 hours' notice, so it lives with the whole cuts.
  if (n.startsWith("whole") || n.includes("full rack")) return "Whole Cuts";
  if (n.includes("meat") || n.includes("sampler")) return "Combos";
  if (n.trim() === "side") return "Sides";
  // Sauce bottles, extra sauce, add-on chicken: not plates.
  if (n.includes("sauce") || n.includes("ranch") || n.trim() === "chicken" || n.startsWith("add ")) return "Extras";
  return "Plates";
}

// Printed-menu order for the plates column (owner's marked-up sheet, Oct 2026).
const PLATE_ORDER = [
  "brisket",
  "rib",
  "pulled pork",
  "sliced pork",
  "chicken plate",
  "chicken salad",
  "slider",
];
function plateRank(title: string): number {
  const t = title.toLowerCase();
  const i = PLATE_ORDER.findIndex((k) => t.includes(k));
  return i < 0 ? PLATE_ORDER.length : i;
}

// Starred as best sellers on the owner's sheet.
const BEST_SELLERS = ["brisket plate with 1 side", "rib plate with 1 side"];

// Whole cuts are smoked to order: pickup at least this many days out (owner, Nov 2026).
const WHOLE_CUT_LEAD_DAYS = 2;

// Lead-time line shown under an item.
function noticeFor(section: MenuSection): string | undefined {
  if (section === "Whole Cuts") return `Order ${WHOLE_CUT_LEAD_DAYS} days ahead`;
  return undefined;
}

// Sauce bottles are listed online but sold over the phone / at the counter
// (owner's call, Oct 2026).
function callToOrderFor(title: string): boolean {
  const t = title.toLowerCase();
  // Jar refills need the customer's empty jar, so they're done at the counter too.
  return t.includes("bbq sauce") || t.includes("refill");
}

// Square items carry no descriptions/images, so we enrich from the branded menu.
function describe(title: string): string {
  const t = title.toLowerCase();
  const map: Record<string, string> = {
    "brisket with 1 side": "Slow-smoked beef brisket, sliced to order.",
    "brisket plate with 1 side": "Slow-smoked beef brisket, sliced to order.",
    "rib plate with 1 side": "Smoked pork ribs with bark and bite.",
    "pulled pork with 1 side": "Hand-pulled pork butt, smoked overnight.",
    "pulled pork plate with 1 side": "Hand-pulled pork butt, smoked overnight.",
    "chicken plate": "Smoked chicken, juicy straight off the pit.",
    "chicken plate with 1 side": "Smoked chicken, juicy straight off the pit.",
    "chicken salad w/ side": "House smoked-chicken salad.",
    "chicken salad plate": "House smoked-chicken salad.",
    slider: "Smoked meat piled on a slider bun.",
    "sliced pork no side": "Sliced smoked pork on its own.",
    "sliced pork plate": "Sliced smoked pork. Comes with one side.",
    "2 meat with side": "Pick two smoked meats. Comes with two sides.",
    "2 meat plate": "Pick two smoked meats. Comes with two sides.",
    "3 meat with 1 side": "Pick three smoked meats. Comes with three sides.",
    "3 meat plate": "Pick three smoked meats. Comes with three sides.",
    sampler: "A run at everything on the pit. Built to share.",
    "ribs full rack": "A whole rack, smoked low and slow.",
    "whole pork butt": "Smoked whole and ready to pull.",
    "whole smoked brisket": "A full packer, smoked overnight.",
    side: "Beans, sliced potatoes, coleslaw, chicken salad, or the pitmaster's choice of the week.",
    "brisket by the pound": "Sliced to order off the pit. Sold by the pound.",
    "pork ribs by the pound": "Smoked pork ribs, sold by the pound.",
    "8oz bbq sauce": "Sweet Heat homemade sauce in an 8 oz mason jar. Bring the jar back and refill for $10.",
    "16oz bbq sauce": "Sweet Heat homemade sauce in an 8 oz mason jar. Bring the jar back and refill for $10.",
    chicken: "Add a piece of smoked chicken to any order.",
    "add chicken (piece)": "Add a piece of smoked chicken to any order.",
    "sauce jar refill": "Bring your empty 8 oz jar back and we'll fill it with Sweet Heat for $10.",
  };
  if (map[t]) return map[t];
  if (t.includes("special")) return "This week's rotating weekday special.";
  return "Wood-smoked to order.";
}

function imageFor(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("pulled pork")) return "/pictures/food/pulled-pork-transparent.png";
  return "/pictures/food/ribs.png"; // generic BBQ fallback (matches prior menu)
}

// Short in-memory cache so we don't hit Square on every render; pages also set
// `revalidate = 60`, so menu edits in Square appear within ~a minute.
let cache: { at: number; items: MenuItem[] } | null = null;
const TTL_MS = 60_000;

export async function getMenu(): Promise<MenuItem[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.items;

  const page = await square.catalog.list({ types: "ITEM,CATEGORY,MODIFIER_LIST" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objects: any[] = [];
  for await (const o of page) objects.push(o);

  const catName: Record<string, string> = {};
  for (const o of objects)
    if (o.type === "CATEGORY") catName[o.id] = (o.categoryData?.name || "").trim();

  // Square modifier lists by id. Options hidden online or marked sold out at the
  // shop are left off; ordinal keeps the owner's order from Square.
  const ord = (x: unknown) => (x == null ? 0 : Number(x));
  const lists = new Map<string, { name: string; min: number; max: number; repeats: boolean; options: ChoiceOption[] }>();
  for (const o of objects) {
    if (o.type !== "MODIFIER_LIST" || o.isDeleted) continue;
    const ld = o.modifierListData || {};
    const options: ChoiceOption[] = [...(ld.modifiers || [])]
      .filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (m: any) =>
          m?.id &&
          !m.isDeleted &&
          !m.modifierData?.hiddenOnline &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          !(m.modifierData?.locationOverrides || []).some((l: any) => l?.locationId === LOCATION_ID && l?.soldOut)
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => ord(a.modifierData?.ordinal) - ord(b.modifierData?.ordinal))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((m: any) => ({ id: m.id, name: (m.modifierData?.name || "").trim(), price: money(m.modifierData?.priceMoney) }));
    lists.set(o.id, {
      name: (ld.name || "").trim(),
      min: ord(ld.minSelectedModifiers),
      max: ord(ld.maxSelectedModifiers),
      repeats: ld.allowQuantities === true,
      options,
    });
  }

  // The lists an item uses, with the item's own min/max winning over the list's
  // (Square: -1 or unset on the item means "use the list's").
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const choicesFor = (d: any): Choice[] =>
    [...(d.modifierListInfo || [])]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((info: any) => info?.enabled !== false && !info?.hiddenFromCustomer && lists.has(info.modifierListId))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => ord(a.ordinal) - ord(b.ordinal))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((info: any) => {
        const l = lists.get(info.modifierListId)!;
        const pickLimit = (own: unknown, fallback: number) => (own != null && ord(own) >= 0 ? ord(own) : Math.max(fallback, 0));
        return {
          id: info.modifierListId as string,
          name: l.name,
          label: ticketLabel(l.name),
          min: pickLimit(info.minSelectedModifiers, l.min),
          max: pickLimit(info.maxSelectedModifiers, l.max),
          repeats: l.repeats,
          options: l.options,
        };
      })
      .filter((c) => c.options.length > 0);

  const items: MenuItem[] = [];
  for (const o of objects) {
    if (o.type !== "ITEM") continue;
    const d = o.itemData || {};
    // Archived in Square (old event items, duplicates): gone from the POS, gone here.
    if (d.isArchived) continue;
    const catId = d.categoryId || d.reportingCategory?.id || d.categories?.[0]?.id;
    const cat = (catId && catName[catId]) || "";
    if (cat.toLowerCase() !== MENU_CATEGORY) continue;

    const baseTitle = (d.name || "").trim();
    const choices = choicesFor(d);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const variations: any[] = (d.variations || []).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (v: any) => v?.id && money(v.itemVariationData?.priceMoney) > 0
    );
    if (variations.length === 0) continue;

    // An item with several priced variations (e.g. pork butt in three sizes)
    // becomes one line per size; the variation id is what checkout charges.
    for (const variation of variations) {
      const id: string = variation.id;
      const price = money(variation.itemVariationData?.priceMoney);
      const vname = (variation.itemVariationData?.name || "").trim();
      const title =
        variations.length > 1 && vname && vname.toLowerCase() !== "regular"
          ? `${baseTitle} · ${vname}`
          : baseTitle;
      const section = sectionFor(baseTitle);
      const notice = noticeFor(section);
      // "Sold out" is set per location in Square (POS / Dashboard). Keep the item
      // listed so customers see it exists, but it can't be added or checked out.
      const soldOut = (variation.itemVariationData?.locationOverrides || []).some(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (l: any) => l?.locationId === LOCATION_ID && l?.soldOut === true
      );
      // The Square description may carry the lead time too; the notice line
      // below the item already says it, so drop that sentence from the blurb.
      const description = (d.description || describe(baseTitle))
        .replace(notice ? /\s*[^.]*\b(notice|ahead)\b[^.]*\.?/gi : /$^/, "")
        .trim();
      items.push({
        id,
        title,
        price,
        description,
        image: imageFor(baseTitle),
        section,
        ...(BEST_SELLERS.includes(baseTitle.toLowerCase()) ? { bestSeller: true } : {}),
        ...(notice ? { notice } : {}),
        ...(choices.length ? { choices } : {}),
        ...(section === "Whole Cuts" ? { leadDays: WHOLE_CUT_LEAD_DAYS } : {}),
        ...(section === "By the Pound" ? { unit: "lb" as const } : {}),
        ...(specialRuleFor(baseTitle) ? { special: specialRuleFor(baseTitle) } : {}),
        ...(callToOrderFor(baseTitle) ? { callToOrder: true } : {}),
        ...(soldOut ? { soldOut: true } : {}),
      });
    }
  }

  // Sections in menu order; plates in the printed-menu order (ties: with-side
  // before no-side); everything else cheapest first.
  items.sort(
    (a, b) =>
      MENU_SECTIONS.indexOf(a.section) - MENU_SECTIONS.indexOf(b.section) ||
      (a.section === "Plates"
        ? plateRank(a.title) - plateRank(b.title) || b.price - a.price
        : a.price - b.price) ||
      a.title.localeCompare(b.title)
  );

  cache = { at: Date.now(), items };
  return items;
}

export async function getMenuMap(): Promise<Map<string, MenuItem>> {
  return new Map((await getMenu()).map((i) => [i.id, i]));
}
