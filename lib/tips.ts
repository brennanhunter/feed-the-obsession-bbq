// Tips on online orders. Shared by the /order page (picker + totals) and the
// checkout route (validation + the tip_money Square charges on top of the food).

export type TipChoice =
  | { kind: "none" }
  | { kind: "pct"; pct: number }
  | { kind: "flat"; cents: number }
  | { kind: "custom"; cents: number };

export const NO_TIP: TipChoice = { kind: "none" };
export const TIP_PCTS = [10, 15, 20] as const;
// Small orders get dollar buttons instead (a 10% tip on a $12 plate is $1.20,
// which reads oddly); same idea as Jersey Mike's / Square's "smart tips".
export const TIP_FLATS_CENTS = [100, 200, 300] as const;
export const FLAT_TIPS_UNDER_CENTS = 25_00;
// Cap so a typo in the custom box can't charge a fortune.
export const MAX_TIP_CENTS = 200_00;

// A percentage follows the cart as items come and go; a custom amount stays put.
export function tipCentsFor(choice: TipChoice, subtotalCents: number): number {
  if (choice.kind === "pct") return Math.round((subtotalCents * choice.pct) / 100);
  if (choice.kind === "flat") return choice.cents;
  if (choice.kind === "custom") return Math.min(MAX_TIP_CENTS, Math.max(0, Math.round(choice.cents)));
  return 0;
}
