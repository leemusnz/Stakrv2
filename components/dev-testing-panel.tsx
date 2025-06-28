"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Settings,
  Bug,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  Video,
  FileText,
  Upload,
  Copy,
  Trash2,
} from "lucide-react"
import type { ProofRequirement } from "@/lib/types"

interface DevTestingPanelProps {
  onProofTypeChange: (proofType: ProofRequirement) => void
  onResponseModeChange: (mode: "success" | "fail" | "pending") => void
  onReset: () => void
  submissions: Array<{
    id: string
    challengeId: string
    proofType: string
    submittedAt: string
    status: string
    payload: any
  }>
  onClearSubmissions: () => void
}

export function DevTestingPanel({
  onProofTypeChange,
  onResponseModeChange,
  onReset,
  submissions,
  onClearSubmissions,
}: DevTestingPanelProps) {
  const [selectedProofType, setSelectedProofType] = useState<string>("photo")
  const [responseMode, setResponseMode] = useState<"success" | "fail" | "pending">("success")
  const [showDebugPanel, setShowDebugPanel] = useState(false)

  const proofTypes: Record<string, ProofRequirement> = {
    photo: {
      type: "photo",
      required: true,
      cameraOnly: true,
      instructions: "Take a photo of your meditation setup",
      examples: ["Meditation cushion/chair", "Quiet space", "Any props you use"],
    },
    "photo-flexible": {
      type: "photo",
      required: true,
      cameraOnly: false,
      instructions: "Photo of book page with bookmark/progress",
      examples: ["Book open to current page", "Reading app screenshot", "Notes you took"],
    },
    video: {
      type: "video",
      required: true,
      cameraOnly: true,
      instructions: "Record a 10-second video showing you turning on cold water",
      examples: ["Show the temperature dial", "Your reaction to cold water", "Steam/condensation"],
    },
    text: {
      type: "text",
      required: true,
      instructions: "List 3 specific things you're grateful for and why",
      examples: ["Personal relationships", "Small daily moments", "Achievements or progress"],
    },
    file: {
      type: "file",
      required: true,
      instructions: "Upload any files related to today's work",
      examples: ["Code files", "Design mockups", "Documentation"],
    },
    "multi-option": {
      type: "photo",
      required: false,
      instructions: "Choose your preferred proof method",
      examples: ["Multiple options available"],
    },
  }

  const handleProofTypeChange = (value: string) => {
    setSelectedProofType(value)
    onProofTypeChange(proofTypes[value])
  }

  const handleResponseModeChange = (checked: boolean, mode: "success" | "fail" | "pending") => {
    if (checked) {
      setResponseMode(mode)
      onResponseModeChange(mode)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getProofTypeIcon = (type: string) => {
    switch (type) {
      case "photo":
        return <Camera className="w-4 h-4" />
      case "video":
        return <Video className="w-4 h-4" />
      case "file":
        return <Upload className="w-4 h-4" />
      case "text":
        return <FileText className="w-4 h-4" />
      default:
        return <Camera className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Testing Controls */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-orange-700">
            <Settings className="w-5 h-5" />🧪 Dev Testing Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Proof Type Selector */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Proof Type to Test</Label>
            <Select value={selectedProofType} onValueChange={handleProofTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select proof type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photo">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Photo (Camera Only)
                  </div>
                </SelectItem>
                <SelectItem value="photo-flexible">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Photo (Upload Allowed)
                  </div>
                </SelectItem>
                <SelectItem value="video">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Video (Camera Only)
                  </div>
                </SelectItem>
                <SelectItem value="text">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Text Only
                  </div>
                </SelectItem>
                <SelectItem value="file">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    File Upload
                  </div>
                </SelectItem>
                <SelectItem value="multi-option">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Multi-Option Challenge
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              Current: <strong>{proofTypes[selectedProofType]?.instructions}</strong>
            </div>
          </div>

          {/* Response Simulation */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Simulate Response</Label>
            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="success"
                  checked={responseMode === "success"}
                  onCheckedChange={(checked) => handleResponseModeChange(checked, "success")}
                />
                <Label htmlFor="success" className="flex items-center gap-1 text-sm">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Success
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="fail"
                  checked={responseMode === "fail"}
                  onCheckedChange={(checked) => handleResponseModeChange(checked, "fail")}
                />
                <Label htmlFor="fail" className="flex items-center gap-1 text-sm">
                  <XCircle className="w-4 h-4 text-destructive" />
                  Fail
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="pending"
                  checked={responseMode === "pending"}
                  onCheckedChange={(checked) => handleResponseModeChange(checked, "pending")}
                />
                <Label htmlFor="pending" className="flex items-center gap-1 text-sm">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Pending
                </Label>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              Current mode: <strong>{responseMode}</strong>
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={onReset} variant="outline" className="flex items-center gap-2 bg-transparent">
              <RotateCcw className="w-4 h-4" />
              Reset Modal
            </Button>
            <Button
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Bug className="w-4 h-4" />
              {showDebugPanel ? "Hide" : "Show"} Debug
            </Button>
            <Button
              onClick={onClearSubmissions}
              variant="outline"
              className="flex items-center gap-2 text-destructive hover:text-destructive bg-transparent"
            >
              <Trash2 className="w-4 h-4" />
              Clear Submissions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Panel */}
      {showDebugPanel && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-blue-700">
              <Bug className="w-5 h-5" />🐛 Debug Panel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Config */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Test Configuration</Label>
              <Textarea
                value={JSON.stringify(
                  {
                    proofType: selectedProofType,
                    responseMode,
                    proofConfig: proofTypes[selectedProofType],
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2,
                )}
                readOnly
                className="font-mono text-xs h-32 bg-white"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  copyToClipboard(
                    JSON.stringify(
                      {
                        proofType: selectedProofType,
                        responseMode,
                        proofConfig: proofTypes[selectedProofType],
                      },
                      null,
                      2,
                    ),
                  )
                }
                className="flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Copy Config
              </Button>
            </div>

            {/* Submission History */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Submission History ({submissions.length})</Label>
                {submissions.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onClearSubmissions}
                    className="text-xs text-destructive hover:text-destructive"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {submissions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No submissions yet. Submit a proof to see the payload here.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="p-3 bg-white rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getProofTypeIcon(submission.proofType)}
                          <span className="font-medium text-sm">{submission.proofType}</span>
                          <Badge
                            variant={submission.status === "success" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {submission.status}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(JSON.stringify(submission.payload, null, 2))}
                          className="h-auto p-1"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <Textarea
                        value={JSON.stringify(submission.payload, null, 2)}
                        readOnly
                        className="font-mono text-xs h-24 bg-gray-50"
                      />
                      <div className="text-xs text-muted-foreground mt-1">{submission.submittedAt}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
