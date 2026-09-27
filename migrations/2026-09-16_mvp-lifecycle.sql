-- Additive MVP schema. Legacy challenges remain version 0 until explicitly reconciled.
BEGIN;
ALTER TABLE users ALTER COLUMN credits TYPE numeric(18,2);
ALTER TABLE credit_transactions ALTER COLUMN amount TYPE numeric(18,2);
ALTER TABLE challenge_participants ALTER COLUMN reward_earned TYPE numeric(18,2);
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS create_request_key uuid;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS create_request_terms jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS challenge_create_request_idx ON challenges(host_id,create_request_key) WHERE create_request_key IS NOT NULL;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS lifecycle_version integer NOT NULL DEFAULT 0;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS lifecycle_policy jsonb;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS resume_status varchar(20);
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS paused_seconds numeric NOT NULL DEFAULT 0;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS allow_points_only boolean NOT NULL DEFAULT false;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS enable_team_mode boolean NOT NULL DEFAULT false;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS max_participants integer;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS privacy_type text NOT NULL DEFAULT 'public';
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE challenges ALTER COLUMN entry_fee_percentage TYPE numeric(5,2);
ALTER TABLE challenges ALTER COLUMN failed_stake_cut TYPE numeric(5,2);
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS participant_id uuid REFERENCES challenge_participants(id);
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS challenge_id uuid REFERENCES challenges(id);
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id);
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS submission_type varchar(20);
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS proof_type varchar(50);
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS proof_content text;
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS text_content text;
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'pending';
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS submitted_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES users(id);
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS proof_day date;
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS submission_key uuid;
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS superseded_at timestamptz;
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS appeal_status varchar(20);
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS appeal_reason text;
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS appealed_at timestamptz;
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS appeal_deadline_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS proof_submission_key_idx ON proof_submissions(user_id, submission_key) WHERE submission_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS proof_current_day_idx ON proof_submissions(participant_id, proof_day) WHERE superseded_at IS NULL AND proof_day IS NOT NULL;
CREATE TABLE IF NOT EXISTS challenge_lifecycle_queue (
  challenge_id uuid PRIMARY KEY REFERENCES challenges(id),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0,
  last_error text
);
CREATE TABLE IF NOT EXISTS challenge_settlement_records (
  challenge_id uuid PRIMARY KEY REFERENCES challenges(id),
  kind text NOT NULL CHECK (kind IN ('settlement', 'cancellation')),
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS challenge_platform_ledger (
  challenge_id uuid PRIMARY KEY REFERENCES challenges(id),
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS challenge_funding (
  challenge_id uuid PRIMARY KEY REFERENCES challenges(id),
  user_id uuid NOT NULL REFERENCES users(id),
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0)
);
CREATE TABLE IF NOT EXISTS proof_uploads (
  file_key text PRIMARY KEY,
  storage_key text NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id),
  challenge_id uuid NOT NULL REFERENCES challenges(id),
  content_type text NOT NULL,
  byte_size integer NOT NULL CHECK (byte_size BETWEEN 1 AND 10485760),
  confirmed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS challenges_lifecycle_due_idx ON challenges(end_date) WHERE lifecycle_version = 1;
CREATE TABLE IF NOT EXISTS credit_grants (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  actor_id uuid NOT NULL REFERENCES users(id),
  amount_cents bigint NOT NULL CHECK (amount_cents BETWEEN 1 AND 1000000),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
