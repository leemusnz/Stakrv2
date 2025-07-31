-- 🛡️ AI Anti-Cheat System Database Schema
-- Comprehensive tracking of AI detection results and user behavior

-- ================================
-- PROOF SUBMISSIONS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS proof_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL,
  
  -- Submission content
  proof_type VARCHAR(50) NOT NULL CHECK (proof_type IN ('image', 'video', 'text', 'document')),
  proof_content TEXT NOT NULL, -- URL, base64, or text content
  proof_hash VARCHAR(64), -- SHA-256 hash for duplicate detection
  
  -- AI Analysis Results
  ai_confidence INTEGER CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
  ai_decision VARCHAR(20) CHECK (ai_decision IN ('approve', 'review', 'reject', 'ban')),
  ai_reasons JSONB, -- Array of reasons from AI analysis
  ai_layer_results JSONB, -- Detailed results from each AI layer
  
  -- Processing metadata
  processing_time_ms INTEGER, -- How long AI analysis took
  model_version VARCHAR(20) DEFAULT 'v1.0', -- Track which AI model version was used
  
  -- Submission status and tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'banned', 'pending_review', 'under_appeal'
  )),
  
  -- Human review data
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  human_decision VARCHAR(20) CHECK (human_decision IN ('approve', 'reject', 'ban')),
  human_notes TEXT,
  
  -- Appeals
  appeal_submitted_at TIMESTAMP,
  appeal_reason TEXT,
  appeal_reviewed_by UUID REFERENCES users(id),
  appeal_reviewed_at TIMESTAMP,
  appeal_decision VARCHAR(20) CHECK (appeal_decision IN ('approved', 'denied')),
  appeal_notes TEXT,
  
  -- Metadata and tracking
  device_info JSONB, -- Device fingerprinting data
  location_data JSONB, -- GPS coordinates, IP location, etc.
  submission_metadata JSONB, -- File size, EXIF data, etc.
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_proof_submissions_user_id ON proof_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_challenge_id ON proof_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_status ON proof_submissions(status);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_ai_decision ON proof_submissions(ai_decision);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_created_at ON proof_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_hash ON proof_submissions(proof_hash);

-- ================================
-- USER RISK PROFILES TABLE
-- ================================
CREATE TABLE IF NOT EXISTS user_risk_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Risk scoring
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Submission statistics
  total_submissions INTEGER DEFAULT 0,
  approved_submissions INTEGER DEFAULT 0,
  rejected_submissions INTEGER DEFAULT 0,
  flagged_submissions INTEGER DEFAULT 0,
  banned_submissions INTEGER DEFAULT 0,
  
  -- Behavioral patterns
  average_submission_interval INTEGER, -- Average time between submissions in minutes
  submission_time_patterns JSONB, -- Time of day patterns, etc.
  device_consistency_score INTEGER DEFAULT 100, -- How consistent device usage is
  location_consistency_score INTEGER DEFAULT 100, -- How consistent location is
  
  -- Flags and warnings
  active_flags JSONB DEFAULT '[]', -- Current red flags
  flag_history JSONB DEFAULT '[]', -- Historical flags
  
  -- Social network analysis
  social_risk_indicators JSONB DEFAULT '{}', -- Suspicious connections, etc.
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_analysis_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_risk_profiles_user_id ON user_risk_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_risk_profiles_risk_score ON user_risk_profiles(risk_score);
CREATE INDEX IF NOT EXISTS idx_user_risk_profiles_risk_level ON user_risk_profiles(risk_level);

-- ================================
-- AI MODEL PERFORMANCE TRACKING
-- ================================
CREATE TABLE IF NOT EXISTS ai_model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  
  -- Performance metrics
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  false_positives INTEGER DEFAULT 0,
  false_negatives INTEGER DEFAULT 0,
  
  -- Accuracy metrics
  accuracy_rate DECIMAL(5,2), -- Overall accuracy percentage
  precision_rate DECIMAL(5,2), -- True positives / (True positives + False positives)
  recall_rate DECIMAL(5,2), -- True positives / (True positives + False negatives)
  f1_score DECIMAL(5,2), -- Harmonic mean of precision and recall
  
  -- Processing metrics
  average_processing_time_ms INTEGER,
  max_processing_time_ms INTEGER,
  min_processing_time_ms INTEGER,
  
  -- Layer-specific performance
  layer_performance JSONB, -- Performance breakdown by AI layer
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_model_performance_version ON ai_model_performance(model_version);
CREATE INDEX IF NOT EXISTS idx_ai_model_performance_date ON ai_model_performance(date);

