-- Stakr Integration Tables Migration
-- Creates tables for wearable and app integrations

-- Wearable Integrations Table
CREATE TABLE IF NOT EXISTS wearable_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_type VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    auto_sync BOOLEAN DEFAULT true,
    privacy_level VARCHAR(20) DEFAULT 'standard' CHECK (privacy_level IN ('minimal', 'standard', 'detailed')),
    api_credentials JSONB, -- Encrypted/masked credentials
    last_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_type)
);

-- App Integrations Table
CREATE TABLE IF NOT EXISTS app_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    app_type VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    auto_sync BOOLEAN DEFAULT true,
    privacy_level VARCHAR(20) DEFAULT 'standard' CHECK (privacy_level IN ('minimal', 'standard', 'detailed')),
    api_credentials JSONB, -- Encrypted/masked credentials
    data_types JSONB, -- Array of data types to sync
    last_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, app_type)
);

-- Wearable Data Table
CREATE TABLE IF NOT EXISTS wearable_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_type VARCHAR(50) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    value NUMERIC NOT NULL,
    unit VARCHAR(20),
    timestamp TIMESTAMPTZ NOT NULL,
    metadata JSONB,
    challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    verification_confidence INTEGER CHECK (verification_confidence >= 0 AND verification_confidence <= 100),
    verification_reasons JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_type, timestamp, data_type)
);

-- App Data Table
CREATE TABLE IF NOT EXISTS app_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    app_type VARCHAR(50) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    value JSONB NOT NULL, -- Flexible storage for different data types
    timestamp TIMESTAMPTZ NOT NULL,
    metadata JSONB,
    challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    verification_confidence INTEGER CHECK (verification_confidence >= 0 AND verification_confidence <= 100),
    verification_reasons JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, app_type, timestamp, data_type)
);

-- Integration Sync Log Table
CREATE TABLE IF NOT EXISTS integration_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sync_type VARCHAR(20) NOT NULL CHECK (sync_type IN ('manual', 'auto', 'scheduled')),
    wearable_data_points INTEGER DEFAULT 0,
    app_data_points INTEGER DEFAULT 0,
    verification_results INTEGER DEFAULT 0,
    verified_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    errors JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_wearable_integrations_user_id ON wearable_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_integrations_device_enabled ON wearable_integrations(device_type, enabled);

CREATE INDEX IF NOT EXISTS idx_app_integrations_user_id ON app_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_app_integrations_app_enabled ON app_integrations(app_type, enabled);

CREATE INDEX IF NOT EXISTS idx_wearable_data_user_id ON wearable_data(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_data_challenge_id ON wearable_data(challenge_id);
CREATE INDEX IF NOT EXISTS idx_wearable_data_timestamp ON wearable_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_wearable_data_device_type ON wearable_data(device_type);
CREATE INDEX IF NOT EXISTS idx_wearable_data_verification_status ON wearable_data(verification_status);

CREATE INDEX IF NOT EXISTS idx_app_data_user_id ON app_data(user_id);
CREATE INDEX IF NOT EXISTS idx_app_data_challenge_id ON app_data(challenge_id);
CREATE INDEX IF NOT EXISTS idx_app_data_timestamp ON app_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_app_data_app_type ON app_data(app_type);
CREATE INDEX IF NOT EXISTS idx_app_data_verification_status ON app_data(verification_status);

CREATE INDEX IF NOT EXISTS idx_integration_sync_log_user_id ON integration_sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_sync_log_created_at ON integration_sync_log(created_at DESC);

-- Update Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_wearable_integrations_updated_at ON wearable_integrations;
CREATE TRIGGER update_wearable_integrations_updated_at 
    BEFORE UPDATE ON wearable_integrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_integrations_updated_at ON app_integrations;
CREATE TRIGGER update_app_integrations_updated_at 
    BEFORE UPDATE ON app_integrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wearable_data_updated_at ON wearable_data;
CREATE TRIGGER update_wearable_data_updated_at 
    BEFORE UPDATE ON wearable_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_data_updated_at ON app_data;
CREATE TRIGGER update_app_data_updated_at 
    BEFORE UPDATE ON app_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample Data for Development
INSERT INTO wearable_integrations (user_id, device_type, enabled, auto_sync, privacy_level) 
VALUES 
(
    (SELECT id FROM users WHERE email = 'demo@stakr.app' LIMIT 1),
    'apple_watch',
    true,
    true,
    'standard'
) ON CONFLICT (user_id, device_type) DO NOTHING;

INSERT INTO app_integrations (user_id, app_type, enabled, auto_sync, privacy_level, data_types) 
VALUES 
(
    (SELECT id FROM users WHERE email = 'demo@stakr.app' LIMIT 1),
    'duolingo',
    true,
    true,
    'standard',
    '["language_lesson", "learning_streak"]'::jsonb
) ON CONFLICT (user_id, app_type) DO NOTHING;

-- Comments
COMMENT ON TABLE wearable_integrations IS 'User wearable device integrations and configurations';
COMMENT ON TABLE app_integrations IS 'User third-party app integrations and configurations';
COMMENT ON TABLE wearable_data IS 'Synced data from wearable devices';
COMMENT ON TABLE app_data IS 'Synced data from integrated apps';
COMMENT ON TABLE integration_sync_log IS 'Log of integration sync operations';

COMMENT ON COLUMN wearable_integrations.api_credentials IS 'Encrypted API credentials (masked for security)';
COMMENT ON COLUMN wearable_integrations.privacy_level IS 'Data access level: minimal, standard, or detailed';

COMMENT ON COLUMN app_integrations.api_credentials IS 'Encrypted API credentials (masked for security)';
COMMENT ON COLUMN app_integrations.data_types IS 'Array of data types to sync from this app';

COMMENT ON COLUMN wearable_data.metadata IS 'Device-specific metadata (heart rate, GPS, etc.)';
COMMENT ON COLUMN wearable_data.verification_confidence IS 'AI verification confidence score (0-100)';

COMMENT ON COLUMN app_data.value IS 'Flexible JSON storage for different app data structures';
COMMENT ON COLUMN app_data.verification_confidence IS 'AI verification confidence score (0-100)';
