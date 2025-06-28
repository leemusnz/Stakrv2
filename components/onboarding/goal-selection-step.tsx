"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Target, Zap, Heart, Brain, Briefcase, Users, RotateCcw } from "lucide-react"
import { useState } from "react"
import type { OnboardingData } from "@/app/onboarding/page"

interface GoalSelectionStepProps {
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
    goals: ["Lose Weight", "Exercise Daily", "Eat Healthier", "Drink More Water", "Sleep Better", "Quit Smoking"],
  },
  {
    id: "productivity",
    label: "Productivity",
    icon: Briefcase,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
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
    goals: ["Meditate Daily", "Practice Gratitude", "Journal", "Reduce Stress", "Mindful Eating", "Digital Detox"],
  },
  {
    id: "social",
    label: "Relationships",
    icon: Users,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    goals: ["Call Family", "Make New Friends", "Date Nights", "Network More", "Be More Present", "Practice Empathy"],
  },
  {
    id: "creative",
    label: "Creativity",
    icon: Zap,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    goals: ["Write Daily", "Learn Instrument", "Draw/Paint", "Photography", "Cooking", "Crafting"],
  },
  {
    id: "financial",
    label: "Financial",
    icon: Target,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    goals: ["Save Money", "Budget Tracking", "Invest Regularly", "Side Hustle", "Reduce Spending", "Learn Finance"],
  },
]

export function GoalSelectionStep({ data, onNext }: GoalSelectionStepProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(data.goals || [])
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]))
  }

  const handleClearAll = () => {
    setSelectedGoals([])
  }

  const handleNext = () => {
    onNext({ goals: selectedGoals })
  }

  const canProceed = selectedGoals.length > 0

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          Step 1 of 5
        </Badge>
        <h1 className="text-4xl font-bold">
          What Do You Want to <span className="text-primary">Achieve</span>?
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Select the areas where you want to build lasting habits. We'll recommend challenges that match your goals.
        </p>
      </div>

      {/* Selection Counter & Clear */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedGoals.length > 0 && (
            <span className="font-medium text-foreground">
              {selectedGoals.length} goal{selectedGoals.length !== 1 ? "s" : ""} selected
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

          return (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                hasSelectedGoals ? `${category.bgColor} ${category.borderColor}` : "hover:border-primary/20"
              }`}
              onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${category.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${category.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{category.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {category.goals.filter((goal) => selectedGoals.includes(goal)).length} selected
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
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedGoals.includes(goal)
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-muted bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
                          }`}
                        >
                          {goal}
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
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="font-bold mb-3">Your Selected Goals</h3>
            <div className="flex flex-wrap gap-2">
              {selectedGoals.map((goal) => (
                <Badge
                  key={goal}
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20"
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
          <h3 className="font-bold mb-3">💡 Why We Ask This</h3>
          <p className="text-sm text-muted-foreground">
            Research shows that people who write down specific goals are <strong>42% more likely</strong> to achieve
            them. By selecting your focus areas, we can recommend challenges that align with your priorities and have
            the highest success rates for people like you.
          </p>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center space-y-4">
        <Button onClick={handleNext} disabled={!canProceed} size="lg" className="text-lg font-bold px-12 py-6">
          Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        {!canProceed && <p className="text-sm text-muted-foreground">Select at least one goal to continue</p>}
      </div>
    </div>
  )
}
