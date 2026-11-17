// Smoke checks against a deployed Worker with writes closed (MIGRATION-PLAN 2.8 step 0 and 3.2).
// Usage: node test/smoke.mjs https://latribu.ignacioraposo.workers.dev
const base = process.argv[2];
if (!base) throw new Error("usage: node test/smoke.mjs <base-url>");
const MAINT = { success: false, ok: false, message: "La Tribu is down for a short maintenance. Please try again in a few minutes." };
let failed = 0;
async function check(name, path, init, expectStatus, expectBody) {
  const res = await fetch(base + path, { redirect: "manual", ...init });
  const text = await res.text();
  let ok = res.status === expectStatus;
  if (ok && expectBody !== undefined) ok = JSON.stringify(JSON.parse(text)) === JSON.stringify(expectBody);
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: ${res.status}${ok ? "" : ` (wanted ${expectStatus}) ${text.slice(0, 120)}`}`);
  return res;
}
const post = (body, headers = {}) => ({ method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

// Write fence: every write route answers 503 and writes nothing.
await check("subscribe fenced", "/api/subscribe", post({ email: "smoke@example.com" }), 503, MAINT);
await check("contact fenced", "/api/contact", post({ name: "Smoke", email: "smoke@example.com", message: "x" }), 503, MAINT);
await check("redeem fenced", "/api/redeem", post({ offer_code: "AAAA-BBBB-CCCC" }, { "x-staff-secret": "x" }), 503, MAINT);
await check("subscribe PUT fenced", "/api/subscribe", { method: "PUT" }, 503, MAINT);
// Reads and preflights stay up.
await check("past-events read", "/api/past-events", {}, 200, []);
await check("subscribe preflight", "/api/subscribe", { method: "OPTIONS" }, 200);
const pre = await check("redeem preflight", "/api/redeem", { method: "OPTIONS" }, 200);
if (!pre.headers.get("access-control-allow-headers")?.includes("x-staff-secret")) { failed++; console.log("FAIL redeem preflight header"); }
await check("unknown api path", "/api/nope", {}, 404, { success: false, message: "Not found" });
// Pages, with the security headers.
for (const p of ["/", "/index.html", "/venues.html", "/djs.html", "/promotions.html", "/past-events.html", "/redeem.html", "/robots.txt", "/sitemap.xml"]) {
  const res = await check(`page ${p}`, p, {}, 200);
  const csp = res.headers.get("content-security-policy") || "";
  const connectSrc = csp.split(";").map((d) => d.trim()).find((d) => d.startsWith("connect-src"));
  if (connectSrc !== "connect-src 'self'" || res.headers.get("x-frame-options") !== "DENY") {
    failed++; console.log(`FAIL headers ${p}`);
  }
}
// Asset boundary: nothing outside public/ is served.
for (const p of ["/worker/index.ts", "/migrations/d1/0001_init.sql", "/AGENTS.md", "/CLAUDE.md", "/.mcp.json", "/package.json",
  "/wrangler.jsonc", "/vercel.json", "/.git/HEAD", "/supabase/functions/subscribe/index.ts", "/_headers", "/public/index.html", "/venues"]) {
  await check(`not served ${p}`, p, {}, 404);
}
console.log(failed ? `${failed} FAILED` : "ALL PASS");
process.exit(failed ? 1 : 0);
