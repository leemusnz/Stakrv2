-- Fix XP tracking for email signup vs OAuth signup
-- This migration adds XP awards for email verification and OAuth signup
-- and prevents duplicate XP awards between different auth methods

BEGIN;

-- Add unique constraint to prevent duplicate email verification XP
CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_transactions_email_verification_unique 
ON xp_transactions(user_id, source) 
WHERE source = 'email_verification';

-- Add unique constraint to prevent duplicate OAuth signup XP
CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_transactions_oauth_signup_unique 
ON xp_transactions(user_id, source) 
WHERE source = 'oauth_signup';

-- Update the award_xp function to handle email verification and OAuth signup
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_source VARCHAR(50),
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  current_xp INTEGER;
  new_xp INTEGER;
  new_level INTEGER;
BEGIN
  -- Get current XP
  SELECT COALESCE(xp, 0) INTO current_xp FROM users WHERE id = p_user_id;
  
  -- Check for duplicate awards (especially for onboarding, email verification, and OAuth signup)
  IF p_source = 'onboarding' THEN
    IF EXISTS (
      SELECT 1 FROM xp_transactions 
      WHERE user_id = p_user_id AND source = 'onboarding'
    ) THEN
      RAISE NOTICE 'Onboarding XP already awarded for user %', p_user_id;
      RETURN FALSE;
    END IF;
  END IF;
  
  IF p_source = 'email_verification' THEN
    IF EXISTS (
      SELECT 1 FROM xp_transactions 
      WHERE user_id = p_user_id AND source = 'email_verification'
    ) THEN
      RAISE NOTICE 'Email verification XP already awarded for user %', p_user_id;
      RETURN FALSE;
    END IF;
  END IF;
  
  IF p_source = 'oauth_signup' THEN
    IF EXISTS (
      SELECT 1 FROM xp_transactions 
      WHERE user_id = p_user_id AND source = 'oauth_signup'
    ) THEN
      RAISE NOTICE 'OAuth signup XP already awarded for user %', p_user_id;
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Prevent duplicate signup XP if user already has email verification XP
  -- This handles the case where someone signs up via email, then links OAuth
  IF p_source = 'oauth_signup' THEN
    IF EXISTS (
      SELECT 1 FROM xp_transactions 
      WHERE user_id = p_user_id AND source = 'email_verification'
    ) THEN
      RAISE NOTICE 'User % already has email verification XP, skipping OAuth signup XP', p_user_id;
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Prevent duplicate email verification XP if user already has OAuth signup XP
  -- This handles the case where someone signs up via OAuth, then verifies email
  IF p_source = 'email_verification' THEN
    IF EXISTS (
      SELECT 1 FROM xp_transactions 
      WHERE user_id = p_user_id AND source = 'oauth_signup'
    ) THEN
      RAISE NOTICE 'User % already has OAuth signup XP, skipping email verification XP', p_user_id;
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Calculate new XP and level
  new_xp := current_xp + p_amount;
  new_level := FLOOR(new_xp / 200) + 1;
  
  -- Update user XP and level
  UPDATE users 
  SET 
    xp = new_xp,
    level = new_level,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Record XP transaction
  INSERT INTO xp_transactions (user_id, amount, source, source_id, description)
  VALUES (p_user_id, p_amount, p_source, p_source_id, p_description);
  
  RAISE NOTICE 'Awarded % XP to user % (new total: %, level: %)', 
    p_amount, p_user_id, new_xp, new_level;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON FUNCTION award_xp IS 'Safely awards XP with duplicate prevention, automatic level calculation, and cross-auth method duplicate prevention';

COMMIT;

-- Verify the updated system
SELECT 'XP tracking system updated for email signup fixes!' as status;
