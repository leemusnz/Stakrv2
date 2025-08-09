"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Brain, CheckCircle, AlertTriangle, Edit, RefreshCw, Settings } from 'lucide-react'
import type { ChallengeAnalysis, ChallengeAnalysisRequest } from '@/lib/ai-challenge-analyzer'
import { AIAnalyzerControls } from '@/components/dev-tools/ai-analyzer-controls'
import { useAnalyzerDevSettings } from '@/hooks/use-analyzer-dev-settings'

interface AiChallengeSummaryProps {
  challengeData: any // Accept full challenge data object from creation flow
  onConfirm: (analysis: ChallengeAnalysis, confirmedRequirements?: string) => void
  onEdit: () => void
  className?: string
}

export function AiChallengeSummary({ 
  challengeData, 
  onConfirm, 
  onEdit, 
  className = "" 
}: AiChallengeSummaryProps) {
  const [analysis, setAnalysis] = useState<ChallengeAnalysis | null>(null)
  const [summaryText, setSummaryText] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [customRequirements, setCustomRequirements] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [devSettings, setDevSettings] = useState<any>(null)
  const [showDevTools, setShowDevTools] = useState(false)
  const urlDevSettings = useAnalyzerDevSettings()

  // Initialize edited description
  useEffect(() => {
    setEditedDescription(challengeData.description)
  }, [challengeData.description])

  // Trigger analysis when component mounts or challenge data changes
  useEffect(() => {
    if (challengeData.title && challengeData.description) {
      analyzeChallenge()
    }
  }, [challengeData.title, challengeData.description])

  const analyzeChallenge = async (useEditedData = false) => {
    setIsAnalyzing(true)
    setError(null)

    try {
      // Build enhanced description with additional context
      const description = useEditedData ? editedDescription : challengeData.description
      const enhancedDescription = useEditedData && additionalContext.trim() 
        ? `${description}\n\nAdditional Context: ${additionalContext}`
        : description
      
      // Debug logging
      console.log('🔧 Frontend Analysis Debug:')
      console.log('🔧 useEditedData:', useEditedData)
      console.log('🔧 additionalContext:', additionalContext)
      console.log('🔧 additionalContext.trim():', additionalContext.trim())
      console.log('🔧 Enhanced description preview:', enhancedDescription.substring(0, 200) + '...')
      console.log('🔧 Contains Additional Context:', enhancedDescription.includes('Additional Context:'))

      const requestData: ChallengeAnalysisRequest = {
        // Basic Info
        title: challengeData.title,
        description: enhancedDescription,
        duration: parseInt(challengeData.duration),
        difficulty: challengeData.difficulty,
        category: challengeData.category,
        tags: challengeData.tags,
        
        // Challenge Features
        privacyType: challengeData.privacyType,
        isPrivate: challengeData.isPrivate,
        allowPointsOnly: challengeData.allowPointsOnly,
        minParticipants: challengeData.minParticipants,
        maxParticipants: challengeData.maxParticipants,
        startDateType: challengeData.startDateType,
        startDateDays: challengeData.startDateDays,
        joinDeadlineType: challengeData.joinDeadlineType,
        joinDeadlineDays: challengeData.joinDeadlineDays,
        
          // Dev Settings Priority: URL params > Global saved settings > UI settings
  devSettings: urlDevSettings || (() => {
    try {
      const globalSettings = localStorage.getItem('stakr-analyzer-global-settings')
      if (globalSettings) {
        const parsed = JSON.parse(globalSettings)
        if (parsed.enabled) {
          console.log('🌍 Using globally saved analyzer settings:', parsed)
          return parsed
        }
      }
    } catch (e) {
      console.warn('Failed to load global analyzer settings:', e)
    }
    return devSettings
  })(),
        
        // Team & Social Features
        enableTeamMode: challengeData.enableTeamMode,
        teamAssignmentMethod: challengeData.teamAssignmentMethod,
        numberOfTeams: challengeData.numberOfTeams,
        winningCriteria: challengeData.winningCriteria,
        losingTeamOutcome: challengeData.losingTeamOutcome,
        enableReferralBonus: challengeData.enableReferralBonus,
        referralBonusPercentage: challengeData.referralBonusPercentage,
        maxReferrals: challengeData.maxReferrals,
        
        // Rules & Instructions
        rules: challengeData.rules,
        dailyInstructions: challengeData.dailyInstructions,
        generalInstructions: challengeData.generalInstructions,
        
        // Proof & Verification
        verificationType: challengeData.verificationType,
        selectedProofTypes: challengeData.selectedProofTypes,
        proofInstructions: challengeData.proofInstructions,
        cameraOnly: challengeData.cameraOnly,
        allowLateSubmissions: challengeData.allowLateSubmissions,
        lateSubmissionHours: challengeData.lateSubmissionHours,
        requireTimer: challengeData.requireTimer,
        timerMinDuration: challengeData.timerMinDuration,
        timerMaxDuration: challengeData.timerMaxDuration,
        randomCheckinsEnabled: challengeData.randomCheckinsEnabled,
        randomCheckinProbability: challengeData.randomCheckinProbability,
        
        // Stakes & Rewards
        minStake: challengeData.minStake,
        maxStake: challengeData.maxStake,
        hostContribution: challengeData.hostContribution,
        rewardDistribution: challengeData.rewardDistribution
      }

      const response = await fetch('/api/challenges/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setAnalysis(data.analysis)
        setSummaryText(data.summaryText)
        setCustomRequirements(data.analysis.dailyRequirement)
      } else {
        throw new Error(data.error || 'Analysis failed')
      }

    } catch (err) {
      console.error('Challenge analysis error:', err)
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleConfirm = () => {
    if (!analysis) return
    
    // Use custom requirements if user edited them
    const finalAnalysis = isEditing ? {
      ...analysis,
      dailyRequirement: customRequirements,
      interpretation: `User confirmed: ${customRequirements}`
    } : analysis

    onConfirm(finalAnalysis, isEditing ? customRequirements : undefined)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleReAnalyze = async () => {
    await analyzeChallenge(true)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedDescription(challengeData.description)
    setAdditionalContext('')
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-100 text-green-800'
    if (confidence >= 70) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getValidationMethodIcon = (method: string) => {
    switch (method) {
      case 'automatic': return '🤖'
      case 'manual': return '👤'
      case 'hybrid': return '🔄'
      default: return '❓'
    }
  }

  if (isAnalyzing) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            AI Challenge Analysis
          </CardTitle>
          <CardDescription>
            Analyzing your challenge description...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-muted-foreground">
              Understanding your challenge requirements...
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Analysis Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 mt-4">
            <Button onClick={analyzeChallenge} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Analysis
            </Button>
            <Button onClick={onEdit} variant="outline">
              Edit Challenge
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dev Tools - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <AIAnalyzerControls
          onSettingsChange={setDevSettings}
          onTestAnalyzer={(testInput) => analyzeChallenge()}
          currentChallenge={challengeData}
        />
      )}
      
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-500" />
          AI Challenge Summary
          <Badge className={getConfidenceColor(analysis.confidence)}>
            {analysis.confidence}% confident
          </Badge>
        </CardTitle>
        <CardDescription>
          Please review and confirm this interpretation of your challenge
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Interpretation */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Challenge Understanding:</h4>
          <p className="text-blue-800">{analysis.interpretation}</p>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="flex items-center gap-2 mb-3">
              <Edit className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold text-gray-900">Edit and Re-analyze Challenge</h4>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Challenge Description</Label>
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="mt-1"
                rows={3}
                placeholder="Modify the challenge description..."
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Additional Context</Label>
              <Textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                className="mt-1"
                rows={2}
                placeholder="Add any clarifications, examples, or specific requirements..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Help the AI understand edge cases, specific measurements, or clarify ambiguous terms.
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleReAnalyze} 
                disabled={isAnalyzing || !editedDescription.trim()}
                className="flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Re-analyze Challenge
              </Button>
              <Button 
                onClick={handleCancelEdit} 
                variant="outline"
                disabled={isAnalyzing}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Key Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-600">Daily Requirement</Label>
            {isEditing ? (
              <Textarea
                value={customRequirements}
                onChange={(e) => setCustomRequirements(e.target.value)}
                className="mt-1"
                rows={2}
              />
            ) : (
              <p className="mt-1 p-2 bg-gray-50 rounded text-sm">
                {analysis.dailyRequirement}
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-600">Activity Types</Label>
            <div className="mt-1 flex flex-wrap gap-1">
              {analysis.activityType.map((type, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-600">Measurement</Label>
            <p className="mt-1 p-2 bg-gray-50 rounded text-sm">
              {analysis.measurementType}
              {analysis.minimumValue && ` (min: ${analysis.minimumValue} ${analysis.unit})`}
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-600">Validation Method</Label>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-lg">{getValidationMethodIcon(analysis.validationMethod)}</span>
              <span className="text-sm capitalize">{analysis.validationMethod}</span>
            </div>
          </div>
        </div>

        {/* Recommended Proof Types */}
        <div>
          <Label className="text-sm font-medium text-gray-600">Recommended Proof Types</Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {analysis.recommendedProofTypes.map((type, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {type.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>

        {/* Evidence Requirements */}
        {analysis.evidenceRequirements && analysis.evidenceRequirements.length > 0 && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <Label className="text-sm font-medium text-green-800 flex items-center gap-2">
              📹 Evidence Requirements (For Fair Validation)
            </Label>
            <ul className="mt-2 space-y-1 text-sm text-green-700">
              {analysis.evidenceRequirements.map((requirement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-green-600 mt-2 italic">
              These requirements ensure consistent and fair validation for all participants.
            </p>
          </div>
        )}

        {/* Design Analysis */}
        {(analysis.designRecommendations?.length > 0 || analysis.riskFactors?.length > 0) && (
          <div className="space-y-3">
            {/* Stakes & Verification Assessment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg border ${analysis.stakesAppropriate ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <Label className={`text-sm font-medium flex items-center gap-2 ${analysis.stakesAppropriate ? 'text-green-800' : 'text-yellow-800'}`}>
                  💰 Stakes Assessment
                </Label>
                <p className={`mt-1 text-sm ${analysis.stakesAppropriate ? 'text-green-700' : 'text-yellow-700'}`}>
                  {analysis.stakesAppropriate ? 'Stakes are appropriate for this challenge' : 'Stakes may need adjustment'}
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${analysis.verificationOptimal ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <Label className={`text-sm font-medium flex items-center gap-2 ${analysis.verificationOptimal ? 'text-green-800' : 'text-yellow-800'}`}>
                  🔍 Verification Method
                </Label>
                <p className={`mt-1 text-sm ${analysis.verificationOptimal ? 'text-green-700' : 'text-yellow-700'}`}>
                  {analysis.verificationOptimal ? 'Verification method is optimal' : 'Verification could be improved'}
                </p>
              </div>
            </div>

            {/* Design Recommendations */}
            {analysis.designRecommendations?.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Label className="text-sm font-medium text-blue-800 flex items-center gap-2">
                  💡 Design Recommendations
                </Label>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                  {analysis.designRecommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Factors */}
            {analysis.riskFactors?.length > 0 && (
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <Label className="text-sm font-medium text-orange-800 flex items-center gap-2">
                  ⚠️ Risk Factors
                </Label>
                <ul className="mt-2 space-y-1 text-sm text-orange-700">
                  {analysis.riskFactors.map((risk, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

                       {/* User Clarifications Accepted */}
               {analysis.userClarifications && (
                 <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                   <Label className="text-sm font-medium text-green-800 flex items-center gap-2">
                     ✅ User Clarifications Incorporated
                   </Label>
                   <p className="mt-2 text-sm text-green-700">{analysis.userClarifications}</p>
                   {analysis.measurementTolerance && (
                     <p className="mt-1 text-sm text-green-600 italic">
                       Measurement approach: {analysis.measurementTolerance}
                     </p>
                   )}
                 </div>
               )}

               {/* Issues & Clarifications */}
               {(analysis.potentialAmbiguities.length > 0 || analysis.clarificationQuestions.length > 0) && (
                 <Alert className="border-orange-200 bg-orange-50">
                   <AlertTriangle className="h-4 w-4 text-orange-600" />
                   <AlertDescription>
                     <strong className="text-orange-800">Remaining Issues & Clarifications Needed:</strong>
              
              {analysis.potentialAmbiguities.length > 0 && (
                <div className="mt-2">
                  <h6 className="text-sm font-medium text-orange-800">⚠️ Potential Ambiguities:</h6>
                  <ul className="list-disc list-inside mt-1 text-sm text-orange-700 space-y-1">
                    {analysis.potentialAmbiguities.map((ambiguity, index) => (
                      <li key={index}>{ambiguity}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {analysis.clarificationQuestions.length > 0 && (
                <div className="mt-3">
                  <h6 className="text-sm font-medium text-orange-800">❓ Consider Clarifying:</h6>
                  <ul className="list-disc list-inside mt-1 text-sm text-orange-700 space-y-1">
                    {analysis.clarificationQuestions.map((question, index) => (
                      <li key={index}>{question}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <p className="text-xs text-orange-600 mt-2 italic">
                💡 Tip: Use "Add Details & Re-analyze" to clarify these points and improve validation accuracy.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button 
            onClick={handleConfirm} 
            className="flex-1"
            disabled={isEditing && !customRequirements.trim()}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {isEditing ? 'Confirm Custom Requirements' : 'Looks Good - Create Challenge'}
          </Button>
          
          {!isEditing && (
            <Button 
              onClick={handleEdit}
              variant="outline"
              disabled={isAnalyzing}
            >
              <Edit className="w-4 h-4 mr-2" />
              Add Details & Re-analyze
            </Button>
          )}
          
          <Button onClick={onEdit} variant="outline" disabled={isAnalyzing}>
            Modify Challenge Steps
          </Button>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}
