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
  try {
    await sql`SELECT 1`;
    database = true;
    const [row] = await sql`SELECT count(*)::int AS overdue,
        coalesce(floor(extract(epoch FROM (now() - min(next_attempt_at))) / 60), 0)::int AS oldest
      FROM challenge_lifecycle_queue WHERE next_attempt_at < now() - interval '15 minutes'`;
    overdueJobs = row.overdue;
    oldestOverdueMinutes = row.oldest;
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
  const impaired =
    !email || !storage || !cronSecret || !auth || Boolean(overdueJobs);
  return {
    status: !database ? "down" : impaired ? "degraded" : "ok",
    checks: {
      database,
      email,
      storage,
      auth,
      cronSecret,
      cash: env.ENABLE_CASH_PAYMENTS === "true" ? "ENABLED" : "disabled",
    },
    lifecycle: { overdueJobs, oldestOverdueMinutes },
    time: now.toISOString(),
  };
}
