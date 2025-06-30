"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Zap, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  Users, 
  UserPlus, 
  Star,
  CheckCircle,
  Info
} from "lucide-react"
import { useNotifications } from "@/components/notifications/notification-provider"

interface Challenge {
  id: string
  minStake: number
  maxStake: number
  allowPointsOnly?: boolean
  isJoined: boolean
  totalPot: number
  participants: number
  completionRate: number
  hasTeams?: boolean
  isPrivate?: boolean
  status: string
  title: string
}

interface ChallengeStakeSectionProps {
  challenge: Challenge
  canJoin?: boolean
  onJoinSuccess?: (participation: any) => void
}

export function ChallengeStakeSection({ 
  challenge, 
  canJoin = true, 
  onJoinSuccess 
}: ChallengeStakeSectionProps) {
  const { data: session } = useSession()
  const { addNotification } = useNotifications()
  
  const [stakeAmount, setStakeAmount] = useState(Number(challenge.minStake) || 25)
  // Default to points-only if challenge doesn't allow money stakes or min/max stakes are 0
  const [pointsOnly, setPointsOnly] = useState(
    challenge.allowPointsOnly && (
      !challenge.minStake || 
      !challenge.maxStake || 
      (Number(challenge.minStake) === 0 && Number(challenge.maxStake) === 0)
    )
  )
  const [insurancePurchased, setInsurancePurchased] = useState(false)
  const [referralCode, setReferralCode] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const effectiveStake = pointsOnly ? 0 : Number(stakeAmount) || 0
  const entryFee = effectiveStake * 0.05
  const insuranceFee = insurancePurchased ? 1.00 : 0.00
  const totalCost = Number(effectiveStake) + Number(entryFee) + Number(insuranceFee)

  const potentialWinnings = pointsOnly ? 0 : Math.round(
    (effectiveStake * Number(challenge.participants || 0) * (1 - Number(challenge.completionRate || 0) / 100)) /
      ((Number(challenge.participants || 0) * Number(challenge.completionRate || 0)) / 100) +
      effectiveStake,
  ) || 0

  const handleJoinChallenge = async () => {
    if (!session?.user) {
      addNotification({
        type: "system",
        title: "Sign in required",
        message: "Please sign in to join challenges"
      })
      return
    }

    setIsJoining(true)
    setJoinError(null)

    try {
      const joinData = {
        stakeAmount: effectiveStake,
        pointsOnly,
        insurancePurchased,
        referralCode: referralCode.trim() || undefined
      }

      const response = await fetch(`/api/challenges/${challenge.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(joinData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`)
      }

      if (result.success) {
        addNotification({
          type: "challenge",
          title: "Successfully joined!",
          message: challenge.hasTeams ? 
            `Welcome to ${challenge.title}! ${result.challenge_info?.team_assigned ? 'You\'ve been assigned to a team.' : ''}` :
            `Welcome to ${challenge.title}! Get ready to start your journey.`
        })

        onJoinSuccess?.(result.participation)
        setShowConfirmation(false)
      } else {
        throw new Error(result.error || 'Failed to join challenge')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setJoinError(errorMessage)
      
      addNotification({
        type: "system", 
        title: "Failed to join",
        message: errorMessage
      })
    } finally {
      setIsJoining(false)
    }
  }

  // Already joined state
  if (challenge.isJoined) {
    return (
      <Card className="lg:sticky lg:top-6">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-green-600 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            You're In!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <p className="text-sm text-green-700 font-medium">
              {challenge.hasTeams ? 'Ready to compete with your team!' : 'Challenge participation confirmed'}
            </p>
            <p className="text-xs text-green-600 mt-1">You'll receive daily reminders and updates</p>
          </div>

          <Button className="w-full" variant="outline">
            View My Progress
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Cannot join state
  if (!canJoin) {
    return (
      <Card className="lg:sticky lg:top-6 opacity-75">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Cannot Join
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              {challenge.status === 'completed' ? 'This challenge has ended' :
               challenge.status === 'cancelled' ? 'This challenge was cancelled' :
               'This challenge is not accepting participants'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Confirmation modal
  if (showConfirmation) {
    return (
      <Card className="lg:sticky lg:top-6">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Confirm Your Commitment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {joinError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {joinError}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3 p-4 bg-muted rounded-lg">
            {!pointsOnly && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm">Your stake:</span>
                  <span className="font-bold">${effectiveStake}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Entry fee (5%):</span>
                  <span className="text-sm">${entryFee.toFixed(2)}</span>
                </div>
                {insurancePurchased && (
                  <div className="flex justify-between">
                    <span className="text-sm">Insurance:</span>
                    <span className="text-sm">${insuranceFee.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total cost:</span>
                  <span className="font-bold text-primary">${Number(totalCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Potential winnings:</span>
                  <span className="font-bold text-green-600">${potentialWinnings}</span>
                </div>
              </>
            )}
            
            {pointsOnly && (
              <div className="text-center">
                <Star className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                <p className="font-medium">Points-Only Challenge</p>
                <p className="text-sm text-muted-foreground">No money at stake - play for points and achievements!</p>
              </div>
            )}
          </div>

          {challenge.hasTeams && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Team Challenge</p>
                  <p className="text-xs text-blue-600">
                    You'll be automatically assigned to a balanced team to compete together!
                  </p>
                </div>
              </div>
            </div>
          )}

          {!pointsOnly && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-orange-700">
                  By joining, you commit to completing all requirements. Failure to complete will result in losing your
                  stake. {insurancePurchased && 'Insurance will protect you from one missed day.'}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Button
              className="w-full font-bold"
              onClick={handleJoinChallenge}
              disabled={isJoining}
            >
              {isJoining ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  {pointsOnly ? 'JOIN FOR POINTS!' : `COMMIT $${Number(totalCost).toFixed(2)} & JOIN`}
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              className="w-full text-sm" 
              onClick={() => setShowConfirmation(false)}
              disabled={isJoining}
            >
              Back to adjust settings
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Main join interface
  return (
    <Card className="lg:sticky lg:top-6">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          {challenge.hasTeams ? 'Join Team Challenge' : 'Stake & Join'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Points vs Money Toggle - Only show if challenge supports both modes */}
        {challenge.allowPointsOnly && challenge.minStake > 0 && challenge.maxStake > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Challenge Type</Label>
                <p className="text-xs text-muted-foreground">
                  {pointsOnly ? 'Play for points and achievements' : 'Stake money for real rewards'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Money</span>
                <Switch
                  checked={pointsOnly}
                  onCheckedChange={setPointsOnly}
                />
                <span className="text-sm">Points</span>
              </div>
            </div>
            <Separator />
          </div>
        )}

        {/* Points-Only Challenge Info - Show if challenge is forced points-only */}
        {challenge.allowPointsOnly && (!challenge.minStake || !challenge.maxStake || 
          (Number(challenge.minStake) === 0 && Number(challenge.maxStake) === 0)) && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700">Points-Only Challenge</span>
            </div>
            <p className="text-sm text-yellow-700">This challenge is for points and achievements only!</p>
            <p className="text-xs text-yellow-600 mt-1">
              No money required - focus on building the habit and having fun
            </p>
          </div>
        )}

        {/* Stake Amount Selector (if not points-only) */}
        {!pointsOnly && challenge.minStake && challenge.maxStake && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Your stake amount</p>
              <div className="text-4xl font-bold text-primary">${Number(stakeAmount) || 0}</div>
              <p className="text-xs text-muted-foreground">
                Range: ${Number(challenge.minStake) || 0} - ${Number(challenge.maxStake) || 0}
              </p>
            </div>

            <input
              type="range"
              min={Number(challenge.minStake) || 0}
              max={Number(challenge.maxStake) || 100}
              value={Number(stakeAmount) || 0}
              onChange={(e) => setStakeAmount(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #F46036 0%, #F46036 ${((Number(stakeAmount) - Number(challenge.minStake)) / (Number(challenge.maxStake) - Number(challenge.minStake))) * 100}%, #e5e5e5 ${((Number(stakeAmount) - Number(challenge.minStake)) / (Number(challenge.maxStake) - Number(challenge.minStake))) * 100}%, #e5e5e5 100%)`,
              }}
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>${Number(challenge.minStake) || 0}</span>
              <span>${Number(challenge.maxStake) || 0}</span>
            </div>

            {/* Insurance Option */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Challenge Insurance</Label>
                <p className="text-xs text-muted-foreground">+$1.00 - Protects against one missed day</p>
              </div>
              <Switch
                checked={insurancePurchased}
                onCheckedChange={setInsurancePurchased}
              />
            </div>
          </div>
        )}

        {/* Potential Winnings */}
        {!pointsOnly && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Potential Winnings</span>
            </div>
            <div className="text-2xl font-bold text-green-600">${potentialWinnings}</div>
            <p className="text-xs text-green-600 mt-1">
              Based on {challenge.completionRate}% historical success rate
            </p>
          </div>
        )}

        {/* Points-Only Benefits */}
        {pointsOnly && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700">Points & Achievements</span>
            </div>
            <p className="text-sm text-yellow-700">Earn XP, badges, and climb the leaderboard!</p>
            <p className="text-xs text-yellow-600 mt-1">
              No money at stake - perfect for trying new challenges
            </p>
          </div>
        )}

        {/* Referral Code */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Referral Code (Optional)</Label>
          <Input
            placeholder="Enter friend's email or code"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Get bonus rewards when referred by a friend
          </p>
        </div>

        {/* Team Info */}
        {challenge.hasTeams && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Team Challenge</p>
                <p className="text-xs text-blue-600">
                  You'll be assigned to a balanced team. Work together to maximize everyone's success!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Key Stats */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total pot:</span>
            <span className="font-medium">${challenge.totalPot.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Participants:</span>
            <span className="font-medium">{challenge.participants}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Success rate:</span>
            <Badge variant="secondary" className="text-xs">
              {challenge.completionRate}%
            </Badge>
          </div>
          {!pointsOnly && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total cost:</span>
              <span className="font-medium">${Number(totalCost).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Join Button */}
        <Button 
          className="w-full font-bold text-lg py-6" 
          onClick={() => setShowConfirmation(true)}
          disabled={!session?.user}
        >
          {!session?.user ? (
            <>
              <UserPlus className="w-5 h-5 mr-2" />
              SIGN IN TO JOIN
            </>
          ) : pointsOnly ? (
            <>
              <Star className="w-5 h-5 mr-2" />
              JOIN FOR POINTS!
            </>
          ) : (
            <>
              <DollarSign className="w-5 h-5 mr-2" />
              STAKE ${Number(totalCost).toFixed(2)} & JOIN
            </>
          )}
        </Button>

        {session?.user && (
          <p className="text-xs text-center text-muted-foreground">
            {challenge.status === 'pending' ? 
              'Challenge starts soon. You can withdraw before it begins.' :
              'Ready to start your challenge journey?'
            }
          </p>
        )}
      </CardContent>
    </Card>
  )
}
