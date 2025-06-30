import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { promises as fs } from 'fs'
import path from 'path'

// POST - Run a specific migration file
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has admin access
    const sql = await createDbConnection()
    
    const adminCheck = await sql`
      SELECT has_dev_access FROM users WHERE id = ${session.user.id}
    `
    
    if (!adminCheck[0]?.has_dev_access) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { migrationFile } = await request.json()
    
    if (!migrationFile) {
      return NextResponse.json({ error: 'Migration file name required' }, { status: 400 })
    }

    // Security check - only allow specific migration files
    const allowedMigrations = [
      'challenge-interactions-schema.sql',
      'posts-schema-migration.sql',
      'add-team-id-column.sql',
      'verification-appeals-schema.sql',
      'admin-dashboard-migration.sql'
    ]
    
    if (!allowedMigrations.includes(migrationFile)) {
      return NextResponse.json({ error: 'Migration file not allowed' }, { status: 400 })
    }

    // Read and execute the migration file
    const migrationPath = path.join(process.cwd(), migrationFile)
    
    try {
      const migrationSQL = await fs.readFile(migrationPath, 'utf8')
      
      // Execute the migration
      await sql.unsafe(migrationSQL)
      
      return NextResponse.json({
        success: true,
        message: `Migration ${migrationFile} executed successfully`,
        timestamp: new Date().toISOString()
      })
      
    } catch (fileError) {
      console.error('Migration file error:', fileError)
      return NextResponse.json({
        error: 'Failed to read or execute migration file',
        details: process.env.NODE_ENV === 'development' ? (fileError instanceof Error ? fileError.message : 'Unknown error') : undefined
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Migration execution error:', error)
    return NextResponse.json({
      error: 'Failed to execute migration',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const sql = await createDbConnection()
    
    // Check if user has admin access
    const adminCheck = await sql`
      SELECT has_dev_access FROM users WHERE id = ${session.user.id}
    `
    
    if (!adminCheck[0]?.has_dev_access) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    // Check if migration has already been run
    const columns = await sql`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('is_dev', 'dev_mode_enabled', 'dev_access_granted_by', 'dev_access_granted_at')
    `

    const devUsers = await sql`
      SELECT email, name, is_dev, dev_mode_enabled, dev_access_granted_at 
      FROM users 
      WHERE is_dev = TRUE
    `

    return NextResponse.json({
      migrationStatus: {
        columnsExist: columns.length === 4,
        columnsFound: columns.map(col => col.column_name),
        devUsersCount: devUsers.length,
        devUsers: devUsers
      }
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check migration status', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 