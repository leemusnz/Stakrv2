"use client"

import type React from "react"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Zap, Trophy, Brain, Users, Mail, Lock, Loader2, ArrowRight, Star, Sparkles } from "lucide-react"
import type { OnboardingData } from "@/app/onboarding/page"

interface GamefiedWelcomeStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

export function GamefiedWelcomeStep({ data, onNext }: GamefiedWelcomeStepProps) {
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showXPAnimation, setShowXPAnimation] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else if (result?.ok) {
        // Success! Redirect to dashboard
        window.location.href = "/"
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: "google" | "apple" | "facebook") => {
    setIsLoading(true)
    try {
      await signIn(provider, {
        callbackUrl: "/onboarding", // Redirect back to onboarding to complete profile
      })
    } catch (error) {
      setError(`${provider} authentication failed`)
      setIsLoading(false)
    }
  }

  const handleContinue = () => {
    setShowXPAnimation(true)
    setTimeout(() => {
      onNext()
    }, 1500)
  }

  if (showLogin) {
    return (
      <div className="text-center space-y-8 max-w-md mx-auto">
        {/* Character Illustration */}
        <div className="relative">
          <div className="w-32 h-32 mx-auto mb-6 relative">
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center border-4 border-primary/30">
              <div className="text-6xl">👋</div>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-success rounded-full flex items-center justify-center">
              <Star className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Welcome Back, Champion! 👋
          </Badge>
          <h1 className="text-3xl font-bold">
            Sign In to <span className="text-primary">Stakr</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Welcome back! Continue your accountability journey and level up your habits.
          </p>
        </div>

        <Card>
          <CardContent className="p-8 space-y-6">
            {/* Demo Account Info */}
            <Alert>
              <AlertDescription>
                <strong>Demo Accounts:</strong>
                <br />📧 alex@stakr.app / password123
                <br />📧 demo@stakr.app / demo123
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Social Sign-In Options */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => handleSocialSignIn("google")}
                  disabled={isLoading}
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
                  Continue with Google
                </Button>

                <Button
                  onClick={() => handleSocialSignIn("apple")}
                  disabled={isLoading}
                  variant="outline"
                  size="lg"
                  className="h-14 text-lg font-medium bg-black hover:bg-gray-900 text-white border-2 border-black"
                >
                  <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  Continue with Apple
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
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-lg font-bold flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Address
                </Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-lg p-4 h-14"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password" className="text-lg font-bold flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Password
                </Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-lg p-4 h-14"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                className="text-lg font-bold px-12 py-6 w-full relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In to Stakr
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">New to Stakr?</p>
              <Button variant="ghost" onClick={() => setShowLogin(false)} disabled={isLoading}>
                Create New Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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

          <h1 className="text-5xl font-bold leading-tight">
            Put Your Money Where Your <span className="text-primary">Mouth</span> Is
          </h1>

          <p className="text-xl text-muted-foreground leading-relaxed">
            Stakr isn't just another habit app. We're the accountability platform that uses
            <strong className="text-foreground"> proven psychology</strong> to make you actually follow through on your
            commitments.
          </p>
        </div>

        {/* Gamified Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/20">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
              73% <Trophy className="w-6 h-6" />
            </div>
            <div className="text-sm text-muted-foreground">Success rate vs 23% for free apps</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary flex items-center justify-center gap-2">
              21 <Zap className="w-6 h-6" />
            </div>
            <div className="text-sm text-muted-foreground">Days to form lasting habits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success flex items-center justify-center gap-2">
              $47 <Star className="w-6 h-6" />
            </div>
            <div className="text-sm text-muted-foreground">Average earnings per challenge</div>
          </div>
        </div>

        {/* Value Props with Icons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="space-y-3 p-6 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-lg">Loss Aversion</h3>
            <p className="text-sm text-muted-foreground">
              Humans are 2.5x more motivated to avoid losing money than to gain it. We use this to your advantage.
            </p>
          </div>

          <div className="space-y-3 p-6 rounded-xl bg-secondary/5 border border-secondary/20 hover:bg-secondary/10 transition-colors">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-bold text-lg">Social Accountability</h3>
            <p className="text-sm text-muted-foreground">
              Public commitment increases follow-through by 65%. Your challenges are visible to the community.
            </p>
          </div>

          <div className="space-y-3 p-6 rounded-xl bg-success/5 border border-success/20 hover:bg-success/10 transition-colors">
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

      {/* Gamified CTA */}
      <div className="space-y-4 pt-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={handleContinue}
            size="lg"
            className="text-lg font-bold px-12 py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Zap className="w-5 h-5 mr-2" />
            Start Your Journey (+50 XP)
          </Button>

          <Button
            onClick={() => setShowLogin(true)}
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
