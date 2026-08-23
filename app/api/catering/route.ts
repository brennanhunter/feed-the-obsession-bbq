import { sendEmail } from "@/lib/mailer";
import { business } from "@/lib/business";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const name = String(b.name ?? "").trim();
  const email = String(b.email ?? "").trim();
  const phone = String(b.phone ?? "").trim();
  const eventDate = String(b.eventDate ?? "").trim();
  const guests = String(b.guests ?? "").trim();
  const eventType = String(b.eventType ?? "").trim();
  const details = String(b.details ?? "").trim();
  const honeypot = String(b.company ?? "").trim(); // bots fill this

  if (honeypot) return Response.json({ ok: true }); // silently drop
  if (!name || !email || !phone)
    return new Response("Name, email, and phone are required.", { status: 400 });
  if (!emailOk(email)) return new Response("Please enter a valid email.", { status: 400 });

  const row = (label: string, value: string) =>
    value ? `<p style="margin:4px 0"><strong>${label}:</strong> ${esc(value)}</p>` : "";

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:520px">
      <h2 style="margin:0 0 12px">New catering inquiry</h2>
      ${row("Name", name)}
      ${row("Email", email)}
      ${row("Phone", phone)}
      ${row("Event date", eventDate)}
      ${row("Guests", guests)}
      ${row("Event type", eventType)}
      ${details ? `<p style="margin:12px 0 4px"><strong>Details:</strong></p><p style="margin:0;white-space:pre-wrap">${esc(details)}</p>` : ""}
      <p style="margin:16px 0 0;color:#999;font-size:12px">Sent from the ${esc(business.name)} website catering form.</p>
    </div>`;

  const to = (process.env.CATERING_NOTIFY_TO ?? "contact@ftobbq.com,hunter@xtremery.com")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const res = await sendEmail({
    to,
    replyTo: email,
    subject: `Catering inquiry from ${name}${guests ? ` (${guests} guests)` : ""}`,
    html,
  });

  if (!res.ok)
    return new Response("Something went wrong. Please call us at " + business.phone, { status: 502 });
  return Response.json({ ok: true });
}
