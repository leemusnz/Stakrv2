-- Phase 0 corrective migration (board-approved recovery plan, June 2026).
-- See docs/audits/2026-06-engineering-review/APPROVED_PLAN.md (P0-5/P0-6).

-- P0-6 — lib/payments-service.ts inserts with ON CONFLICT (stripe_payment_id),
-- which requires a matching unique index; without one every cash-join INSERT
-- fails with Postgres error 42P10. Partial index because credits-only rows
-- carry NULL stripe_payment_id.
CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_stripe_payment_id
  ON transactions (stripe_payment_id)
  WHERE stripe_payment_id IS NOT NULL;

-- email_verified type drift: 2025-01-15_consolidate_all_schema_changes.sql
-- added the column as TIMESTAMP, but all application code reads and writes it
-- as a boolean (app/api/auth/verify-email, lib/auth.ts), which throws on
-- write. Convert to BOOLEAN — "verified" becomes the presence of a timestamp —
-- and keep the moment of verification in email_verified_at.
DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'users' AND column_name = 'email_verified';

  IF col_type IS NULL THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;
  ELSIF col_type <> 'boolean' THEN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;
    UPDATE users
      SET email_verified_at = COALESCE(email_verified_at, email_verified::timestamp)
      WHERE email_verified IS NOT NULL;
    ALTER TABLE users
      ALTER COLUMN email_verified DROP DEFAULT,
      ALTER COLUMN email_verified TYPE BOOLEAN USING (email_verified IS NOT NULL),
      ALTER COLUMN email_verified SET DEFAULT FALSE;
  END IF;
END $$;
