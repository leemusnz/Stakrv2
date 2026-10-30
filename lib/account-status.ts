/**
 * Sessions are stateless JWTs that live for 30 days, so on their own they
 * outlive a suspension or an account deletion. This is the live check used by
 * the NextAuth session callback, which every getServerSession() goes through,
 * so a suspended, deleted or unverified account loses access on every route.
 */
const BLOCKED_STATUSES = new Set(["suspended", "rejected"]);
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** Short cache: bounds database load while a ban still lands within seconds. */
const CACHE_MS = 10_000;
const cache = new Map<string, { at: number; active: boolean }>();

export function clearAccountStatusCache() {
  cache.clear();
}

export function isBlockedStatus(status: unknown): boolean {
  return typeof status === "string" && BLOCKED_STATUSES.has(status);
}

/** True when the account exists, has a verified email and is not suspended. */
export async function isAccountActive(
  userId: string,
  now: number = Date.now(),
): Promise<boolean> {
  // Only the local demo logins (development) have non-UUID ids.
  if (!UUID.test(userId)) return process.env.NODE_ENV === "development";
  const hit = cache.get(userId);
  if (hit && now - hit.at < CACHE_MS) return hit.active;
  // Loaded lazily, like the rest of lib/auth.ts, so importing this module never opens a connection.
  const { createDbConnection } = await import("@/lib/db");
  const sql = await createDbConnection();
  const rows = await sql`
    SELECT moderation_status, email_verified FROM users WHERE id = ${userId}`;
  const user = rows[0];
  const active =
    Boolean(user) &&
    Boolean(user.email_verified) &&
    !isBlockedStatus(user.moderation_status);
  cache.set(userId, { at: now, active });
  return active;
}
