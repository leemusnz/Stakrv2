"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Heart, Brain, Briefcase, Zap, Target, Users } from "lucide-react"
import { useState } from "react"
import type { OnboardingData } from "@/app/onboarding/page"

interface QuickGoalsStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

const quickGoals = [
  {
    id: "fitness",
    label: "Get Fit",
    icon: Heart,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    popular: true,
  },
  {
    id: "productivity",
    label: "Be Productive",
    icon: Briefcase,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    popular: true,
  },
  {
    id: "wellness",
    label: "Mental Health",
    icon: Brain,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    popular: false,
  },
  {
    id: "creativity",
    label: "Be Creative",
    icon: Zap,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    popular: false,
  },
  {
    id: "financial",
    label: "Save Money",
    icon: Target,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    popular: false,
  },
  {
    id: "social",
    label: "Relationships",
    icon: Users,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    popular: false,
  },
]

export function QuickGoalsStep({ data, onNext }: QuickGoalsStepProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(data.interests || [])

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals((prev) => (prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]))
  }

  const handleNext = () => {
    onNext({
      interests: selectedGoals,
      goals: selectedGoals,
    })
  }

  const canProceed = selectedGoals.length > 0

  return (
    <div className="space-y-6 max-w-md mx-auto px-4">
      {/* Header */}
      <div className="text-center space-y-3">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          Step 2 of 3
        </Badge>
        <h1 className="text-2xl font-bold">
          What Do You Want to <span className="text-primary">Improve</span>?
        </h1>
        <p className="text-sm text-muted-foreground">Pick what matters most. We'll find perfect challenges for you.</p>
      </div>

      {/* Goals Grid - Mobile Optimized */}
      <div className="grid grid-cols-2 gap-3">
        {quickGoals.map((goal) => {
          const Icon = goal.icon
          const isSelected = selectedGoals.includes(goal.id)

          return (
            <Card
              key={goal.id}
              className={`cursor-pointer transition-all hover:scale-105 relative ${
                isSelected
                  ? `${goal.bgColor} ${goal.borderColor} border-2`
                  : "hover:border-primary/20 border-2 border-transparent"
              }`}
              onClick={() => handleGoalToggle(goal.id)}
            >
              {goal.popular && (
                <Badge className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-1">Popular</Badge>
              )}
              <CardContent className="p-4 text-center space-y-3">
                <div className={`w-12 h-12 rounded-full ${goal.bgColor} flex items-center justify-center mx-auto`}>
                  <Icon className={`w-6 h-6 ${goal.color}`} />
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-sm">{goal.label}</h3>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center mx-auto">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Selection Feedback */}
      {selectedGoals.length > 0 && (
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-success">
              🎯 Great choice! {selectedGoals.length} focus area{selectedGoals.length > 1 ? "s" : ""} selected
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              We have {selectedGoals.length * 15}+ challenges ready for you
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <div className="space-y-3 pt-2">
        <Button onClick={handleNext} disabled={!canProceed} size="lg" className="w-full text-lg font-bold py-6">
          Find My Challenges
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        {!canProceed && (
          <p className="text-center text-xs text-muted-foreground">Select at least one area to continue</p>
        )}
      </div>
    </div>
  )
}
