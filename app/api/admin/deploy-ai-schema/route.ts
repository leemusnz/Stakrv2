import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { systemLogger } from '@/lib/system-logger'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required to deploy database schema'
      }, { status: 403 })
    }

    
    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'ai-anti-cheat-schema.sql')
    let schemaSQL: string
    
    try {
      schemaSQL = fs.readFileSync(schemaPath, 'utf8')
    } catch (error) {
      console.error('❌ Failed to read schema file:', error)
      return NextResponse.json({
        success: false,
        error: 'Schema file not found',
        message: 'Could not read ai-anti-cheat-schema.sql file'
      }, { status: 500 })
    }

    // Test database connection
    const sql = await createDbConnection()
    await sql`SELECT 1 as test`

    // Execute schema statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('RAISE NOTICE'))


    const results = []
    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          await sql.unsafe(statement + ';')
          results.push(`✅ Statement ${i + 1}: Success`)
          successCount++
        } catch (error: any) {
          if (error.message && (
            error.message.includes('already exists') || 
            error.message.includes('does not exist') ||
            error.message.includes('duplicate key')
          )) {
            results.push(`⚠️ Statement ${i + 1}: Already exists (skipped)`)
            skipCount++
          } else {
            results.push(`❌ Statement ${i + 1}: ${error.message}`)
            errorCount++
            console.error(`Statement ${i + 1} failed:`, error.message)
          }
        }
      }
    }

    // Verify key tables were created
    const tablesToCheck = [
      'proof_submissions', 
      'user_risk_profiles', 
      'ai_model_performance', 
      'cheat_detection_patterns', 
      'ban_records'
    ]
    
    const tableStatus = []
    for (const table of tablesToCheck) {
      try {
        const result = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = ${table}
          ) as exists
        `
        
        if (result[0].exists) {
          tableStatus.push(`✅ ${table}`)
        } else {
          tableStatus.push(`❌ ${table} - NOT FOUND`)
        }
      } catch (error) {
        tableStatus.push(`❌ ${table} - ERROR CHECKING`)
      }
    }

    // Test functions
    const functionTests = []
    try {
      // We'll use a dummy UUID for testing
      const testUserId = '00000000-0000-0000-0000-000000000000'
      await sql`SELECT update_user_risk_profile(${testUserId}, 'approved')`
      functionTests.push('✅ update_user_risk_profile function')
    } catch (error) {
      functionTests.push('❌ update_user_risk_profile function - ERROR')
    }

    try {
      await sql`SELECT log_ai_detection('v1.0', 'approve', true, 1500)`
      functionTests.push('✅ log_ai_detection function')
    } catch (error) {
      functionTests.push('❌ log_ai_detection function - ERROR')
    }

    
    systemLogger.info('AI Anti-Cheat Schema deployed', 'admin', {
      userId: session.user.id,
      successCount,
      skipCount,
      errorCount,
      totalStatements: statements.length
    })

    return NextResponse.json({
      success: true,
      message: 'AI Anti-Cheat Schema deployed successfully!',
      details: {
        totalStatements: statements.length,
        successCount,
        skipCount,
        errorCount,
        tableStatus,
        functionTests,
        executionResults: results
      }
    })

  } catch (error) {
    console.error('❌ Schema deployment failed:', error)
    systemLogger.error('AI Schema deployment failed', 'admin', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json({
      success: false,
      error: 'Deployment failed',
      message: 'Failed to deploy AI anti-cheat schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check deployment status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 403 })
    }

    const sql = await createDbConnection()
    
    // Check if AI tables exist
    const tables = ['proof_submissions', 'user_risk_profiles', 'ai_model_performance', 'cheat_detection_patterns', 'ban_records']
    const tableStatus = {}
    
    for (const table of tables) {
      try {
        const result = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = ${table}
          ) as exists
        `
        tableStatus[table] = result[0].exists
      } catch (error) {
        tableStatus[table] = false
      }
    }

    const allTablesExist = Object.values(tableStatus).every(exists => exists)

    return NextResponse.json({
      success: true,
      deployed: allTablesExist,
      tableStatus,
      message: allTablesExist 
        ? 'AI Anti-Cheat Schema is fully deployed' 
        : 'AI Anti-Cheat Schema is not deployed or incomplete'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Status check failed',
      message: 'Could not check deployment status'
    }, { status: 500 })
  }
}
