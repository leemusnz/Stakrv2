-- Add currency and stake_tiers metadata lives in challenges.proof_requirements JSON
-- Create settlements and webhook_events tables; add helpful indexes

BEGIN;

-- settlements table for recording distribution summaries
CREATE TABLE IF NOT EXISTS settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  total_distributed numeric(10,2) NOT NULL DEFAULT 0,
  platform_revenue_total numeric(10,2) NOT NULL DEFAULT 0,
  revenue_entry_fees numeric(10,2) NOT NULL DEFAULT 0,
  revenue_failed_stakes_cut numeric(10,2) NOT NULL DEFAULT 0,
  participants_rewarded integer NOT NULL DEFAULT 0,
  reward_distribution_method varchar(30) NOT NULL DEFAULT 'equal-split',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS settlements_challenge_idx ON settlements(challenge_id);

-- idempotent event store for Stripe webhooks
CREATE TABLE IF NOT EXISTS webhook_events (
  id text PRIMARY KEY,
  type text,
  received_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;


