"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Mail, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean
    message: string
    email?: string
  } | null>(null)
  const [manualToken, setManualToken] = useState("")

  // Check if there's a token in the URL (from email link)
  const urlToken = searchParams.get('token')

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

      // If successful, redirect to sign in after a delay
      if (result.success) {
        setTimeout(() => {
          router.push('/auth/signin?message=Email verified! You can now sign in.')
        }, 3000)
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

  // If verification is in progress
  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
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
                    Redirecting to sign in page in 3 seconds...
                  </p>
                  <Link href="/auth/signin">
                    <Button>Sign In Now</Button>
                  </Link>
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
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              We sent a verification link to your email address. Click the link in the email to verify your account.
            </p>
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

          <div className="text-center space-y-2">
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