-- ================================
-- CHEAT DETECTION PATTERNS
-- ================================
CREATE TABLE IF NOT EXISTS cheat_detection_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Pattern identification
  pattern_name VARCHAR(100) NOT NULL,
  pattern_type VARCHAR(50) NOT NULL CHECK (pattern_type IN (
    'image_manipulation', 'behavioral_anomaly', 'social_collusion', 
    'temporal_impossibility', 'content_duplication', 'ai_generated_content'
  )),
  
  -- Pattern definition
  pattern_description TEXT NOT NULL,
  detection_rules JSONB NOT NULL, -- Machine-readable rules for this pattern
  confidence_threshold INTEGER DEFAULT 70, -- Minimum confidence to trigger
  
  -- Pattern statistics
  times_detected INTEGER DEFAULT 0,
  true_positive_count INTEGER DEFAULT 0,
  false_positive_count INTEGER DEFAULT 0,
  
  -- Pattern effectiveness
  effectiveness_score DECIMAL(5,2), -- How good this pattern is at catching cheats
  last_detection_at TIMESTAMP,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cheat_patterns_type ON cheat_detection_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_cheat_patterns_active ON cheat_detection_patterns(is_active);

-- ================================
-- BAN RECORDS AND APPEALS
-- ================================
CREATE TABLE IF NOT EXISTS ban_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Ban details
  ban_type VARCHAR(20) NOT NULL CHECK (ban_type IN ('temporary', 'permanent', 'shadow')),
  ban_reason VARCHAR(500) NOT NULL,
  ban_evidence JSONB, -- Links to proof submissions, AI analysis, etc.
  
  -- AI vs Human ban
  banned_by_ai BOOLEAN DEFAULT false,
  ai_confidence INTEGER, -- If AI ban, what was the confidence
  banned_by_human UUID REFERENCES users(id), -- If human ban, who did it
  
  -- Duration
  banned_at TIMESTAMP DEFAULT NOW(),
  ban_expires_at TIMESTAMP, -- NULL for permanent bans
  
  -- Appeal process
  appeal_count INTEGER DEFAULT 0,
  last_appeal_at TIMESTAMP,
  appeal_status VARCHAR(20) CHECK (appeal_status IN ('none', 'pending', 'approved', 'denied')),
  
  -- Resolution
  ban_lifted_at TIMESTAMP,
  ban_lifted_by UUID REFERENCES users(id),
  ban_lift_reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ban_records_user_id ON ban_records(user_id);
CREATE INDEX IF NOT EXISTS idx_ban_records_banned_at ON ban_records(banned_at);
CREATE INDEX IF NOT EXISTS idx_ban_records_ban_type ON ban_records(ban_type);

-- ================================
-- FUNCTIONS FOR AI SYSTEM
-- ================================

