-- Proof Submission System Schema Extension
-- Adds support for timed activities, random check-ins, and comprehensive proof tracking

-- Add random check-in settings to challenges table
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS require_timer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS timer_min_duration INTEGER DEFAULT 30, -- minimum minutes for timer
ADD COLUMN IF NOT EXISTS timer_max_duration INTEGER DEFAULT 120, -- maximum minutes for timer
ADD COLUMN IF NOT EXISTS random_checkin_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS random_checkin_probability DECIMAL(4,2) DEFAULT 30.00, -- 30% chance
ADD COLUMN IF NOT EXISTS random_checkin_min_interval INTEGER DEFAULT 10, -- min minutes between possible checks
ADD COLUMN IF NOT EXISTS random_checkin_max_interval INTEGER DEFAULT 45; -- max minutes between possible checks

-- Create activity sessions table for timed activities
CREATE TABLE IF NOT EXISTS activity_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES challenge_participants(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id),
    user_id UUID REFERENCES users(id),
    session_date DATE NOT NULL,
    started_at TIMESTAMP NOT NULL,
    planned_duration INTEGER NOT NULL, -- in minutes
    actual_duration INTEGER, -- actual completed time in minutes
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'abandoned', 'paused'
    completed_at TIMESTAMP,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    device_info JSONB,
    session_metadata JSONB, -- additional session data
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(participant_id, session_date)
);

