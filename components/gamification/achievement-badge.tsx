"use client"

import { motion } from "framer-motion"
import { Trophy, Star, Award, Crown, Shield, Zap } from "lucide-react"
import { LucideIcon } from "lucide-react"

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum" | "diamond"

interface Achievement {
  id: string
  name: string
  description: string
  tier: AchievementTier
  icon: LucideIcon
  unlocked: boolean
  progress?: number
  maxProgress?: number
  unlockedAt?: string
}

const tierConfig = {
  bronze: {
    gradient: "from-orange-400 to-orange-600",
    glow: "shadow-orange-500/30",
    border: "border-orange-400/30",
    text: "text-orange-300",
  },
  silver: {
    gradient: "from-slate-300 to-slate-500",
    glow: "shadow-slate-400/30",
    border: "border-slate-300/30",
    text: "text-slate-200",
  },
  gold: {
    gradient: "from-yellow-400 to-yellow-600",
    glow: "shadow-yellow-500/30",
    border: "border-yellow-400/30",
    text: "text-yellow-300",
  },
  platinum: {
    gradient: "from-cyan-400 to-blue-600",
    glow: "shadow-cyan-500/30",
    border: "border-cyan-400/30",
    text: "text-cyan-300",
  },
  diamond: {
    gradient: "from-purple-400 to-pink-600",
    glow: "shadow-purple-500/30",
    border: "border-purple-400/30",
    text: "text-purple-300",
  },
}

interface AchievementBadgeProps {
  achievement: Achievement
  size?: "sm" | "md" | "lg"
  showAnimation?: boolean
}

export function AchievementBadge({ achievement, size = "md", showAnimation = false }: AchievementBadgeProps) {
  const Icon = achievement.icon
  const config = tierConfig[achievement.tier]

  const sizeClasses = {
    sm: { container: "w-16 h-16", icon: "w-6 h-6", text: "text-xs" },
    md: { container: "w-24 h-24", icon: "w-10 h-10", text: "text-sm" },
    lg: { container: "w-32 h-32", icon: "w-16 h-16", text: "text-base" },
  }

  const classes = sizeClasses[size]

  return (
    <motion.div
      className="relative group"
      initial={showAnimation ? { scale: 0, rotate: -180, opacity: 0 } : false}
      animate={showAnimation ? { scale: 1, rotate: 0, opacity: 1 } : false}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {/* Glow effect */}
      {achievement.unlocked && (
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${config.gradient} rounded-full blur-xl ${config.glow} opacity-50`}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Badge */}
      <div
        className={`relative ${classes.container} ${achievement.unlocked ? `bg-gradient-to-br ${config.gradient}` : 'bg-black/40 backdrop-blur-sm'} rounded-full flex items-center justify-center border-2 ${achievement.unlocked ? config.border : 'border-white/10'} ${achievement.unlocked ? config.glow : ''} shadow-lg transition-all duration-300 ${achievement.unlocked ? 'group-hover:scale-110' : 'opacity-50'}`}
      >
        <Icon className={`${classes.icon} ${achievement.unlocked ? 'text-white' : 'text-slate-500'}`} />
      </div>

      {/* Unlock animation sparkles */}
      {showAnimation && achievement.unlocked && (
        <>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2"
              initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
              animate={{
                scale: [0, 1, 0],
                x: Math.cos((i * Math.PI * 2) / 8) * 50,
                y: Math.sin((i * Math.PI * 2) / 8) * 50,
                opacity: [1, 1, 0],
              }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            </motion.div>
          ))}
        </>
      )}
    </motion.div>
  )
}

interface AchievementCardProps {
  achievement: Achievement
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const config = tierConfig[achievement.tier]

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
      
      <div className={`relative p-4 bg-black/40 backdrop-blur-2xl border ${achievement.unlocked ? config.border : 'border-white/10'} rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${achievement.unlocked ? 'group-hover:scale-[1.02]' : 'opacity-75'}`}>
        {/* Shimmer effect */}
        {achievement.unlocked && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        )}

        <div className="relative flex items-center gap-4">
          <AchievementBadge achievement={achievement} size="sm" />
          
          <div className="flex-1">
            <h4 className={`font-heading font-bold ${achievement.unlocked ? 'text-white' : 'text-slate-400'}`}>
              {achievement.name}
            </h4>
            <p className="text-sm text-slate-400 font-body mt-0.5">
              {achievement.description}
            </p>

            {/* Progress bar for locked achievements */}
            {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress !== undefined && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Progress</span>
                  <span>{achievement.progress} / {achievement.maxProgress}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${config.gradient} rounded-full transition-all duration-500`}
                    style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Unlock date for unlocked achievements */}
            {achievement.unlocked && achievement.unlockedAt && (
              <p className="text-xs text-slate-500 font-body mt-1">
                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Tier badge */}
          <div className={`px-2 py-1 bg-gradient-to-r ${config.gradient} rounded-lg text-xs font-bold text-white uppercase`}>
            {achievement.tier}
          </div>
        </div>
      </div>
    </div>
  )
}


