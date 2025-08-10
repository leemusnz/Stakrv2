"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreationLayout } from "@/components/challenge-creation/creation-layout"
import { SwipeableOnboardingLayout } from "@/components/onboarding/swipeable-onboarding-layout"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { ChallengeTypeStep } from "@/components/challenge-creation/challenge-type-step"
import { BasicInfoStep } from "@/components/challenge-creation/basic-info-step"
import { ChallengeFeaturesStep } from "@/components/challenge-creation/challenge-features-step"
import { RulesRequirementsStep } from "@/components/challenge-creation/rules-requirements-step"
import { ProofSettingsStep } from "@/components/challenge-creation/proof-settings-step"
import { SimplifiedStakesStep } from "@/components/challenge-creation/simplified-stakes-step"
import { PreviewPublishStep } from "@/components/challenge-creation/preview-publish-step"
import { CategorySelectionStep } from "@/components/challenge-creation/category-selection-step"
import { AiChallengeSummary } from "@/components/challenge-creation/ai-challenge-summary"

export default function CreateChallengePage() {
  const { isMobile } = useEnhancedMobile()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isPublishing, setIsPublishing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState(null)

  // Challenge data state
  const [challengeData, setChallengeData] = useState({
    // Step 1: Privacy Type
    privacyType: "", // "public" or "private"

    // Step 2: Category
    category: "",

    // Step 3: Basic Info
    title: "",
    description: "",
    tags: [] as string[],
    duration: "",
    difficulty: "",
    thumbnailImage: null as File | null,

    // Step 4: Challenge Features & Participants
    allowPointsOnly: true,
    minParticipants: 3,
    maxParticipants: null as number | null,

    // Start Date Settings
    startDateType: "days",
    startDateDays: 2,

    // Team Challenge Settings
    enableTeamMode: false,
    teamAssignmentMethod: "auto-balance",
    numberOfTeams: 2,
    winningCriteria: "completion-rate",
    losingTeamOutcome: "lose-stake",

    // Referral Settings
    enableReferralBonus: false,
    referralBonusPercentage: 20,
    maxReferrals: 3,

    // Step 5: Rules & Requirements
    rules: [] as string[],
    dailyInstructions: "",
    generalInstructions: "",

    // Step 6: Proof Settings
    selectedProofTypes: [] as string[],
    proofInstructions: "",
    cameraOnly: false,
    allowLateSubmissions: false,
    lateSubmissionHours: 4,

    // Timer and Random Verification Settings
    requireTimer: false,
    timerMinDuration: 15, // minimum minutes
    timerMaxDuration: 120, // maximum minutes
    randomCheckinsEnabled: false,
    randomCheckinProbability: 30, // percentage chance

    // Step 7: Stakes & Rewards (simplified)
    currency: 'CREDITS' as 'CREDITS' | 'CASH',
    stakeTiers: [] as number[],
    minStake: 25,
    maxStake: 200,
    hostContribution: 0,
    bonusRewards: [] as string[],
    rewardDistribution: "equal-split", // Default value for money challenges
  })

  const totalSteps = 9

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return challengeData.privacyType !== ""
      case 2:
        return challengeData.category !== ""
      case 3:
        return !!(
          challengeData.title &&
          challengeData.description &&
          challengeData.duration &&
          challengeData.difficulty
        )
      case 4:
        return challengeData.minParticipants >= 1
      case 5:
        return challengeData.rules.length > 0 && challengeData.dailyInstructions.trim() !== ""
      case 6:
        return challengeData.selectedProofTypes.length > 0 && challengeData.proofInstructions.trim() !== ""
      case 7:
        return aiAnalysis !== null // AI analysis must be completed
      case 8:
        // For points-only challenges, we don't need stake validation
        if (challengeData.allowPointsOnly) {
          return true
        }
        // For money challenges, validate stakes and distribution
        const hasTiers = Array.isArray(challengeData.stakeTiers) && challengeData.stakeTiers.length > 0
        const hasRange = challengeData.minStake > 0 && challengeData.maxStake > 0 && challengeData.maxStake >= challengeData.minStake
        return (
          (hasTiers || hasRange) &&
          challengeData.rewardDistribution !== ""
        )
      case 9:
        return isReadyToPublish()
      default:
        return false
    }
  }

  const isReadyToPublish = () => {
    const requiredFields = [
      challengeData.privacyType,
      challengeData.category,
      challengeData.title,
      challengeData.description,
      challengeData.duration,
      challengeData.difficulty,
      challengeData.rules.length > 0,
      challengeData.dailyInstructions.trim(),
      challengeData.selectedProofTypes.length > 0,
      challengeData.proofInstructions.trim(),
    ]

    // Check basic required fields
    const basicFieldsValid = requiredFields.every((field) => {
      if (typeof field === "boolean") return field
      if (typeof field === "string") return field !== ""
      return !!field
    })

    // For points-only challenges, we don't need stake validation
    if (challengeData.allowPointsOnly) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 Points-only challenge validation:', {
          basicFieldsValid,
          missingFields: getMissingFields(),
          challengeData: {
            privacyType: challengeData.privacyType,
            category: challengeData.category,
            title: challengeData.title,
            description: challengeData.description,
            duration: challengeData.duration,
            difficulty: challengeData.difficulty,
            rulesLength: challengeData.rules.length,
            dailyInstructions: challengeData.dailyInstructions,
            selectedProofTypesLength: challengeData.selectedProofTypes.length,
            proofInstructions: challengeData.proofInstructions,
            allowPointsOnly: challengeData.allowPointsOnly
          }
        })
      }
      return basicFieldsValid
    }

    // For money challenges, also validate stakes
    const hasTiers = Array.isArray(challengeData.stakeTiers) && challengeData.stakeTiers.length > 0
    const hasRange =
      challengeData.minStake > 0 &&
      challengeData.maxStake > 0 &&
      challengeData.maxStake >= challengeData.minStake
    const stakesValid = (hasTiers || hasRange) && challengeData.rewardDistribution !== ""

    if (process.env.NODE_ENV === 'development') {
      console.log('💰 Money challenge validation:', {
        basicFieldsValid,
        stakesValid,
        missingFields: getMissingFields(),
        stakes: {
          minStake: challengeData.minStake,
          maxStake: challengeData.maxStake,
          rewardDistribution: challengeData.rewardDistribution
        }
      })
    }

    return basicFieldsValid && stakesValid
  }

  const getMissingFields = () => {
    const missing = []

    if (!challengeData.privacyType) missing.push("Privacy type")
    if (!challengeData.category) missing.push("Category")
    if (!challengeData.title) missing.push("Title")
    if (!challengeData.description) missing.push("Description")
    if (!challengeData.duration) missing.push("Duration")
    if (!challengeData.difficulty) missing.push("Difficulty")
    if (challengeData.rules.length === 0) missing.push("At least one rule")
    if (!challengeData.dailyInstructions.trim()) missing.push("Daily instructions")
    if (challengeData.selectedProofTypes.length === 0) missing.push("Proof types")
    if (!challengeData.proofInstructions.trim()) missing.push("Proof instructions")

    // Only check stakes if not points-only
    if (!challengeData.allowPointsOnly) {
      const hasTiers = Array.isArray(challengeData.stakeTiers) && challengeData.stakeTiers.length > 0
      if (!hasTiers) {
        if (challengeData.minStake <= 0) missing.push("Minimum stake")
        if (challengeData.maxStake <= 0) missing.push("Maximum stake")
        if (challengeData.maxStake < challengeData.minStake) missing.push("Max stake must be >= min stake")
      }
      if (!challengeData.rewardDistribution) missing.push("Reward distribution")
    }

    return missing
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleEdit = (step: number) => {
    setCurrentStep(step)
  }

  const handlePublish = async () => {
    setIsPublishing(true)

    try {
      let thumbnailUrl = null

      // Upload thumbnail image if provided
      if (challengeData.thumbnailImage) {
        try {
          // Step 1: Get presigned URL for thumbnail upload
          const presignedResponse = await fetch('/api/upload/presigned-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName: challengeData.thumbnailImage.name,
              fileType: challengeData.thumbnailImage.type,
              fileSize: challengeData.thumbnailImage.size,
              uploadType: 'challenge-thumbnail',
              challengeId: 'temp-' + Date.now() // Temporary ID for S3 path
            })
          })

          if (!presignedResponse.ok) {
            throw new Error('Failed to get upload URL for thumbnail')
          }

          const { uploadUrl, fileKey } = await presignedResponse.json()

          // Step 2: Upload file to S3
          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: challengeData.thumbnailImage,
            headers: {
              'Content-Type': challengeData.thumbnailImage.type,
            },
          })

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload thumbnail image')
          }

          // Step 3: Construct final URL
          thumbnailUrl = `https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/${fileKey}`
          console.log('✅ Thumbnail uploaded successfully:', thumbnailUrl)
        } catch (uploadError) {
          console.error('❌ Thumbnail upload failed:', uploadError)
          // Continue without thumbnail rather than failing the entire challenge creation
          alert('Warning: Failed to upload thumbnail image. Challenge will be created without thumbnail.')
        }
      }

      // Create challenge with thumbnail URL (excluding File object)
      const challengePayload = {
        ...challengeData,
        thumbnailUrl, // Add the uploaded URL
        thumbnailImage: undefined, // Remove File object from payload
        aiAnalysis: aiAnalysis // Include AI analysis for enhanced verification
      }

      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(challengePayload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`)
      }

      if (result.success) {
        console.log("Challenge created successfully:", result.challenge)

        // Redirect based on API response
        if (result.next_steps?.redirect_url) {
          router.push(result.next_steps.redirect_url)
        } else {
          // Fallback redirect logic
          if (challengeData.privacyType === "private" && challengeData.minParticipants > 1) {
            router.push(`/challenge/invite/${result.challenge.invite_code}`)
          } else {
            router.push(`/challenge/${result.challenge.id}`)
          }
        }
      } else {
        throw new Error(result.error || 'Failed to create challenge')
      }
    } catch (error) {
      console.error("Failed to publish challenge:", error)
      
      // Show user-friendly error message
      alert(`Failed to create challenge: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsPublishing(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ChallengeTypeStep
            selectedType={challengeData.privacyType}
            onTypeSelect={(type) => setChallengeData({ ...challengeData, privacyType: type })}
          />
        )
      case 2:
        return (
          <CategorySelectionStep
            selectedCategory={challengeData.category}
            onCategorySelect={(category) => setChallengeData({ ...challengeData, category })}
          />
        )
      case 3:
        return (
          <BasicInfoStep
            title={challengeData.title}
            description={challengeData.description}
            tags={challengeData.tags}
            duration={challengeData.duration}
            difficulty={challengeData.difficulty}
            thumbnailImage={challengeData.thumbnailImage}
            isPrivate={challengeData.privacyType === "private"}
            onTitleChange={(title) => setChallengeData({ ...challengeData, title })}
            onDescriptionChange={(description) => setChallengeData({ ...challengeData, description })}
            onTagsChange={(tags) => setChallengeData({ ...challengeData, tags })}
            onDurationChange={(duration) => setChallengeData({ ...challengeData, duration })}
            onDifficultyChange={(difficulty) => setChallengeData({ ...challengeData, difficulty })}
            onThumbnailImageChange={(thumbnailImage) => setChallengeData({ ...challengeData, thumbnailImage })}
          />
        )
      case 4:
        return (
          <ChallengeFeaturesStep
            allowPointsOnly={challengeData.allowPointsOnly}
            minParticipants={challengeData.minParticipants}
            maxParticipants={challengeData.maxParticipants}
            isPrivate={challengeData.privacyType === "private"}
            startDateType={challengeData.startDateType}
            startDateDays={challengeData.startDateDays}
            enableTeamMode={challengeData.enableTeamMode}
            teamAssignmentMethod={challengeData.teamAssignmentMethod}
            numberOfTeams={challengeData.numberOfTeams}
            winningCriteria={challengeData.winningCriteria}
            losingTeamOutcome={challengeData.losingTeamOutcome}
            enableReferralBonus={challengeData.enableReferralBonus}
            referralBonusPercentage={challengeData.referralBonusPercentage}
            maxReferrals={challengeData.maxReferrals}
            onAllowPointsOnlyChange={(allowPointsOnly) => setChallengeData({ ...challengeData, allowPointsOnly })}
            onMinParticipantsChange={(minParticipants) => setChallengeData({ ...challengeData, minParticipants })}
            onMaxParticipantsChange={(maxParticipants) => setChallengeData({ ...challengeData, maxParticipants })}
            onStartDateTypeChange={(startDateType) => setChallengeData({ ...challengeData, startDateType })}
            onStartDateDaysChange={(startDateDays) => setChallengeData({ ...challengeData, startDateDays })}
            onEnableTeamModeChange={(enableTeamMode) => setChallengeData({ ...challengeData, enableTeamMode })}
            onTeamAssignmentMethodChange={(teamAssignmentMethod) =>
              setChallengeData({ ...challengeData, teamAssignmentMethod })
            }
            onNumberOfTeamsChange={(numberOfTeams) => setChallengeData({ ...challengeData, numberOfTeams })}
            onWinningCriteriaChange={(winningCriteria) => setChallengeData({ ...challengeData, winningCriteria })}
            onLosingTeamOutcomeChange={(losingTeamOutcome) => setChallengeData({ ...challengeData, losingTeamOutcome })}
            onEnableReferralBonusChange={(enableReferralBonus) =>
              setChallengeData({ ...challengeData, enableReferralBonus })
            }
            onReferralBonusPercentageChange={(referralBonusPercentage) =>
              setChallengeData({ ...challengeData, referralBonusPercentage })
            }
            onMaxReferralsChange={(maxReferrals) => setChallengeData({ ...challengeData, maxReferrals })}
          />
        )
      case 5:
        return (
          <RulesRequirementsStep
            rules={challengeData.rules}
            dailyInstructions={challengeData.dailyInstructions}
            generalInstructions={challengeData.generalInstructions}
            onRulesChange={(rules) => setChallengeData({ ...challengeData, rules })}
            onDailyInstructionsChange={(dailyInstructions) => setChallengeData({ ...challengeData, dailyInstructions })}
            onGeneralInstructionsChange={(generalInstructions) =>
              setChallengeData({ ...challengeData, generalInstructions })
            }
          />
        )
      case 6:
        return (
          <ProofSettingsStep
            selectedProofTypes={challengeData.selectedProofTypes}
            proofInstructions={challengeData.proofInstructions}
            cameraOnly={challengeData.cameraOnly}
            allowLateSubmissions={challengeData.allowLateSubmissions}
            lateSubmissionHours={challengeData.lateSubmissionHours}
            requireTimer={challengeData.requireTimer}
            timerMinDuration={challengeData.timerMinDuration}
            timerMaxDuration={challengeData.timerMaxDuration}
            randomCheckinsEnabled={challengeData.randomCheckinsEnabled}
            randomCheckinProbability={challengeData.randomCheckinProbability}
            onProofTypesChange={(types) => setChallengeData({ ...challengeData, selectedProofTypes: types })}
            onProofInstructionsChange={(instructions) =>
              setChallengeData({ ...challengeData, proofInstructions: instructions })
            }
            onCameraOnlyChange={(cameraOnly) => setChallengeData({ ...challengeData, cameraOnly })}
            onAllowLateSubmissionsChange={(allow) =>
              setChallengeData({ ...challengeData, allowLateSubmissions: allow })
            }
            onLateSubmissionHoursChange={(hours) => setChallengeData({ ...challengeData, lateSubmissionHours: hours })}
            onRequireTimerChange={(requireTimer) => setChallengeData({ ...challengeData, requireTimer })}
            onTimerMinDurationChange={(minutes) => setChallengeData({ ...challengeData, timerMinDuration: minutes })}
            onTimerMaxDurationChange={(minutes) => setChallengeData({ ...challengeData, timerMaxDuration: minutes })}
            onRandomCheckinsEnabledChange={(enabled) => setChallengeData({ ...challengeData, randomCheckinsEnabled: enabled })}
            onRandomCheckinProbabilityChange={(probability) => setChallengeData({ ...challengeData, randomCheckinProbability: probability })}
          />
        )
      case 7:
        return (
          <AiChallengeSummary
            challengeData={challengeData} // Pass the complete challenge data
            onConfirm={(analysis, confirmedRequirements) => {
              setAiAnalysis(analysis)
              // Optionally update challenge data with confirmed requirements
              if (confirmedRequirements) {
                setChallengeData({ 
                  ...challengeData, 
                  dailyInstructions: confirmedRequirements 
                })
              }
              setCurrentStep(currentStep + 1)
            }}
            onEdit={() => setCurrentStep(3)} // Go back to basic info step
          />
        )
      case 8:
        return (
          <SimplifiedStakesStep
            allowPointsOnly={challengeData.allowPointsOnly}
            currency={challengeData.currency}
            stakeTiers={challengeData.stakeTiers}
            minStake={challengeData.minStake}
            maxStake={challengeData.maxStake}
            hostContribution={challengeData.hostContribution}
            bonusRewards={challengeData.bonusRewards}
            rewardDistribution={challengeData.rewardDistribution}
            onAllowPointsOnlyChange={(allowPoints) => setChallengeData({ ...challengeData, allowPointsOnly: allowPoints })}
            onMinStakeChange={(amount) => setChallengeData({ ...challengeData, minStake: amount })}
            onMaxStakeChange={(amount) => setChallengeData({ ...challengeData, maxStake: amount })}
            onHostContributionChange={(amount) => setChallengeData({ ...challengeData, hostContribution: amount })}
            onBonusRewardsChange={(rewards) => setChallengeData({ ...challengeData, bonusRewards: rewards })}
            onRewardDistributionChange={(distribution) =>
              setChallengeData({ ...challengeData, rewardDistribution: distribution })
            }
            onCurrencyChange={(currency) => setChallengeData({ ...challengeData, currency })}
            onStakeTiersChange={(tiers) => setChallengeData({ ...challengeData, stakeTiers: tiers })}
          />
        )
      case 9:
        return (
          <PreviewPublishStep
            challengeData={challengeData}
            onEdit={handleEdit}
            onPublish={handlePublish}
            isPublishing={isPublishing}
            missingFields={getMissingFields()}
            aiAnalysis={aiAnalysis}
          />
        )
      default:
        return null
    }
  }

  const layoutProps = {
    currentStep: currentStep - 1, // Convert to 0-based for swipeable layout
    totalSteps,
    stepId: `step-${currentStep}`,
    onNext: handleNext,
    onBack: handlePrevious
  }

  const stepContent = renderStep()

  if (isMobile) {
    return (
      <SwipeableOnboardingLayout
        {...layoutProps}
        canGoNext={canProceed()}
        canGoBack={currentStep > 1}
        showSkipButton={false}
        showProgress={true}
      >
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Create Your Challenge</h1>
            <p className="text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
          {stepContent}
        </div>
      </SwipeableOnboardingLayout>
    )
  }

  return (
    <CreationLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={handleNext}
      onPrevious={handlePrevious}
      canProceed={canProceed()}
      isLoading={isPublishing}
    >
      {stepContent}
    </CreationLayout>
  )
}
