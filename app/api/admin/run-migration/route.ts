import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('🚀 Starting database migration...')
    
    const sql = await createDbConnection()
    
    console.log('✅ Database connection established')

    // Add dev access columns
    console.log('📝 Adding dev access columns...')
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_dev BOOLEAN DEFAULT FALSE NOT NULL,
      ADD COLUMN IF NOT EXISTS dev_mode_enabled BOOLEAN DEFAULT FALSE NOT NULL,
      ADD COLUMN IF NOT EXISTS dev_access_granted_by UUID REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS dev_access_granted_at TIMESTAMP
    `
    
    console.log('✅ Dev access columns added')
    
    // Create index for dev users
    console.log('📝 Creating index for dev users...')
    await sql`CREATE INDEX IF NOT EXISTS users_dev_idx ON users(is_dev)`
    
    console.log('✅ Index created')
    
    // Grant dev access to existing admin user (alex@stakr.app)
    console.log('📝 Granting dev access to admin user...')
    const result = await sql`
      UPDATE users 
      SET is_dev = TRUE, 
          dev_access_granted_at = NOW(),
          dev_access_granted_by = (SELECT id FROM users WHERE email = 'alex@stakr.app' LIMIT 1)
      WHERE email = 'alex@stakr.app'
      RETURNING email, is_dev, dev_access_granted_at
    `
    
    let adminUpdated = false
    if (result.length > 0) {
      console.log('✅ Dev access granted to admin:', result[0])
      adminUpdated = true
    } else {
      console.log('ℹ️ Admin user alex@stakr.app not found in database')
    }
    
    // Verify the changes
    console.log('📝 Verifying changes...')
    const devUsers = await sql`
      SELECT 
          email, 
          name, 
          is_dev, 
          dev_mode_enabled, 
          dev_access_granted_at 
      FROM users 
      WHERE is_dev = TRUE
    `
    
    console.log('✅ Dev users found:', devUsers)
    
    // Show table structure (just column names)
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name LIKE '%dev%'
      ORDER BY ordinal_position
    `
    
    console.log('✅ New dev columns in users table:', columns)
    
    console.log('🎉 Migration completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully!',
      results: {
        columnsAdded: true,
        indexCreated: true,
        adminUpdated,
        devUsers: devUsers.length,
        newColumns: columns.map(col => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable,
          default: col.column_default
        }))
      }
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const sql = await createDbConnection()
    
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