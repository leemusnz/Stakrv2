"use client"

import { motion } from "framer-motion"
import { Trophy, Zap, Star } from "lucide-react"

interface XPBadgeProps {
  xp: number
  level: number
  showAnimation?: boolean
  size?: "sm" | "md" | "lg"
}

export function XPBadge({ xp, level, showAnimation = false, size = "md" }: XPBadgeProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
  }

  return (
    <motion.div
      className="relative group"
      initial={showAnimation ? { scale: 0, rotate: -180 } : false}
      animate={showAnimation ? { scale: 1, rotate: 0 } : false}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F46036] to-[#D74E25] rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity animate-pulse"></div>
      
      {/* Badge */}
      <div className={`relative ${sizeClasses[size]} bg-gradient-to-br from-[#F46036] to-[#D74E25] rounded-full flex items-center justify-center text-white font-heading font-bold shadow-lg shadow-orange-500/30 border-2 border-orange-300/30`}>
        {level}
      </div>

      {/* Sparkle effect */}
      {showAnimation && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 2, opacity: [0, 1, 0] }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
        </motion.div>
      )}
    </motion.div>
  )
}

interface XPBarProps {
  currentXP: number
  xpForNextLevel: number
  level: number
  showLabel?: boolean
}

export function XPBar({ currentXP, xpForNextLevel, level, showLabel = true }: XPBarProps) {
  const progress = (currentXP / xpForNextLevel) * 100
  const xpRemaining = xpForNextLevel - currentXP

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400 font-body">Level {level}</span>
          <span className="text-slate-400 font-body">
            <span className="text-white font-bold">{currentXP.toLocaleString()}</span> / {xpForNextLevel.toLocaleString()} XP
          </span>
        </div>
      )}
      
      <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
        {/* Animated background shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Progress bar */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-full shadow-lg shadow-orange-500/50"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        
        {/* Glow effect at the end */}
        <motion.div
          className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent to-orange-300/50 blur-sm"
          style={{ left: `${Math.max(0, progress - 5)}%` }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>

      {showLabel && (
        <p className="text-xs text-slate-400 font-body">
          {xpRemaining.toLocaleString()} XP to Level {level + 1}
        </p>
      )}
    </div>
  )
}

interface XPGainAnimationProps {
  amount: number
  onComplete?: () => void
}

export function XPGainAnimation({ amount, onComplete }: XPGainAnimationProps) {
  return (
    <motion.div
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
      initial={{ scale: 0, opacity: 0, y: 0 }}
      animate={{ 
        scale: [0, 1.2, 1],
        opacity: [0, 1, 1, 0],
        y: [0, -20, -40, -60]
      }}
      transition={{ duration: 2, times: [0, 0.2, 0.8, 1] }}
      onAnimationComplete={onComplete}
    >
      <div className="bg-gradient-to-r from-[#F46036] to-[#D74E25] text-white px-8 py-4 rounded-2xl shadow-2xl shadow-orange-500/50 flex items-center gap-3 border-2 border-orange-300/30">
        <Zap className="w-8 h-8 animate-pulse" />
        <div>
          <div className="text-3xl font-heading font-bold">+{amount} XP</div>
          <div className="text-sm opacity-90">Experience Gained!</div>
        </div>
      </div>
    </motion.div>
  )
}


