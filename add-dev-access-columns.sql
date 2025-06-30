-- Add dev access columns to users table
-- Run this script to add the new dev access functionality

-- Add dev access columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_dev BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS dev_mode_enabled BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS dev_access_granted_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS dev_access_granted_at TIMESTAMP;

-- Create index for dev users
CREATE INDEX IF NOT EXISTS users_dev_idx ON users(is_dev);

-- Grant dev access to existing admin user (alex@stakr.app)
UPDATE users 
SET is_dev = TRUE, 
    dev_access_granted_at = NOW(),
    dev_access_granted_by = (SELECT id FROM users WHERE email = 'alex@stakr.app' LIMIT 1)
WHERE email = 'alex@stakr.app';

-- Verify the changes
SELECT 
    email, 
    name, 
    is_dev, 
    dev_mode_enabled, 
    dev_access_granted_at 
FROM users 
WHERE is_dev = TRUE;

-- Show column structure
\d users;
