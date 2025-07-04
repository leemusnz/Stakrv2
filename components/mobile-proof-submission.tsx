"use client"

import { useState } from "react"
import { MobileFormModal, useMobileModal } from "@/components/mobile-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, Image as ImageIcon, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProofSubmissionData {
  photo?: File
  description: string
  location?: string
}

interface MobileProofSubmissionProps {
  challengeId: string
  challengeTitle: string
  onSubmit: (data: ProofSubmissionData) => Promise<void>
  trigger?: React.ReactNode
}

export function MobileProofSubmission({
  challengeId,
  challengeTitle,
  onSubmit,
  trigger
}: MobileProofSubmissionProps) {
  const modal = useMobileModal()
  const [formData, setFormData] = useState<ProofSubmissionData>({
    description: "",
    location: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }))
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      await onSubmit(formData)
      modal.close()
      // Reset form
      setFormData({ description: "", location: "" })
      setPhotoPreview(null)
    } catch (error) {
      console.error("Failed to submit proof:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <div onClick={modal.open}>
        {trigger || (
          <Button className="w-full min-h-[48px] touch-manipulation">
            <Camera className="w-5 h-5 mr-2" />
            Submit Proof
          </Button>
        )}
      </div>

      {/* Mobile Modal */}
      <MobileFormModal
        {...modal.props}
        title="Submit Proof"
        description={`Share your progress for "${challengeTitle}"`}
        onSubmit={handleSubmit}
        submitLabel="Submit Proof"
        isSubmitting={isSubmitting}
      >
        <div className="space-y-6">
          {/* Challenge Info */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">{challengeTitle}</h4>
                  <p className="text-sm text-muted-foreground">Challenge Proof</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photo Upload Section */}
          <div className="space-y-3">
            <Label htmlFor="photo" className="text-base font-medium">
              Photo Evidence *
            </Label>
            
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Proof preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPhotoPreview(null)
                    setFormData(prev => ({ ...prev, photo: undefined }))
                  }}
                  className="absolute top-2 right-2"
                >
                  Change Photo
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="file"
                  id="photo"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <label htmlFor="photo">
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary/50 cursor-pointer touch-manipulation">
                    <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium mb-1">Take or upload photo</p>
                    <p className="text-xs text-muted-foreground">Tap to open camera or gallery</p>
                  </div>
                </label>
                
                {/* Quick Camera Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <label htmlFor="photo">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full min-h-[48px] touch-manipulation"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Camera
                    </Button>
                  </label>
                  <label htmlFor="photo">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full min-h-[48px] touch-manipulation"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Gallery
                    </Button>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-base font-medium">
              Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what you accomplished..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-[100px] text-base" // Larger text for mobile
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Tell us about your progress and any challenges you faced
            </p>
          </div>

          {/* Location (Optional) */}
          <div className="space-y-3">
            <Label htmlFor="location" className="text-base font-medium">
              Location <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="location"
              placeholder="Where did this happen?"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="text-base" // Larger text for mobile
            />
          </div>

          {/* Requirements Badge */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={formData.photo ? "default" : "secondary"} className="text-xs">
              {formData.photo ? "✓" : "○"} Photo Required
            </Badge>
            <Badge variant={formData.description.length > 10 ? "default" : "secondary"} className="text-xs">
              {formData.description.length > 10 ? "✓" : "○"} Description Required
            </Badge>
          </div>
        </div>
      </MobileFormModal>
    </>
  )
}

// Example usage component
export function ProofSubmissionExample() {
  const handleSubmitProof = async (data: ProofSubmissionData) => {
    console.log("Submitting proof:", data)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  return (
    <div className="space-y-4">
      {/* Default trigger */}
      <MobileProofSubmission
        challengeId="challenge-1"
        challengeTitle="30-Day Meditation Challenge"
        onSubmit={handleSubmitProof}
      />

      {/* Custom trigger */}
      <MobileProofSubmission
        challengeId="challenge-2"
        challengeTitle="Daily Reading Habit"
        onSubmit={handleSubmitProof}
        trigger={
          <Card className="cursor-pointer hover:shadow-md transition-shadow touch-manipulation">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Submit Today's Proof</h4>
                  <p className="text-sm text-muted-foreground">Daily Reading Habit</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Due Today</Badge>
                  <Camera className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        }
      />
    </div>
  )
}
