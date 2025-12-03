"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import {
  ArrowRight,
  ArrowLeft,
  Target,
  Zap,
  Heart,
  Brain,
  Briefcase,
  Users,
  RotateCcw,
  Star,
  Trophy,
  Sparkles,
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import type { OnboardingData } from "@/app/onboarding/page"

interface GamefiedGoalsStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

const goalCategories = [
  {
    id: "health",
    label: "Health & Fitness",
    icon: Heart,
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    emoji: "💪",
    goals: ["Lose Weight", "Exercise Daily", "Eat Healthier", "Drink More Water", "Sleep Better", "Quit Smoking"],
  },
  {
    id: "productivity",
    label: "Productivity",
    icon: Briefcase,
    image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    emoji: "⚡",
    goals: [
      "Wake Up Early",
      "Deep Work Sessions",
      "Limit Social Media",
      "Read Daily",
      "Learn New Skill",
      "Organize Space",
    ],
  },
  {
    id: "mental",
    label: "Mental Wellness",
    icon: Brain,
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    emoji: "🧘",
    goals: ["Meditate Daily", "Practice Gratitude", "Journal", "Reduce Stress", "Mindful Eating", "Digital Detox"],
  },
  {
    id: "social",
    label: "Relationships",
    icon: Users,
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    emoji: "🤝",
    goals: ["Call Family", "Make New Friends", "Date Nights", "Network More", "Be More Present", "Practice Empathy"],
  },
  {
    id: "creative",
    label: "Creativity",
    icon: Zap,
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    emoji: "🎨",
    goals: ["Write Daily", "Learn Instrument", "Draw/Paint", "Photography", "Cooking", "Crafting"],
  },
  {
    id: "financial",
    label: "Financial",
    icon: Target,
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    emoji: "💰",
    goals: ["Save Money", "Budget Tracking", "Invest Regularly", "Side Hustle", "Reduce Spending", "Learn Finance"],
  },
]

