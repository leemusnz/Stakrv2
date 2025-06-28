"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, RotateCcw, Zap, Settings, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import type { OnboardingData } from "@/app/onboarding/page"

interface DevTestingPanelProps {
  currentStep: number
  onboardingData: OnboardingData
  onJumpToStep: (step: number) => void
  onLoadPreset: (preset: Partial<OnboardingData>) => void
  onToggleVariant: (variant: string) => void
}

const presets = {
  "fitness-beginner": {
    goals: ["Exercise Daily", "Lose Weight", "Sleep Better"],
    interests: ["Fitness & Exercise", "Healthy Eating"],
    experience: "beginner",
    motivation: "health",
    name: "Alex",
    preferredStakeRange: "$10-25",
  },
  "productivity-expert": {
    goals: ["Wake Up Early", "Deep Work Sessions", "Learn New Skill"],
    interests: ["Productivity & Focus", "Reading & Learning"],
    experience: "expert",
    motivation: "career",
    name: "Jordan",
    preferredStakeRange: "$50-100",
  },
  "wellness-intermediate": {
    goals: ["Meditate Daily", "Practice Gratitude", "Reduce Stress"],
    interests: ["Meditation & Mindfulness", "Mental Wellness"],
    experience: "some-experience",
    motivation: "mental-health",
    name: "Sam",
    preferredStakeRange: "$25-50",
  },
  "points-user": {
    goals: ["Journal", "Read Daily"],
    interests: ["Creative Writing", "Reading & Learning"],
    experience: "beginner",
    motivation: "personal-growth",
    name: "Casey",
    preferredStakeRange: "250-500",
  },
}

const stepNames = [
  "Welcome",
  "Habit Science",
  "How It Works",
  "Goals",
  "Interests",
  "Recommendation",
  "Profile",
  "Ready",
]

export function DevTestingPanel({
  currentStep,
  onboardingData,
  onJumpToStep,
  onLoadPreset,
  onToggleVariant,
}: DevTestingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const copyDataToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(onboardingData, null, 2))
  }

  const resetData = () => {
    onLoadPreset({
      goals: [],
      interests: [],
      experience: "",
      motivation: "",
      name: "",
      preferredStakeRange: "",
    })
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 bg-slate-900 text-white border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="font-bold text-sm">Dev Tools</span>
              <Badge variant="outline" className="text-xs bg-slate-800 border-slate-600">
                Step {currentStep + 1}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white hover:bg-slate-800"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>

          {isExpanded && (
            <div className="space-y-4">
              {/* Step Navigation */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Jump to Step</label>
                <Select value={currentStep.toString()} onValueChange={(value) => onJumpToStep(Number.parseInt(value))}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {stepNames.map((name, index) => (
                      <SelectItem key={index} value={index.toString()} className="text-white hover:bg-slate-700">
                        {index + 1}. {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Presets */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Load Preset</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(presets).map(([key, preset]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => onLoadPreset(preset)}
                      className="text-xs bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                    >
                      {key
                        .split("-")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Variants */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Test Variants</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleVariant("headline-a")}
                    className="text-xs bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                  >
                    Headline A
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleVariant("headline-b")}
                    className="text-xs bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                  >
                    Headline B
                  </Button>
                </div>
              </div>

              {/* Data Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyDataToClipboard}
                  className="flex-1 text-xs bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetData}
                  className="flex-1 text-xs bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onJumpToStep(stepNames.length - 1)}
                  className="w-full text-xs bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Skip to End
                </Button>
              </div>

              {/* Data Preview */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Current Data</label>
                <div className="text-xs bg-slate-800 p-2 rounded border border-slate-600 max-h-32 overflow-y-auto">
                  <pre className="text-slate-300">{JSON.stringify(onboardingData, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
