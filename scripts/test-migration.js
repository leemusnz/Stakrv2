#!/usr/bin/env node

/**
 * Test Migration Script
 * Directly executes the verification functions migration
 */

const { readFileSync } = require('fs')
const { neon } = require('@neondatabase/serverless')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

async function testMigration() {
  try {
    console.log('🔄 Testing verification functions migration...')
    
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }

    const sql = neon(process.env.DATABASE_URL)
    
    // Test 1: Create verification token function
    console.log('📄 Creating create_verification_token function...')
    
    const createFunctionSQL = `
CREATE OR REPLACE FUNCTION create_verification_token(
  p_email VARCHAR(255),
  p_token VARCHAR(255),
  p_type VARCHAR(50),
  p_hours_valid INTEGER DEFAULT 24
) RETURNS BOOLEAN AS $$
DECLARE
  found_user_id UUID;
BEGIN
  -- Get user ID by email
  SELECT id INTO found_user_id FROM users WHERE email = p_email LIMIT 1;
  
  IF found_user_id IS NULL THEN
    RAISE NOTICE 'User not found for email: %', p_email;
    RETURN FALSE;
  END IF;
  
  -- Delete any existing tokens for this user and type
  DELETE FROM verification_tokens 
  WHERE user_id = found_user_id AND token_type = p_type;
  
  -- Insert new token
  INSERT INTO verification_tokens (
    user_id,
    email,
    token,
    token_type,
    expires_at,
    created_at
  ) VALUES (
    found_user_id,
    p_email,
    p_token,
    p_type,
    NOW() + (p_hours_valid || ' hours')::INTERVAL,
    NOW()
  );
  
  RAISE NOTICE 'Created % token for user % (expires in % hours)', p_type, p_email, p_hours_valid;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;`
    
    await sql.unsafe(createFunctionSQL)
    console.log('✅ create_verification_token function created successfully!')
    
    // Test 2: Create verify token function
    console.log('📄 Creating verify_token function...')
    
    const verifyFunctionSQL = `
CREATE OR REPLACE FUNCTION verify_token(
  p_token VARCHAR(255),
  p_type VARCHAR(50)
) RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  user_id UUID,
  email VARCHAR(255)
) AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Check if token exists and is valid
  SELECT vt.user_id, vt.email, vt.expires_at
  INTO token_record
  FROM verification_tokens vt
  WHERE vt.token = p_token 
    AND vt.token_type = p_type 
    AND vt.expires_at > NOW()
  LIMIT 1;
  
  IF token_record IS NULL THEN
    RETURN QUERY SELECT 
      FALSE as success,
      'Invalid or expired token' as message,
      NULL::UUID as user_id,
      NULL::VARCHAR(255) as email;
    RETURN;
  END IF;
  
  -- Update user's verification status based on token type
  IF p_type = 'email_verification' THEN
    UPDATE users 
    SET email_verified = true, email_verified_at = NOW()
    WHERE id = token_record.user_id;
  END IF;
  
  -- Delete the used token
  DELETE FROM verification_tokens WHERE token = p_token;
  
  -- Return success
  RETURN QUERY SELECT 
    TRUE as success,
    'Token verified successfully' as message,
    token_record.user_id,
    token_record.email;
END;
$$ LANGUAGE plpgsql;`
    
    await sql.unsafe(verifyFunctionSQL)
    console.log('✅ verify_token function created successfully!')
    
    // Test 3: Verify functions exist
    console.log('🔍 Verifying functions were created...')
    
    const functionCheck = await sql`
      SELECT proname, prosrc 
      FROM pg_proc 
      WHERE proname IN ('create_verification_token', 'verify_token')
    `
    
    console.log('📊 Functions found:', functionCheck.length)
    for (const func of functionCheck) {
      console.log(`  ✅ ${func.proname}`)
    }
    
    console.log('🎉 Migration test completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration test failed:', error)
    console.error('Error details:', error.message)
    process.exit(1)
  }
}

testMigration().catch(console.error)
