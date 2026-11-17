import { env } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../worker/index";
import type { Env } from "../worker/routes";
import { isOpen, MAINTENANCE_MESSAGE } from "../worker/switches";

const ORIGIN = "https://latribu.test";
const OPEN: Env = { ...env, WRITES_ENABLED: "true" };

function call(path: string, init: RequestInit = {}, e: Env = OPEN): Promise<Response> {
  return worker.fetch(new Request(ORIGIN + path, init), e);
}
let ipCounter = 0;
function post(path: string, body: unknown, headers: Record<string, string> = {}, e: Env = OPEN) {
  return call(path, {
    method: "POST",
    // A fresh IP per call keeps the real local rate-limit bindings out of unrelated tests.
    headers: { "Content-Type": "application/json", "cf-connecting-ip": `203.0.113.${(++ipCounter % 250) + 1}`, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }, e);
}

let n = 0;
const uniqueEmail = () => `test${++n}.${Date.now()}@example.com`;

// Mocked Resend: every outbound fetch is captured, nothing leaves the test.
let resend: ReturnType<typeof vi.fn>;
beforeEach(() => {
  resend = vi.fn(async () => new Response(JSON.stringify({ id: "mock" }), { status: 200 }));
  vi.spyOn(globalThis, "fetch").mockImplementation(resend as typeof fetch);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const resendPayload = (i = 0) => JSON.parse(resend.mock.calls[i][1].body as string);

it("entry module exports only the handler (workerd rejects other named exports)", async () => {
  expect(Object.keys(await import("../worker/index"))).toEqual(["default"]);
});

describe("switches: only the exact string \"true\" opens", () => {
  it.each([
    [undefined, false], ["false", false], ["maintenance", false], ["TRUE", false], [" true", false], ["yes", false], ["true", true],
  ])("isOpen(%j) is %s", (value, expected) => {
    expect(isOpen(value as string | undefined)).toBe(expected);
  });

  it.each([undefined, "false", "maintenance", "typo"])("WRITES_ENABLED=%j closes every write route with 503", async (value) => {
    const closed: Env = { ...env, WRITES_ENABLED: value };
    const email = uniqueEmail();
    for (const [path, body] of [
      ["/api/subscribe", { email }],
      ["/api/contact", { name: "A", email, message: "Hi" }],
      ["/api/redeem", { offer_code: "AAAA-BBBB-CCCC" }],
    ] as const) {
      const res = await post(path, body, { "x-staff-secret": env.STAFF_SECRET! }, closed);
      expect(res.status, path).toBe(503);
      expect(await res.json()).toEqual({ success: false, ok: false, message: MAINTENANCE_MESSAGE });
    }
    expect(await env.DB.prepare("SELECT count(*) AS c FROM subscribers WHERE email = ?").bind(email).first("c")).toBe(0);
    expect(await env.DB.prepare("SELECT count(*) AS c FROM contact_messages WHERE email = ?").bind(email).first("c")).toBe(0);
    expect(resend).not.toHaveBeenCalled();
  });

  it("reads and preflights still work while writes are closed", async () => {
    const closed: Env = { ...env, WRITES_ENABLED: "false" };
    expect((await call("/api/past-events", {}, closed)).status).toBe(200);
    expect((await call("/api/subscribe", { method: "OPTIONS" }, closed)).status).toBe(200);
  });

  it("logs write_start and write_end around an admitted write", async () => {
    const log = vi.spyOn(console, "log");
    await post("/api/subscribe", { email: uniqueEmail() });
    const events = log.mock.calls.map(([line]) => JSON.parse(String(line)));
    expect(events.map((e) => e.evt)).toEqual(["write_start", "write_end"]);
    expect(events[0].rid).toBe(events[1].rid);
    expect(events[1].status).toBe(200);
  });

  it("scheduled() does nothing unless CRONS_ENABLED is \"true\"", async () => {
    await expect(worker.scheduled({} as ScheduledController, { ...env, CRONS_ENABLED: "maintenance" })).resolves.toBeUndefined();
  });
});

describe("POST /api/subscribe", () => {
  it("inserts once, sends the welcome email, and is idempotent on the same email", async () => {
    const email = uniqueEmail();
    const first = await post("/api/subscribe", { email: `  ${email.toUpperCase()} ` });
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ success: true, offer_code: null, message: "Welcome to La Tribu! 🎉" });

    expect(resend).toHaveBeenCalledTimes(1);
    expect(resend.mock.calls[0][0]).toBe("https://api.resend.com/emails");
    expect(resendPayload()).toMatchObject({ from: "La Tribu <hola@latribu.co.uk>", to: email });
    const row = await env.DB.prepare("SELECT * FROM subscribers WHERE email = ?").bind(email).first<Record<string, unknown>>();
    expect(row).toMatchObject({ source: "website", offer_code: null, offer_code_redeemed: 0 });
    expect(row!.subscribed_at).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
    expect(row!.welcome_sent_at).toMatch(/Z$/);

    const again = await post("/api/subscribe", { email });
    expect(again.status).toBe(200);
    expect(await again.json()).toEqual({ success: true, already: true, offer_code: null, message: "You're already subscribed!" });
    expect(await env.DB.prepare("SELECT count(*) AS c FROM subscribers WHERE email = ?").bind(email).first("c")).toBe(1);
    expect(resend).toHaveBeenCalledTimes(1);
  });

  it("mints a code only on the offer date (London) and returns the same code on repeat", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-05-29T12:00:00Z"));
    const email = uniqueEmail();
    const body = (await (await post("/api/subscribe", { email })).json()) as { offer_code: string; message: string };
    expect(body.offer_code).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect(body.message).toBe(`Welcome to La Tribu! Your code for 2 free shots on 9 July 2026: ${body.offer_code}`);
    const row = await env.DB.prepare("SELECT offer_code, offer_event FROM subscribers WHERE email = ?").bind(email).first();
    expect(row).toEqual({ offer_code: body.offer_code, offer_event: "2026-07-09" });

    const again = (await (await post("/api/subscribe", { email })).json()) as Record<string, unknown>;
    expect(again).toEqual({ success: true, already: true, offer_code: body.offer_code, message: `You're already in! Your code is ${body.offer_code}.` });
  });

  it("still succeeds when Resend fails, without marking the welcome as sent", async () => {
    resend.mockImplementation(async () => new Response("down", { status: 500 }));
    const email = uniqueEmail();
    expect((await post("/api/subscribe", { email })).status).toBe(200);
    expect(await env.DB.prepare("SELECT welcome_sent_at FROM subscribers WHERE email = ?").bind(email).first("welcome_sent_at")).toBeNull();
  });

  it("skips the email when RESEND_API_KEY is unset", async () => {
    expect((await post("/api/subscribe", { email: uniqueEmail() }, {}, { ...OPEN, RESEND_API_KEY: undefined })).status).toBe(200);
    expect(resend).not.toHaveBeenCalled();
  });

  it.each([
    ["not json", "{", 400, "Invalid request."],
    ["bad email", { email: "nope" }, 400, "Please enter a valid email address."],
    ["email the old Postgres CHECK rejected", { email: "a@b.c1" }, 400, "Please enter a valid email address."],
  ])("rejects %s", async (_label, body, status, message) => {
    const res = await post("/api/subscribe", body);
    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({ success: false, message });
  });

  it("answers OPTIONS with the CORS headers and other methods with 405", async () => {
    const pre = await call("/api/subscribe", { method: "OPTIONS" });
    expect(await pre.text()).toBe("ok");
    expect(pre.headers.get("Access-Control-Allow-Methods")).toBe("POST, OPTIONS");
    const get = await call("/api/subscribe");
    expect(get.status).toBe(405);
    expect(await get.json()).toEqual({ success: false, message: "Method not allowed" });
  });
});

