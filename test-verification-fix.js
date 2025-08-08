// Test script to run verification schema fix through admin interface
// This script can be run in the browser console when logged in as admin

async function runVerificationSchemaFix() {
  try {
    console.log('🔧 Starting verification schema fix...')
    
    const response = await fetch('/api/admin/run-migration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        migration: 'verification-schema-fix'
      })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Verification schema fix successful!')
      console.log('Result:', result)
      
      // Test the admin APIs that were failing
      console.log('🧪 Testing admin APIs...')
      
      const tests = [
        { name: 'Verifications API', url: '/api/admin/verifications' },
        { name: 'Appeals API', url: '/api/admin/appeals' },
        { name: 'Analytics API', url: '/api/admin/analytics' }
      ]
      
      for (const test of tests) {
        try {
          const testResponse = await fetch(test.url)
          const testResult = await testResponse.json()
          
          if (testResponse.ok) {
            console.log(`✅ ${test.name} - Working!`)
          } else {
            console.log(`❌ ${test.name} - Still failing:`, testResult.error)
          }
        } catch (error) {
          console.log(`❌ ${test.name} - Error:`, error.message)
        }
      }
      
    } else {
      console.error('❌ Verification schema fix failed:', result)
    }
    
  } catch (error) {
    console.error('❌ Error running verification schema fix:', error)
  }
}

// Instructions for use:
console.log(`
🚀 Verification Schema Fix Test Script

To run this fix:
1. Navigate to: http://localhost:3000/admin
2. Log in as an admin user (with dev access)
3. Open browser console (F12)
4. Copy and paste this entire script
5. Run: runVerificationSchemaFix()

This will fix the missing database columns and test the admin APIs.
`)

// Automatically run if in admin page
if (window.location.pathname === '/admin') {
  console.log('📍 Detected admin page - ready to run fix!')
  console.log('Run: runVerificationSchemaFix()')
} else {
  console.log('⚠️ Please navigate to /admin first, then run: runVerificationSchemaFix()')
}
