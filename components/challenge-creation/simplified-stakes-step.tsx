"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DollarSign, Gift, Info, X, Plus } from "lucide-react"
import { useState } from "react"

interface SimplifiedStakesStepProps {
  allowPointsOnly: boolean
  // New fields
  // If stakeTiers provided, enforce fixed tiers and hide custom inputs
  stakeTiers?: number[]
  currency?: 'CREDITS' | 'CASH'
  minStake: number
  maxStake: number
  hostContribution: number
  bonusRewards: string[]
  rewardDistribution: string
  onAllowPointsOnlyChange: (allowPoints: boolean) => void
  onMinStakeChange: (amount: number) => void
  onMaxStakeChange: (amount: number) => void
  onHostContributionChange: (amount: number) => void
  onBonusRewardsChange: (rewards: string[]) => void
  onRewardDistributionChange: (distribution: string) => void
  // New callbacks
  onCurrencyChange?: (currency: 'CREDITS' | 'CASH') => void
  onStakeTiersChange?: (tiers: number[]) => void
  isEditing?: boolean
  hasParticipants?: boolean
}

const rewardDistributionOptions = [
  {
    value: "winner-takes-all",
    label: "Winner Takes All",
    description: "One person gets the entire pot - maximum motivation",
  },
  {
    value: "top-3-split",
    label: "Top 3 Split",
    description: "1st: 60%, 2nd: 25%, 3rd: 15% - rewards consistency",
  },
  {
    value: "completion-bonus",
    label: "Completion Bonus",
    description: "Everyone who finishes gets their stake back + bonus",
  },
  {
    value: "equal-split",
    label: "Equal Split",
    description: "All finishers split the pot equally - most collaborative",
  },
]

const bonusRewardSuggestions = [
  "Custom Stakr Badge",
  "Leaderboard Highlight",
  "Social Media Shoutout",
  "Challenge Creator Recognition",
  "Early Access to New Features",
  "Exclusive Community Access",
  "Personal Congratulations Video",
  "Digital Certificate",
]

