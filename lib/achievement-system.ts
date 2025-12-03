/**
 * Stakr Achievement & Reward System
 * 
 * XP is earned by completing challenges:
 * - Easy: 50 XP
 * - Medium: 100 XP  
 * - Hard: 200 XP
 * - Bonus XP for streaks, perfect completion, etc.
 * 
 * Achievements unlock at XP milestones and grant rewards
 */

import { Trophy, Star, Crown, Zap, Target, Heart, Brain, Flame, Shield, Award } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type AchievementCategory = 
  | "milestone"      // Total XP milestones
  | "category"       // Category-specific (Fitness, Mindfulness, etc.)
  | "difficulty"     // Difficulty-based (Easy Master, Hard Conqueror)
  | "streak"         // Streak-based achievements
  | "social"         // Community achievements
  | "special"        // Limited time / special events

export type RewardType = 
  | "badge"          // Visual badge on profile
  | "title"          // Profile title (e.g., "Fitness Guru")
  | "perk"           // Gameplay perk (e.g., reduced fees)
  | "cosmetic"       // Avatar frame, profile theme
  | "currency"       // Bonus credits

export interface Reward {
  type: RewardType
  name: string
  description: string
  value?: number     // For currency rewards
  imageUrl?: string  // For cosmetics
}

export interface Achievement {
  id: string
  name: string
  description: string
  category: AchievementCategory
  icon: LucideIcon
  
  // Unlock requirements
  xpRequired?: number
  challengesRequired?: number
  categoryRequired?: string
  difficultyRequired?: "Easy" | "Medium" | "Hard"
  streakRequired?: number
  
  // Rewards
  rewards: Reward[]
  
  // Visual
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond"
  color: string
  gradient: string
}

// XP earned per challenge difficulty
export const XP_REWARDS = {
  Easy: 50,
  Medium: 100,
  Hard: 200,
}

// Bonus XP multipliers
export const XP_BONUSES = {
  perfectCompletion: 1.5,      // All proofs submitted on time
  firstInCategory: 1.2,        // First challenge in a category
  streakBonus: {
    7: 1.1,                    // 7-day streak: +10%
    14: 1.2,                   // 14-day streak: +20%
    30: 1.5,                   // 30-day streak: +50%
  },
  teamChallenge: 1.3,          // Team challenges
}

// Calculate XP for a completed challenge
export function calculateChallengeXP(
  difficulty: "Easy" | "Medium" | "Hard",
  options: {
    perfectCompletion?: boolean
    isFirstInCategory?: boolean
    currentStreak?: number
    isTeamChallenge?: boolean
  } = {}
): number {
  let xp = XP_REWARDS[difficulty]
  
  if (options.perfectCompletion) {
    xp *= XP_BONUSES.perfectCompletion
  }
  
  if (options.isFirstInCategory) {
    xp *= XP_BONUSES.firstInCategory
  }
  
  if (options.currentStreak) {
    if (options.currentStreak >= 30) {
      xp *= XP_BONUSES.streakBonus[30]
    } else if (options.currentStreak >= 14) {
      xp *= XP_BONUSES.streakBonus[14]
    } else if (options.currentStreak >= 7) {
      xp *= XP_BONUSES.streakBonus[7]
    }
  }
  
  if (options.isTeamChallenge) {
    xp *= XP_BONUSES.teamChallenge
  }
  
  return Math.round(xp)
}

// Level calculation
export function calculateLevel(xp: number): number {
  // Level formula: Level = floor(sqrt(XP / 100))
  // This means: Level 1 = 100 XP, Level 2 = 400 XP, Level 3 = 900 XP, etc.
  return Math.floor(Math.sqrt(xp / 100))
}

export function getXPForLevel(level: number): number {
  return level * level * 100
}

export function getXPForNextLevel(currentXP: number): number {
  const currentLevel = calculateLevel(currentXP)
  return getXPForLevel(currentLevel + 1)
}