-- Function to update user risk profile
CREATE OR REPLACE FUNCTION update_user_risk_profile(
  p_user_id UUID,
  p_submission_result VARCHAR(20)
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_risk_profiles (user_id, total_submissions)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    total_submissions = user_risk_profiles.total_submissions + 1,
    approved_submissions = CASE 
      WHEN p_submission_result = 'approved' THEN user_risk_profiles.approved_submissions + 1
      ELSE user_risk_profiles.approved_submissions
    END,
    rejected_submissions = CASE 
      WHEN p_submission_result = 'rejected' THEN user_risk_profiles.rejected_submissions + 1
      ELSE user_risk_profiles.rejected_submissions
    END,
    flagged_submissions = CASE 
      WHEN p_submission_result IN ('review', 'flagged') THEN user_risk_profiles.flagged_submissions + 1
      ELSE user_risk_profiles.flagged_submissions
    END,
    banned_submissions = CASE 
      WHEN p_submission_result = 'banned' THEN user_risk_profiles.banned_submissions + 1
      ELSE user_risk_profiles.banned_submissions
    END,
    updated_at = NOW(),
    last_analysis_at = NOW();
    
  -- Update risk score based on submission history
  UPDATE user_risk_profiles SET
    risk_score = LEAST(100, GREATEST(0, 
      (rejected_submissions * 15) + 
      (flagged_submissions * 5) + 
      (banned_submissions * 50) - 
      (approved_submissions * 1)
    )),
    risk_level = CASE
      WHEN risk_score < 25 THEN 'low'
      WHEN risk_score < 50 THEN 'medium'
      WHEN risk_score < 75 THEN 'high'
      ELSE 'critical'
    END
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log AI detection result
CREATE OR REPLACE FUNCTION log_ai_detection(
  p_model_version VARCHAR(20),
  p_prediction VARCHAR(20),
  p_was_correct BOOLEAN,
  p_processing_time_ms INTEGER
)
RETURNS void AS $$
BEGIN
  INSERT INTO ai_model_performance (
    model_version, date, total_predictions, correct_predictions,
    false_positives, false_negatives, average_processing_time_ms
  )
  VALUES (
    p_model_version, CURRENT_DATE, 1,
    CASE WHEN p_was_correct THEN 1 ELSE 0 END,
    CASE WHEN NOT p_was_correct AND p_prediction IN ('reject', 'ban') THEN 1 ELSE 0 END,
    CASE WHEN NOT p_was_correct AND p_prediction IN ('approve') THEN 1 ELSE 0 END,
    p_processing_time_ms
  )
  ON CONFLICT (model_version, date) DO UPDATE SET
    total_predictions = ai_model_performance.total_predictions + 1,
    correct_predictions = ai_model_performance.correct_predictions + 
      CASE WHEN p_was_correct THEN 1 ELSE 0 END,
    false_positives = ai_model_performance.false_positives + 
      CASE WHEN NOT p_was_correct AND p_prediction IN ('reject', 'ban') THEN 1 ELSE 0 END,
    false_negatives = ai_model_performance.false_negatives + 
      CASE WHEN NOT p_was_correct AND p_prediction IN ('approve') THEN 1 ELSE 0 END,
    average_processing_time_ms = (
      (ai_model_performance.average_processing_time_ms * (ai_model_performance.total_predictions - 1)) + 
      p_processing_time_ms
    ) / ai_model_performance.total_predictions;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update user risk profile
CREATE OR REPLACE FUNCTION trigger_update_risk_profile()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_risk_profile(NEW.user_id, NEW.status);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER proof_submission_risk_update
  AFTER INSERT OR UPDATE OF status ON proof_submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_risk_profile();

-- ================================
-- INITIAL SETUP DATA
-- ================================

-- Insert some common cheat detection patterns
INSERT INTO cheat_detection_patterns (pattern_name, pattern_type, pattern_description, detection_rules) VALUES
('Stock Photo Detection', 'image_manipulation', 'Detects when users submit stock photos as personal proof', '{"min_resolution": 1920, "reverse_image_search": true, "metadata_checks": ["no_camera_info", "professional_editing"]}'),
('Impossible Timing', 'temporal_impossibility', 'Detects when completion times are physically impossible', '{"min_time_thresholds": {"workout": 600, "reading": 1800, "meditation": 300}}'),
('Batch Submissions', 'behavioral_anomaly', 'Detects when users submit multiple proofs within suspicious timeframes', '{"max_submissions_per_hour": 5, "suspicious_intervals": [60, 120, 300]}'),
('AI Generated Text', 'ai_generated_content', 'Detects when text submissions are generated by AI', '{"entropy_threshold": 7.5, "repetition_patterns": true, "llm_detection": true}'),
('Friend Collusion', 'social_collusion', 'Detects when friends help each other complete challenges', '{"shared_locations": true, "similar_submission_times": 1800, "image_similarity": 0.8}');

-- ================================
-- VIEWS FOR ANALYTICS
-- ================================

-- AI System Performance Dashboard View
CREATE OR REPLACE VIEW ai_system_dashboard AS
SELECT 
  model_version,
  SUM(total_predictions) as total_predictions,
  AVG(accuracy_rate) as avg_accuracy,
  AVG(precision_rate) as avg_precision,
  AVG(recall_rate) as avg_recall,
  AVG(f1_score) as avg_f1_score,
  AVG(average_processing_time_ms) as avg_processing_time
FROM ai_model_performance 
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY model_version
ORDER BY model_version DESC;

-- User Risk Summary View
CREATE OR REPLACE VIEW user_risk_summary AS
SELECT 
  u.email,
  u.name,
  urp.risk_score,
  urp.risk_level,
  urp.total_submissions,
  urp.approved_submissions,
  urp.rejected_submissions,
  urp.flagged_submissions,
  urp.banned_submissions,
  ROUND(
    CASE 
      WHEN urp.total_submissions > 0 
      THEN (urp.approved_submissions::decimal / urp.total_submissions) * 100 
      ELSE 0 
    END, 2
  ) as approval_rate
FROM users u
LEFT JOIN user_risk_profiles urp ON u.id = urp.user_id
WHERE urp.risk_level IN ('high', 'critical') OR urp.banned_submissions > 0
ORDER BY urp.risk_score DESC;

-- Daily AI Performance View
CREATE OR REPLACE VIEW daily_ai_performance AS
SELECT 
  date,
  model_version,
  total_predictions,
  accuracy_rate,
  false_positives,
  false_negatives,
  average_processing_time_ms
FROM ai_model_performance 
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC, model_version;

RAISE NOTICE '🛡️ AI Anti-Cheat Database Schema created successfully!';
RAISE NOTICE '📊 Views created: ai_system_dashboard, user_risk_summary, daily_ai_performance';
RAISE NOTICE '🔧 Functions created: update_user_risk_profile, log_ai_detection';
RAISE NOTICE '⚡ Triggers created: proof_submission_risk_update';
