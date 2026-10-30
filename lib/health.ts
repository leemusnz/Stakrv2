type Sql = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<any[]>;

export interface HealthReport {
  status: "ok" | "degraded" | "down";
  checks: {
    database: boolean;
    email: boolean;
    storage: boolean;
    auth: boolean;
    cronSecret: boolean;
    /** "database" once migrations/2026-10-30_rate-limit-hits.sql is applied; otherwise limits are per instance. */
    rateLimit: "database" | "per-instance";
    /** Enough admin reviewers (two by default; see STAKR_MIN_REVIEWERS). An appeal needs a different reviewer from the one who rejected. */
    reviewers: boolean;
    cash: "disabled" | "ENABLED";
  };
  lifecycle: {
    overdueJobs: number | null;
    oldestOverdueMinutes: number | null;
  };
  time: string;
}

const set = (name: string, env: NodeJS.ProcessEnv) =>
  Boolean(env[name]?.trim());

/**
 * Reviewers needed before health calls the setup complete. Two by default,
 * because an appeal must go to a different reviewer from the one who rejected.
 * The owner can launch with one by setting STAKR_MIN_REVIEWERS=1, accepting that
 * such appeals wait for a second reviewer. Anything unusable falls back to two.
 */
function minReviewers(env: NodeJS.ProcessEnv): number {
  const value = Number(env.STAKR_MIN_REVIEWERS?.trim());
  return Number.isInteger(value) && value >= 1 && value <= 10 ? value : 2;
}

/**
 * Booleans and counts only, never values, so it is safe to expose publicly.
 * "down" = cannot serve users; "degraded" = serving, but signup, evidence
 * upload or settlement is impaired.
 */
export async function healthReport(
  sql: Sql,
  env: NodeJS.ProcessEnv = process.env,
  now: Date = new Date(),
): Promise<HealthReport> {
  let database = false;
  let overdueJobs: number | null = null;
  let oldestOverdueMinutes: number | null = null;
  let sharedLimiter = false;
  let reviewerCount = 0;
  try {
    await sql`SELECT 1`;
    database = true;
    // Only challenges runLifecycleBatch processes: it skips suspended ones, whose
    // queue rows would otherwise age forever and falsely report a dead cron.
    const [row] = await sql`SELECT count(*)::int AS overdue,
        coalesce(floor(extract(epoch FROM (now() - min(q.next_attempt_at))) / 60), 0)::int AS oldest
      FROM challenge_lifecycle_queue q JOIN challenges c ON c.id = q.challenge_id
      WHERE c.lifecycle_version = 1 AND c.status IN ('pending','active','ended')
        AND q.next_attempt_at < now() - interval '15 minutes'`;
    overdueJobs = row.overdue;
    oldestOverdueMinutes = row.oldest;
    const [table] =
      await sql`SELECT to_regclass('rate_limit_hits') IS NOT NULL AS present`;
    sharedLimiter = Boolean(table?.present);
    // Same conditions as isAccountActive: an unverified admin is signed out, so cannot review.
    const [staff] = await sql`SELECT count(*)::int AS admins FROM users
      WHERE (is_dev OR has_dev_access) AND email_verified
        AND coalesce(moderation_status,'approved') NOT IN ('suspended','rejected')`;
    reviewerCount = Number(staff?.admins ?? 0);
  } catch {
    // Reported through the flags below; never throw from a health check.
  }
  const email = set("RESEND_API_KEY", env) && set("RESEND_FROM_EMAIL", env);
  const storage = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_REGION",
    "AWS_BUCKET_NAME",
  ].every((n) => set(n, env));
  const auth =
    (set("NEXTAUTH_SECRET", env) || set("AUTH_SECRET", env)) &&
    set("NEXTAUTH_URL", env);
  const cronSecret = set("CRON_SECRET", env);
  const reviewers = reviewerCount >= minReviewers(env);
  const impaired =
    !email ||
    !storage ||
    !cronSecret ||
    !auth ||
    !sharedLimiter ||
    !reviewers ||
    Boolean(overdueJobs);
  return {
    status: !database ? "down" : impaired ? "degraded" : "ok",
    checks: {
      database,
      email,
      storage,
      auth,
      cronSecret,
      rateLimit: sharedLimiter ? "database" : "per-instance",
      reviewers,
      cash: env.ENABLE_CASH_PAYMENTS === "true" ? "ENABLED" : "disabled",
    },
    lifecycle: { overdueJobs, oldestOverdueMinutes },
    time: now.toISOString(),
  };
}
