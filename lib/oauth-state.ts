import { createDbConnection } from '@/lib/db'
import crypto from 'crypto'

/**
 * Generates a cryptographically secure OAuth state parameter
 * and stores it in the database for CSRF protection
 */
export async function generateOAuthState(
  userId: string,
  provider: string
): Promise<string> {
  const state = crypto.randomBytes(32).toString('hex')
  const sql = await createDbConnection()
  
  try {
    // Store state with 10-minute expiration
    await sql`
      INSERT INTO oauth_states (user_id, provider, state, expires_at, created_at)
      VALUES (
        ${userId},
        ${provider},
        ${state},
        NOW() + INTERVAL '10 minutes',
        NOW()
      )
      ON CONFLICT (user_id, provider) 
      DO UPDATE SET 
        state = EXCLUDED.state,
        expires_at = EXCLUDED.expires_at,
        created_at = NOW()
    `
    
    return state
  } catch (error) {
    console.error('Failed to generate OAuth state:', error)
    throw error
  }
}

/**
 * Validates an OAuth state parameter for CSRF protection
 * Returns true if valid, false otherwise
 * Deletes the state after validation (one-time use)
 */
export async function validateOAuthState(
  userId: string,
  provider: string,
  state: string
): Promise<boolean> {
  const sql = await createDbConnection()
  
  try {
    const results = await sql`
      SELECT state, expires_at
      FROM oauth_states
      WHERE user_id = ${userId}
      AND provider = ${provider}
      AND state = ${state}
      AND expires_at > NOW()
    `
    
    if (results.length === 0) {
      console.error(`❌ Invalid OAuth state for ${provider} - no match found or expired`)
      return false
    }
    
    // Delete used state (one-time use for security)
    await sql`
      DELETE FROM oauth_states
      WHERE user_id = ${userId} AND provider = ${provider}
    `
    
    return true
  } catch (error) {
    console.error('Failed to validate OAuth state:', error)
    return false
  }
}

/**
 * Cleans up expired OAuth states from the database
 * Should be called periodically (e.g., via cron job or middleware)
 */
export async function cleanupExpiredStates(): Promise<number> {
  const sql = await createDbConnection()
  
  try {
    const result = await sql`
      DELETE FROM oauth_states
      WHERE expires_at < NOW()
    `
    
    const deletedCount = result.count || 0
    if (deletedCount > 0) {
    }
    
    return deletedCount
  } catch (error) {
    console.error('Failed to cleanup expired OAuth states:', error)
    return 0
  }
}

/**
 * Gets all OAuth states for a user (for debugging)
 */
export async function getUserOAuthStates(userId: string): Promise<any[]> {
  const sql = await createDbConnection()
  
  try {
    const states = await sql`
      SELECT provider, state, expires_at, created_at
      FROM oauth_states
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `
    
    return states
  } catch (error) {
    console.error('Failed to get user OAuth states:', error)
    return []
  }
}


