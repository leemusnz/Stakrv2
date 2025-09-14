#!/usr/bin/env node

/**
 * Migration Runner Script
 * Executes SQL migrations against the Neon database
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { neon } from '@neondatabase/serverless'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function runMigration(migrationFile) {
  try {
    console.log(`🔄 Running migration: ${migrationFile}`)
    
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }

    const sql = neon(process.env.DATABASE_URL)
    
    // Read the migration file
    const migrationPath = join(__dirname, '..', migrationFile)
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Migration SQL loaded, executing...')
    
    // Execute the migration
    const result = await sql`${sql.unsafe(migrationSQL)}`
    
    console.log('✅ Migration completed successfully!')
    console.log('📊 Result:', result)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.error('Error details:', error.message)
    process.exit(1)
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2]

if (!migrationFile) {
  console.error('❌ Usage: node scripts/run-migration.js <migration-file>')
  console.error('Example: node scripts/run-migration.js migrations/2025-01-15_add_missing_verification_functions.sql')
  process.exit(1)
}

runMigration(migrationFile)

