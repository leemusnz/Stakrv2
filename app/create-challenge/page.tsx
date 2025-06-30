"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreationLayout } from "@/components/challenge-creation/creation-layout"
import { ChallengeTypeStep } from "@/components/challenge-creation/challenge-type-step"
import { BasicInfoStep } from "@/components/challenge-creation/basic-info-step"
import { ChallengeFeaturesStep } from "@/components/challenge-creation/challenge-features-step"
import { RulesRequirementsStep } from "@/components/challenge-creation/rules-requirements-step"
import { ProofSettingsStep } from "@/components/challenge-creation/proof-settings-step"
import { SimplifiedStakesStep } from "@/components/challenge-creation/simplified-stakes-step"
import { PreviewPublishStep } from "@/components/challenge-creation/preview-publish-step"
import { CategorySelectionStep } from "@/components/challenge-creation/category-selection-step"

export default function CreateChallengePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isPublishing, setIsPublishing] = useState(false)

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

    // Step 7: Stakes & Rewards (simplified)
    minStake: 25,
    maxStake: 200,
    hostContribution: 0,
    bonusRewards: [] as string[],
    rewardDistribution: "winner-takes-all",
  })

  const totalSteps = 8

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
        // For points-only challenges, we don't need stake validation
        if (challengeData.allowPointsOnly) {
          return true
        }
        // For money challenges, validate stakes and distribution
        return (
          challengeData.minStake > 0 &&
          challengeData.maxStake > 0 &&
          challengeData.maxStake >= challengeData.minStake &&
          challengeData.rewardDistribution !== ""
        )
      case 8:
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
      return basicFieldsValid
    }

    // For money challenges, also validate stakes
    const stakesValid =
      challengeData.minStake > 0 &&
      challengeData.maxStake > 0 &&
      challengeData.maxStake >= challengeData.minStake &&
      challengeData.rewardDistribution !== ""

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
      if (challengeData.minStake <= 0) missing.push("Minimum stake")
      if (challengeData.maxStake <= 0) missing.push("Maximum stake")
      if (challengeData.maxStake < challengeData.minStake) missing.push("Max stake must be >= min stake")
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
      // Create challenge via API
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(challengeData)
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
            onProofTypesChange={(types) => setChallengeData({ ...challengeData, selectedProofTypes: types })}
            onProofInstructionsChange={(instructions) =>
              setChallengeData({ ...challengeData, proofInstructions: instructions })
            }
            onCameraOnlyChange={(cameraOnly) => setChallengeData({ ...challengeData, cameraOnly })}
            onAllowLateSubmissionsChange={(allow) =>
              setChallengeData({ ...challengeData, allowLateSubmissions: allow })
            }
            onLateSubmissionHoursChange={(hours) => setChallengeData({ ...challengeData, lateSubmissionHours: hours })}
          />
        )
      case 7:
        return (
          <SimplifiedStakesStep
            allowPointsOnly={challengeData.allowPointsOnly}
            minStake={challengeData.minStake}
            maxStake={challengeData.maxStake}
            hostContribution={challengeData.hostContribution}
            bonusRewards={challengeData.bonusRewards}
            rewardDistribution={challengeData.rewardDistribution}
            onMinStakeChange={(amount) => setChallengeData({ ...challengeData, minStake: amount })}
            onMaxStakeChange={(amount) => setChallengeData({ ...challengeData, maxStake: amount })}
            onHostContributionChange={(amount) => setChallengeData({ ...challengeData, hostContribution: amount })}
            onBonusRewardsChange={(rewards) => setChallengeData({ ...challengeData, bonusRewards: rewards })}
            onRewardDistributionChange={(distribution) =>
              setChallengeData({ ...challengeData, rewardDistribution: distribution })
            }
          />
        )
      case 8:
        return (
          <PreviewPublishStep
            challengeData={challengeData}
            onEdit={handleEdit}
            onPublish={handlePublish}
            isPublishing={isPublishing}
            missingFields={getMissingFields()}
          />
        )
      default:
        return null
    }
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
      {renderStep()}
    </CreationLayout>
  )
}
