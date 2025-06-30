"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Don't redirect during loading
    if (status === "loading") return

    // If user is authenticated, check onboarding status
    if (session?.user) {
      console.log('🏠 Home page - User authenticated:', session.user.email)
      console.log('🎯 Onboarding completed:', session.user.onboardingCompleted)
      
      // If user hasn't completed onboarding, redirect to onboarding
      if (!session.user.onboardingCompleted) {
        console.log('🚀 Redirecting to onboarding...')
        router.push('/onboarding')
        return
      }
      
      // If user has completed onboarding, redirect to My Active page
      console.log('✅ User has completed onboarding, redirecting to My Active')
      router.push('/my-active')
      return
    } else {
      // If not authenticated, redirect to onboarding (which will handle auth)
      console.log('🔒 No session, redirecting to onboarding...')
      router.push('/onboarding')
      return
    }
  }, [session, status, router])

  // Show loading while checking session/redirecting
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // This component only handles redirects, so this return should never be reached
  return null
}
