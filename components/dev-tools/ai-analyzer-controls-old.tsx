"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Settings, TestTube, Save, RotateCcw, Loader2 } from 'lucide-react'

interface AnalyzerSettings {
  // Behavior Controls
  contextAwareness: number // 0-100, how smart about obvious questions
  verbosityLevel: number // 0-100, how detailed the analysis should be
  criticalLevel: number // 0-100, how strict/critical to be
  
  // Challenge Type Presets
  challengeTypePreset: 'auto' | 'physical_skills' | 'habits' | 'learning' | 'fitness_tracking' | 'creative'
  
  // Feature Toggles
  skipObviousQuestions: boolean
  includeVerificationOptimization: boolean
  includeRiskAnalysis: boolean
  includeDesignRecommendations: boolean
  
  // Advanced Overrides
  customPromptAdditions: string
  confidenceThreshold: number
  responseFormat: 'standard' | 'detailed' | 'minimal'
}

interface AIAnalyzerControlsProps {
  onSettingsChange: (settings: AnalyzerSettings) => void
  onTestAnalyzer: (testInput: any) => void
  currentChallenge?: any
}

export function AIAnalyzerControls({ 
  onSettingsChange, 
  onTestAnalyzer, 
  currentChallenge 
}: AIAnalyzerControlsProps) {
  const [settings, setSettings] = useState<AnalyzerSettings>({
    contextAwareness: 80,
    verbosityLevel: 60,
    criticalLevel: 70,
    challengeTypePreset: 'auto',
    skipObviousQuestions: true,
    includeVerificationOptimization: true,
    includeRiskAnalysis: true,
    includeDesignRecommendations: true,
    customPromptAdditions: '',
    confidenceThreshold: 85,
    responseFormat: 'standard'
  })

  const [testInput, setTestInput] = useState('')
  const [isEnabled, setIsEnabled] = useState(false)
  const [selectedMockChallenge, setSelectedMockChallenge] = useState('')
  const [testResults, setTestResults] = useState<any>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [selectedVerificationType, setSelectedVerificationType] = useState<string[]>(['video'])
  const [cameraOnlyOverride, setCameraOnlyOverride] = useState<boolean | null>(null)
  const [globalSettingsActive, setGlobalSettingsActive] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai-analyzer-dev-settings')
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved)
        setSettings(parsedSettings)
        setIsEnabled(localStorage.getItem('ai-analyzer-dev-mode') === 'true')
      } catch (e) {
        console.log('Failed to load analyzer dev settings')
      }
    }
    
    // Check if global settings are active
    const checkGlobalSettings = () => {
      try {
        const globalSettings = localStorage.getItem('stakr-analyzer-global-settings')
        if (globalSettings) {
          const parsed = JSON.parse(globalSettings)
          setGlobalSettingsActive(parsed.enabled || false)
        }
      } catch (e) {
        setGlobalSettingsActive(false)
      }
    }
    
    checkGlobalSettings()
  }, [])

  // Save settings whenever they change
  useEffect(() => {
    localStorage.setItem('ai-analyzer-dev-settings', JSON.stringify(settings))
    localStorage.setItem('ai-analyzer-dev-mode', isEnabled.toString())
    
    if (isEnabled) {
      onSettingsChange(settings)
    }
  }, [settings, isEnabled, onSettingsChange])

  const handleSliderChange = (key: keyof AnalyzerSettings, value: number[]) => {
    setSettings(prev => ({ ...prev, [key]: value[0] }))
  }

  const handleSwitchChange = (key: keyof AnalyzerSettings, checked: boolean) => {
    setSettings(prev => ({ ...prev, [key]: checked }))
  }

  const handleSelectChange = (key: keyof AnalyzerSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    setSettings({
      contextAwareness: 80,
      verbosityLevel: 60,
      criticalLevel: 70,
      challengeTypePreset: 'auto',
      skipObviousQuestions: true,
      includeVerificationOptimization: true,
      includeRiskAnalysis: true,
      includeDesignRecommendations: true,
      customPromptAdditions: '',
      confidenceThreshold: 85,
      responseFormat: 'standard'
    })
  }

  const handleTestWithCurrent = () => {
    if (currentChallenge) {
      onTestAnalyzer(currentChallenge)
    }
  }

  // Mock challenge examples for testing
  const mockChallenges = {
    handstand: {
      title: "Handstand Walk Challenge",
      description: "Walk 10m on your hands for a consecutive distance of 10m every day for 3 days.",
      duration: 3,
      difficulty: "Hard",
      category: "Fitness",
      selectedProofTypes: ["video"],
      proofInstructions: "Record yourself from the side, showing your whole body in frame throughout the entire 10m handstand walk. Use AI analysis to measure the distance covered.",
      cameraOnly: true,
      minStake: 50,
      maxStake: 200
    },
    journaling: {
      title: "Daily Gratitude Journal",
      description: "Write down 3 things you're grateful for each day for 30 days.",
      duration: 30,
      difficulty: "Easy",
      category: "Personal Development",
      selectedProofTypes: ["text"],
      proofInstructions: "Share a brief summary or key theme from your gratitude entries (you don't need to share personal details).",
      cameraOnly: false,
      minStake: 10,
      maxStake: 50
    },
    guitar: {
      title: "Learn Guitar Basics",
      description: "Practice guitar for 30 minutes daily, learning basic chords and strumming patterns.",
      duration: 14,
      difficulty: "Medium",
      category: "Learning",
      selectedProofTypes: ["video"],
      proofInstructions: "Record a short video of yourself playing the chord progression or song you practiced that day.",
      cameraOnly: true,
      minStake: 25,
      maxStake: 100
    },
    running: {
      title: "5K Training Run",
      description: "Run 5 kilometers every other day to build endurance and speed.",
      duration: 21,
      difficulty: "Medium",
      category: "Fitness",
      selectedProofTypes: ["auto_sync"],
      proofInstructions: "Sync your run data from your fitness tracker or running app showing distance, time, and route.",
      cameraOnly: false,
      minStake: 30,
      maxStake: 150
    },
    meditation: {
      title: "Morning Meditation Practice",
      description: "Meditate for 10 minutes every morning using guided meditation or mindfulness techniques.",
      duration: 21,
      difficulty: "Easy",
      category: "Wellness",
      selectedProofTypes: ["text", "photo"],
      proofInstructions: "Take a photo of your meditation space and write a brief reflection on your session.",
      cameraOnly: false,
      minStake: 15,
      maxStake: 75
    }
  }

  const runAnalyzerTest = async (challenge: any) => {
    setIsTesting(true)
    setTestResults(null)
    setSelectedMockChallenge(challenge.title)
    
    try {
      // Apply verification type overrides
      const testChallenge = {
        ...challenge,
        selectedProofTypes: selectedVerificationType,
        cameraOnly: cameraOnlyOverride !== null ? cameraOnlyOverride : challenge.cameraOnly,
        // Include current dev settings
        devSettings: isEnabled ? settings : null
      }

      const response = await fetch('/api/challenges/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testChallenge)
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`)
      }

      const result = await response.json()
      setTestResults(result.analysis)
    } catch (error) {
      console.error('Test failed:', error)
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsTesting(false)
    }
  }

  const getPresetDescription = (preset: string) => {
    const descriptions = {
      auto: 'Automatically detect challenge type and apply appropriate analysis',
      physical_skills: 'For specific physical skills like handstands, gymnastics, technique-based activities',
      habits: 'For daily habits like brushing teeth, journaling, meditation',
      learning: 'For skill learning like guitar, languages, reading',
      fitness_tracking: 'For measurable fitness activities like running, steps, general exercise',
      creative: 'For creative challenges like art, writing, music composition'
    }
    return descriptions[preset as keyof typeof descriptions] || ''
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          AI Analyzer Dev Tools
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            className="ml-auto"
          />
          <Label htmlFor="dev-mode">Dev Mode</Label>
        </CardTitle>
      </CardHeader>
      
      {isEnabled && (
        <CardContent className="space-y-6">
          {/* Behavior Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Behavior Controls</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Context Awareness: {settings.contextAwareness}%</Label>
                <Slider
                  value={[settings.contextAwareness]}
                  onValueChange={(value) => handleSliderChange('contextAwareness', value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Higher = Skip more obvious questions
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Verbosity Level: {settings.verbosityLevel}%</Label>
                <Slider
                  value={[settings.verbosityLevel]}
                  onValueChange={(value) => handleSliderChange('verbosityLevel', value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Higher = More detailed analysis
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Critical Level: {settings.criticalLevel}%</Label>
                <Slider
                  value={[settings.criticalLevel]}
                  onValueChange={(value) => handleSliderChange('criticalLevel', value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Higher = More strict and critical
                </p>
              </div>
            </div>
          </div>

          {/* Challenge Type Preset */}
          <div className="space-y-2">
            <Label>Challenge Type Preset</Label>
            <Select
              value={settings.challengeTypePreset}
              onValueChange={(value) => handleSelectChange('challengeTypePreset', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                <SelectItem value="physical_skills">Physical Skills</SelectItem>
                <SelectItem value="habits">Daily Habits</SelectItem>
                <SelectItem value="learning">Learning Activities</SelectItem>
                <SelectItem value="fitness_tracking">Fitness Tracking</SelectItem>
                <SelectItem value="creative">Creative Challenges</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getPresetDescription(settings.challengeTypePreset)}
            </p>
          </div>

          {/* Feature Toggles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Feature Toggles</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.skipObviousQuestions}
                  onCheckedChange={(checked) => handleSwitchChange('skipObviousQuestions', checked)}
                />
                <Label>Skip Obvious Questions</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.includeVerificationOptimization}
                  onCheckedChange={(checked) => handleSwitchChange('includeVerificationOptimization', checked)}
                />
                <Label>Verification Optimization</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.includeRiskAnalysis}
                  onCheckedChange={(checked) => handleSwitchChange('includeRiskAnalysis', checked)}
                />
                <Label>Risk Analysis</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.includeDesignRecommendations}
                  onCheckedChange={(checked) => handleSwitchChange('includeDesignRecommendations', checked)}
                />
                <Label>Design Recommendations</Label>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Advanced Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Confidence Threshold: {settings.confidenceThreshold}%</Label>
                <Slider
                  value={[settings.confidenceThreshold]}
                  onValueChange={(value) => handleSliderChange('confidenceThreshold', value)}
                  min={50}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Response Format</Label>
                <Select
                  value={settings.responseFormat}
                  onValueChange={(value) => handleSelectChange('responseFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Custom Prompt Additions</Label>
              <Textarea
                value={settings.customPromptAdditions}
                onChange={(e) => setSettings(prev => ({ ...prev, customPromptAdditions: e.target.value }))}
                placeholder="Add custom instructions to the analyzer prompt..."
                className="min-h-20"
              />
              <p className="text-xs text-muted-foreground">
                These instructions will be added to the analyzer prompt
              </p>
            </div>
          </div>

          {/* Live Testing Playground */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Live Testing Playground</h3>
            
            {/* Verification Type Override Controls */}
            <div className="p-4 border rounded-lg bg-muted/20">
              <h4 className="font-medium mb-3">Verification Settings Override</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proof Type</Label>
                  <Select
                    value={selectedVerificationType[0] || 'video'}
                    onValueChange={(value) => {
                      if (value === 'mixed') {
                        setSelectedVerificationType(['photo', 'text'])
                      } else {
                        setSelectedVerificationType([value])
                        // Clear camera-only override for non-visual proof types
                        if (value === 'text' || value === 'auto_sync') {
                          setCameraOnlyOverride(null)
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select verification type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Proof</SelectItem>
                      <SelectItem value="photo">Photo Proof</SelectItem>
                      <SelectItem value="text">Text Proof</SelectItem>
                      <SelectItem value="auto_sync">Auto Sync (Fitness)</SelectItem>
                      <SelectItem value="mixed">Mixed (Photo + Text)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Only show Camera-Only controls for photo/video verification */}
                {(['photo', 'video'].some(type => selectedVerificationType.includes(type)) || selectedVerificationType.includes('mixed')) && (
                  <div className="space-y-2">
                    <Label>Camera-Only Security</Label>
                    <div className="flex items-center space-x-4">
                      <Button
                        variant={cameraOnlyOverride === true ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCameraOnlyOverride(true)}
                      >
                        Camera Only
                      </Button>
                      <Button
                        variant={cameraOnlyOverride === false ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCameraOnlyOverride(false)}
                      >
                        Gallery Allowed
                      </Button>
                      <Button
                        variant={cameraOnlyOverride === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCameraOnlyOverride(null)}
                      >
                        Default
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Controls whether photos/videos must be captured live through the app camera
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  These settings will override the default verification types when testing sample challenges
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    // Re-test the last selected challenge with current settings
                    const lastChallenge = Object.values(mockChallenges).find(c => c.title === selectedMockChallenge)
                    if (lastChallenge) {
                      runAnalyzerTest(lastChallenge)
                    }
                  }}
                  disabled={!selectedMockChallenge || isTesting}
                  className="text-xs"
                >
                  <TestTube className="h-3 w-3 mr-1" />
                  Re-test with Current Settings
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Mock Challenge Selector */}
              <div className="space-y-3">
                <Label>Test with Sample Challenges</Label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(mockChallenges).map(([key, challenge]) => (
                    <Button
                      key={key}
                      onClick={() => runAnalyzerTest(challenge)}
                      disabled={isTesting}
                      variant={selectedMockChallenge === key ? "default" : "outline"}
                      className="justify-start text-left h-auto p-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{challenge.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {challenge.category} • {challenge.difficulty} • {challenge.duration} days
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Will test with: {selectedVerificationType.length > 1 ? selectedVerificationType.join(' + ') : selectedVerificationType[0] || challenge.selectedProofTypes[0]}
                          {/* Only show Camera Only for photo/video types */}
                          {(['photo', 'video'].some(type => selectedVerificationType.includes(type)) || selectedVerificationType.includes('mixed')) && 
                           (cameraOnlyOverride !== null ? cameraOnlyOverride : challenge.cameraOnly) && ' (Camera Only)'}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Test Results */}
              <div className="space-y-3">
                <Label>Analysis Results</Label>
                <div className="border rounded-lg p-4 min-h-[400px] bg-muted/20">
                  {isTesting && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Analyzing challenge...</p>
                      </div>
                    </div>
                  )}
                  
                  {testResults && !isTesting && (
                    <div className="space-y-4">
                      {testResults.error ? (
                        <div className="text-red-600">
                          <p className="font-medium">Error:</p>
                          <p className="text-sm">{testResults.error}</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Test Configuration Summary */}
                          <div className="p-2 bg-blue-50 rounded text-xs">
                            <p className="font-medium">Tested Configuration:</p>
                            <p>Proof Type: {selectedVerificationType.length > 1 ? selectedVerificationType.join(' + ') : selectedVerificationType[0]}</p>
                            {/* Only show Camera Only setting for photo/video types */}
                            {(['photo', 'video'].some(type => selectedVerificationType.includes(type)) || selectedVerificationType.includes('mixed')) && (
                              <p>Camera Only: {cameraOnlyOverride !== null ? (cameraOnlyOverride ? 'Yes' : 'No') : 'Default'}</p>
                            )}
                          </div>
                          
                          <div>
                            <p className="font-medium text-sm">Daily Requirement:</p>
                            <p className="text-sm">{testResults.dailyRequirement}</p>
                          </div>
                          
                          <div>
                            <p className="font-medium text-sm">Confidence:</p>
                            <Badge variant={testResults.confidence >= 80 ? "default" : "secondary"}>
                              {testResults.confidence}%
                            </Badge>
                          </div>
                          
                          {testResults.potentialAmbiguities && testResults.potentialAmbiguities.length > 0 && (
                            <div>
                              <p className="font-medium text-sm">Potential Issues:</p>
                              <ul className="text-xs space-y-1 mt-1">
                                {testResults.potentialAmbiguities.map((amb: string, idx: number) => (
                                  <li key={idx} className="text-yellow-600">• {amb}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {testResults.clarificationQuestions && testResults.clarificationQuestions.length > 0 && (
                            <div>
                              <p className="font-medium text-sm">Questions Asked:</p>
                              <ul className="text-xs space-y-1 mt-1">
                                {testResults.clarificationQuestions.map((question: string, idx: number) => (
                                  <li key={idx} className="text-blue-600">• {question}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {testResults.evidenceRequirements && testResults.evidenceRequirements.length > 0 && (
                            <div>
                              <p className="font-medium text-sm">Evidence Requirements:</p>
                              <ul className="text-xs space-y-1 mt-1">
                                {testResults.evidenceRequirements.map((req: string, idx: number) => (
                                  <li key={idx} className="text-green-600">• {req}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {testResults.riskFactors && testResults.riskFactors.length > 0 && (
                            <div>
                              <p className="font-medium text-sm">Risk Assessment:</p>
                              <ul className="text-xs space-y-1 mt-1">
                                {testResults.riskFactors.map((risk: string, idx: number) => (
                                  <li key={idx} className="text-red-600">• {risk}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!testResults && !isTesting && (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p className="text-sm">Select a sample challenge to see how the analyzer responds</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              <Button 
                onClick={() => {
                  // Test with a default challenge if none selected
                  const defaultChallenge = mockChallenges.handstand
                  runAnalyzerTest(defaultChallenge)
                }}
                disabled={isTesting}
                className="flex items-center gap-2"
                variant="default"
              >
                <TestTube className="h-4 w-4" />
                Test Settings Now
              </Button>
              
              <Button 
                onClick={handleTestWithCurrent}
                disabled={!currentChallenge || isTesting}
                variant="outline"
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                Test Current Challenge
              </Button>
              
              <Button 
                onClick={handleReset}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Defaults
              </Button>
              
              <Button 
                onClick={() => {
                  // Save settings to localStorage for use across the app
                  const globalSettings = {
                    ...settings,
                    enabled: isEnabled,
                    timestamp: Date.now(),
                    name: `Settings ${new Date().toLocaleTimeString()}`
                  }
                  localStorage.setItem('stakr-analyzer-global-settings', JSON.stringify(globalSettings))
                  
                  // Also copy URL for sharing
                  const settingsUrl = new URL(window.location.href)
                  Object.entries(settings).forEach(([key, value]) => {
                    settingsUrl.searchParams.set(key, value.toString())
                  })
                  settingsUrl.searchParams.set('enabled', isEnabled.toString())
                  navigator.clipboard.writeText(settingsUrl.toString())
                  
                  // Update global settings status
                  setGlobalSettingsActive(isEnabled)
                  
                  // Show confirmation
                  alert('Settings saved globally and URL copied to clipboard!\n\nThese settings will now be used in:\n• Real challenge creation\n• Challenge re-analysis\n• All analyzer calls')
                }}
                variant="default"
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Apply Settings Globally
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <p className="text-xs text-muted-foreground">
                <strong>Test Settings Now</strong> applies your current dev settings to the handstand challenge. 
                <strong>Apply Settings Globally</strong> saves settings for use across all challenge creation.
              </p>
              {globalSettingsActive && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-orange-600 font-medium">
                    ⚠️ Global settings are currently overriding default analyzer behavior
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      localStorage.removeItem('stakr-analyzer-global-settings')
                      setGlobalSettingsActive(false)
                      alert('Global settings cleared. Analyzer will use default settings for new challenges.')
                    }}
                    className="text-xs"
                  >
                    Clear Global Settings
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Current Settings Summary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Active Settings</h3>
              <Badge variant={isEnabled ? "default" : "secondary"}>
                {isEnabled ? "Custom Settings Active" : "Default Settings"}
              </Badge>
              {globalSettingsActive && (
                <Badge variant="destructive" className="text-xs">
                  🌍 Global Settings Applied
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Context: {settings.contextAwareness}%</Badge>
              <Badge variant="secondary">Verbosity: {settings.verbosityLevel}%</Badge>
              <Badge variant="secondary">Critical: {settings.criticalLevel}%</Badge>
              <Badge variant="secondary">Preset: {settings.challengeTypePreset}</Badge>
              <Badge variant="secondary">Format: {settings.responseFormat}</Badge>
              {settings.skipObviousQuestions && <Badge variant="outline">Skip Obvious</Badge>}
              {settings.customPromptAdditions && <Badge variant="destructive">Custom Prompt</Badge>}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
