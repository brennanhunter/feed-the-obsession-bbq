// Website delivery (Uber Direct, run on Xtremery's account). Shared by the /order
// page and the checkout/quote routes, so client and server agree on the rules.
//
// Pricing (Hunter, 2026-11-20): food at shop prices, so FTO makes what it makes
// in person; Uber's delivery fee passed through at cost; a service fee of 10%
// (the Xtremery cut) + $1 that stays with FTO, so a website delivery pays FTO a
// little MORE than a walk-in; and an optional driver tip, 100% to the driver.

// "on" = everyone sees Delivery. "preview" = only browsers that opened
// /order?delivery=preview once (for testing and Uber's pilot). Anything else = off.
export const DELIVERY_FLAG = process.env.NEXT_PUBLIC_DELIVERY ?? "";
export const deliveryAllowedOnServer = () => DELIVERY_FLAG === "on" || DELIVERY_FLAG === "preview";

export const DELIVERY_MIN_CENTS = 20_00; // food subtotal, before tax and fees

// Delivery zone: ZIP codes within roughly 8 miles of the shop, so BBQ shows up
// hot (Uber itself will go ~10+ miles). Plus a price cap as a backstop: Uber's
// fee climbs with distance, so an unusually far address inside a big ZIP is
// still turned away.
export const DELIVERY_ZIPS: Record<string, string> = {
  "32720": "DeLand",
  "32723": "DeLand (Stetson)",
  "32724": "DeLand",
  "32763": "Orange City",
  "32744": "Lake Helen",
  "32130": "De Leon Springs",
  "32722": "Glenwood",
};
export const DELIVERY_AREA_LABEL = "DeLand, Orange City, Lake Helen, De Leon Springs and Glenwood";
export const MAX_DELIVERY_FEE_CENTS = 14_99;
export const zipDeliverable = (zip: string) => zip in DELIVERY_ZIPS;
export const SERVICE_FEE_PCT = 10; // Xtremery's cut (Hunter invoices this part)
export const FTO_DELIVERY_BONUS_CENTS = 100; // stays with FTO on every website delivery
export const xtremeryFeeCents = (foodCents: number) => Math.round((foodCents * SERVICE_FEE_PCT) / 100);
export const serviceFeeCents = (foodCents: number) => xtremeryFeeCents(foodCents) + FTO_DELIVERY_BONUS_CENTS;

// Driver tip buttons ($3 / $5 / $7 + Other); a flat amount reads right for a driver.
export const DRIVER_TIP_FLATS_CENTS = [300, 500, 700] as const;

// Minutes from order to food-ready, so the driver isn't standing at the window.
export const PREP_MINUTES = 20;
// A scheduled pickup gives the driver a 30-minute window to grab it.
export const SCHEDULED_PICKUP_WINDOW_MINUTES = 30;

export type DeliveryAddress = { street: string; unit?: string; city: string; zip: string; notes?: string };

export function cleanAddress(a: Partial<DeliveryAddress> | undefined): DeliveryAddress | null {
  if (!a) return null;
  const street = String(a.street ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  const unit = String(a.unit ?? "").replace(/\s+/g, " ").trim().slice(0, 40) || undefined;
  const city = String(a.city ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  const zip = String(a.zip ?? "").replace(/\D/g, "").slice(0, 5);
  const notes = String(a.notes ?? "").replace(/\s+/g, " ").trim().slice(0, 200) || undefined;
  if (street.length < 4 || !/\d/.test(street) || city.length < 2 || zip.length !== 5) return null;
  return { street, unit, city, zip, notes };
}

export const addressLine = (a: DeliveryAddress) =>
  `${a.street}${a.unit ? `, ${a.unit}` : ""}, ${a.city}, FL ${a.zip}`;

// US phone -> E.164 (+1XXXXXXXXXX), which Uber needs for the driver to call/text.
export function e164(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return null;
}
