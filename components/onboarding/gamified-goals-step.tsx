"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowRight,
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
import { useState } from "react"
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
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    emoji: "💰",
    goals: ["Save Money", "Budget Tracking", "Invest Regularly", "Side Hustle", "Reduce Spending", "Learn Finance"],
  },
]

export function GamefiedGoalsStep({ data, onNext }: GamefiedGoalsStepProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(data.goals || [])
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [showXPAnimation, setShowXPAnimation] = useState(false)
  const [goalXPAnimations, setGoalXPAnimations] = useState<string[]>([])

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals((prev) => {
      const isAdding = !prev.includes(goal)
      if (isAdding) {
        // Show XP animation for adding goal
        setGoalXPAnimations((current) => [...current, goal])
        setTimeout(() => {
          setGoalXPAnimations((current) => current.filter((g) => g !== goal))
        }, 1500)
      }
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
    }, 1500)
  }

  const canProceed = selectedGoals.length > 0

  return (
    <div className="space-y-8 max-w-4xl mx-auto relative">
      {/* XP Animation */}
      {showXPAnimation && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce">
            <div className="bg-primary text-primary-foreground px-6 py-3 rounded-full text-xl font-bold shadow-lg">
              +100 XP! Level Up! 🎉
            </div>
          </div>
        </div>
      )}

      {/* Goal XP Animations */}
      {goalXPAnimations.map((goal, index) => (
        <div
          key={goal}
          className="fixed top-1/2 left-1/2 pointer-events-none z-40 animate-bounce"
          style={{ transform: `translate(-50%, -50%) translateY(${index * -20}px)` }}
        >
          <div className="bg-success text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">+5 XP!</div>
        </div>
      ))}

      {/* Character Illustration */}
      <div className="text-center">
        <div className="w-32 h-32 mx-auto mb-6 relative">
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center border-4 border-primary/30">
            <div className="text-6xl">🎯</div>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-pulse">
            <Star className="w-4 h-4 text-white" />
          </div>
          {/* Level indicator */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-secondary text-white px-2 py-1 rounded-full text-xs font-bold">
            Level {data.level || 1}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          Step 2 of 3 • +100 XP Available
        </Badge>
        <h1 className="text-4xl font-bold">
          Choose Your <span className="text-primary">Quest</span> Categories
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Select the areas where you want to build lasting habits. Each selection earns you XP and unlocks personalized
          challenges!
        </p>
      </div>

      {/* XP Progress Bar */}
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">XP Progress</span>
          <span className="text-sm text-muted-foreground">{data.xp || 0} / 300 XP</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(((data.xp || 0) / 300) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Selection Counter & Clear */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedGoals.length > 0 && (
            <span className="font-medium text-foreground flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              {selectedGoals.length} goal{selectedGoals.length !== 1 ? "s" : ""} selected
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                +{selectedGoals.length * 5} XP
              </Badge>
            </span>
          )}
        </div>
        {selectedGoals.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="text-muted-foreground hover:text-foreground bg-transparent"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Goal Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goalCategories.map((category) => {
          const Icon = category.icon
          const isExpanded = expandedCategory === category.id
          const hasSelectedGoals = category.goals.some((goal) => selectedGoals.includes(goal))
          const selectedCount = category.goals.filter((goal) => selectedGoals.includes(goal)).length

          return (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
                hasSelectedGoals
                  ? `${category.bgColor} ${category.borderColor} ring-2 ring-primary/20`
                  : "hover:border-primary/20"
              }`}
              onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full ${category.bgColor} flex items-center justify-center relative`}
                    >
                      <div className="text-2xl">{category.emoji}</div>
                      {hasSelectedGoals && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">{selectedCount}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold flex items-center gap-2">
                        {category.label}
                        {hasSelectedGoals && <Sparkles className="w-4 h-4 text-primary" />}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedCount} selected • +{selectedCount * 5} XP
                      </p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                      {category.goals.map((goal) => (
                        <button
                          key={goal}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleGoalToggle(goal)
                          }}
                          className={`w-full text-left p-3 rounded-lg border transition-all hover:scale-105 ${
                            selectedGoals.includes(goal)
                              ? "border-primary bg-primary/10 text-primary font-medium ring-2 ring-primary/20"
                              : "border-muted bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{goal}</span>
                            {selectedGoals.includes(goal) && (
                              <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                                +5 XP
                              </Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Selected Goals Preview */}
      {selectedGoals.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Your Quest Goals
              <Badge className="bg-primary/10 text-primary border-primary/20">+{selectedGoals.length * 5} XP</Badge>
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedGoals.map((goal) => (
                <Badge
                  key={goal}
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => handleGoalToggle(goal)}
                >
                  {goal} ×
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Why This Matters */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5 text-secondary" />
            The Science Behind Goal Setting
          </h3>
          <p className="text-sm text-muted-foreground">
            Research shows that people who write down specific goals are <strong>42% more likely</strong> to achieve
            them. By selecting your focus areas, we can recommend challenges that align with your priorities and have
            the highest success rates for people like you.
          </p>
        </CardContent>
      </Card>

      {/* Gamified CTA */}
      <div className="text-center space-y-4">
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          size="lg"
          className="text-lg font-bold px-12 py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          Continue Quest (+100 XP)
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        {!canProceed && (
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Target className="w-4 h-4" />
            Select at least one goal to continue your quest
          </p>
        )}
      </div>
    </div>
  )
}
