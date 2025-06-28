"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, TrendingUp, Star, Users, Clock } from "lucide-react"
import { useState } from "react"
import type { OnboardingData } from "@/app/onboarding/page"

interface InterestSelectionStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

const experienceLevels = [
  {
    id: "beginner",
    label: "New to habit building",
    description: "I've tried before but struggled to stick with it",
    icon: "🌱",
    color: "bg-green-500/10 border-green-500/20 text-green-700",
  },
  {
    id: "some-experience",
    label: "Some experience",
    description: "I've built a few habits but want to be more consistent",
    icon: "🌿",
    color: "bg-blue-500/10 border-blue-500/20 text-blue-700",
  },
  {
    id: "experienced",
    label: "Pretty experienced",
    description: "I have good habits but want to level up",
    icon: "🌳",
    color: "bg-purple-500/10 border-purple-500/20 text-purple-700",
  },
  {
    id: "expert",
    label: "Habit master",
    description: "I'm disciplined but want accountability for bigger goals",
    icon: "🏆",
    color: "bg-orange-500/10 border-orange-500/20 text-orange-700",
  },
]

const popularInterests = [
  { label: "Morning Routines", trend: "+23%", participants: "2.1k" },
  { label: "Fitness & Exercise", trend: "+18%", participants: "3.4k" },
  { label: "Meditation & Mindfulness", trend: "+31%", participants: "1.8k" },
  { label: "Reading & Learning", trend: "+15%", participants: "2.7k" },
  { label: "Healthy Eating", trend: "+27%", participants: "2.9k" },
  { label: "Productivity & Focus", trend: "+22%", participants: "3.1k" },
]

const otherInterests = [
  "Creative Writing",
  "Language Learning",
  "Cooking",
  "Photography",
  "Music Practice",
  "Journaling",
  "Networking",
  "Side Projects",
  "Financial Planning",
  "Home Organization",
  "Outdoor Activities",
  "Skill Development",
  "Social Connection",
  "Digital Minimalism",
]

export function InterestSelectionStep({ data, onNext }: InterestSelectionStepProps) {
  const [selectedExperience, setSelectedExperience] = useState<string>(data.experience || "")
  const [selectedInterests, setSelectedInterests] = useState<string[]>(data.interests || [])
  const [showMoreInterests, setShowMoreInterests] = useState(false)

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]))
  }

  const handleNext = () => {
    onNext({
      experience: selectedExperience,
      interests: selectedInterests,
    })
  }

  const canProceed = selectedExperience && selectedInterests.length > 0

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          Step 2 of 5
        </Badge>
        <h1 className="text-4xl font-bold">
          What's Your <span className="text-primary">Experience</span> Level?
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Help us recommend the right challenges for your skill level and interests.
        </p>
      </div>

      {/* Experience Level */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">How experienced are you with building habits?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {experienceLevels.map((level) => (
            <Card
              key={level.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedExperience === level.id ? level.color : "hover:border-primary/20"
              }`}
              onClick={() => setSelectedExperience(level.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{level.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{level.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{level.description}</p>
                  </div>
                  {selectedExperience === level.id && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Popular Interests */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">What interests you most?</h2>
          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
            <TrendingUp className="w-3 h-3 mr-1" />
            Popular Right Now
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {popularInterests.map((interest) => (
            <button
              key={interest.label}
              onClick={() => handleInterestToggle(interest.label)}
              className={`p-4 rounded-lg border text-left transition-all hover:shadow-sm ${
                selectedInterests.includes(interest.label)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-muted bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{interest.label}</h3>
                {selectedInterests.includes(interest.label) && <Star className="w-4 h-4 fill-current" />}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {interest.trend}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {interest.participants}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Other Interests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Other Interests</h3>
          <Button variant="outline" size="sm" onClick={() => setShowMoreInterests(!showMoreInterests)}>
            {showMoreInterests ? "Show Less" : "Show More"}
          </Button>
        </div>

        {showMoreInterests && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 animate-in slide-in-from-top-2">
            {otherInterests.map((interest) => (
              <button
                key={interest}
                onClick={() => handleInterestToggle(interest)}
                className={`p-3 rounded-lg border text-sm transition-all ${
                  selectedInterests.includes(interest)
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-muted bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Summary */}
      {selectedInterests.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-bold">Your Interests</h3>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {selectedInterests.length} selected
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedInterests.map((interest) => (
                <Badge
                  key={interest}
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20"
                  onClick={() => handleInterestToggle(interest)}
                >
                  {interest} ×
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personalization Note */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Smart Matching
          </h3>
          <p className="text-sm text-muted-foreground">
            Based on your experience level and interests, we'll recommend challenges with the highest success rates for
            people like you. <strong>Beginners</strong> get shorter, easier challenges to build confidence.
            <strong>Experts</strong> get more ambitious goals with higher stakes.
          </p>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center space-y-4">
        <Button onClick={handleNext} disabled={!canProceed} size="lg" className="text-lg font-bold px-12 py-6">
          Find My Perfect Challenge
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        {!canProceed && (
          <p className="text-sm text-muted-foreground">
            Select your experience level and at least one interest to continue
          </p>
        )}
      </div>
    </div>
  )
}
