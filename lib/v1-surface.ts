/**
 * The credits release exposes a small, deliberate surface. Everything else
 * (brands, creators, social, cash payments, random check-ins, AI/wearable
 * integrations and the legacy admin tools) is dormant code that writes to
 * tables production does not have, serves mock data, or moves money. In
 * production those paths answer 404 from middleware, so dormant code can never
 * be reached by accident or by an attacker.
 *
 * Pure functions only: middleware runs on the edge runtime.
 */

/** Pages that are not part of the credits release. Prefix match on path segments. */
export const NOT_IN_RELEASE_PAGES = [
  "/social",
  "/brand",
  "/creator",
  "/challenge/invite",
  "/admin/financial-monitor",
];

/**
 * API routes that ARE part of the release (default deny for the rest).
 * Keep in sync with the UI: tests/__tests__/v1-surface.test.ts scans the UI
 * source and fails if a call is made to a path that is not listed here.
 */
const ALLOWED_API: RegExp[] = [
  /^\/api\/auth\//, // NextAuth, register, verify, resend, forgot/reset password
  /^\/api\/alpha-access$/,
  /^\/api\/onboarding\/complete-profile$/,
  /^\/api\/challenges$/,
  /^\/api\/challenges\/[^/]+$/,
  /^\/api\/challenges\/[^/]+\/(join|checkins)$/,
  /^\/api\/proofs\/[^/]+\/file$/,
  /^\/api\/upload\/(presigned-url|confirm)$/,
  /^\/api\/user\/(challenges|credits|profile|appeals|welcome-credits|export|delete)$/,
  /^\/api\/user\/notifications(\/[^/]+)?$/,
  /^\/api\/admin\/(challenges|credits|verifications|user-status)$/,
  /^\/api\/admin\/challenges\/[^/]+$/,
  /^\/api\/cron\/lifecycle$/,
  /^\/api\/health$/,
];

/** Third-party integration OAuth callbacks that sit under /api/auth but are not NextAuth. */
const INTEGRATION_CALLBACKS =
  /^\/api\/auth\/callback\/(fitbit|github|google-fit|spotify|strava|todoist)$/;

const trimSlash = (path: string) =>
  path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;

export function isAllowedApiPath(pathname: string): boolean {
  const path = trimSlash(pathname);
  if (INTEGRATION_CALLBACKS.test(path)) return false;
  return ALLOWED_API.some((pattern) => pattern.test(path));
}

export function isNotInReleasePage(pathname: string): boolean {
  const path = trimSlash(pathname);
  return NOT_IN_RELEASE_PAGES.some(
    (prefix) => path === prefix || path.startsWith(prefix + "/"),
  );
}
