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
  const { data: session, status } = useSession()
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
      // Check if user has completed onboarding
      if (session.user.onboardingCompleted) {
        console.log("🚀 User already completed onboarding, redirecting to dashboard")
        router.push("/dashboard")
        return
      } else {
        console.log("🎯 User authenticated but hasn't completed onboarding, staying in onboarding flow")
        // User is authenticated but hasn't completed onboarding - let them continue
      }
    }
  }, [session, status, router])

  // Gamified 3-step onboarding
  const steps = [
    { id: "welcome", component: GamefiedWelcomeStep, xpReward: 50 },
    { id: "goals", component: GamefiedGoalsStep, xpReward: 100 },
    { id: "auth", component: GamefiedAuthStep, xpReward: 150 },
  ]

  const handleNext = async (stepData?: Partial<OnboardingData>) => {
    if (stepData) {
      setOnboardingData((prev) => ({ ...prev, ...stepData }))
    }

    // Award XP for completing step
    const currentStepData = steps[currentStep]
    if (currentStepData) {
      const newXP = (onboardingData.xp || 0) + currentStepData.xpReward
      const newLevel = Math.floor(newXP / 200) + 1
      setOnboardingData((prev) => ({ ...prev, xp: newXP, level: newLevel }))
    }

    // If this is the last step, complete onboarding
    if (currentStep === steps.length - 1) {
      try {
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
            xp: (onboardingData.xp || 0) + 150,
            level: onboardingData.level || 1,
          }),
        })

        if (response.ok) {
          console.log("✅ Onboarding completed successfully!")
          
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
              window.location.href = "/"
            }, 500)
          } catch (updateError) {
            console.error("❌ Failed to update session:", updateError)
            // Still redirect even if session update fails
            window.location.href = "/"
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
      setCurrentStep((prev) => prev + 1)
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
