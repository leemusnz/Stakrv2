-- Distributed rate limiting for the credits release.
--
-- The previous limiter was an in-memory Map: per serverless instance, reset on
-- every cold start, and only applied to /api/auth/register. Credentials sign-in,
-- forgot-password and resend-verification (an email-bombing vector) had no limit.
--
-- ADDITIVE and idempotent: one new table, nothing existing is touched. Safe to
-- apply before OR after deploying the code. Until it is applied the app falls back
-- to the per-instance limiter and /api/health reports rateLimit: "per-instance".
--
-- Apply with the same discipline as the 27/09/2026 migrations: rehearse on a Neon
-- branch first (see docs/release/RELEASE_CHECKLIST.md).

BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE TABLE IF NOT EXISTS rate_limit_hits (
  key          text        NOT NULL,
  window_start timestamptz NOT NULL,
  hits         integer     NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);

-- Lets the opportunistic cleanup delete old windows without scanning the table.
CREATE INDEX IF NOT EXISTS rate_limit_hits_window_idx ON rate_limit_hits (window_start);

COMMIT;
