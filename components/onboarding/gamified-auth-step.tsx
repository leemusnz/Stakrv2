"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession, signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Sparkles, Gift, CheckCircle, Mail, Lock, Loader2, Trophy, Star, Crown, Target, User } from "lucide-react"
import type { OnboardingData } from "@/app/onboarding/page"

interface GamefiedAuthStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

export function GamefiedAuthStep({ data }: GamefiedAuthStepProps) {
  const { data: session, update } = useSession()
  const [showConfetti, setShowConfetti] = useState(false)
  const [name, setName] = useState(data.name || "")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLevelUp, setShowLevelUp] = useState(false)

  useEffect(() => {
    // Trigger confetti animation when component mounts
    setShowConfetti(true)
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingAccount(true)
    setError(null)

    try {
      // First create the account
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name: name || "New Champion",
          confirmPassword: password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || result.error || "Failed to create account")
        return
      }

      // Account created successfully! Redirect to email verification
      console.log("✅ Account created successfully! Redirecting to email verification...")
      
      // Redirect to email verification page
      const verifyUrl = `/auth/verify-email?email=${encodeURIComponent(email)}&from=onboarding`
      window.location.href = verifyUrl
    } catch (error) {
      console.error("❌ Error creating account:", error)
      setError("Failed to create account. Please try again.")
    } finally {
      setIsCreatingAccount(false)
    }
  }

  const handleCompleteOnboarding = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/onboarding/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: session?.user?.name || data.name || "New Champion",
          avatar: data.avatar,
          goals: data.goals,
          interests: data.interests,
          experience: data.experience,
          motivation: data.motivation,
          preferredStakeRange: data.preferredStakeRange,
          xp: (data.xp || 0) + 150,
          level: data.level || 1,
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log("✅ Onboarding completed successfully!")
        
        // Update session to reflect onboarding completion
        try {
          await update({
            user: {
              ...session?.user,
              onboardingCompleted: true
            }
          })
          console.log("✅ Session updated with onboarding completion")
        } catch (updateError) {
          console.error("❌ Failed to update session:", updateError)
        }
        
        // Redirect to home page which will handle proper routing
        window.location.href = "/"
      } else {
        console.error("❌ Failed to complete onboarding:", result.error)
        setError(result.message || "Failed to complete onboarding")
      }
    } catch (error) {
      console.error("❌ Error completing onboarding:", error)
      setError("An error occurred while completing onboarding")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: "google" | "apple" | "facebook") => {
    setIsCreatingAccount(true)
    try {
      await signIn(provider, { 
        callbackUrl: '/' // Redirect to home page which will handle proper routing
      })
    } catch (error) {
      setError(`${provider} authentication failed`)
      setIsCreatingAccount(false)
    }
  }

  // Check if user is already authenticated (OAuth users)
  const isAuthenticated = session?.user
  
  // Always show the account creation form in onboarding
  const canCreateAccount = email.trim() && password.length >= 6 && name.trim()

  return (
    <div className="space-y-8 max-w-2xl mx-auto relative">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className={`absolute animate-bounce`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              {i % 4 === 0 ? (
                <Star className="w-6 h-6 text-primary" />
              ) : i % 4 === 1 ? (
                <Trophy className="w-6 h-6 text-secondary" />
              ) : i % 4 === 2 ? (
                <Sparkles className="w-6 h-6 text-success" />
              ) : (
                <Gift className="w-6 h-6 text-primary" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Character Illustration */}
      <div className="text-center">
        <div className="w-32 h-32 mx-auto mb-6 relative">
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center border-4 border-primary/30 animate-pulse">
            <div className="text-6xl">🏆</div>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center animate-spin">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-success text-white px-3 py-1 rounded-full text-sm font-bold">
            Champion Level {Math.floor(((data.xp || 0) + 150) / 200) + 1}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          Final Step: Create Your Account! 🎯
        </Badge>
        <h1 className="text-4xl font-bold">
          Join the <span className="text-primary">Champions</span> Circle!
        </h1>
        <p className="text-lg text-muted-foreground">
          Create your account to complete your onboarding quest and unlock Champion status!
        </p>
      </div>

      {/* Social Sign In Options */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialSignIn("google")}
            disabled={isCreatingAccount}
            className="w-full h-12 text-base font-semibold"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>
      </div>

      {/* Email/Password Form or OAuth Completion */}
      {isAuthenticated ? (
        // OAuth users - show completion form
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
              <Crown className="w-6 h-6 text-primary" />
              Complete Your Profile
            </h3>
            <p className="text-muted-foreground">
              You're signed in! Just complete your profile to finish onboarding.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Welcome, {session.user.name || session.user.email}! You're all set to join the Champions Circle.
              </p>
            </div>

            <Button
              onClick={handleCompleteOnboarding}
              disabled={isLoading}
              size="lg"
              className="text-lg font-bold px-12 py-6 w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Completing Profile...
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5 mr-2" />
                  Complete Profile & Join Champions Circle (+150 XP)
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            {error && (
              <div className="text-center">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // New users - show account creation form
        <form onSubmit={handleCreateAccount} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-lg font-bold flex items-center gap-2">
            <User className="w-5 h-5" />
            Your Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your first name or nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-lg p-4 h-14"
            required
            disabled={isCreatingAccount}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-lg font-bold flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-lg p-4 h-14"
            required
            disabled={isCreatingAccount}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-lg font-bold flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a secure password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-lg p-4 h-14"
            minLength={6}
            required
            disabled={isCreatingAccount}
          />
          <p className="text-sm text-muted-foreground">Must be at least 6 characters long</p>
        </div>

        <Button
          type="submit"
          disabled={!canCreateAccount || isCreatingAccount}
          size="lg"
          className="text-lg font-bold px-12 py-6 w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          {isCreatingAccount ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Creating Account...
            </>
          ) : (
            <>
              <Crown className="w-5 h-5 mr-2" />
              Create Account & Join Champions Circle (+150 XP)
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        {error && (
          <div className="text-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}
      </form>
      )}
    </div>
  )
}
