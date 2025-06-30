"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Shield, 
  Clock, 
  Users, 
  Star, 
  AlertTriangle, 
  CheckCircle,
  Trophy,
  Target,
  MessageSquare
} from "lucide-react"

interface HostingQualityGatesProps {
  userTrustScore: number
  accountAge: number // days
  activeChallengesCount: number
  isPremium: boolean
  challengeData: {
    description: string
    dailyInstructions: string
    category: string
  }
}

export function HostingQualityGates({ 
  userTrustScore, 
  accountAge, 
  activeChallengesCount, 
  isPremium,
  challengeData 
}: HostingQualityGatesProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  // Quality gate checks
  const trustScorePass = userTrustScore >= 25
  const accountAgePass = accountAge >= 7
  const concurrentLimitPass = activeChallengesCount < (isPremium ? 3 : 1)
  const descriptionPass = challengeData.description.length >= 50
  const instructionsPass = challengeData.dailyInstructions.length >= 20
  
  const allGatesPassed = trustScorePass && accountAgePass && concurrentLimitPass && 
                        descriptionPass && instructionsPass
  
  const passedGates = [trustScorePass, accountAgePass, concurrentLimitPass, 
                      descriptionPass, instructionsPass].filter(Boolean).length
  const totalGates = 5
  const completionPercentage = (passedGates / totalGates) * 100

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <Shield className="w-5 h-5" />
          Hosting Quality Gates
          <Badge variant={allGatesPassed ? "default" : "secondary"} className="ml-auto">
            {passedGates}/{totalGates} Passed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Hosting Readiness</span>
            <span className="font-medium">{Math.round(completionPercentage)}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Quality Gates */}
        <div className="space-y-3">
          {/* Trust Score Gate */}
          <div className="flex items-center gap-3">
            {trustScorePass ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Trust Score</span>
                <Badge variant={trustScorePass ? "default" : "destructive"} className="text-xs">
                  {userTrustScore}/25 required
                </Badge>
              </div>
              {!trustScorePass && (
                <p className="text-xs text-muted-foreground mt-1">
                  Complete challenges to build trust before hosting
                </p>
              )}
            </div>
          </div>

          {/* Account Age Gate */}
          <div className="flex items-center gap-3">
            {accountAgePass ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Account Age</span>
                <Badge variant={accountAgePass ? "default" : "destructive"} className="text-xs">
                  {accountAge}/7 days
                </Badge>
              </div>
              {!accountAgePass && (
                <p className="text-xs text-muted-foreground mt-1">
                  New accounts must wait {7 - accountAge} more days to host
                </p>
              )}
            </div>
          </div>

          {/* Concurrent Challenges Gate */}
          <div className="flex items-center gap-3">
            {concurrentLimitPass ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Active Challenges</span>
                <Badge variant={concurrentLimitPass ? "default" : "destructive"} className="text-xs">
                  {activeChallengesCount}/{isPremium ? 3 : 1} limit
                </Badge>
              </div>
              {!concurrentLimitPass && (
                <p className="text-xs text-muted-foreground mt-1">
                  {isPremium ? 
                    "Premium users can host up to 3 challenges" : 
                    "Upgrade to Premium for more concurrent challenges"
                  }
                </p>
              )}
            </div>
          </div>

          {/* Description Quality Gate */}
          <div className="flex items-center gap-3">
            {descriptionPass ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Description Quality</span>
                <Badge variant={descriptionPass ? "default" : "destructive"} className="text-xs">
                  {challengeData.description.length}/50 chars
                </Badge>
              </div>
              {!descriptionPass && (
                <p className="text-xs text-muted-foreground mt-1">
                  Add {50 - challengeData.description.length} more characters for clarity
                </p>
              )}
            </div>
          </div>

          {/* Instructions Quality Gate */}
          <div className="flex items-center gap-3">
            {instructionsPass ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Daily Instructions</span>
                <Badge variant={instructionsPass ? "default" : "destructive"} className="text-xs">
                  {challengeData.dailyInstructions.length}/20 chars
                </Badge>
              </div>
              {!instructionsPass && (
                <p className="text-xs text-muted-foreground mt-1">
                  Add {20 - challengeData.dailyInstructions.length} more characters for clarity
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Overall Status */}
        {allGatesPassed ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-700">
              <strong>Ready to Host!</strong> Your challenge meets all quality standards and will be published immediately.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-orange-700">
              <strong>Quality Gates Required:</strong> Complete {totalGates - passedGates} more requirement{totalGates - passedGates !== 1 ? 's' : ''} before hosting.
            </AlertDescription>
          </Alert>
        )}

        {/* Host Benefits Preview */}
        {showDetails && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-blue-700">
                <Trophy className="w-4 h-4" />
                <span className="font-medium">Hosting Benefits</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-600" />
                    <span>2x XP Multiplier</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3 text-green-600" />
                    <span>+5 Trust per Success</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-600" />
                    <span>30% Revenue Share</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-purple-600" />
                    <span>Host Badges & Recognition</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Button 
          variant="outline" 
          className="w-full text-sm" 
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide' : 'Show'} Hosting Benefits
        </Button>
      </CardContent>
    </Card>
  )
}
