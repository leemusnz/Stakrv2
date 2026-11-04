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

  // The sign-in "prove you're human" widget (Cloudflare Turnstile) needs its script, its
  // iframe and its callbacks. Those origins are trusted only when it is switched on.
  describe("Cloudflare Turnstile", () => {
    const CLOUDFLARE = "https://challenges.cloudflare.com";
    const SITE = "NEXT_PUBLIC_TURNSTILE_SITE_KEY";
    const SECRET = "TURNSTILE_SECRET_KEY";
    const policyWith = (site?: string, secret?: string) => {
      const saved = { site: process.env[SITE], secret: process.env[SECRET] };
      const set = (name: string, value: string | undefined) => {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      };
      set(SITE, site);
      set(SECRET, secret);
      try {
        let policy = "";
        jest.isolateModules(() => {
          policy =
            require("@/config/security-headers.cjs").contentSecurityPolicy;
        });
        return policy;
      } finally {
        set(SITE, saved.site);
        set(SECRET, saved.secret);
      }
    };
    const directive = (policy: string, name: string) =>
      policy.split("; ").find((d) => d.startsWith(name)) ?? "";

    it("trusts nothing from Cloudflare when it is off", () => {
      expect(policyWith(undefined, undefined)).not.toContain(CLOUDFLARE);
      expect(policyWith("   ", "   ")).not.toContain(CLOUDFLARE);
    });

    // One key alone leaves the whole check off, so Cloudflare is not trusted either.
    it("trusts nothing from Cloudflare with only one of the two keys", () => {
      expect(policyWith("0x4AAAAAAA", undefined)).not.toContain(CLOUDFLARE);
      expect(policyWith(undefined, "0x4secret")).not.toContain(CLOUDFLARE);
    });

    it("allows Cloudflare's script, frame and callbacks when it is on, and no wildcard", () => {
      const policy = policyWith("0x4AAAAAAA", "0x4secret");
      for (const name of ["script-src", "frame-src", "connect-src"])
        expect(directive(policy, name)).toContain(CLOUDFLARE);
      expect(directive(policy, "frame-src")).toContain("'self'");
      expect(directive(policy, "script-src")).not.toMatch(/\*/);
      expect(policy).toContain("frame-ancestors 'none'");
    });
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
