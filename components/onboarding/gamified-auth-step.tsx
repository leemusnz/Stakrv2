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
import { ArrowRight, Mail, Lock, Crown, User } from "lucide-react"
import type { OnboardingData } from "@/app/onboarding/page"

interface GamefiedAuthStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

export function GamefiedAuthStep({ data, onNext }: GamefiedAuthStepProps) {
  const { data: session, update } = useSession()
  const [name, setName] = useState(data.name || "")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLevelUp, setShowLevelUp] = useState(false)

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
  
  // Always show the account creation form in onboarding
  const canCreateAccount = email.trim() && password.length >= 6 && name.trim()

  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl mx-auto relative px-4">
      {/* Header - Mobile Optimized */}
      <div className="text-center space-y-3">
        <Badge variant="outline" className="bg-white/5 text-slate-500 dark:text-slate-400 border-white/10 text-xs font-medium backdrop-blur-sm">
          Final Step • Secure Your Progress
        </Badge>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold leading-tight text-foreground">
          Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F46036] to-[#D74E25]">Elite</span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground">
          Create your account to save your quest progress and unlock the full dashboard.
        </p>
      </div>

      {/* Social Sign In Options */}
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialSignIn("google")}
          disabled={isCreatingAccount}
          className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:text-foreground text-muted-foreground font-medium transition-all"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full bg-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground font-heading tracking-widest">Or continue with email</span>
          </div>
        </div>
      </div>

      {/* Email/Password Form */}
      {isAuthenticated ? (
        <div className="space-y-4 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-[#F46036]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-6 h-6 text-[#F46036]" />
            </div>
            <h3 className="text-xl font-heading font-bold text-foreground">
              Welcome back, {session.user.name || "Champion"}!
            </h3>
            <p className="text-sm text-muted-foreground">
              You're signed in! Just complete your profile to finish onboarding.
            </p>
          </div>

          <Button
            onClick={() => onNext()}
            disabled={isLoading}
            size="lg"
            className="w-full h-12 bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all"
          >
            {isLoading ? "Finalizing..." : "Complete Setup"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      ) : (
        <form onSubmit={handleCreateAccount} className="space-y-4 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-xl">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-heading uppercase tracking-wider text-muted-foreground ml-1">
              Identity
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 bg-black/20 border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:border-[#F46036] focus:ring-[#F46036]/20 transition-all h-12"
                required
                disabled={isCreatingAccount}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-heading uppercase tracking-wider text-muted-foreground ml-1">
              Communication
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-black/20 border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:border-[#F46036] focus:ring-[#F46036]/20 transition-all h-12"
                required
                disabled={isCreatingAccount}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-heading uppercase tracking-wider text-muted-foreground ml-1">
              Security
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-black/20 border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:border-[#F46036] focus:ring-[#F46036]/20 transition-all h-12"
                minLength={6}
                required
                disabled={isCreatingAccount}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={!canCreateAccount || isCreatingAccount}
            size="lg"
            className={`
              w-full h-14 mt-4 text-lg font-bold rounded-xl shadow-lg transition-all duration-300
              ${canCreateAccount 
                ? 'bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] hover:scale-[1.02] text-white shadow-orange-500/20' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
              }
            `}
          >
            {isCreatingAccount ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating Account...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Initialize Account</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </Button>
        </form>
      )}
    </div>
  )
}
