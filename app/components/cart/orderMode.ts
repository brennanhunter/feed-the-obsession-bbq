// Pickup or delivery, chosen on the menu or the order page and remembered in
// this browser so the two pages agree. Client-only helpers (localStorage).
import { DELIVERY_FLAG } from "@/lib/delivery";

export type OrderMode = "PICKUP" | "DELIVERY";
const KEY = "fto-order-mode";

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

export function readOrderMode(): OrderMode {
  if (typeof window === "undefined") return "PICKUP";
  try {
    return localStorage.getItem(KEY) === "DELIVERY" ? "DELIVERY" : "PICKUP";
  } catch {
    return "PICKUP";
  }
}

export function saveOrderMode(m: OrderMode) {
  try {
    localStorage.setItem(KEY, m);
  } catch {
    /* private mode etc. — the choice just won't carry over */
  }
}
