/**
 * Stakr Achievement System V2 - Scalable Architecture
 * 
 * Supports thousands of achievements through:
 * - Procedural generation
 * - Template-based creation
 * - Dynamic asset loading
 * - Category-specific achievements
 * - Milestone variations
 */

import { 
  Trophy, Star, Crown, Zap, Target, Heart, Brain, Flame, Shield, Award,
  TrendingUp, Users, Clock, DollarSign, Sparkles, Gem, Rocket, Mountain,
  Sword, Medal, Flag, Gift, Lock, Unlock, CheckCircle, Circle
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

// ===== TYPES =====

export type AchievementTier = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic"

export type AchievementCategory = 
  | "milestone"           // Total XP/Level milestones
  | "challenge_count"     // Total challenges completed
  | "category_mastery"    // Category-specific (Fitness, Mindfulness, etc.)
  | "difficulty_mastery"  // Difficulty-based progression
  | "streak"             // Streak-based achievements
  | "speed"              // Fast completion achievements
  | "perfect"            // Perfect completion achievements
  | "social"             // Community/team achievements
  | "financial"          // Earnings/stakes achievements
  | "seasonal"           // Limited time events
  | "special"            // Unique/hidden achievements

export type RewardType = "badge" | "title" | "perk" | "cosmetic" | "currency" | "boost"

export interface Reward {
  type: RewardType
  name: string
  description: string
  value?: number
  duration?: number      // For temporary boosts (in days)
  imageUrl?: string
  rarity?: AchievementTier
}

export interface AchievementRequirement {
  type: "xp" | "level" | "challenges" | "category" | "difficulty" | "streak" | "speed" | "earnings" | "custom"
  value: number
  category?: string
  difficulty?: "Easy" | "Medium" | "Hard"
  metadata?: Record<string, any>
}

export interface Achievement {
  id: string
  name: string
  description: string
  category: AchievementCategory
  tier: AchievementTier
  icon: LucideIcon
  iconColor: string
  gradient: string
  glowColor: string
  
  requirements: AchievementRequirement[]
  rewards: Reward[]
  
  // Asset management
  badgeImageUrl?: string
  bannerImageUrl?: string
  
  // Metadata
  isHidden?: boolean      // Hidden until unlocked
  isSecret?: boolean      // Completely hidden until discovered
  series?: string         // Part of an achievement series
  order?: number          // Order in series
  
  // Stats
  unlockedBy?: number     // % of users who unlocked this
  firstUnlockedAt?: string
}

// ===== TIER CONFIGURATION =====

export const TIER_CONFIG = {
  common: {
    name: "Common",
    gradient: "from-slate-400 to-slate-600",
    glow: "shadow-slate-400/30",
    border: "border-slate-400/30",
    text: "text-slate-300",
    xpMultiplier: 1,
  },
  uncommon: {
    name: "Uncommon",
    gradient: "from-green-400 to-green-600",
    glow: "shadow-green-500/30",
    border: "border-green-400/30",
    text: "text-green-300",
    xpMultiplier: 1.2,
  },
  rare: {
    name: "Rare",
    gradient: "from-blue-400 to-blue-600",
    glow: "shadow-blue-500/30",
    border: "border-blue-400/30",
    text: "text-blue-300",
    xpMultiplier: 1.5,
  },
  epic: {
    name: "Epic",
    gradient: "from-purple-400 to-purple-600",
    glow: "shadow-purple-500/30",
    border: "border-purple-400/30",
    text: "text-purple-300",
    xpMultiplier: 2,
  },
  legendary: {
    name: "Legendary",
    gradient: "from-yellow-400 to-orange-600",
    glow: "shadow-yellow-500/30",
    border: "border-yellow-400/30",
    text: "text-yellow-300",
    xpMultiplier: 3,
  },
  mythic: {
    name: "Mythic",
    gradient: "from-pink-400 to-purple-600",
    glow: "shadow-pink-500/30",
    border: "border-pink-400/30",
    text: "text-pink-300",
    xpMultiplier: 5,
  },
}

// ===== XP & LEVEL SYSTEM =====

export const XP_REWARDS = {
  Easy: 50,
  Medium: 100,
  Hard: 200,
}

export const XP_BONUSES = {
  perfectCompletion: 1.5,
  firstInCategory: 1.2,
  streakBonus: {
    7: 1.1,
    14: 1.2,
    30: 1.5,
    50: 2.0,
    100: 3.0,
  },
  teamChallenge: 1.3,
  speedBonus: {
    fast: 1.2,      // Completed 20% faster than average
    veryFast: 1.5,  // Completed 50% faster than average
  },
}

export function calculateChallengeXP(
  difficulty: "Easy" | "Medium" | "Hard",
  options: {
    perfectCompletion?: boolean
    isFirstInCategory?: boolean
    currentStreak?: number
    isTeamChallenge?: boolean
    speedMultiplier?: number
  } = {}
): number {
  let xp = XP_REWARDS[difficulty]
  
  if (options.perfectCompletion) xp *= XP_BONUSES.perfectCompletion
  if (options.isFirstInCategory) xp *= XP_BONUSES.firstInCategory
  if (options.isTeamChallenge) xp *= XP_BONUSES.teamChallenge
  if (options.speedMultiplier) xp *= options.speedMultiplier
  
  if (options.currentStreak) {
    if (options.currentStreak >= 100) xp *= XP_BONUSES.streakBonus[100]
    else if (options.currentStreak >= 50) xp *= XP_BONUSES.streakBonus[50]
    else if (options.currentStreak >= 30) xp *= XP_BONUSES.streakBonus[30]
    else if (options.currentStreak >= 14) xp *= XP_BONUSES.streakBonus[14]
    else if (options.currentStreak >= 7) xp *= XP_BONUSES.streakBonus[7]
  }
  
  return Math.round(xp)
}

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100))
}

