import { createClient } from "jsr:@supabase/supabase-js@2";
import { CORS_HEADERS, json } from "../_shared/util.ts";

// Staff-only: requires header `x-staff-secret` matching the STAFF_SECRET env var.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { ...CORS_HEADERS, "Access-Control-Allow-Headers": CORS_HEADERS["Access-Control-Allow-Headers"] + ", x-staff-secret" },
    });
  }
  if (req.method !== "POST") return json({ ok: false, message: "Method not allowed" }, 405);

  const staffSecret = Deno.env.get("STAFF_SECRET");
  if (!staffSecret || req.headers.get("x-staff-secret") !== staffSecret) {
    return json({ ok: false, message: "Unauthorized" }, 401);
  }

  let body: { offer_code?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, message: "Invalid request." }, 400);
  }

  const code = typeof body.offer_code === "string" ? body.offer_code.trim().toUpperCase() : "";
  if (!code) return json({ ok: false, message: "No code provided." }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: row, error } = await supabase
    .from("subscribers")
    .select("email, offer_code, offer_code_redeemed, offer_code_redeemed_at, offer_event")
    .eq("offer_code", code)
    .maybeSingle();

  if (error) {
    console.error("redeem lookup error", error);
    return json({ ok: false, message: "Lookup failed." }, 500);
  }
  if (!row) return json({ ok: false, status: "not_found", message: "Code not found." }, 404);
  if (row.offer_code_redeemed) {
    return json({ ok: false, status: "already_used", message: `Already redeemed at ${row.offer_code_redeemed_at}.`, event: row.offer_event });
  }

  const { error: updErr } = await supabase
    .from("subscribers")
    .update({ offer_code_redeemed: true, offer_code_redeemed_at: new Date().toISOString() })
    .eq("offer_code", code)
    .eq("offer_code_redeemed", false);
  if (updErr) {
    console.error("redeem update error", updErr);
    return json({ ok: false, message: "Update failed." }, 500);
  }

  return json({ ok: true, status: "redeemed", message: "Valid — 2 free shots. Marked as used.", event: row.offer_event });
});
