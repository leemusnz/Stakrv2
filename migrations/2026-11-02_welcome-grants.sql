-- One-time welcome credits: remember which inboxes have had them, even after
-- the account is deleted.
--
-- Deleting an account rewrites its email to deleted-...@deleted.invalid, so the
-- old "is another account on this inbox already granted?" check forgot the
-- inbox and the same address could register again and claim again. This table
-- keeps a one-way, keyed fingerprint (HMAC-SHA256 of the normalised mailbox)
-- instead of the address itself, so eligibility survives deletion without
-- keeping personal information that can be read back. See BUGS.md O-12.
--
-- ADDITIVE and idempotent: one new table, nothing existing is touched. Safe to
-- apply before OR after deploying the code; until it is applied the app falls
-- back to the previous per-account check.
--
-- Apply with the same discipline as the earlier migrations: rehearse on a Neon
-- branch first (see docs/release/RELEASE_CHECKLIST.md).

BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE TABLE IF NOT EXISTS welcome_grants (
  fingerprint text        PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES users (id),
  granted_at  timestamptz NOT NULL DEFAULT now()
);

COMMIT;
