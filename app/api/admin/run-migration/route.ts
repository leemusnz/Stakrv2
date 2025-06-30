import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // For now, allow any authenticated user to run migrations (in production, add admin check)
    const { migration } = await request.json()

    if (!migration) {
      return NextResponse.json({ error: 'Migration name required' }, { status: 400 })
    }

    const sql = await createDbConnection()

    if (migration === 'challenge-schema') {
      // Run the challenge schema migration
      console.log('🔄 Running challenge schema migration...')

      // Add missing columns to challenges table
      await sql`
        ALTER TABLE challenges 
        ADD COLUMN IF NOT EXISTS daily_instructions TEXT,
        ADD COLUMN IF NOT EXISTS general_instructions TEXT,
        ADD COLUMN IF NOT EXISTS proof_instructions TEXT,
        ADD COLUMN IF NOT EXISTS privacy_type VARCHAR(20) DEFAULT 'public',
        ADD COLUMN IF NOT EXISTS tags TEXT[],
        ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
        ADD COLUMN IF NOT EXISTS min_participants INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS max_participants INTEGER,
        ADD COLUMN IF NOT EXISTS start_date_type VARCHAR(20) DEFAULT 'days',
        ADD COLUMN IF NOT EXISTS start_date_days INTEGER DEFAULT 2,
        ADD COLUMN IF NOT EXISTS allow_points_only BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS reward_distribution VARCHAR(30) DEFAULT 'equal-split',
        ADD COLUMN IF NOT EXISTS selected_proof_types TEXT[],
        ADD COLUMN IF NOT EXISTS camera_only BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS allow_late_submissions BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS late_submission_hours INTEGER DEFAULT 4,
        ADD COLUMN IF NOT EXISTS bonus_rewards TEXT[],
        ADD COLUMN IF NOT EXISTS invite_code VARCHAR(20)
      `

      // Add team challenge features
      await sql`
        ALTER TABLE challenges
        ADD COLUMN IF NOT EXISTS enable_team_mode BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS team_assignment_method VARCHAR(20) DEFAULT 'auto-balance',
        ADD COLUMN IF NOT EXISTS number_of_teams INTEGER DEFAULT 2,
        ADD COLUMN IF NOT EXISTS winning_criteria VARCHAR(30) DEFAULT 'completion-rate',
        ADD COLUMN IF NOT EXISTS losing_team_outcome VARCHAR(20) DEFAULT 'lose-stake'
      `

      // Add referral features
      await sql`
        ALTER TABLE challenges
        ADD COLUMN IF NOT EXISTS enable_referral_bonus BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS referral_bonus_percentage DECIMAL(4,2) DEFAULT 20.00,
        ADD COLUMN IF NOT EXISTS max_referrals INTEGER DEFAULT 3
      `

      // Add timer and verification features
      await sql`
        ALTER TABLE challenges
        ADD COLUMN IF NOT EXISTS require_timer BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS timer_min_duration INTEGER DEFAULT 15,
        ADD COLUMN IF NOT EXISTS timer_max_duration INTEGER DEFAULT 120,
        ADD COLUMN IF NOT EXISTS random_checkin_enabled BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS random_checkin_probability DECIMAL(4,2) DEFAULT 30.00
      `

      // Update existing challenges with default values
      const updateResult = await sql`
        UPDATE challenges SET 
          privacy_type = COALESCE(privacy_type, 'public'),
          min_participants = COALESCE(min_participants, 1),
          start_date_type = COALESCE(start_date_type, 'days'),
          start_date_days = COALESCE(start_date_days, 2),
          allow_points_only = COALESCE(allow_points_only, CASE WHEN min_stake = 0 AND max_stake = 0 THEN TRUE ELSE FALSE END),
          reward_distribution = COALESCE(reward_distribution, 'equal-split'),
          camera_only = COALESCE(camera_only, FALSE),
          allow_late_submissions = COALESCE(allow_late_submissions, FALSE),
          late_submission_hours = COALESCE(late_submission_hours, 4),
          enable_team_mode = COALESCE(enable_team_mode, FALSE),
          team_assignment_method = COALESCE(team_assignment_method, 'auto-balance'),
          number_of_teams = COALESCE(number_of_teams, 2),
          winning_criteria = COALESCE(winning_criteria, 'completion-rate'),
          losing_team_outcome = COALESCE(losing_team_outcome, 'lose-stake'),
          enable_referral_bonus = COALESCE(enable_referral_bonus, FALSE),
          referral_bonus_percentage = COALESCE(referral_bonus_percentage, 20.00),
          max_referrals = COALESCE(max_referrals, 3),
          require_timer = COALESCE(require_timer, FALSE),
          timer_min_duration = COALESCE(timer_min_duration, 15),
          timer_max_duration = COALESCE(timer_max_duration, 120),
          random_checkin_enabled = COALESCE(random_checkin_enabled, FALSE),
          random_checkin_probability = COALESCE(random_checkin_probability, 30.00)
        WHERE id IS NOT NULL
      `

      // Create indexes
      try {
        await sql`CREATE INDEX IF NOT EXISTS idx_challenges_privacy_type ON challenges(privacy_type)`
        await sql`CREATE INDEX IF NOT EXISTS idx_challenges_allow_points_only ON challenges(allow_points_only)`
        await sql`CREATE INDEX IF NOT EXISTS idx_challenges_invite_code ON challenges(invite_code)`
        await sql`CREATE INDEX IF NOT EXISTS idx_challenges_require_timer ON challenges(require_timer)`
      } catch (indexError) {
        console.log('⚠️ Some indexes may already exist, continuing...')
      }

      console.log('✅ Challenge schema migration completed successfully!')
      
      return NextResponse.json({
        success: true,
        message: 'Challenge schema migration completed successfully!',
        details: {
          migration: 'challenge-schema',
          recordsUpdated: updateResult.length || 0,
          columnsAdded: [
            'daily_instructions', 'general_instructions', 'proof_instructions',
            'privacy_type', 'tags', 'thumbnail_url', 'min_participants', 'max_participants',
            'start_date_type', 'start_date_days', 'allow_points_only', 'reward_distribution',
            'selected_proof_types', 'camera_only', 'allow_late_submissions', 'late_submission_hours',
            'bonus_rewards', 'invite_code', 'enable_team_mode', 'team_assignment_method',
            'number_of_teams', 'winning_criteria', 'losing_team_outcome', 'enable_referral_bonus',
            'referral_bonus_percentage', 'max_referrals', 'require_timer', 'timer_min_duration',
            'timer_max_duration', 'random_checkin_enabled', 'random_checkin_probability'
          ]
        }
      })
    }

    return NextResponse.json({
      error: 'Unknown migration',
      availableMigrations: ['challenge-schema']
    }, { status: 400 })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      error: 'Migration failed', 
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
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