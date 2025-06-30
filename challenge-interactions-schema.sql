-- Challenge Interactions Schema Migration
-- Creates tables for nudging, cheering, and notifications

-- Challenge interactions table (nudges, cheers, etc.)
CREATE TABLE IF NOT EXISTS challenge_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('nudge', 'cheer', 'high_five', 'encouragement')),
    message TEXT CHECK (char_length(message) <= 200),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Prevent self-interactions
    CHECK (sender_id != target_user_id)
);

-- Enhanced notifications table 
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('nudge', 'cheer', 'verification_reminder', 'milestone', 'challenge_update', 'system')),
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL CHECK (char_length(content) <= 300),
    challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_url TEXT, -- Link to relevant page/action
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenge_interactions_challenge_id ON challenge_interactions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_interactions_sender_id ON challenge_interactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_challenge_interactions_target_user_id ON challenge_interactions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_interactions_type ON challenge_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_challenge_interactions_created_at ON challenge_interactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_challenge_id ON notifications(challenge_id);

-- Add trigger to automatically set read_at when is_read changes to true
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = true AND OLD.is_read = false THEN
        NEW.read_at = NOW();
    ELSIF NEW.is_read = false THEN
        NEW.read_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_notification_read_at ON notifications;
CREATE TRIGGER trigger_notification_read_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_notification_read_at();

-- Insert some sample interactions for demo purposes
INSERT INTO challenge_interactions (challenge_id, sender_id, target_user_id, interaction_type, message, created_at) VALUES
('demo-challenge-1', 'test-user-id', 'demo-user-2', 'cheer', 'Great job on your streak! Keep it up! 🔥', NOW() - INTERVAL '2 hours'),
('demo-challenge-1', 'demo-user-3', 'test-user-id', 'nudge', 'Friendly reminder to check in today! 🔔', NOW() - INTERVAL '6 hours'),
('demo-challenge-1', 'demo-user-1', 'demo-user-4', 'cheer', 'Amazing progress this week! 💪', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING; -- Skip if demo users don't exist

-- Insert sample notifications
INSERT INTO notifications (user_id, type, title, content, challenge_id, sender_id, is_read, created_at) VALUES
('test-user-id', 'cheer', 'You Got Cheered!', 'Sarah Chen is cheering you on in "30-Day Fitness Challenge"! Keep up the amazing work!', 'demo-challenge-1', 'demo-user-1', false, NOW() - INTERVAL '1 hour'),
('test-user-id', 'milestone', 'Milestone Reached!', 'Congratulations! You reached 50% completion in your fitness challenge 🎯', 'demo-challenge-1', NULL, false, NOW() - INTERVAL '3 hours'),
('test-user-id', 'verification_reminder', 'Verification Pending', 'Don''t forget to submit your proof for today''s workout! ⏰', 'demo-challenge-1', NULL, false, NOW() - INTERVAL '5 hours')
ON CONFLICT DO NOTHING; -- Skip if test-user-id doesn't exist

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('challenge_interactions', 'notifications')
ORDER BY table_name;
