"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Zap, Users, Trophy, DollarSign } from "lucide-react"
import type { OnboardingData } from "@/app/onboarding/page"

interface ImprovedWelcomeStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

export function ImprovedWelcomeStep({ onNext }: ImprovedWelcomeStepProps) {
  const [selectedCommitmentType, setSelectedCommitmentType] = useState<"money" | "points">("money")

  return (
    <div className="space-y-8 max-w-2xl mx-auto text-center">
      {/* Hero Section - Simplified */}
      <div className="space-y-6">
        <div className="space-y-4">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-sm font-bold px-4 py-2">
            🎯 Accountability That Actually Works
          </Badge>

          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Turn Your Goals Into <span className="text-primary">Commitments</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Join thousands who've discovered the secret: <strong>putting something on the line</strong> makes you 3x
            more likely to follow through.
          </p>
        </div>

        {/* Quick Stats - More Visual */}
        <div className="grid grid-cols-3 gap-4 p-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">73%</div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">12k+</div>
            <div className="text-xs text-muted-foreground">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">$2.1M</div>
            <div className="text-xs text-muted-foreground">Rewards Paid</div>
          </div>
        </div>
      </div>

      {/* How It Works - Simplified to 3 Steps */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">How It Works</h2>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="relative border-primary/20 bg-primary/5">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold">Stake</h3>
                <p className="text-sm text-muted-foreground">Put money or points on the line</p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative border-secondary/20 bg-secondary/5">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold">Commit</h3>
                <p className="text-sm text-muted-foreground">Complete daily tasks with proof</p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative border-success/20 bg-success/5">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <Trophy className="w-6 h-6 text-success" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold">Win</h3>
                <p className="text-sm text-muted-foreground">Get your stake back + rewards</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Commitment Type Selection - New */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Choose Your Commitment Style</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedCommitmentType("money")}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              selectedCommitmentType === "money"
                ? "border-primary bg-primary/10 text-primary"
                : "border-muted bg-transparent hover:border-primary/50"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <span className="font-bold">Real Money</span>
              </div>
              <p className="text-sm text-muted-foreground">Maximum accountability, maximum results</p>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                73% success rate
              </Badge>
            </div>
          </button>

          <button
            onClick={() => setSelectedCommitmentType("points")}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              selectedCommitmentType === "points"
                ? "border-secondary bg-secondary/10 text-secondary"
                : "border-muted bg-transparent hover:border-secondary/50"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                <span className="font-bold">Points Only</span>
              </div>
              <p className="text-sm text-muted-foreground">Practice mode, perfect for beginners</p>
              <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                Risk-free learning
              </Badge>
            </div>
          </button>
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-4 pt-4">
        <Button
          onClick={() => onNext({ commitmentType: selectedCommitmentType })}
          size="lg"
          className="text-lg font-bold px-12 py-6 w-full md:w-auto"
        >
          Let's Build Better Habits
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        <p className="text-sm text-muted-foreground">Takes 2 minutes • Join 12,847 successful habit builders</p>
      </div>
    </div>
  )
}
