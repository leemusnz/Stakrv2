"use client"

import { useState } from "react"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { WelcomeStep } from "@/components/onboarding/welcome-step"
import { HabitScienceStep } from "@/components/onboarding/habit-science-step"
import { HowItWorksStep } from "@/components/onboarding/how-it-works-step"
import { GoalSelectionStep } from "@/components/onboarding/goal-selection-step"
import { InterestSelectionStep } from "@/components/onboarding/interest-selection-step"
import { ChallengeRecommendationStep } from "@/components/onboarding/challenge-recommendation-step"
import { ProfileSetupStep } from "@/components/onboarding/profile-setup-step"
import { ReadyToStartStep } from "@/components/onboarding/ready-to-start-step"
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
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    goals: [],
    interests: [],
    experience: "",
    motivation: "",
    name: "",
    preferredStakeRange: "",
  })

  const steps = [
    { id: "welcome", component: WelcomeStep },
    { id: "habit-science", component: HabitScienceStep },
    { id: "how-it-works", component: HowItWorksStep },
    { id: "goals", component: GoalSelectionStep },
    { id: "interests", component: InterestSelectionStep },
    { id: "recommendation", component: ChallengeRecommendationStep },
    { id: "profile", component: ProfileSetupStep },
    { id: "ready", component: ReadyToStartStep },
  ]

  const handleNext = (stepData?: Partial<OnboardingData>) => {
    if (stepData) {
      setOnboardingData((prev) => ({ ...prev, ...stepData }))
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
    // Skip to profile setup
    setCurrentStep(5)
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
    // Could be used for A/B testing different copy/layouts
  }

  const CurrentStepComponent = steps[currentStep].component

  return (
    <>
      <OnboardingLayout
        currentStep={currentStep}
        totalSteps={steps.length}
        onBack={handleBack}
        canGoBack={currentStep > 0}
      >
        <CurrentStepComponent data={onboardingData} onNext={handleNext} onBack={handleBack} onSkip={handleSkip} />
      </OnboardingLayout>

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
