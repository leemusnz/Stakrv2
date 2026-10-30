-- Run before 2026-09-16_mvp-lifecycle.sql on databases missing the baseline ledger.
-- Matches database-schema.sql. Never infer or backfill historical financial entries.
BEGIN;
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  amount numeric(10,2) NOT NULL,
  transaction_type varchar(30) NOT NULL,
  related_challenge_id uuid REFERENCES challenges(id),
  related_transaction_id uuid REFERENCES transactions(id),
  description text,
  created_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
COMMIT;
