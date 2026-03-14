"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        setError(result.message || 'Failed to send reset email')
      }
    } catch (error) {
      setError('Connection error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
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

        <div className="relative z-10 w-full max-w-md">
          {/* Success Card */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
            
            <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <div className="relative p-8 space-y-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/20">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">Check Your Email</h2>
                  <p className="text-slate-600 dark:text-slate-400 text-base font-body">
                    Reset instructions sent to your email
                  </p>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 backdrop-blur-sm rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                    If an account with <strong>{email}</strong> exists, we've sent you a password reset link.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2 bg-slate-100/50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl p-4">
                    <p className="flex items-center gap-2">📧 Check your inbox for a reset link</p>
                    <p className="flex items-center gap-2">⏰ The link expires in 1 hour</p>
                    <p className="flex items-center gap-2">📁 Don't forget to check your spam folder</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => {
                        setIsSubmitted(false)
                        setEmail("")
                      }}
                      variant="outline"
                      size="lg"
                      className="w-full h-12 bg-white/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-white hover:bg-white dark:hover:bg-white/10 backdrop-blur-sm transition-all duration-300 font-heading font-medium"
                    >
                      Send Another Email
                    </Button>
                    
                    <Link href="/auth/signin" className="w-full">
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
        </div>
      </div>
    )
  }

  return (
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

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-heading font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
            Reset Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F46036] to-[#D74E25]">Password</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-body">
            Enter your email address and we'll send you a reset link
          </p>
        </div>

        {/* Main Card - Themed Glass HUD */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
          
          <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden">
            {/* Shimmer effect */}
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
                  <label className="text-sm font-heading font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-14 pl-12 bg-slate-100/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#F46036] focus:ring-2 focus:ring-[#F46036]/20 backdrop-blur-sm transition-all duration-300 font-body"
                    />
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#F46036]/10 to-[#D74E25]/10 opacity-0 group-hover/input:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading || !email} 
                  size="lg" 
                  className="w-full h-14 bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] text-white font-heading font-bold text-lg shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-[1.02] rounded-xl"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Sending Reset Link...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>

              <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                <Link href="/auth/signin" className="inline-flex items-center justify-center w-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Link>
              </div>

              {/* Security Notice */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100/50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-lg p-3 text-center">
                  🔒 For security, we don't reveal whether an email address is registered with us.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
