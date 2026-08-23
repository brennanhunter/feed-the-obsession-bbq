import { Resend, type CreateEmailOptions } from "resend";

// Resend wrapper for FTO order confirmations. The SDK does NOT throw on
// failure — it resolves { data, error } — so we check for the id and log
// loudly. Client is built lazily so a missing key never crashes checkout.
let client: Resend | null = null;
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

const DEFAULT_FROM =
  process.env.FTO_ORDER_FROM ?? "Feed The Obsession BBQ <orders@feedtheobsessionbbq.com>";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  from?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  const resend = getClient();
  if (!resend) {
    console.warn("[mailer] RESEND_API_KEY not set — skipping confirmation email.");
    return { ok: false, error: "Email not configured" };
  }

  const { from = DEFAULT_FROM, ...rest } = opts;
  const payload: CreateEmailOptions = {
    from,
    to: rest.to,
    subject: rest.subject,
    replyTo: rest.replyTo,
    ...(rest.html ? { html: rest.html } : { text: rest.text ?? "" }),
  };

  try {
    const res = await resend.emails.send(payload);
    if (res.data?.id) return { ok: true };
    console.error("[mailer] send failed:", res.error?.message, { to: rest.to });
    return { ok: false, error: res.error?.message };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[mailer] send threw:", message, { to: rest.to });
    return { ok: false, error: message };
  }
}
