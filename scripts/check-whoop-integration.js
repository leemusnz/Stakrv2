#!/usr/bin/env node

/**
 * Check if Whoop integration was saved after OAuth
 */

require('dotenv').config({ path: '.env.local' })

const { neon } = require('@neondatabase/serverless')

async function checkWhoopIntegration() {
  try {
    console.log('🔍 Checking for Whoop integration in database...\n')
    
    const sql = neon(process.env.DATABASE_URL)
    
    // Check for Whoop integrations
    const whoopRows = await sql`
      SELECT user_id, device_type, enabled, last_sync, created_at, api_credentials
      FROM wearable_integrations 
      WHERE device_type = 'whoop'
    `
    
    if (whoopRows.length === 0) {
      console.log('❌ NO WHOOP INTEGRATION FOUND!')
      console.log('')
      console.log('🔍 This means:')
      console.log('   - OAuth succeeded (you logged in)')
      console.log('   - But database insert failed')
      console.log('')
      console.log('💡 Possible causes:')
      console.log('   1. Callback route had an error')
      console.log('   2. Encryption key issue')
      console.log('   3. Database constraint failure')
      console.log('')
      console.log('🔧 Check server logs for errors around the time you connected')
      console.log('')
    } else {
      console.log('✅ FOUND WHOOP INTEGRATION!')
      console.log('=' .repeat(50))
      whoopRows.forEach((row, i) => {
        console.log(`\nIntegration ${i + 1}:`)
        console.log('  User ID:', row.user_id)
        console.log('  Enabled:', row.enabled)
        console.log('  Last Sync:', row.last_sync || 'Never')
        console.log('  Created:', row.created_at)
        console.log('  Has Credentials:', row.api_credentials ? 'Yes (encrypted)' : 'No')
      })
      console.log('')
      console.log('✅ Database has the integration!')
      console.log('🔍 Issue might be in the UI not loading it.')
      console.log('')
      console.log('🔧 Try:')
      console.log('   1. Hard refresh browser (Ctrl+Shift+R)')
      console.log('   2. Check browser console for errors')
      console.log('   3. Go to /settings?tab=integrations again')
      console.log('')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkWhoopIntegration()

