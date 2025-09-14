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
      // XP and Level system
      xp: isAdmin ? 1250 : 450, // Admin has more XP
      level: isAdmin ? 7 : 3, // Admin is higher level
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

// Mock user challenges data
export function getMockUserChallenges(userId: string) {
  const challenges = [
    // Active challenges
    {
      id: 'challenge-active-1',
      title: '30-Day Morning Workout',
      description: 'Complete a 30-minute workout every morning before 8 AM',
      category: 'Fitness',
      stakeAmount: 50.00,
      participants: 127,
      totalParticipants: 127,
      progress: 73,
      currentStreak: 22,
      daysRemaining: 8,
      completionStatus: 'active',
      nextDeadline: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // 18 hours from now
      potentialWinnings: 75.00
    },
    {
      id: 'challenge-active-2', 
      title: 'Daily Reading Challenge',
      description: 'Read for at least 30 minutes every day',
      category: 'Education',
      stakeAmount: 30.00,
      participants: 89,
      totalParticipants: 89,
      progress: 56,
      currentStreak: 14,
      daysRemaining: 11,
      completionStatus: 'active',
      nextDeadline: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
      potentialWinnings: 45.00
    },
    // Completed challenges
    {
      id: 'challenge-completed-1',
      title: 'No Social Media Week',
      description: 'Stay off social media for 7 consecutive days',
      category: 'Digital Wellness',
      stakeAmount: 25.00,
      participants: 45,
      totalParticipants: 45,
      progress: 100,
      completionStatus: 'completed',
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      rewardEarned: 37.50
    },
    {
      id: 'challenge-completed-2',
      title: 'Meditation Mastery',
      description: 'Meditate for 15 minutes daily for 2 weeks',
      category: 'Mindfulness',
      stakeAmount: 40.00,
      participants: 63,
      totalParticipants: 63,
      progress: 100,
      completionStatus: 'completed',
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      rewardEarned: 60.00
    },
    // Failed challenges with rejected verifications
    {
      id: 'challenge-failed-1',
      title: 'Early Riser Challenge',
      description: 'Wake up at 6 AM every day for a week',
      category: 'Productivity',
      stakeAmount: 35.00,
      participants: 78,
      totalParticipants: 78,
      progress: 65,
      completionStatus: 'failed',
      failedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      rejectedVerification: {
        id: 'verification-rejected-1',
        reason: 'Timestamp indicates photo was taken at 8:30 AM, not 6:00 AM as required for the challenge.',
        rejectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        appealSubmitted: false
      }
    },
    {
      id: 'challenge-failed-2',
      title: 'No Fast Food Week',
      description: 'Avoid all fast food for 7 consecutive days',
      category: 'Nutrition',
      stakeAmount: 40.00,
      participants: 92,
      totalParticipants: 92,
      progress: 43,
      completionStatus: 'failed',
      failedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      rejectedVerification: {
        id: 'verification-rejected-2',
        reason: 'Photo appears to show fast food packaging in the background, which violates the challenge rules.',
        rejectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        appealSubmitted: false
      }
    },
    {
      id: 'challenge-failed-3',
      title: '10,000 Steps Daily',
      description: 'Walk at least 10,000 steps every day for 2 weeks',
      category: 'Fitness',
      stakeAmount: 30.00,
      participants: 156,
      totalParticipants: 156,
      progress: 80,
      completionStatus: 'failed',
      failedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
      rejectedVerification: {
        id: 'verification-rejected-3',
        reason: 'Step counter shows 9,847 steps, which is below the required 10,000 steps for this challenge.',
        rejectedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        appealSubmitted: true // This one already has an appeal submitted
      }
    },
    // Failed challenge without verification issues (just didn't complete)
    {
      id: 'challenge-failed-4',
      title: 'Sugar-Free Month',
      description: 'Eliminate all refined sugar for 30 days',
      category: 'Nutrition',
      stakeAmount: 60.00,
      participants: 43,
      totalParticipants: 43,
      progress: 23,
      completionStatus: 'failed',
      failedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() // 12 days ago
      // No rejectedVerification - user just stopped participating
    }
  ]

  return challenges
}

