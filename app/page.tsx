"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AppSplashScreen } from "@/components/loading-screen"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    console.log('🏠 Home page useEffect triggered')
    console.log('📊 Session status:', status)
    console.log('👤 Session data:', session)
    console.log('🍪 Current cookies:', document.cookie)
    
    // Don't redirect during loading
    if (status === "loading") {
      console.log('⏳ Still loading, waiting...')
      return
    }

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
      
      // If user has completed onboarding, redirect to Dashboard (home page)
      console.log('✅ User has completed onboarding, redirecting to Dashboard')
      router.push('/dashboard')
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
      <AppSplashScreen />
    )
  }

  // This component only handles redirects, so this return should never be reached
  return null
}
