-- Fix Google OAuth User ID Format Issue
-- This script handles users created with numeric IDs instead of UUIDs

-- Step 1: Check if the problematic user exists
DO $$
DECLARE
    old_user_id TEXT := '116681594226615175759';
    user_email TEXT;
    user_name TEXT;
    user_credits DECIMAL(10,2);
    user_avatar TEXT;
    new_user_uuid UUID;
    user_exists BOOLEAN := FALSE;
BEGIN
    -- Check if user exists with numeric ID (this will fail if ID format is wrong)
    BEGIN
        SELECT email, name, credits, avatar_url 
        INTO user_email, user_name, user_credits, user_avatar
        FROM users 
        WHERE id::TEXT = old_user_id;
        
        user_exists := FOUND;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'User with numeric ID % not found or ID format invalid', old_user_id;
        user_exists := FALSE;
    END;

    -- If user doesn't exist, check by email (they might have been recreated)
    IF NOT user_exists THEN
        SELECT id, email, name, credits, avatar_url 
        INTO new_user_uuid, user_email, user_name, user_credits, user_avatar
        FROM users 
        WHERE email = 'leejmckenzie@gmail.com';
        
        IF FOUND THEN
            RAISE NOTICE 'User found by email with UUID: %', new_user_uuid;
            RAISE NOTICE 'User data: email=%, name=%, credits=%', user_email, user_name, user_credits;
        ELSE
            RAISE NOTICE 'User not found by email either. They may need to be recreated.';
        END IF;
    ELSE
        RAISE NOTICE 'Found user with numeric ID. This should not happen with UUID schema.';
    END IF;

    -- Report findings
    RAISE NOTICE 'Migration analysis complete for user: leejmckenzie@gmail.com';
END $$;

-- Step 2: If needed, create proper UUID user (only run if user doesn't exist)
-- Uncomment the following block if the user needs to be created:

/*
INSERT INTO users (
    email,
    name,
    avatar_url,
    credits,
    trust_score,
    verification_tier,
    email_verified,
    email_verified_at,
    created_at,
    updated_at
) VALUES (
    'leejmckenzie@gmail.com',
    'Lee McKenzie',  -- Update with actual name
    NULL,  -- Update with actual avatar URL if needed
    0.00,
    50,
    'manual',
    TRUE,
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    email_verified = TRUE,
    email_verified_at = NOW(),
    updated_at = NOW()
RETURNING id, email, name;
*/ 