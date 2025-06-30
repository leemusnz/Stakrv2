"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Edit,
  Eye,
  Users,
  Calendar,
  DollarSign,
  Trophy,
  CheckCircle,
  Camera,
  FileText,
  Video,
  Upload,
  Clock,
  Target,
  Rocket,
  ImageIcon,
  AlertTriangle,
  X,
} from "lucide-react"

interface PreviewPublishStepProps {
  challengeData: any
  onEdit: (step: number) => void
  onPublish: () => void
  isPublishing: boolean
  missingFields: string[]
}

const proofTypeIcons = {
  photo: Camera,
  video: Video,
  text: FileText,
  file: Upload,
}

const proofTypeLabels = {
  photo: "Photo",
  video: "Video",
  text: "Text",
  file: "File",
}

export function PreviewPublishStep({
  challengeData,
  onEdit,
  onPublish,
  isPublishing,
  missingFields,
}: PreviewPublishStepProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeTitle = (type: string) => {
    const types = {
      "habit-building": "Habit Building",
      "fitness-health": "Fitness & Health",
      "skill-learning": "Skill Learning",
      "mindfulness-mental": "Mindfulness & Mental Health",
      "productivity-career": "Productivity & Career",
      "social-community": "Social & Community",
    }
    return types[type as keyof typeof types] || type
  }

  const getRewardDistributionLabel = (distribution: string) => {
    switch (distribution) {
      case "winner-takes-all":
        return "Winner Takes All"
      case "equal-split":
        return "Equal Split Among Winners"
      case "proportional":
        return "Proportional to Stake"
      default:
        return distribution
    }
  }

  const isReadyToPublish = missingFields.length === 0

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Preview your challenge</h2>
        <p className="text-muted-foreground">
          Review all the details before publishing. You can edit any section by clicking the edit buttons.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Challenge Header */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {challengeData.thumbnailImage ? (
                      <img
                        src={URL.createObjectURL(challengeData.thumbnailImage) || "/placeholder.svg"}
                        alt="Challenge thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{getTypeTitle(challengeData.category)}</Badge>
                      <Badge className={getDifficultyColor(challengeData.difficulty)}>{challengeData.difficulty}</Badge>
                    </div>
                    <CardTitle className="text-xl">{challengeData.title || "Challenge Title"}</CardTitle>
                    <CardDescription className="text-base">
                      {challengeData.description || "Challenge description"}
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => onEdit(3)} className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {challengeData.duration} days
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {challengeData.privacyType === "public" ? "Public" : "Private"}
                </div>
                {!challengeData.allowPointsOnly && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />${challengeData.minStake} - ${challengeData.maxStake}
                  </div>
                )}
                {challengeData.allowPointsOnly && (
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    Points Only
                  </div>
                )}
              </div>

              {challengeData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {challengeData.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rules & Instructions */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Rules & Instructions</CardTitle>
                <Button variant="outline" size="sm" onClick={() => onEdit(5)} className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Challenge Rules
                </h4>
                {challengeData.rules.length > 0 ? (
                  <ul className="space-y-2">
                    {challengeData.rules.map((rule: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Badge variant="outline" className="mt-0.5 text-xs">
                          {index + 1}
                        </Badge>
                        {rule}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No rules added yet</p>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-secondary" />
                  Daily Instructions
                </h4>
                <p className="text-sm text-muted-foreground">
                  {challengeData.dailyInstructions || "No daily instructions added yet"}
                </p>
              </div>

              {challengeData.generalInstructions && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Additional Instructions</h4>
                    <p className="text-sm text-muted-foreground">{challengeData.generalInstructions}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Proof Settings */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Proof Requirements</CardTitle>
                <Button variant="outline" size="sm" onClick={() => onEdit(6)} className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Accepted Proof Types</h4>
                {challengeData.selectedProofTypes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {challengeData.selectedProofTypes.map((type: string) => {
                      const Icon = proofTypeIcons[type as keyof typeof proofTypeIcons]
                      const label = proofTypeLabels[type as keyof typeof proofTypeLabels]
                      return (
                        <Badge key={type} variant="outline" className="flex items-center gap-1">
                          <Icon className="w-3 h-3" />
                          {label}
                        </Badge>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No proof types selected yet</p>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">Proof Instructions</h4>
                <p className="text-sm text-muted-foreground">
                  {challengeData.proofInstructions || "No proof instructions added yet"}
                </p>
              </div>

              <div className="flex gap-4 text-sm">
                {challengeData.cameraOnly && (
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle className="w-4 h-4" />
                    Camera-only photos required
                  </div>
                )}
                {challengeData.allowLateSubmissions && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <Clock className="w-4 h-4" />
                    {challengeData.lateSubmissionHours}h grace period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stakes & Rewards */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Stakes & Rewards</CardTitle>
                <Button variant="outline" size="sm" onClick={() => onEdit(7)} className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {challengeData.allowPointsOnly ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-green-800">Points-Only Challenge</h4>
                  </div>
                  <p className="text-sm text-green-700">
                    This challenge uses points instead of money stakes, making it accessible to everyone.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-1">Stake Range</h4>
                      <p className="text-2xl font-bold text-primary">
                        ${challengeData.minStake} - ${challengeData.maxStake}
                      </p>
                    </div>
                    {challengeData.hostContribution > 0 && (
                      <div>
                        <h4 className="font-medium mb-1">Your Contribution</h4>
                        <p className="text-2xl font-bold text-secondary">${challengeData.hostContribution}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Reward Distribution</h4>
                    <Badge variant="outline" className="flex items-center gap-2 w-fit">
                      <Trophy className="w-4 h-4" />
                      {getRewardDistributionLabel(challengeData.rewardDistribution)}
                    </Badge>
                  </div>
                </>
              )}

              {challengeData.bonusRewards.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Bonus Rewards</h4>
                  <ul className="space-y-1">
                    {challengeData.bonusRewards.map((reward: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-primary" />
                        {reward}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Publish Sidebar */}
        <div className="space-y-4">
          {/* Publish Card */}
          <Card className={isReadyToPublish ? "bg-primary/5 border-primary/20" : "bg-orange-50 border-orange-200"}>
            <CardHeader className="pb-4">
              <CardTitle
                className={`text-base flex items-center gap-2 ${isReadyToPublish ? "text-primary" : "text-orange-700"}`}
              >
                {isReadyToPublish ? (
                  <>
                    <Rocket className="w-5 h-5" />
                    Ready to Publish!
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5" />
                    Missing Required Fields
                  </>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {isReadyToPublish ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700 font-medium">✅ All required fields completed!</p>
                  </div>

                  <Button
                    onClick={onPublish}
                    disabled={isPublishing}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold"
                    size="lg"
                  >
                    {isPublishing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4 mr-2" />
                        Publish Challenge
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Please complete the following required fields:</AlertDescription>
                  </Alert>

                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {missingFields.map((field, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 p-2 rounded">
                        <X className="w-3 h-3" />
                        <span className="font-medium">{field}</span>
                      </div>
                    ))}
                  </div>

                  {/* Debug info in development */}
                  {process.env.NODE_ENV === 'development' && (
                    <details className="text-xs text-gray-500 mt-2">
                      <summary className="cursor-pointer">Debug Info (Dev Only)</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                        {JSON.stringify({
                          missingFields,
                          challengeData: {
                            privacyType: challengeData.privacyType,
                            category: challengeData.category,
                            title: challengeData.title,
                            description: challengeData.description,
                            duration: challengeData.duration,
                            difficulty: challengeData.difficulty,
                            rulesLength: challengeData.rules?.length,
                            dailyInstructions: challengeData.dailyInstructions,
                            selectedProofTypesLength: challengeData.selectedProofTypes?.length,
                            proofInstructions: challengeData.proofInstructions,
                            allowPointsOnly: challengeData.allowPointsOnly,
                            minStake: challengeData.minStake,
                            maxStake: challengeData.maxStake,
                            rewardDistribution: challengeData.rewardDistribution
                          }
                        }, null, 2)}
                      </pre>
                    </details>
                  )}

                  <Button disabled className="w-full" size="lg">
                    Complete Required Fields
                  </Button>
                </div>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Challenge will be visible immediately</p>
                <p>• Participants can join right away</p>
                <p>• You can edit details after publishing</p>
              </div>
            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="w-4 h-4" />
                How it looks
              </CardTitle>
            </CardHeader>

            <CardContent className="text-sm space-y-2">
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  {challengeData.thumbnailImage ? (
                    <div className="w-8 h-8 rounded overflow-hidden">
                      <img
                        src={URL.createObjectURL(challengeData.thumbnailImage) || "/placeholder.svg"}
                        alt="Challenge thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {challengeData.title ? challengeData.title.charAt(0) : "?"}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-xs">{challengeData.title || "Challenge Title"}</p>
                    <p className="text-xs text-muted-foreground">
                      {challengeData.duration} days •{" "}
                      {challengeData.allowPointsOnly ? "Points" : `$${challengeData.minStake}+`}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {challengeData.description || "Challenge description"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                This is how your challenge will appear in the discovery feed.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
