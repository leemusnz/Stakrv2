"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { CreationLayout } from "@/components/challenge-creation/creation-layout"
import { SwipeableOnboardingLayout } from "@/components/onboarding/swipeable-onboarding-layout"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { BasicInfoStep } from "@/components/challenge-creation/basic-info-step"
import { RulesRequirementsStep } from "@/components/challenge-creation/rules-requirements-step"
import { ProofSettingsStep } from "@/components/challenge-creation/proof-settings-step"
import { SimplifiedStakesStep } from "@/components/challenge-creation/simplified-stakes-step"
import { PreviewPublishStep } from "@/components/challenge-creation/preview-publish-step"
import { CategorySelectionStep } from "@/components/challenge-creation/category-selection-step"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Clock, Users, Shield } from "lucide-react"
import { toast } from "sonner"

export default function EditChallengePage() {
  const { isMobile } = useEnhancedMobile()
  const router = useRouter()
  const params = useParams()
  const challengeId = params.id as string
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [originalChallenge, setOriginalChallenge] = useState<any>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [hasParticipants, setHasParticipants] = useState(false)
  const [restrictions, setRestrictions] = useState<any>(null)

  // Challenge data state - same structure as create challenge
  const [challengeData, setChallengeData] = useState({
    // Step 1: Category
    category: "",

    // Step 2: Basic Info
    title: "",
    description: "",
    tags: [] as string[],
    duration: "",
    difficulty: "",
    thumbnailImage: null as File | null,
    thumbnailUrl: null as string | null,

    // Step 3: Challenge Features & Participants
    allowPointsOnly: true,
    minParticipants: 3,
    maxParticipants: null as number | null,

    // Step 4: Rules & Requirements
    rules: [] as string[],
    dailyInstructions: "",
    generalInstructions: "",

    // Step 5: Proof Settings
    selectedProofTypes: [] as string[],
    proofInstructions: "",
    cameraOnly: false,
    allowLateSubmissions: false,
    lateSubmissionHours: 4,

    // Timer and Random Verification Settings
    requireTimer: false,
    timerMinDuration: 15,
    timerMaxDuration: 120,
    randomCheckinsEnabled: false,
    randomCheckinProbability: 30,

    // Step 6: Stakes & Rewards
    minStake: 25,
    maxStake: 200,
    hostContribution: 0,
    bonusRewards: [] as string[],
    rewardDistribution: "equal-split",
  })

  const totalSteps = 6

  // Load challenge data for editing
  useEffect(() => {
    loadChallengeForEdit()
  }, [challengeId])

  const loadChallengeForEdit = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/challenges/${challengeId}/edit`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load challenge')
      }

      if (!data.success) {
        throw new Error(data.error || 'Challenge not found')
      }

      const challenge = data.challenge
      setOriginalChallenge(challenge)
      setCanEdit(data.canEdit)
      setHasParticipants(data.hasParticipants)
      setRestrictions(data.restrictions)

      // Map database fields to form state
      setChallengeData({
        category: challenge.category || "",
        title: challenge.title || "",
        description: challenge.description || "",
        tags: challenge.tags || [],
        duration: challenge.duration || "",
        difficulty: challenge.difficulty || "",
        thumbnailImage: null,
        thumbnailUrl: challenge.thumbnail_url || null,
        allowPointsOnly: challenge.allow_points_only ?? true,
        minParticipants: challenge.min_participants || 3,
        maxParticipants: challenge.max_participants,
        rules: challenge.rules || [],
        dailyInstructions: challenge.daily_instructions || "",
        generalInstructions: challenge.general_instructions || "",
        selectedProofTypes: challenge.selected_proof_types || [],
        proofInstructions: challenge.proof_instructions || "",
        cameraOnly: challenge.camera_only || false,
        allowLateSubmissions: challenge.allow_late_submissions || false,
        lateSubmissionHours: challenge.late_submission_hours || 4,
        requireTimer: challenge.require_timer || false,
        timerMinDuration: challenge.timer_min_duration || 15,
        timerMaxDuration: challenge.timer_max_duration || 120,
        randomCheckinsEnabled: challenge.random_checkin_enabled || false,
        randomCheckinProbability: challenge.random_checkin_probability || 30,
        minStake: challenge.min_stake || 25,
        maxStake: challenge.max_stake || 200,
        hostContribution: challenge.host_contribution || 0,
        bonusRewards: challenge.bonus_rewards || [],
        rewardDistribution: challenge.reward_distribution || "equal-split",
      })

      if (!data.canEdit) {
        toast.error('This challenge cannot be edited because it has already started or completed.')
        router.push('/my-challenges')
        return
      }

    } catch (error) {
      console.error('Failed to load challenge for editing:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load challenge')
      router.push('/my-challenges')
    } finally {
      setIsLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return challengeData.category !== ""
      case 2: return challengeData.title && challengeData.description && challengeData.duration && challengeData.difficulty
      case 3: return challengeData.rules.length > 0 && challengeData.dailyInstructions
      case 4: return challengeData.selectedProofTypes.length > 0 && challengeData.proofInstructions
      case 5: return !challengeData.allowPointsOnly ? challengeData.minStake > 0 && challengeData.maxStake > 0 : true
      case 6: return true
      default: return false
    }
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

  const handleSave = async () => {
    setIsSaving(true)

    try {
      let thumbnailUrl = challengeData.thumbnailUrl

      // Upload new thumbnail if provided
      if (challengeData.thumbnailImage) {
        try {
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
              challengeId: challengeId
            })
          })

          if (!presignedResponse.ok) {
            throw new Error('Failed to get upload URL for thumbnail')
          }

          const { uploadUrl, fileKey } = await presignedResponse.json()

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

          thumbnailUrl = `https://stakr-verification-files.s3.ap-southeast-2.amazonaws.com/${fileKey}`
          console.log('✅ New thumbnail uploaded:', thumbnailUrl)
        } catch (uploadError) {
          console.error('❌ Thumbnail upload failed:', uploadError)
          toast.error('Failed to upload new thumbnail. Changes will be saved without thumbnail update.')
        }
      }

      // Update challenge with new data
      const updatePayload = {
        title: challengeData.title,
        description: challengeData.description,
        category: challengeData.category,
        difficulty: challengeData.difficulty,
        thumbnailUrl,
        tags: challengeData.tags,
        rules: challengeData.rules,
        dailyInstructions: challengeData.dailyInstructions,
        generalInstructions: challengeData.generalInstructions,
        proofInstructions: challengeData.proofInstructions,
        selectedProofTypes: challengeData.selectedProofTypes,
        cameraOnly: challengeData.cameraOnly,
        allowLateSubmissions: challengeData.allowLateSubmissions,
        lateSubmissionHours: challengeData.lateSubmissionHours,
        requireTimer: challengeData.requireTimer,
        timerMinDuration: challengeData.timerMinDuration,
        timerMaxDuration: challengeData.timerMaxDuration,
        randomCheckinEnabled: challengeData.randomCheckinsEnabled,
        randomCheckinProbability: challengeData.randomCheckinProbability,
        // Only include these if no participants (API will validate)
        ...(!hasParticipants && {
          minStake: challengeData.minStake,
          maxStake: challengeData.maxStake,
          duration: challengeData.duration,
          allowPointsOnly: challengeData.allowPointsOnly,
        })
      }

      const response = await fetch(`/api/challenges/${challengeId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`)
      }

      if (result.success) {
        toast.success('Challenge updated successfully!')
        router.push('/my-challenges')
      } else {
        throw new Error(result.error || 'Failed to update challenge')
      }
    } catch (error) {
      console.error("Failed to update challenge:", error)
      toast.error(`Failed to update challenge: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Cannot Edit Challenge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>This challenge cannot be edited because it has already started or completed.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CategorySelectionStep
            selectedCategory={challengeData.category}
            onCategorySelect={(category) =>
              setChallengeData({ ...challengeData, category })
            }
          />
        )
      case 2:
        return (
          <BasicInfoStep
            title={challengeData.title}
            description={challengeData.description}
            tags={challengeData.tags}
            duration={challengeData.duration}
            difficulty={challengeData.difficulty}
            thumbnailImage={challengeData.thumbnailImage}
            isPrivate={false}
            onTitleChange={(title) =>
              setChallengeData({ ...challengeData, title })
            }
            onDescriptionChange={(description) =>
              setChallengeData({ ...challengeData, description })
            }
            onTagsChange={(tags) =>
              setChallengeData({ ...challengeData, tags })
            }
            onDurationChange={(duration) =>
              setChallengeData({ ...challengeData, duration })
            }
            onDifficultyChange={(difficulty) =>
              setChallengeData({ ...challengeData, difficulty })
            }
            onThumbnailImageChange={(thumbnailImage) =>
              setChallengeData({ ...challengeData, thumbnailImage })
            }
          />
        )
      case 3:
        return (
          <RulesRequirementsStep
            rules={challengeData.rules}
            dailyInstructions={challengeData.dailyInstructions}
            generalInstructions={challengeData.generalInstructions}
            onRulesChange={(rules) =>
              setChallengeData({ ...challengeData, rules })
            }
            onDailyInstructionsChange={(dailyInstructions) =>
              setChallengeData({ ...challengeData, dailyInstructions })
            }
            onGeneralInstructionsChange={(generalInstructions) =>
              setChallengeData({ ...challengeData, generalInstructions })
            }
          />
        )
      case 4:
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
            onSelectedProofTypesChange={(selectedProofTypes: string[]) =>
              setChallengeData({ ...challengeData, selectedProofTypes })
            }
            onProofInstructionsChange={(proofInstructions) =>
              setChallengeData({ ...challengeData, proofInstructions })
            }
            onCameraOnlyChange={(cameraOnly) =>
              setChallengeData({ ...challengeData, cameraOnly })
            }
            onAllowLateSubmissionsChange={(allowLateSubmissions) =>
              setChallengeData({ ...challengeData, allowLateSubmissions })
            }
            onLateSubmissionHoursChange={(lateSubmissionHours) =>
              setChallengeData({ ...challengeData, lateSubmissionHours })
            }
            onRequireTimerChange={(requireTimer) =>
              setChallengeData({ ...challengeData, requireTimer })
            }
            onTimerMinDurationChange={(timerMinDuration) =>
              setChallengeData({ ...challengeData, timerMinDuration })
            }
            onTimerMaxDurationChange={(timerMaxDuration) =>
              setChallengeData({ ...challengeData, timerMaxDuration })
            }
            onRandomCheckinsEnabledChange={(randomCheckinsEnabled) =>
              setChallengeData({ ...challengeData, randomCheckinsEnabled })
            }
            onRandomCheckinProbabilityChange={(randomCheckinProbability) =>
              setChallengeData({ ...challengeData, randomCheckinProbability })
            }
          />
        )
      case 5:
        return (
          <SimplifiedStakesStep
            allowPointsOnly={challengeData.allowPointsOnly}
            minStake={challengeData.minStake}
            maxStake={challengeData.maxStake}
            hostContribution={challengeData.hostContribution}
            bonusRewards={challengeData.bonusRewards}
            rewardDistribution={challengeData.rewardDistribution}
            onAllowPointsOnlyChange={(allowPointsOnly) =>
              setChallengeData({ ...challengeData, allowPointsOnly })
            }
            onMinStakeChange={(minStake) =>
              setChallengeData({ ...challengeData, minStake })
            }
            onMaxStakeChange={(maxStake) =>
              setChallengeData({ ...challengeData, maxStake })
            }
            onHostContributionChange={(hostContribution) =>
              setChallengeData({ ...challengeData, hostContribution })
            }
            onBonusRewardsChange={(bonusRewards) =>
              setChallengeData({ ...challengeData, bonusRewards })
            }
            onRewardDistributionChange={(rewardDistribution) =>
              setChallengeData({ ...challengeData, rewardDistribution })
            }
            isEditing={true}
            hasParticipants={hasParticipants}
          />
        )
      case 6:
        return (
          <PreviewPublishStep
            challengeData={{
              ...challengeData,
              privacyType: "public" // Assuming public for now
            }}
            onEdit={handleEdit}
            onPublish={handleSave}
            isPublishing={isSaving}
            missingFields={[]}
            isEditing={true}
          />
        )
      default:
        return null
    }
  }

  const pageTitle = `Edit Challenge: ${challengeData.title || 'Loading...'}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with restrictions warning */}
      <div className="bg-white border-b">
        <div className="container max-w-6xl mx-auto p-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold">Edit Challenge</h1>
              <p className="text-muted-foreground">Make changes to your challenge before it starts</p>
            </div>
            
            {/* Restrictions Notice */}
            {hasParticipants && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-amber-600" />
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                        <Users className="w-3 h-3 mr-1" />
                        {hasParticipants ? 'Has Participants' : 'No Participants'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-800">Limited Editing Available</p>
                      <p className="text-xs text-amber-700">
                        Stakes, duration, and start date cannot be changed because participants have already joined.
                        You can still edit the title, description, rules, and proof requirements.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {isMobile ? (
        <SwipeableOnboardingLayout
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={handleNext}
          onPrevious={handlePrevious}
          canProceed={canProceed()}
          isLoading={isSaving}
          finalButtonText="Save Changes"
          stepTitles={["Category", "Info", "Rules", "Proof", "Stakes", "Review"]}
        >
          {renderStep()}
        </SwipeableOnboardingLayout>
      ) : (
        <CreationLayout
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={handleNext}
          onPrevious={handlePrevious}
          canProceed={canProceed()}
          isLoading={isSaving}
          finalButtonText="Save Changes"
        >
          {renderStep()}
        </CreationLayout>
      )}
    </div>
  )
}
