-- Posts Schema Migration
-- Creates tables for user posts, social interactions, and related functionality

-- Main posts table
CREATE TABLE IF NOT EXISTS user_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
    is_public BOOLEAN NOT NULL DEFAULT true,
    challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
    post_type VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (post_type IN ('general', 'proof_submission', 'milestone', 'achievement')),
    include_stats BOOLEAN NOT NULL DEFAULT false,
    include_challenge BOOLEAN NOT NULL DEFAULT false,
    attached_image TEXT, -- URL to attached image
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES user_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id) -- Prevent duplicate likes
);

-- Post comments table
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES user_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 300),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Post shares table (for tracking external shares)
CREATE TABLE IF NOT EXISTS post_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES user_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('twitter', 'facebook', 'linkedin', 'instagram', 'other')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User follows table (for social features)
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(follower_id, following_id), -- Prevent duplicate follows
    CHECK (follower_id != following_id) -- Prevent self-follows
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_posts_user_id ON user_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_posts_challenge_id ON user_posts(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_posts_created_at ON user_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_posts_public ON user_posts(is_public);
CREATE INDEX IF NOT EXISTS idx_user_posts_type ON user_posts(post_type);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_platform ON post_shares(platform);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_user_posts_updated_at ON user_posts;
CREATE TRIGGER update_user_posts_updated_at 
    BEFORE UPDATE ON user_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_post_comments_updated_at ON post_comments;
CREATE TRIGGER update_post_comments_updated_at 
    BEFORE UPDATE ON post_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for demo purposes
INSERT INTO user_posts (user_id, content, is_public, post_type, created_at) VALUES
('test-user-id', 'Just completed my first challenge on Stakr! Feeling motivated to keep going 💪 #StakrChallenge #Fitness', true, 'milestone', NOW() - INTERVAL '2 hours'),
('test-user-id', 'Day 15 of my morning workout challenge. The habit is really sticking! 🏃‍♀️', true, 'proof_submission', NOW() - INTERVAL '1 day'),
('test-user-id', 'My Stakr journey so far: 3 challenges completed, 85% success rate! 📈', true, 'general', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING; -- Skip if test-user-id doesn't exist

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_posts', 'post_likes', 'post_comments', 'post_shares', 'user_follows')
ORDER BY table_name;
