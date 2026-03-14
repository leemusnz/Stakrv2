"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Mail, AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendResult, setResendResult] = useState<string | null>(null)
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean
    message: string
    email?: string
  } | null>(null)
  const [manualToken, setManualToken] = useState("")

  // Check if there's a token in the URL (from email link)
  const urlToken = searchParams.get('token')
  const email = searchParams.get('email')
  const fromSource = searchParams.get('from')

  useEffect(() => {
    // If there's a token in the URL, verify it automatically
    if (urlToken && !verificationResult) {
      verifyToken(urlToken)
    }
  }, [urlToken, verificationResult])

  const verifyToken = async (token: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const result = await response.json()
      setVerificationResult(result)

      // If successful, automatically sign in the user
      if (result.success) {
        console.log('✅ Email verified successfully!')
        
        // Automatically sign in the user using verification provider
        try {
          console.log('🔄 Attempting auto sign-in with verification provider...')
          console.log('📧 Email:', result.email)
          console.log('🆔 User ID:', result.userId)
          
          const signInResult = await signIn('verification', {
            email: result.email,
            userId: result.userId,
            redirect: false,
          })

          console.log('📊 Sign-in result:', signInResult)

          if (signInResult?.ok) {
            console.log('✅ Auto sign-in successful!')
            console.log('🎯 User onboarding status after sign-in:', signInResult?.user?.onboardingCompleted)
            console.log('🚀 Redirecting to onboarding page...')
            window.location.href = '/onboarding'
          } else {
            console.log('❌ Auto sign-in failed, redirecting to signin page')
            console.log('❌ Sign-in error:', signInResult?.error)
            const signinUrl = `/auth/signin?email=${encodeURIComponent(result.email || email || '')}&message=${encodeURIComponent('Email verified! Please sign in to continue.')}`
            window.location.href = signinUrl
          }
        } catch (signInError) {
          console.error('❌ Auto sign-in failed:', signInError)
          const signinUrl = `/auth/signin?email=${encodeURIComponent(result.email || email || '')}&message=${encodeURIComponent('Email verified! Please sign in to continue.')}`
          window.location.href = signinUrl
        }
      }
    } catch (error) {
      setVerificationResult({
        success: false,
        message: 'An error occurred during verification. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManualVerification = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualToken.trim()) {
      verifyToken(manualToken.trim())
    }
  }

  const handleResendEmail = async () => {
    if (!email) {
      setResendResult('Please provide your email address to resend verification.')
      return
    }

    setResendLoading(true)
    setResendResult(null)
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        setResendResult('✅ Verification email sent! Check your inbox.')
      } else {
        setResendResult(result.message || 'Failed to resend verification email.')
      }
    } catch (error) {
      setResendResult('❌ Network error. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  // Shared background wrapper for all states
  const BackgroundWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=80" 
          alt="Background"
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

      {children}
    </div>
  )

  // If verification is in progress
  if (loading) {
    return (
      <BackgroundWrapper>
        <div className="relative z-10 w-full max-w-md">
          <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden p-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-[#F46036]" />
              <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Verifying your email...</h2>
              <p className="text-slate-600 dark:text-slate-400 text-center font-body">
                Please wait while we verify your email address.
              </p>
            </div>
          </div>
        </div>
      </BackgroundWrapper>
    )
  }

  // If verification completed (success or failure)
  if (verificationResult) {
    return (
      <BackgroundWrapper>
        <div className="relative z-10 w-full max-w-md">
          <div className="relative group">
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${verificationResult.success ? 'from-green-500 to-emerald-500' : 'from-red-500 to-rose-500'} rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}></div>
            
            <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <div className="relative p-8 flex flex-col items-center space-y-6">
                {verificationResult.success ? (
                  <>
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/20">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">Email Verified!</h2>
                    <p className="text-slate-600 dark:text-slate-400 text-center font-body">
                      {verificationResult.message}
                    </p>
                    {verificationResult.email && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-body">
                        Verified email: <span className="font-semibold">{verificationResult.email}</span>
                      </p>
                    )}
                    <div className="text-center space-y-3 bg-green-500/10 border border-green-500/20 backdrop-blur-sm rounded-xl p-4 w-full">
                      <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                        Automatically signing you in...
                      </p>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        <span className="text-sm text-green-600 dark:text-green-400">Signing in...</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/20">
                      <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">Verification Failed</h2>
                    <div className="w-full bg-red-500/10 border border-red-500/20 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-red-700 dark:text-red-300 text-sm font-medium text-center">
                        {verificationResult.message}
                      </p>
                    </div>
                    <div className="text-center space-y-3">
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-body">
                        The verification link may have expired or been used already.
                      </p>
                      <div className="flex gap-3 flex-col sm:flex-row">
                        <Link href="/auth/signin" className="flex-1">
                          <Button 
                            variant="outline" 
                            size="lg"
                            className="w-full h-12 bg-white/50 dark:bg-white/5 border-slate-300 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 backdrop-blur-sm transition-all duration-300 font-heading font-medium"
                          >
                            Try Signing In
                          </Button>
                        </Link>
                        <Button 
                          onClick={() => {
                            setVerificationResult(null)
                            setManualToken("")
                          }}
                          size="lg"
                          className="flex-1 h-12 bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] text-white font-heading font-bold shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-[1.02] rounded-xl"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </BackgroundWrapper>
    )
  }

  // Default state - show verification form
  return (
    <BackgroundWrapper>
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#F46036] to-[#D74E25] rounded-2xl mb-6 shadow-2xl shadow-orange-500/20 relative group">
            <Mail className="w-8 h-8 text-white relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#F46036] to-[#D74E25] rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
          </div>
          <h1 className="text-4xl font-heading font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
            Verify Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F46036] to-[#D74E25]">Email</span>
          </h1>
        </div>

        {/* Main Card - Themed Glass HUD */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
          
          <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <div className="relative p-8 space-y-6">
              <div className="text-center space-y-3">
                {fromSource === 'access-blocked' ? (
                  <>
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-sm rounded-xl">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 font-heading font-bold">
                        🔒 Email verification required
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 font-body">
                        You need to verify your email address to access your account and start using Stakr.
                      </p>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-body">
                      {email ? `We sent a verification link to ${email}. ` : 'We sent a verification link to your email address. '}
                      Click the link in the email to verify your account.
                    </p>
                  </>
                ) : fromSource === 'onboarding' ? (
                  <>
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm rounded-xl">
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-heading font-bold">
                        🎉 Welcome to Stakr!
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-body">
                        Just one more step - verify your email to complete your account setup.
                      </p>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-body">
                      {email ? `We sent a verification link to ${email}. ` : 'We sent a verification link to your email address. '}
                      Click the link in the email to get started.
                    </p>
                  </>
                ) : (
                  <p className="text-slate-600 dark:text-slate-400 font-body">
                    We sent a verification link to your email address. Click the link in the email to verify your account.
                  </p>
                )}
                <p className="text-sm text-slate-500 dark:text-slate-400 font-body">
                  Didn't receive the email? Check your spam folder or enter your verification code below.
                </p>
              </div>

              <form onSubmit={handleManualVerification} className="space-y-5">
                <div className="space-y-3">
                  <label className="text-sm font-heading font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Verification Code</label>
                  <div className="relative group/input">
                    <Input
                      type="text"
                      placeholder="Enter verification code from email"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      className="h-14 bg-slate-100/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#F46036] focus:ring-2 focus:ring-[#F46036]/20 text-center font-mono backdrop-blur-sm transition-all duration-300"
                    />
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#F46036]/10 to-[#D74E25]/10 opacity-0 group-hover/input:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={!manualToken.trim()}
                  size="lg"
                  className="w-full h-14 bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] text-white font-heading font-bold text-lg shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-[1.02] rounded-xl"
                >
                  Verify Email
                </Button>
              </form>

              {resendResult && (
                <div className={`${resendResult.includes('✅') ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} border backdrop-blur-sm rounded-xl p-4`}>
                  <p className={`${resendResult.includes('✅') ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'} text-sm font-medium text-center`}>
                    {resendResult}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
                {email && (
                  <Button 
                    variant="outline" 
                    onClick={handleResendEmail}
                    disabled={resendLoading}
                    size="lg"
                    className="w-full h-12 bg-white/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-white hover:bg-white dark:hover:bg-white/10 backdrop-blur-sm transition-all duration-300 font-heading font-medium"
                  >
                    {resendLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Resend Verification Email'
                    )}
                  </Button>
                )}
                <Link href="/auth/signin" className="block">
                  <Button 
                    variant="ghost" 
                    size="lg"
                    className="w-full h-12 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BackgroundWrapper>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] relative overflow-hidden flex items-center justify-center p-4">
      {/* Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#F46036] rounded-full mix-blend-screen filter blur-[120px] opacity-10 dark:opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#D74E25] rounded-full mix-blend-screen filter blur-[100px] opacity-[0.07] dark:opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden p-8">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#F46036]" />
          <h2 className="text-xl font-heading font-semibold text-slate-900 dark:text-white">Loading...</h2>
          <p className="text-slate-600 dark:text-slate-400 text-center font-body">
            Preparing email verification page.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
