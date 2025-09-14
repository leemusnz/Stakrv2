#!/usr/bin/env node

/**
 * Test Verification Flow Script
 * Tests the complete verification flow end-to-end
 */

const { neon } = require('@neondatabase/serverless')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

async function testVerificationFlow() {
  try {
    console.log('🔄 Testing complete verification flow...')
    
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }

    const sql = neon(process.env.DATABASE_URL)
    
    // Test 1: Check if verification functions exist
    console.log('📄 Checking if verification functions exist...')
    
    const functionCheck = await sql`
      SELECT proname 
      FROM pg_proc 
      WHERE proname IN ('create_verification_token', 'verify_token')
    `
    
    console.log('📊 Functions found:', functionCheck.length)
    for (const func of functionCheck) {
      console.log(`  ✅ ${func.proname}`)
    }
    
    if (functionCheck.length !== 2) {
      throw new Error('Missing verification functions!')
    }
    
    // Test 2: Check if verification_tokens table exists and has data
    console.log('📄 Checking verification_tokens table...')
    
    const tableCheck = await sql`
      SELECT COUNT(*) as count
      FROM verification_tokens
    `
    
    console.log('📊 Verification tokens in database:', tableCheck[0].count)
    
    // Test 3: Check if there are any recent users
    console.log('📄 Checking recent users...')
    
    const userCheck = await sql`
      SELECT id, email, email_verified, created_at
      FROM users
      WHERE created_at > NOW() - INTERVAL '1 hour'
      ORDER BY created_at DESC
      LIMIT 5
    `
    
    console.log('📊 Recent users found:', userCheck.length)
    for (const user of userCheck) {
      console.log(`  👤 ${user.email} - Verified: ${user.email_verified} - Created: ${user.created_at}`)
    }
    
    // Test 4: Check if there are any pending verification tokens
    console.log('📄 Checking pending verification tokens...')
    
    const tokenCheck = await sql`
      SELECT vt.email, vt.type, vt.expires_at, vt.created_at
      FROM verification_tokens vt
      WHERE vt.expires_at > NOW()
      ORDER BY vt.created_at DESC
      LIMIT 5
    `
    
    console.log('📊 Pending verification tokens:', tokenCheck.length)
    for (const token of tokenCheck) {
      console.log(`  🔑 ${token.email} (${token.type}) - Expires: ${token.expires_at}`)
    }
    
    console.log('🎉 Verification flow test completed successfully!')
    
  } catch (error) {
    console.error('❌ Verification flow test failed:', error)
    console.error('Error details:', error.message)
    process.exit(1)
  }
}

testVerificationFlow().catch(console.error)
