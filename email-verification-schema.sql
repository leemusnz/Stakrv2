-- Email verification and password reset tokens schema

-- Create verification tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_email ON verification_tokens(email);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires ON verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_type ON verification_tokens(type);

-- Clean up expired tokens function
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_tokens 
  WHERE expires_at < NOW() OR used_at IS NOT NULL;
  
  RAISE NOTICE 'Cleaned up expired/used verification tokens';
END;
$$ LANGUAGE plpgsql;

-- Add email_verified column to users table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
        
        -- Update existing users to have verified emails (for backwards compatibility)
        UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;
        
        RAISE NOTICE 'Added email_verified column to users table';
    END IF;
END $$;

-- Add email_verified_at column to users table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email_verified_at'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP NULL;
        
        -- Set verification date for existing users
        UPDATE users SET email_verified_at = created_at WHERE email_verified = TRUE;
        
        RAISE NOTICE 'Added email_verified_at column to users table';
    END IF;
END $$;

-- Function to create verification token
CREATE OR REPLACE FUNCTION create_verification_token(
  p_email VARCHAR(255),
  p_token VARCHAR(255),
  p_type VARCHAR(50),
  p_expires_in_hours INTEGER DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
  token_id UUID;
  user_record RECORD;
BEGIN
  -- Find user by email
  SELECT id INTO user_record FROM users WHERE email = p_email;
  
  IF user_record.id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', p_email;
  END IF;
  
  -- Invalidate any existing tokens of the same type for this email
  UPDATE verification_tokens 
  SET used_at = NOW() 
  WHERE email = p_email AND type = p_type AND used_at IS NULL;
  
  -- Create new token
  INSERT INTO verification_tokens (token, email, type, expires_at, user_id)
  VALUES (
    p_token,
    p_email,
    p_type,
    NOW() + (p_expires_in_hours || ' hours')::INTERVAL,
    user_record.id
  )
  RETURNING id INTO token_id;
  
  RETURN token_id;
END;
$$ LANGUAGE plpgsql;

-- Function to verify token and perform action
CREATE OR REPLACE FUNCTION verify_token(
  p_token VARCHAR(255),
  p_type VARCHAR(50)
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  email VARCHAR(255),
  user_id UUID
) AS $$
DECLARE
  token_record RECORD;
  user_record RECORD;
BEGIN
  -- Find the token
  SELECT * INTO token_record 
  FROM verification_tokens 
  WHERE token = p_token AND type = p_type;
  
  -- Check if token exists
  IF token_record.id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Invalid or expired token', NULL::VARCHAR(255), NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if token is already used
  IF token_record.used_at IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'Token has already been used', NULL::VARCHAR(255), NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if token is expired
  IF token_record.expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, 'Token has expired', NULL::VARCHAR(255), NULL::UUID;
    RETURN;
  END IF;
  
  -- Mark token as used
  UPDATE verification_tokens 
  SET used_at = NOW() 
  WHERE id = token_record.id;
  
  -- Get user info
  SELECT * INTO user_record FROM users WHERE id = token_record.user_id;
  
  -- Perform action based on token type
  IF p_type = 'email_verification' THEN
    -- Verify the user's email
    UPDATE users 
    SET email_verified = TRUE, email_verified_at = NOW() 
    WHERE id = token_record.user_id;
    
    RETURN QUERY SELECT TRUE, 'Email verified successfully', token_record.email, token_record.user_id;
  ELSIF p_type = 'password_reset' THEN
    -- Return success for password reset (password update handled separately)
    RETURN QUERY SELECT TRUE, 'Password reset token valid', token_record.email, token_record.user_id;
  ELSE
    RETURN QUERY SELECT FALSE, 'Unknown token type', NULL::VARCHAR(255), NULL::UUID;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired tokens (if pg_cron is available)
-- SELECT cron.schedule('cleanup-tokens', '0 2 * * *', 'SELECT cleanup_expired_tokens();');

COMMENT ON TABLE verification_tokens IS 'Stores email verification and password reset tokens';
COMMENT ON FUNCTION create_verification_token IS 'Creates a new verification token for a user';
COMMENT ON FUNCTION verify_token IS 'Verifies a token and performs the associated action';
COMMENT ON FUNCTION cleanup_expired_tokens IS 'Removes expired and used tokens from the database';
