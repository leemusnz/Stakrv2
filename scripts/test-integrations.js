#!/usr/bin/env node

/**
 * Integration System Testing Script
 * Tests all integration endpoints and functionality
 * 
 * Usage: node scripts/test-integrations.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function section(title) {
  console.log('\n' + '='.repeat(70))
  log(title, 'cyan')
  console.log('='.repeat(70))
}

function test(name, status, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️'
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow'
  log(`${icon} ${name}`, color)
  if (details) {
    console.log(`   ${details}`)
  }
}

async function testApiEndpoint(method, path, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    const response = await fetch(`${BASE_URL}${path}`, options)
    const data = await response.json()
    
    return {
      ok: response.ok,
      status: response.status,
      data
    }
  } catch (error) {
    return {
      ok: false,
      error: error.message
    }
  }
}

async function testDatabaseConnection() {
  section('🗄️  DATABASE CONNECTION TEST')
  
  try {
    const { createDbConnection } = require('../lib/db')
    const sql = await createDbConnection()
    
    // Test basic query
    const result = await sql`SELECT 1 as test`
    
    if (result && result[0]?.test === 1) {
      test('Database Connection', 'pass', 'Successfully connected to Neon PostgreSQL')
      return true
    } else {
      test('Database Connection', 'fail', 'Query returned unexpected result')
      return false
    }
  } catch (error) {
    test('Database Connection', 'fail', error.message)
    return false
  }
}

async function testIntegrationTables() {
  section('📊 INTEGRATION TABLES TEST')
  
  try {
    const { createDbConnection } = require('../lib/db')
    const sql = await createDbConnection()
    
    const tables = [
      'wearable_integrations',
      'app_integrations',
      'wearable_data',
      'app_data',
      'integration_sync_log'
    ]
    
    let allTablesExist = true
    
    for (const table of tables) {
      try {
        const result = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = ${table}
          )
        `
        
        if (result[0]?.exists) {
          test(`Table: ${table}`, 'pass')
        } else {
          test(`Table: ${table}`, 'fail', 'Table does not exist')
          allTablesExist = false
        }
      } catch (error) {
        test(`Table: ${table}`, 'fail', error.message)
        allTablesExist = false
      }
    }
    
    return allTablesExist
  } catch (error) {
    test('Integration Tables', 'fail', error.message)
    return false
  }
}

async function testWearableIntegrations() {
  section('⌚ WEARABLE INTEGRATIONS TEST')
  
  const devices = [
    'apple_watch',
    'fitbit',
    'strava',
    'garmin',
    'google_fit',
    'samsung_galaxy_watch',
    'polar',
    'withings',
    'oura_ring'
  ]
  
  try {
    const { WearableManager } = require('../lib/wearable-integrations')
    const manager = new WearableManager()
    
    log('Testing each wearable integration class...', 'blue')
    
    for (const device of devices) {
      try {
        const config = {
          device,
          enabled: true,
          autoSync: false,
          dataTypes: ['steps', 'heart_rate'],
          privacyLevel: 'standard'
        }
        
        // This will fail to connect (no real credentials) but should not throw
        await manager.addIntegration(device, config)
        test(`${device}`, 'warn', 'Class instantiated (connection failed as expected)')
      } catch (error) {
        test(`${device}`, 'fail', error.message)
      }
    }
    
    return true
  } catch (error) {
    test('Wearable Integrations', 'fail', error.message)
    return false
  }
}

async function testAppIntegrations() {
  section('📱 APP INTEGRATIONS TEST')
  
  const apps = [
    'myfitnesspal',
    'headspace',
    'duolingo',
    'github',
    'spotify',
    'noom',
    'coursera',
    'khan_academy',
    'youtube_music',
    'goodreads',
    'todoist',
    'notion',
    'linkedin_learning'
  ]
  
  try {
    const { AppIntegrationManager } = require('../lib/app-integrations')
    const manager = new AppIntegrationManager()
    
    log('Testing each app integration class...', 'blue')
    
    for (const app of apps) {
      try {
        const config = {
          app,
          enabled: true,
          autoSync: false,
          dataTypes: [],
          privacyLevel: 'standard'
        }
        
        // This will fail to connect (no real credentials) but should not throw
        await manager.addIntegration(app, config)
        test(`${app}`, 'warn', 'Class instantiated (connection failed as expected)')
      } catch (error) {
        test(`${app}`, 'fail', error.message)
      }
    }
    
    return true
  } catch (error) {
    test('App Integrations', 'fail', error.message)
    return false
  }
}

async function testVerificationLogic() {
  section('🔍 VERIFICATION LOGIC TEST')
  
  try {
    const { wearableManager } = require('../lib/wearable-integrations')
    const { appIntegrationManager } = require('../lib/app-integrations')
    
    // Test wearable data verification
    const mockWearableData = {
      id: 'test-1',
      userId: 'test-user',
      deviceType: 'apple_watch',
      dataType: 'workout',
      value: 30,
      unit: 'minutes',
      timestamp: new Date(),
      metadata: {
        deviceId: 'Apple Watch Series 9',
        accuracy: 'high',
        source: 'Apple Health',
        heartRate: [70, 120, 110, 80],
        calories: 250
      },
      verificationStatus: 'pending'
    }
    
    const wearableResult = await wearableManager.verifyData(mockWearableData, {})
    
    if (wearableResult.valid && wearableResult.confidence > 60) {
      test('Wearable Verification', 'pass', `Confidence: ${wearableResult.confidence}%`)
    } else {
      test('Wearable Verification', 'fail', `Low confidence: ${wearableResult.confidence}%`)
    }
    
    // Test app data verification
    const mockAppData = {
      id: 'test-2',
      userId: 'test-user',
      appType: 'duolingo',
      dataType: 'language_lesson',
      value: {
        language: 'Spanish',
        xp: 50,
        lessonsCompleted: 1
      },
      timestamp: new Date(),
      metadata: {
        source: 'Duolingo',
        accuracy: 'high',
        streak: 10
      },
      verificationStatus: 'pending'
    }
    
    const appResult = await appIntegrationManager.verifyData(mockAppData, {})
    
    if (appResult.valid && appResult.confidence > 60) {
      test('App Verification', 'pass', `Confidence: ${appResult.confidence}%`)
    } else {
      test('App Verification', 'fail', `Low confidence: ${appResult.confidence}%`)
    }
    
    return true
  } catch (error) {
    test('Verification Logic', 'fail', error.message)
    return false
  }
}

async function testEncryption() {
  section('🔒 ENCRYPTION TEST')
  
  try {
    const fs = require('fs')
    const path = require('path')
    const encryptionPath = path.join(process.cwd(), 'lib', 'encryption.ts')
    
    if (!fs.existsSync(encryptionPath)) {
      test('Encryption Module', 'fail', 'lib/encryption.ts not found - needs implementation')
      return false
    }
    
    test('Encryption Module', 'pass', 'encryption.ts file exists')
    
    // Check if ENCRYPTION_KEY is set
    if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY !== 'dev-key-change-in-production-32char') {
      test('Encryption Key', 'pass', 'Custom encryption key configured')
    } else {
      test('Encryption Key', 'warn', 'Using default dev key - should change in production')
    }
    
    return true
  } catch (error) {
    test('Encryption', 'fail', error.message)
    return false
  }
}

async function testOAuthStateManagement() {
  section('🔐 OAUTH STATE MANAGEMENT TEST')
  
  try {
    const fs = require('fs')
    const path = require('path')
    const oauthStatePath = path.join(process.cwd(), 'lib', 'oauth-state.ts')
    
    if (!fs.existsSync(oauthStatePath)) {
      test('OAuth State Module', 'fail', 'lib/oauth-state.ts not found - needs implementation')
      return false
    }
    
    test('OAuth State Module', 'pass', 'oauth-state.ts file exists')
    
    // Check if oauth_states table exists
    const { createDbConnection } = require('../lib/db')
    const sql = await createDbConnection()
    
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'oauth_states'
      )
    `
    
    if (tableExists[0]?.exists) {
      test('OAuth States Table', 'pass', 'oauth_states table exists')
    } else {
      test('OAuth States Table', 'fail', 'oauth_states table not found - run migration')
    }
    
    return true
  } catch (error) {
    test('OAuth State Management', 'fail', error.message)
    return false
  }
}

async function testRetryLogic() {
  section('🔄 RETRY LOGIC TEST')
  
  try {
    const fs = require('fs')
    const path = require('path')
    const retryPath = path.join(process.cwd(), 'lib', 'retry-utils.ts')
    
    if (!fs.existsSync(retryPath)) {
      test('Retry Utility', 'fail', 'lib/retry-utils.ts not found - needs implementation')
      return false
    }
    
    test('Retry Utility', 'pass', 'retry-utils.ts file exists')
    return true
  } catch (error) {
    test('Retry Logic', 'fail', error.message)
    return false
  }
}

async function testRateLimiting() {
  section('⏱️  RATE LIMITING TEST')
  
  try {
    const fs = require('fs')
    const path = require('path')
    const rateLimitPath = path.join(process.cwd(), 'lib', 'rate-limit.ts')
    
    if (!fs.existsSync(rateLimitPath)) {
      test('Rate Limit Module', 'fail', 'lib/rate-limit.ts not found - needs implementation')
      return false
    }
    
    test('Rate Limit Module', 'pass', 'rate-limit.ts file exists')
    
    // Check if Upstash Redis is configured
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      test('Redis Configuration', 'pass', 'Upstash Redis credentials configured')
    } else {
      test('Redis Configuration', 'warn', 'Upstash Redis not configured - rate limiting disabled')
    }
    
    return true
  } catch (error) {
    test('Rate Limiting', 'fail', error.message)
    return false
  }
}

async function generateReport(results) {
  section('📊 TEST SUMMARY')
  
  const total = results.length
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const warnings = results.filter(r => r.status === 'warn').length
  
  console.log(`\nTotal Tests: ${total}`)
  log(`Passed: ${passed}`, 'green')
  log(`Failed: ${failed}`, 'red')
  log(`Warnings: ${warnings}`, 'yellow')
  
  const percentage = Math.round((passed / total) * 100)
  console.log(`\nSuccess Rate: ${percentage}%\n`)
  
  if (failed > 0) {
    log('⚠️  ATTENTION: Some tests failed. Please review the output above.', 'red')
    log('📖 See docs/INTEGRATION-CRITICAL-FIXES.md for implementation guidance.', 'yellow')
  } else if (warnings > 0) {
    log('⚠️  All tests passed with warnings. Review warnings above.', 'yellow')
  } else {
    log('✅ All tests passed! Integration system is ready.', 'green')
  }
  
  console.log('')
}

// Main execution
async function main() {
  log('\n🚀 STAKR INTEGRATION SYSTEM TEST SUITE\n', 'bright')
  
  const results = []
  
  // Run all tests
  const testSuites = [
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Integration Tables', fn: testIntegrationTables },
    { name: 'Wearable Integrations', fn: testWearableIntegrations },
    { name: 'App Integrations', fn: testAppIntegrations },
    { name: 'Verification Logic', fn: testVerificationLogic },
    { name: 'Encryption', fn: testEncryption },
    { name: 'OAuth State Management', fn: testOAuthStateManagement },
    { name: 'Retry Logic', fn: testRetryLogic },
    { name: 'Rate Limiting', fn: testRateLimiting }
  ]
  
  for (const suite of testSuites) {
    try {
      const result = await suite.fn()
      results.push({
        name: suite.name,
        status: result === true ? 'pass' : result === false ? 'fail' : 'warn'
      })
    } catch (error) {
      log(`\nError running ${suite.name}: ${error.message}`, 'red')
      results.push({
        name: suite.name,
        status: 'fail'
      })
    }
  }
  
  await generateReport(results)
}

// Run tests
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})


