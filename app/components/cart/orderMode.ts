// Dine-in, pickup or delivery, chosen on the menu or the order page so the two
// pages agree. Pickup/delivery is remembered in this browser (localStorage);
// dine-in only for this visit (sessionStorage), so a customer who scanned the
// bar card at McSorley's isn't stuck in dine-in next time they order from home.
// Client-only helpers.
import { DELIVERY_FLAG } from "@/lib/delivery";

export type OrderMode = "DINE_IN" | "PICKUP" | "DELIVERY";
const KEY = "fto-order-mode";
const DINE_KEY = "fto-dine-in";

export const MODE_LABEL: Record<OrderMode, string> = { DINE_IN: "Dine-in", PICKUP: "Pickup", DELIVERY: "Delivery" };

// The printed bar card's QR (/menu?utm_source=table_card) and /menu?mode=dine-in
// open the menu in Dine-in.
function fromBarCard(): boolean {
  const q = new URLSearchParams(window.location.search);
  return q.get("utm_source") === "table_card" || q.get("mode") === "dine-in";
}

// Delivery shows for everyone when NEXT_PUBLIC_DELIVERY=on. With "preview",
// only on browsers that opened /order?delivery=preview once (?delivery=off undoes it).
// Call only after hydration (reads window).
export function deliveryVisible(): boolean {
  if (DELIVERY_FLAG === "on") return true;
  if (DELIVERY_FLAG !== "preview") return false;
  const p = new URLSearchParams(window.location.search).get("delivery");
  try {
    if (p === "preview") localStorage.setItem("fto-delivery-preview", "1");
    if (p === "off") localStorage.removeItem("fto-delivery-preview");
    return localStorage.getItem("fto-delivery-preview") === "1";
  } catch {
    return p === "preview";
  }
}

// Modes offered right now (delivery only when the delivery flag shows it).
export function modesAvailable(): OrderMode[] {
  return deliveryVisible() ? ["DINE_IN", "PICKUP", "DELIVERY"] : ["DINE_IN", "PICKUP"];
}

export function readOrderMode(): OrderMode {
  if (typeof window === "undefined") return "PICKUP";
  try {
    if (fromBarCard()) sessionStorage.setItem(DINE_KEY, "1");
    if (sessionStorage.getItem(DINE_KEY) === "1") return "DINE_IN";
    return localStorage.getItem(KEY) === "DELIVERY" ? "DELIVERY" : "PICKUP";
  } catch {
    return fromBarCard() ? "DINE_IN" : "PICKUP";
  }
}

export function saveOrderMode(m: OrderMode) {
  try {
    if (m === "DINE_IN") {
      sessionStorage.setItem(DINE_KEY, "1");
    } else {
      sessionStorage.removeItem(DINE_KEY);
      localStorage.setItem(KEY, m);
    }
  } catch {
    /* private mode etc. — the choice just won't carry over */
  }
}
