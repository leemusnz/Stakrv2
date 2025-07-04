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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowRight, Mail, Lock, Loader2, Gift, Chrome, Apple, Facebook } from "lucide-react"
import type { OnboardingData } from "@/app/onboarding/page"

interface IntegratedAuthStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

export function IntegratedAuthStep({ data, onNext }: IntegratedAuthStepProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSignUp, setIsSignUp] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (isSignUp) {
        // Create account
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            name,
            confirmPassword: password,
          }),
        })

        const result = await response.json()
        if (!response.ok) {
          setError(result.message || "Failed to create account")
          return
        }
      }

      // Sign in
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        setError("Invalid email or password")
      } else if (signInResult?.ok) {
        onNext({
          authenticated: true,
          user: { email, name: name || email.split("@")[0] },
        })
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
        callbackUrl: "/",
      })
    } catch (error) {
      setError(`${provider} authentication failed`)
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      {/* Header with Context */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          Step 3 of 4 - Almost There! 🎉
        </Badge>
        <h1 className="text-3xl font-bold">
          Create Your <span className="text-primary">Stakr</span> Account
        </h1>
        <p className="text-muted-foreground">Secure your progress and join the accountability community</p>
      </div>

      {/* Progress Preview */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {name.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{name || "Your Profile"}</h3>
              <div className="flex flex-wrap gap-1 mt-2">
                {data.interests?.slice(0, 3).map((interest, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
            <Badge className="bg-success/10 text-success border-success/20">
              <Gift className="w-4 h-4 mr-1" />
              $25 Credits
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Auth Form */}
      <Card>
        <CardContent className="p-8 space-y-6">
          {/* Social Options */}
          <div className="space-y-3">
            <Button
              onClick={() => handleSocialSignIn("google")}
              disabled={isLoading}
              variant="outline"
              size="lg"
              className="w-full h-12 text-base font-medium"
            >
              <Chrome className="w-5 h-5 mr-3" />
              Continue with Google
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleSocialSignIn("apple")}
                disabled={isLoading}
                variant="outline"
                size="lg"
                className="h-12 bg-black text-white hover:bg-gray-900"
              >
                <Apple className="w-5 h-5 mr-2" />
                Apple
              </Button>
              <Button
                onClick={() => handleSocialSignIn("facebook")}
                disabled={isLoading}
                variant="outline"
                size="lg"
                className="h-12 bg-[#1877F2] text-white hover:bg-[#166FE5]"
              >
                <Facebook className="w-5 h-5 mr-2" />
                Facebook
              </Button>
            </div>
          </div>

          <div className="relative">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-2 text-xs text-muted-foreground">Or with email</span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={isSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} size="lg" className="w-full text-base font-bold py-6">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? "Creating Account..." : "Signing In..."}
                </>
              ) : (
                <>
                  {isSignUp ? "Create Account & Continue" : "Sign In & Continue"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle Sign In/Up */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              {isSignUp ? "Already have an account?" : "New to Stakr?"}
            </p>
            <Button variant="ghost" onClick={() => setIsSignUp(!isSignUp)} disabled={isLoading}>
              {isSignUp ? "Sign In Instead" : "Create New Account"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Note */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          🔒 Your data is encrypted and secure. We never share your information.
        </p>
      </div>
    </div>
  )
}