export function GamefiedGoalsStep({ data, onNext, onBack, onSkip }: GamefiedGoalsStepProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(data.goals || [])
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [showXPAnimation, setShowXPAnimation] = useState(false)

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals((prev) => {
      const isAdding = !prev.includes(goal)
      return isAdding ? [...prev, goal] : prev.filter((g) => g !== goal)
    })
  }

  const handleClearAll = () => {
    setSelectedGoals([])
  }

  const handleNext = () => {
    setShowXPAnimation(true)
    setTimeout(() => {
      onNext({ goals: selectedGoals })
    }, 1000)
  }

  const canProceed = selectedGoals.length > 0

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative px-4">
      {/* XP Animation Overlay */}
      {showXPAnimation && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-in zoom-in-50 duration-300">
            <div className="bg-gradient-to-r from-[#F46036] to-[#D74E25] text-white px-8 py-4 rounded-2xl text-2xl font-heading font-bold shadow-2xl shadow-orange-500/50 flex items-center gap-3">
              <Sparkles className="w-6 h-6 animate-spin-slow" />
              +100 XP Unlocked!
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-3">
        <Badge variant="outline" className="bg-white/5 text-slate-500 dark:text-slate-400 border-white/10 text-xs font-medium backdrop-blur-sm">
          Step 2 of 3 • Identify Your Targets
        </Badge>
        <h1 className="text-3xl md:text-5xl font-heading font-bold leading-tight tracking-tight">
          Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F46036] to-[#D74E25]">Battles</span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
          Select the areas you want to conquer. Each selection unlocks tailored challenges.
        </p>
      </div>

      {/* Selection HUD */}
      <div className="flex items-center justify-between bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl">
        <div className="text-sm font-medium text-foreground flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#F46036]" />
          {selectedGoals.length > 0 ? (
            <span>{selectedGoals.length} Quest{selectedGoals.length !== 1 ? "s" : ""} Selected</span>
          ) : (
            <span className="text-muted-foreground">Select categories below...</span>
          )}
        </div>
        {selectedGoals.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goalCategories.map((category) => {
          const Icon = category.icon
          const isExpanded = expandedCategory === category.id
          const hasSelectedGoals = category.goals.some((goal) => selectedGoals.includes(goal))
          const selectedCount = category.goals.filter((goal) => selectedGoals.includes(goal)).length

          return (
            <div
              key={category.id}
              className={`relative group transition-all duration-500 ${isExpanded ? 'row-span-2' : ''}`}
            >
              <div
                className={`
                  relative h-full p-5 rounded-xl border cursor-pointer transition-all duration-500 overflow-hidden
                  ${hasSelectedGoals 
                    ? 'border-[#F46036] shadow-2xl shadow-orange-500/20 scale-[1.02]' 
                    : 'border-white/10 hover:border-white/30 hover:scale-[1.01]'
                  }
                `}
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
              >
                {/* Background Image with Ken Burns Effect */}
                <div className="absolute inset-0 z-0 overflow-hidden rounded-xl bg-black">
                  <motion.img 
                    src={category.image} 
                    alt={category.label}
                    className={`w-full h-full object-cover transition-all duration-700 ${hasSelectedGoals ? 'grayscale-0' : 'grayscale-[30%] group-hover:grayscale-0'}`}
                    animate={{ 
                      scale: hasSelectedGoals ? 1.1 : [1, 1.15],
                      x: hasSelectedGoals ? 0 : [0, -10, 0]
                    }}
                    transition={{ 
                      scale: { duration: hasSelectedGoals ? 0.5 : 20, repeat: hasSelectedGoals ? 0 : Infinity, repeatType: "reverse", ease: "linear" },
                      x: { duration: 25, repeat: Infinity, repeatType: "reverse", ease: "linear" }
                    }}
                  />
                  
                  {/* Cinematic Overlay */}
                  <div className={`absolute inset-0 transition-colors duration-300 ${hasSelectedGoals ? 'bg-black/40' : 'bg-black/50 group-hover:bg-black/30'}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                </div>

                {/* Glow Effect */}
                {hasSelectedGoals && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#F46036]/20 to-transparent opacity-100 z-0 pointer-events-none" />
                )}

                <div className="relative z-10 space-y-4 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl backdrop-blur-md ${hasSelectedGoals ? 'bg-[#F46036] text-white' : 'bg-white/10 text-white'} transition-colors`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {selectedCount > 0 && (
                      <Badge className="bg-[#F46036] text-white border-none font-bold animate-in zoom-in">
                        {selectedCount} Selected
                      </Badge>
                    )}
                  </div>

                  <div className="mt-auto">
                    <h3 className="font-heading font-bold text-2xl text-white tracking-wide drop-shadow-lg">
                      {category.label}
                    </h3>
                    {!isExpanded && (
                      <p className="text-sm text-white/70 mt-1 font-medium">
                        {hasSelectedGoals ? "Tap to edit selection" : "Tap to explore goals"}
                      </p>
                    )}
                  </div>

                  {/* Goals List (Expanded) */}
                  {isExpanded && (
                    <div className="space-y-2 pt-4 animate-in slide-in-from-bottom-4 fade-in duration-300 bg-black/40 backdrop-blur-xl -mx-5 -mb-5 p-5 border-t border-white/10">
                      {category.goals.map((goal) => (
                        <button
                          key={goal}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleGoalToggle(goal)
                          }}
                          className={`
                            w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all
                            flex items-center justify-between group/item
                            ${selectedGoals.includes(goal)
                              ? 'bg-white text-[#F46036] shadow-lg'
                              : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                            }
                          `}
                        >
                          {goal}
                          {selectedGoals.includes(goal) ? (
                            <Sparkles className="w-4 h-4 text-[#F46036] fill-current animate-pulse" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-white/30 group-hover/item:border-white/60" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer Actions */}
      <div className="pt-6 pb-20 md:pb-0 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/10">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="w-full md:w-auto flex flex-col items-center gap-2">
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            size="lg"
            className={`
              w-full md:w-auto px-10 py-6 text-lg font-bold rounded-xl shadow-xl transition-all duration-300
              ${canProceed 
                ? 'bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] hover:scale-105 text-white shadow-orange-500/20' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
              }
            `}
          >
            Confirm Selection
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          {!canProceed && (
            <p className="text-xs text-muted-foreground animate-pulse">
              Select at least one goal
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
