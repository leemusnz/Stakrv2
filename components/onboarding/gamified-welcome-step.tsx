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
    <div className="text-center space-y-4 md:space-y-6 max-w-2xl mx-auto relative px-4">
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

      {/* Character Illustration - Mobile Optimized */}
      <div className="relative">
        <div className="w-20 h-20 md:w-32 md:h-32 mx-auto mb-3 md:mb-4 relative">
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center border-2 md:border-4 border-primary/30 animate-pulse">
            <div className="text-4xl md:text-6xl">🎯</div>
          </div>
          <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-10 md:h-10 bg-primary rounded-full flex items-center justify-center animate-bounce">
            <Sparkles className="w-3 h-3 md:w-5 md:h-5 text-white" />
          </div>
          <div className="absolute -bottom-1 -left-1 md:-bottom-2 md:-left-2 w-4 h-4 md:w-6 md:h-6 bg-secondary rounded-full flex items-center justify-center">
            <Trophy className="w-2 h-2 md:w-3 md:h-3 text-white" />
          </div>
        </div>
      </div>

      {/* Hero Section - Mobile Optimized */}
      <div className="space-y-3 md:space-y-4">
        <div className="space-y-2 md:space-y-3">
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20 text-xs md:text-sm font-bold px-3 py-1 md:px-4 md:py-2 animate-pulse"
          >
            🧠 Backed by behavioral science
          </Badge>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
            Welcome to <span className="text-primary">Stakr</span>
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The accountability platform where you put your money where your mouth is. 
            <strong className="text-foreground"> Stake your goals, prove your progress, and win together.</strong>
          </p>
        </div>

        {/* Value Propositions - Mobile Optimized */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 max-w-4xl mx-auto">
          <div className="flex items-center space-x-3 p-3 md:flex-col md:space-x-0 md:space-y-2 md:p-4 rounded-lg bg-primary/5 border border-primary/10">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <div className="text-left md:text-center">
              <h3 className="font-bold text-xs md:text-sm">Stake & Win</h3>
              <p className="text-xs text-muted-foreground hidden md:block">
                Put money on your goals. Everyone wins when you succeed.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 md:flex-col md:space-x-0 md:space-y-2 md:p-4 rounded-lg bg-secondary/5 border border-secondary/10">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 md:w-5 md:h-5 text-secondary" />
            </div>
            <div className="text-left md:text-center">
              <h3 className="font-bold text-xs md:text-sm">Prove Progress</h3>
              <p className="text-xs text-muted-foreground hidden md:block">
                Submit evidence. Build trust. Stay accountable.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 md:flex-col md:space-x-0 md:space-y-2 md:p-4 rounded-lg bg-success/5 border border-success/10">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-success" />
            </div>
            <div className="text-left md:text-center">
              <h3 className="font-bold text-xs md:text-sm">Community Power</h3>
              <p className="text-xs text-muted-foreground hidden md:block">
                Join thousands achieving their goals together.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action - Mobile Optimized */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex flex-col gap-3 md:gap-4 justify-center items-center">
          <Button
            onClick={handleContinue}
            size="lg"
            className="w-full md:w-auto text-base md:text-lg font-bold px-6 py-4 md:px-8 md:py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden touch-target mobile-button"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Zap className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Start Your Journey (+350 XP)
          </Button>

          <Button
            onClick={() => window.location.href = '/auth/signin'}
            variant="outline"
            size="lg"
            className="w-full md:w-auto text-sm md:text-base font-bold px-6 py-3 md:px-8 md:py-4 bg-transparent hover:bg-primary/10 border-2 border-primary/20 touch-target mobile-button"
          >
            I Already Have an Account
          </Button>
        </div>

        <p className="text-xs md:text-sm text-muted-foreground">
          Join <strong>12,847</strong> people who've already put their money where their mouth is
        </p>
      </div>

    </div>
  )
}