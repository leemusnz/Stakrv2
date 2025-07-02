-- Enhanced File Upload System Schema
-- Comprehensive file tracking with security, fraud detection, and metadata

-- File uploads table with enhanced metadata
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  checkin_id UUID,
  session_id UUID,
  
  -- File information
  file_key TEXT NOT NULL, -- S3 key
  file_url TEXT NOT NULL, -- S3 URL
  original_filename TEXT NOT NULL,
  sanitized_filename TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- MIME type
  file_size BIGINT NOT NULL,
  
  -- Security and validation
  file_hash TEXT, -- SHA-256 hash for duplicate detection
  actual_mime_type VARCHAR(50), -- Detected via magic numbers
  dimensions JSONB, -- {width: number, height: number} for images
  risk_score INTEGER DEFAULT 0, -- 0-100
  security_flags JSONB, -- Array of security issues
  validation_errors JSONB, -- Array of validation errors
  validation_warnings JSONB, -- Array of warnings
  
  -- Verification context
  gesture_detected BOOLEAN DEFAULT FALSE,
  word_detected BOOLEAN DEFAULT FALSE,
  verification_confidence DECIMAL(4,2), -- 0-100%
  
  -- Additional metadata
  metadata JSONB, -- Comprehensive file metadata
  upload_status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
  processed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User storage statistics
CREATE TABLE user_storage_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_files INTEGER DEFAULT 0,
  total_size BIGINT DEFAULT 0, -- bytes
  last_upload TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Verification activities log
CREATE TABLE verification_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  file_upload_id UUID REFERENCES file_uploads(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'proof_uploaded', 'verified', 'rejected'
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- File duplicate detection table
CREATE TABLE file_duplicates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_hash TEXT NOT NULL,
  original_file_id UUID REFERENCES file_uploads(id) ON DELETE CASCADE,
  duplicate_file_id UUID REFERENCES file_uploads(id) ON DELETE CASCADE,
  similarity_score DECIMAL(4,2), -- 0-100% similarity
  detected_at TIMESTAMP DEFAULT NOW()
);

-- File processing queue for background tasks
CREATE TABLE file_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_upload_id UUID REFERENCES file_uploads(id) ON DELETE CASCADE,
  processing_type VARCHAR(50) NOT NULL, -- 'virus_scan', 'ai_analysis', 'compression'
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  priority INTEGER DEFAULT 0, -- Higher = more priority
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  result JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Security incidents log
CREATE TABLE file_security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_upload_id UUID REFERENCES file_uploads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  incident_type VARCHAR(50) NOT NULL, -- 'malware', 'fraud', 'suspicious_metadata'
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  description TEXT NOT NULL,
  evidence JSONB,
  status VARCHAR(20) DEFAULT 'open', -- open, investigating, resolved, false_positive
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX idx_file_uploads_challenge_id ON file_uploads(challenge_id);
CREATE INDEX idx_file_uploads_hash ON file_uploads(file_hash);
CREATE INDEX idx_file_uploads_risk_score ON file_uploads(risk_score);
CREATE INDEX idx_file_uploads_created_at ON file_uploads(created_at);
CREATE INDEX idx_file_uploads_status ON file_uploads(upload_status);

CREATE INDEX idx_verification_activities_user_id ON verification_activities(user_id);
CREATE INDEX idx_verification_activities_challenge_id ON verification_activities(challenge_id);
CREATE INDEX idx_verification_activities_created_at ON verification_activities(created_at);

CREATE INDEX idx_file_duplicates_hash ON file_duplicates(file_hash);
CREATE INDEX idx_file_duplicates_original ON file_duplicates(original_file_id);

CREATE INDEX idx_file_processing_queue_status ON file_processing_queue(status);
CREATE INDEX idx_file_processing_queue_priority ON file_processing_queue(priority DESC);
CREATE INDEX idx_file_processing_queue_created_at ON file_processing_queue(created_at);

CREATE INDEX idx_file_security_incidents_user_id ON file_security_incidents(user_id);
CREATE INDEX idx_file_security_incidents_severity ON file_security_incidents(severity);
CREATE INDEX idx_file_security_incidents_status ON file_security_incidents(status);

-- Functions for file management

-- Function to detect and log duplicates
CREATE OR REPLACE FUNCTION detect_file_duplicates()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check for duplicates if we have a hash
  IF NEW.file_hash IS NOT NULL THEN
    -- Look for existing files with same hash from same user
    INSERT INTO file_duplicates (file_hash, original_file_id, duplicate_file_id, similarity_score)
    SELECT 
      NEW.file_hash,
      fu.id,
      NEW.id,
      100.0 -- Exact hash match = 100% similarity
    FROM file_uploads fu
    WHERE fu.file_hash = NEW.file_hash 
      AND fu.user_id = NEW.user_id 
      AND fu.id != NEW.id
      AND fu.created_at < NEW.created_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to detect duplicates on insert
