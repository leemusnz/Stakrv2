"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowRight, Mail, Lock, Eye, EyeOff, Sparkles, AlertCircle } from "lucide-react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { OnboardingData } from "@/app/onboarding/page"

interface InstantAuthStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

export function InstantAuthStep({ data, onNext }: InstantAuthStepProps) {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (isLogin) {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })
        if (result?.ok) {
          onNext({ name: email.split("@")[0] })
        } else {
          setError(result?.error || "Invalid email or password")
        }
      } else {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            name,
            onboardingData: data,
          }),
        })
        
        const result = await response.json()
        
        if (response.ok && result.success) {
          // Redirect to email verification instead of continuing onboarding
          if (result.emailSent) {
            // Use Next.js router for proper navigation
            const verifyUrl = `/auth/verify-email?email=${encodeURIComponent(email)}&from=onboarding`
            console.log('📧 Redirecting to email verification:', verifyUrl)
            router.push(verifyUrl)
          } else {
            // Fallback if email sending failed - continue with onboarding
            console.log('⚠️ Email not sent, continuing with onboarding')
            onNext({ name })
          }
        } else {
          setError(result.message || result.error || "Failed to create account")
        }
      }
    } catch (error) {
      console.error("Auth error:", error)
      setError("Connection error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialAuth = async (provider: string) => {
    setIsLoading(true)
    try {
      await signIn(provider, { callbackUrl: "/discover" })
    } catch (error) {
      console.error("Social auth error:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-md mx-auto px-4">
      {/* Header */}
      <div className="text-center space-y-3">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          Final Step
        </Badge>
        <h1 className="text-2xl font-bold">
          <span className="text-primary">Almost</span> There!
        </h1>
        <p className="text-sm text-muted-foreground">Create your account to start building better habits</p>
      </div>

      {/* Social Auth - Priority */}
      <div className="space-y-3">
        <Button
          onClick={() => handleSocialAuth("google")}
          disabled={isLoading}
          variant="outline"
          size="lg"
          className="w-full py-6 border-2"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>
      </div>

      {/* Email Form */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isLoading} size="lg" className="w-full py-6">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isLogin ? "Sign In" : "Start My Journey"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center mt-4">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-primary hover:underline">
              {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Trust Signals */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>🔒 Secure</span>
          <span>📧 No spam</span>
          <span>❌ Cancel anytime</span>
        </div>
        <p className="text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
