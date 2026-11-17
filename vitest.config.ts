import path from "node:path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        // Local placeholders only (never real values). Switches start closed, as in production.
        bindings: {
          TEST_MIGRATIONS: await readD1Migrations(path.join(import.meta.dirname, "migrations/d1")),
          WRITES_ENABLED: "false",
          CRONS_ENABLED: "false",
          RESEND_API_KEY: "re_placeholder_local_only",
          STAFF_SECRET: "staff-placeholder-local-only",
        },
      },
    })),
  ],
  test: {
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/apply-migrations.ts"],
  },
});