CREATE TRIGGER trigger_detect_duplicates 
  AFTER INSERT ON file_uploads 
  FOR EACH ROW 
  EXECUTE FUNCTION detect_file_duplicates();

-- Function to log security incidents
CREATE OR REPLACE FUNCTION log_security_incident()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if file has high risk score or critical security flags
  IF NEW.risk_score >= 70 OR 
     (NEW.security_flags IS NOT NULL AND 
      NEW.security_flags::text LIKE '%"severity":"critical"%') THEN
    
    INSERT INTO file_security_incidents (
      file_upload_id,
      user_id,
      incident_type,
      severity,
      description,
      evidence
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'high_risk_file',
      CASE 
        WHEN NEW.risk_score >= 90 THEN 'critical'
        WHEN NEW.risk_score >= 70 THEN 'high'
        ELSE 'medium'
      END,
      'File uploaded with high risk score: ' || NEW.risk_score,
      jsonb_build_object(
        'risk_score', NEW.risk_score,
        'security_flags', NEW.security_flags,
        'validation_errors', NEW.validation_errors
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log security incidents
CREATE TRIGGER trigger_log_security_incidents 
  AFTER INSERT ON file_uploads 
  FOR EACH ROW 
  EXECUTE FUNCTION log_security_incident();

-- Function to update user storage stats
CREATE OR REPLACE FUNCTION update_user_storage_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update storage stats for new uploads
    INSERT INTO user_storage_stats (user_id, total_files, total_size, last_upload)
    VALUES (NEW.user_id, 1, NEW.file_size, NEW.created_at)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      total_files = user_storage_stats.total_files + 1,
      total_size = user_storage_stats.total_size + NEW.file_size,
      last_upload = NEW.created_at,
      updated_at = NOW();
      
  ELSIF TG_OP = 'DELETE' THEN
    -- Update storage stats for deleted uploads
    UPDATE user_storage_stats 
    SET 
      total_files = GREATEST(0, total_files - 1),
      total_size = GREATEST(0, total_size - OLD.file_size),
      updated_at = NOW()
    WHERE user_id = OLD.user_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update storage stats
CREATE TRIGGER trigger_update_storage_stats 
  AFTER INSERT OR DELETE ON file_uploads 
  FOR EACH ROW 
  EXECUTE FUNCTION update_user_storage_stats();

-- Views for common queries

-- View for recent uploads with security info
CREATE VIEW recent_uploads_with_security AS
SELECT 
  fu.id,
  fu.user_id,
  u.name as user_name,
  u.email as user_email,
  fu.challenge_id,
  c.title as challenge_title,
  fu.original_filename,
  fu.file_type,
  fu.file_size,
  fu.risk_score,
  fu.security_flags,
  fu.validation_warnings,
  fu.created_at,
  CASE 
    WHEN fu.risk_score >= 90 THEN 'critical'
    WHEN fu.risk_score >= 70 THEN 'high'
    WHEN fu.risk_score >= 40 THEN 'medium'
    ELSE 'low'
  END as risk_level
FROM file_uploads fu
JOIN users u ON fu.user_id = u.id
LEFT JOIN challenges c ON fu.challenge_id = c.id
WHERE fu.created_at >= NOW() - INTERVAL '7 days'
ORDER BY fu.created_at DESC;

-- View for user storage summary
CREATE VIEW user_storage_summary AS
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  COALESCE(uss.total_files, 0) as total_files,
  COALESCE(uss.total_size, 0) as total_size_bytes,
  ROUND(COALESCE(uss.total_size, 0) / 1024.0 / 1024.0, 2) as total_size_mb,
  uss.last_upload,
  COUNT(CASE WHEN fu.risk_score >= 70 THEN 1 END) as high_risk_files,
  COUNT(CASE WHEN fu.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_uploads
FROM users u
LEFT JOIN user_storage_stats uss ON u.id = uss.user_id
LEFT JOIN file_uploads fu ON u.id = fu.user_id
GROUP BY u.id, u.name, u.email, uss.total_files, uss.total_size, uss.last_upload;

-- Insert sample data for testing
-- This will be removed in production

-- Sample security incident for demo
INSERT INTO file_security_incidents (
  file_upload_id,
  user_id,
  incident_type,
  severity,
  description,
  evidence,
  status
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM users LIMIT 1),
  'suspicious_filename',
  'medium',
  'File uploaded with suspicious filename pattern suggesting stock content',
  '{"pattern": "stock_photo_123.jpg", "risk_factors": ["stock_pattern", "generic_name"]}',
  'resolved'
) ON CONFLICT DO NOTHING;
