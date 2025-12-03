#!/usr/bin/env node

/**
 * Check Database Tables
 * Lists all tables and checks for required integration tables
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const { neon } = require('@neondatabase/serverless')

async function checkTables() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in .env.local')
      console.error('   Make sure .env.local exists and has DATABASE_URL=...')
      process.exit(1)
    }

    console.log('🔍 Connecting to database...\n')
    const sql = neon(process.env.DATABASE_URL)
    
    // Get all tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    console.log('📊 TABLES IN YOUR DATABASE:')
    console.log('=' .repeat(50))
    tables.forEach(t => console.log(`  ✅ ${t.table_name}`))
    console.log('')
    
    // Check for integration tables
    console.log('🔍 INTEGRATION TABLES CHECK:')
    console.log('=' .repeat(50))
    
    const requiredTables = [
      'wearable_integrations',
      'app_integrations',
      'wearable_data',
      'app_data',
      'integration_sync_log',
      'oauth_states'
    ]
    
    let missingTables = []
    
    for (const tableName of requiredTables) {
      const exists = tables.some(t => t.table_name === tableName)
      if (exists) {
        console.log(`  ✅ ${tableName}`)
      } else {
        console.log(`  ❌ ${tableName} - MISSING!`)
        missingTables.push(tableName)
      }
    }
    
    console.log('')
    
    // Summary and recommendations
    if (missingTables.length > 0) {
      console.log('⚠️  MISSING TABLES FOUND!')
      console.log('=' .repeat(50))
      console.log('Missing tables:', missingTables.join(', '))
      console.log('')
      
      if (missingTables.includes('oauth_states')) {
        console.log('🔧 TO FIX WHOOP OAUTH ERROR:')
        console.log('   Run: node scripts/run-migration.js migrations/add-oauth-states-table.sql')
        console.log('')
      }
      
      if (missingTables.some(t => ['wearable_integrations', 'app_integrations'].includes(t))) {
        console.log('🔧 TO FIX INTEGRATION SYSTEM:')
        console.log('   Run: node scripts/run-migration.js migrations/create-integration-tables.sql')
        console.log('')
      }
    } else {
      console.log('✅ ALL INTEGRATION TABLES EXIST!')
      console.log('   Your database is properly configured.')
      console.log('')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkTables()

