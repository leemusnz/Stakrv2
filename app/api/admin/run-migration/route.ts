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

    const body = await request.json()
    const { migrationFile, migration } = body
    
    // Handle new migration types
    if (migration) {
      if (migration === 'content-moderation') {
        try {
          console.log('🛡️ Starting content moderation setup...')
          
          // Read and execute the content moderation schema
          const migrationPath = path.join(process.cwd(), 'content-moderation-schema.sql')
          console.log('📁 Reading schema file from:', migrationPath)
          
          const migrationSQL = await fs.readFile(migrationPath, 'utf8')
          console.log('✅ Schema file read successfully, size:', migrationSQL.length, 'characters')
          
          // Execute the migration
          console.log('🔄 Executing moderation schema migration...')
          await sql.unsafe(migrationSQL)
          console.log('✅ Migration executed successfully!')
          
          // Verify moderation tables exist
          const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('moderation_logs', 'user_reports', 'moderation_queue', 'user_moderation_actions')
            ORDER BY table_name
          `
          
          console.log('📊 Moderation tables found:', tables.map(t => t.table_name))
          
          // Also check what tables actually exist in the database for debugging
          const allTables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%moderation%' OR table_name LIKE '%report%')
            ORDER BY table_name
          `
          console.log('🔍 All moderation-related tables:', allTables.map(t => t.table_name))
          
          const success = tables.length === 4
          const message = success 
            ? `Content moderation setup complete! Found all ${tables.length}/4 tables: ${tables.map(t => t.table_name).join(', ')}`
            : `Content moderation partially setup. Found ${tables.length}/4 tables: ${tables.map(t => t.table_name).join(', ')}. Check database permissions.`
          
          return NextResponse.json({
            success: true,
            message,
            timestamp: new Date().toISOString(),
            details: {
              tablesFound: tables.map(t => t.table_name),
              allModerationTables: allTables.map(t => t.table_name),
              schemaSize: migrationSQL.length,
              expectedTables: ['moderation_logs', 'user_reports', 'moderation_queue', 'user_moderation_actions']
            }
          })
          
        } catch (error) {
          console.error('❌ Content moderation migration error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          console.error('Error details:', errorMessage)
          
          return NextResponse.json({
            error: 'Failed to setup content moderation',
            details: errorMessage,
            timestamp: new Date().toISOString()
          }, { status: 500 })
        }
      } else if (migration === 'challenge-schema') {
        try {
          // Handle the challenge schema migration
          const migrationSQL = `
            -- Add missing columns for enhanced challenge creation
            ALTER TABLE challenges ADD COLUMN IF NOT EXISTS timer_enabled BOOLEAN DEFAULT FALSE;
            ALTER TABLE challenges ADD COLUMN IF NOT EXISTS timer_duration INTEGER;
            ALTER TABLE challenges ADD COLUMN IF NOT EXISTS random_verification_enabled BOOLEAN DEFAULT FALSE;
            ALTER TABLE challenges ADD COLUMN IF NOT EXISTS verification_frequency VARCHAR(20) DEFAULT 'daily';
            ALTER TABLE challenges ADD COLUMN IF NOT EXISTS proof_template TEXT;
            
            -- Create indexes for performance
            CREATE INDEX IF NOT EXISTS challenges_timer_idx ON challenges(timer_enabled);
            CREATE INDEX IF NOT EXISTS challenges_verification_idx ON challenges(random_verification_enabled);
          `
          
          await sql.unsafe(migrationSQL)
          
          return NextResponse.json({
            success: true,
            message: 'Challenge schema updated successfully',
            timestamp: new Date().toISOString()
          })
          
        } catch (error) {
          console.error('Challenge schema migration error:', error)
          return NextResponse.json({
            error: 'Failed to update challenge schema',
            details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
          }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: 'Unknown migration type' }, { status: 400 })
      }
    }
    
    // Handle legacy file-based migrations
    if (!migrationFile) {
      return NextResponse.json({ error: 'Migration file name or type required' }, { status: 400 })
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
