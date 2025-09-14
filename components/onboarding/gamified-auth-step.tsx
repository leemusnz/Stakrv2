"use client"

import type React from "react"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { useSession, signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Mail, Lock, Crown, User } from "lucide-react"
import type { OnboardingData } from "@/app/onboarding/page"

interface GamefiedAuthStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

export interface GamefiedAuthStepRef {
  canProceed: boolean
  createAccount: () => Promise<void>
}

export const GamefiedAuthStep = forwardRef<GamefiedAuthStepRef, GamefiedAuthStepProps>(({ data, onNext }, ref) => {
  const { data: session, update } = useSession()
  const [name, setName] = useState(data.name || "")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLevelUp, setShowLevelUp] = useState(false)

  // Expose form validation state to parent component
  const canCreateAccount = email.trim() && password.length >= 6 && name.trim()

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    canProceed: isAuthenticated || canCreateAccount,
    createAccount: handleCreateAccount
  }), [isAuthenticated, canCreateAccount])

  const handleCreateAccount = async () => {
    if (isAuthenticated) {
      // OAuth user - just proceed
      onNext()
      return
    }

    if (!canCreateAccount) {
      setError("Please fill in all required fields")
      return
    }

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

  // Onboarding completion is now handled by the parent page.tsx
  // This function is no longer needed

  const handleSocialSignIn = async (provider: "google" | "apple" | "facebook") => {
    setIsCreatingAccount(true)
    try {
      await signIn(provider, { 
        callbackUrl: '/onboarding' // Redirect back to onboarding to complete profile
      })
    } catch (error) {
      setError(`${provider} authentication failed`)
      setIsCreatingAccount(false)
    }
  }

  // Check if user is already authenticated (OAuth users)
  const isAuthenticated = session?.user
  
  // Auto-complete profile for OAuth users
  useEffect(() => {
    if (isAuthenticated && !isLoading && session?.user?.id) {
      console.log("🔄 OAuth user detected, auto-completing profile...")
      // Add small delay to ensure session is fully loaded
      const timer = setTimeout(() => {
        onNext()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, isLoading, session?.user?.id, onNext])
  
  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl mx-auto relative px-4">
      {/* Character Illustration - Mobile Optimized */}
      <div className="text-center">
        <div className="w-20 h-20 md:w-28 md:h-28 mx-auto mb-3 md:mb-4 relative">
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center border-2 md:border-4 border-primary/30 animate-pulse">
            <div className="text-4xl md:text-5xl">🏆</div>
          </div>
          <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center animate-spin">
            <Crown className="w-3 h-3 md:w-4 md:h-4 text-white" />
          </div>
          <div className="absolute -bottom-1 md:-bottom-2 left-1/2 transform -translate-x-1/2 bg-success text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-bold">
            Champion Level {Math.floor(((data.xp || 0) + 150) / 200) + 1}
          </div>
        </div>
      </div>

      {/* Header - Mobile Optimized */}
      <div className="text-center space-y-2 md:space-y-3">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs md:text-sm">
          Final Step: Create Your Account! 🎯
        </Badge>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
          Join the <span className="text-primary">Champions</span> Circle!
        </h1>
        <p className="text-sm md:text-base lg:text-lg text-muted-foreground">
          Create your account to complete your onboarding quest and unlock Champion status!
        </p>
      </div>

      {/* Social Sign In Options - Mobile Optimized */}
      <div className="space-y-3 md:space-y-4">
        <div className="grid grid-cols-1 gap-2 md:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialSignIn("google")}
            disabled={isCreatingAccount}
            className="w-full h-10 md:h-12 text-sm md:text-base font-semibold"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" viewBox="0 0 24 24">
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
        <div className="space-y-3 md:space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-xl md:text-2xl font-bold flex items-center justify-center gap-1 md:gap-2">
              <Crown className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              Complete Your Profile
            </h3>
            <p className="text-sm md:text-base text-muted-foreground">
              You're signed in! Just complete your profile to finish onboarding.
            </p>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm md:text-base text-muted-foreground">
                Welcome, {session.user.name || session.user.email}! You're all set to join the Champions Circle.
              </p>
            </div>

            {/* OAuth completion is handled by the unified footer button */}

            {error && (
              <div className="text-center">
                <p className="text-xs md:text-sm text-red-500">{error}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // New users - show account creation form
        <div className="space-y-3 md:space-y-4">
        <div className="space-y-1 md:space-y-2">
          <Label htmlFor="name" className="text-sm md:text-base font-bold flex items-center gap-1 md:gap-2">
            <User className="w-4 h-4 md:w-5 md:h-5" />
            Your Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your first name or nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-sm md:text-base p-3 md:p-4 h-11 md:h-14 mobile-input"
            required
            disabled={isCreatingAccount}
          />
        </div>

        <div className="space-y-1 md:space-y-2">
          <Label htmlFor="email" className="text-sm md:text-base font-bold flex items-center gap-1 md:gap-2">
            <Mail className="w-4 h-4 md:w-5 md:h-5" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-sm md:text-base p-3 md:p-4 h-11 md:h-14 mobile-input"
            required
            disabled={isCreatingAccount}
          />
        </div>

        <div className="space-y-1 md:space-y-2">
          <Label htmlFor="password" className="text-sm md:text-base font-bold flex items-center gap-1 md:gap-2">
            <Lock className="w-4 h-4 md:w-5 md:h-5" />
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a secure password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-sm md:text-base p-3 md:p-4 h-11 md:h-14 mobile-input"
            minLength={6}
            required
            disabled={isCreatingAccount}
          />
          <p className="text-xs md:text-sm text-muted-foreground">Must be at least 6 characters long</p>
        </div>

        {/* Form submission is handled by the unified footer button */}

        {error && (
          <div className="text-center">
            <p className="text-xs md:text-sm text-red-500">{error}</p>
          </div>
        )}
      </div>
      )}
    </div>
  )
})
