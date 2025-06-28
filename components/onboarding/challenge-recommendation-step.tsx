"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowRight, Users, Clock, Target, DollarSign, Star, Zap, Coins, Lock, Trophy } from "lucide-react"
import { useState, useEffect } from "react"
import type { OnboardingData } from "@/app/onboarding/page"

interface ChallengeRecommendationStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

// Mock challenge recommendation logic
const getRecommendedChallenge = (data: OnboardingData) => {
  const isBeginnerFriendly = data.experience === "beginner" || data.experience === "some-experience"

  if (data.interests.includes("Morning Routines") || data.interests.includes("Productivity & Focus")) {
    return {
      id: "morning-routine-7",
      title: isBeginnerFriendly ? "7-Day Morning Routine Builder" : "21-Day Morning Mastery",
      description: isBeginnerFriendly
        ? "Build a simple 30-minute morning routine that sets you up for success every day."
        : "Create and maintain a comprehensive morning routine with meditation, exercise, and planning.",
      duration: isBeginnerFriendly ? "7 days" : "21 days",
      difficulty: isBeginnerFriendly ? "Beginner" : "Intermediate",
      participants: isBeginnerFriendly ? "847" : "423",
      successRate: isBeginnerFriendly ? 78 : 65,
      category: "Productivity",
      host: {
        name: "Sarah Chen",
        avatar: "/placeholder.svg?height=40&width=40",
        completedChallenges: 12,
        rating: 4.9,
      },
      requirements: isBeginnerFriendly
        ? ["Wake up at consistent time", "30 minutes of morning activities", "Daily photo check-in"]
        : ["Wake up at 6 AM", "60 minutes of structured routine", "Detailed daily reflection", "Weekly progress video"],
      rewards: {
        completion: isBeginnerFriendly ? "$15-25" : "$35-50",
        bonus: "Habit tracker template",
      },
    }
  }

  if (data.interests.includes("Fitness & Exercise") || data.goals.includes("Exercise Daily")) {
    return {
      id: "daily-movement",
      title: isBeginnerFriendly ? "10-Day Movement Challenge" : "30-Day Fitness Foundation",
      description: isBeginnerFriendly
        ? "Move your body for at least 20 minutes every day. Walking, dancing, yoga - anything counts!"
        : "Build a consistent exercise habit with structured workouts and progressive goals.",
      duration: isBeginnerFriendly ? "10 days" : "30 days",
      difficulty: isBeginnerFriendly ? "Beginner" : "Intermediate",
      participants: isBeginnerFriendly ? "1,234" : "567",
      successRate: isBeginnerFriendly ? 82 : 71,
      category: "Fitness",
      host: {
        name: "Mike Rodriguez",
        avatar: "/placeholder.svg?height=40&width=40",
        completedChallenges: 8,
        rating: 4.8,
      },
      requirements: isBeginnerFriendly
        ? ["20+ minutes of movement", "Photo or video proof", "Rate your energy 1-10"]
        : ["45+ minutes structured workout", "Track exercises and reps", "Weekly progress photos", "Nutrition log"],
      rewards: {
        completion: isBeginnerFriendly ? "$20-30" : "$40-60",
        bonus: "Workout plan template",
      },
    }
  }

  // Default meditation challenge
  return {
    id: "mindfulness-starter",
    title: isBeginnerFriendly ? "7-Day Mindfulness Starter" : "21-Day Meditation Mastery",
    description: isBeginnerFriendly
      ? "Start a simple meditation practice with just 10 minutes a day. Perfect for beginners."
      : "Develop a deep meditation practice with progressive techniques and mindfulness integration.",
    duration: isBeginnerFriendly ? "7 days" : "21 days",
    difficulty: isBeginnerFriendly ? "Beginner" : "Intermediate",
    participants: isBeginnerFriendly ? "923" : "445",
    successRate: isBeginnerFriendly ? 85 : 73,
    category: "Wellness",
    host: {
      name: "Dr. Lisa Park",
      avatar: "/placeholder.svg?height=40&width=40",
      completedChallenges: 15,
      rating: 4.9,
    },
    requirements: isBeginnerFriendly
      ? ["10 minutes daily meditation", "Use provided guided sessions", "Brief daily reflection"]
      : [
          "20+ minutes daily practice",
          "Mix of guided and silent meditation",
          "Weekly mindfulness challenges",
          "Progress journal",
        ],
    rewards: {
      completion: isBeginnerFriendly ? "$18-28" : "$35-55",
      bonus: "Meditation guide PDF",
    },
  }
}

