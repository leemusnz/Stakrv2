"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Camera, Video, FileText, Upload, Shield, Clock, CheckCircle, Lightbulb, Timer, Zap, AlertCircle, Watch, Smartphone, Activity } from "lucide-react"

interface ProofSettingsStepProps {
  selectedProofTypes: string[]
  proofInstructions: string
  cameraOnly: boolean
  allowLateSubmissions: boolean
  lateSubmissionHours: number
  requireTimer: boolean
  timerMinDuration: number
  timerMaxDuration: number
  randomCheckinsEnabled: boolean
  randomCheckinProbability: number
  onProofTypesChange: (types: string[]) => void
  onProofInstructionsChange: (instructions: string) => void
  onCameraOnlyChange: (cameraOnly: boolean) => void
  onAllowLateSubmissionsChange: (allow: boolean) => void
  onLateSubmissionHoursChange: (hours: number) => void
  onRequireTimerChange: (requireTimer: boolean) => void
  onTimerMinDurationChange: (minutes: number) => void
  onTimerMaxDurationChange: (minutes: number) => void
  onRandomCheckinsEnabledChange: (enabled: boolean) => void
  onRandomCheckinProbabilityChange: (probability: number) => void
}

const proofTypes = [
  {
    id: "photo",
    title: "Photo",
    description: "Participants submit photos as proof",
    icon: Camera,
    examples: ["Workout selfie", "Completed meal", "Book page"],
    recommended: true,
    category: "manual"
  },
  {
    id: "video",
    title: "Video",
    description: "Short video clips showing the activity",
    icon: Video,
    examples: ["Exercise routine", "Meditation session", "Progress demo"],
    recommended: false,
    category: "manual"
  },
  {
    id: "text",
    title: "Text Entry",
    description: "Written reflection or description",
    icon: FileText,
    examples: ["Journal entry", "Learning notes", "Daily reflection"],
    recommended: true,
    category: "manual"
  },
  {
    id: "file",
    title: "File Upload",
    description: "Documents, screenshots, or other files",
    icon: Upload,
    examples: ["Screenshot", "Document", "Audio recording"],
    recommended: false,
    category: "manual"
  },
  // Integration Verification Methods
  {
    id: "wearable",
    title: "Smart Wearables",
    description: "Apple Watch, Fitbit, Garmin auto-verification",
    icon: Watch,
    examples: ["Workout data", "Heart rate", "Steps", "Sleep tracking"],
    recommended: true,
    category: "integration",
    premium: true
  },
  {
    id: "fitness_apps",
    title: "Fitness Apps",
    description: "MyFitnessPal, Strava integration",
    icon: Activity,
    examples: ["Nutrition logs", "Running data", "Calorie tracking"],
    recommended: true,
    category: "integration",
    premium: true
  },
  {
    id: "learning_apps",
    title: "Learning Apps", 
    description: "Duolingo, Coursera progress tracking",
    icon: Smartphone,
    examples: ["Language lessons", "Course completion", "Skill progress"],
    recommended: false,
    category: "integration",
    premium: true
  },
]

const lateSubmissionOptions = [
  { value: 2, label: "2 hours" },
  { value: 4, label: "4 hours" },
  { value: 8, label: "8 hours" },
  { value: 12, label: "12 hours" },
  { value: 24, label: "24 hours" },
]

