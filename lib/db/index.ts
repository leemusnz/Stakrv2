// Database connection and configuration for Stakr
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import * as schema from './schema'

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Create the Neon SQL connection
const sql = neon(process.env.DATABASE_URL)

// Create Drizzle database instance with schema
export const db = drizzle(sql, { schema })

// Re-export all schema tables and types for convenience
export * from './schema'

// Database utilities
export const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production',
}

// Enhanced connection health check
export async function testDatabaseConnection(): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    // Test basic connection
    const dbUrl = process.env.DATABASE_URL
    
    if (!dbUrl) {
      return { 
        success: false, 
        error: 'DATABASE_URL environment variable is not set' 
      }
    }
    
    if (!dbUrl.includes('postgresql://')) {
      return { 
        success: false, 
        error: 'DATABASE_URL does not appear to be a PostgreSQL connection string' 
      }
    }
    
    // Test actual database query
    try {
      await sql`SELECT 1 as test`
      return { 
        success: true,
        message: 'Database connection and query successful!'
      }
    } catch (queryError) {
      return {
        success: false,
        error: `Database query failed: ${queryError instanceof Error ? queryError.message : 'Unknown query error'}`
      }
    }
    
  } catch (error) {
    console.error('Database connection test failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    }
  }
} 