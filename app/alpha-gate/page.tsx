"use client"

import type React from "react"

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
          console.log("✅ User already has alpha access, redirecting to home page...")
          router.push("/") // Redirect to home page which will handle proper routing
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

        // Use window.location for a full page reload to ensure cookie is processed
        setTimeout(() => {
          console.log("🔄 Redirecting to home page...")
          window.location.href = "/" // Redirect to home page which will handle proper routing
        }, 1000)
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
          window.location.href = "/" // Redirect to home page which will handle proper routing
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#F46036] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#3FC1C9] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-[#F46036] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23F46036' fillOpacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#F46036] to-[#3FC1C9] rounded-2xl mb-6 shadow-2xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Stakr</h1>
          <p className="text-gray-400 text-lg">Level up your life</p>
        </div>

        {/* Main card */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#F46036] rounded-lg flex items-center justify-center">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div className="w-8 h-8 bg-[#3FC1C9] rounded-lg flex items-center justify-center">
                <Gamepad2 className="w-4 h-4 text-white" />
              </div>
              <div className="w-8 h-8 bg-[#F46036] rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">Alpha Access Required</CardTitle>
            <CardDescription className="text-gray-300 text-base">
              Join the exclusive alpha testing community and be the first to experience the future of personal
              challenges.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Access Code</label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="Enter your exclusive access code"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#F46036] focus:ring-[#F46036] h-12 text-center text-lg tracking-wider"
                  />
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-[#F46036]/20 to-[#3FC1C9]/20 opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-500/20 border-red-500/30 text-red-200">
                  <AlertDescription className="text-center">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[#F46036] to-[#3FC1C9] hover:from-[#F46036]/90 hover:to-[#3FC1C9]/90 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying Access...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    Enter the Arena
                  </>
                )}
              </Button>
            </form>

            {process.env.NODE_ENV === "development" && (
              <div className="pt-4 border-t border-white/20">
                <Button
                  variant="outline"
                  onClick={handleDevBypass}
                  disabled={isLoading}
                  className="w-full bg-transparent border-white/30 text-gray-300 hover:bg-white/10 hover:text-white"
                >
                  🚀 Dev Bypass
                </Button>
              </div>
            )}

            {/* Features preview */}
            <div className="pt-4 border-t border-white/20">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-[#F46036]/20 rounded-lg flex items-center justify-center mx-auto">
                    <Trophy className="w-4 h-4 text-[#F46036]" />
                  </div>
                  <p className="text-xs text-gray-400">Earn Rewards</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-[#3FC1C9]/20 rounded-lg flex items-center justify-center mx-auto">
                    <Gamepad2 className="w-4 h-4 text-[#3FC1C9]" />
                  </div>
                  <p className="text-xs text-gray-400">Level Up</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-[#F46036]/20 rounded-lg flex items-center justify-center mx-auto">
                    <Zap className="w-4 h-4 text-[#F46036]" />
                  </div>
                  <p className="text-xs text-gray-400">Stay Motivated</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-gray-400 text-sm">Don't have access? Contact us for an exclusive invitation.</p>
          <p className="text-gray-500 text-xs">Private Alpha • Limited Access • stakr.app</p>
        </div>
      </div>
    </div>
  )
}
