-- Verification Appeals System Database Schema
-- Run this after the main database migration

-- Create verification_appeals table
CREATE TABLE IF NOT EXISTS verification_appeals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appeal_reason TEXT NOT NULL,
    additional_evidence TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one appeal per verification per user
    UNIQUE(verification_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_appeals_status ON verification_appeals(status);
CREATE INDEX IF NOT EXISTS idx_verification_appeals_user_id ON verification_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_appeals_verification_id ON verification_appeals(verification_id);
CREATE INDEX IF NOT EXISTS idx_verification_appeals_submitted_at ON verification_appeals(submitted_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_verification_appeals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_verification_appeals_updated_at
    BEFORE UPDATE ON verification_appeals
    FOR EACH ROW
    EXECUTE FUNCTION update_verification_appeals_updated_at();

-- Update admin_actions table to include verification reversal actions
-- (This assumes admin_actions table already exists from previous migration)
INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details, created_at)
VALUES (
    (SELECT id FROM users WHERE email = 'alex@stakr.app' LIMIT 1),
    'schema_update',
    'database',
    'verification_appeals',
    '{"action": "created_appeals_system", "tables": ["verification_appeals"], "features": ["appeal_submission", "appeal_review", "decision_reversal"]}',
    NOW()
) ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE verification_appeals IS 'Stores user appeals for rejected verifications';
COMMENT ON COLUMN verification_appeals.appeal_reason IS 'User explanation for why the verification should be reconsidered';
COMMENT ON COLUMN verification_appeals.additional_evidence IS 'Optional additional proof or context provided by user';
COMMENT ON COLUMN verification_appeals.status IS 'Current status of the appeal: pending, approved, or rejected';
COMMENT ON COLUMN verification_appeals.admin_notes IS 'Admin reason for approving or rejecting the appeal';
COMMENT ON COLUMN verification_appeals.reviewed_by IS 'Admin user who processed the appeal';

-- Sample data for testing (optional - remove in production)
-- INSERT INTO verification_appeals (verification_id, user_id, appeal_reason, additional_evidence, status)
-- SELECT 
--     v.id as verification_id,
--     v.user_id,
--     'This is a test appeal for development purposes' as appeal_reason,
--     'Additional test evidence' as additional_evidence,
--     'pending' as status
-- FROM verifications v 
-- WHERE v.status = 'rejected' 
-- LIMIT 1;

-- Grant appropriate permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON verification_appeals TO stakr_app_user;
-- GRANT USAGE ON SEQUENCE verification_appeals_id_seq TO stakr_app_user; 