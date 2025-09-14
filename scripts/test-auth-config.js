#!/usr/bin/env node

/**
 * Test Auth Config Script
 * Tests if the NextAuth configuration can be loaded without errors
 */

const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

async function testAuthConfig() {
  try {
    console.log('🔄 Testing NextAuth configuration...')
    
    // Try to import the auth configuration
    console.log('📄 Importing auth configuration...')
    
    const { authOptions } = require('../lib/auth.ts')
    
    console.log('✅ Auth configuration imported successfully!')
    console.log('📊 Number of providers:', authOptions.providers.length)
    
    for (let i = 0; i < authOptions.providers.length; i++) {
      const provider = authOptions.providers[i]
      console.log(`  Provider ${i}: ${provider.name || 'unnamed'} (${provider.type || 'unknown type'})`)
    }
    
    // Check if verification provider is in the array
    const verificationProvider = authOptions.providers.find(p => p.name === 'verification')
    if (verificationProvider) {
      console.log('✅ Verification provider found in configuration!')
    } else {
      console.log('❌ Verification provider NOT found in configuration!')
    }
    
    console.log('🎉 Auth config test completed!')
    
  } catch (error) {
    console.error('❌ Auth config test failed:', error)
    console.error('Error details:', error.message)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  }
}

testAuthConfig().catch(console.error)

