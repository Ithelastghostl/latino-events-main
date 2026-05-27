# La Tribu Platform — Design Spec

**Date:** 2026-05-27
**Status:** Approved

## Overview

Static website for "La Tribu", a Latin events community in London. Pure HTML/CSS/JS with Supabase backend for email collection and gated photo access. Deployed on Vercel with GitHub autodeploy.

## Pages

| Page | File | Auth | Purpose |
|------|------|------|---------|
| Landing | index.html | No | Hero, events, community, email signup, WhatsApp QR |
| DJs | djs.html | No | Showcase resident & guest DJs |
| Promotions | promotions.html | No | Current deals, partner offers |
| Past Events | past-events.html | Photos: yes | Event descriptions (public) + photos (authenticated) |
| Venues | venues.html | No | B2B pitch — "we bring the crowd, you keep bar & food, we keep door" |

## Infrastructure

- **GitHub:** `latino-events-main` repo
- **Vercel:** Static deployment, autodeploy from `main`
- **Supabase:** Free tier, smallest instance
- **Email:** Resend (placeholder for now)

## Supabase Schema

```sql
subscribers (id uuid PK, email text UNIQUE, subscribed_at timestamptz, source text)
past_events (id uuid PK, title text, description text, date date, venue text, cover_image_url text, created_at timestamptz)
past_event_photos (id uuid PK, event_id uuid FK, image_url text, caption text, created_at timestamptz)
```

### RLS Policies
- subscribers: anon INSERT only, no SELECT
- past_events: anon SELECT only
- past_event_photos: authenticated SELECT only

## Security

- All DB access via PostgREST (parameterized queries)
- Email validation via DB CHECK constraint
- CSP, X-Frame-Options, X-Content-Type-Options headers via vercel.json
- Only anon key in browser; service_role key in Edge Functions only
- CORS restricted to deployment domain
- Zero npm dependencies — no supply chain risk
- Supabase JS loaded via CDN with SRI hash

## Agent Rule (ENFORCED)

- **Codex**: All page frontends (HTML/CSS/JS, desktop + mobile)
- **Claude**: All backend (Supabase, Vercel, GitHub, infra)
- Cross-review required after each piece

## CTAs

All event/ticket CTAs link to Fatsoma (placeholder URLs).

## Email Marketing

Resend — placeholder integration. Future: Supabase Edge Function triggers Resend API on new subscriber.
