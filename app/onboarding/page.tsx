"use client"

import { useState } from "react"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { SwipeableOnboardingLayout } from "@/components/onboarding/swipeable-onboarding-layout"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { MobileFirstWelcomeStep } from "@/components/onboarding/mobile-first-welcome-step"
import { QuickGoalsStep } from "@/components/onboarding/quick-goals-step"
import { InstantAuthStep } from "@/components/onboarding/instant-auth-step"
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
}

export default function OnboardingPage() {
  const { isMobile } = useEnhancedMobile()
  const [currentStep, setCurrentStep] = useState(0)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    goals: [],
    interests: [],
    experience: "",
    motivation: "",
    name: "",
    preferredStakeRange: "",
  })

  // Streamlined to 3 steps for maximum conversion
  const steps = [
    { id: "welcome", component: MobileFirstWelcomeStep },
    { id: "goals", component: QuickGoalsStep },
    { id: "auth", component: InstantAuthStep },
  ]

  const handleNext = (stepData?: Partial<OnboardingData>) => {
    if (stepData) {
      setOnboardingData((prev) => ({ ...prev, ...stepData }))
    }

    // If this is the last step, redirect to discover
    if (currentStep === steps.length - 1) {
      window.location.href = "/discover"
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
