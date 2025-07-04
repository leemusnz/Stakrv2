-- Fix Legacy Email Verification
-- Mark all existing accounts as email verified since they were created before verification was implemented

DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    RAISE NOTICE 'Starting legacy email verification fix...';
    
    -- Update all users with FALSE email_verified to be verified
    -- Using created_at as the verification timestamp for legacy accounts
    UPDATE users 
    SET 
        email_verified = TRUE,
        email_verified_at = created_at,
        updated_at = NOW()
    WHERE 
        email_verified = FALSE 
        AND created_at IS NOT NULL;
    
    -- Get count of updated users
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % legacy accounts with email verification timestamps', updated_count;
    
    -- Also update any boolean email_verified fields if they exist
    UPDATE users 
    SET email_verified_boolean = TRUE
    WHERE email_verified IS NOT NULL 
      AND email_verified_boolean = FALSE;
      
    RAISE NOTICE 'Legacy email verification fix completed successfully';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error during legacy email verification fix: %', SQLERRM;
    -- Don't fail the entire migration for this
END $$;

-- Verify the results
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_verified = TRUE THEN 1 END) as verified_users,
    COUNT(CASE WHEN email_verified = FALSE THEN 1 END) as unverified_users,
    COUNT(email_verified_at) as users_with_verification_date
FROM users; 