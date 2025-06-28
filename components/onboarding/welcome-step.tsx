"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Trophy, Brain, Users } from "lucide-react"
import type { OnboardingData } from "@/app/onboarding/page"

interface WelcomeStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-8 max-w-2xl mx-auto">
      {/* Hero Section */}
      <div className="space-y-6">
        <div className="space-y-4">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-sm font-bold px-4 py-2">
            🧠 Backed by behavioral science
          </Badge>

          <h1 className="text-5xl font-bold leading-tight">
            Put Your Money Where Your <span className="text-primary">Mouth</span> Is
          </h1>

          <p className="text-xl text-muted-foreground leading-relaxed">
            Stakr isn't just another habit app. We're the accountability platform that uses
            <strong className="text-foreground"> proven psychology</strong> to make you actually follow through on your
            commitments.
          </p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-muted/30 rounded-xl">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">73%</div>
            <div className="text-sm text-muted-foreground">Success rate vs 23% for free apps</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">21 days</div>
            <div className="text-sm text-muted-foreground">Average to form lasting habits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">$47</div>
            <div className="text-sm text-muted-foreground">Average earnings per completed challenge</div>
          </div>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="space-y-3 p-6 rounded-xl bg-primary/5 border border-primary/20">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-lg">Loss Aversion</h3>
            <p className="text-sm text-muted-foreground">
              Humans are 2.5x more motivated to avoid losing money than to gain it. We use this to your advantage.
            </p>
          </div>

          <div className="space-y-3 p-6 rounded-xl bg-secondary/5 border border-secondary/20">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-bold text-lg">Social Accountability</h3>
            <p className="text-sm text-muted-foreground">
              Public commitment increases follow-through by 65%. Your challenges are visible to the community.
            </p>
          </div>

          <div className="space-y-3 p-6 rounded-xl bg-success/5 border border-success/20">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="w-6 h-6 text-success" />
            </div>
            <h3 className="font-bold text-lg">Immediate Rewards</h3>
            <p className="text-sm text-muted-foreground">
              Win money from those who quit. Instant gratification rewires your brain for long-term success.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-4 pt-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={() => onNext()}
            size="lg"
            className="text-lg font-bold px-12 py-6 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
          >
            <Zap className="w-5 h-5 mr-2" />
            Show Me The Science
          </Button>

          <Button
            onClick={() => onNext()}
            variant="outline"
            size="lg"
            className="text-lg font-bold px-8 py-6 bg-transparent hover:bg-primary/10"
          >
            Skip to How It Works
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Join <strong>12,847</strong> people who've already put their money where their mouth is
        </p>
      </div>
    </div>
  )
}
