-- Content Moderation System Database Schema
-- Run this migration to add moderation capabilities to Stakr

-- Moderation logs table to track all moderation decisions
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash VARCHAR(255) NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('text', 'image', 'video')),
  context VARCHAR(100) NOT NULL, -- profile_name, post, challenge_description, etc.
  service VARCHAR(50) NOT NULL, -- openai, aws_rekognition, local_profanity, etc.
  flagged BOOLEAN NOT NULL DEFAULT FALSE,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence INTEGER NOT NULL DEFAULT 0,
  action VARCHAR(20) NOT NULL CHECK (action IN ('approve', 'review', 'reject')),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User reports table for community-driven moderation
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reported_content_type VARCHAR(50) NOT NULL CHECK (reported_content_type IN ('user', 'post', 'challenge', 'profile')),
  reported_content_id UUID NOT NULL,
  report_reason VARCHAR(100) NOT NULL,
  report_details TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  moderator_id UUID REFERENCES users(id),
  moderator_action VARCHAR(100),
  moderator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moderation queue for items requiring human review
CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'profile', 'post', 'challenge')),
  content_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest priority
  flagged_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_confidence INTEGER NOT NULL DEFAULT 0,
  content_preview TEXT,
  content_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  assigned_moderator_id UUID REFERENCES users(id),
  moderator_decision VARCHAR(20) CHECK (moderator_decision IN ('approve', 'reject', 'edit_required')),
  moderator_notes TEXT,
  auto_flagged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User moderation actions tracking
CREATE TABLE IF NOT EXISTS user_moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('warning', 'suspension', 'content_removal', 'account_restriction')),
  reason TEXT NOT NULL,
  duration_hours INTEGER, -- NULL for permanent actions
  moderator_id UUID NOT NULL REFERENCES users(id),
  details JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add moderation status columns to existing tables
DO $$ 
BEGIN
  -- Add moderation columns to users table (for profile moderation)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'moderation_status') THEN
    ALTER TABLE users ADD COLUMN moderation_status VARCHAR(20) DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'suspended'));
    ALTER TABLE users ADD COLUMN moderation_notes TEXT;
    ALTER TABLE users ADD COLUMN last_moderated_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add moderation columns to user_posts table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_posts' AND column_name = 'moderation_status') THEN
    ALTER TABLE user_posts ADD COLUMN moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'hidden'));
    ALTER TABLE user_posts ADD COLUMN moderation_notes TEXT;
    ALTER TABLE user_posts ADD COLUMN auto_moderated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add moderation columns to challenges table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'challenges' AND column_name = 'moderation_status') THEN
    ALTER TABLE challenges ADD COLUMN moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'hidden'));
    ALTER TABLE challenges ADD COLUMN moderation_notes TEXT;
    ALTER TABLE challenges ADD COLUMN auto_moderated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add moderation columns to proof_submissions table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'proof_submissions' AND column_name = 'moderation_status') THEN
    ALTER TABLE proof_submissions ADD COLUMN moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'hidden'));
    ALTER TABLE proof_submissions ADD COLUMN moderation_notes TEXT;
    ALTER TABLE proof_submissions ADD COLUMN auto_moderated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_moderation_logs_content_hash ON moderation_logs(content_hash);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON moderation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_flagged ON moderation_logs(flagged);

CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_user ON user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_created_at ON user_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_priority ON moderation_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created_at ON moderation_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_assigned ON moderation_queue(assigned_moderator_id);

CREATE INDEX IF NOT EXISTS idx_user_moderation_active ON user_moderation_actions(user_id, active);
CREATE INDEX IF NOT EXISTS idx_user_moderation_expires ON user_moderation_actions(expires_at) WHERE expires_at IS NOT NULL;

-- Add moderation status indexes to existing tables
CREATE INDEX IF NOT EXISTS idx_users_moderation_status ON users(moderation_status);
CREATE INDEX IF NOT EXISTS idx_user_posts_moderation_status ON user_posts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_challenges_moderation_status ON challenges(moderation_status);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_moderation_status ON proof_submissions(moderation_status);

-- Create a function to automatically clean up old moderation logs (optional)
CREATE OR REPLACE FUNCTION cleanup_old_moderation_logs() 
RETURNS void AS $$
BEGIN
  -- Delete moderation logs older than 1 year
  DELETE FROM moderation_logs 
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE moderation_logs IS 'Logs all automated moderation decisions for audit trail';
COMMENT ON TABLE user_reports IS 'User-generated reports of inappropriate content or behavior';
COMMENT ON TABLE moderation_queue IS 'Queue of content items requiring human moderator review';
COMMENT ON TABLE user_moderation_actions IS 'Track moderation actions taken against users';

COMMENT ON COLUMN moderation_queue.priority IS 'Priority level 1-10, where 1 is highest priority';
COMMENT ON COLUMN user_moderation_actions.duration_hours IS 'Duration of temporary actions like suspensions, NULL for permanent';
COMMENT ON COLUMN user_moderation_actions.active IS 'Whether the moderation action is currently active'; 