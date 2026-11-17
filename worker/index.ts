// La Tribu Worker: static assets from public/ plus /api/* (run_worker_first in wrangler.jsonc).
import { contact, pastEvents, redeem, REDEEM_PREFLIGHT_HEADERS, subscribe, type Env } from "./routes";
import { isOpen, MAINTENANCE_MESSAGE } from "./switches";
import { CORS_HEADERS, json } from "./util";

// The entry module exports only the handler: workerd rejects other named exports.

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const ROUTES: Record<string, (req: Request, env: Env) => Promise<Response>> = {
  "/api/subscribe": subscribe,
  "/api/contact": contact,
  "/api/redeem": redeem,
  "/api/past-events": pastEvents,
};

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url);
    if (!pathname.startsWith("/api/")) {
      // html_handling is "none" so /page.html URLs serve as on Vercel (no redirect to /page);
      // that mode does not map "/" to index.html, so do it here.
      if (pathname === "/") return env.ASSETS.fetch(new Request(new URL("/index.html", req.url), req));
      return env.ASSETS.fetch(req);
    }

    const route = ROUTES[pathname];
    if (!route) return json({ success: false, message: "Not found" }, 404);

    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: pathname === "/api/redeem" ? REDEEM_PREFLIGHT_HEADERS : CORS_HEADERS });
    }
    if (READ_METHODS.has(req.method)) return route(req, env);

    // Write fence. Both body shapes used by the pages carry the message.
    if (!isOpen(env.WRITES_ENABLED)) {
      return json({ success: false, ok: false, message: MAINTENANCE_MESSAGE }, 503);
    }

    // write_start / write_end are the drain evidence for the cutover gate (2.8).
    const rid = crypto.randomUUID();
    console.log(JSON.stringify({ evt: "write_start", rid, path: pathname }));
    let status = 500;
    try {
      const res = await route(req, env);
      status = res.status;
      return res;
    } finally {
      console.log(JSON.stringify({ evt: "write_end", rid, status }));
    }
  },

  // No Cron Triggers are configured today; the guard is here so one added later is fenced too.
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    if (!isOpen(env.CRONS_ENABLED)) return;
  },
} satisfies ExportedHandler<Env>;
