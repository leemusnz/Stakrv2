/** @jest-environment node */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { isAllowedApiPath, isNotInReleasePage } from "@/lib/v1-surface";

describe("release API allowlist", () => {
  it.each([
    "/api/auth/session",
    "/api/auth/callback/google",
    "/api/auth/register",
    "/api/challenges",
    "/api/challenges/0b9c8a52-0000-4000-8000-000000000001",
    "/api/challenges/0b9c8a52-0000-4000-8000-000000000001/join",
    "/api/challenges/0b9c8a52-0000-4000-8000-000000000001/checkins",
    "/api/proofs/abc/file",
    "/api/upload/presigned-url",
    "/api/user/credits",
    "/api/user/notifications",
    "/api/user/notifications/abc",
    "/api/admin/credits",
    "/api/admin/verifications",
    "/api/admin/challenges/abc",
    "/api/cron/lifecycle",
    "/api/cron/lifecycle/",
  ])("allows %s", (path) => expect(isAllowedApiPath(path)).toBe(true));

  it.each([
    "/api/users",
    "/api/brands",
    "/api/creators",
    "/api/random-checkins/active",
    "/api/payments/withdraw",
    "/api/payments/webhook",
    "/api/social/leaderboard",
    "/api/posts",
    "/api/integrations/sync",
    "/api/auth/callback/strava",
    "/api/auth/callback/github",
    "/api/admin/dev-access",
    "/api/admin/users",
    "/api/admin/deploy-ai-schema",
    "/api/admin/analytics",
    "/api/challenges/abc/settle",
    "/api/challenges/abc/participants",
    "/api/challenges/analyze/extra",
    "/api/image-proxy",
    "/api/user/dev-mode",
    "/api/user/saved-challenges",
    "/api/anything-new",
  ])("denies %s", (path) => expect(isAllowedApiPath(path)).toBe(false));

  it("does not treat a look-alike prefix as allowed", () => {
    expect(isAllowedApiPath("/api/auth")).toBe(false);
    expect(isAllowedApiPath("/api/challengesX")).toBe(false);
    expect(isAllowedApiPath("/api/admin/credits/../users")).toBe(false);
  });
});

describe("pages outside the release", () => {
  it.each([
    "/social",
    "/social/x",
    "/brand/1",
    "/creator/2",
    "/challenge/invite/ABC",
    "/admin/financial-monitor",
  ])("blocks %s", (path) => expect(isNotInReleasePage(path)).toBe(true));
  it.each([
    "/dashboard",
    "/challenge/abc",
    "/socialite",
    "/admin/challenges",
    "/profile",
  ])("keeps %s", (path) => expect(isNotInReleasePage(path)).toBe(false));
});

// Meta-test: every API path the release UI calls must be allowed, so a new UI
// call to a non-allowlisted route fails CI instead of failing in production.
describe("release UI only calls allowlisted API routes", () => {
  const roots = [
    "components/mvp",
    "components/onboarding/gamified-auth-step.tsx",
    "components/pwa-registration.tsx",
    "app/auth",
    "app/onboarding",
    "app/alpha-gate",
    "app/profile",
    "app/settings",
    "app/notifications",
    "lib/file-upload.ts",
  ];
  const files: string[] = [];
  const walk = (path: string) => {
    let stat;
    try {
      stat = statSync(path);
    } catch {
      return;
    }
    if (stat.isDirectory())
      readdirSync(path).forEach((f) => walk(join(path, f)));
    else if (/\.(tsx?|jsx?)$/.test(path)) files.push(path);
  };
  roots.forEach(walk);

  const paths = new Map<string, string>();
  for (const file of files) {
    let src = readFileSync(file, "utf8");
    src = src.replace(
      /["'`](\/api\/[^"'`]*)["'`]\s*\+\s*[\w.[\]]+\s*\+\s*["'`]([^"'`]*)["'`]/g,
      '"$1x$2"',
    );
    for (const m of src.matchAll(/["'`](\/api\/[A-Za-z0-9_\-./${}[\]:]*)/g)) {
      const path = m[1].replace(/\$\{[^}]*\}/g, "x").split("?")[0];
      paths.set(path, file);
    }
  }

  it("found UI source to scan", () => expect(files.length).toBeGreaterThan(5));

  it("every called path is allowed", () => {
    const blocked = [...paths].filter(
      ([p]) => !isAllowedApiPath(p.replace(/\/$/, "")),
    );
    expect(blocked.map(([p, f]) => `${p}  (${f})`)).toEqual([]);
  });
});
