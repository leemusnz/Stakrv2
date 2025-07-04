"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowRight, Sparkles, Gift, Trophy, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import type { OnboardingData } from "@/app/onboarding/page"

interface FinalStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

export function FinalStep({ data }: FinalStepProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setShowConfetti(true)
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleComplete = async () => {
    setIsCompleting(true)

    try {
      const response = await fetch("/api/onboarding/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          avatar: data.avatar,
          goals: data.goals,
          interests: data.interests,
          experience: data.experience,
          commitmentType: data.commitmentType || "money",
        }),
      })

      if (response.ok) {
        router.push("/discover")
      }
    } catch (error) {
      console.error("Failed to complete onboarding:", error)
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto relative">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`absolute animate-bounce text-2xl`}
              style={{
                top: `${20 + i * 10}%`,
                left: `${15 + i * 12}%`,
                animationDelay: `${i * 100}ms`,
              }}
            >
              {["🎉", "✨", "🚀", "💪", "🎯", "🏆"][i]}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
          🎉 Setup Complete!
        </Badge>
        <h1 className="text-4xl font-bold">
          Welcome to <span className="text-primary">Stakr</span>!
        </h1>
        <p className="text-lg text-muted-foreground">
          You're all set to start building lasting habits with accountability
        </p>
      </div>

      {/* Profile Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-8">
          <div className="flex items-center gap-6 mb-6">
            <Avatar className="w-20 h-20 border-4 border-primary">
              <AvatarImage src={data.avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {data.name?.charAt(0).toUpperCase() || "S"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl font-bold">{data.name || "Stakr User"}</h3>
              <p className="text-muted-foreground">Ready to build lasting habits</p>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-success/10 text-success border-success/20">
                  <Gift className="w-4 h-4 mr-1" />
                  $25 Welcome Credits
                </Badge>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  New Member
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 text-center">
            <div className="space-y-2">
              <h4 className="font-bold">Your Focus Areas</h4>
              <div className="flex flex-wrap gap-1 justify-center">
                {data.interests?.slice(0, 4).map((interest, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold">Commitment Style</h4>
              <Badge
                className={
                  data.commitmentType === "money" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                }
              >
                {data.commitmentType === "money" ? "💰 Real Money" : "⚡ Points Only"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's Next */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-6 space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold">Discover Challenges</h3>
            <p className="text-sm text-muted-foreground">Browse personalized challenges that match your goals</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6 space-y-3">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-bold">Join Your First</h3>
            <p className="text-sm text-muted-foreground">
              Start with a beginner-friendly challenge to build confidence
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6 space-y-3">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-success" />
            </div>
            <h3 className="font-bold">Build Community</h3>
            <p className="text-sm text-muted-foreground">Connect with others on similar journeys for support</p>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4">
        <Button
          onClick={handleComplete}
          disabled={isCompleting}
          size="lg"
          className="text-lg font-bold px-12 py-6 w-full md:w-auto"
        >
          {isCompleting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Setting up your account...
            </>
          ) : (
            <>
              Start Building Better Habits
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        <p className="text-sm text-muted-foreground">Ready to discover challenges that will change your life?</p>
      </div>
    </div>
  )
}
