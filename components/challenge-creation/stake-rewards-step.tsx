"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  Trophy,
  Users,
  TrendingUp,
  Gift,
  Plus,
  X,
  Calculator,
  Lightbulb,
  AlertCircle,
  Coins,
} from "lucide-react"
import { useState } from "react"

interface StakeRewardsStepProps {
  allowPointsOnly: boolean
  minStake: number
  maxStake: number
  hostContribution: number
  bonusRewards: string[]
  rewardDistribution: string
  onAllowPointsOnlyChange: (allow: boolean) => void
  onMinStakeChange: (amount: number) => void
  onMaxStakeChange: (amount: number) => void
  onHostContributionChange: (amount: number) => void
  onBonusRewardsChange: (rewards: string[]) => void
  onRewardDistributionChange: (distribution: string) => void
}

const getDistributionMethods = (isPointsMode: boolean) => [
  {
    id: "winner-takes-all",
    title: "Winner Takes All",
    description: isPointsMode
      ? "Winners get their points back + bonus from those who failed"
      : "Winners get their money back + bonus from those who failed",
    detailedExample: isPointsMode
      ? "100 people join, each stakes 500 points. 30 succeed, 70 fail. Each winner gets: 500 points (their stake back) + 1,167 points (share of the 35,000 points from failures) = 1,667 points total."
      : "100 people join, each stakes $50. 30 succeed, 70 fail. Each winner gets: $50 (their stake back) + $117 (share of the $3,500 from failures) = $167 total.",
    calculation: isPointsMode
      ? "Your reward = Your stake back + (Failed stakes ÷ Number of winners)"
      : "Your reward = Your stake back + (Failed stakes ÷ Number of winners)",
    icon: Trophy,
    recommended: true,
    pros: ["You always get your stake back", "Biggest bonus rewards", "High motivation to complete"],
    cons: ["Bonus depends on failure rate", "Unpredictable total reward"],
    color: "border-orange-200 bg-orange-50",
  },
  {
    id: "equal-split",
    title: "Equal Split Pool",
    description: isPointsMode
      ? "ALL points (including yours) get pooled and split equally among winners"
      : "ALL money (including yours) gets pooled and split equally among winners",
    detailedExample: isPointsMode
      ? "100 people contribute 50,000 points total. 25 succeed. Each winner gets exactly 2,000 points - regardless of whether they staked 200 or 2,000 points originally."
      : "100 people contribute $5,000 total. 25 succeed. Each winner gets exactly $200 - regardless of whether they staked $20 or $200 originally.",
    calculation: isPointsMode
      ? "Your reward = Total point pool ÷ Number of winners (you might get less than you staked!)"
      : "Your reward = Total money pool ÷ Number of winners (you might get less than you staked!)",
    icon: Users,
    recommended: false,
    pros: ["Completely predictable rewards", "Fair regardless of stake size", "Encourages community spirit"],
    cons: ["You might get less than you put in", "No advantage to staking more", "Lower individual motivation"],
    color: "border-blue-200 bg-blue-50",
  },
  {
    id: "proportional",
    title: "Proportional to Stake",
    description: isPointsMode
      ? "Bigger point stakes get bigger share of the total reward pool"
      : "Bigger stakes get bigger share of the total reward pool",
    detailedExample: isPointsMode
      ? "Total pool: 50,000 points. You staked 1,000 points (2% of total). You get 2% of the reward pool. Someone who staked 500 points gets half your reward."
      : "Total pool: $5,000. You staked $100 (2% of total). You get 2% of the reward pool. Someone who staked $50 gets half your reward.",
    calculation: isPointsMode
      ? "Your reward = (Your stake ÷ Total stakes) × Total reward pool"
      : "Your reward = (Your stake ÷ Total stakes) × Total reward pool",
    icon: TrendingUp,
    recommended: false,
    pros: ["Rewards match your commitment level", "Encourages higher stakes", "Fair risk-reward ratio"],
    cons: ["Complex to calculate", "Favors those who can stake more", "Less community-focused"],
    color: "border-green-200 bg-green-50",
  },
]

