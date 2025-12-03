#!/usr/bin/env node

/**
 * Test Providers Script
 * Tests what NextAuth providers are available
 */

const { neon } = require('@neondatabase/serverless')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

async function testProviders() {
  try {
    console.log('🔄 Testing NextAuth providers...')
    
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }

    // Test if we can make a request to the providers endpoint
    console.log('🌐 Testing /api/auth/providers endpoint...')
    
    const response = await fetch('http://localhost:3000/api/auth/providers')
    
    if (response.ok) {
      const providers = await response.json()
      console.log('📊 Available providers:', Object.keys(providers))
      
      for (const [name, provider] of Object.entries(providers)) {
        console.log(`  ✅ ${name}: ${provider.type}`)
      }
      
      if (providers.verification) {
        console.log('✅ Verification provider is available!')
      } else {
        console.log('❌ Verification provider is NOT available!')
      }
    } else {
      console.log('❌ Failed to fetch providers:', response.status, response.statusText)
    }
    
    console.log('🎉 Provider test completed!')
    
  } catch (error) {
    console.error('❌ Provider test failed:', error)
    console.error('Error details:', error.message)
    process.exit(1)
  }
}

testProviders().catch(console.error)




