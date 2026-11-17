// The three Supabase edge functions (supabase/functions/{subscribe,contact,redeem})
// ported to D1, plus the public past-events read that the browser used to make
// with the Supabase anon key. Request and response bodies are unchanged.
import { welcomeEmail } from "./emails";
import {
  CORS_HEADERS,
  generateOfferCode,
  isLondonDate,
  isStorableSubscriberEmail,
  isValidEmail,
  json,
  sendEmail,
} from "./util";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  WRITES_ENABLED?: string;
  CRONS_ENABLED?: string;
  RESEND_API_KEY?: string;
  STAFF_SECRET?: string;
}

const OFFER_DATE = "2026-05-29"; // codes only minted for signups on this London date
const OFFER_EVENT = "2026-07-09";
const EVENT_LABEL = "9 July 2026";
const FROM = "La Tribu <hola@latribu.co.uk>";
const CONTACT_TO = "raposo.ignacio@gmail.com";
const CONTACT_CC = "iamdjfabio@gmail.com";

const now = () => new Date().toISOString();

async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export async function subscribe(req: Request, env: Env): Promise<Response> {
  if (req.method !== "POST") return json({ success: false, message: "Method not allowed" }, 405);

  const body = await readJson<{ email?: unknown }>(req);
  if (!body) return json({ success: false, message: "Invalid request." }, 400);

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email) || !isStorableSubscriberEmail(email)) {
    return json({ success: false, message: "Please enter a valid email address." }, 400);
  }

  const offerActive = isLondonDate(OFFER_DATE);
  const code = offerActive ? generateOfferCode() : null;

  // Insert; rely on UNIQUE(email) to detect duplicates (Postgres 23505 before).
  try {
    await env.DB.prepare(
      "INSERT INTO subscribers (id, email, subscribed_at, source, offer_code, offer_event) VALUES (?, ?, ?, 'website', ?, ?)",
    )
      .bind(crypto.randomUUID(), email, now(), code, code ? OFFER_EVENT : null)
      .run();
  } catch (error) {
    if (String(error).includes("UNIQUE constraint failed: subscribers.email")) {
      // Already subscribed. Do NOT mint a new code; return existing one if present.
      const existing = await env.DB.prepare("SELECT offer_code FROM subscribers WHERE email = ?")
        .bind(email)
        .first<{ offer_code: string | null }>();
      return json({
        success: true,
        already: true,
        offer_code: existing?.offer_code ?? null,
        message: existing?.offer_code
          ? `You're already in! Your code is ${existing.offer_code}.`
          : "You're already subscribed!",
      });
    }
    console.error("subscribe insert error", error);
    return json({ success: false, message: "Something went wrong. Please try again." }, 500);
  }

  // Best-effort welcome email: never block signup on email failure.
  const apiKey = env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const mail = welcomeEmail({ offerCode: code, eventLabel: EVENT_LABEL });
      await sendEmail({ apiKey, from: FROM, to: email, subject: mail.subject, html: mail.html, text: mail.text });
      await env.DB.prepare("UPDATE subscribers SET welcome_sent_at = ? WHERE email = ?").bind(now(), email).run();
    } catch (e) {
      console.error("welcome email failed", e);
    }
  } else {
    console.error("RESEND_API_KEY not set — welcome email skipped");
  }

  return json({
    success: true,
    offer_code: code,
    message: code
      ? `Welcome to La Tribu! Your code for 2 free shots on ${EVENT_LABEL}: ${code}`
      : "Welcome to La Tribu! 🎉",
  });
}

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}

