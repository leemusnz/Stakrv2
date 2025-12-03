"use client"

import { motion } from "framer-motion"
import { Flame, Zap } from "lucide-react"

interface StreakBadgeProps {
  currentStreak: number
  longestStreak: number
  size?: "sm" | "md" | "lg"
}

export function StreakBadge({ currentStreak, longestStreak, size = "md" }: StreakBadgeProps) {
  const isOnFire = currentStreak >= 7
  const isLegendary = currentStreak >= 30

  const sizeClasses = {
    sm: { container: "p-3", icon: "w-6 h-6", text: "text-xl" },
    md: { container: "p-4", icon: "w-8 h-8", text: "text-3xl" },
    lg: { container: "p-6", icon: "w-12 h-12", text: "text-5xl" },
  }

  const classes = sizeClasses[size]

  return (
    <div className="relative group">
      {/* Glow effect for active streaks */}
      {isOnFire && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl blur-xl opacity-50"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className={`relative ${classes.container} bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden`}>
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

        <div className="relative flex items-center gap-4">
          {/* Flame icon */}
          <motion.div
            className={`${isLegendary ? 'bg-gradient-to-br from-purple-500 to-pink-600' : isOnFire ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-[#F46036] to-[#D74E25]'} rounded-xl p-3 shadow-lg`}
            animate={isOnFire ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {isLegendary ? (
              <Zap className={`${classes.icon} text-white`} />
            ) : (
              <Flame className={`${classes.icon} text-white`} />
            )}
          </motion.div>

          {/* Streak count */}
          <div>
            <div className={`${classes.text} font-heading font-bold text-white tracking-tight flex items-baseline gap-2`}>
              {currentStreak}
              <span className="text-lg text-slate-400">day{currentStreak !== 1 ? 's' : ''}</span>
            </div>
            <p className="text-sm text-slate-400 font-body">
              Best: <span className="text-white font-medium">{longestStreak}</span>
            </p>
          </div>
        </div>

        {/* Status badge */}
        {isLegendary && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-purple-500/20 to-pink-600/20 border border-purple-400/30 rounded-lg text-xs font-bold text-purple-300">
            LEGENDARY
          </div>
        )}
        {isOnFire && !isLegendary && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-orange-500/20 to-red-600/20 border border-orange-400/30 rounded-lg text-xs font-bold text-orange-300">
            ON FIRE 🔥
          </div>
        )}
      </div>
    </div>
  )
}


