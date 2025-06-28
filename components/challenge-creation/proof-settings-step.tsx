"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Video, FileText, Upload, Shield, Clock, CheckCircle, Lightbulb } from "lucide-react"

interface ProofSettingsStepProps {
  selectedProofTypes: string[]
  proofInstructions: string
  cameraOnly: boolean
  allowLateSubmissions: boolean
  lateSubmissionHours: number
  onProofTypesChange: (types: string[]) => void
  onProofInstructionsChange: (instructions: string) => void
  onCameraOnlyChange: (cameraOnly: boolean) => void
  onAllowLateSubmissionsChange: (allow: boolean) => void
  onLateSubmissionHoursChange: (hours: number) => void
}

const proofTypes = [
  {
    id: "photo",
    title: "Photo",
    description: "Participants submit photos as proof",
    icon: Camera,
    examples: ["Workout selfie", "Completed meal", "Book page"],
    recommended: true,
  },
  {
    id: "video",
    title: "Video",
    description: "Short video clips showing the activity",
    icon: Video,
    examples: ["Exercise routine", "Meditation session", "Progress demo"],
    recommended: false,
  },
  {
    id: "text",
    title: "Text Entry",
    description: "Written reflection or description",
    icon: FileText,
    examples: ["Journal entry", "Learning notes", "Daily reflection"],
    recommended: true,
  },
  {
    id: "file",
    title: "File Upload",
    description: "Documents, screenshots, or other files",
    icon: Upload,
    examples: ["Screenshot", "Document", "Audio recording"],
    recommended: false,
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
  onProofTypesChange,
  onProofInstructionsChange,
  onCameraOnlyChange,
  onAllowLateSubmissionsChange,
  onLateSubmissionHoursChange,
}: ProofSettingsStepProps) {
  const toggleProofType = (typeId: string) => {
    if (selectedProofTypes.includes(typeId)) {
      onProofTypesChange(selectedProofTypes.filter((id) => id !== typeId))
    } else {
      onProofTypesChange([...selectedProofTypes, typeId])
    }
  }

  const hasPhotoSelected = selectedProofTypes.includes("photo")

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
          {/* Proof Types */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Proof Methods * (Select at least one)</Label>
              <p className="text-xs text-muted-foreground">
                Participants can use any of the selected methods to submit their daily proof.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proofTypes.map((type) => {
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

          {selectedProofTypes.length > 0 && (
            <Card className="bg-secondary/5 border-secondary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-secondary">Selected Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedProofTypes.map((typeId) => {
                  const type = proofTypes.find((t) => t.id === typeId)
                  if (!type) return null
                  const Icon = type.icon
                  return (
                    <div key={typeId} className="flex items-center gap-2 text-sm">
                      <Icon className="w-4 h-4 text-secondary" />
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
