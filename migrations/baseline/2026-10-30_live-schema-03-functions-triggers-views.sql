-- Stakr LIVE schema baseline, part 3 of 3: functions, views, triggers.
-- Captured read-only from Neon project `cold-lab-24148964` on 30/10/2026.
-- pgcrypto's own functions are excluded (installed via CREATE EXTENSION in part 1).
-- DO NOT APPLY TO AN EXISTING DATABASE. See part 1 for context.

CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_amount integer, p_source character varying, p_source_id uuid DEFAULT NULL::uuid, p_description text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  current_xp INTEGER;
  new_xp INTEGER;
  new_level INTEGER;
BEGIN
  -- Get current XP
  SELECT COALESCE(xp, 0) INTO current_xp FROM users WHERE id = p_user_id;

  -- Check for duplicate awards (especially for onboarding and email verification)
  IF p_source = 'onboarding' THEN
    IF EXISTS (
      SELECT 1 FROM xp_transactions
      WHERE user_id = p_user_id AND source = 'onboarding'
    ) THEN
      RAISE NOTICE 'Onboarding XP already awarded for user %', p_user_id;
      RETURN FALSE;
    END IF;
  END IF;

  IF p_source = 'email_verification' THEN
    IF EXISTS (
      SELECT 1 FROM xp_transactions
      WHERE user_id = p_user_id AND source = 'email_verification'
    ) THEN
      RAISE NOTICE 'Email verification XP already awarded for user %', p_user_id;
      RETURN FALSE;
    END IF;
  END IF;

  IF p_source = 'oauth_signup' THEN
    IF EXISTS (
      SELECT 1 FROM xp_transactions
      WHERE user_id = p_user_id AND source = 'oauth_signup'
    ) THEN
      RAISE NOTICE 'OAuth signup XP already awarded for user %', p_user_id;
      RETURN FALSE;
    END IF;
  END IF;

  -- Prevent duplicate signup XP if user already has email verification XP
  -- This handles the case where someone signs up via email, then links OAuth
  IF p_source = 'oauth_signup' THEN
    IF EXISTS (
      SELECT 1 FROM xp_transactions
      WHERE user_id = p_user_id AND source = 'email_verification'
    ) THEN
      RAISE NOTICE 'User % already has email verification XP, skipping OAuth signup XP', p_user_id;
      RETURN FALSE;
    END IF;
  END IF;

  -- Prevent duplicate email verification XP if user already has OAuth signup XP
  -- This handles the case where someone signs up via OAuth, then verifies email
  IF p_source = 'email_verification' THEN
    IF EXISTS (
      SELECT 1 FROM xp_transactions
      WHERE user_id = p_user_id AND source = 'oauth_signup'
    ) THEN
      RAISE NOTICE 'User % already has OAuth signup XP, skipping email verification XP', p_user_id;
      RETURN FALSE;
    END IF;
  END IF;

  -- Calculate new XP and level
  new_xp := current_xp + p_amount;
  new_level := FLOOR(new_xp / 200) + 1;

  -- Update user XP and level
  UPDATE users
  SET
    xp = new_xp,
    level = new_level,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Record XP transaction
  INSERT INTO xp_transactions (user_id, amount, source, source_id, description)
  VALUES (p_user_id, p_amount, p_source, p_source_id, p_description);

  RAISE NOTICE 'Awarded % XP to user % (new total: %, level: %)',
    p_amount, p_user_id, new_xp, new_level;

  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  DELETE FROM verification_tokens
  WHERE expires_at < NOW() OR used_at IS NOT NULL;

  RAISE NOTICE 'Cleaned up expired/used verification tokens';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_moderation_logs()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Delete moderation logs older than 1 year
  DELETE FROM moderation_logs
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_social_feed_item(p_user_id uuid, p_activity_type character varying, p_title text, p_description text DEFAULT NULL::text, p_challenge_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
  feed_item_id UUID;
BEGIN
  INSERT INTO social_feed_items (
    user_id, activity_type, title, description, challenge_id, metadata
  ) VALUES (
    p_user_id, p_activity_type, p_title, p_description, p_challenge_id, p_metadata
  ) RETURNING id INTO feed_item_id;

  -- Update user's posts count
  INSERT INTO user_social_stats (user_id, posts_count)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET posts_count = user_social_stats.posts_count + 1;

  RETURN feed_item_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_verification_token(p_email character varying, p_token character varying, p_type character varying, p_expires_in_hours integer DEFAULT 24)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
  token_id UUID;
  user_id_found UUID;
BEGIN
  -- Find user by email
  SELECT id INTO user_id_found FROM users WHERE email = p_email;

  IF user_id_found IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', p_email;
  END IF;

  -- Invalidate any existing tokens of the same type for this email
  UPDATE verification_tokens
  SET used_at = NOW()
  WHERE email = p_email AND type = p_type AND used_at IS NULL;

  -- Create new token
  INSERT INTO verification_tokens (token, email, type, expires_at, user_id)
  VALUES (
    p_token,
    p_email,
    p_type,
    NOW() + (p_expires_in_hours || ' hours')::INTERVAL,
    user_id_found
  )
  RETURNING id INTO token_id;

  RETURN token_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.detect_file_duplicates()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_xp_history(p_user_id uuid)
 RETURNS TABLE(amount integer, source character varying, description text, created_at timestamp without time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    xt.amount,
    xt.source,
    xt.description,
    xt.created_at
  FROM xp_transactions xt
  WHERE xt.user_id = p_user_id
  ORDER BY xt.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_ai_detection(p_model_version character varying, p_prediction character varying, p_was_correct boolean, p_processing_time_ms integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.log_security_incident()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_update_risk_profile()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  PERFORM update_user_risk_profile(NEW.user_id, NEW.status);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_social_stats()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update follower/following counts
  IF TG_TABLE_NAME = 'social_follows' THEN
    IF TG_OP = 'INSERT' THEN
      -- Increment following count for follower
      INSERT INTO user_social_stats (user_id, following_count)
      VALUES (NEW.follower_id, 1)
      ON CONFLICT (user_id)
      DO UPDATE SET following_count = user_social_stats.following_count + 1;

      -- Increment followers count for followed user
      INSERT INTO user_social_stats (user_id, followers_count)
      VALUES (NEW.following_id, 1)
      ON CONFLICT (user_id)
      DO UPDATE SET followers_count = user_social_stats.followers_count + 1;

    ELSIF TG_OP = 'DELETE' THEN
      -- Decrement counts
      UPDATE user_social_stats
      SET following_count = GREATEST(0, following_count - 1)
      WHERE user_id = OLD.follower_id;

      UPDATE user_social_stats
      SET followers_count = GREATEST(0, followers_count - 1)
      WHERE user_id = OLD.following_id;
    END IF;
  END IF;

  -- Update likes counts
  IF TG_TABLE_NAME = 'social_feed_likes' THEN
    IF TG_OP = 'INSERT' THEN
      -- Update feed item likes count
      UPDATE social_feed_items
      SET likes_count = likes_count + 1
      WHERE id = NEW.feed_item_id;

      -- Update user stats
      INSERT INTO user_social_stats (user_id, likes_given)
      VALUES (NEW.user_id, 1)
      ON CONFLICT (user_id)
      DO UPDATE SET likes_given = user_social_stats.likes_given + 1;

    ELSIF TG_OP = 'DELETE' THEN
      -- Decrement counts
      UPDATE social_feed_items
      SET likes_count = GREATEST(0, likes_count - 1)
      WHERE id = OLD.feed_item_id;

      UPDATE user_social_stats
      SET likes_given = GREATEST(0, likes_given - 1)
      WHERE user_id = OLD.user_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_risk_profile(p_user_id uuid, p_submission_result character varying)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_storage_stats()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_verification_appeals_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_token(p_token character varying, p_type character varying)
 RETURNS TABLE(success boolean, message text, email character varying, user_id uuid)
 LANGUAGE plpgsql
AS $function$
DECLARE
  token_record RECORD;
BEGIN
  -- Find the token
  SELECT * INTO token_record
  FROM verification_tokens
  WHERE token = p_token AND type = p_type;

  -- Check if token exists
  IF token_record.id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Invalid or expired token', NULL::VARCHAR(255), NULL::UUID;
    RETURN;
  END IF;

  -- Check if token is already used
  IF token_record.used_at IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'Token has already been used', NULL::VARCHAR(255), NULL::UUID;
    RETURN;
  END IF;

  -- Check if token is expired
  IF token_record.expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, 'Token has expired', NULL::VARCHAR(255), NULL::UUID;
    RETURN;
  END IF;

  -- Mark token as used
  UPDATE verification_tokens
  SET used_at = NOW()
  WHERE id = token_record.id;

  -- Perform action based on token type
  IF p_type = 'email_verification' THEN
    -- Verify the user's email
    UPDATE users
    SET email_verified = TRUE, email_verified_at = NOW()
    WHERE id = token_record.user_id;

    RETURN QUERY SELECT TRUE, 'Email verified successfully', token_record.email, token_record.user_id;
  ELSIF p_type = 'password_reset' THEN
    -- Return success for password reset (password update handled separately)
    RETURN QUERY SELECT TRUE, 'Password reset token valid', token_record.email, token_record.user_id;
  ELSE
    RETURN QUERY SELECT FALSE, 'Unknown token type', NULL::VARCHAR(255), NULL::UUID;
  END IF;
END;
$function$
;

CREATE OR REPLACE VIEW recent_uploads_with_security AS  SELECT fu.id,
    fu.user_id,
    u.name AS user_name,
    u.email AS user_email,
    fu.challenge_id,
    c.title AS challenge_title,
    fu.original_filename,
    fu.file_type,
    fu.file_size,
    fu.risk_score,
    fu.security_flags,
    fu.validation_warnings,
    fu.created_at,
        CASE
            WHEN fu.risk_score >= 90 THEN 'critical'::text
            WHEN fu.risk_score >= 70 THEN 'high'::text
            WHEN fu.risk_score >= 40 THEN 'medium'::text
            ELSE 'low'::text
        END AS risk_level
   FROM file_uploads fu
     JOIN users u ON fu.user_id = u.id
     LEFT JOIN challenges c ON fu.challenge_id = c.id
  WHERE fu.created_at >= (now() - '7 days'::interval)
  ORDER BY fu.created_at DESC;

CREATE OR REPLACE VIEW user_storage_summary AS  SELECT u.id AS user_id,
    u.name,
    u.email,
    COALESCE(uss.total_files, 0) AS total_files,
    COALESCE(uss.total_size, 0::bigint) AS total_size_bytes,
    round(COALESCE(uss.total_size, 0::bigint)::numeric / 1024.0 / 1024.0, 2) AS total_size_mb,
    uss.last_upload,
    count(
        CASE
            WHEN fu.risk_score >= 70 THEN 1
            ELSE NULL::integer
        END) AS high_risk_files,
    count(
        CASE
            WHEN fu.created_at >= (now() - '30 days'::interval) THEN 1
            ELSE NULL::integer
        END) AS recent_uploads
   FROM users u
     LEFT JOIN user_storage_stats uss ON u.id = uss.user_id
     LEFT JOIN file_uploads fu ON u.id = fu.user_id
  GROUP BY u.id, u.name, u.email, uss.total_files, uss.total_size, uss.last_upload;

CREATE TRIGGER proof_submission_risk_update AFTER INSERT OR UPDATE OF status ON public.proof_submissions FOR EACH ROW EXECUTE FUNCTION trigger_update_risk_profile();

CREATE TRIGGER trigger_detect_duplicates AFTER INSERT ON public.file_uploads FOR EACH ROW EXECUTE FUNCTION detect_file_duplicates();

CREATE TRIGGER trigger_log_security_incidents AFTER INSERT ON public.file_uploads FOR EACH ROW EXECUTE FUNCTION log_security_incident();

CREATE TRIGGER trigger_update_social_stats_follows AFTER INSERT OR DELETE ON public.social_follows FOR EACH ROW EXECUTE FUNCTION update_social_stats();

CREATE TRIGGER trigger_update_social_stats_likes AFTER INSERT OR DELETE ON public.social_feed_likes FOR EACH ROW EXECUTE FUNCTION update_social_stats();

CREATE TRIGGER trigger_update_storage_stats AFTER INSERT OR DELETE ON public.file_uploads FOR EACH ROW EXECUTE FUNCTION update_user_storage_stats();

CREATE TRIGGER trigger_verification_appeals_updated_at BEFORE UPDATE ON public.verification_appeals FOR EACH ROW EXECUTE FUNCTION update_verification_appeals_updated_at();

CREATE TRIGGER update_app_data_updated_at BEFORE UPDATE ON public.app_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_integrations_updated_at BEFORE UPDATE ON public.app_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_workflows_updated_at BEFORE UPDATE ON public.audit_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_posts_updated_at BEFORE UPDATE ON public.user_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wearable_data_updated_at BEFORE UPDATE ON public.wearable_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wearable_integrations_updated_at BEFORE UPDATE ON public.wearable_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
