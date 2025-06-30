-- Stakr Database Schema for Neon PostgreSQL
-- Core business model: Challenge-based staking with "everyone wins" reward system

-- Users table with trust scoring
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  credits DECIMAL(10,2) DEFAULT 0.00,
  trust_score INTEGER DEFAULT 50, -- 0-100 scale
  verification_tier VARCHAR(20) DEFAULT 'manual', -- 'auto', 'manual', 'review'
  challenges_completed INTEGER DEFAULT 0,
  false_claims INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  premium_subscription BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Challenge definitions
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  category VARCHAR(100) NOT NULL,
  duration VARCHAR(50) NOT NULL, -- "7 days", "30 days", etc.
  difficulty VARCHAR(20) NOT NULL, -- "Easy", "Medium", "Hard"
  min_stake DECIMAL(8,2) DEFAULT 0.00,
  max_stake DECIMAL(8,2) DEFAULT 0.00,
  host_id UUID REFERENCES users(id),
  host_contribution DECIMAL(8,2) DEFAULT 0.00,
  entry_fee_percentage DECIMAL(4,2) DEFAULT 5.00, -- Platform fee
  failed_stake_cut DECIMAL(4,2) DEFAULT 20.00, -- Platform cut of failed stakes
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'completed', 'cancelled'
  verification_type VARCHAR(20) DEFAULT 'manual', -- 'auto', 'manual', 'ai'
  proof_requirements JSONB, -- Flexible proof requirements
  rules TEXT[],

  -- Additional fields for enhanced challenge creation
  daily_instructions TEXT,
  general_instructions TEXT,
  proof_instructions TEXT,
  privacy_type VARCHAR(20) DEFAULT 'public', -- 'public', 'private'
  tags TEXT[],
  thumbnail_url TEXT,
  min_participants INTEGER DEFAULT 1,
  max_participants INTEGER,
  start_date_type VARCHAR(20) DEFAULT 'days', -- 'days', 'fixed'
  start_date_days INTEGER DEFAULT 2,
  allow_points_only BOOLEAN DEFAULT FALSE,
  reward_distribution VARCHAR(30) DEFAULT 'equal-split',
  selected_proof_types TEXT[],
  camera_only BOOLEAN DEFAULT FALSE,
  allow_late_submissions BOOLEAN DEFAULT FALSE,
  late_submission_hours INTEGER DEFAULT 4,
  bonus_rewards TEXT[],
  invite_code VARCHAR(20),

  -- Team challenge features
  enable_team_mode BOOLEAN DEFAULT FALSE,
  team_assignment_method VARCHAR(20) DEFAULT 'auto-balance',
  number_of_teams INTEGER DEFAULT 2,
  winning_criteria VARCHAR(30) DEFAULT 'completion-rate',
  losing_team_outcome VARCHAR(20) DEFAULT 'lose-stake',

  -- Referral features
  enable_referral_bonus BOOLEAN DEFAULT FALSE,
  referral_bonus_percentage DECIMAL(4,2) DEFAULT 20.00,
  max_referrals INTEGER DEFAULT 3,

  -- Timer and verification features
  require_timer BOOLEAN DEFAULT FALSE,
  timer_min_duration INTEGER DEFAULT 15,
  timer_max_duration INTEGER DEFAULT 120,
  random_checkin_enabled BOOLEAN DEFAULT FALSE,
  random_checkin_probability DECIMAL(4,2) DEFAULT 30.00,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Challenge participants with staking info
CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stake_amount DECIMAL(8,2) NOT NULL,
  entry_fee_paid DECIMAL(8,2) NOT NULL, -- 5% of stake
  insurance_purchased BOOLEAN DEFAULT FALSE,
  insurance_fee_paid DECIMAL(4,2) DEFAULT 0.00, -- $1.00 if purchased
  completion_status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'failed', 'disputed'
  proof_submitted BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reward_earned DECIMAL(8,2) DEFAULT 0.00,
  joined_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  UNIQUE(challenge_id, user_id)
);

-- Proof submissions for verification
CREATE TABLE proof_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES challenge_participants(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id),
  user_id UUID REFERENCES users(id),
  submission_type VARCHAR(20) NOT NULL, -- 'photo', 'video', 'text', 'auto_sync'
  file_url TEXT, -- S3 URL for media
  text_content TEXT,
  metadata JSONB, -- Auto-sync data, GPS coords, etc.
  ai_verification_score DECIMAL(4,2), -- 0-100 AI confidence
  admin_notes TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID REFERENCES users(id),
  submitted_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);

