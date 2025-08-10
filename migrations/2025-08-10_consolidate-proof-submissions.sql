-- Consolidate proof_submissions schema across app and AI anti-cheat
-- Safe idempotent migration for Neon

BEGIN;

-- Ensure challenges.ai_analysis exists (JSONB) and index it
ALTER TABLE IF EXISTS challenges
  ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

CREATE INDEX IF NOT EXISTS idx_challenges_ai_analysis
  ON challenges USING GIN (ai_analysis);

-- Ensure required columns exist on proof_submissions
ALTER TABLE IF EXISTS proof_submissions
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS challenge_id UUID,
  ADD COLUMN IF NOT EXISTS submission_type VARCHAR(20), -- 'photo' | 'video' | 'text' | 'auto_sync'
  ADD COLUMN IF NOT EXISTS proof_type VARCHAR(50),      -- 'image' | 'video' | 'text' | 'document'
  ADD COLUMN IF NOT EXISTS proof_content TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP DEFAULT NOW();

-- Backfill proof_type if NULL (treat legacy rows as 'document')
UPDATE proof_submissions
SET proof_type = 'document'
WHERE proof_type IS NULL;

-- Ensure proof_type CHECK constraint exists with allowed values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.table_name = 'proof_submissions'
      AND tc.constraint_type = 'CHECK'
      AND tc.constraint_name = 'chk_proof_type'
  ) THEN
    ALTER TABLE proof_submissions
      ADD CONSTRAINT chk_proof_type
      CHECK (proof_type IN ('image', 'video', 'text', 'document'));
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_proof_submissions_user ON proof_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_challenge ON proof_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_status ON proof_submissions(status);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_submitted_at ON proof_submissions(submitted_at);

COMMIT;