describe("POST /api/contact", () => {
  it("stores the message and emails the team through Resend", async () => {
    const email = uniqueEmail();
    const res = await post("/api/contact", { name: " Ana ", venue: "Bar <X>", email, message: "Line 1\nLine 2" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, message: "Thank you! We will be in touch soon about your venue." });
    expect(await env.DB.prepare("SELECT name, venue, message FROM contact_messages WHERE email = ?").bind(email).first())
      .toEqual({ name: "Ana", venue: "Bar <X>", message: "Line 1\nLine 2" });
    expect(resendPayload()).toMatchObject({
      to: "raposo.ignacio@gmail.com",
      cc: "iamdjfabio@gmail.com",
      reply_to: email,
      subject: "New venue enquiry — Bar <X>",
    });
    expect(resendPayload().html).toContain("Bar &lt;X&gt;");
    expect(resendPayload().html).toContain("Line 1<br>Line 2");
  });

  it("stores with a null venue and reports soft success when Resend fails", async () => {
    resend.mockImplementation(async () => new Response("down", { status: 500 }));
    const email = uniqueEmail();
    const res = await post("/api/contact", { name: "Ana", email, message: "Hi" });
    expect(await res.json()).toEqual({ success: true, message: "Thanks! We've received your message and will be in touch." });
    expect(await env.DB.prepare("SELECT venue FROM contact_messages WHERE email = ?").bind(email).first("venue")).toBeNull();
  });

  it("returns a retryable 503 when both the D1 insert and the email fail", async () => {
    resend.mockImplementation(async () => new Response("down", { status: 503 }));
    const failingDb = { prepare: () => { throw new Error("D1 down"); } } as unknown as D1Database;
    const res = await post("/api/contact", { name: "Ana", email: uniqueEmail(), message: "Hi" }, {}, { ...OPEN, DB: failingDb });
    expect(res.status).toBe(503);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(await res.json()).toMatchObject({ success: false });
  });

  it("returns a retryable 503 when the insert fails and RESEND_API_KEY is unset", async () => {
    const failingDb = { prepare: () => { throw new Error("D1 down"); } } as unknown as D1Database;
    const res = await post("/api/contact", { name: "Ana", email: uniqueEmail(), message: "Hi" }, {}, { ...OPEN, DB: failingDb, RESEND_API_KEY: undefined });
    expect(res.status).toBe(503);
  });

  it("still succeeds when only the insert fails but the email is sent", async () => {
    const failingDb = { prepare: () => { throw new Error("D1 down"); } } as unknown as D1Database;
    const res = await post("/api/contact", { name: "Ana", email: uniqueEmail(), message: "Hi" }, {}, { ...OPEN, DB: failingDb });
    expect(res.status).toBe(200);
    expect(resend).toHaveBeenCalledTimes(1);
  });

  it("stores without emailing when RESEND_API_KEY is unset", async () => {
    const res = await post("/api/contact", { name: "Ana", email: uniqueEmail(), message: "Hi" }, {}, { ...OPEN, RESEND_API_KEY: undefined });
    expect(await res.json()).toEqual({ success: true, message: "Thanks! We've received your message and will be in touch." });
    expect(resend).not.toHaveBeenCalled();
  });

  it.each([
    [{ name: "Ana", email: "a@example.com" }, "Please fill in name, email and message."],
    [{ name: "Ana", email: "bad", message: "Hi" }, "Please enter a valid email address."],
  ])("rejects %j", async (body, message) => {
    const res = await post("/api/contact", body);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, message });
  });
});