export function getXPForLevel(level: number): number {
  return level * level * 100
}

// ===== ACHIEVEMENT TEMPLATES =====

// Template for generating milestone achievements
function generateMilestoneAchievements(): Achievement[] {
  const milestones = [
    { level: 1, xp: 100, tier: "common" as AchievementTier, title: "Novice", credits: 50 },
    { level: 5, xp: 2500, tier: "common" as AchievementTier, title: "Challenger", credits: 100 },
    { level: 10, xp: 10000, tier: "uncommon" as AchievementTier, title: "Dedicated", credits: 250 },
    { level: 15, xp: 22500, tier: "uncommon" as AchievementTier, title: "Committed", credits: 500 },
    { level: 20, xp: 40000, tier: "rare" as AchievementTier, title: "Experienced", credits: 750 },
    { level: 25, xp: 62500, tier: "rare" as AchievementTier, title: "Veteran", credits: 1000 },
    { level: 30, xp: 90000, tier: "epic" as AchievementTier, title: "Expert", credits: 1500 },
    { level: 40, xp: 160000, tier: "epic" as AchievementTier, title: "Master", credits: 2500 },
    { level: 50, xp: 250000, tier: "legendary" as AchievementTier, title: "Legend", credits: 5000 },
    { level: 75, xp: 562500, tier: "legendary" as AchievementTier, title: "Hero", credits: 10000 },
    { level: 100, xp: 1000000, tier: "mythic" as AchievementTier, title: "Mythic", credits: 25000 },
  ]

  return milestones.map(m => ({
    id: `milestone_level_${m.level}`,
    name: `Level ${m.level} - ${m.title}`,
    description: `Reach Level ${m.level} and earn the "${m.title}" title`,
    category: "milestone",
    tier: m.tier,
    icon: m.level >= 100 ? Zap : m.level >= 50 ? Crown : m.level >= 25 ? Trophy : Star,
    iconColor: TIER_CONFIG[m.tier].text,
    gradient: TIER_CONFIG[m.tier].gradient,
    glowColor: TIER_CONFIG[m.tier].glow,
    requirements: [{ type: "xp", value: m.xp }],
    rewards: [
      { type: "title", name: m.title, description: `Display "${m.title}" on your profile` },
      { type: "currency", name: "Milestone Bonus", description: `${m.credits} bonus credits`, value: m.credits },
      ...(m.level >= 25 ? [{ type: "perk" as RewardType, name: "Fee Reduction", description: `${Math.min(50, m.level - 20)}% fee reduction` }] : []),
    ],
    badgeImageUrl: `/achievements/milestone/level-${m.level}.png`,
  }))
}