export async function contact(req: Request, env: Env): Promise<Response> {
  if (req.method !== "POST") return json({ success: false, message: "Method not allowed" }, 405);

  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return json({ success: false, message: "Invalid request." }, 400);

  const name = clean(body.name, 200);
  const venue = clean(body.venue, 200);
  const email = clean(body.email, 254).toLowerCase();
  const message = clean(body.message, 5000);

  if (!name || !email || !message) {
    return json({ success: false, message: "Please fill in name, email and message." }, 400);
  }
  if (!isValidEmail(email)) {
    return json({ success: false, message: "Please enter a valid email address." }, 400);
  }

  // Store first (backup) so an enquiry is never lost even if email fails.
  try {
    await env.DB.prepare(
      "INSERT INTO contact_messages (id, name, venue, email, message, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
      .bind(crypto.randomUUID(), name, venue || null, email, message, now())
      .run();
  } catch (dbErr) {
    console.error("contact insert error", dbErr);
  }

  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY not set — contact email skipped");
    // Still succeeded in storing; tell the user we got it.
    return json({ success: true, message: "Thanks! We've received your message and will be in touch." });
  }

  const html = `<table role="presentation" cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#12100e;">
    <tr><td><strong>Name:</strong> ${esc(name)}</td></tr>
    <tr><td><strong>Venue:</strong> ${esc(venue) || "&mdash;"}</td></tr>
    <tr><td><strong>Email:</strong> ${esc(email)}</td></tr>
    <tr><td style="padding-top:10px;"><strong>Message:</strong><br>${esc(message).replace(/\n/g, "<br>")}</td></tr>
  </table>`;
  const text = `New venue enquiry\n\nName: ${name}\nVenue: ${venue || "-"}\nEmail: ${email}\n\n${message}`;

  try {
    await sendEmail({
      apiKey,
      from: FROM,
      to: CONTACT_TO,
      cc: CONTACT_CC,
      replyTo: email,
      subject: `New venue enquiry${venue ? ` — ${venue}` : ""}`,
      html,
      text,
    });
  } catch (e) {
    console.error("contact email failed", e);
    // DB has it; report soft success so the user isn't told to retry endlessly.
    return json({ success: true, message: "Thanks! We've received your message and will be in touch." });
  }

  return json({ success: true, message: "Thank you! We will be in touch soon about your venue." });
}

export const REDEEM_PREFLIGHT_HEADERS = {
  ...CORS_HEADERS,
  "Access-Control-Allow-Headers": CORS_HEADERS["Access-Control-Allow-Headers"] + ", x-staff-secret",
};

// Staff-only: requires header `x-staff-secret` matching the STAFF_SECRET secret.
export async function redeem(req: Request, env: Env): Promise<Response> {
  if (req.method !== "POST") return json({ ok: false, message: "Method not allowed" }, 405);

  const staffSecret = env.STAFF_SECRET;
  if (!staffSecret || req.headers.get("x-staff-secret") !== staffSecret) {
    return json({ ok: false, message: "Unauthorized" }, 401);
  }

  const body = await readJson<{ offer_code?: unknown }>(req);
  if (!body) return json({ ok: false, message: "Invalid request." }, 400);

  const code = typeof body.offer_code === "string" ? body.offer_code.trim().toUpperCase() : "";
  if (!code) return json({ ok: false, message: "No code provided." }, 400);

  let row: { offer_code_redeemed: number; offer_code_redeemed_at: string | null; offer_event: string | null } | null;
  try {
    row = await env.DB.prepare(
      "SELECT offer_code_redeemed, offer_code_redeemed_at, offer_event FROM subscribers WHERE offer_code = ?",
    )
      .bind(code)
      .first();
  } catch (error) {
    console.error("redeem lookup error", error);
    return json({ ok: false, message: "Lookup failed." }, 500);
  }
  if (!row) return json({ ok: false, status: "not_found", message: "Code not found." }, 404);
  if (row.offer_code_redeemed) {
    return json({
      ok: false,
      status: "already_used",
      message: `Already redeemed at ${row.offer_code_redeemed_at}.`,
      event: row.offer_event,
    });
  }

  try {
    await env.DB.prepare(
      "UPDATE subscribers SET offer_code_redeemed = 1, offer_code_redeemed_at = ? WHERE offer_code = ? AND offer_code_redeemed = 0",
    )
      .bind(now(), code)
      .run();
  } catch (updErr) {
    console.error("redeem update error", updErr);
    return json({ ok: false, message: "Update failed." }, 500);
  }

  return json({ ok: true, status: "redeemed", message: "Valid — 2 free shots. Marked as used.", event: row.offer_event });
}

// Public list, newest first. Replaces the browser's anon-key read of past_events.
export async function pastEvents(req: Request, env: Env): Promise<Response> {
  if (req.method !== "GET" && req.method !== "HEAD") return json({ success: false, message: "Method not allowed" }, 405);
  const { results } = await env.DB.prepare("SELECT * FROM past_events ORDER BY date DESC").all();
  return json(results);
}
