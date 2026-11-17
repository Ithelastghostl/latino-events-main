-- La Tribu schema, ported from Supabase project iialbhtgugmkmbrhwlud (live catalog read 2026-11-17).
-- Type rules: MIGRATION-PLAN 2.6. uuid and timestamptz become TEXT (ISO 8601 UTC, ms, "Z");
-- boolean becomes INTEGER 0/1; date becomes TEXT YYYY-MM-DD. Ids and timestamps are set by the Worker.
-- Dropped: the Postgres regex CHECK on subscribers.email (enforced in worker/util.ts), RLS policies.

CREATE TABLE subscribers (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  source TEXT DEFAULT 'website',
  offer_code TEXT UNIQUE,
  offer_code_redeemed INTEGER NOT NULL DEFAULT 0 CHECK (offer_code_redeemed IN (0, 1)),
  offer_code_redeemed_at TEXT,
  offer_event TEXT,
  welcome_sent_at TEXT
);

CREATE TABLE past_events (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  venue TEXT,
  cover_image_url TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE past_event_photos (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL REFERENCES past_events (id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_past_event_photos_event_id ON past_event_photos (event_id);

CREATE TABLE contact_messages (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  venue TEXT,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
