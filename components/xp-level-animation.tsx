"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Star, Zap } from "lucide-react"

interface XPLevelAnimationProps {
  initialXP: number
  initialLevel: number
  finalXP: number
  finalLevel: number
  onComplete?: () => void
}

export function XPLevelAnimation({ 
  initialXP, 
  initialLevel, 
  finalXP, 
  finalLevel, 
  onComplete 
}: XPLevelAnimationProps) {
  const [currentXP, setCurrentXP] = useState(initialXP)
  const [currentLevel, setCurrentLevel] = useState(initialLevel)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [isAnimating, setIsAnimating] = useState(true)

  const xpGained = finalXP - initialXP
  const levelGained = finalLevel - initialLevel

  useEffect(() => {
    if (!isAnimating) return

    const duration = 2000 // 2 seconds
    const steps = 60 // 60 steps for smooth animation
    const stepDuration = duration / steps
    const xpPerStep = xpGained / steps

    let step = 0
    const interval = setInterval(() => {
      step++
      const newXP = Math.min(initialXP + (xpPerStep * step), finalXP)
      const newLevel = Math.floor(newXP / 200) + 1
      
      setCurrentXP(Math.floor(newXP))
      setCurrentLevel(newLevel)

      // Show level up animation when level changes
      if (newLevel > currentLevel) {
        setShowLevelUp(true)
        setTimeout(() => setShowLevelUp(false), 1500)
      }

      if (step >= steps) {
        setCurrentXP(finalXP)
        setCurrentLevel(finalLevel)
        setIsAnimating(false)
        clearInterval(interval)
        setTimeout(() => onComplete?.(), 1000)
      }
    }, stepDuration)

    return () => clearInterval(interval)
  }, [isAnimating, initialXP, finalXP, finalLevel, currentLevel, onComplete])

  const progressPercentage = ((currentXP % 200) / 200) * 100
  const xpToNextLevel = 200 - (currentXP % 200)

  return (
    <div className="relative">
      {/* XP Display Card */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20 rounded-lg p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Experience Points
          </h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {currentXP.toLocaleString()} XP
            </div>
            <div className="text-sm text-muted-foreground">
              Level {currentLevel}
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress to Level {currentLevel + 1}</span>
            <span className="font-medium">{xpToNextLevel} XP needed</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* XP Gained Display */}
        {isAnimating && xpGained > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm font-bold">
              <Star className="w-4 h-4" />
              +{xpGained} XP Earned!
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Level Up Animation Overlay */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-gradient-to-r from-primary to-secondary text-white p-8 rounded-2xl shadow-2xl text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Trophy className="w-16 h-16 mx-auto mb-4" />
              </motion.div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold mb-2"
              >
                Level Up!
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xl"
              >
                You reached Level {currentLevel}!
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