-- Financial transactions for revenue tracking
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  challenge_id UUID REFERENCES challenges(id),
  transaction_type VARCHAR(30) NOT NULL, -- 'stake_entry', 'entry_fee', 'insurance', 'reward', 'cashout', 'deposit'
  amount DECIMAL(10,2) NOT NULL,
  platform_revenue DECIMAL(10,2) DEFAULT 0.00, -- Platform's cut
  stripe_payment_id TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Credits ledger for internal economy
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL, -- Positive for credit, negative for debit
  transaction_type VARCHAR(30) NOT NULL,
  related_challenge_id UUID REFERENCES challenges(id),
  related_transaction_id UUID REFERENCES transactions(id),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Challenge chat/social features
CREATE TABLE challenge_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'chat', -- 'chat', 'system', 'cheer'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL, -- 'challenge', 'verification', 'system', 'social'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insurance claims
CREATE TABLE insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES challenge_participants(id),
  claim_reason TEXT NOT NULL,
  supporting_evidence JSONB, -- Photos, documents, etc.
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'denied'
  reviewed_by UUID REFERENCES users(id),
  claim_amount DECIMAL(8,2),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Platform revenue tracking
CREATE TABLE platform_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_type VARCHAR(30) NOT NULL, -- 'entry_fee', 'failed_stakes', 'premium', 'insurance', 'cashout_fee'
  amount DECIMAL(10,2) NOT NULL,
  challenge_id UUID REFERENCES challenges(id),
  user_id UUID REFERENCES users(id),
  transaction_id UUID REFERENCES transactions(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin audit logging for transparency
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL, -- 'user_update', 'challenge_moderate', 'trust_score_adjust'
  target_user_id UUID REFERENCES users(id),
  target_challenge_id UUID REFERENCES challenges(id),
  old_values JSONB, -- Store previous state
  new_values JSONB, -- Store new state
  reason TEXT NOT NULL, -- Required justification
  created_at TIMESTAMP DEFAULT NOW()
);

-- Account linking detection for sybil attacks
CREATE TABLE account_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID REFERENCES users(id),
  user_id_2 UUID REFERENCES users(id),
  link_type VARCHAR(20) NOT NULL, -- 'ip_address', 'device_fingerprint', 'payment_method'
  confidence_score INTEGER DEFAULT 0, -- 0-100
  detected_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id_1, user_id_2, link_type)
);

-- Suspicious activity tracking
CREATE TABLE suspicious_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  activity_type VARCHAR(30) NOT NULL, -- 'rapid_joining', 'fake_proof', 'collusion'
  description TEXT,
  metadata JSONB,
  severity VARCHAR(10) DEFAULT 'low', -- 'low', 'medium', 'high'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'false_positive'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Host custom rewards system
CREATE TABLE host_custom_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  host_id UUID REFERENCES users(id),
  reward_type VARCHAR(20) NOT NULL, -- 'digital_content', 'recognition', 'merchandise', 'experience', 'custom'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  descriptive_value TEXT, -- Non-monetary value description
  premium_only BOOLEAN DEFAULT FALSE,
  minimum_trust_score INTEGER,
  completion_requirement VARCHAR(20) DEFAULT 'all', -- 'all', 'partial', 'custom'
  delivery_method VARCHAR(20) DEFAULT 'platform', -- 'automatic', 'manual', 'email', 'platform'
  max_recipients INTEGER,
  recipients_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Track who received custom rewards
CREATE TABLE custom_reward_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID REFERENCES host_custom_rewards(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES challenge_participants(id),
  user_id UUID REFERENCES users(id),
  delivered_at TIMESTAMP DEFAULT NOW(),
  delivery_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'delivered', 'failed'
  delivery_notes TEXT
);

-- Premium community features
CREATE TABLE premium_community_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  channel_type VARCHAR(20) DEFAULT 'general', -- 'general', 'mentorship', 'networking', 'exclusive'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Premium community memberships
CREATE TABLE premium_community_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  channel_id UUID REFERENCES premium_community_channels(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, channel_id)
);

-- Premium challenge features tracking
CREATE TABLE premium_challenge_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  enhanced_communication BOOLEAN DEFAULT FALSE,
  progress_insights BOOLEAN DEFAULT FALSE,
  custom_milestones BOOLEAN DEFAULT FALSE,
  priority_support BOOLEAN DEFAULT FALSE,
  exclusive_updates BOOLEAN DEFAULT FALSE,
  custom_celebrations BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_start_date ON challenges(start_date);
CREATE INDEX idx_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_participants_user ON challenge_participants(user_id);
CREATE INDEX idx_participants_status ON challenge_participants(completion_status);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id);

-- Enhanced indexes for fraud detection
CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_target ON admin_actions(target_user_id);
CREATE INDEX idx_account_links_confidence ON account_links(confidence_score);
CREATE INDEX idx_suspicious_activities_user ON suspicious_activities(user_id);
CREATE INDEX idx_suspicious_activities_severity ON suspicious_activities(severity);