// Template for challenge count achievements
function generateChallengeCountAchievements(): Achievement[] {
  const counts = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
  const tiers: AchievementTier[] = ["common", "common", "uncommon", "uncommon", "rare", "rare", "epic", "epic", "legendary", "legendary", "mythic", "mythic"]
  
  return counts.map((count, index) => ({
    id: `challenges_completed_${count}`,
    name: `${count} Challenge${count > 1 ? 's' : ''} Completed`,
    description: `Complete ${count} challenge${count > 1 ? 's' : ''} of any type`,
    category: "challenge_count",
    tier: tiers[index],
    icon: count >= 1000 ? Rocket : count >= 100 ? Mountain : Target,
    iconColor: TIER_CONFIG[tiers[index]].text,
    gradient: TIER_CONFIG[tiers[index]].gradient,
    glowColor: TIER_CONFIG[tiers[index]].glow,
    requirements: [{ type: "challenges", value: count }],
    rewards: [
      { type: "badge", name: `${count} Challenges Badge`, description: `Completed ${count} challenges` },
      { type: "currency", name: "Completion Bonus", description: `${count * 10} bonus credits`, value: count * 10 },
    ],
    badgeImageUrl: `/achievements/challenges/count-${count}.png`,
  }))
}

// Template for category mastery achievements
function generateCategoryAchievements(): Achievement[] {
  const categories = [
    { id: "fitness", name: "Fitness", icon: Heart, color: "text-red-400" },
    { id: "mindfulness", name: "Mindfulness", icon: Brain, color: "text-purple-400" },
    { id: "productivity", name: "Productivity", icon: Zap, color: "text-blue-400" },
    { id: "learning", name: "Learning", icon: Brain, color: "text-green-400" },
    { id: "wellness", name: "Wellness", icon: Sparkles, color: "text-pink-400" },
    { id: "digital-wellness", name: "Digital Wellness", icon: Shield, color: "text-cyan-400" },
  ]

  const milestones = [
    { count: 1, tier: "common" as AchievementTier, suffix: "Beginner" },
    { count: 5, tier: "uncommon" as AchievementTier, suffix: "Enthusiast" },
    { count: 10, tier: "rare" as AchievementTier, suffix: "Specialist" },
    { count: 25, tier: "epic" as AchievementTier, suffix: "Expert" },
    { count: 50, tier: "legendary" as AchievementTier, suffix: "Master" },
    { count: 100, tier: "mythic" as AchievementTier, suffix: "Grandmaster" },
  ]

  const achievements: Achievement[] = []
  
  for (const category of categories) {
    for (const milestone of milestones) {
      achievements.push({
        id: `category_${category.id}_${milestone.count}`,
        name: `${category.name} ${milestone.suffix}`,
        description: `Complete ${milestone.count} ${category.name} challenge${milestone.count > 1 ? 's' : ''}`,
        category: "category_mastery",
        tier: milestone.tier,
        icon: category.icon,
        iconColor: category.color,
        gradient: TIER_CONFIG[milestone.tier].gradient,
        glowColor: TIER_CONFIG[milestone.tier].glow,
        requirements: [{ type: "category", value: milestone.count, category: category.id }],
        rewards: [
          { type: "badge", name: `${category.name} ${milestone.suffix} Badge`, description: `Master of ${category.name}` },
          { type: "title", name: `${category.name} ${milestone.suffix}`, description: `Display on your profile` },
          ...(milestone.count >= 25 ? [{ type: "boost" as RewardType, name: `${category.name} XP Boost`, description: `+${milestone.count}% XP in ${category.name} challenges`, duration: 30 }] : []),
        ],
        series: `${category.id}_mastery`,
        order: milestone.count,
        badgeImageUrl: `/achievements/categories/${category.id}/${milestone.count}.png`,
      })
    }
  }
  
  return achievements
}

