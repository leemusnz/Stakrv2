import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log('🔧 Running team_id column migration...')
    
    const sql = await createDbConnection()
    
    // Add team_id column to challenge_participants
    console.log('📝 Adding team_id column...')
    await sql`
      ALTER TABLE challenge_participants 
      ADD COLUMN IF NOT EXISTS team_id UUID
    `
    
    // Add index on team_id for better query performance
    console.log('📊 Adding index on team_id...')
    await sql`
      CREATE INDEX IF NOT EXISTS idx_challenge_participants_team_id 
      ON challenge_participants(team_id)
    `
    
    // Verify the column was added
    console.log('✅ Verifying column exists...')
    const verification = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'challenge_participants' 
      AND column_name = 'team_id'
    `
    
    console.log('🎉 Migration completed successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'team_id column added successfully',
      verification: verification[0] || null
    })
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 