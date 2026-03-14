// Database connection and configuration for Stakr
// Centralized database connection using Neon PostgreSQL

import { neon } from '@neondatabase/serverless'
import type { Sql } from '@neondatabase/serverless'

let db: Sql | null = null

/**
 * Creates and returns a cached Neon database connection
 * @returns SQL query function
 */
export function createDbConnection(): Sql {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  if (!db) {
    db = neon(process.env.DATABASE_URL)
  }

  return db
}

/**
 * Tests the database connection
 * @returns Promise with success status and message
 */
export async function testDatabaseConnection(): Promise<{ 
  success: boolean
  error?: string
  message?: string 
}> {
  try {
    const sql = createDbConnection()
    await sql`SELECT 1 as test`
    console.log('✅ Database connection successful')
    return { 
      success: true, 
      message: 'Database connection successful' 
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Database configuration
 */
export const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production',
}

// Export db instance for backward compatibility
export { db }
