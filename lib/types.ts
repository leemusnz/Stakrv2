// Core data types for the entire app
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  credits: number
  activeStakes: number
  completedChallenges: number
  successRate: number
  currentStreak: number
  longestStreak: number
}

export interface ProofRequirement {
  type: "photo" | "video" | "file" | "text"
  required: boolean
  cameraOnly?: boolean
  instructions: string
  examples?: string[]
}

export interface Challenge {
  id: string
  title: string
  description: string
  longDescription?: string
  category: string
  duration: string
  difficulty: "Easy" | "Medium" | "Hard"
  participants: number
  completionRate: number
  minStake: number
  maxStake: number
  totalPot: number
  startDate?: string
  endDate?: string
  rules?: string[]
  host?: ChallengeHost
  isJoined?: boolean
  isActive?: boolean
  progress?: number
  currentDay?: number
  totalDays?: number
  deadline?: string
  proofRequirements?: ProofRequirement[]
  generalInstructions?: string
  isOverdue?: boolean
}

export interface ChallengeHost {
  id: string
  name: string
  avatar: string
  bio: string
  completedChallenges: number
  successRate: number
  verified: boolean
}

export interface ActivityItem {
  id: string
  type: "joined" | "completed" | "verified" | "milestone" | "earned"
  title: string
  description: string
  timestamp: string
  amount?: number
  challenge?: string
}

export interface Deadline {
  id: string
  challengeTitle: string
  type: "verification" | "completion" | "milestone"
  dueDate: string
  timeLeft: string
  urgency: "high" | "medium" | "low"
}

export interface StatsData {
  title: string
  value: string | number
  subtitle?: string
  icon: any // LucideIcon type
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  color?: "primary" | "secondary" | "success" | "warning"
}

export interface ProofSubmission {
  type: string
  file?: File
  text?: string
  description: string
}
