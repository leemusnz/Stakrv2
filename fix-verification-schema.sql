-- Fix Verification Schema Migration
-- This script fixes the missing columns in proof_submissions table that are causing API failures

-- First, check if proof_submissions table exists, if not create it
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

-- Add missing columns if they don't exist
-- (These are the exact columns causing the API errors)

-- Add submission_type column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'submission_type'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN submission_type VARCHAR(20) NOT NULL DEFAULT 'manual';
        
        -- Update the default after adding the column
        ALTER TABLE proof_submissions 
        ALTER COLUMN submission_type DROP DEFAULT;
    END IF;
END $$;

-- Add admin_notes column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'admin_notes'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN admin_notes TEXT;
    END IF;
END $$;

-- Add submitted_at column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'submitted_at'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN submitted_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Ensure verification_appeals table exists (for appeals API)
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

-- Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_proof_submissions_status ON proof_submissions(status);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_challenge ON proof_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_user ON proof_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_submitted_at ON proof_submissions(submitted_at);

-- Create indexes for verification_appeals
CREATE INDEX IF NOT EXISTS idx_verification_appeals_status ON verification_appeals(status);
CREATE INDEX IF NOT EXISTS idx_verification_appeals_user ON verification_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_appeals_verification ON verification_appeals(verification_id);

-- Add any other missing columns from the schema
-- These are optional but good to have for completeness

-- Add reviewed_at column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'reviewed_at'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN reviewed_at TIMESTAMP;
    END IF;
END $$;

-- Add reviewed_by column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'reviewed_by'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN reviewed_by UUID REFERENCES users(id);
    END IF;
END $$;

-- Add status column if missing (with proper default)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN status VARCHAR(20) DEFAULT 'pending' NOT NULL;
    END IF;
END $$;

-- Add ai_verification_score column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'ai_verification_score'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN ai_verification_score DECIMAL(4,2);
    END IF;
END $$;

-- Add metadata column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN metadata JSONB;
    END IF;
END $$;

-- Add file_url column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'file_url'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN file_url TEXT;
    END IF;
END $$;

-- Add text_content column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'text_content'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN text_content TEXT;
    END IF;
END $$;

-- Verification: Display final table structure
\d proof_submissions;
\d verification_appeals;

-- Show row count to confirm tables exist
SELECT 'proof_submissions' as table_name, COUNT(*) as row_count FROM proof_submissions
UNION ALL
SELECT 'verification_appeals' as table_name, COUNT(*) as row_count FROM verification_appeals;

COMMIT;
