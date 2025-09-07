-- =====================================================
-- STAKR COMPREHENSIVE SCHEMA CONSOLIDATION
-- =====================================================
-- This migration consolidates all scattered schema changes
-- Run this in your Neon SQL Editor to apply all pending changes
-- Date: 2025-01-15
-- Purpose: Consolidate all scattered migration files

BEGIN;

-- =====================================================
-- 1. USERS TABLE ENHANCEMENTS
-- =====================================================

-- Add missing columns to users table
ALTER TABLE users 
  -- Dev access columns
  ADD COLUMN IF NOT EXISTS is_dev BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS dev_mode_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS dev_access_granted_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS dev_access_granted_at TIMESTAMP,
  
  -- Username support
  ADD COLUMN IF NOT EXISTS username VARCHAR(50),
  
  -- Email verification and password reset
  ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  
  -- Onboarding completion
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
  
  -- XP and Level system
  ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 NOT NULL;

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS users_dev_idx ON users(is_dev);
CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);
CREATE INDEX IF NOT EXISTS users_xp_idx ON users(xp);
CREATE INDEX IF NOT EXISTS users_level_idx ON users(level);
CREATE INDEX IF NOT EXISTS users_onboarding_idx ON users(onboarding_completed);

-- Update existing users with default values
UPDATE users 
SET 
  username = COALESCE(username, SPLIT_PART(email, '@', 1)),
  xp = COALESCE(xp, 0),
  level = COALESCE(level, 1)
WHERE username IS NULL OR xp IS NULL OR level IS NULL;

-- Make username NOT NULL after setting defaults
ALTER TABLE users ALTER COLUMN username SET NOT NULL;

-- =====================================================
-- 2. VERIFICATION TOKENS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for verification tokens
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_email ON verification_tokens(email);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires ON verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_type ON verification_tokens(type);

-- =====================================================
-- 3. CHALLENGES TABLE ENHANCEMENTS
-- =====================================================

-- Add missing columns to challenges table
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS privacy_type VARCHAR(20) DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS team_id UUID,
  ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

-- Create indexes for challenges
CREATE INDEX IF NOT EXISTS idx_challenges_privacy ON challenges(privacy_type);
CREATE INDEX IF NOT EXISTS idx_challenges_team ON challenges(team_id);
CREATE INDEX IF NOT EXISTS idx_challenges_ai_analysis ON challenges USING GIN (ai_analysis);

-- =====================================================
-- 4. PROOF SUBMISSIONS TABLE
-- =====================================================

-- Ensure proof_submissions table exists with all required columns
CREATE TABLE IF NOT EXISTS proof_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  submission_type VARCHAR(20) NOT NULL DEFAULT 'manual',
  proof_type VARCHAR(50) NOT NULL DEFAULT 'document',
  proof_content TEXT,
  metadata JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id)
);

-- Add proof_type constraint
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

-- Indexes for proof submissions
CREATE INDEX IF NOT EXISTS idx_proof_submissions_user ON proof_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_challenge ON proof_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_status ON proof_submissions(status);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_submitted_at ON proof_submissions(submitted_at);

-- =====================================================
-- 5. SETTLEMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  total_distributed NUMERIC(10,2) NOT NULL DEFAULT 0,
  platform_revenue_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  revenue_entry_fees NUMERIC(10,2) NOT NULL DEFAULT 0,
  revenue_failed_stakes_cut NUMERIC(10,2) NOT NULL DEFAULT 0,
  participants_rewarded INTEGER NOT NULL DEFAULT 0,
  reward_distribution_method VARCHAR(30) NOT NULL DEFAULT 'equal-split',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS settlements_challenge_idx ON settlements(challenge_id);

-- =====================================================
-- 6. WEBHOOK EVENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  type TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 7. CONTENT MODERATION TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS moderation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reported_challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_moderation_reports_reporter ON moderation_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_reported_user ON moderation_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_status ON moderation_reports(status);

-- =====================================================
-- 8. VERIFICATION APPEALS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS verification_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  proof_submission_id UUID REFERENCES proof_submissions(id) ON DELETE CASCADE,
  appeal_reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  admin_response TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_verification_appeals_user ON verification_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_appeals_challenge ON verification_appeals(challenge_id);
CREATE INDEX IF NOT EXISTS idx_verification_appeals_status ON verification_appeals(status);

-- =====================================================
-- 9. UTILITY FUNCTIONS
-- =====================================================

-- Clean up expired tokens function
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_tokens 
  WHERE expires_at < NOW() OR used_at IS NOT NULL;
  
  RAISE NOTICE 'Cleaned up expired/used verification tokens';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. GRANT DEV ACCESS TO ADMIN
-- =====================================================

-- Grant dev access to existing admin user (alex@stakr.app)
UPDATE users 
SET is_dev = TRUE, 
    dev_access_granted_at = NOW(),
    dev_access_granted_by = (SELECT id FROM users WHERE email = 'alex@stakr.app' LIMIT 1)
WHERE email = 'alex@stakr.app' AND is_dev = FALSE;

-- =====================================================
-- 11. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN users.xp IS 'User experience points earned through challenges and activities';
COMMENT ON COLUMN users.level IS 'User level calculated from XP (level = floor(xp/200) + 1)';
COMMENT ON COLUMN users.is_dev IS 'Developer access flag for testing and debugging';
COMMENT ON COLUMN users.onboarding_completed IS 'Flag indicating if user has completed onboarding flow';
COMMENT ON COLUMN challenges.privacy_type IS 'Challenge visibility: public or private';
COMMENT ON COLUMN challenges.ai_analysis IS 'AI analysis results stored as JSON';

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all tables exist
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'users', 'challenges', 'challenge_participants', 
    'proof_submissions', 'verification_tokens', 
    'settlements', 'webhook_events', 'moderation_reports', 
    'verification_appeals'
  )
ORDER BY tablename;

-- Verify users table has all required columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show migration completion message
SELECT 'Stakr schema consolidation completed successfully!' as status;
