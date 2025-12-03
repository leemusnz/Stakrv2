-- OAuth State Tracking Table Migration
-- Adds CSRF protection for OAuth flows
-- Created: December 3, 2025

-- Create oauth_states table for OAuth CSRF protection
CREATE TABLE IF NOT EXISTS oauth_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    state VARCHAR(128) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_states_user_provider ON oauth_states(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);

-- Add comments
COMMENT ON TABLE oauth_states IS 'Temporary OAuth state storage for CSRF protection (10-minute expiration)';
COMMENT ON COLUMN oauth_states.state IS 'Cryptographically secure random state for CSRF protection';
COMMENT ON COLUMN oauth_states.expires_at IS 'State expires after 10 minutes for security';

-- Log migration
DO $$ 
BEGIN
  RAISE NOTICE 'OAuth states table created successfully';
END $$;


