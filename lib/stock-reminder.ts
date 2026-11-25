// The crew's morning check, emailed before opening by the daily stock run:
// what's still marked sold out in Square (switches stay marked until someone
// unmarks them), and how to bring it back or mark something out.
import type { SyncResult } from "./stock-sync";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function stockReminder(r: Pick<SyncResult, "out" | "handOut">): { subject: string; text: string; html: string } {
  const anyOut = r.out.length + r.handOut.length > 0;
  const subject = r.out.length
    ? `Morning check: ${r.out.join(", ")} still marked OUT`
    : r.handOut.length
      ? `Morning check: ${r.handOut.length} item${r.handOut.length > 1 ? "s" : ""} still marked sold out`
      : "Morning check: everything is marked in stock";

  const lines: string[] = ["Good morning! Before you open, check what Square has marked sold out.", ""];
  if (r.out.length) lines.push(`Ingredients still marked OUT: ${r.out.join(", ")}`);
  if (r.handOut.length) lines.push(`Items still marked sold out: ${r.handOut.join(", ")}`);
  if (!anyOut) lines.push("Nothing is marked out. Everything is on sale on the website, the register and DoorDash.");
  lines.push("");
  if (anyOut)
    lines.push(
      "Have any of these today? Find it in Square (ingredients are named like \"Ribs (ingredient)\") and turn Sold out off. It comes back on the website, register and DoorDash in a couple of minutes.",
      ""
    );
  lines.push(
    "Run out during the day? Mark the ingredient sold out, like \"Ribs (ingredient)\". That one tap takes every rib item and the Ribs combo pick off the website, register and DoorDash."
  );
  const text = lines.join("\n");

  const li = (items: string[]) => items.map((i) => `<li>${esc(i)}</li>`).join("");
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#201a16">
<p>Good morning! Before you open, check what Square has marked sold out.</p>
${r.out.length ? `<p style="margin-bottom:4px"><strong>Ingredients still marked OUT:</strong></p><ul style="margin-top:0">${li(r.out)}</ul>` : ""}
${r.handOut.length ? `<p style="margin-bottom:4px"><strong>Items still marked sold out:</strong></p><ul style="margin-top:0">${li(r.handOut)}</ul>` : ""}
${anyOut ? `<p><strong>Have any of these today?</strong> Find it in Square (ingredients are named like "Ribs (ingredient)") and turn <em>Sold out</em> off. It comes back on the website, register and DoorDash in a couple of minutes.</p>` : `<p>Nothing is marked out. Everything is on sale on the website, the register and DoorDash.</p>`}
<p><strong>Run out during the day?</strong> Mark the ingredient sold out, like "Ribs (ingredient)". That one tap takes every rib item and the Ribs combo pick off the website, register and DoorDash.</p>
</div>`;
  return { subject, text, html };
}
