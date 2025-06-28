"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Sparkles, Gift, Mail, Lock, CheckCircle, SnowflakeIcon as Confetti } from "lucide-react"
import { useRouter } from "next/navigation"
import type { OnboardingData } from "@/app/onboarding/page"

interface ReadyToStartStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

export function ReadyToStartStep({ data }: ReadyToStartStepProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Trigger confetti animation when component mounts
    setShowConfetti(true)
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleCreateAccount = async () => {
    setIsCreatingAccount(true)

    // Simulate account creation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // In a real app, this would:
    // 1. Create user account with email/password
    // 2. Save onboarding data to user profile
    // 3. Set up user preferences
    // 4. Redirect to dashboard or first challenge

    console.log("Creating account with data:", {
      email,
      password: "[REDACTED]",
      onboardingData: data,
    })

    // Redirect to dashboard
    router.push("/dashboard")
  }

  const handleSocialSignIn = async (provider: "google" | "facebook" | "apple") => {
    setIsCreatingAccount(true)

    // Simulate social sign-in
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // In a real app, this would:
    // 1. Redirect to OAuth provider
    // 2. Handle OAuth callback
    // 3. Create/link user account
    // 4. Save onboarding data to user profile
    // 5. Redirect to dashboard

    console.log(`Signing in with ${provider}:`, {
      provider,
      onboardingData: data,
    })

    // Redirect to dashboard
    router.push("/dashboard")
  }

  const canCreateAccount = email.trim() && password.length >= 6

  return (
    <div className="space-y-8 max-w-2xl mx-auto relative">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute top-1/4 left-1/4 animate-bounce">
            <Confetti className="w-8 h-8 text-primary" />
          </div>
          <div className="absolute top-1/3 right-1/4 animate-bounce delay-100">
            <Sparkles className="w-6 h-6 text-secondary" />
          </div>
          <div className="absolute top-1/2 left-1/3 animate-bounce delay-200">
            <Confetti className="w-7 h-7 text-success" />
          </div>
          <div className="absolute top-2/3 right-1/3 animate-bounce delay-300">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
          Final Step - You're Almost There! 🎉
        </Badge>
        <h1 className="text-4xl font-bold">
          You're <span className="text-primary">Ready</span> to Start!
        </h1>
        <p className="text-lg text-muted-foreground">
          Create your account and join thousands of people crushing their goals with Stakr.
        </p>
      </div>

      {/* Profile Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-4">
              <Avatar className="w-20 h-20 border-4 border-primary">
                <AvatarImage src={data.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {data.name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <h3 className="text-2xl font-bold">{data.name || "New Challenger"}</h3>
                <p className="text-muted-foreground">Ready to build lasting habits</p>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 mt-2">
                  <Gift className="w-4 h-4 mr-1" />
                  $25 Welcome Credits
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-bold">Your Goals:</h4>
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
                <h4 className="font-bold">Interests:</h4>
                <div className="flex flex-wrap gap-1">
                  {data.interests?.slice(0, 2).map((interest, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-secondary/10 text-secondary">
                      {interest}
                    </Badge>
                  ))}
                  {(data.interests?.length || 0) > 2 && (
                    <Badge variant="outline" className="text-xs bg-secondary/10 text-secondary">
                      +{(data.interests?.length || 0) - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {data.recommendedChallenge && (
              <div className="bg-white/50 rounded-lg p-4">
                <h4 className="font-bold mb-2">Your Perfect Match Challenge:</h4>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">{data.recommendedChallenge.icon}</span>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{data.recommendedChallenge.title}</div>
                    <div className="text-sm text-muted-foreground">{data.recommendedChallenge.duration}</div>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 ml-auto">
                    <Lock className="w-3 h-3 mr-1" />
                    Perfect Match
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Creation Form */}
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold">Create Your Account</h3>
            <p className="text-muted-foreground">Secure your profile and start your first challenge</p>
          </div>

          {/* Social Sign-In Options */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={() => handleSocialSignIn("google")}
                disabled={isCreatingAccount}
                variant="outline"
                size="lg"
                className="h-14 text-lg font-medium bg-white hover:bg-gray-50 border-2"
              >
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
                disabled={isCreatingAccount}
                variant="outline"
                size="lg"
                className="h-14 text-lg font-medium bg-black hover:bg-gray-900 text-white border-2 border-black"
              >
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Continue with Apple
              </Button>

              <Button
                onClick={() => handleSocialSignIn("facebook")}
                disabled={isCreatingAccount}
                variant="outline"
                size="lg"
                className="h-14 text-lg font-medium bg-[#1877F2] hover:bg-[#166FE5] text-white border-2 border-[#1877F2]"
              >
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Continue with Facebook
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
          <div className="space-y-4">
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
              />
              <p className="text-sm text-muted-foreground">Must be at least 6 characters long</p>
            </div>
          </div>

          {/* Security & Privacy */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <h4 className="font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Your Data is Secure
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>• 256-bit SSL encryption</div>
              <div>• Bank-level security</div>
              <div>• No spam, ever</div>
              <div>• Cancel anytime</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What Happens Next */}
      <Card className="bg-secondary/5 border-secondary/20">
        <CardContent className="p-6">
          <h3 className="font-bold mb-4 text-center">What happens next?</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                1
              </div>
              <span>Your account is created instantly</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                2
              </div>
              <span>$25 welcome credits are added to your account</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                3
              </div>
              <span>You can browse challenges or start with your perfect match</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                4
              </div>
              <span>Join your first challenge and start building habits!</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center space-y-4">
        <Button
          onClick={handleCreateAccount}
          disabled={!canCreateAccount || isCreatingAccount}
          size="lg"
          className="text-lg font-bold px-12 py-6 w-full md:w-auto"
        >
          {isCreatingAccount ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Creating Your Account...
            </>
          ) : (
            <>
              Create Account & Start Winning
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        {!canCreateAccount && (
          <p className="text-sm text-muted-foreground">
            Please enter your email and a password (6+ characters) to continue
          </p>
        )}

        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          By creating an account, you agree to our Terms of Service and Privacy Policy. You can cancel anytime with no
          fees.
        </p>
      </div>
    </div>
  )
}
