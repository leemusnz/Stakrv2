"use client"

import { useState } from "react"
import { VerificationTrigger } from "@/components/verification-trigger"
import { DevTestingPanel } from "@/components/dev-testing-panel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ProofRequirement } from "@/lib/types"

export default function VerificationDemo() {
  const [currentProofType, setCurrentProofType] = useState<ProofRequirement>({
    type: "photo",
    required: true,
    cameraOnly: true,
    instructions: "Take a photo of your meditation setup",
    examples: ["Meditation cushion/chair", "Quiet space", "Any props you use"],
  })

  const [responseMode, setResponseMode] = useState<"success" | "fail" | "pending">("success")
  const [submissions, setSubmissions] = useState<Array<any>>([])

  const testChallenge = {
    id: "test-challenge",
    title: `${currentProofType.type.charAt(0).toUpperCase() + currentProofType.type.slice(1)} Test Challenge`,
    currentDay: 3,
    totalDays: 7,
    deadline: "Today, 10:00 AM",
    generalInstructions: `Testing ${currentProofType.type} proof submission with ${responseMode} response.`,
    proofRequirements: [currentProofType],
    isOverdue: responseMode === "fail",
  }

  const handleProofSubmit = (proof: any) => {
    const submission = {
      id: `sub-${Date.now()}`,
      challengeId: testChallenge.id,
      proofType: proof.type,
      submittedAt: new Date().toLocaleString(),
      status: responseMode,
      payload: { ...proof, responseMode, userAgent: navigator.userAgent },
    }
    setSubmissions((prev) => [submission, ...prev])
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">
          Verification <span className="text-primary">Testing Lab</span> 🧪
        </h1>
        <p className="text-muted-foreground">Developer-friendly testing environment for the verification modal</p>
        <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
          🚀 Enhanced with dev tools!
        </Badge>
      </div>

      <DevTestingPanel
        onProofTypeChange={setCurrentProofType}
        onResponseModeChange={setResponseMode}
        onReset={() => console.log("Reset triggered")}
        submissions={submissions}
        onClearSubmissions={() => setSubmissions([])}
      />

      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-green-700">
            🎯 Live Testing Area
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                Current Test: {currentProofType.type}
              </Badge>
              <Badge
                variant="outline"
                className={`${responseMode === "success" ? "bg-green-100 text-green-700 border-green-200" : ""} ${responseMode === "fail" ? "bg-red-100 text-red-700 border-red-200" : ""} ${responseMode === "pending" ? "bg-orange-100 text-orange-700 border-orange-200" : ""}`}
              >
                Response: {responseMode}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <VerificationTrigger
                challenge={testChallenge}
                variant="button"
                className="w-full"
                onSubmit={handleProofSubmit}
              />
              <VerificationTrigger challenge={testChallenge} variant="card" onSubmit={handleProofSubmit} />
              <VerificationTrigger challenge={testChallenge} variant="reminder" onSubmit={handleProofSubmit} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
