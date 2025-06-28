"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Zap, DollarSign, TrendingUp, Shield, AlertTriangle } from "lucide-react"

interface Challenge {
  minStake: number
  maxStake: number
  isJoined: boolean
  totalPot: number
  participants: number
  completionRate: number
}

interface ChallengeStakeSectionProps {
  challenge: Challenge
}

export function ChallengeStakeSection({ challenge }: ChallengeStakeSectionProps) {
  const [stakeAmount, setStakeAmount] = useState(challenge.minStake)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const potentialWinnings = Math.round(
    (stakeAmount * challenge.participants * (1 - challenge.completionRate / 100)) /
      ((challenge.participants * challenge.completionRate) / 100) +
      stakeAmount,
  )

  if (challenge.isJoined) {
    return (
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-success flex items-center gap-2">
            <Shield className="w-5 h-5" />
            You're In!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
            <p className="text-sm text-success font-medium">Challenge starts in 2 days</p>
            <p className="text-xs text-muted-foreground mt-1">You'll receive daily reminders</p>
          </div>

          <Button className="w-full bg-transparent" variant="outline">
            View My Progress
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (showConfirmation) {
    return (
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Confirm Your Commitment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm">Your stake:</span>
              <span className="font-bold">${stakeAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Potential winnings:</span>
              <span className="font-bold text-success">${potentialWinnings}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Total commitment:</span>
              <span className="font-bold text-primary">${stakeAmount}</span>
            </div>
          </div>

          <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-xs text-destructive">
                By joining, you commit to completing all requirements. Failure to complete will result in losing your
                stake.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full font-bold"
              onClick={() => {
                // Handle join logic
                console.log("Joining challenge with stake:", stakeAmount)
              }}
            >
              <Zap className="w-4 h-4 mr-2" />
              COMMIT ${stakeAmount} & JOIN
            </Button>
            <Button variant="ghost" className="w-full text-sm" onClick={() => setShowConfirmation(false)}>
              Back to adjust stake
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Stake & Join
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stake Amount Selector */}
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Your stake amount</p>
            <div className="text-4xl font-bold text-primary">${stakeAmount}</div>
            <p className="text-xs text-muted-foreground">
              Range: ${challenge.minStake} - ${challenge.maxStake}
            </p>
          </div>

          <input
            type="range"
            min={challenge.minStake}
            max={challenge.maxStake}
            value={stakeAmount}
            onChange={(e) => setStakeAmount(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #F46036 0%, #F46036 ${((stakeAmount - challenge.minStake) / (challenge.maxStake - challenge.minStake)) * 100}%, #e5e5e5 ${((stakeAmount - challenge.minStake) / (challenge.maxStake - challenge.minStake)) * 100}%, #e5e5e5 100%)`,
            }}
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${challenge.minStake}</span>
            <span>${challenge.maxStake}</span>
          </div>
        </div>

        {/* Potential Winnings */}
        <div className="p-4 bg-success/10 rounded-lg border border-success/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-success">Potential Winnings</span>
          </div>
          <div className="text-2xl font-bold text-success">${potentialWinnings}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Based on {challenge.completionRate}% historical success rate
          </p>
        </div>

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
        </div>

        {/* Join Button */}
        <Button className="w-full font-bold text-lg py-6" onClick={() => setShowConfirmation(true)}>
          <DollarSign className="w-5 h-5 mr-2" />
          STAKE ${stakeAmount} & JOIN
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Challenge starts in 2 days. You can withdraw before it begins.
        </p>
      </CardContent>
    </Card>
  )
}
