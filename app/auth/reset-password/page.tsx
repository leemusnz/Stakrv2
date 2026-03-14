"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from "lucide-react"
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
  const [shouldRedirect, setShouldRedirect] = useState(false)

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

  useEffect(() => {
    if (shouldRedirect) {
      const timer = setTimeout(() => {
        const signinUrl = `/auth/signin?email=${encodeURIComponent(email)}&message=${encodeURIComponent('Password reset successful! Please sign in with your new password.')}`
        router.push(signinUrl)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [shouldRedirect, router, email])

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      })
      const result = await response.json()
      if (response.ok) {
        setIsSuccess(true)
        setShouldRedirect(true)
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

  const BackgroundWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=80" alt="Background" className="w-full h-full object-cover grayscale-[30%] dark:grayscale-[50%]" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/70 to-white/80 dark:from-black/80 dark:via-black/70 dark:to-black/80"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black via-transparent to-white/50 dark:to-black/50"></div>
      </div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#F46036] rounded-full mix-blend-screen filter blur-[120px] opacity-10 dark:opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#D74E25] rounded-full mix-blend-screen filter blur-[100px] opacity-[0.07] dark:opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      {children}
    </div>
  )

  if (isValidating) {
    return (
      <BackgroundWrapper>
        <div className="relative z-10 bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#F46036]" />
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Validating Reset Link</h2>
            <p className="text-slate-600 dark:text-slate-400 text-center font-body">Please wait while we verify your reset token...</p>
          </div>
        </div>
      </BackgroundWrapper>
    )
  }

  if (error && !token) {
    return (
      <BackgroundWrapper>
        <div className="relative z-10 w-full max-w-md">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
            <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-8 space-y-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/20">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white">Invalid Reset Link</h2>
                <p className="text-slate-600 dark:text-slate-400 font-body">This reset link is invalid or has expired</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-sm rounded-xl p-4">
                <p className="text-red-700 dark:text-red-300 text-sm font-medium text-center">{error}</p>
              </div>
              <div className="flex flex-col gap-3">
                <Link href="/auth/forgot-password">
                  <Button className="w-full h-14 bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] text-white font-heading font-bold text-lg shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-[1.02] rounded-xl">
                    Request New Reset Link
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button variant="ghost" size="lg" className="w-full h-12 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"><ArrowLeft className="w-4 h-4 mr-2" />Back to Sign In</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </BackgroundWrapper>
    )
  }

  if (isSuccess) {
    return (
      <BackgroundWrapper>
        <div className="relative z-10 w-full max-w-md">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
            <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-8 space-y-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/20">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white">Password Reset Complete!</h2>
                <p className="text-slate-600 dark:text-slate-400 font-body">Your password has been successfully updated</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 backdrop-blur-sm rounded-xl p-4">
                <p className="text-green-700 dark:text-green-300 text-sm font-medium text-center">You can now sign in with your new password. Redirecting to sign in page...</p>
              </div>
              <Link href={`/auth/signin?email=${encodeURIComponent(email)}&message=${encodeURIComponent('Password reset successful! Please sign in with your new password.')}`}>
                <Button className="w-full h-14 bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] text-white font-heading font-bold text-lg shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-[1.02] rounded-xl">Sign In Now</Button>
              </Link>
            </div>
          </div>
        </div>
      </BackgroundWrapper>
    )
  }

  return (
    <BackgroundWrapper>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-heading font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Set New <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F46036] to-[#D74E25]">Password</span></h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-body">Enter a new password for <strong>{email}</strong></p>
        </div>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
          <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative p-8 space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-sm rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-3">
                  <label className="text-sm font-heading font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">New Password</label>
                  <div className="relative group/input">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-14 pl-12 pr-12 bg-slate-100/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#F46036] focus:ring-2 focus:ring-[#F46036]/20 backdrop-blur-sm transition-all duration-300 font-body" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#F46036]/10 to-[#D74E25]/10 opacity-0 group-hover/input:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                  {password && <p className={`text-xs font-medium ${passwordStrength.color}`}>{passwordStrength.text}</p>}
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-heading font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative group/input">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="h-14 pl-12 pr-12 bg-slate-100/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#F46036] focus:ring-2 focus:ring-[#F46036]/20 backdrop-blur-sm transition-all duration-300 font-body" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#F46036]/10 to-[#D74E25]/10 opacity-0 group-hover/input:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} size="lg" className="w-full h-14 bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] text-white font-heading font-bold text-lg shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-[1.02] rounded-xl">
                  {isLoading ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>Resetting Password...</> : "Reset Password"}
                </Button>
              </form>
              <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                <Link href="/auth/signin" className="inline-flex items-center justify-center w-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"><ArrowLeft className="w-4 h-4 mr-2" />Back to Sign In</Link>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] flex items-center justify-center p-4">
      <div className="bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl p-8"><Loader2 className="h-8 w-8 animate-spin text-[#F46036] mx-auto" /></div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (<Suspense fallback={<LoadingFallback />}><ResetPasswordContent /></Suspense>)
}
