"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, Clock, Video, FileText, Upload } from "lucide-react"
import { VerificationModal } from "./verification-modal"

interface ProofRequirement {
  type: "photo" | "video" | "file" | "text"
  required: boolean
  cameraOnly?: boolean
  instructions: string
  examples?: string[]
}

interface VerificationTriggerProps {
  challenge: {
    id: string
    title: string
    currentDay: number
    totalDays: number
    deadline: string
    proofRequirements: ProofRequirement[]
    generalInstructions?: string
    isOverdue?: boolean
  }
  variant?: "button" | "card" | "reminder"
  className?: string
  onSubmit?: (proof: { type: string; file?: File; text?: string; description: string }) => void
}

export function VerificationTrigger({
  challenge,
  variant = "button",
  className = "",
  onSubmit,
}: VerificationTriggerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleProofSubmit = (proof: { type: string; file?: File; text?: string; description: string }) => {
    console.log("Proof submitted:", proof)
    // Call the prop function if provided
    if (onSubmit) {
      onSubmit(proof)
    }
    // Here you would typically send the proof to your backend
    // Update challenge progress, streak counters, etc.
  }

  const getRequiredProofIcons = () => {
    return challenge.proofRequirements.map((req) => {
      switch (req.type) {
        case "photo":
          return <Camera key="photo" className="w-3 h-3" />
        case "video":
          return <Video key="video" className="w-3 h-3" />
        case "file":
          return <Upload key="file" className="w-3 h-3" />
        case "text":
          return <FileText key="text" className="w-3 h-3" />
        default:
          return null
      }
    })
  }

  if (variant === "card") {
    return (
      <>
        <div
          className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
            challenge.isOverdue
              ? "bg-destructive/5 border-destructive/20 hover:bg-destructive/10"
              : "bg-primary/5 border-primary/20 hover:bg-primary/10"
          } ${className}`}
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">{getRequiredProofIcons()}</div>
              <span className="font-medium text-sm">Daily Proof Required</span>
            </div>
            <Badge variant={challenge.isOverdue ? "destructive" : "secondary"} className="text-xs">
              {challenge.isOverdue ? "OVERDUE" : "DUE TODAY"}
            </Badge>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold">{challenge.title}</h4>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                Day {challenge.currentDay} of {challenge.totalDays}
              </span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{challenge.deadline}</span>
              </div>
            </div>

            {/* Show proof requirements preview */}
            <div className="text-xs text-muted-foreground">
              Requires: {challenge.proofRequirements.map((req) => req.type).join(", ")}
              {challenge.proofRequirements.some((req) => req.cameraOnly) && " (camera only)"}
            </div>
          </div>

          <Button
            size="sm"
            className={`w-full mt-3 ${
              challenge.isOverdue ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
            }`}
          >
            <div className="flex items-center gap-1 mr-2">{getRequiredProofIcons()}</div>
            Submit Proof Now
          </Button>
        </div>

        <VerificationModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          challenge={challenge}
          onSubmit={handleProofSubmit}
        />
      </>
    )
  }

  if (variant === "reminder") {
    return (
      <>
        <div
          className={`p-3 rounded-lg border-l-4 ${
            challenge.isOverdue ? "bg-destructive/5 border-l-destructive" : "bg-orange-500/5 border-l-orange-500"
          } ${className}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${challenge.isOverdue ? "bg-destructive/10" : "bg-orange-500/10"}`}>
                <div className="flex items-center gap-1">{getRequiredProofIcons()}</div>
              </div>
              <div>
                <p className="font-medium text-sm">{challenge.title}</p>
                <p className="text-xs text-muted-foreground">
                  {challenge.isOverdue ? "Proof overdue!" : `Due: ${challenge.deadline}`}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className={challenge.isOverdue ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              <div className="flex items-center gap-1 mr-1">{getRequiredProofIcons()}</div>
              Submit
            </Button>
          </div>
        </div>

        <VerificationModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          challenge={challenge}
          onSubmit={handleProofSubmit}
        />
      </>
    )
  }

  // Default button variant
  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} className={`font-bold ${className}`} size="lg">
        <div className="flex items-center gap-1 mr-2">{getRequiredProofIcons()}</div>
        Submit Today's Proof
      </Button>

      <VerificationModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        challenge={challenge}
        onSubmit={handleProofSubmit}
      />
    </>
  )
}
