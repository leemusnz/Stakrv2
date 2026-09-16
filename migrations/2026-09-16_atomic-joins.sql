-- Apply in isolated staging before deploying the join route.
-- Fail on pre-existing duplicates; do not silently delete or repair financial data.
BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS unique_participant_idx
  ON challenge_participants (challenge_id, user_id);

CREATE TABLE IF NOT EXISTS challenge_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id),
  actor_id uuid REFERENCES users(id),
  event_type varchar(50) NOT NULL,
  reason text NOT NULL,
  details jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS challenge_audit_events_challenge_idx
  ON challenge_audit_events (challenge_id, created_at);
COMMIT;