export function ProofSettingsStep({
  selectedProofTypes,
  proofInstructions,
  cameraOnly,
  allowLateSubmissions,
  lateSubmissionHours,
  requireTimer,
  timerMinDuration,
  timerMaxDuration,
  randomCheckinsEnabled,
  randomCheckinProbability,
  onProofTypesChange,
  onProofInstructionsChange,
  onCameraOnlyChange,
  onAllowLateSubmissionsChange,
  onLateSubmissionHoursChange,
  onRequireTimerChange,
  onTimerMinDurationChange,
  onTimerMaxDurationChange,
  onRandomCheckinsEnabledChange,
  onRandomCheckinProbabilityChange,
}: ProofSettingsStepProps) {
  const toggleProofType = (typeId: string) => {
    if (selectedProofTypes.includes(typeId)) {
      onProofTypesChange(selectedProofTypes.filter((id) => id !== typeId))
    } else {
      onProofTypesChange([...selectedProofTypes, typeId])
    }
  }

  const hasPhotoSelected = selectedProofTypes.includes("photo")
  const manualTypes = proofTypes.filter(type => type.category === "manual")
  const integrationTypes = proofTypes.filter(type => type.category === "integration")

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">How will participants prove completion?</h2>
        <p className="text-muted-foreground">
          Choose the proof methods that work best for your challenge. Multiple options give participants flexibility.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Manual Proof Types */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-500" />
                Manual Verification * (Select at least one)
              </Label>
              <p className="text-xs text-muted-foreground">
                Traditional proof methods where participants manually submit evidence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {manualTypes.map((type) => {
                const Icon = type.icon
                const isSelected = selectedProofTypes.includes(type.id)

                return (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                    onClick={() => toggleProofType(type.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? "bg-primary text-white" : "bg-muted"}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <CardTitle className="text-sm flex items-center gap-2">
                              {type.title}
                              {type.recommended && (
                                <Badge variant="secondary" className="text-xs">
                                  Recommended
                                </Badge>
                              )}
                              {type.premium && (
                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                  Premium
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs">{type.description}</CardDescription>
                          </div>
                        </div>
                        {isSelected && <CheckCircle className="w-5 h-5 text-primary" />}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Examples:</p>
                        <div className="flex flex-wrap gap-1">
                          {type.examples.map((example, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {example}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Smart Integration Proof Types */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Smart Verification (Optional)
                <Badge variant="outline" className="text-xs bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                  ⭐ Premium
                </Badge>
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatic verification through connected apps and devices. Reduces cheating and manual review.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrationTypes.map((type) => {
                const Icon = type.icon
                const isSelected = selectedProofTypes.includes(type.id)

                return (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                    onClick={() => toggleProofType(type.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? "bg-primary text-white" : "bg-muted"}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <CardTitle className="text-sm flex items-center gap-2">
                              {type.title}
                              {type.recommended && (
                                <Badge variant="secondary" className="text-xs">
                                  Recommended
                                </Badge>
                              )}
                              {type.premium && (
                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                  Premium
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs">{type.description}</CardDescription>
                          </div>
                        </div>
                        {isSelected && <CheckCircle className="w-5 h-5 text-primary" />}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Examples:</p>
                        <div className="flex flex-wrap gap-1">
                          {type.examples.map((example, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {example}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {/* Show connection status or setup button */}
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Connection Status:</span>
                          <Badge variant="outline" className="text-xs">
                            Not Connected
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm" className="mt-2 w-full h-8 text-xs">
                          Connect in Settings →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Integration Setup Help */}
            {selectedProofTypes.some(type => integrationTypes.find(t => t.id === type)) && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <CardTitle className="text-sm text-blue-700">Smart Verification Selected</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-blue-700 mb-3">
                    You've selected smart verification methods. To use these during your challenge:
                  </p>
                  <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
                    <li>Go to Settings → Integrations after creating this challenge</li>
                    <li>Connect your devices and apps (Apple Watch, Fitbit, MyFitnessPal, etc.)</li>
                    <li>Participants will be able to use automatic verification</li>
                  </ol>
                  <div className="mt-3 p-2 bg-blue-100 rounded border">
                    <p className="text-xs text-blue-800">
                      💡 <strong>Tip:</strong> Smart verification reduces manual review by up to 80% and prevents most cheating attempts.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Proof Instructions */}
          <div className="space-y-2">
            <Label htmlFor="proof-instructions" className="text-sm font-medium">
              Proof Instructions *
            </Label>
            <Textarea
              id="proof-instructions"
              placeholder="Tell participants exactly what to include in their proof submissions. Be specific about what makes good proof..."
              value={proofInstructions}
              onChange={(e) => onProofInstructionsChange(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {proofInstructions.length}/400 characters. Clear instructions lead to better submissions.
            </p>
          </div>

          {/* Timer & Verification Settings */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Timer className="w-4 h-4 text-secondary" />
                Activity Timer & Verification
              </h3>

              {/* Require Timer */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-secondary/5 rounded-lg border border-secondary/20">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Timer className="w-4 h-4 text-secondary" />
                      Require timed sessions
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Participants must track time during activities (great for workouts, meditation, study sessions)
                    </p>
                  </div>
                  <Switch checked={requireTimer} onCheckedChange={onRequireTimerChange} />
                </div>

                {requireTimer && (
                  <div className="ml-4 space-y-4 p-4 bg-secondary/5 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Minimum duration (minutes)</Label>
                        <Input
                          type="number"
                          min="5"
                          max="480"
                          value={timerMinDuration}
                          onChange={(e) => onTimerMinDurationChange(Number(e.target.value))}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">Shortest allowed session</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Maximum duration (minutes)</Label>
                        <Input
                          type="number"
                          min={timerMinDuration + 5}
                          max="480"
                          value={timerMaxDuration}
                          onChange={(e) => onTimerMaxDurationChange(Number(e.target.value))}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">Longest allowed session</p>
                      </div>
                    </div>

                    {/* Random Check-ins */}
                    <div className="space-y-3 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            Enhanced anti-cheat verification
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Random gesture/word prompts during timed sessions to prevent cheating
                          </p>
                        </div>
                        <Switch checked={randomCheckinsEnabled} onCheckedChange={onRandomCheckinsEnabledChange} />
                      </div>

                      {randomCheckinsEnabled && (
                        <div className="ml-4 space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Check-in probability (%)</Label>
                            <Input
                              type="number"
                              min="10"
                              max="80"
                              value={randomCheckinProbability}
                              onChange={(e) => onRandomCheckinProbabilityChange(Number(e.target.value))}
                              className="w-32"
                            />
                            <p className="text-xs text-muted-foreground">
                              Chance of verification prompt during sessions (recommended: 20-40%)
                            </p>
                          </div>

                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-yellow-800 mb-2">
                              <AlertCircle className="w-4 h-4" />
                              <span className="font-medium text-sm">How Enhanced Verification Works</span>
                            </div>
                            <ul className="text-xs text-yellow-700 space-y-1">
                              <li>• Participants may be asked to show specific hand gestures</li>
                              <li>• Or say verification words during their session</li>
                              <li>• Helps ensure they're actually doing the activity</li>
                              <li>• Failed verifications affect their quality score</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security & Timing Settings */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Security & Timing Settings
              </h3>

              {/* Camera Only Photos */}
              {hasPhotoSelected && (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Camera-only photos</Label>
                    <p className="text-xs text-muted-foreground">
                      Require photos to be taken with camera (prevents old photos from gallery)
                    </p>
                  </div>
                  <Switch checked={cameraOnly} onCheckedChange={onCameraOnlyChange} />
                </div>
              )}

              {/* Late Submissions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Allow late submissions</Label>
                    <p className="text-xs text-muted-foreground">
                      Give participants a grace period to submit proof after the daily deadline
                    </p>
                  </div>
                  <Switch checked={allowLateSubmissions} onCheckedChange={onAllowLateSubmissionsChange} />
                </div>

                {allowLateSubmissions && (
                  <div className="ml-4 space-y-2">
                    <Label className="text-sm font-medium">Grace period</Label>
                    <Select
                      value={lateSubmissionHours.toString()}
                      onValueChange={(value) => onLateSubmissionHoursChange(Number.parseInt(value))}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {lateSubmissionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Participants can submit up to {lateSubmissionHours} hours after the daily deadline
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tips Sidebar */}
        <div className="space-y-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-primary">
                <Lightbulb className="w-4 h-4" />
                Proof Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium mb-1">Best Practices:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Offer 2-3 proof options</li>
                  <li>• Be specific about requirements</li>
                  <li>• Consider participant privacy</li>
                </ul>
              </div>

              <div>
                <p className="font-medium mb-1">Good Instructions:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• "Show your workout setup"</li>
                  <li>• "Include the book title"</li>
                  <li>• "Write 2-3 sentences"</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Timer Status Card */}
          {requireTimer && (
            <Card className="bg-secondary/5 border-secondary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-secondary">
                  <Timer className="w-4 h-4" />
                  Timer Enabled
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-secondary">
                  Sessions: {timerMinDuration}-{timerMaxDuration} minutes
                </p>
                {randomCheckinsEnabled && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Enhanced verification: {randomCheckinProbability}% chance
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {selectedProofTypes.length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-700">Selected Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedProofTypes.map((typeId) => {
                  const type = proofTypes.find((t) => t.id === typeId)
                  if (!type) return null
                  const Icon = type.icon
                  return (
                    <div key={typeId} className="flex items-center gap-2 text-sm">
                      <Icon className="w-4 h-4 text-green-600" />
                      {type.title}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {allowLateSubmissions && (
            <Card className="bg-orange-50 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
                  <Clock className="w-4 h-4" />
                  Late Submissions
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-orange-700">
                  {lateSubmissionHours} hour grace period enabled. This can help with different time zones but may
                  reduce urgency.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
