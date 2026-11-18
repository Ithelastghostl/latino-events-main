# Open items

Last updated: 2026-11-18. Read this before the next round of development.

## Not done yet

1. **WhatsApp group link.** The footer and contact links on every page point to `https://chat.whatsapp.com/placeholder`. Replace it with the real group invite link.
2. **WhatsApp QR image.** `public/images/whatsapp-qr.webp` does not exist. The pages hide the image until it does, and the link check skips it (`.github/workflows/checks.yml`). Add the image, then remove the `--exclude` from the link check.
3. **Staff code handover.** `/api/redeem` checks `STAFF_SECRET` on the Worker. If the code changes at cutover, give venue staff the new one.
4. **`vercel.json`.** Still in the repo but unused since the move to Cloudflare. Move it to `Bin/` when the Vercel project is deleted.

## Hosting

- Site and API: Cloudflare Worker `latribu` (static assets from `public/` plus `/api/*`), D1 `latribu-db`.
- Writes open only when `WRITES_ENABLED` is exactly `"true"`.
- Supabase and Vercel are retired after the cutover. The final Supabase dump is in the migration backups.
