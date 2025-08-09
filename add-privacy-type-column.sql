-- Add missing privacy_type column to challenges table
-- This column is required for the discover page filtering

-- Add the privacy_type column if it doesn't exist
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS privacy_type VARCHAR(20) DEFAULT 'public' NOT NULL;

-- Update existing challenges to have privacy_type = 'public' if not set
UPDATE challenges 
SET privacy_type = 'public' 
WHERE privacy_type IS NULL OR privacy_type = '';

-- Add an index for performance
CREATE INDEX IF NOT EXISTS idx_challenges_privacy_type ON challenges(privacy_type);

-- Add composite index for discovery queries
CREATE INDEX IF NOT EXISTS idx_challenges_discovery ON challenges(privacy_type, status, created_at DESC);

-- Update any challenges that should be public based on existing data
-- (Assumes most existing challenges should be public unless specified otherwise)
UPDATE challenges 
SET privacy_type = 'public' 
WHERE privacy_type = 'public'; -- This ensures the default is applied

-- Comment for documentation
COMMENT ON COLUMN challenges.privacy_type IS 'Challenge visibility: public (discoverable) or private (invite only)';