const commonBonusRewards = [
  "Digital certificate of completion",
  "Exclusive community access",
  "One-on-one coaching session",
  "Custom workout plan",
  "Meal planning guide",
  "Progress tracking template",
  "Motivational video message",
]

export function StakeRewardsStep({
  allowPointsOnly,
  minStake,
  maxStake,
  hostContribution,
  bonusRewards,
  rewardDistribution,
  onAllowPointsOnlyChange,
  onMinStakeChange,
  onMaxStakeChange,
  onHostContributionChange,
  onBonusRewardsChange,
  onRewardDistributionChange,
}: StakeRewardsStepProps) {
  const [newBonusReward, setNewBonusReward] = useState("")

  const addBonusReward = (reward: string) => {
    if (reward && !bonusRewards.includes(reward) && bonusRewards.length < 5) {
      onBonusRewardsChange([...bonusRewards, reward])
      setNewBonusReward("")
    }
  }

  const removeBonusReward = (rewardToRemove: string) => {
    onBonusRewardsChange(bonusRewards.filter((reward) => reward !== rewardToRemove))
  }

  // Calculate potential rewards with more realistic numbers
  const estimatedParticipants = 50
  const avgStake = (minStake + maxStake) / 2
  const totalPot = estimatedParticipants * avgStake + hostContribution
  const successRate = 0.4 // 40% success rate (more realistic)
  const estimatedWinners = Math.ceil(estimatedParticipants * successRate)
  const estimatedLosers = estimatedParticipants - estimatedWinners

  const calculateRewardPerWinner = () => {
    switch (rewardDistribution) {
      case "winner-takes-all":
        const failedStakes = estimatedLosers * avgStake
        return estimatedWinners > 0 ? avgStake + failedStakes / estimatedWinners : avgStake
      case "equal-split":
        return estimatedWinners > 0 ? totalPot / estimatedWinners : 0
      case "proportional":
        return avgStake * 1.5 // Simplified calculation for display
      default:
        return 0
    }
  }

  const rewardPerWinner = calculateRewardPerWinner()

  // Get currency symbol and unit
  const currencySymbol = allowPointsOnly ? "" : "$"
  const currencyUnit = allowPointsOnly ? " points" : ""
  const CurrencyIcon = allowPointsOnly ? Coins : DollarSign

  // Get distribution methods with appropriate text
  const distributionMethods = getDistributionMethods(allowPointsOnly)

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">
          Set {allowPointsOnly ? "points" : "stakes"} and rewards
        </h2>
        <p className="text-muted-foreground">
          Configure how participants {allowPointsOnly ? "stake points" : "stake money"} and how rewards are distributed
          to successful completers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Points Only Option */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary" />
                    Points-Only Challenge
                  </CardTitle>
                  <CardDescription>
                    Allow participants to join with points instead of money (great for beginners)
                  </CardDescription>
                </div>
                <Switch checked={allowPointsOnly} onCheckedChange={onAllowPointsOnlyChange} />
              </div>
            </CardHeader>
            {allowPointsOnly && (
              <CardContent className="pt-0">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <p className="text-sm text-primary font-medium">
                    ✨ Beginner-friendly option enabled! Participants can join with points they earn from completing
                    other challenges instead of real money.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Stake Range */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <CurrencyIcon className="w-4 h-4 text-secondary" />
                {allowPointsOnly ? "Point" : "Stake"} Range *
              </Label>
              <p className="text-xs text-muted-foreground">
                Set the minimum and maximum {allowPointsOnly ? "points" : "amount"} participants can stake on this
                challenge.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-stake" className="text-sm">
                  Minimum {allowPointsOnly ? "Points" : "Stake"}
                </Label>
                <div className="relative">
                  <CurrencyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="min-stake"
                    type="number"
                    min={allowPointsOnly ? "50" : "5"}
                    max={allowPointsOnly ? "10000" : "1000"}
                    value={minStake}
                    onChange={(e) => onMinStakeChange(Number.parseInt(e.target.value) || (allowPointsOnly ? 50 : 5))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-stake" className="text-sm">
                  Maximum {allowPointsOnly ? "Points" : "Stake"}
                </Label>
                <div className="relative">
                  <CurrencyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="max-stake"
                    type="number"
                    min={minStake}
                    max={allowPointsOnly ? "50000" : "5000"}
                    value={maxStake}
                    onChange={(e) => onMaxStakeChange(Number.parseInt(e.target.value) || (allowPointsOnly ? 500 : 100))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {allowPointsOnly ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onMinStakeChange(250)
                      onMaxStakeChange(1000)
                    }}
                  >
                    250-1,000 pts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onMinStakeChange(500)
                      onMaxStakeChange(2000)
                    }}
                  >
                    500-2,000 pts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onMinStakeChange(1000)
                      onMaxStakeChange(5000)
                    }}
                  >
                    1,000-5,000 pts
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onMinStakeChange(25)
                      onMaxStakeChange(100)
                    }}
                  >
                    $25-$100
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onMinStakeChange(50)
                      onMaxStakeChange(200)
                    }}
                  >
                    $50-$200
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onMinStakeChange(100)
                      onMaxStakeChange(500)
                    }}
                  >
                    $100-$500
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Host Contribution */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Host Contribution (Optional)</Label>
              <p className="text-xs text-muted-foreground">
                Add your own {allowPointsOnly ? "points" : "money"} to the reward {allowPointsOnly ? "pool" : "pot"} to
                incentivize participation.
              </p>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <CurrencyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  max={allowPointsOnly ? "10000" : "1000"}
                  value={hostContribution}
                  onChange={(e) => onHostContributionChange(Number.parseInt(e.target.value) || 0)}
                  className="pl-10"
                  placeholder="0"
                />
              </div>

              {hostContribution > 0 && (
                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3">
                  <p className="text-sm text-secondary font-medium">
                    🎉 Great! Your {currencySymbol}
                    {hostContribution}
                    {currencyUnit} contribution will make the challenge more attractive to participants.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Reward Distribution */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">How should rewards be distributed? *</Label>
              <p className="text-xs text-muted-foreground">
                Choose how the {allowPointsOnly ? "point pool" : "stake money"} will be split among successful
                participants. Each method works differently:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {distributionMethods.map((method) => {
                const Icon = method.icon
                const isSelected = rewardDistribution === method.id

                return (
                  <Card
                    key={method.id}
                    className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                      isSelected ? `ring-2 ring-primary ${method.color}` : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => onRewardDistributionChange(method.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg flex-shrink-0 ${isSelected ? "bg-primary text-white" : "bg-muted"}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-base">{method.title}</CardTitle>
                            {method.recommended && (
                              <Badge variant="secondary" className="text-xs">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm mb-3">{method.description}</CardDescription>

                          <div className="bg-white/80 rounded-lg p-3 mb-3 border">
                            <p className="text-sm font-medium text-gray-900 mb-2">Real Example:</p>
                            <p className="text-sm text-gray-700 mb-2">{method.detailedExample}</p>
                            <p className="text-xs font-medium text-primary">{method.calculation}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="font-medium text-green-700 mb-1">✓ Pros:</p>
                              <ul className="space-y-1">
                                {method.pros.map((pro, i) => (
                                  <li key={i} className="text-green-600 text-xs">
                                    • {pro}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="font-medium text-orange-700 mb-1">⚠ Cons:</p>
                              <ul className="space-y-1">
                                {method.cons.map((con, i) => (
                                  <li key={i} className="text-orange-600 text-xs">
                                    • {con}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Bonus Rewards */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Bonus Rewards (Optional)</Label>
              <p className="text-xs text-muted-foreground">
                Offer additional non-monetary rewards to make your challenge more appealing.
              </p>
            </div>

            {/* Add New Bonus Reward */}
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Digital certificate, Coaching session..."
                value={newBonusReward}
                onChange={(e) => setNewBonusReward(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addBonusReward(newBonusReward)}
                disabled={!newBonusReward || bonusRewards.length >= 5}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Current Bonus Rewards */}
            {bonusRewards.length > 0 && (
              <div className="space-y-2">
                {bonusRewards.map((reward, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">{reward}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBonusReward(reward)}
                      className="h-6 w-6 p-0 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Common Bonus Rewards */}
            {bonusRewards.length < 5 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Popular bonus rewards:</p>
                <div className="grid grid-cols-1 gap-2">
                  {commonBonusRewards
                    .filter((reward) => !bonusRewards.includes(reward))
                    .slice(0, 3)
                    .map((reward) => (
                      <Button
                        key={reward}
                        variant="outline"
                        size="sm"
                        className="justify-start h-auto p-2 text-xs text-left bg-transparent"
                        onClick={() => addBonusReward(reward)}
                      >
                        <Plus className="w-3 h-3 mr-2 flex-shrink-0" />
                        {reward}
                      </Button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Reward Calculator */}
          <Card className="bg-secondary/5 border-secondary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-secondary">
                <Calculator className="w-4 h-4" />
                Reward Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. participants:</span>
                  <span className="font-medium">{estimatedParticipants}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg {allowPointsOnly ? "points" : "stake"} each:</span>
                  <span className="font-medium">
                    {currencySymbol}
                    {avgStake}
                    {currencyUnit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your contribution:</span>
                  <span className="font-medium">
                    {currencySymbol}
                    {hostContribution}
                    {currencyUnit}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-muted-foreground">Total {allowPointsOnly ? "pool" : "pot"}:</span>
                  <span className="font-bold text-secondary">
                    {currencySymbol}
                    {totalPot}
                    {currencyUnit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. winners:</span>
                  <span className="font-medium">{estimatedWinners}</span>
                </div>
                <div className="bg-primary/10 border border-primary/20 rounded p-2 flex justify-between">
                  <span className="text-primary font-medium">Reward per winner:</span>
                  <span className="font-bold text-primary">
                    {currencySymbol}
                    {Math.round(rewardPerWinner)}
                    {currencyUnit}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">*Based on 40% completion rate estimate</p>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-primary">
                <Lightbulb className="w-4 h-4" />
                {allowPointsOnly ? "Points" : "Stake"} Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium mb-1">Sweet Spot {allowPointsOnly ? "Points" : "Stakes"}:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {allowPointsOnly ? (
                    <>
                      <li>• 250-1,000 pts for habit challenges</li>
                      <li>• 500-2,000 pts for fitness goals</li>
                      <li>• 1,000+ pts for major commitments</li>
                    </>
                  ) : (
                    <>
                      <li>• $25-$100 for habit challenges</li>
                      <li>• $50-$200 for fitness goals</li>
                      <li>• $100+ for major commitments</li>
                    </>
                  )}
                </ul>
              </div>

              <div>
                <p className="font-medium mb-1">Distribution Guide:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>
                    • <strong>Winner Takes All:</strong> Best for motivation
                  </li>
                  <li>
                    • <strong>Equal Split:</strong> Most fair and predictable
                  </li>
                  <li>
                    • <strong>Proportional:</strong> Rewards bigger commitments
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-medium mb-1">Host Contributions:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• 10-20% of expected {allowPointsOnly ? "pool" : "pot"}</li>
                  <li>• Shows you believe in the challenge</li>
                  <li>• Attracts more participants</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {allowPointsOnly && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                  <Gift className="w-4 h-4" />
                  Points Mode Active
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-green-700">
                  Participants use points instead of real money. Perfect for building community and helping newcomers
                  get started without financial risk!
                </p>
              </CardContent>
            </Card>
          )}

          {!allowPointsOnly && minStake < 25 && (
            <Card className="bg-orange-50 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  Low Stakes Warning
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-orange-700">
                  Stakes under $25 may not provide enough motivation. Consider increasing for better completion rates.
                </p>
              </CardContent>
            </Card>
          )}

          {allowPointsOnly && minStake < 250 && (
            <Card className="bg-orange-50 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  Low Points Warning
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-orange-700">
                  Point stakes under 250 may not provide enough motivation. Consider increasing for better engagement.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
