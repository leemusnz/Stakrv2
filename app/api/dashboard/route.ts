import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { shouldUseDemoData, createDemoResponse } from '@/lib/demo-mode'
import { 
  isDemoUser, 
  getDemoUserData, 
  getDemoActiveChallenges, 
  getDemoCompletedChallenges,
  getDemoTransactions,
  getDemoNotifications 
} from '@/lib/demo-data'

// GET user dashboard data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to view your dashboard'
      }, { status: 401 })
    }

    // Check for demo mode (new system) OR demo users (legacy compatibility)
    if (shouldUseDemoData(request, session) || (session?.user && isDemoUser(session.user.id))) {
      const isAdmin = session.user.isAdmin || session.user.email === 'alex@stakr.app'
      
      // Get comprehensive demo data
      const demoUserData = getDemoUserData(session)
      const demoActiveChallenges = getDemoActiveChallenges(isAdmin)
      const demoCompletedChallenges = getDemoCompletedChallenges(isAdmin)
      const demoTransactions = getDemoTransactions(isAdmin)
      const demoNotifications = getDemoNotifications(isAdmin)

      // Create recent activity from demo transactions and challenges
      const recentActivity = [
        ...demoTransactions.slice(0, 3).map((t: any) => ({
          id: `tx_${t.id}`,
          type: t.type,
          title: `${t.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}`,
          description: `${t.type === 'deposit' ? 'Added' : t.type === 'stake' ? 'Staked' : 'Received'} $${Math.abs(t.amount).toFixed(2)}`,
          amount: t.amount,
          timestamp: t.createdAt,
          challenge_id: null
        })),
        ...demoCompletedChallenges.slice(0, 2).map((c: any) => ({
          id: `ch_${c.id}`,
          type: 'challenge_completed',
          title: `Completed "${c.title}"`,
          description: `Successfully finished and earned $${c.rewardEarned.toFixed(2)}`,
          amount: c.rewardEarned,
          timestamp: c.completedAt,
          challenge_id: c.id
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)

      // Create upcoming deadlines from active challenges
      const upcomingDeadlines = demoActiveChallenges.map((c: any) => ({
        challenge_id: c.id,
        title: c.title,
        deadline: c.nextDeadline,
        hours_remaining: Math.max(0, Math.floor((new Date(c.nextDeadline).getTime() - Date.now()) / (1000 * 60 * 60))),
        verification_needed: 'Proof submission required'
      })).slice(0, 3)

      // Create achievements based on demo stats
      const achievements = []
      if (demoUserData.user.currentStreak >= 25) {
        achievements.push({
          id: 'streak_master',
          title: 'Streak Master',
          description: 'Maintained a 25+ day streak',
          icon: '🔥',
          earned_date: new Date().toISOString(),
          category: 'consistency'
        })
      }
      if (demoUserData.user.challengesCompleted >= 10) {
        achievements.push({
          id: 'challenge_veteran',
          title: 'Challenge Veteran',
          description: 'Completed 10+ challenges',
          icon: '🏆',
          earned_date: new Date().toISOString(),
          category: 'completion'
        })
      }
      if (demoUserData.user.trustScore >= 90) {
        achievements.push({
          id: 'top_performer',
          title: 'Top Performer',
          description: '90+ trust score',
          icon: '⭐',
          earned_date: new Date().toISOString(),
          category: 'performance'
        })
      }

      const demoDashboardData = {
        user: demoUserData.user,
        
        stats: {
          total_challenges_completed: demoUserData.user.challengesCompleted,
          total_challenges_joined: demoActiveChallenges.length + demoUserData.user.challengesCompleted,
          success_rate: Math.round(((demoUserData.user.challengesCompleted - demoUserData.user.falseClaims) / Math.max(1, demoUserData.user.challengesCompleted)) * 100),
          total_earnings: demoUserData.stats.totalEarnings,
          total_stakes: demoUserData.stats.activeStakes,
          net_profit: demoUserData.stats.totalEarnings - demoUserData.stats.activeStakes,
          challenges_won: demoUserData.user.challengesCompleted,
          challenges_failed: demoUserData.user.falseClaims,
          current_month_activity: demoActiveChallenges.length,
          streak_record: demoUserData.user.longestStreak
        },
        
        active_challenges: demoActiveChallenges.map((challenge: any) => ({
          id: challenge.id,
          title: challenge.title,
          category: challenge.category,
          days_remaining: challenge.daysRemaining,
          total_days: Math.ceil((new Date(challenge.nextDeadline).getTime() - (Date.now() - challenge.progress * 24 * 60 * 60 * 1000)) / (1000 * 60 * 60 * 24)),
          progress_percentage: challenge.progress,
          stake_amount: challenge.stakeAmount,
          potential_reward: challenge.potentialWinnings,
          verification_status: challenge.verificationStatus,
          last_submission: challenge.proofSubmitted,
          next_deadline: challenge.nextDeadline,
          status: challenge.daysRemaining > 3 ? 'on_track' : 'at_risk'
        })),
        
        recent_activity: recentActivity,
        upcoming_deadlines: upcomingDeadlines,
        achievements,
        
        recommendations: [
          {
            challenge_id: 'recommended_1',
            title: 'New Challenge Recommendation',
            reason: 'Based on your success pattern',
            match_score: 85
          }
        ],
        
        trust_score_details: {
          current_score: demoUserData.user.trustScore,
          tier: demoUserData.user.verificationTier,
          next_tier_at: 90,
          factors: {
            completion_rate: Math.round(((demoUserData.user.challengesCompleted - demoUserData.user.falseClaims) / Math.max(1, demoUserData.user.challengesCompleted)) * 100),
            verification_compliance: 95,
            community_standing: demoUserData.user.trustScore,
            account_age_months: Math.floor((Date.now() - new Date(demoUserData.user.memberSince).getTime()) / (1000 * 60 * 60 * 24 * 30)),
            false_claims: demoUserData.user.falseClaims
          }
        }
      }

      return NextResponse.json(createDemoResponse({
        success: true,
        dashboard: demoDashboardData,
        message: 'Demo dashboard data retrieved successfully',
        last_updated: new Date().toISOString()
      }, request, session))
    }

    // For real users, query the database
    const sql = await createDbConnection()
    const userId = session.user.id
    
    // Get user profile
    const userProfile = await sql`
      SELECT 
        id, email, name, avatar_url, credits, trust_score, verification_tier,
        challenges_completed, false_claims, current_streak, longest_streak,
        premium_subscription, premium_expires_at, created_at
      FROM users 
      WHERE id = ${userId}
      LIMIT 1
    `
    
    if (userProfile.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    const user = userProfile[0]

    // Get active challenges
    const activeChallenges = await sql`
      SELECT 
        c.id, c.title, c.category, c.duration, c.start_date, c.end_date,
        cp.stake_amount, cp.completion_status, cp.proof_submitted,
        cp.verification_status, cp.joined_at
      FROM challenges c
      JOIN challenge_participants cp ON c.id = cp.challenge_id
      WHERE cp.user_id = ${userId}
        AND cp.completion_status IN ('active', 'pending_verification')
      ORDER BY c.start_date DESC
    `

    // Get recent activity (transactions and challenge events)
    const recentTransactions = await sql`
      SELECT 
        'transaction' as type, id, transaction_type as action,
        amount, status, created_at, null as challenge_id
      FROM transactions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 5
    `

    const recentChallengeEvents = await sql`
      SELECT 
        'challenge_event' as type, c.id, 
        CASE 
          WHEN cp.completion_status = 'completed' THEN 'challenge_completed'
          WHEN cp.joined_at IS NOT NULL THEN 'challenge_joined'
          ELSE 'challenge_updated'
        END as action,
        cp.reward_earned as amount, c.title,
        COALESCE(cp.completed_at, cp.joined_at) as created_at,
        c.id as challenge_id
      FROM challenge_participants cp
      JOIN challenges c ON cp.challenge_id = c.id
      WHERE cp.user_id = ${userId}
      ORDER BY COALESCE(cp.completed_at, cp.joined_at) DESC
      LIMIT 5
    `

    // Combine and sort activities
    const allActivity = [
      ...recentTransactions.map((t: any) => ({
        id: `tx_${t.id}`,
        type: t.action,
        title: `${t.action.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}`,
        description: `${t.action === 'deposit' ? 'Added' : t.action === 'stake' ? 'Staked' : 'Received'} $${Math.abs(t.amount).toFixed(2)}`,
        amount: parseFloat(t.amount),
        timestamp: t.created_at,
        challenge_id: t.challenge_id
      })),
      ...recentChallengeEvents.map((e: any) => ({
        id: `ch_${e.id}`,
        type: e.action,
        title: e.action === 'challenge_completed' ? `Completed "${e.title}"` : 
               e.action === 'challenge_joined' ? `Joined "${e.title}"` : `Updated "${e.title}"`,
        description: e.action === 'challenge_completed' ? `Successfully finished and earned $${(e.amount || 0).toFixed(2)}` :
                     e.action === 'challenge_joined' ? 'Started new challenge' : 'Challenge activity',
        amount: parseFloat(e.amount || 0),
        timestamp: e.created_at,
        challenge_id: e.challenge_id
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)

    // Get upcoming deadlines
    const upcomingDeadlines = await sql`
      SELECT 
        c.id as challenge_id, c.title, c.end_date as deadline,
        c.verification_requirements
      FROM challenges c
      JOIN challenge_participants cp ON c.id = cp.challenge_id
      WHERE cp.user_id = ${userId}
        AND cp.completion_status = 'active'
        AND c.end_date > NOW()
      ORDER BY c.end_date ASC
      LIMIT 5
    `

    // Get user achievements (based on stats)
    const achievements = []
    if (user.current_streak >= 25) {
      achievements.push({
        id: 'streak_master',
        title: 'Streak Master',
        description: 'Maintained a 25+ day streak',
        icon: '🔥',
        earned_date: new Date().toISOString(),
        category: 'consistency'
      })
    }
    if (user.challenges_completed >= 10) {
      achievements.push({
        id: 'challenge_veteran',
        title: 'Challenge Veteran',
        description: 'Completed 10+ challenges',
        icon: '🏆',
        earned_date: new Date().toISOString(),
        category: 'completion'
      })
    }
    if (user.trust_score >= 90) {
      achievements.push({
        id: 'top_performer',
        title: 'Top Performer',
        description: '90+ trust score',
        icon: '⭐',
        earned_date: new Date().toISOString(),
        category: 'performance'
      })
    }

    // Calculate stats
    const totalEarnings = await sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ${userId} 
        AND transaction_type IN ('reward', 'payout')
        AND amount > 0
    `

    const totalStakes = await sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ${userId}
        AND transaction_type = 'stake'
    `

    const successRate = user.challenges_completed > 0 
      ? Math.round(((user.challenges_completed - (user.false_claims || 0)) / user.challenges_completed) * 100)
      : 100

    const dashboardData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        credits: parseFloat(user.credits) || 0,
        trust_score: user.trust_score || 50,
        verification_tier: user.verification_tier || 'manual',
        current_streak: user.current_streak || 0,
        longest_streak: user.longest_streak || 0,
        premium_subscription: user.premium_subscription || false
      },
      
      stats: {
        total_challenges_completed: user.challenges_completed || 0,
        total_challenges_joined: activeChallenges.length + (user.challenges_completed || 0),
        success_rate: successRate,
        total_earnings: parseFloat(totalEarnings[0].total) || 0,
        total_stakes: Math.abs(parseFloat(totalStakes[0].total)) || 0,
        net_profit: (parseFloat(totalEarnings[0].total) || 0) - Math.abs(parseFloat(totalStakes[0].total) || 0),
        challenges_won: user.challenges_completed || 0,
        challenges_failed: user.false_claims || 0,
        current_month_activity: activeChallenges.length,
        streak_record: user.longest_streak || 0
      },
      
      active_challenges: activeChallenges.map((challenge: any) => {
        const daysRemaining = Math.max(0, Math.ceil((new Date(challenge.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        const totalDays = Math.ceil((new Date(challenge.end_date).getTime() - new Date(challenge.start_date).getTime()) / (1000 * 60 * 60 * 24))
        const progressPercentage = Math.max(0, Math.min(100, Math.round(((totalDays - daysRemaining) / totalDays) * 100)))
        
        return {
          id: challenge.id,
          title: challenge.title,
          category: challenge.category,
          days_remaining: daysRemaining,
          total_days: totalDays,
          progress_percentage: progressPercentage,
          stake_amount: parseFloat(challenge.stake_amount),
          potential_reward: parseFloat(challenge.stake_amount) * 1.35, // Estimated 35% return
          verification_status: challenge.verification_status || 'pending',
          last_submission: challenge.proof_submitted,
          next_deadline: challenge.end_date,
          status: daysRemaining > 3 ? 'on_track' : 'at_risk'
        }
      }),
      
      recent_activity: allActivity,
      
      upcoming_deadlines: upcomingDeadlines.map((deadline: any) => ({
        challenge_id: deadline.challenge_id,
        title: deadline.title,
        deadline: deadline.deadline,
        hours_remaining: Math.max(0, Math.floor((new Date(deadline.deadline).getTime() - Date.now()) / (1000 * 60 * 60))),
        verification_needed: deadline.verification_requirements || 'Proof submission required'
      })),
      
      achievements,
      
      recommendations: [
        {
          challenge_id: 'recommended_1',
          title: 'New Challenge Recommendation',
          reason: 'Based on your success pattern',
          match_score: 85
        }
      ],
      
      trust_score_details: {
        current_score: user.trust_score || 50,
        tier: user.verification_tier || 'manual',
        next_tier_at: 90,
        factors: {
          completion_rate: successRate,
          verification_compliance: 95,
          community_standing: Math.max(50, user.trust_score || 50),
          account_age_months: Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)),
          false_claims: user.false_claims || 0
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      dashboard: dashboardData,
      message: 'Dashboard data retrieved successfully',
      last_updated: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get dashboard data',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
