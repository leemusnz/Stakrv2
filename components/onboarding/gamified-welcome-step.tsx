"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Trophy, Brain, Users, Sparkles } from "lucide-react"
import type { OnboardingData } from "@/app/onboarding/page"
import { ChallengeCardNew } from "@/components/challenge-card-new"

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
    <div className="text-center space-y-8 max-w-6xl mx-auto relative px-4">
      {/* XP Animation */}
      {showXPAnimation && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <motion.div 
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="bg-gradient-to-r from-[#F46036] to-[#D74E25] text-white px-8 py-4 rounded-2xl text-2xl font-heading font-bold shadow-2xl shadow-orange-500/50 flex items-center gap-3"
          >
            <Sparkles className="w-6 h-6 animate-spin-slow" />
            +50 XP Unlocked!
          </motion.div>
        </div>
      )}

      {/* Hero Section with Floating Cards */}
      <div className="grid lg:grid-cols-2 gap-12 items-center pt-8 pb-8">
        
        {/* Left: Copy */}
        <div className="text-left space-y-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <Badge
              variant="outline"
              className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-sm font-bold px-4 py-2 animate-pulse"
            >
              🧠 The Accountability Platform
            </Badge>
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground leading-tight tracking-tight">
              Put Your Money <br/>
              Where Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F46036] to-[#D74E25]">Mouth Is.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed font-medium max-w-xl">
              Stakr is the gamified platform where you stake on your goals. Prove your progress, build streaks, and win the pot.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              onClick={handleContinue}
              size="lg"
              className="text-lg font-bold px-8 py-6 bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] shadow-lg shadow-orange-500/20 transition-all duration-300 group relative overflow-hidden rounded-xl w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Zap className="w-5 h-5 mr-2 fill-white/20" />
              Start Your Journey
            </Button>

            <Button
              onClick={() => window.location.href = '/auth/signin'}
              variant="outline"
              size="lg"
              className="text-base font-medium px-8 py-6 w-full sm:w-auto border-white/10 hover:bg-white/5"
            >
              Login
            </Button>
          </motion.div>

          <div className="pt-8 grid grid-cols-3 gap-4 border-t border-white/10">
            <div>
              <h4 className="font-heading font-bold text-2xl">12k+</h4>
              <p className="text-xs text-muted-foreground">Active Users</p>
            </div>
            <div>
              <h4 className="font-heading font-bold text-2xl">$1.2M</h4>
              <p className="text-xs text-muted-foreground">Staked</p>
            </div>
            <div>
              <h4 className="font-heading font-bold text-2xl">94%</h4>
              <p className="text-xs text-muted-foreground">Success Rate</p>
            </div>
          </div>
        </div>

        {/* Right: Floating Cards Visual */}
        <div className="relative h-[500px] w-full hidden lg:block">
          {/* Background Blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-orange-500/20 to-blue-600/20 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" />

          {/* Floating Card 1 (Back) */}
          <motion.div 
            className="absolute top-0 right-10 z-0 scale-90 opacity-60 blur-[1px]"
            animate={{ 
              y: [0, -20, 0],
              rotate: [5, 7, 5]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChallengeCardNew
              title="Early Riser Club"
              category="Productivity"
              participants={842}
              stakeAmount={25}
              duration="14 Days"
              difficulty="Medium"
              progress={0}
              imageUrl="https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80"
            />
          </motion.div>

          {/* Floating Card 2 (Back Left) */}
          <motion.div 
            className="absolute bottom-10 left-0 z-0 scale-90 opacity-60 blur-[1px]"
            animate={{ 
              y: [0, 25, 0],
              rotate: [-5, -8, -5]
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <ChallengeCardNew
              title="Digital Detox"
              category="Mindfulness"
              participants={320}
              stakeAmount={100}
              duration="7 Days"
              difficulty="Hard"
              progress={0}
              imageUrl="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80"
            />
          </motion.div>

          {/* Hero Card (Front) */}
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 shadow-2xl shadow-black/50"
            animate={{ 
              y: [0, -15, 0],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChallengeCardNew
              title="30-Day Fitness Streak"
              category="Fitness"
              participants={1234}
              stakeAmount={50}
              duration="30 Days"
              difficulty="Medium"
              isPopular={true}
              progress={0}
              imageUrl="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"
            />
          </motion.div>
        </div>
      </div>

      {/* Mobile Card Preview (Only visible on small screens) */}
      <div className="lg:hidden pb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-blue-600/20 blur-3xl" />
          <ChallengeCardNew
            title="30-Day Fitness Streak"
            category="Fitness"
            participants={1234}
            stakeAmount={50}
            duration="30 Days"
            difficulty="Medium"
            isPopular={true}
            progress={0}
            imageUrl="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"
          />
        </div>
      </div>

      {/* Live Activity Ticker */}
      <div className="w-full overflow-hidden bg-white/5 border-y border-white/5 py-3 mb-8 backdrop-blur-sm">
        <motion.div 
          className="flex gap-8 items-center whitespace-nowrap"
          animate={{ x: [0, -1000] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          {[
            "🔥 Sarah just won $120 in Fitness Challenge",
            "🚀 Mike started a 30-day streak",
            "💪 Alex joined the 5AM Club",
            "💰 Jessica staked $50 on Learning Spanish",
            "🏆 David completed 'No Sugar' Challenge",
            "🔥 Sarah just won $120 in Fitness Challenge",
            "🚀 Mike started a 30-day streak",
            "💪 Alex joined the 5AM Club",
            "💰 Jessica staked $50 on Learning Spanish",
            "🏆 David completed 'No Sugar' Challenge",
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-[#F46036] animate-pulse" />
              {text}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Value Props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto pb-8">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors text-left">
          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
            <Trophy className="w-6 h-6 text-[#F46036]" />
          </div>
          <h3 className="font-heading font-bold text-lg mb-2">Win The Pot</h3>
          <p className="text-sm text-muted-foreground">
            Everyone who completes the challenge splits the pot. Make money by betting on yourself.
          </p>
        </div>
        
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors text-left">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
            <Brain className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="font-heading font-bold text-lg mb-2">Prove It</h3>
          <p className="text-sm text-muted-foreground">
            Our verification system ensures fair play. Upload photos, GPS data, or fitness stats.
          </p>
        </div>
        
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors text-left">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="font-heading font-bold text-lg mb-2">Squad Up</h3>
          <p className="text-sm text-muted-foreground">
            Join thousands of others. Accountability is easier when you're not alone.
          </p>
        </div>
      </div>
    </div>
  )
}