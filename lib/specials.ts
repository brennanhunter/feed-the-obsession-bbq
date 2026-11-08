// Day rules for the Smoke Schedule. Square has no per-day availability, so the
// rule is derived from the item name (owner's schedule, Oct 2026) and enforced
// both in the menu UI (client, Eastern time) and in /api/checkout (server).
import { getETDateParts } from "./hours";

export type SpecialRule =
  | { kind: "weekday"; weekday: string } // "Monday" … "Friday"
  | { kind: "first-friday" } // 50¢ wings
  | { kind: "alt-thursday" }; // $19.99 rack, every other Thursday

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// First Thursday the rib special ran, used to work out "every other" week.
// Confirm with the owner; until then every Thursday is treated as a rib-special day.
export const RIB_SPECIAL_ANCHOR: string | null = null; // e.g. "2026-10-16"

export function specialRuleFor(title: string): SpecialRule | undefined {
  const t = title.toLowerCase();
  if (!t.includes("special")) return undefined;
  if (t.includes("wing special") || t.includes("50")) return { kind: "first-friday" };
  if (t.includes("rib special")) return { kind: "alt-thursday" };
  const day = WEEKDAYS.find((d) => t.includes(d.toLowerCase()));
  return day ? { kind: "weekday", weekday: day } : undefined;
}

export function specialLabel(rule: SpecialRule): string {
  switch (rule.kind) {
    case "weekday":
      return `${rule.weekday}s only`;
    case "first-friday":
      return "First Friday of the month only";
    case "alt-thursday":
      return "Every other Thursday";
  }
}

/** Is the special on the menu for the given moment (shop time)? */
export function isSpecialAvailable(rule: SpecialRule, at: Date = new Date()): boolean {
  const p = getETDateParts(at);
  switch (rule.kind) {
    case "weekday":
      return p.weekday === rule.weekday;
    case "first-friday":
      return p.weekday === "Friday" && p.day <= 7;
    case "alt-thursday": {
      if (p.weekday !== "Thursday") return false;
      if (!RIB_SPECIAL_ANCHOR) return true;
      const [y, m, d] = RIB_SPECIAL_ANCHOR.split("-").map(Number);
      const anchor = Date.UTC(y, m - 1, d);
      const today = Date.UTC(p.year, p.month - 1, p.day);
      const weeks = Math.round((today - anchor) / (7 * 86_400_000));
      return weeks % 2 === 0;
    }
  }
}
