"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, DollarSign, Users, Trophy, TrendingUp, AlertCircle, Heart, RotateCcw } from "lucide-react"
import type { OnboardingData } from "@/app/onboarding/page"

interface HowItWorksStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

export function HowItWorksStep({ onNext }: HowItWorksStepProps) {
  const [selectedStake, setSelectedStake] = useState(100)
  const [showFailureSupport, setShowFailureSupport] = useState(false)

  const calculateRewards = (stake: number) => {
    const bonusRange = Math.floor(stake * 0.18) + "-" + Math.floor(stake * 0.28)
    return {
      stakeBack: stake,
      bonus: bonusRange,
      total: stake + Math.floor(stake * 0.23),
    }
  }

  const rewards = calculateRewards(selectedStake)

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          Step 2 of 8 - The System
        </Badge>
        <h1 className="text-4xl font-bold">
          Here's How <span className="text-primary">Stakr</span> Works
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Simple concept, powerful results. Put your money where your goals are.
        </p>
      </div>

      {/* The 3-Step Process */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="relative">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">1. Stake Money</h3>
              <p className="text-muted-foreground">
                Put real money on the line. Start with $10 or go big with $1000+. Your choice, your commitment.
              </p>
            </div>
            <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
              Or use points to practice!
            </Badge>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">2. Do the Challenge</h3>
              <p className="text-muted-foreground">
                Complete daily tasks, submit proof, get community support. We're here to help you win.
              </p>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              Daily reminders & coaching
            </Badge>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8 text-success" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">3. Win or Learn</h3>
              <p className="text-muted-foreground">
                Complete it? Get your money back + bonus rewards. Don't? We help you bounce back stronger.
              </p>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Growth either way
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Stake Calculator */}
      <Card className="bg-gradient-to-br from-success/5 to-primary/5">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">See Your Potential Rewards</h3>
              <p className="text-muted-foreground">
                Rewards vary based on challenge difficulty and actual completion rates
              </p>
            </div>

            {/* Stake Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <span className="text-sm text-muted-foreground">$10</span>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={selectedStake}
                  onChange={(e) => setSelectedStake(Number(e.target.value))}
                  className="flex-1 max-w-xs"
                />
                <span className="text-sm text-muted-foreground">$500+</span>
              </div>
              <div className="text-3xl font-bold text-primary">${selectedStake}</div>
            </div>

            {/* Rewards Breakdown */}
            <div className="bg-white/50 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5 text-success" />
                <h4 className="font-bold">If you complete the challenge:</h4>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-success">
                    ${rewards.stakeBack}+ back + ${rewards.bonus} bonus
                  </div>
                  <p className="text-sm text-muted-foreground">Winners typically earn 18-28% returns</p>
                </div>
                <div className="space-y-2">
                  <div className="text-lg font-medium">Bonus rewards:</div>
                  <div className="text-sm text-muted-foreground">
                    • Challenge completion certificate • Exclusive community access • Streak multiplier bonuses
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span>Rewards vary based on challenge difficulty and actual failure rates</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What If You Fail Section */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
              <Heart className="w-6 h-6 text-orange-600" />
              <h3 className="text-2xl font-bold">What If You Don't Complete It?</h3>
            </div>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              <strong>We're designed to help you win.</strong> But if you don't complete your challenge, we're still
              here to help you bounce back stronger.
            </p>

            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="space-y-4">
                <h4 className="font-bold text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  We Help You Succeed
                </h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Daily reminders and progress tracking</li>
                  <li>• Community support and accountability partners</li>
                  <li>• Flexible proof submission (missed a day? Make it up!)</li>
                  <li>• Real-time coaching when you're struggling</li>
                  <li>• Challenge modifications if life happens</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-lg flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-secondary" />
                  If You Do Fail, We Help You Bounce Back
                </h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Failure analysis to understand what went wrong</li>
                  <li>• Personalized recommendations for your next attempt</li>
                  <li>• Community encouragement from others who've been there</li>
                  <li>• Earned comeback support (complete analysis to unlock help)</li>
                  <li>• Easier "confidence builder" challenges to get back on track</li>
                </ul>
              </div>
            </div>

            <Card className="bg-secondary/5 border-secondary/20">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <h4 className="font-bold text-secondary">The Comeback Stats</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-secondary">67%</div>
                      <div className="text-sm text-muted-foreground">Succeed on 2nd attempt</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-secondary">89%</div>
                      <div className="text-sm text-muted-foreground">Complete within 3 tries</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-secondary">94%</div>
                      <div className="text-sm text-muted-foreground">Learn something valuable</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic text-center">
                    "Failure is data, not defeat. We help you learn and come back stronger."
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="bg-orange-100 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                <strong>Important:</strong> Comeback support is earned, not automatic. We offer help to challengers who
                actually show up and want to get better - complete your failure analysis to unlock personalized support.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points vs Money Option */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-secondary/20 bg-secondary/5">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-secondary">Practice with Points</h3>
              <p className="text-muted-foreground">
                Not ready for real money? Start with 100-2000 points to learn the system risk-free.
              </p>
            </div>
            <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
              Perfect for beginners
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-primary">Stake Real Money</h3>
              <p className="text-muted-foreground">
                Maximum accountability, maximum results. Real stakes create real commitment.
              </p>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Higher success rates
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4">
        <Button onClick={() => onNext()} size="lg" className="text-lg font-bold px-12 py-6">
          I'm Ready to Start
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <p className="text-sm text-muted-foreground">
          Next: Tell us about your goals so we can personalize your experience
        </p>
      </div>
    </div>
  )
}