// Template for difficulty mastery achievements
function generateDifficultyAchievements(): Achievement[] {
  const difficulties = [
    { id: "Easy", name: "Easy", icon: Target, color: "text-green-400" },
    { id: "Medium", name: "Medium", icon: Award, color: "text-blue-400" },
    { id: "Hard", name: "Hard", icon: Flame, color: "text-red-400" },
  ]

  const milestones = [
    { count: 1, tier: "common" as AchievementTier },
    { count: 5, tier: "uncommon" as AchievementTier },
    { count: 10, tier: "rare" as AchievementTier },
    { count: 25, tier: "epic" as AchievementTier },
    { count: 50, tier: "legendary" as AchievementTier },
    { count: 100, tier: "mythic" as AchievementTier },
  ]

  const achievements: Achievement[] = []
  
  for (const difficulty of difficulties) {
    for (const milestone of milestones) {
      achievements.push({
        id: `difficulty_${difficulty.id.toLowerCase()}_${milestone.count}`,
        name: `${difficulty.name} ${milestone.count}x`,
        description: `Complete ${milestone.count} ${difficulty.name} challenge${milestone.count > 1 ? 's' : ''}`,
        category: "difficulty_mastery",
        tier: milestone.tier,
        icon: difficulty.icon,
        iconColor: difficulty.color,
        gradient: TIER_CONFIG[milestone.tier].gradient,
        glowColor: TIER_CONFIG[milestone.tier].glow,
        requirements: [{ type: "difficulty", value: milestone.count, difficulty: difficulty.id as any }],
        rewards: [
          { type: "badge", name: `${difficulty.name} x${milestone.count}`, description: `Completed ${milestone.count} ${difficulty.name} challenges` },
          ...(milestone.count >= 10 ? [{ type: "boost" as RewardType, name: `${difficulty.name} Boost`, description: `+${milestone.count * 2}% XP on ${difficulty.name} challenges`, duration: 30 }] : []),
        ],
        series: `${difficulty.id.toLowerCase()}_mastery`,
        order: milestone.count,
        badgeImageUrl: `/achievements/difficulty/${difficulty.id.toLowerCase()}/${milestone.count}.png`,
      })
    }
  }
  
  return achievements
}

// Template for streak achievements
function generateStreakAchievements(): Achievement[] {
  const streaks = [
    { days: 3, tier: "common" as AchievementTier, name: "Getting Started" },
    { days: 7, tier: "uncommon" as AchievementTier, name: "Week Warrior" },
    { days: 14, tier: "rare" as AchievementTier, name: "Two Week Champion" },
    { days: 30, tier: "epic" as AchievementTier, name: "Month Master" },
    { days: 50, tier: "epic" as AchievementTier, name: "Unstoppable" },
    { days: 100, tier: "legendary" as AchievementTier, name: "Centurion" },
    { days: 365, tier: "mythic" as AchievementTier, name: "Year Legend" },
  ]

  return streaks.map(streak => ({
    id: `streak_${streak.days}`,
    name: `${streak.days}-Day Streak`,
    description: `Maintain a ${streak.days}-day challenge streak`,
    category: "streak",
    tier: streak.tier,
    icon: streak.days >= 100 ? Zap : Flame,
    iconColor: TIER_CONFIG[streak.tier].text,
    gradient: TIER_CONFIG[streak.tier].gradient,
    glowColor: TIER_CONFIG[streak.tier].glow,
    requirements: [{ type: "streak", value: streak.days }],
    rewards: [
      { type: "badge", name: `${streak.days}-Day Streak Badge`, description: streak.name },
      { type: "title", name: streak.name, description: "Display on your profile" },
      { type: "boost", name: "Streak Bonus", description: `+${Math.min(100, streak.days)}% XP while on streak`, duration: 999 },
      { type: "currency", name: "Streak Reward", description: `${streak.days * 50} bonus credits`, value: streak.days * 50 },
    ],
    badgeImageUrl: `/achievements/streaks/${streak.days}-days.png`,
  }))
}

