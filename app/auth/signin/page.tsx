"use client"

import { useState, useEffect, Suspense } from "react"
import { BackgroundImage } from '@/components/ui/background-image'
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
        case 'oauth_account_exists':
          setError('This account was created with Google. Please sign in with Google instead.')
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
        // Success - wait for session cookie to be readable before navigating
        // to protected routes, otherwise middleware can bounce the user back.
        let sessionReady = false
        for (let attempt = 0; attempt < 8; attempt++) {
          const session = await getSession()
          if (session?.user) {
            sessionReady = true
            break
          }
          await new Promise((resolve) => setTimeout(resolve, 150))
        }

        if (!sessionReady) {
          setError("Signed in, but session is still initializing. Please try again.")
          return
        }

        console.log('✅ Sign in successful, redirecting to:', callbackUrl)
        window.location.href = callbackUrl
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
          case 'CredentialsSignin':
            // Check if this might be an OAuth-only account
            // NextAuth doesn't pass custom error codes, so we show a helpful message
            setError('Invalid email or password. If you signed up with Google, please use "Continue with Google" instead.')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <BackgroundImage 
          src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=80"
          alt="Sign in background"
          className="w-full h-full object-cover grayscale-[30%] dark:grayscale-[50%]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/70 to-white/80 dark:from-black/80 dark:via-black/70 dark:to-black/80"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black via-transparent to-white/50 dark:to-black/50"></div>
      </div>

      {/* Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#F46036] rounded-full mix-blend-screen filter blur-[120px] opacity-10 dark:opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#D74E25] rounded-full mix-blend-screen filter blur-[100px] opacity-[0.07] dark:opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Noise Texture */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-heading font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
            Welcome Back to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F46036] to-[#D74E25]">Stakr</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-body">
            Sign in to continue your challenge journey
          </p>
        </div>

        {/* Main Card - Themed Glass HUD */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
          
          <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <div className="relative p-8 space-y-6">
              {/* Success Message */}
              {message && (
                <div className="bg-green-500/10 border border-green-500/20 backdrop-blur-sm rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-green-700 dark:text-green-300 text-sm font-medium">{message}</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-sm rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Social Sign In */}
              <div className="space-y-4">
                <Button
                  onClick={() => handleSocialSignIn("google")}
                  disabled={isLoading}
                  variant="outline"
                  size="lg"
                  className="w-full h-14 bg-white/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-white hover:bg-white dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white backdrop-blur-sm transition-all duration-300 font-heading font-medium"
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
                    <div className="w-full border-t border-slate-300 dark:border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white/80 dark:bg-black/40 px-3 text-slate-600 dark:text-slate-400 font-medium">Or</span>
                  </div>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-3">
                  <label className="text-sm font-heading font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Email</label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-14 pl-12 bg-slate-100/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#F46036] focus:ring-2 focus:ring-[#F46036]/20 backdrop-blur-sm transition-all duration-300 font-body"
                    />
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#F46036]/10 to-[#D74E25]/10 opacity-0 group-hover/input:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-heading font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Password</label>
                  <div className="relative group/input">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-14 pl-12 pr-12 bg-slate-100/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#F46036] focus:ring-2 focus:ring-[#F46036]/20 backdrop-blur-sm transition-all duration-300 font-body"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#F46036]/10 to-[#D74E25]/10 opacity-0 group-hover/input:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  size="lg" 
                  className="w-full h-14 bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] text-white font-heading font-bold text-lg shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-[1.02] rounded-xl"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              {/* Footer Links */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <Link href="/onboarding" className="text-[#F46036] hover:text-[#ff724c] font-medium transition-colors">
                    Create an account
                  </Link>
                  <Link href="/auth/forgot-password" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Trust Signals */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-center gap-6 text-xs text-slate-600 dark:text-slate-400 font-body">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Secure
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    No spam
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Cancel anytime
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
