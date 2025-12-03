#!/usr/bin/env node

/**
 * Whoop Integration Diagnostic Script
 * Checks if Whoop integration is properly configured
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function section(title) {
  console.log('\n' + '='.repeat(60))
  log(title, 'cyan')
  console.log('='.repeat(60))
}

function check(name, status, detail = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️'
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow'
  log(`${icon} ${name}`, color)
  if (detail) console.log(`   ${detail}`)
}

async function main() {
  log('\n🔍 WHOOP INTEGRATION DIAGNOSTIC\n', 'bold')
  
  let issues = []
  let warnings = []

  // Check 1: Environment Variables
  section('🔐 Environment Variables')
  
  if (process.env.WHOOP_CLIENT_ID) {
    check('WHOOP_CLIENT_ID', 'pass', `Set: ${process.env.WHOOP_CLIENT_ID.substring(0, 8)}...`)
  } else {
    check('WHOOP_CLIENT_ID', 'fail', 'Not set in .env.local')
    issues.push('Missing WHOOP_CLIENT_ID')
  }
  
  if (process.env.WHOOP_CLIENT_SECRET) {
    check('WHOOP_CLIENT_SECRET', 'pass', 'Set (hidden for security)')
  } else {
    check('WHOOP_CLIENT_SECRET', 'fail', 'Not set in .env.local')
    issues.push('Missing WHOOP_CLIENT_SECRET')
  }

  if (process.env.ENCRYPTION_KEY) {
    if (process.env.ENCRYPTION_KEY === 'dev-key-change-in-production-32char') {
      check('ENCRYPTION_KEY', 'warn', 'Using default dev key - should change for production')
      warnings.push('Using default encryption key')
    } else {
      check('ENCRYPTION_KEY', 'pass', 'Custom encryption key set')
    }
  } else {
    check('ENCRYPTION_KEY', 'fail', 'Not set - tokens cannot be encrypted!')
    issues.push('Missing ENCRYPTION_KEY')
  }

  // Check 2: Files Exist
  section('📁 Required Files')
  
  const fs = require('fs')
  const path = require('path')
  
  const requiredFiles = [
    'lib/wearable-integrations.ts',
    'lib/encryption.ts',
    'lib/oauth-state.ts',
    'app/api/integrations/callback/whoop/route.ts',
    'migrations/add-oauth-states-table.sql'
  ]
  
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      check(file, 'pass')
    } else {
      check(file, 'fail', 'File not found')
      issues.push(`Missing file: ${file}`)
    }
  }

  // Check 3: Integration Code
  section('🔧 Integration Code')
  
  try {
    const integrationFile = fs.readFileSync(
      path.join(process.cwd(), 'lib/wearable-integrations.ts'), 
      'utf-8'
    )
    
    if (integrationFile.includes('class WhoopIntegration')) {
      check('WhoopIntegration class', 'pass')
    } else {
      check('WhoopIntegration class', 'fail', 'Class not found in file')
      issues.push('WhoopIntegration class missing')
    }
    
    if (integrationFile.includes("'whoop'")) {
      check('Whoop device type', 'pass')
    } else {
      check('Whoop device type', 'fail', 'Not in WearableDevice type')
      issues.push('Whoop not in device types')
    }
    
    if (integrationFile.includes('case \'whoop\':')) {
      check('Whoop switch case', 'pass')
    } else {
      check('Whoop switch case', 'fail', 'Not in WearableManager switch')
      issues.push('Whoop case missing in manager')
    }
  } catch (error) {
    check('Integration Code', 'fail', error.message)
  }

  // Check 4: Integration Manager UI
  section('🎨 Integration Manager UI')
  
  try {
    const managerFile = fs.readFileSync(
      path.join(process.cwd(), 'components/integrations/integration-manager.tsx'),
      'utf-8'
    )
    
    if (managerFile.includes("'whoop'")) {
      check('Whoop in OAuth devices', 'pass')
    } else {
      check('Whoop in OAuth devices', 'fail', 'Not in oauthDevices array')
      issues.push('Whoop not in oauthDevices array - THIS IS LIKELY THE ISSUE!')
    }
  } catch (error) {
    check('Integration Manager', 'fail', error.message)
  }

  // Check 5: OAuth Authorize Endpoint
  section('🔑 OAuth Authorize Endpoint')
  
  try {
    const authorizeFile = fs.readFileSync(
      path.join(process.cwd(), 'app/api/integrations/oauth/authorize/route.ts'),
      'utf-8'
    )
    
    if (authorizeFile.includes("case 'whoop':")) {
      check('Whoop OAuth case', 'pass')
    } else {
      check('Whoop OAuth case', 'fail', 'Whoop not in switch statement')
      issues.push('Whoop case missing in OAuth authorize')
    }
  } catch (error) {
    check('OAuth Authorize', 'fail', error.message)
  }

  // Check 6: Database
  section('🗄️ Database Tables')
  
  try {
    const { createDbConnection } = require('../lib/db')
    const sql = await createDbConnection()
    
    // Check wearable_integrations table
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'wearable_integrations'
      )
    `
    
    if (tableCheck[0]?.exists) {
      check('wearable_integrations table', 'pass')
      
      // Check for Whoop integration
      const whoopIntegration = await sql`
        SELECT * FROM wearable_integrations 
        WHERE device_type = 'whoop'
      `
      
      if (whoopIntegration.length > 0) {
        check('Whoop integration in DB', 'pass', `Found ${whoopIntegration.length} row(s)`)
        log(`   User ID: ${whoopIntegration[0].user_id}`, 'white')
        log(`   Enabled: ${whoopIntegration[0].enabled}`, 'white')
        log(`   Last Sync: ${whoopIntegration[0].last_sync || 'Never'}`, 'white')
      } else {
        check('Whoop integration in DB', 'warn', 'No Whoop integration found - try connecting again')
      }
    } else {
      check('wearable_integrations table', 'fail', 'Table does not exist')
      issues.push('wearable_integrations table missing')
    }
    
    // Check oauth_states table
    const oauthTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'oauth_states'
      )
    `
    
    if (oauthTableCheck[0]?.exists) {
      check('oauth_states table', 'pass')
    } else {
      check('oauth_states table', 'fail', 'Table does not exist - run migration!')
      issues.push('oauth_states table missing - run migrations/add-oauth-states-table.sql')
    }
    
  } catch (error) {
    check('Database Connection', 'fail', error.message)
    issues.push('Cannot connect to database')
  }

  // Summary
  section('📊 DIAGNOSTIC SUMMARY')
  
  console.log(`\nTotal Issues: ${issues.length}`)
  console.log(`Total Warnings: ${warnings.length}\n`)
  
  if (issues.length > 0) {
    log('🔴 CRITICAL ISSUES FOUND:', 'red')
    issues.forEach(issue => log(`   • ${issue}`, 'red'))
    console.log('')
    log('FIX THESE ISSUES TO MAKE WHOOP WORK!', 'yellow')
  }
  
  if (warnings.length > 0) {
    log('⚠️  WARNINGS:', 'yellow')
    warnings.forEach(warning => log(`   • ${warning}`, 'yellow'))
    console.log('')
  }
  
  if (issues.length === 0 && warnings.length === 0) {
    log('✅ ALL CHECKS PASSED!', 'green')
    log('Whoop integration should be working.', 'green')
    console.log('')
    log('🧪 NEXT STEPS:', 'cyan')
    log('1. Go to http://localhost:3000/settings?tab=integrations', 'white')
    log('2. Click "Add Wearable" and select Whoop', 'white')
    log('3. Complete OAuth flow', 'white')
    log('4. Check logs for any errors', 'white')
  } else {
    log('🔧 TO FIX ISSUES:', 'cyan')
    if (issues.includes('oauth_states table missing - run migrations/add-oauth-states-table.sql')) {
      log('1. Run: psql $DATABASE_URL -f migrations/add-oauth-states-table.sql', 'white')
    }
    if (issues.includes('Missing WHOOP_CLIENT_ID') || issues.includes('Missing WHOOP_CLIENT_SECRET')) {
      log('2. Get Whoop credentials from https://developer.whoop.com/', 'white')
      log('3. Add to .env.local:', 'white')
      log('   WHOOP_CLIENT_ID=your-client-id', 'white')
      log('   WHOOP_CLIENT_SECRET=your-client-secret', 'white')
    }
    if (issues.includes('Missing ENCRYPTION_KEY')) {
      log('4. Generate encryption key: openssl rand -hex 32', 'white')
      log('5. Add to .env.local: ENCRYPTION_KEY=<generated-key>', 'white')
    }
    log('6. Restart server: npm run dev', 'white')
  }
  
  console.log('')
  log('📖 Full testing guide: docs/WHOOP-TESTING-GUIDE.md', 'cyan')
  console.log('')
}

main().catch(error => {
  log(`\n❌ Diagnostic failed: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})


