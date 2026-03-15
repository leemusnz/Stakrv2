-- Create rank_history table for tracking leaderboard rank changes
CREATE TABLE IF NOT EXISTS rank_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- 'overall', 'earnings', 'streaks', 'completions'
  timeframe VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'all-time'
  rank INTEGER NOT NULL,
  score NUMERIC(12, 2) NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS rank_history_user_category_timeframe_idx ON rank_history(user_id, category, timeframe);
CREATE INDEX IF NOT EXISTS rank_history_user_idx ON rank_history(user_id);
CREATE INDEX IF NOT EXISTS rank_history_recorded_at_idx ON rank_history(recorded_at);
CREATE INDEX IF NOT EXISTS rank_history_category_timeframe_idx ON rank_history(category, timeframe);
