"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Mail, AlertCircle, Loader2 } from "lucide-react"
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
            // Redirect to onboarding instead of home page to ensure they complete the flow
            console.log('🚀 Redirecting to onboarding page...')
            window.location.href = '/onboarding'
          } else {
            console.log('❌ Auto sign-in failed, redirecting to signin page')
            console.log('❌ Sign-in error:', signInResult?.error)
            // Fallback to signin page if auto sign-in fails
            const signinUrl = `/auth/signin?email=${encodeURIComponent(result.email || email || '')}&message=${encodeURIComponent('Email verified! Please sign in to continue.')}`
            window.location.href = signinUrl
          }
        } catch (signInError) {
          console.error('❌ Auto sign-in failed:', signInError)
          // Fallback to signin page
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

  // If verification is in progress
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Verifying your email...</h2>
            <p className="text-muted-foreground text-center">
              Please wait while we verify your email address.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If verification completed (success or failure)
  if (verificationResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            {verificationResult.success ? (
              <>
                <CheckCircle className="h-12 w-12 text-green-500" />
                <h2 className="text-xl font-semibold text-green-700">Email Verified!</h2>
                <p className="text-muted-foreground text-center">
                  {verificationResult.message}
                </p>
                {verificationResult.email && (
                  <p className="text-sm text-muted-foreground">
                    Verified email: {verificationResult.email}
                  </p>
                )}
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Automatically signing you in...
                  </p>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">Signing in...</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-12 w-12 text-red-500" />
                <h2 className="text-xl font-semibold text-red-700">Verification Failed</h2>
                <Alert variant="destructive">
                  <AlertDescription>
                    {verificationResult.message}
                  </AlertDescription>
                </Alert>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    The verification link may have expired or been used already.
                  </p>
                  <div className="flex gap-2">
                    <Link href="/auth/signin">
                      <Button variant="outline">Try Signing In</Button>
                    </Link>
                    <Button 
                      onClick={() => {
                        setVerificationResult(null)
                        setManualToken("")
                      }}
                      variant="outline"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Default state - show verification form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            {fromSource === 'access-blocked' ? (
              <>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                  <p className="text-sm text-yellow-800 font-medium">
                    🔒 Email verification required
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    You need to verify your email address to access your account and start using Stakr.
                  </p>
                </div>
                <p className="text-muted-foreground">
                  {email ? `We sent a verification link to ${email}. ` : 'We sent a verification link to your email address. '}
                  Click the link in the email to verify your account.
                </p>
              </>
            ) : fromSource === 'onboarding' ? (
              <>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <p className="text-sm text-blue-800 font-medium">
                    🎉 Welcome to Stakr!
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Just one more step - verify your email to complete your account setup.
                  </p>
                </div>
                <p className="text-muted-foreground">
                  {email ? `We sent a verification link to ${email}. ` : 'We sent a verification link to your email address. '}
                  Click the link in the email to get started.
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                We sent a verification link to your email address. Click the link in the email to verify your account.
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or enter your verification code below.
            </p>
          </div>

          <form onSubmit={handleManualVerification} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Verification Code</Label>
              <Input
                id="token"
                type="text"
                placeholder="Enter verification code from email"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="text-center"
              />
            </div>
            <Button type="submit" className="w-full" disabled={!manualToken.trim()}>
              Verify Email
            </Button>
          </form>

          {resendResult && (
            <Alert className={resendResult.includes('✅') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className={resendResult.includes('✅') ? 'text-green-800' : 'text-red-800'}>
                {resendResult}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center space-y-2">
            {email && (
              <Button 
                variant="outline" 
                onClick={handleResendEmail}
                disabled={resendLoading}
                className="w-full text-sm"
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
            <Link href="/auth/signin">
              <Button variant="ghost" className="text-sm">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center space-y-4 p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-muted-foreground text-center">
            Preparing email verification page.
          </p>
        </CardContent>
      </Card>
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
