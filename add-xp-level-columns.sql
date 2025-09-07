-- Add XP and Level columns to users table
-- Run this in your Neon SQL Editor to add XP system support

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 NOT NULL;

-- Add indexes for XP and level queries
CREATE INDEX IF NOT EXISTS users_xp_idx ON users(xp);
CREATE INDEX IF NOT EXISTS users_level_idx ON users(level);

-- Update existing users to have default XP and level values
UPDATE users 
SET xp = 0, level = 1 
WHERE xp IS NULL OR level IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.xp IS 'User experience points earned through challenges and activities';
COMMENT ON COLUMN users.level IS 'User level calculated from XP (level = floor(xp/200) + 1)';