export function getDemoCreators(isAdmin: boolean = false) {
  const baseCreators = [
    {
      id: "sarah-chen",
      name: "Sarah Chen",
      username: "sarahchen",
      avatar: "/avatars/avatar-1.svg",
      bio: "Mindfulness coach helping people build sustainable meditation habits through guided challenges.",
      followers: 2847,
      challengesCreated: 23,
      successRate: 87,
      totalEarnings: 12450,
      isVerified: true,
      isFollowing: false,
      categories: ["Mindfulness", "Wellness", "Productivity"],
      recentChallenge: {
        title: "30-Day Morning Meditation",
        participants: 1247,
      },
    },
    {
      id: "mike-fitness",
      name: "Mike Rodriguez",
      username: "mikefit",
      avatar: "/avatars/avatar-2.svg",
      bio: "Personal trainer and fitness enthusiast. Creating challenges that make fitness fun and accessible.",
      followers: 1923,
      challengesCreated: 18,
      successRate: 82,
      totalEarnings: 8900,
      isVerified: false,
      isFollowing: true,
      categories: ["Fitness", "Health", "Strength"],
      recentChallenge: {
        title: "30-Day Push-up Challenge",
        participants: 892,
      },
    },
    {
      id: "lisa-productivity",
      name: "Lisa Wang",
      username: "lisawang",
      avatar: "/avatars/avatar-3.svg",
      bio: "Productivity expert and author. Helping professionals optimize their daily routines for success.",
      followers: 3421,
      challengesCreated: 31,
      successRate: 91,
      totalEarnings: 15600,
      isVerified: true,
      isFollowing: false,
      categories: ["Productivity", "Learning", "Career"],
      recentChallenge: {
        title: "Deep Work Challenge",
        participants: 1567,
      },
    },
    {
      id: "alex-nutrition",
      name: "Alex Kim",
      username: "alexnutrition",
      avatar: "/avatars/avatar-4.svg",
      bio: "Registered dietitian creating sustainable nutrition challenges for long-term health.",
      followers: 1654,
      challengesCreated: 15,
      successRate: 89,
      totalEarnings: 7800,
      isVerified: false,
      isFollowing: false,
      categories: ["Nutrition", "Health", "Cooking"],
      recentChallenge: {
        title: "Plant-Based Week",
        participants: 743,
      },
    }
  ]

  if (isAdmin) {
    return [
      ...baseCreators,
      {
        id: "jordan-mindset",
        name: "Jordan Taylor",
        username: "jordanmindset",
        avatar: "/avatars/avatar-5.svg",
        bio: "Life coach specializing in mindset transformation and personal development challenges.",
        followers: 2156,
        challengesCreated: 27,
        successRate: 85,
        totalEarnings: 11200,
        isVerified: true,
        isFollowing: false,
        categories: ["Mindset", "Personal Development", "Goals"],
        recentChallenge: {
          title: "Gratitude Journal Challenge",
          participants: 1089,
        },
      },
      {
        id: "emma-creativity",
        name: "Emma Thompson",
        username: "emmacreates",
        avatar: "/avatars/avatar-6.svg",
        bio: "Artist and creativity coach inspiring others to unlock their creative potential through daily practice.",
        followers: 1789,
        challengesCreated: 21,
        successRate: 78,
        totalEarnings: 9300,
        isVerified: false,
        isFollowing: false,
        categories: ["Creativity", "Art", "Writing"],
        recentChallenge: {
          title: "Daily Sketch Challenge",
          participants: 634,
        },
      }
    ]
  }

  return baseCreators
}

export function getDemoBrands(isAdmin: boolean = false) {
  const baseBrands = [
    {
      id: "nike-wellness",
      name: "Nike Wellness",
      logo: "/placeholder.svg?height=80&width=80",
      description: "Empowering athletes worldwide to push their limits and achieve greatness through movement.",
      industry: "Sports & Fitness",
      followers: 15420,
      challengesSponsored: 47,
      totalRewards: 145000,
      isVerified: true,
      isFollowing: false,
      categories: ["Fitness", "Running", "Training"],
      featuredChallenge: {
        title: "Nike Run Club Challenge",
        reward: 5000,
        participants: 3247,
      },
    },
    {
      id: "headspace-mindful",
      name: "Headspace",
      logo: "/placeholder.svg?height=80&width=80",
      description: "Making meditation and mindfulness accessible to everyone through guided challenges.",
      industry: "Mental Health & Wellness",
      followers: 12890,
      challengesSponsored: 32,
      totalRewards: 89000,
      isVerified: true,
      isFollowing: true,
      categories: ["Mindfulness", "Mental Health", "Wellness"],
      featuredChallenge: {
        title: "21-Day Mindfulness Journey",
        reward: 3500,
        participants: 2156,
      },
    },
    {
      id: "myfitnesspal",
      name: "MyFitnessPal",
      logo: "/placeholder.svg?height=80&width=80",
      description: "Helping millions track their nutrition and achieve their health goals through data-driven challenges.",
      industry: "Health & Nutrition",
      followers: 9876,
      challengesSponsored: 28,
      totalRewards: 67000,
      isVerified: true,
      isFollowing: false,
      categories: ["Nutrition", "Health", "Tracking"],
      featuredChallenge: {
        title: "30-Day Nutrition Tracking",
        reward: 2500,
        participants: 1834,
      },
    },
    {
      id: "duolingo-learn",
      name: "Duolingo",
      logo: "/placeholder.svg?height=80&width=80",
      description: "Making language learning fun and accessible through gamified challenges and streaks.",
      industry: "Education & Learning",
      followers: 8543,
      challengesSponsored: 24,
      totalRewards: 45000,
      isVerified: true,
      isFollowing: false,
      categories: ["Learning", "Languages", "Education"],
      featuredChallenge: {
        title: "30-Day Language Streak",
        reward: 2000,
        participants: 1567,
      },
    }
  ]

  if (isAdmin) {
    return [
      ...baseBrands,
      {
        id: "calm-meditation",
        name: "Calm",
        logo: "/placeholder.svg?height=80&width=80",
        description: "Creating peaceful moments in busy lives through meditation and sleep challenges.",
        industry: "Mental Health & Wellness",
        followers: 11234,
        challengesSponsored: 35,
        totalRewards: 78000,
        isVerified: true,
        isFollowing: false,
        categories: ["Meditation", "Sleep", "Relaxation"],
        featuredChallenge: {
          title: "Better Sleep Challenge",
          reward: 3000,
          participants: 1923,
        },
      },
      {
        id: "strava-fitness",
        name: "Strava",
        logo: "/placeholder.svg?height=80&width=80",
        description: "Connecting athletes worldwide through social fitness challenges and community motivation.",
        industry: "Sports & Fitness",
        followers: 13567,
        challengesSponsored: 41,
        totalRewards: 112000,
        isVerified: true,
        isFollowing: false,
        categories: ["Fitness", "Running", "Cycling"],
        featuredChallenge: {
          title: "Monthly Distance Challenge",
          reward: 4000,
          participants: 2789,
        },
      }
    ]
  }

  return baseBrands
}
