"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, X, CheckCircle, AlertCircle, Lightbulb } from "lucide-react"

interface RulesRequirementsStepProps {
  rules: string[]
  dailyInstructions: string
  generalInstructions: string
  onRulesChange: (rules: string[]) => void
  onDailyInstructionsChange: (instructions: string) => void
  onGeneralInstructionsChange: (instructions: string) => void
}

const commonRules = [
  "Complete the daily task before midnight",
  "Submit proof within 24 hours",
  "No skipping days - consistency is key",
  "Be honest in your submissions",
  "Support other participants in comments",
  "Follow the specific instructions each day",
  "Quality over quantity in submissions",
]

export function RulesRequirementsStep({
  rules,
  dailyInstructions,
  generalInstructions,
  onRulesChange,
  onDailyInstructionsChange,
  onGeneralInstructionsChange,
}: RulesRequirementsStepProps) {
  const [newRule, setNewRule] = useState("")

  const addRule = (rule: string) => {
    if (rule && !rules.includes(rule) && rules.length < 8) {
      onRulesChange([...rules, rule])
      setNewRule("")
    }
  }

  const removeRule = (ruleToRemove: string) => {
    onRulesChange(rules.filter((rule) => rule !== ruleToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addRule(newRule)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Set the rules and requirements</h2>
        <p className="text-muted-foreground">
          Clear rules help participants succeed and ensure fair play. Be specific about what's expected daily.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Challenge Rules */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Challenge Rules ({rules.length}/8) *
              </Label>
              <p className="text-xs text-muted-foreground">
                Set clear expectations for participation. These will be shown to all participants.
              </p>
            </div>

            {/* Add New Rule */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a rule (e.g., Complete daily task before 10 PM)"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addRule(newRule)}
                disabled={!newRule || rules.length >= 8}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Current Rules */}
            {rules.length > 0 && (
              <div className="space-y-2">
                {rules.map((rule, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Badge variant="outline" className="mt-0.5 text-xs">
                      {index + 1}
                    </Badge>
                    <p className="flex-1 text-sm">{rule}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRule(rule)}
                      className="h-6 w-6 p-0 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Common Rules */}
            {rules.length < 8 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Common rules you can add:</p>
                <div className="grid grid-cols-1 gap-2">
                  {commonRules
                    .filter((rule) => !rules.includes(rule))
                    .slice(0, 4)
                    .map((rule) => (
                      <Button
                        key={rule}
                        variant="outline"
                        size="sm"
                        className="justify-start h-auto p-2 text-xs text-left bg-transparent"
                        onClick={() => addRule(rule)}
                      >
                        <Plus className="w-3 h-3 mr-2 flex-shrink-0" />
                        {rule}
                      </Button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Daily Instructions */}
          <div className="space-y-2">
            <Label htmlFor="daily-instructions" className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-secondary" />
              Daily Instructions *
            </Label>
            <Textarea
              id="daily-instructions"
              placeholder="What should participants do each day? Be specific about timing, duration, and any requirements..."
              value={dailyInstructions}
              onChange={(e) => onDailyInstructionsChange(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {dailyInstructions.length}/300 characters. This will be shown to participants every day.
            </p>
          </div>

          {/* General Instructions */}
          <div className="space-y-2">
            <Label htmlFor="general-instructions" className="text-sm font-medium">
              Additional Instructions (Optional)
            </Label>
            <Textarea
              id="general-instructions"
              placeholder="Any additional context, tips, or motivation you want to share with participants..."
              value={generalInstructions}
              onChange={(e) => onGeneralInstructionsChange(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">General guidance that will help participants succeed.</p>
          </div>
        </div>

        {/* Tips Sidebar */}
        <div className="space-y-4">
          <Card className="bg-secondary/5 border-secondary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-secondary">
                <Lightbulb className="w-4 h-4" />
                Rule Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium mb-1">Essential Rules:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Daily completion deadline</li>
                  <li>• Proof submission timing</li>
                  <li>• Honesty and integrity</li>
                </ul>
              </div>

              <div>
                <p className="font-medium mb-1">Good Daily Instructions:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Specific time commitment</li>
                  <li>• Clear success criteria</li>
                  <li>• What to do if you miss</li>
                </ul>
              </div>

              <div>
                <p className="font-medium mb-1">Examples:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• "Meditate for 10+ minutes"</li>
                  <li>• "Read 20+ pages"</li>
                  <li>• "Exercise for 30+ minutes"</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-primary">Success Tip</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-muted-foreground">
                Challenges with clear, specific rules have 3x higher completion rates. Be detailed about timing and
                expectations!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
