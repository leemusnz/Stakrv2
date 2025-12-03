#!/usr/bin/env node

/**
 * Add OAuth States Table
 * Creates the missing oauth_states table for CSRF protection
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

async function addOAuthTable() {
  try {
    console.log('🔍 Adding oauth_states table...\n')
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found')
      process.exit(1)
    }

    const sql = neon(process.env.DATABASE_URL)
    
    console.log('📄 Creating oauth_states table...')
    
    // Create the table directly
    await sql`
      CREATE TABLE IF NOT EXISTS oauth_states (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          provider VARCHAR(50) NOT NULL,
          state VARCHAR(128) NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, provider)
      )
    `
    
    console.log('✅ Table created!')
    
    console.log('📄 Creating indexes...')
    
    await sql`CREATE INDEX IF NOT EXISTS idx_oauth_states_user_provider ON oauth_states(user_id, provider)`
    await sql`CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state)`
    await sql`CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at)`
    
    console.log('✅ Indexes created!')
    
    console.log('\n🎉 Migration completed successfully!')
    console.log('✅ oauth_states table is now ready')
    console.log('\n🔧 Next step: Try connecting Whoop again!')
    console.log('   Go to: http://localhost:3000/settings?tab=integrations\n')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error('\nFull error:', error)
    process.exit(1)
  }
}

addOAuthTable()

