import type { User, Challenge, ActivityItem, Deadline, StatsData, ChallengeHost } from "./types"
import { Trophy, Target, Wallet, TrendingUp } from "lucide-react"

// Mock User Data
export const mockUser: User = {
  id: "user-1",
  name: "Alex Chen",
  email: "alex@example.com",
  avatar: "/placeholder.svg?height=40&width=40",
  credits: 250,
  activeStakes: 3,
  completedChallenges: 12,
  successRate: 87,
  currentStreak: 12,
  longestStreak: 28,
  trustScore: 85,
  verificationTier: "manual",
  falseClaims: 0,
  premiumSubscription: true,
  premiumExpiresAt: "2025-12-31",
  createdAt: "2023-01-15T00:00:00Z",
  updatedAt: "2024-03-15T00:00:00Z",
}

// Mock Challenge Hosts
export const mockHosts: Record<string, ChallengeHost> = {
  "sarah-chen": {
    id: "sarah-chen",
    name: "Sarah Chen",
    avatar: "/placeholder.svg?height=60&width=60",
    bio: "Mindfulness coach with 8 years experience. Helped 1000+ people build lasting meditation habits.",
    completedChallenges: 12,
    successRate: 94,
    verified: true,
  },
  "mike-fitness": {
    id: "mike-fitness",
    name: "Mike Rodriguez",
    avatar: "/placeholder.svg?height=60&width=60",
    bio: "Certified personal trainer and fitness enthusiast. Specializes in building sustainable workout habits.",
    completedChallenges: 18,
    successRate: 91,
    verified: true,
  },
}

// Mock Challenges
export const mockChallenges: Challenge[] = [
  {
    id: "morning-meditation-7day",
    title: "Morning Meditation Streak",
    description:
      "Meditate for 10 minutes every morning for 7 days straight. Build mindfulness and start your day with intention.",
    longDescription: `Transform your mornings and build unshakeable mental clarity with a 7-day meditation commitment.

**What you'll do:**
• Meditate for 10+ minutes every morning
• Complete before 10 AM in your timezone  
• Submit daily proof via photo or video
• Join our supportive community chat

**What you'll gain:**
• Reduced stress and anxiety
• Better focus throughout the day
• Improved emotional regulation
• A habit that lasts beyond 7 days

This isn't just about sitting quietly - it's about rewiring your brain for success. Every morning you show up, you're proving to yourself that you can keep commitments and prioritize your wellbeing.`,
    category: "Mindfulness",
    duration: "7 days",
    difficulty: "Easy",
    participants: 234,
    completionRate: 78,
    minStake: 10,
    maxStake: 100,
    totalPot: 18420,
    startDate: "2024-01-15",
    endDate: "2024-01-22",
    rules: [
      "Meditate for minimum 10 minutes each morning",
      "Must complete before 10 AM in your local timezone",
      "Submit proof daily (photo of meditation setup or brief video)",
      "No makeup days - consistency is key",
      "Be respectful in community discussions",
    ],
    host: mockHosts["sarah-chen"],
    proofRequirements: [
      {
        type: "photo",
        required: true,
        cameraOnly: true,
        instructions: "Take a photo of your meditation setup",
        examples: ["Meditation cushion/chair", "Quiet space", "Any props you use"],
      },
    ],
    generalInstructions: "Show your meditation space setup each morning before you begin.",
    hostContribution: 5,
    entryFeePercentage: 5,
    failedStakeCut: 20,
    status: "active",
    verificationType: "manual",
    insuranceAvailable: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
  },
  {
    id: "10k-steps-daily",
    title: "10K Steps Daily",
    description: "Walk at least 10,000 steps every single day. No excuses, no shortcuts. Your health is worth it.",
    category: "Fitness",
    duration: "14 days",
    difficulty: "Medium",
    participants: 567,
    completionRate: 72,
    minStake: 25,
    maxStake: 200,
    totalPot: 45600,
    host: mockHosts["mike-fitness"],
    progress: 65,
    isJoined: true,
    isActive: true,
    currentDay: 9,
    totalDays: 14,
    deadline: "Today, 11:59 PM",
    proofRequirements: [
      {
        type: "photo",
        required: false,
        instructions: "Screenshot of step counter app",
        examples: ["Phone health app", "Fitness tracker", "Smartwatch display"],
      },
      {
        type: "text",
        required: false,
        instructions: "Describe your walking/exercise routine today",
        examples: ["Where you walked", "How you felt", "Any challenges"],
      },
    ],
    generalInstructions: "Show proof of your daily step count.",
    hostContribution: 10,
    entryFeePercentage: 5,
    failedStakeCut: 20,
    status: "active",
    verificationType: "auto",
    insuranceAvailable: true,
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-03-10T00:00:00Z",
  },
  {
    id: "no-social-media",
    title: "No Social Media",
    description: "Complete digital detox. Delete all social media apps for 30 days and reclaim your attention.",
    category: "Digital Wellness",
    duration: "30 days",
    difficulty: "Hard",
    participants: 89,
    completionRate: 45,
    minStake: 50,
    maxStake: 500,
    totalPot: 12400,
    hostContribution: 25,
    entryFeePercentage: 5,
    failedStakeCut: 20,
    status: "active",
    verificationType: "manual",
    insuranceAvailable: true,
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-03-12T00:00:00Z",
  },
  {
    id: "read-20-pages-daily",
    title: "Read 20 Pages Daily",
    description: "Read at least 20 pages of a book every day. Expand your mind and build a consistent reading habit.",
    category: "Learning",
    duration: "21 days",
    difficulty: "Easy",
    participants: 345,
    completionRate: 83,
    minStake: 15,
    maxStake: 150,
    totalPot: 28900,
    progress: 100,
    isJoined: true,
    proofRequirements: [
      {
        type: "photo",
        required: false,
        cameraOnly: false,
        instructions: "Photo of book page with bookmark/progress",
        examples: ["Book open to current page", "Reading app screenshot", "Notes you took"],
      },
      {
        type: "text",
        required: false,
        instructions: "Write a brief summary of what you read today",
        examples: ["Key insights", "Favorite quotes", "Chapter summary"],
      },
    ],
    generalInstructions: "Prove you read at least 20 pages today.",
    hostContribution: 5,
    entryFeePercentage: 5,
    failedStakeCut: 20,
    status: "completed",
    verificationType: "manual",
    insuranceAvailable: true,
    createdAt: "2023-12-15T00:00:00Z",
    updatedAt: "2024-03-14T00:00:00Z",
  },
  {
    id: "cold-shower-challenge",
    title: "Cold Shower Challenge",
    description: "Take a cold shower every morning for 14 days. Build mental toughness and boost your energy levels.",
    category: "Wellness",
    duration: "14 days",
    difficulty: "Medium",
    participants: 156,
    completionRate: 68,
    minStake: 20,
    maxStake: 100,
    totalPot: 8900,
    progress: 85,
    isJoined: true,
    currentDay: 12,
    totalDays: 14,
    deadline: "Today, 10:00 AM",
    proofRequirements: [
      {
        type: "video",
        required: true,
        cameraOnly: true,
        instructions: "Record a 10-second video showing you turning on cold water",
        examples: ["Show the temperature dial", "Your reaction to cold water", "Steam/condensation"],
      },
    ],
    generalInstructions: "Prove you took a cold shower this morning.",
    hostContribution: 10,
    entryFeePercentage: 5,
    failedStakeCut: 20,
    status: "active",
    verificationType: "manual",
    insuranceAvailable: true,
    createdAt: "2024-02-10T00:00:00Z",
    updatedAt: "2024-03-13T00:00:00Z",
  },
  {
    id: "side-project-launch",
    title: "Launch Your Side Project",
    description: "Ship a complete side project in 30 days. No more excuses - it's time to build something real.",
    category: "Productivity",
    duration: "30 days",
    difficulty: "Hard",
    participants: 67,
    completionRate: 34,
    minStake: 100,
    maxStake: 1000,
    totalPot: 45600,
    hostContribution: 50,
    entryFeePercentage: 5,
    failedStakeCut: 20,
    status: "active",
    verificationType: "manual",
    insuranceAvailable: true,
    createdAt: "2024-02-20T00:00:00Z",
    updatedAt: "2024-03-08T00:00:00Z",
  },
]

