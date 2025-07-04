"use client"

import { useState, useEffect, Suspense } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const errorParam = searchParams.get('error')
  const messageParam = searchParams.get('message')
  const emailParam = searchParams.get('email')

  useEffect(() => {
    // Handle URL parameters
    if (errorParam) {
      switch (errorParam) {
        case 'CredentialsSignin':
          setError('Invalid email or password')
          break
        case 'email_not_verified':
          setError('Please verify your email address before signing in')
          break
        case 'suspended':
          setError('Your account has been suspended')
          break
        default:
          setError('Sign in failed. Please try again.')
      }
    }

    if (messageParam) {
      setMessage(messageParam)
    }

    // Pre-fill email if provided in URL
    if (emailParam && !email) {
      setEmail(emailParam)
    }

    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push(callbackUrl)
      }
    })
  }, [errorParam, messageParam, emailParam, callbackUrl, router, email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    console.log('🔐 Attempting sign in with:', { email, hasPassword: !!password })

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      console.log('🔐 Sign in result:', result)

      if (result?.ok) {
        // Success - redirect to callback URL
        console.log('✅ Sign in successful, redirecting to:', callbackUrl)
        router.push(callbackUrl)
      } else {
        // Handle specific error types
        const errorCode = result?.error
        console.log('❌ Sign in failed with error:', errorCode)
        
        switch (errorCode) {
          case 'error=email_not_verified':
            setError('Please verify your email address before signing in')
            console.log('📧 Redirecting to verification page')
            // Redirect to verification page
            router.push(`/auth/verify-email?email=${encodeURIComponent(email)}&from=signin`)
            break
          case 'error=suspended':
            setError('Your account has been suspended')
            router.push('/auth/suspended')
            break
          default:
            setError('Invalid email or password')
        }
      }
    } catch (error) {
      console.error("🚨 Sign in exception:", error)
      setError("Connection error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: string) => {
    setIsLoading(true)
    try {
      await signIn(provider, { callbackUrl })
    } catch (error) {
      console.error("Social sign in error:", error)
      setError("Social sign in failed. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Welcome Back to <span className="text-primary">Stakr</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Sign in to continue your challenge journey
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Social Sign In */}
          <div className="space-y-3">
            <Button
              onClick={() => handleSocialSignIn("google")}
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
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button type="submit" disabled={isLoading} size="lg" className="w-full py-6">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Link href="/onboarding" className="text-primary hover:underline">
                Create an account
              </Link>
              <Link href="/auth/forgot-password" className="text-muted-foreground hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Trust Signals */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>🔒 Secure</span>
              <span>📧 No spam</span>
              <span>❌ Cancel anytime</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center space-y-4 p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-muted-foreground text-center">
            Preparing sign in page.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SignInContent />
    </Suspense>
  )
}
