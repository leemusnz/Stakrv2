-- Add missing team_id column to challenge_participants table
-- This enables team challenge functionality

-- Add team_id column to challenge_participants
ALTER TABLE challenge_participants 
ADD COLUMN team_id UUID;

-- Add foreign key constraint if challenge_teams table exists
-- (This will fail gracefully if the table doesn't exist)
DO $$ 
BEGIN
    -- Check if challenge_teams table exists before adding foreign key
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'challenge_teams') THEN
        ALTER TABLE challenge_participants 
        ADD CONSTRAINT fk_challenge_participants_team_id 
        FOREIGN KEY (team_id) REFERENCES challenge_teams(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add index on team_id for better query performance
CREATE INDEX IF NOT EXISTS idx_challenge_participants_team_id ON challenge_participants(team_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'challenge_participants' 
AND column_name = 'team_id';
