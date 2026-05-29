import { createClient } from "jsr:@supabase/supabase-js@2";
import { CORS_HEADERS, generateOfferCode, isLondonDate, isValidEmail, json, sendEmail } from "../_shared/util.ts";
import { welcomeEmail } from "../_shared/emails.ts";

const OFFER_DATE = "2026-05-29"; // codes only minted for signups on this London date
const OFFER_EVENT = "2026-07-09";
const EVENT_LABEL = "9 July 2026";
const FROM = "La Tribu <hola@latribu.co.uk>";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ success: false, message: "Method not allowed" }, 405);

  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ success: false, message: "Invalid request." }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return json({ success: false, message: "Please enter a valid email address." }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const offerActive = isLondonDate(OFFER_DATE);
  const offerCode = offerActive ? generateOfferCode() : null;

  // Insert; rely on unique(email) to detect duplicates.
  const { data: inserted, error } = await supabase
    .from("subscribers")
    .insert({
      email,
      source: "website",
      offer_code: offerCode,
      offer_event: offerCode ? OFFER_EVENT : null,
    })
    .select("offer_code")
    .single();

  if (error) {
    if (error.code === "23505") {
      // Already subscribed. Do NOT mint a new code; return existing one if present.
      const { data: existing } = await supabase
        .from("subscribers")
        .select("offer_code")
        .eq("email", email)
        .single();
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

  const code = inserted?.offer_code ?? null;

  // Best-effort welcome email: never block signup on email failure.
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (apiKey) {
    try {
      const mail = welcomeEmail({ offerCode: code, eventLabel: EVENT_LABEL });
      await sendEmail({ apiKey, from: FROM, to: email, subject: mail.subject, html: mail.html, text: mail.text });
      await supabase.from("subscribers").update({ welcome_sent_at: new Date().toISOString() }).eq("email", email);
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
});
