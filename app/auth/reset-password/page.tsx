"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      setError('Missing reset token. Please use the link from your email.')
      setIsValidating(false)
      return
    }

    setToken(tokenParam)
    validateToken(tokenParam)
  }, [searchParams])

  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/reset-password?token=${token}`)
      const result = await response.json()

      if (response.ok) {
        setEmail(result.email)
        setIsValidating(false)
      } else {
        setError(result.message || 'Invalid or expired reset token')
        setIsValidating(false)
      }
    } catch (error) {
      setError('Connection error. Please try again.')
      setIsValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setIsSuccess(true)
      } else {
        setError(result.message || 'Failed to reset password')
      }
    } catch (error) {
      setError('Connection error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { level: 0, text: '', color: '' }
    if (password.length < 6) return { level: 1, text: 'Too short', color: 'text-red-500' }
    if (password.length < 8) return { level: 2, text: 'Weak', color: 'text-orange-500' }
    if (password.length < 12) return { level: 3, text: 'Good', color: 'text-yellow-500' }
    return { level: 4, text: 'Strong', color: 'text-green-500' }
  }

  const passwordStrength = getPasswordStrength(password)

  if (isValidating) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <h2 className="text-xl font-semibold">Validating Reset Link</h2>
            <p className="text-muted-foreground text-center">
              Please wait while we verify your reset token...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !token) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Invalid Reset Link</CardTitle>
            <p className="text-muted-foreground">
              This reset link is invalid or has expired
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="flex flex-col gap-3">
              <Link href="/auth/forgot-password">
                <Button className="w-full">
                  Request New Reset Link
                </Button>
              </Link>
              
              <Link href="/auth/signin">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSuccess) {
    // Auto-redirect to signin page after 3 seconds
    useEffect(() => {
      const timer = setTimeout(() => {
        const signinUrl = `/auth/signin?email=${encodeURIComponent(email)}&message=${encodeURIComponent('Password reset successful! Please sign in with your new password.')}`
        router.push(signinUrl)
      }, 3000)

      return () => clearTimeout(timer)
    }, [router, email])

    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Password Reset Complete!</CardTitle>
            <p className="text-muted-foreground">
              Your password has been successfully updated
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                You can now sign in with your new password. Redirecting to sign in page...
              </AlertDescription>
            </Alert>

            <Link href={`/auth/signin?email=${encodeURIComponent(email)}&message=${encodeURIComponent('Password reset successful! Please sign in with your new password.')}`}>
              <Button className="w-full" size="lg">
                Sign In Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Set New Password
          </CardTitle>
          <p className="text-muted-foreground">
            Enter a new password for <strong>{email}</strong>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pl-10 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded">
                    <div 
                      className={`h-2 rounded transition-all duration-300 ${
                        passwordStrength.level === 1 ? 'bg-red-500 w-1/4' :
                        passwordStrength.level === 2 ? 'bg-orange-500 w-2/4' :
                        passwordStrength.level === 3 ? 'bg-yellow-500 w-3/4' :
                        passwordStrength.level === 4 ? 'bg-green-500 w-full' : 'w-0'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${passwordStrength.color}`}>
                    {passwordStrength.text}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 pl-10 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords don't match</p>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || !password || !confirmPassword || password !== confirmPassword} 
              size="lg" 
              className="w-full py-6"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>

          <div className="text-center">
            <Link href="/auth/signin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>
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
            Preparing password reset page.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
