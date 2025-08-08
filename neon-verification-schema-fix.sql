-- 🔧 Neon Database: Verification Schema Fix
-- Run this directly in your Neon SQL console to fix the missing columns

-- Check current table structure first (optional)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'proof_submissions' 
ORDER BY ordinal_position;

-- Fix 1: Add submission_type column (main cause of API failures)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'submission_type'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN submission_type VARCHAR(20) NOT NULL DEFAULT 'manual';
        
        -- Remove default after adding column
        ALTER TABLE proof_submissions 
        ALTER COLUMN submission_type DROP DEFAULT;
        
        RAISE NOTICE 'Added submission_type column';
    ELSE
        RAISE NOTICE 'submission_type column already exists';
    END IF;
END $$;

-- Fix 2: Add admin_notes column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'admin_notes'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN admin_notes TEXT;
        RAISE NOTICE 'Added admin_notes column';
    ELSE
        RAISE NOTICE 'admin_notes column already exists';
    END IF;
END $$;

-- Fix 3: Add submitted_at column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'submitted_at'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN submitted_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Added submitted_at column';
    ELSE
        RAISE NOTICE 'submitted_at column already exists';
    END IF;
END $$;

-- Fix 4: Add other missing columns (if needed)
DO $$ 
BEGIN
    -- Add reviewed_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'reviewed_at'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN reviewed_at TIMESTAMP;
        RAISE NOTICE 'Added reviewed_at column';
    END IF;
    
    -- Add reviewed_by column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'reviewed_by'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN reviewed_by UUID REFERENCES users(id);
        RAISE NOTICE 'Added reviewed_by column';
    END IF;
    
    -- Add status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN status VARCHAR(20) DEFAULT 'pending' NOT NULL;
        RAISE NOTICE 'Added status column';
    END IF;
    
    -- Add ai_verification_score column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'ai_verification_score'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN ai_verification_score DECIMAL(4,2);
        RAISE NOTICE 'Added ai_verification_score column';
    END IF;
    
    -- Add metadata column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN metadata JSONB;
        RAISE NOTICE 'Added metadata column';
    END IF;
    
    -- Add file_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'file_url'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN file_url TEXT;
        RAISE NOTICE 'Added file_url column';
    END IF;
    
    -- Add text_content column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' 
        AND column_name = 'text_content'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD COLUMN text_content TEXT;
        RAISE NOTICE 'Added text_content column';
    END IF;
END $$;

-- Fix 5: Ensure verification_appeals table exists
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

-- Fix 6: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_proof_submissions_status ON proof_submissions(status);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_challenge ON proof_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_user ON proof_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_submitted_at ON proof_submissions(submitted_at);

-- Indexes for verification_appeals table
CREATE INDEX IF NOT EXISTS idx_verification_appeals_status ON verification_appeals(status);
CREATE INDEX IF NOT EXISTS idx_verification_appeals_user ON verification_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_appeals_verification ON verification_appeals(verification_id);

-- Verification: Check final table structure
SELECT 'proof_submissions' as table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'proof_submissions' 
ORDER BY ordinal_position

UNION ALL

SELECT 'verification_appeals' as table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'verification_appeals' 
ORDER BY ordinal_position;

-- Test that tables work
SELECT 'proof_submissions' as table_name, COUNT(*) as row_count FROM proof_submissions
UNION ALL
SELECT 'verification_appeals' as table_name, COUNT(*) as row_count FROM verification_appeals;

-- Success message
SELECT 'Verification schema fix completed successfully!' as result;