// ===== MAIN ACHIEVEMENT REGISTRY =====

export function getAllAchievements(): Achievement[] {
  return [
    ...generateMilestoneAchievements(),
    ...generateChallengeCountAchievements(),
    ...generateCategoryAchievements(),
    ...generateDifficultyAchievements(),
    ...generateStreakAchievements(),
    // Add more generators here as needed
  ]
}

// ===== HELPER FUNCTIONS =====

export function checkAchievementUnlocked(
  achievement: Achievement,
  userStats: {
    xp: number
    level: number
    challengesCompleted: number
    challengesByDifficulty: { Easy: number; Medium: number; Hard: number }
    challengesByCategory: Record<string, number>
    currentStreak: number
    longestStreak: number
    totalEarnings: number
  }
): { unlocked: boolean; progress: number; maxProgress: number } {
  for (const req of achievement.requirements) {
    switch (req.type) {
      case "xp":
        return {
          unlocked: userStats.xp >= req.value,
          progress: Math.min(userStats.xp, req.value),
          maxProgress: req.value,
        }
      
      case "level":
        return {
          unlocked: userStats.level >= req.value,
          progress: Math.min(userStats.level, req.value),
          maxProgress: req.value,
        }
      
      case "challenges":
        return {
          unlocked: userStats.challengesCompleted >= req.value,
          progress: Math.min(userStats.challengesCompleted, req.value),
          maxProgress: req.value,
        }
      
      case "difficulty":
        if (req.difficulty) {
          const completed = userStats.challengesByDifficulty[req.difficulty] || 0
          return {
            unlocked: completed >= req.value,
            progress: Math.min(completed, req.value),
            maxProgress: req.value,
          }
        }
        break
      
      case "category":
        if (req.category) {
          const completed = userStats.challengesByCategory[req.category] || 0
          return {
            unlocked: completed >= req.value,
            progress: Math.min(completed, req.value),
            maxProgress: req.value,
          }
        }
        break
      
      case "streak":
        return {
          unlocked: userStats.currentStreak >= req.value,
          progress: Math.min(userStats.currentStreak, req.value),
          maxProgress: req.value,
        }
    }
  }
  
  return { unlocked: false, progress: 0, maxProgress: 1 }
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return getAllAchievements().filter(a => a.category === category)
}

export function getAchievementsByTier(tier: AchievementTier): Achievement[] {
  return getAllAchievements().filter(a => a.tier === tier)
}

export function getAchievementSeries(seriesName: string): Achievement[] {
  return getAllAchievements()
    .filter(a => a.series === seriesName)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
}

// Asset URL generation (for dynamic loading)
export function getAchievementAssetUrl(achievement: Achievement, type: "badge" | "banner" | "icon"): string {
  if (type === "badge" && achievement.badgeImageUrl) {
    return achievement.badgeImageUrl
  }
  if (type === "banner" && achievement.bannerImageUrl) {
    return achievement.bannerImageUrl
  }
  
  // Fallback to generated URL
  return `/achievements/${achievement.category}/${achievement.id}-${type}.png`
}