-- Enhanced indexes for premium features
CREATE INDEX idx_host_custom_rewards_challenge ON host_custom_rewards(challenge_id);
CREATE INDEX idx_host_custom_rewards_host ON host_custom_rewards(host_id);
CREATE INDEX idx_host_custom_rewards_premium ON host_custom_rewards(premium_only);
CREATE INDEX idx_custom_reward_recipients_reward ON custom_reward_recipients(reward_id);
CREATE INDEX idx_custom_reward_recipients_user ON custom_reward_recipients(user_id);
CREATE INDEX idx_premium_community_memberships_user ON premium_community_memberships(user_id);
CREATE INDEX idx_premium_challenge_features_challenge ON premium_challenge_features(challenge_id);

-- Functions for business logic
CREATE OR REPLACE FUNCTION calculate_challenge_rewards(challenge_uuid UUID)
RETURNS TABLE(participant_id UUID, reward_amount DECIMAL) AS $$
BEGIN
  -- Calculate rewards for completed participants
  -- Total failed stakes * (100% - platform_cut) / number_of_completers
  RETURN QUERY
  WITH challenge_stats AS (
    SELECT 
      c.failed_stake_cut,
      SUM(CASE WHEN cp.completion_status = 'failed' THEN cp.stake_amount ELSE 0 END) as total_failed_stakes,
      COUNT(CASE WHEN cp.completion_status = 'completed' THEN 1 END) as completers_count
    FROM challenges c
    JOIN challenge_participants cp ON c.id = cp.challenge_id
    WHERE c.id = challenge_uuid
    GROUP BY c.failed_stake_cut
  )
  SELECT 
    cp.id as participant_id,
    cp.stake_amount + 
    (cs.total_failed_stakes * (100 - cs.failed_stake_cut) / 100 / GREATEST(cs.completers_count, 1)) as reward_amount
  FROM challenge_participants cp
  CROSS JOIN challenge_stats cs
  WHERE cp.challenge_id = challenge_uuid 
    AND cp.completion_status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user trust score with anti-gaming measures
CREATE OR REPLACE FUNCTION update_trust_score() RETURNS TRIGGER AS $$
DECLARE
  challenge_difficulty TEXT;
  challenge_duration INTEGER;
  score_multiplier DECIMAL(3,2) := 1.0;
  recent_completions INTEGER;
BEGIN
  -- Get challenge details for context-aware scoring
  SELECT difficulty, EXTRACT(DAYS FROM (end_date - start_date))
  INTO challenge_difficulty, challenge_duration
  FROM challenges WHERE id = NEW.challenge_id;
  
  -- Calculate score multiplier based on difficulty and duration
  IF challenge_difficulty = 'Hard' THEN
    score_multiplier := 1.5;
  ELSIF challenge_difficulty = 'Medium' THEN
    score_multiplier := 1.2;
  END IF;
  
  -- Bonus for longer challenges
  IF challenge_duration >= 30 THEN
    score_multiplier := score_multiplier + 0.3;
  ELSIF challenge_duration >= 14 THEN
    score_multiplier := score_multiplier + 0.1;
  END IF;
  
  -- Anti-gaming: Check for suspicious rapid completions
  SELECT COUNT(*) INTO recent_completions
  FROM challenge_participants 
  WHERE user_id = NEW.user_id 
    AND completion_status = 'completed'
    AND completed_at > NOW() - INTERVAL '24 hours';

  IF NEW.completion_status = 'completed' AND OLD.completion_status != 'completed' THEN
    -- Reduce points for rapid farming (more than 3 completions in 24h)
    IF recent_completions > 3 THEN
      score_multiplier := score_multiplier * 0.5;
    END IF;
    
    UPDATE users 
    SET 
      trust_score = LEAST(100, trust_score + ROUND(2 * score_multiplier)),
      challenges_completed = challenges_completed + 1,
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1)
    WHERE id = NEW.user_id;
  ELSIF NEW.completion_status = 'failed' AND OLD.completion_status != 'failed' THEN
    UPDATE users 
    SET 
      current_streak = 0,
      trust_score = GREATEST(0, trust_score - ROUND(2 * score_multiplier))
    WHERE id = NEW.user_id;
  ELSIF NEW.verification_status = 'rejected' AND OLD.verification_status != 'rejected' THEN
    -- Harsh penalty for false claims
    UPDATE users 
    SET 
      trust_score = GREATEST(0, trust_score - 5),
      false_claims = false_claims + 1
    WHERE id = NEW.user_id;
    
    -- Auto-demote verification tier for repeat offenders
    UPDATE users 
    SET verification_tier = 'review'
    WHERE id = NEW.user_id AND false_claims >= 3;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trust_score_update 
AFTER UPDATE ON challenge_participants
FOR EACH ROW EXECUTE FUNCTION update_trust_score();