// Mock Activity Data
export const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "completed",
    title: "Completed Morning Meditation",
    description: "7-day streak completed successfully",
    timestamp: "2 hours ago",
    amount: 85,
  },
  {
    id: "2",
    type: "verified",
    title: "Proof submitted",
    description: "10K Steps Daily - Day 9",
    timestamp: "5 hours ago",
  },
  {
    id: "3",
    type: "milestone",
    title: "Reached 75% milestone",
    description: "Cold Shower Challenge",
    timestamp: "1 day ago",
  },
  {
    id: "4",
    type: "joined",
    title: "Joined new challenge",
    description: "Read 20 Pages Daily",
    timestamp: "2 days ago",
  },
]

// Mock Deadlines
export const mockDeadlines: Deadline[] = [
  {
    id: "1",
    challengeId: "10k-steps-daily",
    challengeTitle: "10K Steps Daily",
    type: "verification",
    dueDate: "Today",
    timeLeft: "6h left",
    urgency: "high",
  },
  {
    id: "2",
    challengeId: "cold-shower-challenge",
    challengeTitle: "Cold Shower Challenge",
    type: "completion",
    dueDate: "Tomorrow",
    timeLeft: "1d left",
    urgency: "medium",
  },
]

// Mock Stats
export const mockStats: StatsData[] = [
  {
    title: "Active Challenges",
    value: 3,
    subtitle: "2 due this week",
    icon: Target,
    color: "primary",
    trend: "up",
    trendValue: "+1 this week",
  },
  {
    title: "Total Earned",
    value: "$1,247",
    subtitle: "From 12 completed",
    icon: Trophy,
    color: "success",
    trend: "up",
    trendValue: "+$180 this month",
  },
  {
    title: "Success Rate",
    value: "87%",
    subtitle: "15 of 17 completed",
    icon: TrendingUp,
    color: "secondary",
    trend: "up",
    trendValue: "+5% vs last month",
  },
  {
    title: "Credits Available",
    value: "$250",
    subtitle: "Ready to stake",
    icon: Wallet,
    color: "warning",
  },
]

// Helper functions to get specific data
export const getChallengeById = (id: string): Challenge | undefined => {
  return mockChallenges.find((challenge) => challenge.id === id)
}

export const getActiveChallenges = (): Challenge[] => {
  return mockChallenges.filter((challenge) => challenge.isJoined && challenge.isActive)
}

export const getJoinedChallenges = (): Challenge[] => {
  return mockChallenges.filter((challenge) => challenge.isJoined)
}

export const getTrendingChallenges = (): Challenge[] => {
  return mockChallenges.slice(0, 5) // First 5 as trending
}

export const getChallengesByCategory = (category: string): Challenge[] => {
  return mockChallenges.filter((challenge) => challenge.category.toLowerCase() === category.toLowerCase())
}