// Achievement definitions
export const ACHIEVEMENTS: Achievement[] = [
  // ===== MILESTONE ACHIEVEMENTS =====
  {
    id: "first_steps",
    name: "First Steps",
    description: "Complete your first challenge",
    category: "milestone",
    icon: Target,
    xpRequired: 50,
    tier: "bronze",
    color: "text-orange-400",
    gradient: "from-orange-400 to-orange-600",
    rewards: [
      { type: "badge", name: "Beginner Badge", description: "Shows you've started your journey" },
      { type: "currency", name: "Welcome Bonus", description: "50 bonus credits", value: 50 },
    ],
  },
  {
    id: "getting_started",
    name: "Getting Started",
    description: "Reach Level 5",
    category: "milestone",
    icon: Star,
    xpRequired: 2500, // Level 5 = 25 * 100
    tier: "bronze",
    color: "text-orange-400",
    gradient: "from-orange-400 to-orange-600",
    rewards: [
      { type: "title", name: "Challenger", description: "Display 'Challenger' on your profile" },
      { type: "currency", name: "Progress Bonus", description: "100 bonus credits", value: 100 },
    ],
  },
  {
    id: "committed",
    name: "Committed",
    description: "Reach Level 10",
    category: "milestone",
    icon: Trophy,
    xpRequired: 10000, // Level 10
    tier: "silver",
    color: "text-slate-300",
    gradient: "from-slate-300 to-slate-500",
    rewards: [
      { type: "badge", name: "Silver Trophy", description: "A prestigious silver trophy" },
      { type: "title", name: "Dedicated", description: "Display 'Dedicated' on your profile" },
      { type: "perk", name: "Fee Reduction", description: "5% reduction on challenge entry fees" },
    ],
  },
  {
    id: "veteran",
    name: "Veteran",
    description: "Reach Level 25",
    category: "milestone",
    icon: Crown,
    xpRequired: 62500, // Level 25
    tier: "gold",
    color: "text-yellow-400",
    gradient: "from-yellow-400 to-yellow-600",
    rewards: [
      { type: "badge", name: "Gold Crown", description: "A majestic gold crown" },
      { type: "title", name: "Veteran", description: "Display 'Veteran' on your profile" },
      { type: "perk", name: "Enhanced Rewards", description: "10% bonus on all challenge rewards" },
      { type: "currency", name: "Veteran Bonus", description: "500 bonus credits", value: 500 },
    ],
  },
  {
    id: "legend",
    name: "Legend",
    description: "Reach Level 50",
    category: "milestone",
    icon: Crown,
    xpRequired: 250000, // Level 50
    tier: "platinum",
    color: "text-cyan-400",
    gradient: "from-cyan-400 to-blue-600",
    rewards: [
      { type: "badge", name: "Platinum Crown", description: "An elite platinum crown" },
      { type: "title", name: "Legend", description: "Display 'Legend' on your profile" },
      { type: "perk", name: "VIP Status", description: "Priority support and exclusive challenges" },
      { type: "cosmetic", name: "Legendary Frame", description: "Exclusive avatar frame" },
    ],
  },
  {
    id: "mythic",
    name: "Mythic",
    description: "Reach Level 100",
    category: "milestone",
    icon: Zap,
    xpRequired: 1000000, // Level 100
    tier: "diamond",
    color: "text-purple-400",
    gradient: "from-purple-400 to-pink-600",
    rewards: [
      { type: "badge", name: "Diamond Emblem", description: "The ultimate achievement badge" },
      { type: "title", name: "Mythic", description: "Display 'Mythic' on your profile" },
      { type: "perk", name: "Mythic Benefits", description: "Maximum rewards and zero fees" },
      { type: "cosmetic", name: "Mythic Aura", description: "Animated profile aura effect" },
      { type: "currency", name: "Mythic Reward", description: "5000 bonus credits", value: 5000 },
    ],
  },

  // ===== DIFFICULTY ACHIEVEMENTS =====
  {
    id: "easy_master",
    name: "Easy Master",
    description: "Complete 10 Easy challenges",
    category: "difficulty",
    icon: Target,
    challengesRequired: 10,
    difficultyRequired: "Easy",
    tier: "bronze",
    color: "text-green-400",
    gradient: "from-green-400 to-green-600",
    rewards: [
      { type: "badge", name: "Easy Master Badge", description: "Master of easy challenges" },
      { type: "title", name: "Starter", description: "Display 'Starter' on your profile" },
    ],
  },
  {
    id: "medium_conqueror",
    name: "Medium Conqueror",
    description: "Complete 10 Medium challenges",
    category: "difficulty",
    icon: Award,
    challengesRequired: 10,
    difficultyRequired: "Medium",
    tier: "silver",
    color: "text-blue-400",
    gradient: "from-blue-400 to-blue-600",
    rewards: [
      { type: "badge", name: "Medium Conqueror Badge", description: "Conqueror of medium challenges" },
      { type: "title", name: "Achiever", description: "Display 'Achiever' on your profile" },
      { type: "currency", name: "Conqueror Bonus", description: "200 bonus credits", value: 200 },
    ],
  },
  {
    id: "hard_destroyer",
    name: "Hard Destroyer",
    description: "Complete 10 Hard challenges",
    category: "difficulty",
    icon: Flame,
    challengesRequired: 10,
    difficultyRequired: "Hard",
    tier: "gold",
    color: "text-red-400",
    gradient: "from-red-400 to-red-600",
    rewards: [
      { type: "badge", name: "Hard Destroyer Badge", description: "Destroyer of hard challenges" },
      { type: "title", name: "Elite", description: "Display 'Elite' on your profile" },
      { type: "perk", name: "Hard Challenge Boost", description: "15% bonus XP on hard challenges" },
      { type: "currency", name: "Elite Bonus", description: "500 bonus credits", value: 500 },
    ],
  },

  // ===== CATEGORY ACHIEVEMENTS =====
  {
    id: "fitness_enthusiast",
    name: "Fitness Enthusiast",
    description: "Complete 5 Fitness challenges",
    category: "category",
    icon: Heart,
    challengesRequired: 5,
    categoryRequired: "fitness",
    tier: "bronze",
    color: "text-red-400",
    gradient: "from-red-400 to-red-600",
    rewards: [
      { type: "badge", name: "Fitness Badge", description: "Shows your dedication to fitness" },
      { type: "title", name: "Fitness Enthusiast", description: "Display on your profile" },
    ],
  },
  {
    id: "mindfulness_master",
    name: "Mindfulness Master",
    description: "Complete 5 Mindfulness challenges",
    category: "category",
    icon: Brain,
    challengesRequired: 5,
    categoryRequired: "mindfulness",
    tier: "bronze",
    color: "text-purple-400",
    gradient: "from-purple-400 to-purple-600",
    rewards: [
      { type: "badge", name: "Mindfulness Badge", description: "Shows your inner peace" },
      { type: "title", name: "Zen Master", description: "Display on your profile" },
    ],
  },

  // ===== STREAK ACHIEVEMENTS =====
  {
    id: "week_warrior",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    category: "streak",
    icon: Flame,
    streakRequired: 7,
    tier: "silver",
    color: "text-orange-400",
    gradient: "from-orange-400 to-red-600",
    rewards: [
      { type: "badge", name: "Flame Badge", description: "You're on fire!" },
      { type: "title", name: "Consistent", description: "Display on your profile" },
      { type: "perk", name: "Streak Bonus", description: "10% XP bonus while on streak" },
    ],
  },
  {
    id: "month_champion",
    name: "Month Champion",
    description: "Maintain a 30-day streak",
    category: "streak",
    icon: Crown,
    streakRequired: 30,
    tier: "gold",
    color: "text-yellow-400",
    gradient: "from-yellow-400 to-orange-600",
    rewards: [
      { type: "badge", name: "Champion Badge", description: "30 days of dedication" },
      { type: "title", name: "Champion", description: "Display on your profile" },
      { type: "perk", name: "Champion Boost", description: "50% XP bonus while on 30+ day streak" },
      { type: "currency", name: "Champion Reward", description: "1000 bonus credits", value: 1000 },
    ],
  },
  {
    id: "unstoppable",
    name: "Unstoppable",
    description: "Maintain a 100-day streak",
    category: "streak",
    icon: Zap,
    streakRequired: 100,
    tier: "diamond",
    color: "text-purple-400",
    gradient: "from-purple-400 to-pink-600",
    rewards: [
      { type: "badge", name: "Unstoppable Badge", description: "Nothing can stop you" },
      { type: "title", name: "Unstoppable", description: "Display on your profile" },
      { type: "perk", name: "Unstoppable Power", description: "Double XP on all challenges" },
      { type: "cosmetic", name: "Lightning Aura", description: "Animated lightning effect" },
      { type: "currency", name: "Unstoppable Reward", description: "5000 bonus credits", value: 5000 },
    ],
  },
]

