-- Add username column to users table
-- Migration: Add username support

ALTER TABLE users 
ADD COLUMN username VARCHAR(50) UNIQUE;

-- Create index for username lookups
CREATE INDEX users_username_idx ON users(username);

-- Update existing users with a default username based on their email
UPDATE users 
SET username = SPLIT_PART(email, '@', 1) 
WHERE username IS NULL;

-- Make username not null after setting defaults
ALTER TABLE users 
ALTER COLUMN username SET NOT NULL; 