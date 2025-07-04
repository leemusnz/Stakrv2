"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Zap, Users, Trophy, DollarSign, CheckCircle } from "lucide-react"
import type { OnboardingData } from "@/app/onboarding/page"

interface MobileFirstWelcomeStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

export function MobileFirstWelcomeStep({ onNext }: MobileFirstWelcomeStepProps) {
  const [selectedCommitmentType, setSelectedCommitmentType] = useState<"money" | "points">("money")

  return (
    <div className="space-y-6 max-w-md mx-auto px-4">
      {/* Hero Section - Mobile Optimized */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>

        <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-sm font-bold px-3 py-1">
          🔥 Join 12,847 successful habit builders
        </Badge>

        <h1 className="text-3xl font-bold leading-tight">
          Turn Your Goals Into <span className="text-primary">Unstoppable</span> Habits
        </h1>

        <p className="text-base text-muted-foreground leading-relaxed">
          Put something on the line. Get <strong>3x better results</strong>. It's that simple.
        </p>
      </div>

      {/* Social Proof - Mobile Cards */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl">
        <div className="text-center">
          <div className="text-xl font-bold text-primary">73%</div>
          <div className="text-xs text-muted-foreground">Success Rate</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-secondary">$2.1M</div>
          <div className="text-xs text-muted-foreground">Rewards Paid</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-success">4.9★</div>
          <div className="text-xs text-muted-foreground">App Rating</div>
        </div>
      </div>

      {/* Value Props - Stacked for Mobile */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">Real Accountability</div>
            <div className="text-xs text-muted-foreground">Put money where your mouth is</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border">
          <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-secondary" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">Community Support</div>
            <div className="text-xs text-muted-foreground">Never struggle alone again</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border">
          <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
            <Trophy className="w-4 h-4 text-success" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">Earn Rewards</div>
            <div className="text-xs text-muted-foreground">Get paid for building habits</div>
          </div>
        </div>
      </div>

      {/* Commitment Type - Simplified for Mobile */}
      <Card className="bg-muted/30 border-muted">
        <CardContent className="p-4">
          <h3 className="font-bold mb-3 text-center">Choose Your Style</h3>
          <div className="space-y-3">
            <button
              onClick={() => setSelectedCommitmentType("money")}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedCommitmentType === "money"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-muted bg-transparent hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5" />
                <div className="flex-1">
                  <div className="font-bold">Real Money Stakes</div>
                  <div className="text-xs text-muted-foreground">Maximum results • 73% success rate</div>
                </div>
                {selectedCommitmentType === "money" && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </button>

            <button
              onClick={() => setSelectedCommitmentType("points")}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedCommitmentType === "points"
                  ? "border-secondary bg-secondary/10 text-secondary"
                  : "border-muted bg-transparent hover:border-secondary/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5" />
                <div className="flex-1">
                  <div className="font-bold">Points Only</div>
                  <div className="text-xs text-muted-foreground">Practice mode • Risk-free learning</div>
                </div>
                {selectedCommitmentType === "points" && (
                  <div className="w-5 h-5 bg-secondary rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Urgency/Scarcity */}
      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-center">
        <div className="text-sm font-medium text-primary">🎯 Limited Time: $25 Welcome Bonus</div>
        <div className="text-xs text-muted-foreground">Join today and get credits to start your first challenge</div>
      </div>

      {/* CTA - Mobile Optimized */}
      <div className="space-y-3 pt-2">
        <Button
          onClick={() => onNext({ commitmentType: selectedCommitmentType })}
          size="lg"
          className="w-full text-lg font-bold py-6"
        >
          Start Building Better Habits
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        <p className="text-center text-xs text-muted-foreground">Free to start • 2 minutes setup • Cancel anytime</p>
      </div>
    </div>
  )
}
