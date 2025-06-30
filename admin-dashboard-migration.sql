-- Admin Dashboard Migration Script
-- This script adds all missing tables and columns needed for the admin dashboard

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create proof_submissions table (for verification system)
CREATE TABLE IF NOT EXISTS proof_submissions (
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

-- Create verification_appeals table (for appeals system)
CREATE TABLE IF NOT EXISTS verification_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID REFERENCES proof_submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  appeal_reason TEXT NOT NULL,
  additional_evidence TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  submitted_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure only one appeal per verification per user
  UNIQUE(verification_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_proof_submissions_status ON proof_submissions(status);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_challenge ON proof_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_user ON proof_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_submitted_at ON proof_submissions(submitted_at);

CREATE INDEX IF NOT EXISTS idx_verification_appeals_status ON verification_appeals(status);
CREATE INDEX IF NOT EXISTS idx_verification_appeals_user ON verification_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_appeals_verification ON verification_appeals(verification_id);
CREATE INDEX IF NOT EXISTS idx_verification_appeals_submitted_at ON verification_appeals(submitted_at);

CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Add trigger to update updated_at timestamp for appeals
CREATE OR REPLACE FUNCTION update_verification_appeals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_verification_appeals_updated_at
    BEFORE UPDATE ON verification_appeals
    FOR EACH ROW
    EXECUTE FUNCTION update_verification_appeals_updated_at();

-- Add some sample data for testing (optional)
-- Insert a sample proof submission
INSERT INTO proof_submissions (
  challenge_id, 
  user_id, 
  submission_type, 
  text_content, 
  status
) 
SELECT 
  c.id, 
  u.id, 
  'text', 
  'Sample proof submission for testing admin dashboard',
  'pending'
FROM challenges c, users u 
WHERE c.title IS NOT NULL 
  AND u.email IS NOT NULL 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Verify the migration was successful
SELECT 
  'proof_submissions' as table_name,
  COUNT(*) as record_count
FROM proof_submissions
UNION ALL
SELECT 
  'verification_appeals' as table_name,
  COUNT(*) as record_count
FROM verification_appeals
UNION ALL
SELECT 
  'users_with_last_login' as table_name,
  COUNT(*) as record_count
FROM users 
WHERE last_login IS NOT NULL;

-- Show table structure
\d proof_submissions;
\d verification_appeals; 