describe("rate limiting", () => {
  const limiter = (allow: number) => {
    let used = 0;
    return { limit: vi.fn(async () => ({ success: used++ < allow })) } as unknown as RateLimit;
  };

  it.each([
    ["/api/subscribe", "SUBSCRIBE_LIMITER", () => ({ email: uniqueEmail() })],
    ["/api/contact", "CONTACT_LIMITER", () => ({ name: "Ana", email: uniqueEmail(), message: "Hi" })],
  ] as const)("%s returns 429 before touching D1 or Resend once the per-IP limit is hit", async (path, binding, body) => {
    const lim = limiter(1);
    const e: Env = { ...OPEN, [binding]: lim };
    const ip = { "cf-connecting-ip": "198.51.100.7" };
    expect((await post(path, body(), ip, e)).status).toBe(200);
    resend.mockClear();
    const prepare = vi.spyOn(env.DB, "prepare");
    const res = await post(path, body(), ip, e);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
    expect(await res.json()).toMatchObject({ success: false });
    expect(prepare).not.toHaveBeenCalled();
    expect(resend).not.toHaveBeenCalled();
    expect(lim.limit).toHaveBeenLastCalledWith({ key: "198.51.100.7" });
  });

  it("throttles redeem before the staff secret check", async () => {
    const res = await post("/api/redeem", { offer_code: "AAAA" }, {}, { ...OPEN, REDEEM_LIMITER: limiter(0) });
    expect(res.status).toBe(429);
  });

  it("fails open when the binding is absent or throws", async () => {
    const throwing = { limit: async () => { throw new Error("boom"); } } as unknown as RateLimit;
    const a = await post("/api/subscribe", { email: uniqueEmail() }, {}, { ...OPEN, SUBSCRIBE_LIMITER: undefined });
    const b = await post("/api/subscribe", { email: uniqueEmail() }, {}, { ...OPEN, SUBSCRIBE_LIMITER: throwing });
    expect([a.status, b.status]).toEqual([200, 200]);
  });

  it("does not run the limiter while the write fence is closed", async () => {
    const lim = limiter(0);
    const res = await post("/api/subscribe", { email: uniqueEmail() }, {}, { ...env, WRITES_ENABLED: "false", SUBSCRIBE_LIMITER: lim });
    expect(res.status).toBe(503);
    expect(lim.limit).not.toHaveBeenCalled();
  });
});

