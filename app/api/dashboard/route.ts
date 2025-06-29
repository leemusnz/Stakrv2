import { NextRequest, NextResponse } from 'next/server'

// GET user dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'default-user'
    
    // Mock dashboard data that makes the app feel real and personalized
    const dashboardData = {
      user: {
        id: userId,
        name: 'Alex Chen',
        email: 'alex@stakr.app',
        avatar_url: null,
        credits: 247.50,
        trust_score: 82,
        verification_tier: 'auto',
        current_streak: 12,
        longest_streak: 28,
        premium_subscription: true
      },
      
      stats: {
        total_challenges_completed: 15,
        total_challenges_joined: 18,
        success_rate: 83, // 15/18 * 100
        total_earnings: 892.30,
        total_stakes: 450.00,
        net_profit: 442.30,
        challenges_won: 15,
        challenges_failed: 3,
        current_month_activity: 8,
        streak_record: 28
      },
      
      active_challenges: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: '30-Day Fitness Challenge',
          category: 'fitness',
          days_remaining: 18,
          total_days: 30,
          progress_percentage: 40,
          stake_amount: 50.00,
          potential_reward: 67.50,
          verification_status: 'up_to_date',
          last_submission: '2024-01-12T09:30:00Z',
          next_deadline: '2024-01-13T23:59:59Z',
          status: 'on_track'
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          title: 'Daily Meditation Practice',
          category: 'wellness',
          days_remaining: 9,
          total_days: 21,
          progress_percentage: 57,
          stake_amount: 25.00,
          potential_reward: 31.25,
          verification_status: 'pending',
          last_submission: '2024-01-11T07:15:00Z',
          next_deadline: '2024-01-13T23:59:59Z',
          status: 'at_risk'
        }
      ],
      
      recent_activity: [
        {
          id: 'act_001',
          type: 'challenge_completed',
          title: 'Completed "Read 12 Books Challenge"',
          description: 'Successfully finished all 12 months and earned $125.75',
          amount: 125.75,
          timestamp: '2024-01-10T16:20:00Z',
          challenge_id: '123e4567-e89b-12d3-a456-426614174001'
        },
        {
          id: 'act_002',
          type: 'proof_submitted',
          title: 'Submitted workout proof',
          description: 'Daily workout verification for 30-Day Fitness Challenge',
          timestamp: '2024-01-12T09:30:00Z',
          challenge_id: '123e4567-e89b-12d3-a456-426614174000'
        },
        {
          id: 'act_003',
          type: 'challenge_joined',
          title: 'Joined "Daily Meditation Practice"',
          description: 'Staked $25.00 for 21-day meditation challenge',
          amount: -25.00,
          timestamp: '2024-01-03T11:45:00Z',
          challenge_id: '123e4567-e89b-12d3-a456-426614174002'
        },
        {
          id: 'act_004',
          type: 'credits_purchased',
          title: 'Purchased credits',
          description: 'Added $100.00 to account balance',
          amount: 100.00,
          timestamp: '2024-01-01T14:30:00Z'
        },
        {
          id: 'act_005',
          type: 'reward_earned',
          title: 'Challenge reward received',
          description: 'Earned reward from "Morning Routine Challenge"',
          amount: 73.25,
          timestamp: '2023-12-28T10:15:00Z',
          challenge_id: 'prev_challenge_id'
        }
      ],
      
      upcoming_deadlines: [
        {
          challenge_id: '123e4567-e89b-12d3-a456-426614174000',
          title: '30-Day Fitness Challenge',
          deadline: '2024-01-13T23:59:59Z',
          hours_remaining: 35,
          verification_needed: 'Daily workout photo'
        },
        {
          challenge_id: '123e4567-e89b-12d3-a456-426614174002',
          title: 'Daily Meditation Practice',
          deadline: '2024-01-13T23:59:59Z',
          hours_remaining: 35,
          verification_needed: 'Meditation session confirmation'
        }
      ],
      
      achievements: [
        {
          id: 'streak_master',
          title: 'Streak Master',
          description: 'Maintained a 25+ day streak',
          icon: '🔥',
          earned_date: '2023-12-15T00:00:00Z',
          category: 'consistency'
        },
        {
          id: 'challenge_veteran',
          title: 'Challenge Veteran',
          description: 'Completed 10+ challenges',
          icon: '🏆',
          earned_date: '2023-11-20T00:00:00Z',
          category: 'completion'
        },
        {
          id: 'top_performer',
          title: 'Top Performer',
          description: '90%+ success rate',
          icon: '⭐',
          earned_date: '2023-10-05T00:00:00Z',
          category: 'performance'
        }
      ],
      
      recommendations: [
        {
          challenge_id: '123e4567-e89b-12d3-a456-426614174003',
          title: 'Learn Spanish in 90 Days',
          reason: 'Based on your education category success',
          match_score: 92
        },
        {
          challenge_id: 'new_fitness_challenge',
          title: 'Advanced Strength Training',
          reason: 'You excel at fitness challenges',
          match_score: 88
        }
      ],
      
      trust_score_details: {
        current_score: 82,
        tier: 'auto',
        next_tier_at: 90,
        factors: {
          completion_rate: 83,
          verification_compliance: 95,
          community_standing: 88,
          account_age_months: 8,
          false_claims: 0
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
    return NextResponse.json({
      success: false,
      error: 'Failed to get dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 