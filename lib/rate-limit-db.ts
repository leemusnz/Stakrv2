import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Fixed-window limiter shared by every serverless instance, backed by the
 * rate_limit_hits table (migrations/2026-10-30_rate-limit-hits.sql).
 *
 * If the database cannot be reached (or the table is not migrated yet) this
 * degrades to the per-instance in-memory limiter and logs, rather than taking
 * sign-in down with it. /api/health reports which mode is active.
 */
export interface Limit {
  /** Stable name of what is limited, e.g. "signin-ip". */
  name: string;
  max: number;
  windowSeconds: number;
}

export interface LimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  mode: "database" | "per-instance";
}

/** Presets for the endpoints that can be abused for guessing or for sending email. */
export const LIMITS = {
  signInPerIp: { name: "signin-ip", max: 20, windowSeconds: 300 },
  signInPerEmail: { name: "signin-email", max: 8, windowSeconds: 900 },
  emailSendPerAddress: {
    name: "email-send-address",
    max: 3,
    windowSeconds: 900,
  },
  emailSendPerIp: { name: "email-send-ip", max: 10, windowSeconds: 900 },
  tokenPerIp: { name: "token-ip", max: 20, windowSeconds: 900 },
  presignPerUser: { name: "presign-user", max: 30, windowSeconds: 60 },
} satisfies Record<string, Limit>;

let lastFallbackLog = 0;

export async function hit(
  limit: Limit,
  subject: string,
  now: number = Date.now(),
): Promise<LimitResult> {
  const key = `${limit.name}:${subject.toLowerCase().slice(0, 200)}`;
  try {
    const { createDbConnection } = await import("@/lib/db");
    const sql = createDbConnection();
    const rows = await sql`
      INSERT INTO rate_limit_hits (key, window_start, hits)
      VALUES (${key},
              to_timestamp(floor(extract(epoch FROM now()) / ${limit.windowSeconds}) * ${limit.windowSeconds}),
              1)
      ON CONFLICT (key, window_start) DO UPDATE SET hits = rate_limit_hits.hits + 1
      RETURNING hits,
        ceil(${limit.windowSeconds} - mod(extract(epoch FROM now())::numeric, ${limit.windowSeconds}))::int AS retry`;
    // Opportunistic cleanup keeps the table tiny without a scheduled job.
    if (Math.random() < 0.01)
      void sql`DELETE FROM rate_limit_hits WHERE window_start < now() - interval '1 day'`.catch(
        () => {},
      );
    const hits = Number(rows[0]?.hits);
    if (!Number.isFinite(hits)) throw new Error("Unexpected rate limit result");
    return {
      allowed: hits <= limit.max,
      retryAfterSeconds: Number(rows[0].retry),
      mode: "database",
    };
  } catch (error) {
    if (now - lastFallbackLog > 60_000) {
      lastFallbackLog = now;
      console.error(
        "Rate limiter database unavailable; using per-instance fallback",
        (error as { code?: string })?.code ?? "unknown",
      );
    }
    const local = checkRateLimit(key, "auth-strict");
    return {
      allowed: local.success,
      retryAfterSeconds: local.retryAfter ?? 60,
      mode: "per-instance",
    };
  }
}

/** Checks several limits at once; blocked as soon as any one is exceeded. */
export async function enforce(checks: [Limit, string][]): Promise<LimitResult> {
  let worst: LimitResult = {
    allowed: true,
    retryAfterSeconds: 0,
    mode: "database",
  };
  for (const [limit, subject] of checks) {
    const result = await hit(limit, subject);
    if (result.mode === "per-instance")
      worst = { ...worst, mode: "per-instance" };
    if (!result.allowed)
      worst = {
        ...worst,
        allowed: false,
        retryAfterSeconds: Math.max(
          worst.retryAfterSeconds,
          result.retryAfterSeconds,
        ),
      };
  }
  return worst;
}

export function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      success: false,
      error: "Too many attempts",
      message: `Too many attempts. Please try again in ${Math.max(1, Math.ceil(retryAfterSeconds / 60))} minute(s).`,
    },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, retryAfterSeconds)) },
    },
  );
}

export { getClientIp };
