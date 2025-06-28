"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Zap, Target, TrendingUp, ArrowRight, CheckCircle, XCircle } from "lucide-react"
import type { OnboardingData } from "@/app/onboarding/page"

interface HabitScienceStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

export function HabitScienceStep({ onNext }: HabitScienceStepProps) {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          🧠 The Science
        </Badge>
        <h1 className="text-4xl font-bold">
          Why <span className="text-primary">Most</span> Habit Apps Fail
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We studied the research. Here's what actually works for building lasting habits.
        </p>
      </div>

      {/* The Problem */}
      <Card className="bg-destructive/5 border-destructive/20">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold">The Harsh Reality</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-destructive">92%</div>
                <p className="text-sm text-muted-foreground">of people fail their New Year's resolutions</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-destructive">23%</div>
                <p className="text-sm text-muted-foreground">success rate for free habit apps</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-destructive">3 days</div>
                <p className="text-sm text-muted-foreground">average before people give up</p>
              </div>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              <strong>Why?</strong> Because motivation fades, there's no real consequence for quitting, and your brain
              is wired to choose immediate comfort over long-term benefits.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* The Science */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Loss Aversion Psychology</h3>
            <p className="text-sm text-muted-foreground">
              Nobel Prize-winning research by Daniel Kahneman shows people are <strong>2.5x more motivated</strong>
              to avoid losing $50 than to gain $50. We make quitting expensive.
            </p>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              📚 Kahneman & Tversky, 1979
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-secondary/5 border-secondary/20">
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl font-bold">Implementation Intentions</h3>
            <p className="text-sm text-muted-foreground">
              Studies show that people who make specific "if-then" plans are <strong>300% more likely</strong>
              to follow through. Our challenges force you to be specific.
            </p>
            <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
              📚 Gollwitzer, 1999
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold">Social Accountability</h3>
            <p className="text-sm text-muted-foreground">
              Public commitment increases success rates by <strong>65%</strong>. When others can see your progress,
              you're less likely to quit.
            </p>
            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
              📚 Cialdini, 2006
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-success" />
            </div>
            <h3 className="text-xl font-bold">Habit Loop Rewards</h3>
            <p className="text-sm text-muted-foreground">
              Your brain needs immediate rewards to form habits. Winning money from quitters provides the{" "}
              <strong>dopamine hit</strong> that makes habits stick.
            </p>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              📚 Duhigg, 2012
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Our Results */}
      <Card className="bg-success/5 border-success/20">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold">Our Results Speak for Themselves</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-success">73%</div>
                <p className="text-sm text-muted-foreground">of Stakr users complete their challenges</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-success">21 days</div>
                <p className="text-sm text-muted-foreground">average streak length (vs 3 days for free apps)</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-success">89%</div>
                <p className="text-sm text-muted-foreground">continue building habits after their first challenge</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-lg px-6 py-2">
              🏆 3x more effective than traditional habit apps
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center space-y-4">
        <Button onClick={() => onNext()} size="lg" className="text-lg font-bold px-12 py-6">
          I'm Convinced - Show Me How
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        <p className="text-sm text-muted-foreground">Ready to use science to your advantage?</p>
      </div>
    </div>
  )
}
