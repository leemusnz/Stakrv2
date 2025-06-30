-- Stakr Database Schema
-- Run this in your Neon SQL Editor to create all tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  credits DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  trust_score INTEGER DEFAULT 50 NOT NULL,
  verification_tier VARCHAR(20) DEFAULT 'manual' NOT NULL,
  challenges_completed INTEGER DEFAULT 0 NOT NULL,
  false_claims INTEGER DEFAULT 0 NOT NULL,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  premium_subscription BOOLEAN DEFAULT false NOT NULL,
  premium_expires_at TIMESTAMP,
  email_verified TIMESTAMP,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  category VARCHAR(100) NOT NULL,
  duration VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  min_stake DECIMAL(8, 2) NOT NULL,
  max_stake DECIMAL(8, 2) NOT NULL,
  host_id UUID REFERENCES users(id),
  host_contribution DECIMAL(8, 2) DEFAULT 0.00 NOT NULL,
  entry_fee_percentage DECIMAL(4, 2) DEFAULT 5.00 NOT NULL,
  failed_stake_cut DECIMAL(4, 2) DEFAULT 20.00 NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  verification_type VARCHAR(20) DEFAULT 'manual' NOT NULL,
  proof_requirements JSONB,
  rules TEXT[],
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Challenge participants table
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  stake_amount DECIMAL(8, 2) NOT NULL,
  entry_fee_paid DECIMAL(8, 2) NOT NULL,
  insurance_purchased BOOLEAN DEFAULT false NOT NULL,
  insurance_fee_paid DECIMAL(4, 2) DEFAULT 0.00 NOT NULL,
  completion_status VARCHAR(20) DEFAULT 'active' NOT NULL,
  proof_submitted BOOLEAN DEFAULT false NOT NULL,
  verification_status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  reward_earned DECIMAL(8, 2) DEFAULT 0.00 NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP,
  UNIQUE(challenge_id, user_id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  challenge_id UUID REFERENCES challenges(id),
  transaction_type VARCHAR(30) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  platform_revenue DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  stripe_payment_id TEXT,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(30) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  read BOOLEAN DEFAULT false NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_trust_score ON users(trust_score);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
CREATE INDEX IF NOT EXISTS idx_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Insert a test user (optional)
INSERT INTO users (email, name, credits, trust_score) 
VALUES ('test@stakr.app', 'Test User', 100.00, 75)
ON CONFLICT (email) DO NOTHING;

-- Check tables were created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
