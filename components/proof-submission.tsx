'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Camera, Upload, Type, MapPin, Ruler, Clock, Award, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { ActivityTimer } from './activity-timer'
import { uploadFile, validateFileForUpload, formatFileSize, createFilePreview, revokeFilePreview } from '@/lib/file-upload'

interface ProofSubmissionProps {
  challengeId: string
  challengeName: string
  challengeType: 'fitness' | 'habit' | 'skill' | 'wellness' | 'productivity'
  proofRequirements: {
    types: ('photo' | 'video' | 'text' | 'measurement' | 'location')[]
    description: string
    timer_required?: boolean
    random_checkins?: boolean
    min_duration?: number
    max_duration?: number
  }
  sessionData?: any
  onSubmissionComplete?: (data: any) => void
}

export function ProofSubmission({
  challengeId,
  challengeName,
  challengeType,
  proofRequirements,
  sessionData,
  onSubmissionComplete
}: ProofSubmissionProps) {
  const [activeTab, setActiveTab] = useState(proofRequirements.types[0] || 'photo')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionType, setSubmissionType] = useState<'manual' | 'timer_based'>('manual')
  
  // Media state
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Text state
  const [textProof, setTextProof] = useState('')
  const [proofNotes, setProofNotes] = useState('')
  
  // Measurement state
  const [measurementValue, setMeasurementValue] = useState('')
  const [measurementUnit, setMeasurementUnit] = useState('lbs')
  
  // Location state
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file before processing
    const validation = validateFileForUpload(file)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }
    
    setMediaFile(file)
    
    // Create preview
    const preview = createFilePreview(file)
    setMediaPreview(preview)
    
    toast.success(`${file.type.startsWith('video') ? 'Video' : 'Photo'} selected: ${formatFileSize(file.size)}`)
  }

  const captureLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          toast.success('Location captured successfully!')
        },
        (error) => {
          console.error('Geolocation error:', error)
          toast.error('Unable to get location. Please try again.')
        }
      )
    } else {
      toast.error('Geolocation not supported by this browser')
    }
  }

  const submitProof = async () => {
    if (!validateSubmission()) return

    setIsSubmitting(true)

    try {
      let uploadedFileUrl = null
      let uploadedFileKey = null

      // Upload file if present
      if (mediaFile && (activeTab === 'photo' || activeTab === 'video')) {
        setIsUploading(true)
        
        const uploadResult = await uploadFile(
          mediaFile,
          {
            challengeId,
            sessionId: sessionData?.id,
            checkinId: `checkin_${Date.now()}`,
            metadata: {
              proof_type: activeTab,
              submission_type: submissionType,
              timer_duration: sessionData?.actual_duration || null
            }
          },
          (progress) => {
            setUploadProgress(progress.percentage)
          }
        )

        if (!uploadResult.success) {
          toast.error(uploadResult.error || 'File upload failed')
          return
        }

        uploadedFileUrl = uploadResult.fileUrl
        uploadedFileKey = uploadResult.fileKey
        setIsUploading(false)
      }

      const proofData = {
        submission_type: submissionType,
        session_id: sessionData?.id || null,
        proof_type: activeTab,
        proof_data: activeTab === 'photo' || activeTab === 'video' 
          ? {
              file_url: uploadedFileUrl,
              file_key: uploadedFileKey,
              file_name: mediaFile?.name,
              file_size: mediaFile?.size,
              file_type: mediaFile?.type
            }
          : getProofData(),
        notes: proofNotes,
        location: location,
        timer_duration: sessionData?.actual_duration || null
      }

      const response = await fetch(`/api/challenges/${challengeId}/checkins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proofData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        resetForm()
        onSubmissionComplete?.(data.checkin)
      } else {
        toast.error(data.error || 'Failed to submit proof')
      }
    } catch (error) {
      console.error('Submit proof error:', error)
      toast.error('Failed to submit proof')
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const validateSubmission = () => {
    switch (activeTab) {
      case 'photo':
      case 'video':
        if (!mediaFile && !mediaPreview) {
          toast.error(`Please select a ${activeTab} first`)
          return false
        }
        break
      case 'text':
        if (!textProof.trim()) {
          toast.error('Please provide text proof')
          return false
        }
        break
      case 'measurement':
        if (!measurementValue.trim()) {
          toast.error('Please enter a measurement value')
          return false
        }
        break
      case 'location':
        if (!location) {
          toast.error('Please capture your location first')
          return false
        }
        break
    }
    return true
  }

  const getProofData = () => {
    switch (activeTab) {
      case 'photo':
      case 'video':
        return {
          file_data: mediaPreview,
          file_name: mediaFile?.name,
          file_size: mediaFile?.size,
          file_type: mediaFile?.type
        }
      case 'text':
        return { text: textProof.trim() }
      case 'measurement':
        return {
          value: parseFloat(measurementValue),
          unit: measurementUnit,
          raw_input: measurementValue
        }
      case 'location':
        return location
      default:
        return {}
    }
  }

  const resetForm = () => {
    if (mediaPreview) {
      revokeFilePreview(mediaPreview)
    }
    setMediaFile(null)
    setMediaPreview(null)
    setUploadProgress(0)
    setIsUploading(false)
    setTextProof('')
    setProofNotes('')
    setMeasurementValue('')
    setLocation(null)
  }

  const handleSessionComplete = (sessionData: any) => {
    setSubmissionType('timer_based')
    toast.success('Timer session completed! Now submit your proof.')
  }

  return (
    <div className="space-y-6">
      {/* Timer Component (if required) */}
      {proofRequirements.timer_required && (
        <ActivityTimer
          challengeId={challengeId}
          challengeName={challengeName}
          requiresTimer={proofRequirements.timer_required}
          randomCheckinsEnabled={proofRequirements.random_checkins}
          minDuration={proofRequirements.min_duration}
          maxDuration={proofRequirements.max_duration}
          onSessionComplete={handleSessionComplete}
        />
      )}

      {/* Proof Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {submissionType === 'timer_based' ? (
              <>
                <Clock className="h-5 w-5 text-blue-500" />
                Session Proof Submission
                <Badge variant="secondary">
                  <Zap className="h-3 w-3 mr-1" />
                  Timer-based
                </Badge>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Manual Proof Submission
              </>
            )}
          </CardTitle>
          <CardDescription>
            {proofRequirements.description}
            {submissionType === 'timer_based' && sessionData && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <Award className="h-4 w-4" />
                  <span className="font-medium">Session Completed!</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Duration: {sessionData.actual_duration} minutes | 
                  Quality Score: {sessionData.quality_score}% |
                  Random Check-ins: {sessionData.random_checkins_passed || 0} passed
                </p>
              </div>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${proofRequirements.types.length}, 1fr)` }}>
              {proofRequirements.types.map((type) => (
                <TabsTrigger key={type} value={type} className="flex items-center gap-1">
                  {type === 'photo' && <Camera className="h-4 w-4" />}
                  {type === 'video' && <Upload className="h-4 w-4" />}
                  {type === 'text' && <Type className="h-4 w-4" />}
                  {type === 'measurement' && <Ruler className="h-4 w-4" />}
                  {type === 'location' && <MapPin className="h-4 w-4" />}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Photo Proof */}
            <TabsContent value="photo" className="space-y-4">
              {mediaPreview ? (
                <div className="space-y-2">
                  <img 
                    src={mediaPreview} 
                    alt="Proof photo" 
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMediaFile(null)
                        setMediaPreview(null)
                      }}
                    >
                      Remove
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Replace
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Upload Photo Proof</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Take or upload a photo that clearly shows your progress
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Camera className="h-4 w-4 mr-2" />
                    Choose Photo
                  </Button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </TabsContent>

            {/* Video Proof */}
            <TabsContent value="video" className="space-y-4">
              {mediaPreview ? (
                <div className="space-y-2">
                  <video 
                    src={mediaPreview} 
                    controls 
                    className="w-full h-64 rounded-lg border"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMediaFile(null)
                        setMediaPreview(null)
                      }}
                    >
                      Remove
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Replace
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Upload Video Proof</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Record or upload a video showing your activity
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Video
                  </Button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </TabsContent>

            {/* Text Proof */}
            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-proof">Describe your progress</Label>
                <Textarea
                  id="text-proof"
                  placeholder="Describe what you accomplished, how you felt, any challenges you faced..."
                  value={textProof}
                  onChange={(e) => setTextProof(e.target.value)}
                  rows={6}
                />
                <p className="text-sm text-muted-foreground">
                  {textProof.length}/500 characters
                </p>
              </div>
            </TabsContent>

            {/* Measurement Proof */}
            <TabsContent value="measurement" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="measurement">Value</Label>
                  <Input
                    id="measurement"
                    type="number"
                    placeholder="Enter value"
                    value={measurementValue}
                    onChange={(e) => setMeasurementValue(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <select
                    id="unit"
                    value={measurementUnit}
                    onChange={(e) => setMeasurementUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md"
                  >
                    <option value="lbs">lbs</option>
                    <option value="kg">kg</option>
                    <option value="miles">miles</option>
                    <option value="km">km</option>
                    <option value="minutes">minutes</option>
                    <option value="hours">hours</option>
                    <option value="reps">reps</option>
                    <option value="sets">sets</option>
                  </select>
                </div>
              </div>
            </TabsContent>

            {/* Location Proof */}
            <TabsContent value="location" className="space-y-4">
              {location ? (
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Location Captured</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Latitude: {location.lat.toFixed(6)}<br />
                    Longitude: {location.lng.toFixed(6)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(null)}
                    className="mt-2"
                  >
                    Clear Location
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium mb-2">Capture Location</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Share your current location to verify you're at the right place
                    </p>
                  </div>
                  <Button onClick={captureLocation}>
                    <MapPin className="h-4 w-4 mr-2" />
                    Get Current Location
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional comments or context..."
              value={proofNotes}
              onChange={(e) => setProofNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={submitProof}
            disabled={isSubmitting}
            className="w-full mt-6"
            size="lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Proof'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 