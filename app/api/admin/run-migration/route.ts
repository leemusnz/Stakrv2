import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || session.user.email !== 'alex@stakr.app') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { migration_type } = await request.json()

    if (migration_type === 'challenge-creation') {
      // Run the challenge creation schema extension
      const sql = await createDbConnection()
      
      const results = []
      
      try {
        // Add privacy_type column
        await sql`ALTER TABLE challenges ADD COLUMN IF NOT EXISTS privacy_type VARCHAR(20) DEFAULT 'public'`
        results.push('✅ Added privacy_type column')
      } catch (error) {
        results.push(`⚠️ privacy_type: ${error.message}`)
      }

      try {
        // Add thumbnail_url column
        await sql`ALTER TABLE challenges ADD COLUMN IF NOT EXISTS thumbnail_url TEXT`
        results.push('✅ Added thumbnail_url column')
      } catch (error) {
        results.push(`⚠️ thumbnail_url: ${error.message}`)
      }

      try {
        // Add tags column
        await sql`ALTER TABLE challenges ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[]`
        results.push('✅ Added tags column')
      } catch (error) {
        results.push(`⚠️ tags: ${error.message}`)
      }

      try {
        // Add instruction columns
        await sql`
          ALTER TABLE challenges 
          ADD COLUMN IF NOT EXISTS general_instructions TEXT,
          ADD COLUMN IF NOT EXISTS daily_instructions TEXT,
          ADD COLUMN IF NOT EXISTS proof_instructions TEXT
        `
        results.push('✅ Added instruction columns')
      } catch (error) {
        results.push(`⚠️ instructions: ${error.message}`)
      }

      try {
        // Add participant settings
        await sql`
          ALTER TABLE challenges 
          ADD COLUMN IF NOT EXISTS min_participants INTEGER DEFAULT 1,
          ADD COLUMN IF NOT EXISTS max_participants INTEGER
        `
        results.push('✅ Added participant settings')
      } catch (error) {
        results.push(`⚠️ participants: ${error.message}`)
      }

      try {
        // Add start date settings
        await sql`
          ALTER TABLE challenges 
          ADD COLUMN IF NOT EXISTS start_date_type VARCHAR(20) DEFAULT 'fixed',
          ADD COLUMN IF NOT EXISTS start_date_days INTEGER DEFAULT 0
        `
        results.push('✅ Added start date settings')
      } catch (error) {
        results.push(`⚠️ start_date: ${error.message}`)
      }

      try {
        // Add reward settings
        await sql`
          ALTER TABLE challenges 
          ADD COLUMN IF NOT EXISTS allow_points_only BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS reward_distribution VARCHAR(30) DEFAULT 'winner-takes-all'
        `
        results.push('✅ Added reward settings')
      } catch (error) {
        results.push(`⚠️ rewards: ${error.message}`)
      }

      try {
        // Add proof settings
        await sql`
          ALTER TABLE challenges 
          ADD COLUMN IF NOT EXISTS selected_proof_types TEXT[] DEFAULT ARRAY['photo'],
          ADD COLUMN IF NOT EXISTS camera_only BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS allow_late_submissions BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS late_submission_hours INTEGER DEFAULT 0
        `
        results.push('✅ Added proof settings')
      } catch (error) {
        results.push(`⚠️ proof_settings: ${error.message}`)
      }

      try {
        // Add bonus and invite settings
        await sql`
          ALTER TABLE challenges 
          ADD COLUMN IF NOT EXISTS bonus_rewards TEXT[] DEFAULT ARRAY[]::TEXT[],
          ADD COLUMN IF NOT EXISTS invite_code VARCHAR(20) UNIQUE
        `
        results.push('✅ Added bonus and invite settings')
      } catch (error) {
        results.push(`⚠️ bonus_invite: ${error.message}`)
      }

      try {
        // Add team mode settings
        await sql`
          ALTER TABLE challenges
          ADD COLUMN IF NOT EXISTS enable_team_mode BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS team_assignment_method VARCHAR(30) DEFAULT 'auto-balance',
          ADD COLUMN IF NOT EXISTS number_of_teams INTEGER DEFAULT 2,
          ADD COLUMN IF NOT EXISTS winning_criteria VARCHAR(30) DEFAULT 'completion-rate',
          ADD COLUMN IF NOT EXISTS losing_team_outcome VARCHAR(30) DEFAULT 'lose-stake'
        `
        results.push('✅ Added team mode settings')
      } catch (error) {
        results.push(`⚠️ team_mode: ${error.message}`)
      }

      try {
        // Add referral settings
        await sql`
          ALTER TABLE challenges
          ADD COLUMN IF NOT EXISTS enable_referral_bonus BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS referral_bonus_percentage INTEGER DEFAULT 20,
          ADD COLUMN IF NOT EXISTS max_referrals INTEGER DEFAULT 3
        `
        results.push('✅ Added referral settings')
      } catch (error) {
        results.push(`⚠️ referrals: ${error.message}`)
      }

      try {
        // Create challenge_teams table
        await sql`
          CREATE TABLE IF NOT EXISTS challenge_teams (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
            team_name VARCHAR(100) NOT NULL,
            team_color VARCHAR(20) DEFAULT 'blue',
            team_emoji VARCHAR(10) DEFAULT '🏆',
            max_members INTEGER DEFAULT 10,
            current_members INTEGER DEFAULT 0,
            completion_rate DECIMAL(5,2) DEFAULT 0.00,
            total_points INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `
        results.push('✅ Created challenge_teams table')
      } catch (error) {
        results.push(`⚠️ challenge_teams: ${error.message}`)
      }

      try {
        // Update challenge_participants for team support
        await sql`
          ALTER TABLE challenge_participants
          ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES challenge_teams(id),
          ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS last_checkin_at TIMESTAMP,
          ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0
        `
        results.push('✅ Updated challenge_participants table')
      } catch (error) {
        results.push(`⚠️ challenge_participants: ${error.message}`)
      }

      try {
        // Create challenge_invites table
        await sql`
          CREATE TABLE IF NOT EXISTS challenge_invites (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
            invite_code VARCHAR(20) NOT NULL,
            invited_by UUID REFERENCES users(id),
            invited_email VARCHAR(255),
            invited_user_id UUID REFERENCES users(id),
            used_at TIMESTAMP,
            expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(challenge_id, invite_code)
          )
        `
        results.push('✅ Created challenge_invites table')
      } catch (error) {
        results.push(`⚠️ challenge_invites: ${error.message}`)
      }

      try {
        // Create challenge_referrals table
        await sql`
          CREATE TABLE IF NOT EXISTS challenge_referrals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
            referrer_id UUID REFERENCES users(id),
            referred_id UUID REFERENCES users(id),
            bonus_earned DECIMAL(8,2) DEFAULT 0.00,
            bonus_paid BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(challenge_id, referrer_id, referred_id)
          )
        `
        results.push('✅ Created challenge_referrals table')
      } catch (error) {
        results.push(`⚠️ challenge_referrals: ${error.message}`)
      }

      try {
        // Create daily_checkins table
        await sql`
          CREATE TABLE IF NOT EXISTS daily_checkins (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            participant_id UUID REFERENCES challenge_participants(id) ON DELETE CASCADE,
            challenge_id UUID REFERENCES challenges(id),
            user_id UUID REFERENCES users(id),
            checkin_date DATE NOT NULL,
            completed BOOLEAN DEFAULT false,
            proof_type VARCHAR(20),
            proof_url TEXT,
            proof_text TEXT,
            points_earned INTEGER DEFAULT 0,
            verified BOOLEAN DEFAULT false,
            verified_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(participant_id, checkin_date)
          )
        `
        results.push('✅ Created daily_checkins table')
      } catch (error) {
        results.push(`⚠️ daily_checkins: ${error.message}`)
      }

      try {
        // Create generate_invite_code function
        await sql`
          CREATE OR REPLACE FUNCTION generate_invite_code() RETURNS VARCHAR(20) AS $$
          DECLARE
              code VARCHAR(20);
              chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
              i INTEGER;
          BEGIN
              code := '';
              FOR i IN 1..8 LOOP
                  code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
              END LOOP;
              RETURN code;
          END;
          $$ LANGUAGE plpgsql
        `
        results.push('✅ Created generate_invite_code function')
      } catch (error) {
        results.push(`⚠️ generate_invite_code: ${error.message}`)
      }

      try {
        // Create indexes
        await sql`CREATE INDEX IF NOT EXISTS idx_challenges_privacy_type ON challenges(privacy_type)`
        await sql`CREATE INDEX IF NOT EXISTS idx_challenges_invite_code ON challenges(invite_code)`
        await sql`CREATE INDEX IF NOT EXISTS idx_challenge_teams_challenge_id ON challenge_teams(challenge_id)`
        results.push('✅ Created performance indexes')
      } catch (error) {
        results.push(`⚠️ indexes: ${error.message}`)
      }

      return NextResponse.json({
        success: true,
        message: 'Challenge creation migration completed!',
        details: results,
        migration_type: 'challenge-creation'
      })
    }
    
    // Fallback for original migration
    const sql = await createDbConnection()
    
    // Test connection first
    const testResult = await sql`SELECT 1 as test`
    
    // Add dev access columns to users table if not exist
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_dev BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS dev_mode_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS dev_access_granted_by UUID REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS dev_access_granted_at TIMESTAMP
    `
    
    // Create index for dev users
    await sql`
      CREATE INDEX IF NOT EXISTS users_dev_idx ON users(is_dev) WHERE is_dev = TRUE
    `
    
    // Grant dev access to admin user
    await sql`
      UPDATE users 
      SET is_dev = TRUE, dev_mode_enabled = TRUE, dev_access_granted_at = NOW()
      WHERE email = 'alex@stakr.app'
    `

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully!',
      test_connection: testResult,
      admin_updated: true
    })

  } catch (error) {
    console.error('Migration error:', error)
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