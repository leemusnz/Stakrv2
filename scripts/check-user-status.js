#!/usr/bin/env node

/**
 * Check User Status Script
 * Checks the current status of a user after email verification
 */

const { neon } = require('@neondatabase/serverless')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

async function checkUserStatus() {
  try {
    console.log('🔄 Checking user status after email verification...')
    
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }

    const sql = neon(process.env.DATABASE_URL)
    
    // Check the most recent user
    console.log('📄 Checking most recent user...')
    
    const userCheck = await sql`
      SELECT 
        id, 
        email, 
        email_verified,
        email_verified_at,
        onboarding_completed,
        xp,
        level,
        created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 1
    `
    
    if (userCheck.length > 0) {
      const user = userCheck[0]
      console.log('👤 Most recent user:')
      console.log(`  Email: ${user.email}`)
      console.log(`  Email Verified: ${user.email_verified}`)
      console.log(`  Email Verified At: ${user.email_verified_at}`)
      console.log(`  Onboarding Completed: ${user.onboarding_completed}`)
      console.log(`  XP: ${user.xp}`)
      console.log(`  Level: ${user.level}`)
      console.log(`  Created: ${user.created_at}`)
      
      // Check if email_verified is a timestamp or boolean
      console.log(`  Email Verified Type: ${typeof user.email_verified}`)
      console.log(`  Email Verified Value: ${JSON.stringify(user.email_verified)}`)
      
      // Check XP transactions
      console.log('📄 Checking XP transactions...')
      
      const xpCheck = await sql`
        SELECT source, amount, description, created_at
        FROM xp_transactions
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
      `
      
      console.log('🎯 XP Transactions:')
      for (const xp of xpCheck) {
        console.log(`  ${xp.amount} XP - ${xp.source} - ${xp.description} (${xp.created_at})`)
      }
    } else {
      console.log('❌ No users found')
    }
    
    console.log('🎉 User status check completed!')
    
  } catch (error) {
    console.error('❌ User status check failed:', error)
    console.error('Error details:', error.message)
    process.exit(1)
  }
}

checkUserStatus().catch(console.error)
