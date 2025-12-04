-- Migration: Add notification preferences system
-- Allows users to control which notifications they receive

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Challenge notifications
  challenge_joined BOOLEAN DEFAULT TRUE,
  challenge_starting_soon BOOLEAN DEFAULT TRUE,
  challenge_started BOOLEAN DEFAULT TRUE,
  challenge_ending_soon BOOLEAN DEFAULT TRUE,
  challenge_completed BOOLEAN DEFAULT TRUE,
  challenge_failed BOOLEAN DEFAULT TRUE,
  challenge_invite BOOLEAN DEFAULT TRUE,
  
  -- Verification notifications
  proof_reminder BOOLEAN DEFAULT TRUE,
  proof_submitted BOOLEAN DEFAULT TRUE,
  proof_approved BOOLEAN DEFAULT TRUE,
  proof_rejected BOOLEAN DEFAULT TRUE,
  appeal_result BOOLEAN DEFAULT TRUE,
  
  -- Social notifications
  nudge_received BOOLEAN DEFAULT TRUE,
  comment_received BOOLEAN DEFAULT TRUE,
  new_follower BOOLEAN DEFAULT TRUE,
  participant_joined BOOLEAN DEFAULT TRUE,
  
  -- Financial notifications
  payment_received BOOLEAN DEFAULT TRUE,
  withdrawal_processed BOOLEAN DEFAULT TRUE,
  reward_earned BOOLEAN DEFAULT TRUE,
  insurance_payout BOOLEAN DEFAULT TRUE,
  refund_processed BOOLEAN DEFAULT TRUE,
  
  -- Milestone notifications
  milestone_achieved BOOLEAN DEFAULT TRUE,
  streak_milestone BOOLEAN DEFAULT TRUE,
  reward_milestone BOOLEAN DEFAULT TRUE,
  
  -- System notifications
  welcome BOOLEAN DEFAULT TRUE,
  account_verified BOOLEAN DEFAULT TRUE,
  premium_status BOOLEAN DEFAULT TRUE,
  security_alerts BOOLEAN DEFAULT TRUE,
  platform_updates BOOLEAN DEFAULT FALSE,
  
  -- Email preferences (separate from in-app)
  email_challenge BOOLEAN DEFAULT TRUE,
  email_verification BOOLEAN DEFAULT TRUE,
  email_social BOOLEAN DEFAULT FALSE,
  email_financial BOOLEAN DEFAULT TRUE,
  email_milestones BOOLEAN DEFAULT TRUE,
  email_system BOOLEAN DEFAULT TRUE,
  
  -- Marketing preferences
  marketing_emails BOOLEAN DEFAULT FALSE,
  newsletter BOOLEAN DEFAULT FALSE,
  
  -- Digest settings
  daily_digest BOOLEAN DEFAULT FALSE,
  weekly_digest BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default preferences when user is created
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON users;
CREATE TRIGGER create_notification_preferences_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Create preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

