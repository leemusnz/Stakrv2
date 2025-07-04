"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Heart, Brain, Briefcase, Users, Zap, Target } from "lucide-react"
import { useState } from "react"
import type { OnboardingData } from "@/app/onboarding/page"

interface StreamlinedGoalsStepProps {
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
    examples: ["Exercise daily", "Eat healthier", "Sleep better"],
  },
  {
    id: "productivity",
    label: "Productivity",
    icon: Briefcase,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    examples: ["Wake up early", "Deep work", "Read daily"],
  },
  {
    id: "mental",
    label: "Mental Wellness",
    icon: Brain,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    examples: ["Meditate", "Journal", "Practice gratitude"],
  },
  {
    id: "social",
    label: "Relationships",
    icon: Users,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    examples: ["Call family", "Date nights", "Network more"],
  },
  {
    id: "creative",
    label: "Creativity",
    icon: Zap,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    examples: ["Write daily", "Learn music", "Photography"],
  },
  {
    id: "financial",
    label: "Financial",
    icon: Target,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    examples: ["Save money", "Budget", "Side hustle"],
  },
]

export function StreamlinedGoalsStep({ data, onNext }: StreamlinedGoalsStepProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(data.interests || [])

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const handleNext = () => {
    onNext({
      interests: selectedCategories,
      goals: selectedCategories, // Simplified - use categories as goals
    })
  }

  const canProceed = selectedCategories.length > 0

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          Step 2 of 4
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold">
          What Areas Do You Want to <span className="text-primary">Improve</span>?
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Select the categories that matter most to you. We'll recommend challenges that fit your goals.
        </p>
      </div>

      {/* Categories Grid - Improved Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {goalCategories.map((category) => {
          const Icon = category.icon
          const isSelected = selectedCategories.includes(category.id)

          return (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                isSelected
                  ? `${category.bgColor} ${category.borderColor} border-2`
                  : "hover:border-primary/20 border-2 border-transparent"
              }`}
              onClick={() => handleCategoryToggle(category.id)}
            >
              <CardContent className="p-6 text-center space-y-4">
                <div className={`w-16 h-16 rounded-full ${category.bgColor} flex items-center justify-center mx-auto`}>
                  <Icon className={`w-8 h-8 ${category.color}`} />
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-lg">{category.label}</h3>
                  <div className="space-y-1">
                    {category.examples.map((example, index) => (
                      <div key={index} className="text-xs text-muted-foreground">
                        {example}
                      </div>
                    ))}
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mx-auto">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Selection Summary */}
      {selectedCategories.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="font-bold mb-2">Perfect! You've selected {selectedCategories.length} focus areas</h3>
            <p className="text-sm text-muted-foreground">
              We'll show you challenges that help you build habits in these areas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <div className="text-center space-y-4">
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          size="lg"
          className="text-lg font-bold px-12 py-6 w-full md:w-auto"
        >
          Find My Perfect Challenges
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        {!canProceed && <p className="text-sm text-muted-foreground">Select at least one area to continue</p>}
      </div>
    </div>
  )
}
