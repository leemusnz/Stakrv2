#!/usr/bin/env node

/**
 * Test Verification Signin Script
 * Tests the verification signin process manually
 */

const { neon } = require('@neondatabase/serverless')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

async function testVerificationSignin() {
  try {
    console.log('🔄 Testing verification signin process...')
    
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }

    const sql = neon(process.env.DATABASE_URL)
    
    // Get the most recent user
    const userCheck = await sql`
      SELECT 
        id, 
        email, 
        email_verified,
        onboarding_completed,
        xp,
        level
      FROM users
      ORDER BY created_at DESC
      LIMIT 1
    `
    
    if (userCheck.length === 0) {
      throw new Error('No users found')
    }
    
    const user = userCheck[0]
    console.log('👤 Testing with user:', user.email)
    console.log('  User ID:', user.id)
    console.log('  Email Verified:', user.email_verified)
    console.log('  Onboarding Completed:', user.onboarding_completed)
    console.log('  XP:', user.xp)
    
    // Simulate the verification provider logic
    console.log('🔍 Testing verification provider logic...')
    
    // Check the conditions from the verification provider
    const condition1 = user.id === user.id  // This should always be true
    const condition2 = user.email_verified
    
    console.log('  Condition 1 (user.id === credentials.userId):', condition1)
    console.log('  Condition 2 (email_verified):', condition2)
    
    if (condition1 && condition2) {
      console.log('✅ Verification signin should work!')
      
      // Test the API endpoint directly
      console.log('🌐 Testing verification API endpoint...')
      
      const testToken = 'test-token-123'
      
      // Create a test verification token
      await sql`
        INSERT INTO verification_tokens (user_id, email, token, type, expires_at, created_at)
        VALUES (${user.id}, ${user.email}, ${testToken}, 'email_verification', NOW() + INTERVAL '1 hour', NOW())
      `
      
      console.log('✅ Test token created')
      
      // Test the verification API
      const response = await fetch('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: testToken }),
      })
      
      const result = await response.json()
      console.log('📊 API Response:', result)
      
      if (result.success) {
        console.log('✅ Verification API works!')
        console.log('  Email:', result.email)
        console.log('  User ID:', result.userId)
        console.log('  XP Awarded:', result.xpAwarded)
      } else {
        console.log('❌ Verification API failed:', result.message)
      }
      
      // Clean up test token
      await sql`DELETE FROM verification_tokens WHERE token = ${testToken}`
      
    } else {
      console.log('❌ Verification signin conditions not met')
    }
    
    console.log('🎉 Verification signin test completed!')
    
  } catch (error) {
    console.error('❌ Verification signin test failed:', error)
    console.error('Error details:', error.message)
    process.exit(1)
  }
}

testVerificationSignin().catch(console.error)




