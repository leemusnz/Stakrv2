-- Challenge Schema Migration - Add missing columns for enhanced features
-- This migration adds columns needed for the full challenge creation workflow

-- Add missing columns to challenges table
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS daily_instructions TEXT,
ADD COLUMN IF NOT EXISTS general_instructions TEXT,
ADD COLUMN IF NOT EXISTS proof_instructions TEXT,
ADD COLUMN IF NOT EXISTS privacy_type VARCHAR(20) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS min_participants INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_participants INTEGER,
ADD COLUMN IF NOT EXISTS start_date_type VARCHAR(20) DEFAULT 'days',
ADD COLUMN IF NOT EXISTS start_date_days INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS allow_points_only BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reward_distribution VARCHAR(30) DEFAULT 'equal-split',
ADD COLUMN IF NOT EXISTS selected_proof_types TEXT[],
ADD COLUMN IF NOT EXISTS camera_only BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allow_late_submissions BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS late_submission_hours INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS bonus_rewards TEXT[],
ADD COLUMN IF NOT EXISTS invite_code VARCHAR(20);

-- Add team challenge features
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS enable_team_mode BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS team_assignment_method VARCHAR(20) DEFAULT 'auto-balance',
ADD COLUMN IF NOT EXISTS number_of_teams INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS winning_criteria VARCHAR(30) DEFAULT 'completion-rate',
ADD COLUMN IF NOT EXISTS losing_team_outcome VARCHAR(20) DEFAULT 'lose-stake';

-- Add referral features
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS enable_referral_bonus BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS referral_bonus_percentage DECIMAL(4,2) DEFAULT 20.00,
ADD COLUMN IF NOT EXISTS max_referrals INTEGER DEFAULT 3;

-- Add timer and verification features
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS require_timer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS timer_min_duration INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS timer_max_duration INTEGER DEFAULT 120,
ADD COLUMN IF NOT EXISTS random_checkin_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS random_checkin_probability DECIMAL(4,2) DEFAULT 30.00;

-- Make min_stake and max_stake nullable for points-only challenges
ALTER TABLE challenges 
ALTER COLUMN min_stake DROP NOT NULL,
ALTER COLUMN min_stake SET DEFAULT 0.00,
ALTER COLUMN max_stake DROP NOT NULL,
ALTER COLUMN max_stake SET DEFAULT 0.00;

-- Update existing challenges to have default values
UPDATE challenges SET 
  privacy_type = 'public',
  min_participants = 1,
  start_date_type = 'days',
  start_date_days = 2,
  allow_points_only = CASE WHEN min_stake = 0 AND max_stake = 0 THEN TRUE ELSE FALSE END,
  reward_distribution = 'equal-split',
  camera_only = FALSE,
  allow_late_submissions = FALSE,
  late_submission_hours = 4,
  enable_team_mode = FALSE,
  team_assignment_method = 'auto-balance',
  number_of_teams = 2,
  winning_criteria = 'completion-rate',
  losing_team_outcome = 'lose-stake',
  enable_referral_bonus = FALSE,
  referral_bonus_percentage = 20.00,
  max_referrals = 3,
  require_timer = FALSE,
  timer_min_duration = 15,
  timer_max_duration = 120,
  random_checkin_enabled = FALSE,
  random_checkin_probability = 30.00
WHERE privacy_type IS NULL;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_challenges_privacy_type ON challenges(privacy_type);
CREATE INDEX IF NOT EXISTS idx_challenges_allow_points_only ON challenges(allow_points_only);
CREATE INDEX IF NOT EXISTS idx_challenges_invite_code ON challenges(invite_code);
CREATE INDEX IF NOT EXISTS idx_challenges_require_timer ON challenges(require_timer);

-- Add unique constraint for invite codes
ALTER TABLE challenges ADD CONSTRAINT unique_invite_code UNIQUE (invite_code);

COMMENT ON COLUMN challenges.daily_instructions IS 'Instructions for daily activities';
COMMENT ON COLUMN challenges.proof_instructions IS 'Specific instructions for proof submission';
COMMENT ON COLUMN challenges.privacy_type IS 'public or private challenge';
COMMENT ON COLUMN challenges.allow_points_only IS 'Challenge uses points instead of money stakes';
COMMENT ON COLUMN challenges.require_timer IS 'Challenge requires timed activity sessions';
COMMENT ON COLUMN challenges.random_checkin_enabled IS 'Enable random verification check-ins during timed sessions';