describe("POST /api/redeem", () => {
  const staff = () => ({ "x-staff-secret": env.STAFF_SECRET! });
  async function seed(code: string) {
    await env.DB.prepare("INSERT INTO subscribers (id, email, offer_code, offer_event) VALUES (?, ?, ?, '2026-07-09')")
      .bind(crypto.randomUUID(), uniqueEmail(), code)
      .run();
  }

  it.each([
    ["no header", {}, OPEN],
    ["wrong header", { "x-staff-secret": "wrong" }, OPEN],
    ["STAFF_SECRET unset", { "x-staff-secret": "" }, { ...OPEN, STAFF_SECRET: undefined }],
  ])("returns 401 with %s", async (_label, headers, e) => {
    const res = await post("/api/redeem", { offer_code: "AAAA-BBBB-CCCC" }, headers, e as Env);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ ok: false, message: "Unauthorized" });
  });

  it("marks a code redeemed once, then reports it as already used", async () => {
    await seed("RDMA-RDMA-RDMA");
    const first = await post("/api/redeem", { offer_code: " rdma-rdma-rdma " }, staff());
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ ok: true, status: "redeemed", message: "Valid — 2 free shots. Marked as used.", event: "2026-07-09" });
    const row = await env.DB.prepare("SELECT offer_code_redeemed, offer_code_redeemed_at FROM subscribers WHERE offer_code = ?")
      .bind("RDMA-RDMA-RDMA").first<{ offer_code_redeemed: number; offer_code_redeemed_at: string }>();
    expect(row!.offer_code_redeemed).toBe(1);

    const second = await post("/api/redeem", { offer_code: "RDMA-RDMA-RDMA" }, staff());
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual({
      ok: false, status: "already_used", message: `Already redeemed at ${row!.offer_code_redeemed_at}.`, event: "2026-07-09",
    });
  });

  it("reports already_used when a concurrent request wins between the read and the update", async () => {
    await seed("RACE-RACE-RACE");
    // Simulate the race: the SELECT sees an unused row, then another device redeems before our UPDATE runs.
    const realPrepare = env.DB.prepare.bind(env.DB);
    let raced = false;
    const racing = {
      prepare: (sql: string) => {
        const stmt = realPrepare(sql);
        if (!sql.startsWith("UPDATE subscribers") || raced) return stmt;
        raced = true;
        return {
          bind: (...args: unknown[]) => ({
            run: async () => {
              await realPrepare("UPDATE subscribers SET offer_code_redeemed = 1, offer_code_redeemed_at = '2026-01-01T00:00:00.000Z' WHERE offer_code = ?")
                .bind("RACE-RACE-RACE").run();
              return stmt.bind(...args).run();
            },
          }),
        };
      },
    } as unknown as D1Database;
    const res = await post("/api/redeem", { offer_code: "RACE-RACE-RACE" }, staff(), { ...OPEN, DB: racing });
    expect(await res.json()).toEqual({
      ok: false, status: "already_used", message: "Already redeemed at 2026-01-01T00:00:00.000Z.", event: "2026-07-09",
    });
  });

  it("returns 404 for an unknown code and 400 for a missing one", async () => {
    const missing = await post("/api/redeem", { offer_code: "ZZZZ-ZZZZ-ZZZZ" }, staff());
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ ok: false, status: "not_found", message: "Code not found." });
    const empty = await post("/api/redeem", { offer_code: "  " }, staff());
    expect(empty.status).toBe(400);
    expect(await empty.json()).toEqual({ ok: false, message: "No code provided." });
  });

  it("allows the x-staff-secret header in its preflight", async () => {
    const pre = await call("/api/redeem", { method: "OPTIONS" });
    expect(pre.headers.get("Access-Control-Allow-Headers")).toContain("x-staff-secret");
  });
});

describe("GET /api/past-events and routing", () => {
  it("lists past events newest first", async () => {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO past_events (id, title, date) VALUES ('e1', 'Old', '2026-01-10')"),
      env.DB.prepare("INSERT INTO past_events (id, title, date) VALUES ('e2', 'New', '2026-06-01')"),
    ]);
    const res = await call("/api/past-events");
    expect(res.headers.get("Content-Type")).toBe("application/json");
    const rows = (await res.json()) as { id: string }[];
    expect(rows.map((r) => r.id).filter((id) => id === "e1" || id === "e2")).toEqual(["e2", "e1"]);
  });

  it("returns a JSON 404 for an unknown /api path", async () => {
    const res = await call("/api/nope");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ success: false, message: "Not found" });
  });
});
