/** @jest-environment node */
import {
  contentSecurityPolicy,
  headers,
  securityHeaders,
} from "@/config/security-headers.cjs";

describe("security headers", () => {
  const byKey = (k: string) =>
    securityHeaders.find((h) => h.key === k)?.value ?? "";

  it("applies to every route", async () => {
    const rules = await headers();
    expect(rules[0].source).toBe("/:path*");
    expect(rules[0].headers).toBe(securityHeaders);
  });

  it("forbids framing, plugins, base hijacking and foreign form posts", () => {
    for (const directive of [
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "default-src 'self'",
    ])
      expect(contentSecurityPolicy).toContain(directive);
    expect(byKey("X-Frame-Options")).toBe("DENY");
  });

  it("allows only the origins the app needs for scripts", () => {
    const script = contentSecurityPolicy
      .split("; ")
      .find((d) => d.startsWith("script-src"))!;
    expect(script).not.toMatch(/https?:|\*/);
  });

  it("lets the browser upload evidence straight to S3 and report to Sentry", () => {
    const connect = contentSecurityPolicy
      .split("; ")
      .find((d) => d.startsWith("connect-src"))!;
    expect(connect).toContain("https://*.amazonaws.com");
    expect(connect).toContain("https://*.sentry.io");
  });

  it("sets the standard hardening headers", () => {
    expect(byKey("Strict-Transport-Security")).toContain("max-age=63072000");
    expect(byKey("X-Content-Type-Options")).toBe("nosniff");
    expect(byKey("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(byKey("Permissions-Policy")).toContain("geolocation=()");
  });

  it("never lets the service worker be cached", async () => {
    const sw = (await headers()).find((r) => r.source === "/sw.js")!;
    expect(sw.headers.find((h) => h.key === "Cache-Control")!.value).toContain(
      "no-cache",
    );
  });
});
