-- 🔧 Neon Database: Fix Remaining Missing Columns
-- Run this to add the columns that are still missing

-- Check what columns currently exist
SELECT 'Current columns in proof_submissions:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'proof_submissions' 
ORDER BY column_name;

-- Add admin_notes column (if missing)
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add submitted_at column (if missing) 
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP DEFAULT NOW();

-- Add file_url column (if missing)
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add other essential columns that might be missing
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS text_content TEXT;
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS ai_verification_score DECIMAL(4,2);
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE proof_submissions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

-- Add foreign key constraints if they don't exist (this might fail if constraints already exist, that's OK)
DO $$
BEGIN
    -- Add foreign key for reviewed_by if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'proof_submissions' 
        AND constraint_name = 'proof_submissions_reviewed_by_fkey'
    ) THEN
        ALTER TABLE proof_submissions 
        ADD CONSTRAINT proof_submissions_reviewed_by_fkey 
        FOREIGN KEY (reviewed_by) REFERENCES users(id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if constraint already exists or if there are data issues
        NULL;
END $$;

-- Verify what columns we have now
SELECT 'Columns after fix:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'proof_submissions' 
ORDER BY column_name;

-- Test that the problematic columns now exist
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' AND column_name = 'admin_notes'
    ) THEN '✅ admin_notes exists' 
    ELSE '❌ admin_notes missing' END as admin_notes_check,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' AND column_name = 'submitted_at'
    ) THEN '✅ submitted_at exists' 
    ELSE '❌ submitted_at missing' END as submitted_at_check,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_submissions' AND column_name = 'file_url'
    ) THEN '✅ file_url exists' 
    ELSE '❌ file_url missing' END as file_url_check;

-- Show current row count (should be 0 if table is empty)
SELECT COUNT(*) as current_rows FROM proof_submissions;