-- Enhanced random check-ins table with gesture/word verification
CREATE TABLE IF NOT EXISTS random_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES activity_sessions(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES challenge_participants(id),
    challenge_id UUID REFERENCES challenges(id),
    user_id UUID REFERENCES users(id),
    triggered_at TIMESTAMP NOT NULL,
    checkin_type VARCHAR(30) NOT NULL, -- 'photo_gesture', 'video_gesture', 'photo_word', 'video_word', 'location_verify'
    checkin_prompt TEXT NOT NULL, -- What the user needs to do
    checkin_data JSONB, -- Expected response data
    
    -- Verifiable gesture/word requirements
    required_gesture VARCHAR(50), -- 'hold_up_fingers', 'thumbs_up', 'peace_sign', 'point_up', 'wave'
    gesture_details JSONB, -- {'finger_count': 3, 'hand': 'right', 'duration_seconds': 3}
    required_word VARCHAR(50), -- 'giraffe', 'elephant', 'rainbow', 'thunder', 'crystal'
    word_language VARCHAR(10) DEFAULT 'en', -- Language code for the word
    verification_difficulty INTEGER DEFAULT 1, -- 1-5 scale, higher = more complex gestures/words
    
    response_submitted_at TIMESTAMP,
    response_data JSONB, -- User's actual response
    response_valid BOOLEAN,
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'auto_approved'
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    time_to_respond_seconds INTEGER, -- How long user took to respond
    gesture_detected BOOLEAN, -- AI/manual verification of gesture
    word_detected BOOLEAN, -- Audio/manual verification of spoken word
    verification_confidence DECIMAL(4,2), -- 0-100% confidence in verification
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced daily_checkins table with timer integration
ALTER TABLE daily_checkins
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES activity_sessions(id),
ADD COLUMN IF NOT EXISTS submission_type VARCHAR(20) DEFAULT 'manual', -- 'manual', 'timer_based', 'auto_sync'
ADD COLUMN IF NOT EXISTS timer_duration INTEGER, -- actual timer duration in minutes
ADD COLUMN IF NOT EXISTS random_checkins_passed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS random_checkins_failed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_quality_score DECIMAL(4,2); -- 0-100 based on random check-ins and consistency

-- Create proof files table for media uploads
CREATE TABLE IF NOT EXISTS proof_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkin_id UUID REFERENCES daily_checkins(id) ON DELETE CASCADE,
    random_checkin_id UUID REFERENCES random_checkins(id) ON DELETE CASCADE,
    session_id UUID REFERENCES activity_sessions(id),
    file_type VARCHAR(20) NOT NULL, -- 'photo', 'video', 'audio'
    file_url TEXT NOT NULL, -- S3 or cloud storage URL
    file_size INTEGER, -- in bytes
    mime_type VARCHAR(100),
    duration INTEGER, -- for video/audio in seconds
    metadata JSONB, -- EXIF data, timestamps, gesture/word analysis
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Gesture and word verification templates
CREATE TABLE IF NOT EXISTS verification_gestures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gesture_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    difficulty_level INTEGER DEFAULT 1, -- 1-5 scale
    gesture_data JSONB NOT NULL, -- Details about the gesture
    usage_weight INTEGER DEFAULT 100, -- Probability weight for selection
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word VARCHAR(50) NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    difficulty_level INTEGER DEFAULT 1, -- 1-5 scale
    pronunciation_guide TEXT, -- Phonetic guide
    usage_weight INTEGER DEFAULT 100, -- Probability weight for selection
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(word, language)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_sessions_participant ON activity_sessions(participant_id);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_date ON activity_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_status ON activity_sessions(status);
CREATE INDEX IF NOT EXISTS idx_random_checkins_session ON random_checkins(session_id);
CREATE INDEX IF NOT EXISTS idx_random_checkins_triggered ON random_checkins(triggered_at);
CREATE INDEX IF NOT EXISTS idx_random_checkins_status ON random_checkins(verification_status);
CREATE INDEX IF NOT EXISTS idx_random_checkins_gesture ON random_checkins(required_gesture);
CREATE INDEX IF NOT EXISTS idx_random_checkins_word ON random_checkins(required_word);
CREATE INDEX IF NOT EXISTS idx_proof_files_checkin ON proof_files(checkin_id);
CREATE INDEX IF NOT EXISTS idx_proof_files_random_checkin ON proof_files(random_checkin_id);
CREATE INDEX IF NOT EXISTS idx_verification_gestures_active ON verification_gestures(is_active);
CREATE INDEX IF NOT EXISTS idx_verification_words_active ON verification_words(is_active, language);

-- Insert default gestures
INSERT INTO verification_gestures (gesture_name, description, difficulty_level, gesture_data, usage_weight) VALUES
('hold_up_fingers', 'Hold up a specific number of fingers', 1, '{"finger_counts": [1,2,3,4,5], "hands": ["left", "right"], "duration_seconds": 3}', 100),
('thumbs_up', 'Show thumbs up gesture', 1, '{"hands": ["left", "right", "both"], "duration_seconds": 2}', 80),
('peace_sign', 'Make peace sign with fingers', 2, '{"hands": ["left", "right"], "finger_position": "V", "duration_seconds": 3}', 70),
('point_up', 'Point index finger upward', 1, '{"hands": ["left", "right"], "direction": "up", "duration_seconds": 2}', 90),
('wave_hand', 'Wave your hand at the camera', 1, '{"hands": ["left", "right"], "movement": "side_to_side", "duration_seconds": 3}', 85),
('touch_nose', 'Touch your nose with index finger', 2, '{"hands": ["left", "right"], "target": "nose", "duration_seconds": 2}', 60),
('salute', 'Military-style salute', 2, '{"hand": "right", "position": "forehead", "duration_seconds": 3}', 50),
('ok_sign', 'Make OK sign with thumb and index finger', 2, '{"hands": ["left", "right"], "shape": "circle", "duration_seconds": 3}', 65);

-- Insert default verification words
INSERT INTO verification_words (word, language, difficulty_level, pronunciation_guide, usage_weight) VALUES
('giraffe', 'en', 1, 'juh-RAF', 100),
('elephant', 'en', 1, 'EL-uh-fuhnt', 100),
('rainbow', 'en', 1, 'RAYN-boh', 90),
('thunder', 'en', 1, 'THUHN-der', 90),
('crystal', 'en', 2, 'KRIS-tuhl', 80),
('butterfly', 'en', 2, 'BUHT-er-flahy', 80),
('mountain', 'en', 1, 'MOUN-tn', 95),
('ocean', 'en', 1, 'OH-shuhn', 95),
('volcano', 'en', 2, 'vol-KEY-noh', 70),
('telescope', 'en', 3, 'TEL-uh-skohp', 60),
('lightning', 'en', 2, 'LAHYT-ning', 75),
('adventure', 'en', 2, 'ad-VEN-cher', 75),
('magnificent', 'en', 3, 'mag-NIF-uh-suhnt', 50),
('serendipity', 'en', 4, 'ser-uhn-DIP-i-tee', 30),
('perseverance', 'en', 4, 'pur-suh-VEER-uhns', 35);

-- Enhanced function to generate random verification with gestures/words
CREATE OR REPLACE FUNCTION generate_random_verification_task(challenge_uuid UUID)
RETURNS TABLE(
    task_type VARCHAR, 
    prompt TEXT, 
    expected_data JSONB,
    gesture VARCHAR,
    gesture_data JSONB,
    word VARCHAR,
    word_pronunciation TEXT
) AS $$
DECLARE
    selected_gesture verification_gestures%ROWTYPE;
    selected_word verification_words%ROWTYPE;
    gesture_detail JSONB;
    verification_types TEXT[] := ARRAY['photo_gesture', 'video_gesture', 'photo_word', 'video_word'];
    selected_type TEXT;
    finger_count INTEGER;
    hand_choice TEXT;
    prompt_text TEXT;
BEGIN
    -- Randomly select verification type
    selected_type := verification_types[1 + floor(random() * array_length(verification_types, 1))];
    
    IF selected_type IN ('photo_gesture', 'video_gesture') THEN
        -- Select random gesture
        SELECT * INTO selected_gesture 
        FROM verification_gestures 
        WHERE is_active = true 
        ORDER BY random() * usage_weight DESC 
        LIMIT 1;
        
        gesture := selected_gesture.gesture_name;
        gesture_data := selected_gesture.gesture_data;
        
        -- Generate specific gesture requirements
        IF selected_gesture.gesture_name = 'hold_up_fingers' THEN
            finger_count := 1 + floor(random() * 5); -- 1-5 fingers
            hand_choice := (ARRAY['left', 'right'])[1 + floor(random() * 2)];
            gesture_detail := jsonb_build_object(
                'finger_count', finger_count,
                'hand', hand_choice,
                'duration_seconds', 3
            );
            prompt_text := format('Take a %s holding up %s fingers with your %s hand and keep them visible for 3 seconds',
                CASE WHEN selected_type = 'video_gesture' THEN 'video' ELSE 'photo' END,
                finger_count::text,
                hand_choice
            );
        ELSIF selected_gesture.gesture_name = 'thumbs_up' THEN
            hand_choice := (ARRAY['left', 'right'])[1 + floor(random() * 2)];
            gesture_detail := jsonb_build_object('hand', hand_choice, 'duration_seconds', 2);
            prompt_text := format('Take a %s showing thumbs up with your %s hand',
                CASE WHEN selected_type = 'video_gesture' THEN 'video' ELSE 'photo' END,
                hand_choice
            );
        ELSE
            gesture_detail := selected_gesture.gesture_data;
            prompt_text := format('Take a %s showing: %s', 
                CASE WHEN selected_type = 'video_gesture' THEN 'video' ELSE 'photo' END,
                selected_gesture.description
            );
        END IF;
        
        expected_data := jsonb_build_object(
            'type', selected_type,
            'required', true,
            'gesture_required', gesture,
            'gesture_details', gesture_detail,
            'time_limit_seconds', 60
        );
        
    ELSE -- photo_word or video_word
        -- Select random word
        SELECT * INTO selected_word 
        FROM verification_words 
        WHERE is_active = true AND language = 'en'
        ORDER BY random() * usage_weight DESC 
        LIMIT 1;
        
        word := selected_word.word;
        word_pronunciation := selected_word.pronunciation_guide;
        
        prompt_text := format('Take a %s of yourself clearly saying the word "%s" out loud',
            CASE WHEN selected_type = 'video_word' THEN 'video' ELSE 'selfie photo while' END,
            selected_word.word
        );
        
        expected_data := jsonb_build_object(
            'type', selected_type,
            'required', true,
            'word_required', selected_word.word,
            'pronunciation_guide', selected_word.pronunciation_guide,
            'time_limit_seconds', 60
        );
    END IF;
    
    task_type := selected_type;
    prompt := prompt_text;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate next random check-in time
CREATE OR REPLACE FUNCTION calculate_next_checkin_time(
    session_start TIMESTAMP,
    min_interval INTEGER,
    max_interval INTEGER,
    probability DECIMAL
) RETURNS TIMESTAMP AS $$
DECLARE
    random_offset INTEGER;
    base_interval INTEGER;
BEGIN
    -- Only schedule if probability check passes
    IF random() * 100 > probability THEN
        RETURN NULL; -- No check-in scheduled
    END IF;
    
    -- Calculate random interval between min and max
    base_interval := min_interval + floor(random() * (max_interval - min_interval + 1));
    
    -- Add some randomization to avoid predictability
    random_offset := floor(random() * (base_interval * 0.3)) - (base_interval * 0.15);
    
    RETURN session_start + INTERVAL '1 minute' * (base_interval + random_offset);
END;
$$ LANGUAGE plpgsql;

-- Function to update session quality score
CREATE OR REPLACE FUNCTION update_session_quality_score(session_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_checkins INTEGER;
    passed_checkins INTEGER;
    failed_checkins INTEGER;
    base_score DECIMAL := 100.00;
    quality_score DECIMAL;
BEGIN
    -- Count random check-ins for this session
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN response_valid = true THEN 1 END) as passed,
        COUNT(CASE WHEN response_valid = false THEN 1 END) as failed
    INTO total_checkins, passed_checkins, failed_checkins
    FROM random_checkins
    WHERE session_id = session_uuid;
    
    -- Calculate quality score
    IF total_checkins = 0 THEN
        quality_score := base_score; -- No random checks = baseline score
    ELSE
        -- Reduce score based on failed check-ins
        quality_score := base_score * (passed_checkins::DECIMAL / total_checkins);
        
        -- Bonus for completing check-ins quickly (implementation would check response times)
        -- Additional logic could be added here for response time analysis
    END IF;
    
    -- Update the daily check-in record
    UPDATE daily_checkins 
    SET 
        session_quality_score = quality_score,
        random_checkins_passed = passed_checkins,
        random_checkins_failed = failed_checkins
    WHERE session_id = session_uuid;
    
    RETURN quality_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update session quality when random check-ins are completed
CREATE OR REPLACE FUNCTION trigger_update_session_quality()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update when verification status changes to final state
    IF NEW.verification_status IN ('approved', 'rejected', 'auto_approved') 
       AND OLD.verification_status = 'pending' THEN
        PERFORM update_session_quality_score(NEW.session_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_quality_trigger
    AFTER UPDATE ON random_checkins
    FOR EACH ROW EXECUTE FUNCTION trigger_update_session_quality();

-- Comments for documentation
COMMENT ON COLUMN challenges.require_timer IS 'Whether this challenge requires timed activity sessions';
COMMENT ON COLUMN challenges.random_checkin_enabled IS 'Whether random verification check-ins are enabled during timer sessions';
COMMENT ON COLUMN challenges.random_checkin_probability IS 'Percentage chance (0-100) that a random check-in will be triggered';
COMMENT ON TABLE activity_sessions IS 'Timed activity sessions for challenges requiring active participation';
COMMENT ON TABLE random_checkins IS 'Random verification check-ins triggered during activity sessions';
COMMENT ON TABLE proof_files IS 'File uploads for proofs and verification responses';
COMMENT ON TABLE verification_gestures IS 'Templates for gesture verification tasks';
COMMENT ON TABLE verification_words IS 'Templates for word verification tasks'; 