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
  const { data: session } = useSession()
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

      // Account created, now sign in
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        setError("Account created but login failed. Please try signing in.")
        return
      }

      // Success! Show level up animation
      setShowLevelUp(true)
      setTimeout(() => {
        handleCompleteOnboarding()
      }, 2000)
    } catch (error) {
      console.error("❌ Error creating account:", error)
      setError("Failed to create account. Please try again.")
    } finally {
      setIsCreatingAccount(false)
    }
  }

  const handleSocialSignIn = async (provider: "google" | "apple" | "facebook") => {
    setIsCreatingAccount(true)
    try {
      await signIn(provider, {
        callbackUrl: "/dashboard",
      })
    } catch (error) {
      setError(`${provider} authentication failed`)
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
          name: name || data.name || "New Champion",
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
        window.location.href = "/dashboard"
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

  // If user is already authenticated, show completion flow
  if (session?.user) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto relative">
        {/* Level Up Animation */}
        {showLevelUp && (
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="animate-bounce">
              <div className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-full text-2xl font-bold shadow-lg flex items-center gap-3">
                <Crown className="w-8 h-8" />
                LEVEL UP! Champion Status Unlocked!
                <Crown className="w-8 h-8" />
              </div>
            </div>
          </div>
        )}

        {/* Confetti Animation */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(20)].map((_, i) => (
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
          <div className="w-40 h-40 mx-auto mb-6 relative">
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center border-4 border-primary/30 animate-pulse">
              <div className="text-8xl">🏆</div>
            </div>
            <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center animate-spin">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-success text-white px-3 py-1 rounded-full text-sm font-bold">
              Champion Level {Math.floor(((data.xp || 0) + 150) / 200) + 1}
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-4">
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            Quest Complete! Champion Status Unlocked! 🎉
          </Badge>
          <h1 className="text-4xl font-bold">
            Welcome to the <span className="text-primary">Champions</span> Circle!
          </h1>
          <p className="text-lg text-muted-foreground">
            You've completed your onboarding quest and earned Champion status. Time to start your first challenge!
          </p>
        </div>

        {/* Achievement Summary */}
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center gap-4">
                <Avatar className="w-20 h-20 border-4 border-primary">
                  <AvatarImage src={data.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {data.name?.charAt(0).toUpperCase() || "C"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <h3 className="text-2xl font-bold">{data.name || "New Champion"}</h3>
                  <p className="text-muted-foreground">
                    Champion • Level {Math.floor(((data.xp || 0) + 150) / 200) + 1}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      <Gift className="w-4 h-4 mr-1" />
                      $25 Welcome Credits
                    </Badge>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      <Trophy className="w-4 h-4 mr-1" />
                      {(data.xp || 0) + 150} XP
                    </Badge>
                  </div>
                </div>
              </div>

              {/* XP Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total XP Earned</span>
                  <span className="text-sm text-muted-foreground">{(data.xp || 0) + 150} XP</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((((data.xp || 0) + 150) / 500) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-bold flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Your Quest Goals:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {data.goals?.slice(0, 3).map((goal, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {goal}
                      </Badge>
                    ))}
                    {(data.goals?.length || 0) > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{(data.goals?.length || 0) - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold flex items-center gap-2">
                    <Star className="w-4 h-4 text-secondary" />
                    Achievements Unlocked:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs bg-success/10 text-success">
                      First Steps
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                      Goal Setter
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-secondary/10 text-secondary">
                      Champion
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final CTA for authenticated users */}
        <div className="text-center space-y-4">
          <Button
            onClick={handleCompleteOnboarding}
            disabled={isLoading}
            size="lg"
            className="text-lg font-bold px-12 py-6 w-full md:w-auto bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Entering Champions Circle...
              </>
            ) : (
              <>
                <Crown className="w-5 h-5 mr-2" />
                Enter Champions Circle (+150 XP)
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>
    )
  }

  // If not authenticated, show account creation
  const canCreateAccount = email.trim() && password.length >= 6

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
              {i % 3 === 0 ? (
                <Star className="w-4 h-4 text-primary" />
              ) : i % 3 === 1 ? (
                <Trophy className="w-4 h-4 text-secondary" />
              ) : (
                <Sparkles className="w-4 h-4 text-success" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Character Illustration */}
      <div className="text-center">
        <div className="w-32 h-32 mx-auto mb-6 relative">
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center border-4 border-primary/30">
            <div className="text-6xl">🏆</div>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-pulse">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-secondary text-white px-2 py-1 rounded-full text-xs font-bold">
            Final Step!
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
          Final Quest Step - Champion Status Awaits! 🎉
        </Badge>
        <h1 className="text-4xl font-bold">
          Claim Your <span className="text-primary">Champion</span> Status!
        </h1>
        <p className="text-lg text-muted-foreground">
          Create your account and join the Champions Circle. You're one step away from unlocking your full potential!
        </p>
      </div>

      {/* Quest Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <h3 className="text-xl font-bold flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              Your Quest Progress
            </h3>

            {/* XP Summary */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">+50</div>
                <div className="text-xs text-muted-foreground">Welcome XP</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-secondary">+{(data.goals?.length || 0) * 5}</div>
                <div className="text-xs text-muted-foreground">Goals XP</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-success">+150</div>
                <div className="text-xs text-muted-foreground">Champion Bonus</div>
              </div>
            </div>

            {/* Total XP */}
            <div className="bg-white/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">Total XP to Earn:</span>
                <span className="text-xl font-bold text-primary">{50 + (data.goals?.length || 0) * 5 + 150} XP</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full w-full animate-pulse" />
              </div>
            </div>

            {/* Goals Preview */}
            <div className="text-left space-y-2">
              <h4 className="font-bold text-center">Your Selected Quest Goals:</h4>
              <div className="flex flex-wrap gap-2 justify-center">
                {data.goals?.slice(0, 4).map((goal, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-primary/10 text-primary">
                    {goal}
                  </Badge>
                ))}
                {(data.goals?.length || 0) > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{(data.goals?.length || 0) - 4} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Creation Form */}
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
              <Crown className="w-6 h-6 text-primary" />
              Create Your Champion Account
            </h3>
            <p className="text-muted-foreground">Secure your progress and unlock Champion status</p>
          </div>

          {/* Social Sign-In Options */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={() => handleSocialSignIn("google")}
                disabled={isCreatingAccount}
                variant="outline"
                size="lg"
                className="h-14 text-lg font-medium bg-white hover:bg-gray-50 border-2 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Become Champion with Google
              </Button>

              <Button
                onClick={() => handleSocialSignIn("apple")}
                disabled={isCreatingAccount}
                variant="outline"
                size="lg"
                className="h-14 text-lg font-medium bg-black hover:bg-gray-900 text-white border-2 border-black"
              >
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.81.87.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Become Champion with Apple
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

          {/* Email/Password Form */}
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
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Joining Champions Circle...
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5 mr-2" />
                  Claim Champion Status (+150 XP)
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Security & Privacy */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <h4 className="font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Champion-Level Security
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>• 256-bit SSL encryption</div>
              <div>• Bank-level security</div>
              <div>• No spam, ever</div>
              <div>• Cancel anytime</div>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <p className="text-xs text-muted-foreground max-w-md mx-auto text-center">
            By creating an account, you agree to our Terms of Service and Privacy Policy. Welcome to the Champions
            Circle!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
