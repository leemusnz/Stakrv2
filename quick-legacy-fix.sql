-- Quick fix for legacy email verification
-- Run this directly in your Neon console

-- Mark all existing accounts as email verified
-- Set both the boolean flag and timestamp for legacy accounts
UPDATE users 
SET 
    email_verified = TRUE,
    email_verified_at = created_at
WHERE 
    email_verified = FALSE 
    AND created_at IS NOT NULL;

-- Check the results
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_verified = TRUE THEN 1 END) as verified_users,
    COUNT(CASE WHEN email_verified = FALSE THEN 1 END) as unverified_users,
    COUNT(email_verified_at) as users_with_verification_date
FROM users;
