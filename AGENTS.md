# AGENTS.md

This repo's agent guidance lives in **[`CLAUDE.md`](./CLAUDE.md)** — stack,
file map, conventions, and the frontend/backend ownership split are all there.
Read it first; it is the single source of truth for both Codex and Claude.

Quick orientation:
- Static HTML/CSS/JS site (no build step), Vercel-hosted, Supabase backend.
- **Codex owns frontend; Claude owns backend; cross-review required.**
- CI lives in `.github/workflows/` (link-check, HTML lint, CodeQL, gitleaks).
