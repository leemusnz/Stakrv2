"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Camera, Upload, X, Check, Zap, Clock, AlertTriangle, FileText, Video } from "lucide-react"

interface ProofRequirement {
  type: "photo" | "video" | "file" | "text"
  required: boolean
  cameraOnly?: boolean // Must use camera, no uploads
  instructions: string
  examples?: string[]
}

interface VerificationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  challenge: {
    id: string
    title: string
    currentDay: number
    totalDays: number
    deadline: string
    proofRequirements: ProofRequirement[]
    generalInstructions?: string
  }
  onSubmit: (proof: { type: string; file?: File; text?: string; description: string }) => void
}

export function VerificationModal({ isOpen, onOpenChange, challenge, onSubmit }: VerificationModalProps) {
  const [step, setStep] = useState<"capture" | "preview" | "uploading" | "success">("capture")
  const [selectedProofType, setSelectedProofType] = useState<ProofRequirement | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [textProof, setTextProof] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [description, setDescription] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Auto-select if only one proof type is available
  const availableProofTypes = challenge.proofRequirements.filter((req) => req.required || req.type)
  const singleProofType = availableProofTypes.length === 1 ? availableProofTypes[0] : null

  const handleFileCapture = (file: File) => {
    setCapturedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setStep("preview")
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileCapture(file)
    }
  }

  const handleSubmit = async () => {
    if (!selectedProofType) return

    setStep("uploading")

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    setStep("success")

    // Call the onSubmit callback
    onSubmit({
      type: selectedProofType.type,
      file: capturedFile || undefined,
      text: textProof || undefined,
      description,
    })

    // Auto-close after success animation
    setTimeout(() => {
      onOpenChange(false)
      resetModal()
    }, 2000)
  }

  const resetModal = () => {
    setStep("capture")
    setSelectedProofType(singleProofType)
    setCapturedFile(null)
    setTextProof("")
    setPreviewUrl("")
    setDescription("")
    setUploadProgress(0)

    // Clean up camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  // Enhanced live camera capture for camera-only mode
  const handleLiveCameraCapture = useCallback(async () => {
    if (!selectedProofType?.cameraOnly) return

    try {
      // Request camera access with strict constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: selectedProofType.type === 'video'
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        if (selectedProofType.type === 'photo') {
          // For photos, auto-capture after a short delay
          setTimeout(() => capturePhotoFromStream(), 2000)
        } else if (selectedProofType.type === 'video') {
          // For videos, start recording immediately
          startVideoRecording(stream)
        }
      }
    } catch (error) {
      console.error('Failed to access camera:', error)
      alert('Camera access is required for this verification. Please allow camera permissions and try again.')
    }
  }, [selectedProofType])

  const capturePhotoFromStream = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Convert to blob with timestamp metadata
    canvas.toBlob((blob) => {
      if (blob) {
        // Add metadata to prove it's live capture
        const timestamp = Date.now()
        const fileName = `live-capture-${timestamp}.jpg`
        
        const file = new File([blob], fileName, { 
          type: 'image/jpeg',
          lastModified: timestamp
        })
        
        handleFileCapture(file)
        
        // Stop camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }
    }, 'image/jpeg', 0.9)
  }, [])

  const startVideoRecording = useCallback((stream: MediaStream) => {
    // Implement video recording from live stream
    // This would use MediaRecorder API for proper live video capture
    console.log('Starting live video recording...', stream)
    
    // For now, show a placeholder message
    alert('Live video recording will be implemented. This ensures videos are captured in real-time.')
  }, [])

  const handleClose = () => {
    onOpenChange(false)
    resetModal()
  }

  const getProofTypeIcon = (type: string) => {
    switch (type) {
      case "photo":
        return Camera
      case "video":
        return Video
      case "file":
        return Upload
      case "text":
        return FileText
      default:
        return Camera
    }
  }

  const getProofTypeColor = (type: string) => {
    switch (type) {
      case "photo":
        return "primary"
      case "video":
        return "secondary"
      case "file":
        return "success"
      case "text":
        return "orange-500"
      default:
        return "primary"
    }
  }

  const renderCaptureStep = () => (
    <div className="space-y-6">
      {/* Challenge Info */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold">{challenge.title}</h3>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Day {challenge.currentDay} of {challenge.totalDays}
          </Badge>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Due: {challenge.deadline}</span>
          </div>
        </div>
      </div>

      {/* General Instructions */}
      {challenge.generalInstructions && (
        <div className="p-4 bg-muted/50 rounded-lg border border-muted">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-primary" />
            Instructions
          </h4>
          <p className="text-sm text-muted-foreground">{challenge.generalInstructions}</p>
        </div>
      )}

      {/* Proof Type Selection */}
      {!singleProofType && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Choose your proof type:</h4>
          <div className="grid grid-cols-1 gap-3">
            {challenge.proofRequirements.map((requirement, index) => {
              const Icon = getProofTypeIcon(requirement.type)
              const color = getProofTypeColor(requirement.type)
              const isSelected = selectedProofType?.type === requirement.type

              return (
                <Button
                  key={index}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => setSelectedProofType(requirement)}
                  className={`flex items-start gap-3 h-auto p-4 text-left ${
                    isSelected ? `bg-${color} hover:bg-${color}/90` : `hover:bg-${color}/10`
                  }`}
                >
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">{requirement.type}</span>
                      {requirement.required && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                      {requirement.cameraOnly && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/20"
                        >
                          Camera Only
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm opacity-80">{requirement.instructions}</p>
                    {requirement.examples && (
                      <div className="mt-2">
                        <p className="text-xs opacity-60 mb-1">Examples:</p>
                        <ul className="text-xs opacity-60 space-y-0.5">
                          {requirement.examples.map((example, i) => (
                            <li key={i}>• {example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Capture/Upload Area */}
      {(selectedProofType || singleProofType) && (
        <div className="space-y-4">{renderProofCaptureInterface(selectedProofType || singleProofType!)}</div>
      )}
    </div>
  )

  const renderProofCaptureInterface = (proofType: ProofRequirement) => {
    const Icon = getProofTypeIcon(proofType.type)
    const color = getProofTypeColor(proofType.type)

    if (proofType.type === "text") {
      return (
        <div className="space-y-3">
          <div className="p-4 bg-orange-500/5 rounded-lg border border-orange-500/20">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-orange-500">
              <FileText className="w-4 h-4" />
              {proofType.instructions}
            </h4>
          </div>
          <Textarea
            placeholder="Describe your proof in detail..."
            value={textProof}
            onChange={(e) => setTextProof(e.target.value)}
            className="min-h-[120px]"
          />
          <Button
            onClick={() => setStep("preview")}
            disabled={!textProof.trim()}
            className="w-full bg-orange-500 hover:bg-orange-500/90"
          >
            <FileText className="w-4 h-4 mr-2" />
            Continue with Text Proof
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div className={`p-4 bg-${color}/5 rounded-lg border border-${color}/20`}>
          <h4 className={`font-medium text-sm mb-2 flex items-center gap-2 text-${color}`}>
            <Icon className="w-4 h-4" />
            {proofType.instructions}
          </h4>
          {proofType.cameraOnly && (
            <p className="text-xs text-orange-500 font-medium">⚠️ Must be taken with camera - no uploads allowed</p>
          )}
        </div>

        <Button
          onClick={() => {
            if (proofType.cameraOnly) {
              // For camera-only mode, use getUserMedia API for stricter enforcement
              handleLiveCameraCapture()
            } else {
              fileInputRef.current?.click()
            }
          }}
          className={`w-full h-32 border-2 border-dashed border-${color}/30 bg-${color}/5 hover:bg-${color}/10 text-${color} flex flex-col items-center gap-2`}
          variant="outline"
        >
          <Icon className="w-8 h-8" />
          <span className="font-medium">
            {proofType.type === "photo" && (proofType.cameraOnly ? "Take Live Photo" : "Take Photo")}
            {proofType.type === "video" && (proofType.cameraOnly ? "Record Live Video" : "Record Video")}
            {proofType.type === "file" && "Upload File"}
          </span>
          {!proofType.cameraOnly && (
            <span className="text-xs opacity-70">
              {proofType.type === "photo" && "or upload from gallery"}
              {proofType.type === "video" && "or upload from gallery"}
              {proofType.type === "file" && "Screenshots, documents, etc."}
            </span>
          )}
          {proofType.cameraOnly && (
            <span className="text-xs text-orange-600 font-medium">🔴 LIVE CAMERA REQUIRED</span>
          )}
        </Button>

        {/* Only show file input for non-camera-only modes */}
        {!proofType.cameraOnly && (
          <input
            ref={fileInputRef}
            type="file"
            accept={
              proofType.type === "photo"
                ? "image/*"
                : proofType.type === "video"
                  ? "video/*"
                  : "image/*,video/*,.pdf,.doc,.docx"
            }
            onChange={handleFileUpload}
            className="hidden"
          />
        )}

        {/* Live camera interface for camera-only mode */}
        {proofType.cameraOnly && (
          <div className="hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-48 bg-slate-900 dark:bg-black rounded-lg"
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </div>
        )}
      </div>
    )
  }

  const renderPreviewStep = () => (
    <div className="space-y-6">
      {/* Preview Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold">Review Your Proof</h3>
        <p className="text-sm text-muted-foreground">Make sure everything looks good before submitting</p>
      </div>

      {/* Proof Preview */}
      <div className="space-y-4">
        {selectedProofType?.type === "text" ? (
          <div className="p-4 bg-muted rounded-lg border">
            <h4 className="font-medium text-sm mb-2">Your Text Proof:</h4>
            <p className="text-sm whitespace-pre-wrap">{textProof}</p>
          </div>
        ) : (
          <div className="relative bg-muted rounded-lg overflow-hidden">
            {capturedFile?.type.startsWith("image/") && (
              <Image src={previewUrl || "/placeholder.svg"} alt="Proof preview" width={500} height={256} className="w-full h-64 object-cover" />
            )}
            {capturedFile?.type.startsWith("video/") && (
              <video ref={videoRef} src={previewUrl} controls className="w-full h-64 object-cover" />
            )}
            {capturedFile && !capturedFile.type.startsWith("image/") && !capturedFile.type.startsWith("video/") && (
              <div className="w-full h-64 flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium">{capturedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{(capturedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Add a description (optional)</label>
          <Textarea
            placeholder="Describe your proof or add any notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep("capture")} className="flex-1">
          <Camera className="w-4 h-4 mr-2" />
          Retake
        </Button>
        <Button onClick={handleSubmit} className="flex-1 bg-primary hover:bg-primary/90">
          <Zap className="w-4 h-4 mr-2" />
          Submit Proof
        </Button>
      </div>
    </div>
  )

  const renderUploadingStep = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <Upload className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Uploading Your Proof</h3>
          <p className="text-sm text-muted-foreground">Please wait while we process your submission...</p>
        </div>
      </div>

      <div className="space-y-2">
        <Progress value={uploadProgress} className="h-3" />
        <p className="text-sm text-muted-foreground">{uploadProgress}% complete</p>
      </div>
    </div>
  )

  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-success animate-bounce" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-success">Proof Submitted! 🎉</h3>
          <p className="text-sm text-muted-foreground">
            Great job! Your day {challenge.currentDay} proof has been recorded.
          </p>
        </div>
      </div>

      <div className="p-4 bg-success/10 rounded-lg border border-success/20">
        <div className="flex items-center justify-center gap-2 text-success font-medium">
          <Zap className="w-4 h-4" />
          <span>Streak continues! Keep it up!</span>
        </div>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto mobile-safe-width">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Submit Daily Proof
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-auto p-1">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="py-4">
          {step === "capture" && renderCaptureStep()}
          {step === "preview" && renderPreviewStep()}
          {step === "uploading" && renderUploadingStep()}
          {step === "success" && renderSuccessStep()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
