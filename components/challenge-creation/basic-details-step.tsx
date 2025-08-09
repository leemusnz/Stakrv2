"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useImageCompression } from "@/hooks/use-image-compression"
import { toast } from "sonner"
import {
  Upload,
  X,
  ImageIcon,
  Plus,
  Users,
  UserPlus,
  Gift,
  Trophy,
  Zap,
  Info,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react"

interface BasicDetailsStepProps {
  title: string
  description: string
  category: string
  tags: string[]
  duration: string
  difficulty: string
  thumbnailImage: File | null
  // Participant Settings (for both private and public)
  minParticipants: number
  maxParticipants: number | null // null means unlimited
  // Start Date Settings (for both private and public)
  startDateType: string
  startDateDays: number
  // Privacy Settings
  isPrivate: boolean
  joinDeadlineType: string
  joinDeadlineDays: number
  // Team Challenge Settings
  enableTeamMode: boolean
  teamAssignmentMethod: string
  numberOfTeams: number
  winningCriteria: string
  losingTeamOutcome: string
  // Referral Settings
  enableReferralBonus: boolean
  referralBonusPercentage: number
  maxReferrals: number
  onTitleChange: (title: string) => void
  onDescriptionChange: (description: string) => void
  onCategoryChange: (category: string) => void
  onTagsChange: (tags: string[]) => void
  onDurationChange: (duration: string) => void
  onDifficultyChange: (difficulty: string) => void
  onThumbnailImageChange: (image: File | null) => void
  onMinParticipantsChange: (min: number) => void
  onMaxParticipantsChange: (max: number | null) => void
  onStartDateTypeChange: (type: string) => void
  onStartDateDaysChange: (days: number) => void
  onIsPrivateChange: (isPrivate: boolean) => void
  onJoinDeadlineTypeChange: (type: string) => void
  onJoinDeadlineDaysChange: (days: number) => void
  onEnableTeamModeChange: (enabled: boolean) => void
  onTeamAssignmentMethodChange: (method: string) => void
  onNumberOfTeamsChange: (teams: number) => void
  onWinningCriteriaChange: (criteria: string) => void
  onLosingTeamOutcomeChange: (outcome: string) => void
  onEnableReferralBonusChange: (enabled: boolean) => void
  onReferralBonusPercentageChange: (percentage: number) => void
  onMaxReferralsChange: (max: number) => void
}

const categories = [
  "Health & Fitness",
  "Mindfulness & Mental Health",
  "Productivity & Career",
  "Learning & Skills",
  "Social & Community",
  "Habits & Lifestyle",
]

const durations = [
  { value: "7", label: "1 Week" },
  { value: "14", label: "2 Weeks" },
  { value: "21", label: "3 Weeks" },
  { value: "30", label: "1 Month" },
  { value: "60", label: "2 Months" },
  { value: "90", label: "3 Months" },
]

const difficulties = [
  { value: "beginner", label: "Beginner", description: "Easy to start, minimal time commitment" },
  { value: "intermediate", label: "Intermediate", description: "Moderate effort, some experience helpful" },
  { value: "advanced", label: "Advanced", description: "High commitment, significant effort required" },
]

const suggestedTags = [
  "Daily",
  "Morning",
  "Evening",
  "Wellness",
  "Productivity",
  "Social",
  "Creative",
  "Learning",
  "Fitness",
  "Mindful",
  "Team Challenge",
  "Competition",
  "Referral Bonus",
  "Private Group",
  "Friends Only",
  "Solo Challenge",
]

const teamAssignmentMethods = [
  {
    value: "auto-balance",
    label: "Auto-Balance",
    description: "Users randomly placed in teams, keeping sizes equal",
  },
  {
    value: "manual-invite",
    label: "Manual Invite",
    description: "Users create teams and invite friends to join",
  },
  {
    value: "join-existing",
    label: "Join Existing",
    description: "Users can pick which team to join (Red vs Blue style)",
  },
]

const winningCriteriaOptions = [
  {
    value: "completion-rate",
    label: "Highest Completion Rate",
    description: "Team with highest % of members who finish wins",
  },
  {
    value: "average-streak",
    label: "Longest Average Streak",
    description: "Team with longest average streak per member wins",
  },
  {
    value: "total-submissions",
    label: "Most Proof Submissions",
    description: "Team with most daily proof submissions wins",
  },
]

const losingTeamOutcomes = [
  {
    value: "lose-stake",
    label: "Lose Their Stake",
    description: "Most motivating - losing team forfeits their money",
    icon: "❌",
  },
  {
    value: "comeback-discount",
    label: "Comeback Discount",
    description: "Losing team gets discount to try again",
    icon: "💸",
  },
  {
    value: "consolation-points",
    label: "Consolation Points",
    description: "Losing team gets experience points/leaderboard score",
    icon: "🪙",
  },
]

const startDateTypes = [
  { value: "days", label: "Fixed Days", description: "Challenge starts after X days" },
  { value: "participants", label: "When Full", description: "Challenge starts when enough people join" },
  { value: "manual", label: "Manual Start", description: "You decide when to start the challenge" },
]

const minParticipantOptions = [
  { value: 1, label: "1 person (Solo)", description: "Just you - win your stake back or lose it to Stakr" },
  { value: 2, label: "2 people", description: "You + 1 other person" },
  { value: 3, label: "3 people", description: "Small group challenge" },
  { value: 4, label: "4 people", description: "Perfect for close friends" },
  { value: 5, label: "5 people", description: "Small team size" },
  { value: 8, label: "8 people", description: "Medium group" },
  { value: 10, label: "10 people", description: "Larger group" },
  { value: 15, label: "15 people", description: "Big group challenge" },
  { value: 20, label: "20 people", description: "Large community" },
]

const getMaxParticipantOptions = (isPrivate: boolean, enableTeamMode: boolean) => {
  const baseOptions = [
    { value: null, label: "Unlimited", description: "No limit on participants" },
    { value: 5, label: "5 people max", description: "Keep it small and intimate" },
    { value: 10, label: "10 people max", description: "Medium-sized group" },
    { value: 15, label: "15 people max", description: "Manageable group size" },
    { value: 20, label: "20 people max", description: "Large but controlled" },
    { value: 30, label: "30 people max", description: "Big group challenge" },
    { value: 50, label: "50 people max", description: "Large community" },
  ]

  // For public challenges, cap at 50 (or 100 for teams)
  if (!isPrivate) {
    const maxAllowed = enableTeamMode ? 100 : 50
    if (enableTeamMode) {
      baseOptions.push({ value: 100, label: "100 people max", description: "Very large team competition" })
    }
    return baseOptions.filter((option) => option.value === null || option.value <= maxAllowed)
  }

  // For private challenges, allow unlimited
  return [...baseOptions, { value: 100, label: "100 people max", description: "Very large group" }]
}

export function BasicDetailsStep({
  title,
  description,
  category,
  tags,
  duration,
  difficulty,
  thumbnailImage,
  minParticipants,
  maxParticipants,
  startDateType,
  startDateDays,
  isPrivate,
  joinDeadlineType,
  joinDeadlineDays,
  enableTeamMode,
  teamAssignmentMethod,
  numberOfTeams,
  winningCriteria,
  losingTeamOutcome,
  enableReferralBonus,
  referralBonusPercentage,
  maxReferrals,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onTagsChange,
  onDurationChange,
  onDifficultyChange,
  onThumbnailImageChange,
  onMinParticipantsChange,
  onMaxParticipantsChange,
  onStartDateTypeChange,
  onStartDateDaysChange,
  onIsPrivateChange,
  onJoinDeadlineTypeChange,
  onJoinDeadlineDaysChange,
  onEnableTeamModeChange,
  onTeamAssignmentMethodChange,
  onNumberOfTeamsChange,
  onWinningCriteriaChange,
  onLosingTeamOutcomeChange,
  onEnableReferralBonusChange,
  onReferralBonusPercentageChange,
  onMaxReferralsChange,
}: BasicDetailsStepProps) {
  const [newTag, setNewTag] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { compressImageFile, isCompressing, compressionProgress } = useImageCompression()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("image/")) {
        await handleImageUpload(file)
      }
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type.startsWith("image/")) {
        await handleImageUpload(file)
      }
    }
  }

  const handleImageUpload = async (file: File) => {
    try {
      toast.loading("Optimizing image...", { id: "image-compression" })
      
      // Compress the image with thumbnail preset
      const compressedFile = await compressImageFile(file, 'thumbnail')
      
      toast.success(`Image optimized! ${((1 - compressedFile.size / file.size) * 100).toFixed(0)}% smaller`, { 
        id: "image-compression",
        duration: 3000 
      })
      
      onThumbnailImageChange(compressedFile)
    } catch (error) {
      console.error('Image compression failed:', error)
      toast.error("Failed to optimize image. Using original.", { 
        id: "image-compression",
        duration: 3000 
      })
      // Fall back to original file
      onThumbnailImageChange(file)
    }
  }

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag) && tags.length < 5) {
      onTagsChange([...tags, tag])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove))
  }

  const isSoloChallenge = minParticipants === 1

  // Validation helpers
  const hasRequiredFields = title && description && duration && difficulty
  const missingFields = []
  if (!title) missingFields.push("Title")
  if (!description) missingFields.push("Description")
  if (!duration) missingFields.push("Duration")
  if (!difficulty) missingFields.push("Difficulty")

  return (
    <div className="space-y-8">
      {/* Validation Alert */}
      {!hasRequiredFields && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-orange-700 mb-1">Required fields missing:</p>
              <p className="text-orange-600 text-sm">
                Please complete: {missingFields.join(", ")} to continue to the next step.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-base font-semibold">
            Challenge Title *
          </Label>
          <Input
            id="title"
            placeholder={
              isSoloChallenge
                ? "e.g., My Personal 30-Day Meditation Journey"
                : isPrivate
                  ? enableTeamMode
                    ? "e.g., Smith Family Fitness Battle"
                    : "e.g., Friends Morning Meditation Challenge"
                  : enableTeamMode
                    ? "e.g., Red vs Blue: 30-Day Fitness Battle"
                    : "e.g., 30-Day Morning Meditation Challenge"
            }
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className={`text-lg ${!title ? "border-orange-300 focus:border-orange-500" : ""}`}
          />
          <p className="text-sm text-muted-foreground">
            {isSoloChallenge
              ? "Make it personal and motivating. This is your personal challenge!"
              : isPrivate
                ? "Make it personal and fun for your group. Include group name or inside jokes!"
                : enableTeamMode
                  ? "Make it competitive and exciting. Include team elements in the title."
                  : "Make it clear and motivating. This is what people see first."}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-base font-semibold">
            Description *
          </Label>
          <Textarea
            id="description"
            placeholder={
              isSoloChallenge
                ? "Describe your personal challenge, what you want to achieve, and why it matters to you..."
                : isPrivate
                  ? "Describe what your group will do together, why it'll be fun, and what you'll achieve..."
                  : enableTeamMode
                    ? "Describe the team competition, how teams will compete, and what the winning team gets..."
                    : "Describe your challenge, what participants will do, and what they'll gain from it..."
            }
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={4}
            className={`resize-none ${!description ? "border-orange-300 focus:border-orange-500" : ""}`}
          />
          <p className="text-sm text-muted-foreground">
            {isSoloChallenge
              ? "Explain why this challenge is important to you and what you hope to achieve."
              : isPrivate
                ? "Keep it casual and motivating for your specific group."
                : enableTeamMode
                  ? "Explain the team competition and what makes it exciting to compete together."
                  : "Explain the challenge clearly. Include benefits and what makes it special."}
          </p>
        </div>

        {/* Thumbnail Image Upload */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Challenge Thumbnail</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {thumbnailImage ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img
                    src={URL.createObjectURL(thumbnailImage) || "/placeholder.svg"}
                    alt="Challenge thumbnail"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                    onClick={() => onThumbnailImageChange(null)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{thumbnailImage.name}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-lg font-medium">Drop your image here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Choose Image
                </Button>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          <p className="text-sm text-muted-foreground">
            Upload a compelling image that represents your challenge. JPG, PNG up to 5MB.
          </p>
        </div>
      </div>

      {/* Challenge Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-base font-semibold">Duration *</Label>
          <Select value={duration} onValueChange={onDurationChange}>
            <SelectTrigger className={!duration ? "border-orange-300 focus:border-orange-500" : ""}>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {durations.map((dur) => (
                <SelectItem key={dur.value} value={dur.value}>
                  {dur.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold">Difficulty Level *</Label>
          <div className="grid grid-cols-1 gap-2">
            {difficulties.map((diff) => (
              <Card
                key={diff.value}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  difficulty === diff.value
                    ? "ring-2 ring-primary bg-primary/5"
                    : !difficulty
                      ? "border-orange-300 hover:border-orange-400"
                      : "hover:bg-muted/50"
                }`}
                onClick={() => onDifficultyChange(diff.value)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{diff.label}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-xs">{diff.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Participant Settings */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Participant Settings</CardTitle>
              <CardDescription className="text-sm">Control how many people can join your challenge</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Minimum Participants *</Label>
              <Select
                value={minParticipants.toString()}
                onValueChange={(value) => {
                  const min = Number(value)
                  onMinParticipantsChange(min)
                  // If setting min to 1, also set max to 1 for solo challenge
                  if (min === 1) {
                    onMaxParticipantsChange(1)
                  }
                  // If min is greater than current max, update max
                  if (maxParticipants !== null && min > maxParticipants) {
                    onMaxParticipantsChange(min)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minParticipantOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isSoloChallenge && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Maximum Participants</Label>
                <Select
                  value={maxParticipants?.toString() || "unlimited"}
                  onValueChange={(value) => {
                    if (value === "unlimited") {
                      onMaxParticipantsChange(null)
                    } else {
                      const max = Number(value)
                      onMaxParticipantsChange(max)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getMaxParticipantOptions(isPrivate, enableTeamMode)
                      .filter((option) => option.value === null || option.value >= minParticipants)
                      .map((option) => (
                        <SelectItem key={option.value || "unlimited"} value={option.value?.toString() || "unlimited"}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Solo Challenge Info */}
          {isSoloChallenge && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-700 mb-1">Solo Challenge:</p>
                  <ul className="text-blue-600 space-y-1 text-xs">
                    <li>• Complete the challenge to win your stake back</li>
                    <li>• Fail the challenge and Stakr keeps your stake</li>
                    <li>• Perfect for personal accountability and self-discipline</li>
                    <li>• No competition with others - just you vs the challenge</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Multi-participant Info */}
          {!isSoloChallenge && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-green-700 mb-1">Group Challenge:</p>
                  <ul className="text-green-600 space-y-1 text-xs">
                    <li>
                      • Minimum {minParticipants} {minParticipants === 1 ? "person" : "people"} needed to start
                    </li>
                    <li>
                      •{" "}
                      {maxParticipants ? `Maximum ${maxParticipants} people allowed` : "Unlimited participants allowed"}
                    </li>
                    <li>• Rewards distributed based on your chosen payout method</li>
                    <li>• Social accountability increases success rates</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Start Date Settings - Show for all multi-participant challenges */}
      {!isSoloChallenge && (
        <Card className="border-2 border-secondary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Calendar className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <CardTitle className="text-base">Challenge Start Date</CardTitle>
                <CardDescription className="text-sm">Choose when your challenge should begin</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">When Should the Challenge Start?</Label>
              <RadioGroup value={startDateType} onValueChange={onStartDateTypeChange}>
                {startDateTypes.map((type) => (
                  <div key={type.value} className="flex items-start space-x-3 space-y-0">
                    <RadioGroupItem value={type.value} id={`start-${type.value}`} className="mt-1" />
                    <div className="space-y-1 flex-1">
                      <Label htmlFor={`start-${type.value}`} className="text-sm font-medium cursor-pointer">
                        {type.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>

              {startDateType === "days" && (
                <div className="ml-6 space-y-2">
                  <Label className="text-sm font-medium">Start After How Many Days?</Label>
                  <Select
                    value={startDateDays.toString()}
                    onValueChange={(value) => onStartDateDaysChange(Number(value))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="2">2 days</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="5">5 days</SelectItem>
                      <SelectItem value="7">1 week</SelectItem>
                      <SelectItem value="14">2 weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-secondary mb-1">Start Date Options:</p>
                  <ul className="text-muted-foreground space-y-1 text-xs">
                    <li>
                      • <strong>Fixed Days:</strong> Gives people time to prepare and join
                    </li>
                    <li>
                      • <strong>When Full:</strong> Starts automatically when you reach max participants
                    </li>
                    <li>
                      • <strong>Manual Start:</strong> You control exactly when to begin
                    </li>
                    {isPrivate && (
                      <li>
                        • <strong>Private challenges:</strong> Perfect for coordinating with your group
                      </li>
                    )}
                    {!isPrivate && (
                      <li>
                        • <strong>Public challenges:</strong> Builds anticipation and allows discovery
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Challenge Features - Only show for multi-participant challenges */}
      {!isSoloChallenge && (
        <div className="space-y-6">
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Challenge Features
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Add special features to make your challenge more engaging and social.
            </p>

            {/* Team vs Team Mode */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Team vs Team Mode</CardTitle>
                      <CardDescription className="text-sm">
                        Split participants into competing teams for ultimate accountability
                      </CardDescription>
                    </div>
                  </div>
                  <Switch checked={enableTeamMode} onCheckedChange={onEnableTeamModeChange} />
                </div>
              </CardHeader>

              {enableTeamMode && (
                <CardContent className="pt-0 space-y-6">
                  {/* Number of Teams */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Number of Teams</Label>
                    <Select
                      value={numberOfTeams.toString()}
                      onValueChange={(value) => onNumberOfTeamsChange(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 Teams (Red vs Blue)</SelectItem>
                        <SelectItem value="3">3 Teams</SelectItem>
                        <SelectItem value="4">4 Teams</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Start with 2 teams for simplicity - most competitive and easy to understand.
                    </p>
                  </div>

                  {/* Team Assignment Method */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Team Assignment Method</Label>
                    <RadioGroup value={teamAssignmentMethod} onValueChange={onTeamAssignmentMethodChange}>
                      {teamAssignmentMethods.map((method) => (
                        <div key={method.value} className="flex items-start space-x-3 space-y-0">
                          <RadioGroupItem value={method.value} id={method.value} className="mt-1" />
                          <div className="space-y-1 flex-1">
                            <Label htmlFor={method.value} className="text-sm font-medium cursor-pointer">
                              {method.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">{method.description}</p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Winning Criteria */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">How Teams Win</Label>
                    <RadioGroup value={winningCriteria} onValueChange={onWinningCriteriaChange}>
                      {winningCriteriaOptions.map((criteria) => (
                        <div key={criteria.value} className="flex items-start space-x-3 space-y-0">
                          <RadioGroupItem value={criteria.value} id={criteria.value} className="mt-1" />
                          <div className="space-y-1 flex-1">
                            <Label htmlFor={criteria.value} className="text-sm font-medium cursor-pointer">
                              {criteria.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">{criteria.description}</p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Losing Team Outcome */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">What Happens to Losing Teams?</Label>
                    <RadioGroup value={losingTeamOutcome} onValueChange={onLosingTeamOutcomeChange}>
                      {losingTeamOutcomes.map((outcome) => (
                        <div key={outcome.value} className="flex items-start space-x-3 space-y-0">
                          <RadioGroupItem value={outcome.value} id={outcome.value} className="mt-1" />
                          <div className="space-y-1 flex-1">
                            <Label
                              htmlFor={outcome.value}
                              className="text-sm font-medium cursor-pointer flex items-center gap-2"
                            >
                              <span>{outcome.icon}</span>
                              {outcome.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">{outcome.description}</p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Team Mode Explanation */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Trophy className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-primary mb-2">How Team vs Team Works:</p>
                        <ul className="text-muted-foreground space-y-1 text-xs">
                          <li>• Participants join your challenge and get assigned to teams</li>
                          <li>• Teams compete based on your chosen winning criteria</li>
                          <li>• Winning team splits the reward pool using your payout method</li>
                          <li>• Creates intense social accountability and friendly competition</li>
                          <li>• Uses all your existing reward distribution logic</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Referral Bonus - Only show for public challenges */}
            {!isPrivate && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <UserPlus className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Referral Bonus Rewards</CardTitle>
                        <CardDescription className="text-sm">
                          Reward participants for inviting friends to join
                        </CardDescription>
                      </div>
                    </div>
                    <Switch checked={enableReferralBonus} onCheckedChange={onEnableReferralBonusChange} />
                  </div>
                </CardHeader>

                {enableReferralBonus && (
                  <CardContent className="pt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Bonus Percentage</Label>
                        <Select
                          value={referralBonusPercentage.toString()}
                          onValueChange={(value) => onReferralBonusPercentageChange(Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10% per referral</SelectItem>
                            <SelectItem value="15">15% per referral</SelectItem>
                            <SelectItem value="20">20% per referral</SelectItem>
                            <SelectItem value="25">25% per referral</SelectItem>
                            <SelectItem value="30">30% per referral</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Max Referrals</Label>
                        <Select
                          value={maxReferrals.toString()}
                          onValueChange={(value) => onMaxReferralsChange(Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 referral max</SelectItem>
                            <SelectItem value="2">2 referrals max</SelectItem>
                            <SelectItem value="3">3 referrals max</SelectItem>
                            <SelectItem value="5">5 referrals max</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Zap className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-secondary mb-2">How Referral Bonuses Work:</p>
                          <ul className="text-muted-foreground space-y-1 text-xs">
                            <li>• Participants get unique referral links to share with friends</li>
                            <li>• Bonus only applies if referred friends complete the challenge</li>
                            <li>
                              • {referralBonusPercentage}% bonus added to their final reward for each successful
                              referral
                            </li>
                            <li>• Maximum {maxReferrals} successful referrals per person</li>
                            <li>• Drives viral growth and makes challenges more social</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Tags</Label>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                  onClick={() => removeTag(tag)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>

          {tags.length < 5 && (
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag(newTag)
                  }
                }}
                className="flex-1"
              />
              <Button onClick={() => addTag(newTag)} disabled={!newTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Suggested tags:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedTags
                .filter((tag) => !tags.includes(tag))
                .filter((tag) => {
                  // Show relevant tags based on enabled features
                  if (isSoloChallenge && tag === "Solo Challenge") return true
                  if (isPrivate && ["Private Group", "Friends Only"].includes(tag)) return true
                  if (enableTeamMode && ["Team Challenge", "Competition"].includes(tag)) return true
                  if (enableReferralBonus && tag === "Referral Bonus") return true
                  if (
                    !enableTeamMode &&
                    !enableReferralBonus &&
                    !isPrivate &&
                    !isSoloChallenge &&
                    [
                      "Team Challenge",
                      "Competition",
                      "Referral Bonus",
                      "Private Group",
                      "Friends Only",
                      "Solo Challenge",
                    ].includes(tag)
                  )
                    return false
                  return true
                })
                .slice(0, 8)
                .map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    onClick={() => addTag(tag)}
                    disabled={tags.length >= 5}
                    className="h-7 text-xs"
                  >
                    {tag}
                  </Button>
                ))}
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Add up to 5 tags to help people discover your challenge.</p>
      </div>
    </div>
  )
}
