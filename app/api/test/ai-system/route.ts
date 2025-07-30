import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'
import { aiAntiCheat } from '@/lib/ai-anti-cheat'

// Test endpoint to verify AI system is working
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing AI Anti-Cheat System...')
    
    const tests = []
    let allPassed = true

    // Test 1: Database connection
    try {
      const sql = await createDbConnection()
      await sql`SELECT 1 as test`
      tests.push({ name: 'Database Connection', status: 'PASS', details: 'Connected successfully' })
    } catch (error) {
      tests.push({ name: 'Database Connection', status: 'FAIL', details: error instanceof Error ? error.message : 'Unknown error' })
      allPassed = false
    }

    // Test 2: AI tables exist
    try {
      const sql = await createDbConnection()
      const tables = ['proof_submissions', 'user_risk_profiles', 'ai_model_performance', 'cheat_detection_patterns', 'ban_records']
      const tableResults = []
      
      for (const table of tables) {
        const result = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = ${table}
          ) as exists
        `
        tableResults.push(`${table}: ${result[0].exists ? '✅' : '❌'}`)
      }
      
      const allTablesExist = tableResults.every(result => result.includes('✅'))
      tests.push({ 
        name: 'AI Tables Check', 
        status: allTablesExist ? 'PASS' : 'FAIL', 
        details: tableResults.join(', ')
      })
      if (!allTablesExist) allPassed = false
    } catch (error) {
      tests.push({ name: 'AI Tables Check', status: 'FAIL', details: error instanceof Error ? error.message : 'Unknown error' })
      allPassed = false
    }

    // Test 3: AI functions exist
    try {
      const sql = await createDbConnection()
      const functions = await sql`
        SELECT routine_name
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
          AND routine_name IN ('update_user_risk_profile', 'log_ai_detection')
      `
      const functionNames = functions.map(f => f.routine_name)
      tests.push({ 
        name: 'AI Functions Check', 
        status: functionNames.length >= 2 ? 'PASS' : 'FAIL', 
        details: `Found: ${functionNames.join(', ')}`
      })
      if (functionNames.length < 2) allPassed = false
    } catch (error) {
      tests.push({ name: 'AI Functions Check', status: 'FAIL', details: error instanceof Error ? error.message : 'Unknown error' })
      allPassed = false
    }

    // Test 4: Detection patterns exist
    try {
      const sql = await createDbConnection()
      const patterns = await sql`SELECT COUNT(*) as count FROM cheat_detection_patterns`
      const patternCount = patterns[0].count
      tests.push({ 
        name: 'Detection Patterns Check', 
        status: patternCount > 0 ? 'PASS' : 'FAIL', 
        details: `Found ${patternCount} detection patterns`
      })
      if (patternCount === 0) allPassed = false
    } catch (error) {
      tests.push({ name: 'Detection Patterns Check', status: 'FAIL', details: error instanceof Error ? error.message : 'Unknown error' })
      allPassed = false
    }

    // Test 5: AI System initialization
    try {
      await aiAntiCheat.initialize()
      tests.push({ name: 'AI System Initialization', status: 'PASS', details: 'AI engine initialized successfully' })
    } catch (error) {
      tests.push({ name: 'AI System Initialization', status: 'FAIL', details: error instanceof Error ? error.message : 'Unknown error' })
      allPassed = false
    }

    // Test 6: Sample AI analysis
    try {
      const sampleSubmission = {
        id: 'test_' + Date.now(),
        userId: '00000000-0000-0000-0000-000000000000',
        challengeId: 'test_challenge',
        type: 'text' as const,
        content: 'This is a test submission for AI analysis',
        metadata: {
          timestamp: new Date(),
          deviceInfo: 'test-device'
        }
      }

      const result = await aiAntiCheat.analyzeSubmission(sampleSubmission)
      tests.push({ 
        name: 'AI Analysis Test', 
        status: result.confidence > 0 ? 'PASS' : 'FAIL', 
        details: `Confidence: ${result.confidence}%, Action: ${result.action}, Time: ${result.processingTime}ms`
      })
      if (result.confidence <= 0) allPassed = false
    } catch (error) {
      tests.push({ name: 'AI Analysis Test', status: 'FAIL', details: error instanceof Error ? error.message : 'Unknown error' })
      allPassed = false
    }

    // Test 7: Function execution test
    try {
      const sql = await createDbConnection()
      const testUserId = '00000000-0000-0000-0000-000000000001'
      
      // Test risk profile function
      await sql`SELECT update_user_risk_profile(${testUserId}, 'approved')`
      
      // Test AI detection logging
      await sql`SELECT log_ai_detection('v1.0-test', 'approve', true, 850)`
      
      tests.push({ name: 'Function Execution Test', status: 'PASS', details: 'All functions executed successfully' })
    } catch (error) {
      tests.push({ name: 'Function Execution Test', status: 'FAIL', details: error instanceof Error ? error.message : 'Unknown error' })
      allPassed = false
    }

    console.log(`🧪 AI System Test Complete: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`)

    const summary = {
      overall: allPassed ? 'PASS' : 'FAIL',
      totalTests: tests.length,
      passed: tests.filter(t => t.status === 'PASS').length,
      failed: tests.filter(t => t.status === 'FAIL').length,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      success: allPassed,
      message: allPassed 
        ? '🎉 AI Anti-Cheat System is fully operational!' 
        : '⚠️ AI Anti-Cheat System has some issues that need attention',
      summary,
      tests
    })

  } catch (error) {
    console.error('❌ AI System test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Test execution failed',
      message: 'Failed to run AI system tests',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST endpoint for more detailed testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testType, testData } = body

    if (testType === 'analyze-submission') {
      await aiAntiCheat.initialize()
      
      const submission = {
        id: `test_${Date.now()}`,
        userId: testData.userId || '00000000-0000-0000-0000-000000000000',
        challengeId: testData.challengeId || 'test_challenge',
        type: testData.type || 'text',
        content: testData.content || 'Test submission content',
        metadata: {
          timestamp: new Date(),
          ...testData.metadata
        }
      }

      const result = await aiAntiCheat.analyzeSubmission(submission)
      
      return NextResponse.json({
        success: true,
        message: 'AI analysis completed',
        submission,
        result
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Unknown test type',
      availableTests: ['analyze-submission']
    }, { status: 400 })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