// Helper functions
export function getAchievementProgress(
  achievement: Achievement,
  userStats: {
    xp: number
    challengesCompleted: number
    challengesByDifficulty: { Easy: number; Medium: number; Hard: number }
    challengesByCategory: Record<string, number>
    currentStreak: number
  }
): { unlocked: boolean; progress: number; maxProgress: number } {
  // XP-based achievements
  if (achievement.xpRequired) {
    return {
      unlocked: userStats.xp >= achievement.xpRequired,
      progress: Math.min(userStats.xp, achievement.xpRequired),
      maxProgress: achievement.xpRequired,
    }
  }

  // Difficulty-based achievements
  if (achievement.difficultyRequired && achievement.challengesRequired) {
    const completed = userStats.challengesByDifficulty[achievement.difficultyRequired] || 0
    return {
      unlocked: completed >= achievement.challengesRequired,
      progress: Math.min(completed, achievement.challengesRequired),
      maxProgress: achievement.challengesRequired,
    }
  }

  // Category-based achievements
  if (achievement.categoryRequired && achievement.challengesRequired) {
    const completed = userStats.challengesByCategory[achievement.categoryRequired] || 0
    return {
      unlocked: completed >= achievement.challengesRequired,
      progress: Math.min(completed, achievement.challengesRequired),
      maxProgress: achievement.challengesRequired,
    }
  }

  // Streak-based achievements
  if (achievement.streakRequired) {
    return {
      unlocked: userStats.currentStreak >= achievement.streakRequired,
      progress: Math.min(userStats.currentStreak, achievement.streakRequired),
      maxProgress: achievement.streakRequired,
    }
  }

  return { unlocked: false, progress: 0, maxProgress: 1 }
}

export function getUnlockedAchievements(userStats: {
  xp: number
  challengesCompleted: number
  challengesByDifficulty: { Easy: number; Medium: number; Hard: number }
  challengesByCategory: Record<string, number>
  currentStreak: number
}): Achievement[] {
  return ACHIEVEMENTS.filter(achievement => {
    const { unlocked } = getAchievementProgress(achievement, userStats)
    return unlocked
  })
}

export function getNextAchievements(userStats: {
  xp: number
  challengesCompleted: number
  challengesByDifficulty: { Easy: number; Medium: number; Hard: number }
  challengesByCategory: Record<string, number>
  currentStreak: number
}, limit: number = 3): Achievement[] {
  return ACHIEVEMENTS
    .map(achievement => ({
      achievement,
      ...getAchievementProgress(achievement, userStats),
    }))
    .filter(item => !item.unlocked && item.progress > 0)
    .sort((a, b) => (b.progress / b.maxProgress) - (a.progress / a.maxProgress))
    .slice(0, limit)
    .map(item => item.achievement)
}