export function ChallengeRecommendationStep({ data, onNext }: ChallengeRecommendationStepProps) {
  const [recommendedChallenge, setRecommendedChallenge] = useState<any>(null)
  const [selectedStakeRange, setSelectedStakeRange] = useState<string>("")
  const [usePoints, setUsePoints] = useState(false)

  const stakeRanges = [
    { id: "$10-25", label: "$10-25", description: "Low risk, good for beginners" },
    { id: "$25-50", label: "$25-50", description: "Sweet spot for most people" },
    { id: "$50-100", label: "$50-100", description: "Serious commitment" },
    { id: "$100+", label: "$100+", description: "Maximum accountability" },
  ]

  const pointRanges = [
    { id: "100-250", label: "100-250 points", description: "Low risk, good for beginners" },
    { id: "250-500", label: "250-500 points", description: "Sweet spot for most people" },
    { id: "500-1000", label: "500-1000 points", description: "Serious commitment" },
    { id: "1000+", label: "1000+ points", description: "Maximum accountability" },
  ]

  useEffect(() => {
    const challenge = getRecommendedChallenge(data)
    setRecommendedChallenge(challenge)

    // Set default stake based on experience
    if (data.experience === "beginner") {
      setSelectedStakeRange(usePoints ? "100-250" : "$10-25")
    } else if (data.experience === "expert") {
      setSelectedStakeRange(usePoints ? "500-1000" : "$50-100")
    } else {
      setSelectedStakeRange(usePoints ? "250-500" : "$25-50")
    }
  }, [data, usePoints])

  const handleNext = () => {
    onNext({
      recommendedChallenge,
      preferredStakeRange: selectedStakeRange,
    })
  }

  const canProceed = selectedStakeRange !== ""

  if (!recommendedChallenge) {
    return <div className="text-center">Loading your perfect challenge...</div>
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
          <Lock className="w-3 h-3 mr-1" />
          Perfect Match Found
        </Badge>
        <h1 className="text-4xl font-bold">
          Your <span className="text-primary">Perfect</span> First Challenge
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Based on your goals and experience, we found the ideal challenge to start your journey.
        </p>
      </div>

      {/* Money vs Points Toggle */}
      <Card className="bg-muted/30 border-muted">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-bold">Choose Your Commitment Type</h3>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setUsePoints(false)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  !usePoints
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted bg-transparent text-muted-foreground hover:border-primary/50"
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-bold">Real Money</div>
                  <div className="text-xs">Maximum results</div>
                </div>
              </button>

              <button
                onClick={() => setUsePoints(true)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  usePoints
                    ? "border-secondary bg-secondary/10 text-secondary"
                    : "border-muted bg-transparent text-muted-foreground hover:border-secondary/50"
                }`}
              >
                <Coins className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-bold">Points Only</div>
                  <div className="text-xs">Practice mode</div>
                </div>
              </button>
            </div>

            {usePoints && (
              <div className="p-4 bg-secondary/5 rounded-lg border border-secondary/20">
                <p className="text-sm text-muted-foreground">
                  <strong>New to accountability challenges?</strong> Start with points to learn the system. You can
                  upgrade to real money challenges anytime for maximum results.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Challenge */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary text-white">🎯 Recommended for You</Badge>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  {recommendedChallenge.successRate}% Success Rate
                </Badge>
              </div>
              <h2 className="text-2xl font-bold mb-2">{recommendedChallenge.title}</h2>
              <p className="text-muted-foreground mb-4">{recommendedChallenge.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-bold">{recommendedChallenge.duration}</div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-bold">{recommendedChallenge.participants}</div>
                  <div className="text-xs text-muted-foreground">Participants</div>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <Target className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-bold">{recommendedChallenge.difficulty}</div>
                  <div className="text-xs text-muted-foreground">Difficulty</div>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <Star className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-bold">{recommendedChallenge.category}</div>
                  <div className="text-xs text-muted-foreground">Category</div>
                </div>
              </div>

              {/* Host Info */}
              <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={recommendedChallenge.host.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{recommendedChallenge.host.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{recommendedChallenge.host.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {recommendedChallenge.host.completedChallenges} challenges • {recommendedChallenge.host.rating}★
                    rating
                  </div>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  Host
                </Badge>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-3">
            <h3 className="font-bold">Daily Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {recommendedChallenge.requirements.map((req: string, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  {req}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stake Selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">How much do you want to {usePoints ? "stake" : "put on the line"}?</h2>
        <p className="text-muted-foreground">
          {usePoints
            ? "Higher point stakes mean bigger rewards when you succeed, but more to lose if you don't."
            : "Higher stakes mean bigger rewards when you succeed, but more financial risk if you don't."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(usePoints ? pointRanges : stakeRanges).map((range) => (
            <Card
              key={range.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedStakeRange === range.id ? "border-primary bg-primary/10" : "hover:border-primary/20"
              }`}
              onClick={() => setSelectedStakeRange(range.id)}
            >
              <CardContent className="p-6 text-center">
                <div className="space-y-2">
                  <div className="text-lg font-bold">{range.label}</div>
                  <div className="text-sm text-muted-foreground">{range.description}</div>
                  {selectedStakeRange === range.id && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mx-auto">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Expected Rewards */}
      {selectedStakeRange && (
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-success" />
              Expected Rewards
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">If you complete the challenge:</div>
                <div className="text-xl font-bold text-success">
                  {usePoints ? selectedStakeRange.split("-")[0] : selectedStakeRange.split("-")[0]} back +{" "}
                  {recommendedChallenge.rewards.completion} bonus
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Bonus reward:</div>
                <div className="font-medium">{recommendedChallenge.rewards.bonus}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <div className="text-center space-y-4">
        <Button onClick={handleNext} disabled={!canProceed} size="lg" className="text-lg font-bold px-12 py-6">
          <Zap className="w-5 h-5 mr-2" />
          This Looks Perfect!
        </Button>

        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" className="bg-transparent">
            Show Me Other Options
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {!canProceed && (
          <p className="text-sm text-muted-foreground">
            Select your {usePoints ? "point" : "stake"} amount to continue
          </p>
        )}
      </div>
    </div>
  )
}
