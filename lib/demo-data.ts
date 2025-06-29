// Centralized demo user detection and mock data management

export function isDemoUser(userId: string): boolean {
  return userId.startsWith('demo-')
}

export function getDemoUserData(session: any) {
  const isAdmin = session.user.isAdmin || session.user.email === 'alex@stakr.app'
  
  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      avatar: session.user.avatar,
      credits: session.user.credits || 0,
      trustScore: session.user.trustScore || 50,
      verificationTier: session.user.verificationTier || 'manual',
      challengesCompleted: isAdmin ? 25 : 12,
      falseClaims: isAdmin ? 0 : 1,
      currentStreak: isAdmin ? 15 : 7,
      longestStreak: isAdmin ? 28 : 14,
      premiumSubscription: session.user.premiumSubscription || false,
      premiumExpiresAt: null,
      memberSince: new Date('2024-01-01'),
      // Dev access fields
      isDev: isAdmin, // Admin demo users have dev access
      devModeEnabled: false
    },
    stats: {
      totalEarnings: isAdmin ? 2450.75 : 847.50,
      currentBalance: session.user.credits || 0,
      activeStakes: isAdmin ? 225.00 : 125.00,
      activeChallengesCount: isAdmin ? 5 : 3,
      completedChallengesCount: isAdmin ? 25 : 12,
      successRate: isAdmin ? 98 : 92
    }
  }
}

export function getDemoActiveChallenges(isAdmin: boolean = false) {
  const baseActiveChallenges = [
    {
      id: 'demo-ch-1',
      title: '30-Day Morning Workout',
      description: 'Start each day with 30 minutes of exercise',
      category: 'Fitness',
      duration: '30 days',
      difficulty: 'medium',
      stakeAmount: 50.00,
      completionStatus: 'active',
      proofSubmitted: false,
      verificationStatus: 'pending',
      daysRemaining: 8,
      progress: 73,
      currentStreak: 3,
      potentialWinnings: 75.00,
      participants: 24,
      nextDeadline: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours from now
    },
    {
      id: 'demo-ch-2',
      title: 'Daily Reading Challenge',
      description: 'Read for at least 1 hour every day',
      category: 'Learning',
      duration: '21 days',
      difficulty: 'easy',
      stakeAmount: 30.00,
      completionStatus: 'active',
      proofSubmitted: true,
      verificationStatus: 'approved',
      daysRemaining: 5,
      progress: 76,
      currentStreak: 5,
      potentialWinnings: 45.00,
      participants: 18,
      nextDeadline: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString() // 18 hours from now
    },
    {
      id: 'demo-ch-3',
      title: 'Meditation Mastery',
      description: '15 minutes of daily meditation',
      category: 'Wellness',
      duration: '14 days',
      difficulty: 'easy',
      stakeAmount: 45.00,
      completionStatus: 'active',
      proofSubmitted: false,
      verificationStatus: 'pending',
      daysRemaining: 12,
      progress: 21,
      currentStreak: 2,
      potentialWinnings: 67.50,
      participants: 31,
      nextDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
    }
  ]

  if (isAdmin) {
    return [
      ...baseActiveChallenges,
      {
        id: 'demo-ch-4',
        title: 'Code Review Excellence',
        description: 'Review at least 3 PRs per day with detailed feedback',
        category: 'Professional',
        duration: '7 days',
        difficulty: 'hard',
        stakeAmount: 75.00,
        completionStatus: 'active',
        proofSubmitted: true,
        verificationStatus: 'approved',
        daysRemaining: 3,
        progress: 86,
        currentStreak: 6,
        potentialWinnings: 112.50,
        participants: 12,
        nextDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'demo-ch-5',
        title: 'Leadership Development',
        description: 'Attend one leadership workshop per week',
        category: 'Professional',
        duration: '30 days',
        difficulty: 'medium',
        stakeAmount: 100.00,
        completionStatus: 'active',
        proofSubmitted: false,
        verificationStatus: 'pending',
        daysRemaining: 22,
        progress: 27,
        currentStreak: 1,
        potentialWinnings: 150.00,
        participants: 8,
        nextDeadline: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString()
      }
    ]
  }

  return baseActiveChallenges
}

export function getDemoCompletedChallenges(isAdmin: boolean = false) {
  const baseCompleted = [
    {
      id: 'demo-completed-1',
      title: '7-Day Water Challenge',
      description: 'Drink 8 glasses of water daily',
      category: 'Health',
      duration: '7 days',
      difficulty: 'easy',
      stakeAmount: 25.00,
      rewardEarned: 37.50,
      completedAt: new Date('2024-01-15'),
      endDate: new Date('2024-01-15'),
      participants: 45,
      completers: 32
    },
    {
      id: 'demo-completed-2',
      title: 'No Social Media Weekend',
      description: 'Stay off social media for 48 hours',
      category: 'Digital Wellness',
      duration: '2 days',
      difficulty: 'medium',
      stakeAmount: 15.00,
      rewardEarned: 22.50,
      completedAt: new Date('2024-01-12'),
      endDate: new Date('2024-01-12'),
      participants: 28,
      completers: 19
    }
  ]

  if (isAdmin) {
    return [
      ...baseCompleted,
      {
        id: 'demo-completed-3',
        title: 'Tech Conference Networking',
        description: 'Meet 10 new people at tech events',
        category: 'Professional',
        duration: '14 days',
        difficulty: 'hard',
        stakeAmount: 80.00,
        rewardEarned: 120.00,
        completedAt: new Date('2024-01-08'),
        endDate: new Date('2024-01-08'),
        participants: 15,
        completers: 9
      }
    ]
  }

  return baseCompleted
}

export function getDemoTransactions(isAdmin: boolean = false) {
  const baseTransactions = [
    {
      id: 'demo-tx-1',
      type: 'reward',
      amount: 37.50,
      status: 'completed',
      createdAt: new Date('2024-01-15')
    },
    {
      id: 'demo-tx-2',
      type: 'stake',
      amount: -50.00,
      status: 'active',
      createdAt: new Date('2024-01-14')
    },
    {
      id: 'demo-tx-3',
      type: 'deposit',
      amount: 100.00,
      status: 'completed',
      createdAt: new Date('2024-01-13')
    },
    {
      id: 'demo-tx-4',
      type: 'reward',
      amount: 22.50,
      status: 'completed',
      createdAt: new Date('2024-01-12')
    }
  ]

  if (isAdmin) {
    return [
      {
        id: 'demo-tx-admin-1',
        type: 'reward',
        amount: 120.00,
        status: 'completed',
        createdAt: new Date('2024-01-16')
      },
      ...baseTransactions,
      {
        id: 'demo-tx-admin-2',
        type: 'deposit',
        amount: 500.00,
        status: 'completed',
        createdAt: new Date('2024-01-10')
      }
    ]
  }

  return baseTransactions
}

export function getDemoNotifications(isAdmin: boolean = false) {
  const baseNotifications = [
    {
      id: 'demo-notif-1',
      type: 'reminder',
      title: 'Daily Check-in Reminder',
      message: "Don't forget to submit your workout proof today!",
      actionUrl: '/my-challenges',
      createdAt: new Date()
    }
  ]

  if (isAdmin) {
    return [
      {
        id: 'demo-notif-admin-1',
        type: 'admin',
        title: 'New Dev Access Request',
        message: 'User leejmckenzie@gmail.com has requested developer access.',
        actionUrl: '/admin',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      ...baseNotifications
    ]
  }

  return baseNotifications
} 