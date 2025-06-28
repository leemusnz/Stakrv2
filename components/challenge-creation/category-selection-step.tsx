"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, Dumbbell, BookOpen, Heart, Briefcase, Users, Clock, TrendingUp, Star } from "lucide-react"

interface CategorySelectionStepProps {
  selectedCategory: string
  onCategorySelect: (category: string) => void
}

const challengeCategories = [
  {
    id: "habit-building",
    title: "Habit Building",
    description: "Build consistent daily habits like meditation, reading, or journaling",
    icon: Target,
    examples: ["Daily meditation", "Morning pages", "Gratitude journal"],
    difficulty: "Beginner",
    duration: "7-30 days",
    popular: true,
  },
  {
    id: "fitness-health",
    title: "Fitness & Health",
    description: "Physical challenges focused on exercise, nutrition, and wellness",
    icon: Dumbbell,
    examples: ["10k steps daily", "No sugar challenge", "Workout streak"],
    difficulty: "Intermediate",
    duration: "14-60 days",
    popular: true,
  },
  {
    id: "skill-learning",
    title: "Skill Learning",
    description: "Develop new skills through consistent practice and learning",
    icon: BookOpen,
    examples: ["Learn Spanish", "Code daily", "Practice piano"],
    difficulty: "Intermediate",
    duration: "30-90 days",
    popular: false,
  },
  {
    id: "mindfulness-mental",
    title: "Mindfulness & Mental Health",
    description: "Focus on mental wellbeing, stress reduction, and emotional growth",
    icon: Heart,
    examples: ["Digital detox", "Stress management", "Sleep hygiene"],
    difficulty: "Beginner",
    duration: "7-21 days",
    popular: false,
  },
  {
    id: "productivity-career",
    title: "Productivity & Career",
    description: "Professional development and productivity improvement challenges",
    icon: Briefcase,
    examples: ["Wake up early", "No social media", "Deep work blocks"],
    difficulty: "Advanced",
    duration: "21-60 days",
    popular: false,
  },
  {
    id: "social-community",
    title: "Social & Community",
    description: "Challenges that involve social interaction and community building",
    icon: Users,
    examples: ["Random acts of kindness", "Connect with friends", "Volunteer work"],
    difficulty: "Beginner",
    duration: "14-30 days",
    popular: false,
  },
]

export function CategorySelectionStep({ selectedCategory, onCategorySelect }: CategorySelectionStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">What category best fits your challenge?</h2>
        <p className="text-muted-foreground">
          Choose the category that best describes your challenge. This helps participants find and understand what to
          expect.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challengeCategories.map((category) => {
          const Icon = category.icon
          const isSelected = selectedCategory === category.id

          return (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
              onClick={() => onCategorySelect(category.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? "bg-primary text-white" : "bg-muted"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {category.title}
                        {category.popular && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-sm">{category.description}</CardDescription>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {category.difficulty}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {category.duration}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Examples:</p>
                  <div className="flex flex-wrap gap-1">
                    {category.examples.map((example, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {example}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedCategory && (
        <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-secondary font-medium mb-2">
            <Target className="w-4 h-4" />
            Great Choice!
          </div>
          <p className="text-sm text-muted-foreground">
            You've selected <strong>{challengeCategories.find((c) => c.id === selectedCategory)?.title}</strong>. This
            will help participants understand what to expect and make your challenge easier to discover.
          </p>
        </div>
      )}
    </div>
  )
}
