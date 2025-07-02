"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Eye, EyeOff, Rocket } from "lucide-react"

export default function AlphaGatePage() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    console.log('🚀 Starting alpha access submission...')

    try {
      console.log('📡 Making API call to /api/alpha-access...')
      const response = await fetch('/api/alpha-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      console.log('📡 API response status:', response.status)
      const data = await response.json()
      console.log('📡 API response data:', data)

      if (data.success) {
        console.log('✅ Access granted! Setting redirect state...')
        // Cookie is now set server-side, just need to redirect
        setIsRedirecting(true)
        
        console.log('⏰ Starting redirect timeout...')
        
        // Check cookies before redirect
        setTimeout(() => {
          console.log('🍪 Current cookies:', document.cookie)
          console.log('🍪 Alpha access cookie:', document.cookie.includes('alpha_access=true'))
        }, 100)
        
        // Use window.location for a full page reload to ensure cookie is processed
        const timeoutId = setTimeout(() => {
          console.log('🔄 Executing redirect to homepage...')
          console.log('🍪 Final cookies check:', document.cookie)
          window.location.href = '/'
        }, 500)
        
        console.log('⏰ Timeout ID:', timeoutId)
      } else {
        console.log('❌ Access denied:', data.error)
        setError(data.error || 'Invalid access code')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('💥 Alpha access error:', error)
      setError('Connection error. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stakr</h1>
            <p className="text-gray-600 mt-2">Alpha Access Required</p>
          </div>
        </div>

        {/* Access Card */}
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-blue-800">
              <Lock className="w-5 h-5" />
              Private Alpha Testing
            </CardTitle>
            <CardDescription>
              Stakr is currently in private alpha testing. Enter your access code to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Access Code
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your alpha access code"
                    className="pr-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isRedirecting && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800 space-y-2">
                    <div>✅ Access granted! Taking you to Stakr...</div>
                    <div className="text-xs text-green-700 space-y-1">
                      <div>
                        If you're not redirected automatically,{' '}
                        <button 
                          onClick={() => {
                            console.log('🔄 Manual redirect button clicked')
                            window.location.href = '/'
                          }}
                          className="underline hover:no-underline font-medium"
                        >
                          click here
                        </button>
                      </div>
                      <div>
                        Debug: Check browser console for logs
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || isRedirecting || !password.trim()}
              >
                {isRedirecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Access granted! Redirecting...
                  </>
                ) : isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Access Stakr Alpha
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">
            Don't have access? Contact the Stakr team for an invitation.
          </p>
          <p className="text-xs text-gray-400">
            This is a private alpha version • stakr.app
          </p>
        </div>
      </div>
    </div>
  )
} 