/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";

const pages = import.meta.glob<string>("../public/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
});

describe.each(Object.entries(pages))("%s", (_path, html) => {
  it("loads scripts from external files under the site's CSP", () => {
    const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)];
    expect(scripts.filter((script) => script[1].trim())).toEqual([]);
  });

  it("posts forms that collect an email or message", () => {
    const forms = [...html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form\s*>/gi)];
    for (const [, attributes, fields] of forms) {
      if (/\b(?:type|name)\s*=\s*["'](?:email|message)["']|<textarea\b/i.test(fields)) {
        expect(attributes).toMatch(/\bmethod\s*=\s*["']post["']/i);
      }
    }
  });
});
