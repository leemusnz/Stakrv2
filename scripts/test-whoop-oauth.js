#!/usr/bin/env node

/**
 * Whoop OAuth Flow Tester
 * Diagnoses "Failed to start OAuth flow" error
 */

console.log('🔍 Testing Whoop OAuth Flow...\n')

// Check 1: Environment Variables
console.log('📋 STEP 1: Checking Environment Variables')
console.log('==========================================')

if (process.env.WHOOP_CLIENT_ID) {
  console.log('✅ WHOOP_CLIENT_ID is set:', process.env.WHOOP_CLIENT_ID.substring(0, 10) + '...')
} else {
  console.log('❌ WHOOP_CLIENT_ID is NOT set')
  console.log('   Fix: Add to .env.local')
  console.log('   WHOOP_CLIENT_ID=your-client-id-here\n')
}

if (process.env.WHOOP_CLIENT_SECRET) {
  console.log('✅ WHOOP_CLIENT_SECRET is set (hidden for security)')
} else {
  console.log('❌ WHOOP_CLIENT_SECRET is NOT set')
  console.log('   Fix: Add to .env.local')
  console.log('   WHOOP_CLIENT_SECRET=your-client-secret-here\n')
}

if (process.env.ENCRYPTION_KEY) {
  console.log('✅ ENCRYPTION_KEY is set')
} else {
  console.log('❌ ENCRYPTION_KEY is NOT set')
  console.log('   Fix: Add to .env.local')
  console.log('   ENCRYPTION_KEY=dev-testing-key\n')
}

// Check 2: Test OAuth URL Generation
console.log('\n📋 STEP 2: Testing OAuth URL Generation')
console.log('==========================================')

const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
const testState = 'test-state-123'
const clientId = process.env.WHOOP_CLIENT_ID || 'NOT_SET'

const oauthUrl = `https://api.prod.whoop.com/oauth/oauth2/auth?` +
  `response_type=code&` +
  `client_id=${clientId}&` +
  `scope=read:recovery read:cycles read:workout read:sleep read:profile read:body_measurement&` +
  `redirect_uri=${encodeURIComponent(`${baseUrl}/api/integrations/callback/whoop`)}&` +
  `state=${testState}`

console.log('Generated OAuth URL:')
console.log(oauthUrl)

if (oauthUrl.includes('undefined')) {
  console.log('\n❌ URL contains "undefined" - missing WHOOP_CLIENT_ID!')
} else if (oauthUrl.includes('NOT_SET')) {
  console.log('\n❌ URL contains "NOT_SET" - WHOOP_CLIENT_ID not configured!')
} else {
  console.log('\n✅ URL looks valid!')
}

// Check 3: Database Connection
console.log('\n📋 STEP 3: Testing Database')
console.log('==========================================')

async function testDatabase() {
  try {
    const { createDbConnection } = require('../lib/db')
    const sql = await createDbConnection()
    
    // Check oauth_states table
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'oauth_states'
      )
    `
    
    if (tableCheck[0]?.exists) {
      console.log('✅ oauth_states table exists')
    } else {
      console.log('❌ oauth_states table does NOT exist')
      console.log('   Fix: Run migration')
      console.log('   psql $DATABASE_URL -f migrations/add-oauth-states-table.sql\n')
    }
    
    // Check wearable_integrations table
    const integrationTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'wearable_integrations'
      )
    `
    
    if (integrationTableCheck[0]?.exists) {
      console.log('✅ wearable_integrations table exists')
    } else {
      console.log('❌ wearable_integrations table does NOT exist')
      console.log('   Fix: Run initial integration migration\n')
    }
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message)
    console.log('   Check DATABASE_URL in .env.local\n')
  }
}

// Run async check
testDatabase().then(() => {
  console.log('\n📋 DIAGNOSIS SUMMARY')
  console.log('==========================================')
  
  const missing = []
  if (!process.env.WHOOP_CLIENT_ID) missing.push('WHOOP_CLIENT_ID')
  if (!process.env.WHOOP_CLIENT_SECRET) missing.push('WHOOP_CLIENT_SECRET')
  if (!process.env.ENCRYPTION_KEY) missing.push('ENCRYPTION_KEY')
  
  if (missing.length > 0) {
    console.log('\n🔴 MOST LIKELY ISSUE: Missing environment variables')
    console.log('Missing:', missing.join(', '))
    console.log('\n📝 TO FIX:')
    console.log('1. Get Whoop credentials from https://developer.whoop.com/')
    console.log('2. Add to .env.local:')
    console.log('   WHOOP_CLIENT_ID=your-client-id')
    console.log('   WHOOP_CLIENT_SECRET=your-client-secret')
    console.log('   ENCRYPTION_KEY=dev-testing-key')
    console.log('3. Restart server: npm run dev')
    console.log('4. Try connecting Whoop again\n')
  } else {
    console.log('\n✅ Environment variables look good!')
    console.log('🔍 Check server logs when you click "Connect Whoop"')
    console.log('   Look for errors in terminal where npm run dev is running\n')
  }
  
  process.exit(0)
}).catch(error => {
  console.error('Test failed:', error)
  process.exit(1)
})