export function SimplifiedStakesStep({
  allowPointsOnly,
  stakeTiers = [],
  currency = 'CREDITS',
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
  onCurrencyChange,
  onStakeTiersChange,
  isEditing = false,
  hasParticipants = false,
}: SimplifiedStakesStepProps) {
  const [newBonusReward, setNewBonusReward] = useState("")
  const [newTier, setNewTier] = useState<string>("")

  const handleAddBonusReward = (reward: string) => {
    if (reward && !bonusRewards.includes(reward) && bonusRewards.length < 3) {
      onBonusRewardsChange([...bonusRewards, reward])
      setNewBonusReward("")
    }
  }

  const handleRemoveBonusReward = (rewardToRemove: string) => {
    onBonusRewardsChange(bonusRewards.filter((reward) => reward !== rewardToRemove))
  }

  if (allowPointsOnly) {
    return (
      <div className="space-y-8">
        {/* Points-Only Challenge Info */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Gift className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base text-green-800">XP Challenge</CardTitle>
                <CardDescription className="text-sm text-green-600">
                  This challenge is free to join and rewards experience points
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-green-700 mb-2">XP Challenge Rewards:</p>
                  <ul className="text-green-600 space-y-1 text-xs">
                    <li>• Earn XP based on challenge difficulty and duration</li>
                    <li>• Get completion bonuses for challenging goals</li>
                    <li>• Climb the global leaderboards and earn recognition</li>
                    <li>• Unlock badges and achievements for your profile</li>
                    <li>• Build your reputation in the Stakr community</li>
                    <li>• Perfect for habit building without financial pressure</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bonus Rewards for Points Challenges */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Bonus Rewards (Optional)</CardTitle>
            <CardDescription className="text-sm">
              Add extra incentives to make your challenge more appealing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Add Custom Bonus Reward</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Personal congratulations video"
                  value={newBonusReward}
                  onChange={(e) => setNewBonusReward(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddBonusReward(newBonusReward)
                    }
                  }}
                  disabled={bonusRewards.length >= 3}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddBonusReward(newBonusReward)}
                  disabled={!newBonusReward || bonusRewards.length >= 3}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Suggested Bonus Rewards</Label>
              <div className="flex flex-wrap gap-2">
                {bonusRewardSuggestions.map((reward) => (
                  <Button
                    key={reward}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBonusReward(reward)}
                    disabled={bonusRewards.includes(reward) || bonusRewards.length >= 3}
                    className="h-8 text-xs"
                  >
                    {reward}
                  </Button>
                ))}
              </div>
            </div>

            {bonusRewards.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Bonus Rewards ({bonusRewards.length}/3)</Label>
                <div className="flex flex-wrap gap-2">
                  {bonusRewards.map((reward) => (
                    <Badge key={reward} variant="secondary" className="flex items-center gap-1">
                      {reward}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBonusReward(reward)}
                        className="h-4 w-4 p-0 hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Currency & Tier selector (optional) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Staking Mode</CardTitle>
          <CardDescription className="text-sm">Choose currency and optional fixed stake tiers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Currency selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Currency</Label>
            <div className="flex gap-2">
              <Button type="button" variant={currency === 'CREDITS' ? 'default' : 'outline'} size="sm" onClick={() => onCurrencyChange?.('CREDITS')}>
                CREDITS
              </Button>
              <Button type="button" variant={currency === 'CASH' ? 'default' : 'outline'} size="sm" onClick={() => onCurrencyChange?.('CASH')}>
                CASH
              </Button>
            </div>
          </div>

          {/* Fixed stake tiers editor */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Fixed Stake Tiers (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {stakeTiers.length === 0 ? (
                <Badge variant="secondary" className="text-xs">No fixed tiers — using min/max range below</Badge>
              ) : (
                stakeTiers.sort((a,b)=>a-b).map((t) => (
                  <Badge key={t} variant="secondary" className="flex items-center gap-1">
                    ${'{'}t{'}'}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onStakeTiersChange?.(stakeTiers.filter(x => x !== t))}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))
              )}
            </div>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="Add tier (e.g., 5)"
                value={newTier}
                onChange={(e) => setNewTier(e.target.value)}
                className="w-40"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const v = Number(newTier)
                  if (!Number.isFinite(v) || v <= 0) return
                  const next = Array.from(new Set([...(stakeTiers || []), v]))
                  onStakeTiersChange?.(next)
                  setNewTier("")
                }}
                disabled={!newTier}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <div className="flex gap-2">
                {[5,10,20].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onStakeTiersChange?.(Array.from(new Set([...(stakeTiers || []), preset]))) }
                  >
                    ${'{'}preset{'}'}
                  </Button>
                ))}
              </div>
              {stakeTiers.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => onStakeTiersChange?.([])}>Clear</Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">If tiers are set, participants must pick one of them and custom entry is disabled.</p>
          </div>
        </CardContent>
      </Card>
      {/* Stake Amounts */}
      {stakeTiers.length === 0 && (
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Stake Amounts</CardTitle>
              <CardDescription className="text-sm">
                Set the minimum and maximum money participants can stake
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Minimum Stake *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="25"
                  value={minStake}
                  onChange={(e) => onMinStakeChange(Number(e.target.value))}
                  className="pl-10"
                  min="1"
                  max="1000"
                  disabled={isEditing && hasParticipants}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Lower stakes = more participants, higher stakes = more commitment
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Maximum Stake *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="200"
                  value={maxStake}
                  onChange={(e) => onMaxStakeChange(Number(e.target.value))}
                  className="pl-10"
                  min={minStake}
                  max="1000"
                  disabled={isEditing && hasParticipants}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Let participants choose their commitment level within this range
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Host Contribution (Optional)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="0"
                value={hostContribution}
                onChange={(e) => onHostContributionChange(Number(e.target.value))}
                className="pl-10"
                min="0"
                max="500"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Add your own money to the pot to increase rewards and show commitment
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-orange-700 mb-1">
                  Stake Range: ${minStake} - ${maxStake}
                </p>
                <ul className="text-orange-600 space-y-1 text-xs">
                  <li>• Participants choose their stake amount within this range</li>
                  <li>• Higher stakes = higher potential rewards</li>
                  <li>• Total pot = all participant stakes + your contribution (${hostContribution})</li>
                  <li>• <strong>Platform fees: 5% entry fee + 20% of failed stakes</strong></li>
                  <li>• <strong>Winners get:</strong> Their stake back + 80% of failed stakes shared equally</li>
                  <li>• <strong>Example:</strong> 100 people stake $50, 60 complete → Winners get $66.67 each</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Reward Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Reward Distribution</CardTitle>
          <CardDescription className="text-sm">Choose how the money pot gets distributed to winners</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Distribution Method *</Label>
            <RadioGroup value={rewardDistribution} onValueChange={onRewardDistributionChange}>
              {rewardDistributionOptions.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <div className="space-y-1 flex-1">
                    <Label htmlFor={option.value} className="text-sm font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-primary mb-1">Distribution Examples:</p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>
                    • <strong>Winner Takes All:</strong> Maximum motivation, one big winner
                  </li>
                  <li>
                    • <strong>Top 3 Split:</strong> Rewards top performers, encourages competition
                  </li>
                  <li>
                    • <strong>Completion Bonus:</strong> Everyone wins if they finish, most collaborative
                  </li>
                  <li>
                    • <strong>Equal Split:</strong> Fair distribution among all successful participants
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bonus Rewards */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bonus Rewards (Optional)</CardTitle>
          <CardDescription className="text-sm">
            Add extra incentives beyond money to make your challenge more appealing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Add Custom Bonus Reward</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Personal congratulations video"
                value={newBonusReward}
                onChange={(e) => setNewBonusReward(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddBonusReward(newBonusReward)
                  }
                }}
                disabled={bonusRewards.length >= 3}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddBonusReward(newBonusReward)}
                disabled={!newBonusReward || bonusRewards.length >= 3}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Suggested Bonus Rewards</Label>
            <div className="flex flex-wrap gap-2">
              {bonusRewardSuggestions.map((reward) => (
                <Button
                  key={reward}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddBonusReward(reward)}
                  disabled={bonusRewards.includes(reward) || bonusRewards.length >= 3}
                  className="h-8 text-xs"
                >
                  {reward}
                </Button>
              ))}
            </div>
          </div>

          {bonusRewards.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Selected Bonus Rewards ({bonusRewards.length}/3)</Label>
              <div className="flex flex-wrap gap-2">
                {bonusRewards.map((reward) => (
                  <Badge key={reward} variant="secondary" className="flex items-center gap-1">
                    {reward}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBonusReward(reward)}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
