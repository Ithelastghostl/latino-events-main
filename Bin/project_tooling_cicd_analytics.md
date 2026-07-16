---
name: project_tooling_cicd_analytics
description: CI/CD, security scanning, and PostHog analytics/A-B setup for the La Tribu site
metadata:
  type: project
---

The La Tribu site is a **static HTML/CSS/vanilla-JS site** (no build step, no package.json), hosted on **Vercel** (auto-deploys on push to `main`) with a **Supabase** backend. As of 2026-06-30 the following tooling was added:

- **CI quality gates** (`.github/workflows/checks.yml`): lychee link-check, HTMLHint, gitleaks secret scan — runs on PRs + push to main. Vercel still owns the actual deploy.
- **CodeQL** (`.github/workflows/codeql.yml`): JavaScript static analysis, weekly cron.
- **gitleaks allowlist** (`.gitleaks.toml`): the Supabase **anon** key in `js/supabase-client.js` is public-by-design and allowlisted; the **service_role** key must never be committed (not exempted).
- **PostHog** for analytics + A/B testing (feature flags): shared loader `js/posthog-init.js`, included in all 6 HTML pages. Wired via **reverse proxy** (`/ingest` rewrites in `vercel.json` → `eu.i.posthog.com` / `eu-assets.i.posthog.com`) so it's same-origin (CSP stays `'self'`, beats ad-blockers). Configured **cookieless** (`persistence: 'memory'`, session recording off) so no consent banner is required yet.

**Outstanding:** `js/posthog-init.js` has a `PH_PROJECT_KEY` placeholder — needs the real PostHog project API key (`phc_...`) before it works. Frontend pieces (PostHog snippet + vercel.json) are pending **Codex cross-review** per [[feedback_frontend_backend_split]].

For agent navigation: project-level `CLAUDE.md` + `AGENTS.md` now document the stack, file map, and ownership split. See also [[project_dns_email]].
