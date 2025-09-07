-- Add XP tracking system to prevent duplicate awards
-- Run this in your Neon SQL Editor to add XP tracking

BEGIN;

-- Create XP transactions table to track all XP awards
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'onboarding', 'challenge_completion', 'hosting', 'achievement', etc.
  source_id UUID, -- Reference to the source (challenge_id, achievement_id, etc.)
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for XP transactions
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_source ON xp_transactions(source);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created_at ON xp_transactions(created_at);

-- Add unique constraint to prevent duplicate onboarding XP
CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_transactions_onboarding_unique 
ON xp_transactions(user_id, source) 
WHERE source = 'onboarding';

-- Function to safely award XP with duplicate prevention
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
  
  -- Check for duplicate awards (especially for onboarding)
  IF p_source = 'onboarding' THEN
    IF EXISTS (
      SELECT 1 FROM xp_transactions 
      WHERE user_id = p_user_id AND source = 'onboarding'
    ) THEN
      RAISE NOTICE 'Onboarding XP already awarded for user %', p_user_id;
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

-- Function to get user's XP history
CREATE OR REPLACE FUNCTION get_user_xp_history(p_user_id UUID)
RETURNS TABLE(
  amount INTEGER,
  source VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    xt.amount,
    xt.source,
    xt.description,
    xt.created_at
  FROM xp_transactions xt
  WHERE xt.user_id = p_user_id
  ORDER BY xt.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE xp_transactions IS 'Tracks all XP awards to prevent duplicates and provide audit trail';
COMMENT ON FUNCTION award_xp IS 'Safely awards XP with duplicate prevention and automatic level calculation';
COMMENT ON FUNCTION get_user_xp_history IS 'Returns complete XP history for a user';

COMMIT;

-- Verify the new system
SELECT 'XP tracking system created successfully!' as status;
