"use client"

import type React from "react"
import { BackgroundImage } from '@/components/ui/background-image'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, Zap, Shield, Gamepad2, Trophy } from "lucide-react"

export default function AlphaGatePage() {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()

  // Check if user already has alpha access
  useEffect(() => {
    const checkAlphaAccess = () => {
      try {
        console.log("🔍 Checking alpha access cookie...")
        console.log("🍪 All cookies:", document.cookie)
        const hasAccess = document.cookie.includes("alpha_access=true")
        console.log("✅ Has alpha access:", hasAccess)
        
        if (hasAccess) {
          // Route through home to keep one entry redirect path.
          console.log("✅ User already has alpha access, redirecting to home routing...")
          router.replace("/")
        }
      } catch (error) {
        console.log("⚠️ Could not check alpha access cookie:", error)
      }
    }

    checkAlphaAccess()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Validate input
      if (!password.trim()) {
        setError("Please enter the alpha access password")
        setIsLoading(false)
        return
      }

      console.log("🔐 Attempting alpha access...")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch("/api/alpha-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ password: password.trim() }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log("📡 API response status:", response.status)

      // Check content type before parsing
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("❌ Invalid content type:", contentType)
        throw new Error("Server returned invalid response format")
      }

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("❌ Failed to parse JSON response:", parseError)
        throw new Error("Invalid server response format")
      }

      console.log("📝 Alpha access response:", data)
      console.log("🌐 Current URL:", window.location.href)
      console.log("🍪 Cookies before processing:", document.cookie)

      if (data.success) {
        console.log("✅ Alpha access granted")
        setIsRedirecting(true)

        // Set a client-side cookie as backup (environment-aware)
        try {
          const isProduction = process.env.NODE_ENV === "production"
          const isHttps = window.location.protocol === "https:"
          const cookieString = isProduction && isHttps 
            ? "alpha_access=true; path=/; max-age=604800; SameSite=None; Secure"
            : "alpha_access=true; path=/; max-age=604800; SameSite=Lax"
          
          document.cookie = cookieString
          console.log("🍪 Client-side cookie set successfully:", cookieString)
        } catch (cookieError) {
          console.warn("⚠️ Could not set client-side cookie:", cookieError)
        }

        setTimeout(() => {
          console.log("🔄 Redirecting to onboarding...")
          console.log("🍪 Current cookies before redirect:", document.cookie)
          
          try {
            router.replace("/onboarding")
          } catch (redirectError) {
            console.error("❌ Redirect failed:", redirectError)
            window.location.reload()
          }
        }, 2000) // Increased delay to ensure cookie is set
      } else {
        console.log("❌ Alpha access denied:", data.error)
        setError(data.error || "Access denied")
      }
    } catch (error) {
      console.error("❌ Alpha access error:", error)

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          setError("Request timed out. Please try again.")
        } else if (error.message.includes("fetch")) {
          setError("Network error. Please check your connection and try again.")
        } else {
          setError(error.message)
        }
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDevBypass = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/dev-bypass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned invalid response format")
      }

      const data = await response.json()

      if (data.success) {
        setIsRedirecting(true)
        // Environment-aware cookie for dev bypass
        const isProduction = process.env.NODE_ENV === "production"
        const isHttps = window.location.protocol === "https:"
        const cookieString = isProduction && isHttps 
          ? "alpha_access=true; path=/; max-age=604800; SameSite=None; Secure"
          : "alpha_access=true; path=/; max-age=604800; SameSite=Lax"
        
        document.cookie = cookieString
        setTimeout(() => {
          router.replace("/onboarding")
        }, 500)
      } else {
        setError(data.error || "Dev bypass failed")
      }
    } catch (error) {
      console.error("❌ Dev bypass error:", error)
      setError("Dev bypass failed")
    } finally {
      setIsLoading(false)
    }
  }

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#F46036] mx-auto mb-4" />
          <p className="text-white text-lg">Access granted! Redirecting...</p>
          <p className="text-gray-400 text-sm mt-2">Cookies: {document.cookie}</p>
          <p className="text-gray-400 text-sm">URL: {window.location.href}</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <BackgroundImage 
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=75"
          alt="Alpha gate background"
          priority={true}
          className="w-full h-full object-cover grayscale-[30%] dark:grayscale-[50%]"
        />
        {/* Themed overlay with gradient */}
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
        {/* Logo/Brand section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#F46036] to-[#D74E25] rounded-2xl mb-6 shadow-2xl shadow-orange-500/20 relative group">
            <Shield className="w-12 h-12 text-white relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#F46036] to-[#D74E25] rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
          </div>
          <h1 className="text-5xl font-heading font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Stakr</h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-body">Put Your Money Where Your Mouth Is</p>
        </div>

        {/* Main card - Themed Glass HUD */}
        <div className="relative group">
          {/* Glow effect on hover */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
          
          <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <div className="relative p-8 space-y-8">
              {/* Header with icons */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#F46036] to-[#D74E25] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center">
                    <Gamepad2 className="w-5 h-5 text-[#F46036]" />
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-[#F46036] to-[#D74E25] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">Alpha Access</h2>
                <p className="text-slate-600 dark:text-slate-400 text-base font-body leading-relaxed max-w-sm mx-auto">
                  Enter your exclusive access code to join the private alpha
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-heading font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Access Code</label>
                  <div className="relative group/input">
                    <Input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="bg-slate-100/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#F46036] focus:ring-2 focus:ring-[#F46036]/20 h-14 text-center text-lg tracking-[0.3em] font-mono backdrop-blur-sm transition-all duration-300"
                    />
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#F46036]/10 to-[#D74E25]/10 opacity-0 group-hover/input:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-red-700 dark:text-red-300 text-center text-sm font-medium">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] text-white font-heading font-bold text-lg shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-[1.02] rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Verifying Access...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-3 h-5 w-5" />
                      Enter the Arena
                    </>
                  )}
                </Button>
              </form>

              {process.env.NODE_ENV === "development" && (
                <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                  <Button
                    variant="outline"
                    onClick={handleDevBypass}
                    disabled={isLoading}
                    className="w-full h-12 bg-white/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-white/20 backdrop-blur-sm transition-all duration-300 font-medium"
                  >
                    🚀 Dev Bypass
                  </Button>
                </div>
              )}

              {/* Features preview */}
              <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-3 group/feature">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#F46036]/20 to-[#D74E25]/20 backdrop-blur-sm border border-[#F46036]/20 rounded-xl flex items-center justify-center mx-auto group-hover/feature:scale-110 transition-transform duration-300">
                      <Trophy className="w-5 h-5 text-[#F46036]" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Earn Rewards</p>
                  </div>
                  <div className="space-y-3 group/feature">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center mx-auto group-hover/feature:scale-110 transition-transform duration-300">
                      <Gamepad2 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Level Up</p>
                  </div>
                  <div className="space-y-3 group/feature">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#F46036]/20 to-[#D74E25]/20 backdrop-blur-sm border border-[#F46036]/20 rounded-xl flex items-center justify-center mx-auto group-hover/feature:scale-110 transition-transform duration-300">
                      <Zap className="w-5 h-5 text-[#F46036]" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Stay Motivated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-10 space-y-3">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-body">Don&apos;t have access? Contact us for an exclusive invitation.</p>
          <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-500 text-xs font-medium">
            <span className="w-1.5 h-1.5 bg-[#F46036] rounded-full animate-pulse"></span>
            <span>Private Alpha</span>
            <span>•</span>
            <span>Limited Access</span>
            <span>•</span>
            <span>stakr.app</span>
          </div>
        </div>
      </div>
    </main>
  )
}
