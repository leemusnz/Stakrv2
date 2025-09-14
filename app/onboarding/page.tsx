"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { SwipeableOnboardingLayout } from "@/components/onboarding/swipeable-onboarding-layout"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { GamefiedWelcomeStep } from "@/components/onboarding/gamified-welcome-step"
import { GamefiedGoalsStep } from "@/components/onboarding/gamified-goals-step"
import { GamefiedAuthStep } from "@/components/onboarding/gamified-auth-step"
import { DevTestingPanel } from "@/components/onboarding/dev-testing-panel"

export interface OnboardingData {
  goals: string[]
  interests: string[]
  experience: string
  motivation: string
  name: string
  avatar?: string
  preferredStakeRange: string
  recommendedChallenge?: any
  profileSaved?: boolean
  commitmentType?: "money" | "points"
  xp?: number
  level?: number
}

export default function OnboardingPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { isMobile } = useEnhancedMobile()
  const [currentStep, setCurrentStep] = useState(0)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    goals: [],
    interests: [],
    experience: "",
    motivation: "",
    name: "",
    preferredStakeRange: "",
    xp: 0,
    level: 1,
  })

  // Redirect authenticated users who have completed onboarding to dashboard
  useEffect(() => {
    if (status === "loading") return // Still loading session

    if (session?.user) {
      console.log("🔍 Onboarding page - User session:", {
        email: session.user.email,
        onboardingCompleted: session.user.onboardingCompleted,
        emailVerified: session.user.emailVerified,
        xp: session.user.xp,
        level: session.user.level
      })
      
      // Check if user has completed onboarding
      if (session.user.onboardingCompleted) {
        console.log("🚀 User already completed onboarding, redirecting to dashboard")
        router.push("/dashboard")
        return
      } else {
        console.log("🎯 User authenticated but hasn't completed onboarding, checking for saved progress...")
        
        // Check if user has any onboarding progress stored (for email users who were interrupted by verification)
        const savedProgress = localStorage.getItem('onboardingProgress')
        if (savedProgress) {
          try {
            const progress = JSON.parse(savedProgress)
            console.log('📊 Found saved onboarding progress:', progress)
            
            // Restore the progress
            setOnboardingData(progress.data)
            setCurrentStep(progress.currentStep)
            
            console.log('✅ Restored onboarding progress - step:', progress.currentStep, 'XP:', progress.data.xp)
            return
          } catch (error) {
            console.error('❌ Failed to parse saved onboarding progress:', error)
            // Fallback to step 2 for OAuth users
          }
        }
        
        // No saved progress - OAuth users go to step 2, email users start from step 0
        console.log("🔄 No saved progress, setting step based on user type")
        setCurrentStep(2) // Skip to the auth step where they can complete their profile
      }
    }
  }, [session, status, router])

  // Cleanup effect to remove old progress data
  useEffect(() => {
    return () => {
      // Only clean up if user has completed onboarding
      if (session?.user?.onboardingCompleted) {
        localStorage.removeItem('onboardingProgress')
        console.log('🗑️ Cleaned up onboarding progress on unmount')
      }
    }
  }, [session?.user?.onboardingCompleted])

  // Gamified 3-step onboarding
  const steps = [
    { id: "welcome", component: GamefiedWelcomeStep, xpReward: 50 },
    { id: "goals", component: GamefiedGoalsStep, xpReward: 100 },
    { id: "auth", component: GamefiedAuthStep, xpReward: 150 },
  ]

  const handleNext = async (stepData?: Partial<OnboardingData>) => {
    if (stepData) {
      const newData = { ...onboardingData, ...stepData }
      setOnboardingData(newData)
      
      // Save progress to localStorage for email users who might get interrupted by verification
      const progressToSave = {
        currentStep: currentStep + 1,
        data: newData,
        timestamp: Date.now()
      }
      localStorage.setItem('onboardingProgress', JSON.stringify(progressToSave))
      console.log('💾 Saved onboarding progress:', progressToSave)
    }

    // Award XP for completing step (only for non-OAuth users who go through all steps)
    const currentStepData = steps[currentStep]
    if (currentStepData && !session?.user) {
      // Only award step XP for unauthenticated users going through all steps
      const newXP = (onboardingData.xp || 0) + currentStepData.xpReward
      const newLevel = Math.floor(newXP / 200) + 1
      setOnboardingData((prev) => ({ ...prev, xp: newXP, level: newLevel }))
    }

    // If this is the last step, complete onboarding
    if (currentStep === steps.length - 1) {
      try {
        // Calculate XP to award - both OAuth and email users get the same total XP
        let xpToAward = 300 // Full onboarding completion XP
        let xpBreakdown = ""
        
        if (session?.user) {
          // OAuth users: Get full onboarding XP (equivalent to completing all steps)
          xpToAward = 300
          xpBreakdown = "Full onboarding completion (300 XP)"
          console.log('🎯 OAuth user completing onboarding - awarding full onboarding XP:', xpToAward)
        } else {
          // Email users: Get accumulated XP from steps
          xpToAward = onboardingData.xp || 300
          xpBreakdown = `Step-by-step completion (${onboardingData.xp || 300} XP)`
          console.log('🎯 Email user completing onboarding - awarding accumulated XP:', xpToAward)
        }
        
        console.log('📊 XP Award Summary:', {
          userType: session?.user ? 'OAuth' : 'Email',
          xpToAward,
          xpBreakdown,
          finalLevel: Math.floor(xpToAward / 200) + 1
        })
        
        // Complete onboarding profile
        const response = await fetch('/api/onboarding/complete-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: onboardingData.name || session?.user?.name || "New Champion",
            avatar: onboardingData.avatar,
            goals: onboardingData.goals,
            interests: onboardingData.interests,
            experience: onboardingData.experience,
            motivation: onboardingData.motivation,
            preferredStakeRange: onboardingData.preferredStakeRange,
            xp: xpToAward, // Let the API handle XP calculation and duplicate prevention
          }),
        })

        if (response.ok) {
          console.log("✅ Onboarding completed successfully!")
          
          // Clear saved progress since onboarding is now complete
          localStorage.removeItem('onboardingProgress')
          console.log('🗑️ Cleared saved onboarding progress')
          
          // Update session to reflect onboarding completion
          try {
            await update({
              user: {
                ...session?.user,
                onboardingCompleted: true
              }
            })
            console.log("✅ Session updated with onboarding completion")
            
            // Wait a moment for session to propagate, then redirect
            setTimeout(() => {
              window.location.href = "/dashboard"
            }, 500)
          } catch (updateError) {
            console.error("❌ Failed to update session:", updateError)
            // Still redirect even if session update fails
            window.location.href = "/dashboard"
          }
        } else {
          console.error("❌ Failed to complete onboarding")
        }
      } catch (error) {
        console.error("❌ Error completing onboarding:", error)
      }
      return
    }

    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      
      // Save progress to localStorage for email users who might get interrupted by verification
      const progressToSave = {
        currentStep: nextStep,
        data: onboardingData,
        timestamp: Date.now()
      }
      localStorage.setItem('onboardingProgress', JSON.stringify(progressToSave))
      console.log('💾 Saved onboarding progress (step progression):', progressToSave)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSkip = () => {
    // Skip to auth step
    setCurrentStep(steps.length - 1)
  }

  // Dev tools handlers
  const handleJumpToStep = (step: number) => {
    setCurrentStep(step)
  }

  const handleLoadPreset = (preset: Partial<OnboardingData>) => {
    setOnboardingData((prev) => ({ ...prev, ...preset }))
  }

  const handleToggleVariant = (variant: string) => {
    console.log("Toggle variant:", variant)
  }

  // Don't render onboarding if user is authenticated (will redirect)
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (session?.user && session.user.onboardingCompleted) {
    return null // Will redirect via useEffect
  }

  const CurrentStepComponent = steps[currentStep].component

  const layoutProps = {
    currentStep,
    totalSteps: steps.length,
    stepId: steps[currentStep].id,
    onNext: handleNext,
    onBack: handleBack,
  }

  const stepContent = (
    <CurrentStepComponent data={onboardingData} onNext={handleNext} onBack={handleBack} onSkip={handleSkip} />
  )

  return (
    <>
      {isMobile ? (
        <SwipeableOnboardingLayout
          {...layoutProps}
          showSkipButton={currentStep < steps.length - 1}
          canGoNext={currentStep < steps.length - 1}
          canGoBack={currentStep > 0}
          showBackButton={currentStep > 0}
          showNextButton={false} // Hide footer Next button since each step has its own Continue button
        >
          {stepContent}
        </SwipeableOnboardingLayout>
      ) : (
        <OnboardingLayout
          currentStep={currentStep}
          totalSteps={steps.length}
          onBack={handleBack}
          canGoBack={currentStep > 0}
        >
          {stepContent}
        </OnboardingLayout>
      )}

      {/* Dev Testing Panel - only show in development */}
      {process.env.NODE_ENV === "development" && (
        <DevTestingPanel
          currentStep={currentStep}
          onboardingData={onboardingData}
          onJumpToStep={handleJumpToStep}
          onLoadPreset={handleLoadPreset}
          onToggleVariant={handleToggleVariant}
        />
      )}
    </>
  )
}
