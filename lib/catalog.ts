// Live menu, sourced from the Square Catalog (the "McSorleys" category = the
// current FTO menu). Imported by the server pages (to render the menu) and by
// /api/checkout (to validate ids + charge Square's price, never the browser's).
import { square } from "./square";

export type MenuSection =
  | "Plates"
  | "Combos"
  | "Daily Specials"
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
  proteinPicks?: number; // 2 Meat / 3 Meat plates: how many proteins to choose
};

// Proteins a customer can pick for the 2 Meat and 3 Meat plates (owner's list,
// Oct 2026). Validated server-side at checkout.
export const PROTEINS = ["Brisket", "Ribs", "Pulled Pork", "Sliced Pork", "Chicken"] as const;

// Only this Square category is the live online menu; the account also holds old
// event menus (OB'S, Sorry Charlie's, St. Judes) we deliberately ignore.
const MENU_CATEGORY = "mcsorleys";

export const MENU_SECTIONS: MenuSection[] = [
  "Plates",
  "Combos",
  "Daily Specials",
  "Whole Cuts",
  "Sides",
  "Extras",
];

const money = (m?: { amount?: bigint | number | null } | null) =>
  m && m.amount != null ? Number(m.amount) / 100 : 0;

function sectionFor(name: string): MenuSection {
  const n = name.toLowerCase();
  if (n.includes("special")) return "Daily Specials";
  // The full rack needs 24 hours' notice, so it lives with the whole cuts.
  if (n.startsWith("whole") || n.includes("full rack")) return "Whole Cuts";
  if (n.includes("meat") || n.includes("sampler")) return "Combos";
  if (n.trim() === "side") return "Sides";
  // Sauce bottles, extra sauce, add-on chicken: not plates.
  if (n.includes("sauce") || n.includes("ranch") || n.trim() === "chicken") return "Extras";
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

// Lead times the kitchen needs (owner, Oct 2026).
function noticeFor(title: string): string | undefined {
  const t = title.toLowerCase();
  if (t.includes("full rack")) return "24 hours' notice";
  if (t.includes("whole smoked brisket") || t === "whole brisket") return "3 days' notice";
  if (t.includes("whole pork butt")) return "Order a day ahead";
  return undefined;
}

function proteinPicksFor(title: string): number | undefined {
  const t = title.toLowerCase();
  if (t.startsWith("2 meat")) return 2;
  if (t.startsWith("3 meat")) return 3;
  return undefined;
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
    "2 meat with side": "Pick two smoked meats. Comes with one side.",
    "2 meat plate": "Pick two smoked meats. Comes with one side.",
    "3 meat with 1 side": "Pick three smoked meats. Comes with one side.",
    "3 meat plate": "Pick three smoked meats. Comes with one side.",
    sampler: "A run at everything on the pit. Built to share.",
    "ribs full rack": "A whole rack, smoked low and slow.",
    "whole pork butt": "Smoked whole and ready to pull.",
    "whole smoked brisket": "A full packer, smoked overnight.",
    side: "Beans, sliced potatoes, coleslaw, or the pitmaster's choice of the week.",
    "16oz bbq sauce": "Sweet Heat homemade sauce. Bring the bottle back and refill for $10.",
    chicken: "Add a piece of smoked chicken to any order.",
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

  const page = await square.catalog.list({ types: "ITEM,CATEGORY" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objects: any[] = [];
  for await (const o of page) objects.push(o);

  const catName: Record<string, string> = {};
  for (const o of objects)
    if (o.type === "CATEGORY") catName[o.id] = (o.categoryData?.name || "").trim();

  const items: MenuItem[] = [];
  for (const o of objects) {
    if (o.type !== "ITEM") continue;
    const d = o.itemData || {};
    const catId = d.categoryId || d.reportingCategory?.id || d.categories?.[0]?.id;
    const cat = (catId && catName[catId]) || "";
    if (cat.toLowerCase() !== MENU_CATEGORY) continue;

    const variation = d.variations?.[0];
    const id = variation?.id;
    const price = money(variation?.itemVariationData?.priceMoney);
    if (!id || price <= 0) continue;

    const title = (d.name || "").trim();
    const section = sectionFor(title);
    const notice = noticeFor(title);
    // The Square description may carry the lead time too; the notice line
    // below the item already says it, so drop that sentence from the blurb.
    const description = (d.description || describe(title))
      .replace(notice ? /\s*[^.]*notice[^.]*\.?/i : /$^/, "")
      .trim();
    items.push({
      id,
      title,
      price,
      description,
      image: imageFor(title),
      section,
      ...(BEST_SELLERS.includes(title.toLowerCase()) ? { bestSeller: true } : {}),
      ...(notice ? { notice } : {}),
      ...(proteinPicksFor(title) ? { proteinPicks: proteinPicksFor(title) } : {}),
    });
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
