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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, TestTube, Save, RotateCcw, Loader2, Brain, Zap, Shield, Info } from 'lucide-react'

interface AnalyzerSettings {
  // Behavior Controls
  contextAwareness: number
  verbosityLevel: number
  criticalLevel: number
  
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

  const [isEnabled, setIsEnabled] = useState(false)
  const [globalSettingsActive, setGlobalSettingsActive] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [selectedVerificationType, setSelectedVerificationType] = useState<string[]>(['video'])
  const [cameraOnlyOverride, setCameraOnlyOverride] = useState<boolean | null>(null)
  const [selectedMockChallenge, setSelectedMockChallenge] = useState('')

  // Mock challenges
  const mockChallenges = {
    handstand: {
      title: "Handstand Walk Challenge",
      description: "Walk 10m on your hands for a consecutive distance of 10m every day for 3 days.",
      duration: 3,
      difficulty: "Hard",
      category: "Fitness",
      selectedProofTypes: ["video"],
      proofInstructions: "Record yourself from the side, showing your whole body in frame throughout the entire 10m handstand walk.",
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
      proofInstructions: "Share a brief summary or key theme from your gratitude entries.",
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
    }
  }

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

  const runAnalyzerTest = async (challenge: any) => {
    setIsTesting(true)
    setTestResults(null)
    setSelectedMockChallenge(challenge.title)
    
    try {
      const testChallenge = {
        ...challenge,
        selectedProofTypes: selectedVerificationType,
        cameraOnly: cameraOnlyOverride !== null ? cameraOnlyOverride : challenge.cameraOnly,
        devSettings: isEnabled ? settings : null
      }

      const response = await fetch('/api/challenges/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const applyGlobalSettings = () => {
    const globalSettings = {
      ...settings,
      enabled: isEnabled,
      timestamp: Date.now(),
      name: `Settings ${new Date().toLocaleTimeString()}`
    }
    localStorage.setItem('stakr-analyzer-global-settings', JSON.stringify(globalSettings))
    setGlobalSettingsActive(isEnabled)
    
    // Copy URL for sharing
    const settingsUrl = new URL(window.location.href)
    Object.entries(settings).forEach(([key, value]) => {
      settingsUrl.searchParams.set(key, value.toString())
    })
    settingsUrl.searchParams.set('enabled', isEnabled.toString())
    navigator.clipboard.writeText(settingsUrl.toString())
    
    alert('Settings saved globally and URL copied to clipboard!')
  }

  const clearGlobalSettings = () => {
    localStorage.removeItem('stakr-analyzer-global-settings')
    setGlobalSettingsActive(false)
    alert('Global settings cleared. Analyzer will use default settings for new challenges.')
  }

  return (
    <div className="w-full max-w-6xl space-y-6">
      {/* Main Toggle & Status */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>AI Analyzer Configuration</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Fine-tune analyzer behavior for optimal challenge analysis
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="dev-mode"
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                />
                <Label htmlFor="dev-mode" className="font-medium">
                  Custom Settings
                </Label>
              </div>
              
              {isEnabled && (
                <Badge variant="default">
                  <Zap className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
              
              {globalSettingsActive && (
                <Badge variant="destructive">
                  <Shield className="h-3 w-3 mr-1" />
                  Global Override
                </Badge>
              )}
            </div>
          </div>
          
          {globalSettingsActive && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Global settings are overriding analyzer behavior across all challenge creation</span>
                <Button size="sm" variant="outline" onClick={clearGlobalSettings}>
                  Clear Global Settings
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
      </Card>

      {isEnabled && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="behavior" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="behavior" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Core Behavior Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Smart Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">Context Awareness</Label>
                          <Badge variant="outline">{settings.contextAwareness}%</Badge>
                        </div>
                        <Slider
                          value={[settings.contextAwareness]}
                          onValueChange={(value) => handleSliderChange('contextAwareness', value)}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Higher values make the analyzer skip more obvious questions and focus on genuine issues
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">Analysis Depth</Label>
                          <Badge variant="outline">{settings.verbosityLevel}%</Badge>
                        </div>
                        <Slider
                          value={[settings.verbosityLevel]}
                          onValueChange={(value) => handleSliderChange('verbosityLevel', value)}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Controls how detailed and comprehensive the analysis should be
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">Critical Level</Label>
                          <Badge variant="outline">{settings.criticalLevel}%</Badge>
                        </div>
                        <Slider
                          value={[settings.criticalLevel]}
                          onValueChange={(value) => handleSliderChange('criticalLevel', value)}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          How strict and critical the analyzer should be when evaluating challenges
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Challenge Type Preset */}
                    <div className="space-y-3">
                      <Label className="font-medium">Challenge Type Optimization</Label>
                      <Select
                        value={settings.challengeTypePreset}
                        onValueChange={(value) => handleSelectChange('challengeTypePreset', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">🤖 Auto-detect (Recommended)</SelectItem>
                          <SelectItem value="physical_skills">💪 Physical Skills</SelectItem>
                          <SelectItem value="habits">📝 Daily Habits</SelectItem>
                          <SelectItem value="learning">🎓 Learning Activities</SelectItem>
                          <SelectItem value="fitness_tracking">🏃 Fitness Tracking</SelectItem>
                          <SelectItem value="creative">🎨 Creative Challenges</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {getPresetDescription(settings.challengeTypePreset)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Analysis Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'skipObviousQuestions', label: 'Skip Obvious Questions', desc: 'Avoid asking basic questions for simple challenges' },
                        { key: 'includeVerificationOptimization', label: 'Verification Analysis', desc: 'Analyze and suggest optimal verification methods' },
                        { key: 'includeRiskAnalysis', label: 'Risk Assessment', desc: 'Identify potential gaming risks and security concerns' },
                        { key: 'includeDesignRecommendations', label: 'Design Suggestions', desc: 'Provide recommendations for challenge improvement' }
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <Switch
                            id={key}
                            checked={settings[key as keyof AnalyzerSettings] as boolean}
                            onCheckedChange={(checked) => handleSwitchChange(key as keyof AnalyzerSettings, checked)}
                            className="mt-1"
                          />
                          <div className="space-y-1">
                            <Label htmlFor={key} className="font-medium cursor-pointer">
                              {label}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Advanced Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">Confidence Threshold</Label>
                          <Badge variant="outline">{settings.confidenceThreshold}%</Badge>
                        </div>
                        <Slider
                          value={[settings.confidenceThreshold]}
                          onValueChange={(value) => handleSliderChange('confidenceThreshold', value)}
                          min={50}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="font-medium">Response Format</Label>
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

                    <div className="space-y-3">
                      <Label className="font-medium">Custom Prompt Additions</Label>
                      <Textarea
                        value={settings.customPromptAdditions}
                        onChange={(e) => setSettings(prev => ({ ...prev, customPromptAdditions: e.target.value }))}
                        placeholder="Add custom instructions to the analyzer prompt..."
                        className="min-h-20"
                      />
                      <p className="text-xs text-muted-foreground">
                        These instructions will be added to the analyzer prompt for specialized behavior
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => runAnalyzerTest(mockChallenges.handstand)} disabled={isTesting}>
                    <TestTube className="h-4 w-4 mr-2" />
                    Quick Test
                  </Button>
                  
                  <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Defaults
                  </Button>
                  
                  <Button variant="default" onClick={applyGlobalSettings}>
                    <Save className="h-4 w-4 mr-2" />
                    Apply Globally
                  </Button>
                  
                  {currentChallenge && (
                    <Button variant="outline" onClick={() => onTestAnalyzer(currentChallenge)} disabled={isTesting}>
                      Test Current Challenge
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Testing Panel */}
          <div className="space-y-6">
            <TestingPanel 
              mockChallenges={mockChallenges}
              selectedVerificationType={selectedVerificationType}
              setSelectedVerificationType={setSelectedVerificationType}
              cameraOnlyOverride={cameraOnlyOverride}
              setCameraOnlyOverride={setCameraOnlyOverride}
              runAnalyzerTest={runAnalyzerTest}
              testResults={testResults}
              isTesting={isTesting}
              selectedMockChallenge={selectedMockChallenge}
            />
          </div>
        </div>
      )}
    </div>
  )

  function getPresetDescription(preset: string) {
    const descriptions = {
      auto: 'Automatically detect challenge type and apply appropriate analysis',
      physical_skills: 'Optimized for technique-based activities like handstands, gymnastics',
      habits: 'Focused on daily habits like brushing teeth, journaling, meditation',
      learning: 'Tailored for skill learning like guitar, languages, reading',
      fitness_tracking: 'Designed for measurable fitness activities like running, steps',
      creative: 'Specialized for creative challenges like art, writing, music'
    }
    return descriptions[preset as keyof typeof descriptions] || ''
  }
}

// Separate Testing Panel Component
function TestingPanel({ 
  mockChallenges, 
  selectedVerificationType, 
  setSelectedVerificationType,
  cameraOnlyOverride, 
  setCameraOnlyOverride,
  runAnalyzerTest, 
  testResults, 
  isTesting, 
  selectedMockChallenge 
}: any) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Live Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Verification Override */}
          <div className="space-y-3">
            <Label className="font-medium">Verification Override</Label>
            <Select
              value={selectedVerificationType[0] || 'video'}
              onValueChange={(value) => {
                if (value === 'mixed') {
                  setSelectedVerificationType(['photo', 'text'])
                } else {
                  setSelectedVerificationType([value])
                  if (value === 'text' || value === 'auto_sync') {
                    setCameraOnlyOverride(null)
                  }
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">📹 Video Proof</SelectItem>
                <SelectItem value="photo">📸 Photo Proof</SelectItem>
                <SelectItem value="text">📝 Text Proof</SelectItem>
                <SelectItem value="auto_sync">⚡ Auto Sync</SelectItem>
                <SelectItem value="mixed">📋 Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Camera Only Controls */}
          {(['photo', 'video'].some(type => selectedVerificationType.includes(type)) || selectedVerificationType.includes('mixed')) && (
            <div className="space-y-3">
              <Label className="font-medium">Camera Security</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: true, label: 'Camera Only' },
                  { value: false, label: 'Gallery OK' },
                  { value: null, label: 'Default' }
                ].map(({ value, label }) => (
                  <Button
                    key={String(value)}
                    variant={cameraOnlyOverride === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCameraOnlyOverride(value)}
                    className="text-xs"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Sample Challenges */}
          <div className="space-y-3">
            <Label className="font-medium">Sample Challenges</Label>
            <div className="space-y-2">
              {Object.entries(mockChallenges).map(([key, challenge]: [string, any]) => (
                <Button
                  key={key}
                  onClick={() => runAnalyzerTest(challenge)}
                  disabled={isTesting}
                  variant={selectedMockChallenge === challenge.title ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto p-3"
                >
                  <div>
                    <div className="font-medium text-sm">{challenge.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {challenge.category} • {challenge.difficulty}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="min-h-[300px]">
            {isTesting && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Analyzing...</p>
                </div>
              </div>
            )}
            
            {testResults && !isTesting && (
              <div className="space-y-4">
                {testResults.error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{testResults.error}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg text-sm">
                      <div className="font-medium">Configuration:</div>
                      <div>Proof: {selectedVerificationType.join(' + ')}</div>
                      {(['photo', 'video'].some(type => selectedVerificationType.includes(type)) || selectedVerificationType.includes('mixed')) && (
                        <div>Security: {cameraOnlyOverride !== null ? (cameraOnlyOverride ? 'Camera Only' : 'Gallery Allowed') : 'Default'}</div>
                      )}
                    </div>
                    
                    <div>
                      <Label className="font-medium">Daily Requirement:</Label>
                      <p className="text-sm mt-1">{testResults.dailyRequirement}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="font-medium">Confidence:</Label>
                      <Badge variant={testResults.confidence >= 80 ? "default" : "secondary"}>
                        {testResults.confidence}%
                      </Badge>
                    </div>
                    
                    {testResults.potentialAmbiguities && testResults.potentialAmbiguities.length > 0 && (
                      <div>
                        <Label className="font-medium">Issues Found:</Label>
                        <ul className="text-sm space-y-1 mt-1">
                          {testResults.potentialAmbiguities.map((amb: string, idx: number) => (
                            <li key={idx} className="text-yellow-600">• {amb}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {testResults.clarificationQuestions && testResults.clarificationQuestions.length > 0 && (
                      <div>
                        <Label className="font-medium">Questions:</Label>
                        <ul className="text-sm space-y-1 mt-1">
                          {testResults.clarificationQuestions.map((question: string, idx: number) => (
                            <li key={idx} className="text-blue-600">• {question}</li>
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
                <p className="text-sm">Select a challenge to test your settings</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

