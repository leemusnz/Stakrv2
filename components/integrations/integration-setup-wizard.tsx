"use client"

import { useState } from "react"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Watch, 
  Smartphone, 
  Activity, 
  CheckCircle2, 
  ArrowRight,
  ArrowLeft,
  Zap,
  Shield,
  Target,
  Users
} from "lucide-react"

interface IntegrationSetupWizardProps {
  onComplete?: () => void
  onSkip?: () => void
  showSkip?: boolean
}

const INTEGRATION_CATEGORIES = [
  {
    id: "fitness",
    title: "Fitness & Health",
    description: "Connect your wearables and fitness apps",
    icon: Activity,
    color: "bg-green-500",
    devices: [
      { name: "Apple Watch", icon: Watch, connected: false, popular: true },
      { name: "Fitbit", icon: Watch, connected: false, popular: true },
      { name: "Garmin", icon: Watch, connected: false, popular: false },
      { name: "MyFitnessPal", icon: Smartphone, connected: false, popular: true },
      { name: "Strava", icon: Smartphone, connected: false, popular: true },
    ]
  },
  {
    id: "learning",
    title: "Learning & Productivity",
    description: "Track progress from educational apps",
    icon: Target,
    color: "bg-blue-500",
    devices: [
      { name: "Duolingo", icon: Smartphone, connected: false, popular: true },
      { name: "Coursera", icon: Smartphone, connected: false, popular: false },
      { name: "Khan Academy", icon: Smartphone, connected: false, popular: false },
      { name: "Notion", icon: Smartphone, connected: false, popular: true },
      { name: "Todoist", icon: Smartphone, connected: false, popular: false },
    ]
  },
  {
    id: "wellness",
    title: "Wellness & Lifestyle",
    description: "Mental health and lifestyle tracking",
    icon: Shield,
    color: "bg-purple-500",
    devices: [
      { name: "Headspace", icon: Smartphone, connected: false, popular: true },
      { name: "Calm", icon: Smartphone, connected: false, popular: true },
      { name: "Sleep Cycle", icon: Smartphone, connected: false, popular: false },
      { name: "Forest", icon: Smartphone, connected: false, popular: false },
    ]
  }
]

export function IntegrationSetupWizard({ 
  onComplete,
  onSkip,
  showSkip = true 
}: IntegrationSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [connectedDevices, setConnectedDevices] = useState<string[]>([])
  const { isMobile } = useEnhancedMobile()

  const steps = [
    "Choose Category",
    "Connect Devices", 
    "Verification Setup",
    "Complete"
  ]

  const progress = ((currentStep + 1) / steps.length) * 100

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setCurrentStep(1)
  }

  const handleDeviceConnect = (deviceName: string) => {
    setConnectedDevices(prev => 
      prev.includes(deviceName) 
        ? prev.filter(d => d !== deviceName)
        : [...prev, deviceName]
    )
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    onComplete?.()
  }

  const selectedCategoryData = INTEGRATION_CATEGORIES.find(cat => cat.id === selectedCategory)

  return (
    <div
      className="max-w-2xl mx-auto flex flex-col"
      style={{
        paddingBottom: "calc(var(--bottom-nav-safe-space, 0px) + var(--bottom-cta-height, 72px))",
        ['--bottom-cta-height' as any]: '72px',
      }}
    >
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Connect Your Apps & Devices</h2>
          {showSkip && (
            <Button variant="ghost" onClick={onSkip}>
              Skip for now
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Step {currentStep + 1} of {steps.length}</span>
            <span className="font-medium">{steps[currentStep]}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {/* Step 0: Choose Category */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">What type of challenges interest you most?</h3>
              <p className="text-muted-foreground">
                We'll help you connect the right apps and devices for automatic verification.
              </p>
            </div>

            <div className="grid gap-4">
              {INTEGRATION_CATEGORIES.map((category) => {
                const Icon = category.icon
                return (
                  <Card 
                    key={category.id}
                    className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${category.color} text-white`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{category.title}</CardTitle>
                          <CardDescription>{category.description}</CardDescription>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex gap-2">
                        {category.devices.filter(d => d.popular).slice(0, 3).map((device) => (
                          <Badge key={device.name} variant="secondary" className="text-xs">
                            {device.name}
                          </Badge>
                        ))}
                        {category.devices.filter(d => d.popular).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{category.devices.filter(d => d.popular).length - 3} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 1: Connect Devices */}
        {currentStep === 1 && selectedCategoryData && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Connect Your {selectedCategoryData.title} Apps</h3>
              <p className="text-muted-foreground">
                Choose which apps and devices you'd like to connect for automatic challenge verification.
              </p>
            </div>

            <div className="grid gap-4">
              {selectedCategoryData.devices.map((device) => {
                const Icon = device.icon
                const isConnected = connectedDevices.includes(device.name)
                
                return (
                  <Card 
                    key={device.name}
                    className={`cursor-pointer transition-all ${
                      isConnected 
                        ? 'ring-2 ring-green-500 bg-green-50 border-green-200' 
                        : 'hover:shadow-md hover:border-primary/50'
                    }`}
                    onClick={() => handleDeviceConnect(device.name)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            isConnected ? 'bg-green-500 text-white' : 'bg-muted'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{device.name}</span>
                              {device.popular && (
                                <Badge variant="secondary" className="text-xs">
                                  Popular
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {isConnected ? 'Connected' : 'Tap to connect'}
                            </p>
                          </div>
                        </div>
                        {isConnected && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div
              className="flex items-center justify-between bg-background/95 backdrop-blur border-t px-4 py-4"
              style={{
                position: isMobile ? 'fixed' : 'static',
                left: isMobile ? 0 : undefined,
                right: isMobile ? 0 : undefined,
                bottom: 'var(--bottom-nav-safe-space, 0px)',
                zIndex: 60,
              }}
            >
              <Button variant="outline" onClick={handleBack} className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleNext}
                disabled={connectedDevices.length === 0}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Verification Setup */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Verification Settings</h3>
              <p className="text-muted-foreground">
                Configure how your connected apps will verify challenge completion.
              </p>
            </div>

            <div className="space-y-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg text-white">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Automatic Verification</CardTitle>
                      <CardDescription>
                        Your connected apps will automatically verify challenge completion
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      No manual proof submission needed
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Real-time progress tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Prevents cheating and fraud
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Connected Apps ({connectedDevices.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {connectedDevices.map((deviceName) => (
                      <div key={deviceName} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                        <span className="text-sm font-medium">{deviceName}</span>
                        <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                          Connected
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div
              className="flex items-center justify-between bg-background/95 backdrop-blur border-t px-4 py-4"
              style={{
                position: isMobile ? 'fixed' : 'static',
                left: isMobile ? 0 : undefined,
                right: isMobile ? 0 : undefined,
                bottom: 'var(--bottom-nav-safe-space, 0px)',
                zIndex: 60,
              }}
            >
              <Button variant="outline" onClick={handleBack} className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext}>
                Finish Setup
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {currentStep === 3 && (
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold">All Set!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your apps and devices are now connected. You can start or join challenges that use automatic verification.
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border">
              <h4 className="font-semibold text-lg mb-3">What's Next?</h4>
              <div className="space-y-2 text-sm text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Browse challenges that support automatic verification
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Create your own challenges with smart verification
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Manage your integrations in Settings
                </div>
              </div>
            </div>

            <Button onClick={handleComplete} size="lg" className="w-full">
              Start Using Stakr
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}


