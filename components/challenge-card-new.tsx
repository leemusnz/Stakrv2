"use client"

import { motion } from "framer-motion"
import { 
  Trophy, 
  Users, 
  Clock, 
  Zap, 
  ArrowRight, 
  Sparkles,
  Flame
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface GamifiedChallengeCardProps {
  title: string
  category: string
  participants: number
  stakeAmount: number
  duration: string
  difficulty: "Easy" | "Medium" | "Hard"
  isPopular?: boolean
  progress?: number // 0-100
}

export function ChallengeCardNew({
  title = "30-Day Fitness Streak",
  category = "Fitness",
  participants = 1234,
  stakeAmount = 50,
  duration = "30 Days",
  difficulty = "Medium",
  isPopular = false,
  progress,
  imageUrl,
  hostAvatarUrl,
  onJoin
}: GamifiedChallengeCardProps & { imageUrl?: string; hostAvatarUrl?: string; onJoin?: () => void }) {
  
  // Dynamic gradient based on difficulty/category - Deeper, richer tones
  const getGradient = () => {
    switch (category.toLowerCase()) {
      case 'mindfulness': return "from-blue-600/90 to-indigo-900/90"
      case 'fitness': return "from-orange-600/90 to-red-900/90" 
      case 'productivity': return "from-emerald-600/90 to-teal-900/90"
      default: return "from-slate-800/90 to-slate-950/90"
    }
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }} // Tighter hover
      whileTap={{ scale: 0.98 }} // Subtler tap
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }} // Snappier physics
      className="relative w-full max-w-sm group cursor-pointer"
    >
      {/* Glow Effect Layer - Reduced intensity */}
      <div className={cn(
        "absolute -inset-[1px] bg-gradient-to-b rounded-2xl blur-sm opacity-0 group-hover:opacity-40 transition duration-500",
        category.toLowerCase() === 'fitness' ? "from-orange-500 to-red-600" : "from-blue-500 to-indigo-600"
      )} />

      {/* Main Card Content - More crystalline glass */}
      <div className="relative h-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl rounded-xl p-0 border border-slate-200/50 dark:border-slate-800/50 shadow-xl overflow-hidden ring-1 ring-slate-900/5">
        
        {/* Top Image/Header Area */}
        <div className="relative h-40 overflow-hidden">
          {/* Background Image with Parallax-like scaling on hover */}
          {imageUrl ? (
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          ) : (
            <div className={cn("absolute inset-0 bg-gradient-to-br", getGradient())} />
          )}
          
          {/* Gradient Overlay for Text Readability - Cinematic fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
          
          <div className="relative z-10 h-full flex flex-col justify-between p-5">
            <div className="flex justify-between items-start">
              <Badge className="bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10 text-white font-medium tracking-wide shadow-sm px-3 py-1">
                {category}
              </Badge>
              {isPopular && (
                <div className="flex items-center gap-1 text-xs font-bold text-amber-400 tracking-wider uppercase drop-shadow-md">
                  <Flame className="w-3 h-3 fill-current" /> Popular
                </div>
              )}
            </div>

            <div>
              <h3 className="text-white font-bold text-xl sm:text-2xl leading-tight tracking-tight drop-shadow-lg">
                {title}
              </h3>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 space-y-5">
          
          {/* Stats Row - Cleaner, more minimal HUD */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 py-2 border-b border-slate-100 dark:border-slate-800/50">
            <div className="space-y-1">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Pot</span>
              <div className="font-heading font-bold text-[#F46036] text-lg sm:text-xl drop-shadow-sm truncate">
                ${(stakeAmount * participants).toLocaleString()}
              </div>
            </div>
            <div className="space-y-1 border-l border-slate-100 dark:border-slate-800/50 pl-2 sm:pl-4">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Entry</span>
              <div className="font-heading font-bold text-slate-700 dark:text-slate-200 text-lg sm:text-xl truncate">
                ${stakeAmount}
              </div>
            </div>
            <div className="space-y-1 border-l border-slate-100 dark:border-slate-800/50 pl-2 sm:pl-4">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Duration</span>
              <div className="font-heading font-bold text-slate-700 dark:text-slate-200 text-lg sm:text-xl truncate">
                {duration.split(' ')[0]}d
              </div>
            </div>
          </div>

          {/* Progress Bar or Action - Refined styling */}
          {progress !== undefined ? (
            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Progress</span>
                <span className="text-[#F46036] font-mono font-bold">{progress}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    "h-full relative overflow-hidden rounded-full bg-gradient-to-r",
                     category.toLowerCase() === 'fitness' ? "from-orange-500 to-red-600" : "from-[#F46036] to-orange-600"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
                </motion.div>
              </div>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={onJoin}
              className="w-full py-3.5 rounded-lg font-bold text-sm text-white shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 group/btn bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] transition-all"
            >
              <Zap className="w-4 h-4 fill-white/20" />
              Join Challenge
              <ArrowRight className="w-4 h-4 opacity-50 group-hover/btn:translate-x-1 transition-transform" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

