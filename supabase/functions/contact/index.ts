import { createClient } from "jsr:@supabase/supabase-js@2";
import { CORS_HEADERS, isValidEmail, json, sendEmail } from "../_shared/util.ts";

const TO = "raposo.ignacio@gmail.com";
const CC = "iamdjfabio@gmail.com";
const FROM = "La Tribu <hola@latribu.co.uk>";

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ success: false, message: "Method not allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, message: "Invalid request." }, 400);
  }

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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Store first (backup) so an enquiry is never lost even if email fails.
  const { error: dbErr } = await supabase
    .from("contact_messages")
    .insert({ name, venue: venue || null, email, message });
  if (dbErr) console.error("contact insert error", dbErr);

  const apiKey = Deno.env.get("RESEND_API_KEY");
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
      to: TO,
      cc: CC,
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
});
