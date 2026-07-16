# CLAUDE.md — La Tribu site (project instructions)

> Project-level instructions. These override the user-level global CLAUDE.md
> where they conflict. Read fully on session boot.

## What this is

Marketing/events site for **La Tribu**, London's Latin night.
Live domain: **latribu.co.uk** (DNS in Vercel, not GoDaddy).

It is a **static site** — hand-written HTML/CSS/vanilla JS. There is **no build
step, no bundler, no `package.json`, no framework**. Files are served as-is.

## Stack & hosting

- **Frontend:** plain `.html` pages at the repo root + `css/styles.css` + `js/`.
- **Hosting/CD:** Vercel, auto-deploys on push to `main` via its git integration.
  Security headers + CSP live in `vercel.json`.
- **Backend:** Supabase (project ref `iialbhtgugmkmbrhwlud`). Edge functions in
  `supabase/functions/` handle the signup, contact, and redeem flows. Tables:
  `subscribers`, `past_events`, `past_event_photos`.
- **Email:** Resend (eu-west-1), sending records under the `send` subdomain.
- **Analytics / A/B testing:** PostHog (snippet in each page `<head>`).

## File map (where to go)

| Path | What it is |
|---|---|
| `index.html` | Home / hero / events / footer signup |
| `djs.html`, `promotions.html`, `past-events.html`, `venues.html` | Content pages |
| `redeem.html` + `js/redeem.js` | Customer offer-code redemption |
| `USER_TASKS/door-redemption-staff-guide.html` | Staff-facing door guide |
| `js/supabase-client.js` | Shared Supabase client + all `callFunction` wrappers |
| `css/styles.css` | All styling |
| `supabase/functions/` | Backend edge functions (subscribe, contact, redeem) |
| `vercel.json` | Security headers + Content-Security-Policy |
| `.github/workflows/` | CI: link-check, HTML lint, CodeQL, gitleaks |
| `DESIGN.md`, `COPY.md`, `tov.md` | Design system, copy, tone of voice |

## Conventions

- **No `rm`** in this repo — move unwanted files to `Bin/` (per global policy).
- The Supabase **anon key** in `js/supabase-client.js` is public by design
  (client-side JWT). The **service_role** key must NEVER be committed —
  gitleaks (`.gitleaks.toml`) guards this.
- Any new external origin (scripts, fetch, images) MUST be added to the CSP in
  `vercel.json` or the browser will block it.

## Agent ownership split  ⚠️ important

Per standing arrangement:
- **Codex owns the frontend** (HTML, CSS, client JS, CSP/snippet edits).
- **Claude owns the backend** (Supabase functions, DB, infra, CI/CD).
- **Cross-review is required**: whoever makes a change in the other's area
  flags it for the owner to review before it ships.

See also `AGENTS.md` (Codex reads that; it points back here).
