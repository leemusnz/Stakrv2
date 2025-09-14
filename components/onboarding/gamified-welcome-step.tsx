"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Trophy, Brain, Users, Star, Sparkles } from "lucide-react"
import type { OnboardingData } from "@/app/onboarding/page"

interface GamefiedWelcomeStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

export function GamefiedWelcomeStep({ data, onNext }: GamefiedWelcomeStepProps) {
  const [showXPAnimation, setShowXPAnimation] = useState(false)


  const handleContinue = () => {
    setShowXPAnimation(true)
    setTimeout(() => {
      onNext()
    }, 1500)
  }

  return (
    <div className="text-center space-y-8 max-w-2xl mx-auto relative">
      {/* XP Animation */}
      {showXPAnimation && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce">
            <div className="bg-primary text-primary-foreground px-6 py-3 rounded-full text-xl font-bold shadow-lg">
              +50 XP! 🎉
            </div>
          </div>
        </div>
      )}

      {/* Character Illustration */}
      <div className="relative">
        <div className="w-40 h-40 mx-auto mb-6 relative">
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center border-4 border-primary/30 animate-pulse">
            <div className="text-8xl">🎯</div>
          </div>
          <div className="absolute -top-2 -right-2 w-12 h-12 bg-primary rounded-full flex items-center justify-center animate-bounce">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="space-y-6">
        <div className="space-y-4">
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20 text-sm font-bold px-4 py-2 animate-pulse"
          >
            🧠 Backed by behavioral science
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome to <span className="text-primary">Stakr</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The accountability platform where you put your money where your mouth is. 
            <strong className="text-foreground"> Stake your goals, prove your progress, and win together.</strong>
          </p>
        </div>

        {/* Value Propositions */}
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/10">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-sm">Stake & Win</h3>
            <p className="text-xs text-muted-foreground text-center">
              Put money on your goals. Everyone wins when you succeed.
            </p>
          </div>
          
          <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-secondary/5 border border-secondary/10">
            <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-bold text-sm">Prove Progress</h3>
            <p className="text-xs text-muted-foreground text-center">
              Submit evidence. Build trust. Stay accountable.
            </p>
          </div>
          
          <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-success/5 border border-success/10">
            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-success" />
            </div>
            <h3 className="font-bold text-sm">Community Power</h3>
            <p className="text-xs text-muted-foreground text-center">
              Join thousands achieving their goals together.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={handleContinue}
            size="lg"
            className="text-lg font-bold px-8 py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Zap className="w-5 h-5 mr-2" />
            Start Your Journey (+350 XP)
          </Button>

          <Button
            onClick={() => window.location.href = '/auth/signin'}
            variant="outline"
            size="lg"
            className="text-lg font-bold px-8 py-6 bg-transparent hover:bg-primary/10 border-2 border-primary/20"
          >
            I Already Have an Account
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Join <strong>12,847</strong> people who've already put their money where their mouth is
        </p>
      </div>

    </div>
  )
}