// Live menu, sourced from the Square Catalog (the "McSorleys" category = the
// current FTO menu). Imported by the server pages (to render the menu) and by
// /api/checkout (to validate ids + charge Square's price, never the browser's).
import { square } from "./square";

export type MenuSection =
  | "Plates"
  | "Combos"
  | "Daily Specials"
  | "Whole Cuts"
  | "Sides";

export type MenuItem = {
  id: string; // Square ITEM_VARIATION id — used as catalogObjectId at checkout
  title: string;
  price: number; // US dollars
  description: string;
  image: string;
  section: MenuSection;
};

// Only this Square category is the live online menu; the account also holds old
// event menus (OB'S, Sorry Charlie's, St. Judes) we deliberately ignore.
const MENU_CATEGORY = "mcsorleys";

export const MENU_SECTIONS: MenuSection[] = [
  "Plates",
  "Combos",
  "Daily Specials",
  "Whole Cuts",
  "Sides",
];

const money = (m?: { amount?: bigint | number | null } | null) =>
  m && m.amount != null ? Number(m.amount) / 100 : 0;

function sectionFor(name: string): MenuSection {
  const n = name.toLowerCase();
  if (n.includes("special")) return "Daily Specials";
  if (n.startsWith("whole")) return "Whole Cuts";
  if (n.includes("meat") || n.includes("sampler") || n.includes("full rack"))
    return "Combos";
  if (n.trim() === "side") return "Sides";
  return "Plates";
}

// Square items carry no descriptions/images, so we enrich from the branded menu.
function describe(title: string): string {
  const t = title.toLowerCase();
  const map: Record<string, string> = {
    "brisket with 1 side": "Slow-smoked beef brisket, sliced to order.",
    "rib plate with 1 side": "Smoked pork ribs with bark and bite.",
    "pulled pork with 1 side": "Hand-pulled pork butt, smoked overnight.",
    "chicken plate with 1 side": "Smoked chicken, juicy straight off the pit.",
    "chicken salad w/ side": "House smoked-chicken salad.",
    slider: "Smoked meat piled on a slider bun.",
    "sliced pork no side": "Sliced smoked pork on its own.",
    "2 meat with side": "Pick two smoked meats. Comes with one side.",
    "3 meat with 1 side": "Pick three smoked meats. Comes with one side.",
    sampler: "A run at everything on the pit. Built to share.",
    "ribs full rack": "A whole rack, smoked low and slow.",
    "whole pork butt": "Smoked whole and ready to pull.",
    "whole smoked brisket": "A full packer, smoked overnight.",
    side: "Ask what's on today — sides change with the week.",
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
    items.push({
      id,
      title,
      price,
      description: (d.description || describe(title)).trim(),
      image: imageFor(title),
      section: sectionFor(title),
    });
  }

  items.sort(
    (a, b) =>
      MENU_SECTIONS.indexOf(a.section) - MENU_SECTIONS.indexOf(b.section) ||
      a.price - b.price ||
      a.title.localeCompare(b.title)
  );

  cache = { at: Date.now(), items };
  return items;
}

export async function getMenuMap(): Promise<Map<string, MenuItem>> {
  return new Map((await getMenu()).map((i) => [i.id, i]));
}
