"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Users, UserPlus, Trophy, Zap, Info, Coins, DollarSign, User, Calendar, Lightbulb, Star } from "lucide-react"

interface ChallengeFeaturesStepProps {
  // Challenge Type
  allowPointsOnly: boolean
  // Participant Settings
  minParticipants: number
  maxParticipants: number | null
  // Start Date Settings
  startDateType: string
  startDateDays: number
  // Privacy Settings
  isPrivate: boolean
  // Team Challenge Settings
  enableTeamMode: boolean
  teamAssignmentMethod: string
  numberOfTeams: number
  winningCriteria: string
  losingTeamOutcome: string
  // Referral Settings
  enableReferralBonus: boolean
  referralBonusPercentage: number
  maxReferrals: number
  onAllowPointsOnlyChange: (allow: boolean) => void
  onMinParticipantsChange: (min: number) => void
  onMaxParticipantsChange: (max: number | null) => void
  onStartDateTypeChange: (type: string) => void
  onStartDateDaysChange: (days: number) => void
  onEnableTeamModeChange: (enabled: boolean) => void
  onTeamAssignmentMethodChange: (method: string) => void
  onNumberOfTeamsChange: (teams: number) => void
  onWinningCriteriaChange: (criteria: string) => void
  onLosingTeamOutcomeChange: (outcome: string) => void
  onEnableReferralBonusChange: (enabled: boolean) => void
  onReferralBonusPercentageChange: (percentage: number) => void
  onMaxReferralsChange: (max: number) => void
}

const teamAssignmentMethods = [
  {
    value: "auto-balance",
    label: "Auto-Balance Teams",
    description: "Users randomly placed in teams, keeping sizes equal",
    pros: "Fair, balanced, no favoritism",
    cons: "Less social connection",
  },
  {
    value: "manual-invite",
    label: "Manual Team Creation",
    description: "Users create teams and invite friends to join",
    pros: "Strong social bonds, friend groups",
    cons: "May create uneven teams",
  },
  {
    value: "join-existing",
    label: "Choose Your Team",
    description: "Users can pick which team to join (Red vs Blue style)",
    pros: "User choice, competitive spirit",
    cons: "Teams may become unbalanced",
  },
]

const winningCriteriaOptions = [
  {
    value: "completion-rate",
    label: "Highest Completion Rate",
    description: "Team with highest % of members who finish wins",
    example: "Team A: 8/10 finish (80%) vs Team B: 6/8 finish (75%)",
  },
  {
    value: "average-streak",
    label: "Longest Average Streak",
    description: "Team with longest average streak per member wins",
    example: "Team A: avg 15 days vs Team B: avg 12 days",
  },
  {
    value: "total-submissions",
    label: "Most Proof Submissions",
    description: "Team with most daily proof submissions wins",
    example: "Team A: 180 submissions vs Team B: 165 submissions",
  },
]

const losingTeamOutcomes = [
  {
    value: "lose-stake",
    label: "Lose Their Stake",
    description: "Most motivating - losing team forfeits their money",
    icon: "❌",
    motivation: "Maximum accountability",
  },
  {
    value: "comeback-discount",
    label: "Comeback Discount",
    description: "Losing team gets discount to try again",
    icon: "💸",
    motivation: "Encourages retry",
  },
  {
    value: "consolation-points",
    label: "Consolation Points",
    description: "Losing team gets experience points/leaderboard score",
    icon: "🪙",
    motivation: "Softer landing",
  },
]

const startDateTypes = [
  {
    value: "days",
    label: "Fixed Days",
    description: "Challenge starts after X days",
    bestFor: "Building anticipation, allowing preparation time",
  },
  {
    value: "participants",
    label: "When Full",
    description: "Challenge starts when enough people join",
    bestFor: "Ensuring minimum participation, faster starts",
  },
  {
    value: "manual",
    label: "Manual Start",
    description: "You decide when to start the challenge",
    bestFor: "Coordinating with specific groups, flexibility",
  },
]

const getMinParticipantOptions = (allowPointsOnly: boolean) => [
  {
    value: 1,
    label: "1 person (Solo)",
    description: "Just you - win your stake back or lose it to Stakr",
    bestFor: "Personal accountability",
  },
  { value: 2, label: "2 people", description: "You + 1 other person", bestFor: "Accountability partner" },
  { value: 3, label: "3 people", description: "Small group challenge", bestFor: "Close friends" },
  { value: 4, label: "4 people", description: "Perfect for close friends", bestFor: "Small friend group" },
  { value: 5, label: "5 people", description: "Small team size", bestFor: "Family challenges" },
  { value: 8, label: "8 people", description: "Medium group", bestFor: "Workplace teams" },
  { value: 10, label: "10 people", description: "Larger group", bestFor: "Class or club" },
  { value: 15, label: "15 people", description: "Big group challenge", bestFor: "Large communities" },
  { value: 20, label: "20 people", description: "Large community", bestFor: "Organizations" },
]

const getMaxParticipantOptions = (isPrivate: boolean, enableTeamMode: boolean, allowPointsOnly: boolean) => {
  const baseOptions = [
    { value: null, label: "Unlimited", description: "No limit on participants", bestFor: "Viral growth" },
    { value: 5, label: "5 people max", description: "Keep it small and intimate", bestFor: "Close groups" },
    { value: 10, label: "10 people max", description: "Medium-sized group", bestFor: "Manageable size" },
    { value: 15, label: "15 people max", description: "Manageable group size", bestFor: "Small communities" },
    { value: 20, label: "20 people max", description: "Large but controlled", bestFor: "Organized groups" },
    { value: 30, label: "30 people max", description: "Big group challenge", bestFor: "Large teams" },
    { value: 50, label: "50 people max", description: "Large community", bestFor: "Big communities" },
  ]

  // For points-only challenges, allow unlimited participants
  if (allowPointsOnly) {
    return [
      ...baseOptions,
      { value: 100, label: "100 people max", description: "Very large group", bestFor: "Massive communities" },
    ]
  }

  // For public money challenges, cap at 50 (or 100 for teams)
  if (!isPrivate) {
    const maxAllowed = enableTeamMode ? 100 : 50
    if (enableTeamMode) {
      baseOptions.push({
        value: 100,
        label: "100 people max",
        description: "Very large team competition",
        bestFor: "Epic team battles",
      })
    }
    return baseOptions.filter((option) => option.value === null || option.value <= maxAllowed)
  }

  // For private challenges, allow unlimited
  return [
    ...baseOptions,
    { value: 100, label: "100 people max", description: "Very large group", bestFor: "Massive private groups" },
  ]
}

export function ChallengeFeaturesStep({
  allowPointsOnly,
  minParticipants,
  maxParticipants,
  startDateType,
  startDateDays,
  isPrivate,
  enableTeamMode,
  teamAssignmentMethod,
  numberOfTeams,
  winningCriteria,
  losingTeamOutcome,
  enableReferralBonus,
  referralBonusPercentage,
  maxReferrals,
  onAllowPointsOnlyChange,
  onMinParticipantsChange,
  onMaxParticipantsChange,
  onStartDateTypeChange,
  onStartDateDaysChange,
  onEnableTeamModeChange,
  onTeamAssignmentMethodChange,
  onNumberOfTeamsChange,
  onWinningCriteriaChange,
  onLosingTeamOutcomeChange,
  onEnableReferralBonusChange,
  onReferralBonusPercentageChange,
  onMaxReferralsChange,
}: ChallengeFeaturesStepProps) {
  const isSoloChallenge = minParticipants === 1

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Configure your challenge features</h2>
        <p className="text-muted-foreground">
          Choose the type of challenge and features that will drive the most engagement and accountability.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Challenge Type - Points vs Money */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Challenge Type</CardTitle>
                  <CardDescription className="text-sm">Choose between points-only or real money stakes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Coins className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <Label className="text-base font-medium">Points-Only Challenge</Label>
                    <p className="text-sm text-muted-foreground">
                      Free to join, earn experience points and leaderboard rankings
                    </p>
                  </div>
                </div>
                <Switch checked={allowPointsOnly} onCheckedChange={onAllowPointsOnlyChange} />
              </div>

              {allowPointsOnly ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-green-700 mb-2">Points-Only Benefits:</p>
                      <ul className="text-green-600 space-y-1 text-xs">
                        <li>
                          • <strong>Free for everyone</strong> - no financial barriers to entry
                        </li>
                        <li>
                          • <strong>Unlimited participants</strong> - perfect for viral growth
                        </li>
                        <li>
                          • <strong>Lower pressure</strong> - great for habit building without stress
                        </li>
                        <li>
                          • <strong>Gamification</strong> - earn XP, badges, and leaderboard rankings
                        </li>
                        <li>
                          • <strong>Testing ground</strong> - perfect for validating challenge ideas
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-orange-700 mb-2">Real Money Stakes:</p>
                      <ul className="text-orange-600 space-y-1 text-xs">
                        <li>
                          • <strong>Maximum accountability</strong> - financial commitment drives results
                        </li>
                        <li>
                          • <strong>Real rewards</strong> - win actual money for completing challenges
                        </li>
                        <li>
                          • <strong>Higher completion rates</strong> - skin in the game increases success
                        </li>
                        <li>
                          • <strong>Serious participants</strong> - attracts committed individuals
                        </li>
                        <li>
                          • <strong>Limited size</strong> - ensures meaningful reward distribution
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team vs Team Mode - Only show for multi-participant challenges */}
          {!isSoloChallenge && (
            <Card className="border-2 border-secondary/20">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Team vs Team Mode</CardTitle>
                      <CardDescription className="text-sm">
                        Split participants into competing teams for ultimate accountability
                      </CardDescription>
                    </div>
                  </div>
                  <Switch checked={enableTeamMode} onCheckedChange={onEnableTeamModeChange} />
                </div>
              </CardHeader>

              {enableTeamMode && (
                <CardContent className="pt-0 space-y-6">
                  {/* Number of Teams */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Number of Teams</Label>
                    <Select
                      value={numberOfTeams.toString()}
                      onValueChange={(value) => onNumberOfTeamsChange(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">
                          <div>
                            <div className="font-medium">2 Teams (Red vs Blue)</div>
                            <div className="text-xs text-muted-foreground">Most competitive and easy to understand</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="3">
                          <div>
                            <div className="font-medium">3 Teams</div>
                            <div className="text-xs text-muted-foreground">
                              Good for larger groups, more complex dynamics
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="4">
                          <div>
                            <div className="font-medium">4 Teams</div>
                            <div className="text-xs text-muted-foreground">Tournament-style competition possible</div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      <strong>Recommendation:</strong> Start with 2 teams for maximum competition and simplicity.
                    </p>
                  </div>

                  {/* Team Assignment Method */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Team Assignment Method</Label>
                    <RadioGroup value={teamAssignmentMethod} onValueChange={onTeamAssignmentMethodChange}>
                      {teamAssignmentMethods.map((method) => (
                        <div key={method.value} className="border rounded-lg p-3">
                          <div className="flex items-start space-x-3 space-y-0">
                            <RadioGroupItem value={method.value} id={method.value} className="mt-1" />
                            <div className="space-y-2 flex-1">
                              <Label htmlFor={method.value} className="text-sm font-medium cursor-pointer">
                                {method.label}
                              </Label>
                              <p className="text-xs text-muted-foreground">{method.description}</p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="text-green-600">✓ {method.pros}</div>
                                <div className="text-orange-600">⚠ {method.cons}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Winning Criteria */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">How Teams Win</Label>
                    <RadioGroup value={winningCriteria} onValueChange={onWinningCriteriaChange}>
                      {winningCriteriaOptions.map((criteria) => (
                        <div key={criteria.value} className="border rounded-lg p-3">
                          <div className="flex items-start space-x-3 space-y-0">
                            <RadioGroupItem value={criteria.value} id={criteria.value} className="mt-1" />
                            <div className="space-y-2 flex-1">
                              <Label htmlFor={criteria.value} className="text-sm font-medium cursor-pointer">
                                {criteria.label}
                              </Label>
                              <p className="text-xs text-muted-foreground">{criteria.description}</p>
                              <div className="bg-muted/50 rounded p-2 text-xs text-muted-foreground">
                                <strong>Example:</strong> {criteria.example}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Losing Team Outcome */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">What Happens to Losing Teams?</Label>
                    <RadioGroup value={losingTeamOutcome} onValueChange={onLosingTeamOutcomeChange}>
                      {losingTeamOutcomes.map((outcome) => (
                        <div key={outcome.value} className="border rounded-lg p-3">
                          <div className="flex items-start space-x-3 space-y-0">
                            <RadioGroupItem value={outcome.value} id={outcome.value} className="mt-1" />
                            <div className="space-y-2 flex-1">
                              <Label
                                htmlFor={outcome.value}
                                className="text-sm font-medium cursor-pointer flex items-center gap-2"
                              >
                                <span>{outcome.icon}</span>
                                {outcome.label}
                              </Label>
                              <p className="text-xs text-muted-foreground">{outcome.description}</p>
                              <div className="bg-blue-50 rounded p-2 text-xs text-blue-600">
                                <strong>Motivation level:</strong> {outcome.motivation}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Team Mode Explanation */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Trophy className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-primary mb-2">How Team vs Team Works:</p>
                        <ul className="text-muted-foreground space-y-1 text-xs">
                          <li>• Participants join your challenge and get assigned to teams</li>
                          <li>• Teams compete based on your chosen winning criteria</li>
                          <li>• Winning team splits the reward pool using your payout method</li>
                          <li>• Creates intense social accountability and friendly competition</li>
                          <li>• Team chat and progress tracking keeps everyone motivated</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Referral Bonus - Only show for public challenges and multi-participant */}
          {!isPrivate && !isSoloChallenge && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <UserPlus className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Referral Bonus Rewards</CardTitle>
                      <CardDescription className="text-sm">
                        Reward participants for inviting friends to join
                      </CardDescription>
                    </div>
                  </div>
                  <Switch checked={enableReferralBonus} onCheckedChange={onEnableReferralBonusChange} />
                </div>
              </CardHeader>

              {enableReferralBonus && (
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Bonus Percentage</Label>
                      <Select
                        value={referralBonusPercentage.toString()}
                        onValueChange={(value) => onReferralBonusPercentageChange(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10% per referral</SelectItem>
                          <SelectItem value="15">15% per referral</SelectItem>
                          <SelectItem value="20">20% per referral (Recommended)</SelectItem>
                          <SelectItem value="25">25% per referral</SelectItem>
                          <SelectItem value="30">30% per referral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Max Referrals</Label>
                      <Select
                        value={maxReferrals.toString()}
                        onValueChange={(value) => onMaxReferralsChange(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 referral max</SelectItem>
                          <SelectItem value="2">2 referrals max</SelectItem>
                          <SelectItem value="3">3 referrals max (Recommended)</SelectItem>
                          <SelectItem value="5">5 referrals max</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-secondary mb-2">How Referral Bonuses Work:</p>
                        <ul className="text-muted-foreground space-y-1 text-xs">
                          <li>• Participants get unique referral links to share with friends</li>
                          <li>• Bonus only applies if referred friends complete the challenge</li>
                          <li>
                            • {referralBonusPercentage}% bonus added to their final reward for each successful referral
                          </li>
                          <li>• Maximum {maxReferrals} successful referrals per person</li>
                          <li>• Drives viral growth and makes challenges more social</li>
                        </ul>
                        <div className="mt-3 p-2 bg-white rounded border">
                          <p className="text-xs font-medium">
                            Example: If someone stakes $100 and refers 2 friends who complete:
                          </p>
                          <p className="text-xs">
                            Base reward: $100 → With referrals: $100 + ({referralBonusPercentage}% × 2) = $
                            {100 + (100 * referralBonusPercentage * 2) / 100}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Participant Settings - NOW comes after all the features that affect limits */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Participant Settings</CardTitle>
                  <CardDescription className="text-sm">Control how many people can join your challenge</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Minimum Participants *</Label>
                  <Select
                    value={minParticipants.toString()}
                    onValueChange={(value) => {
                      const min = Number(value)
                      onMinParticipantsChange(min)
                      // If setting min to 1, also set max to 1 for solo challenge
                      if (min === 1) {
                        onMaxParticipantsChange(1)
                        // Disable team mode for solo challenges
                        onEnableTeamModeChange(false)
                      }
                      // If min is greater than current max, update max
                      if (maxParticipants !== null && min > maxParticipants) {
                        onMaxParticipantsChange(min)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getMinParticipantOptions(allowPointsOnly).map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          <div className="py-1">
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                            <div className="text-xs text-blue-600 mt-1">Best for: {option.bestFor}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!isSoloChallenge && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Maximum Participants</Label>
                    <Select
                      value={maxParticipants?.toString() || "unlimited"}
                      onValueChange={(value) => {
                        if (value === "unlimited") {
                          onMaxParticipantsChange(null)
                        } else {
                          const max = Number(value)
                          onMaxParticipantsChange(max)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getMaxParticipantOptions(isPrivate, enableTeamMode, allowPointsOnly)
                          .filter((option) => option.value === null || option.value >= minParticipants)
                          .map((option) => (
                            <SelectItem
                              key={option.value || "unlimited"}
                              value={option.value?.toString() || "unlimited"}
                            >
                              <div className="py-1">
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-muted-foreground">{option.description}</div>
                                <div className="text-xs text-blue-600 mt-1">Best for: {option.bestFor}</div>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Solo Challenge Info */}
              {isSoloChallenge && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-700 mb-2">Solo Challenge Benefits:</p>
                      <ul className="text-blue-600 space-y-1 text-xs">
                        <li>
                          • <strong>Pure self-accountability</strong> - no external pressure or comparison
                        </li>
                        <li>
                          • <strong>Simple mechanics</strong> - complete to win, fail to lose stake
                        </li>
                        <li>
                          • <strong>Personal growth focus</strong> - all about your individual journey
                        </li>
                        <li>
                          • <strong>Flexible timing</strong> - start whenever you're ready
                        </li>
                        <li>
                          • <strong>Privacy</strong> - no one else sees your progress unless you share
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Multi-participant Info */}
              {!isSoloChallenge && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-green-700 mb-2">Group Challenge Benefits:</p>
                      <ul className="text-green-600 space-y-1 text-xs">
                        <li>
                          • <strong>Social accountability</strong> - {minParticipants}{" "}
                          {minParticipants === 1 ? "person" : "people"} minimum for peer pressure
                        </li>
                        <li>
                          • <strong>Community support</strong> -{" "}
                          {maxParticipants ? `up to ${maxParticipants} people` : "unlimited participants"} cheering each
                          other on
                        </li>
                        <li>
                          • <strong>Shared motivation</strong> - group chat and progress sharing
                        </li>
                        <li>
                          • <strong>Competitive element</strong> - leaderboards and friendly competition
                        </li>
                        {allowPointsOnly && (
                          <li>
                            • <strong>Unlimited growth</strong> - points challenges can scale infinitely
                          </li>
                        )}
                        {!allowPointsOnly && !isPrivate && (
                          <li>
                            • <strong>Reward optimization</strong> - money challenges capped at{" "}
                            {enableTeamMode ? "100" : "50"} for better payouts
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Start Date Settings - Show for all multi-participant challenges */}
          {!isSoloChallenge && (
            <Card className="border-2 border-secondary/20">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Challenge Start Date</CardTitle>
                    <CardDescription className="text-sm">Choose when your challenge should begin</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-sm font-medium">When Should the Challenge Start?</Label>
                  <RadioGroup value={startDateType} onValueChange={onStartDateTypeChange}>
                    {startDateTypes.map((type) => (
                      <div key={type.value} className="border rounded-lg p-3">
                        <div className="flex items-start space-x-3 space-y-0">
                          <RadioGroupItem value={type.value} id={`start-${type.value}`} className="mt-1" />
                          <div className="space-y-2 flex-1">
                            <Label htmlFor={`start-${type.value}`} className="text-sm font-medium cursor-pointer">
                              {type.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">{type.description}</p>
                            <div className="bg-blue-50 rounded p-2 text-xs text-blue-600">
                              <strong>Best for:</strong> {type.bestFor}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>

                  {startDateType === "days" && (
                    <div className="ml-6 space-y-3">
                      <Label className="text-sm font-medium">Start After How Many Days?</Label>
                      <Select
                        value={startDateDays.toString()}
                        onValueChange={(value) => onStartDateDaysChange(Number(value))}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 day (Quick start)</SelectItem>
                          <SelectItem value="2">2 days (Recommended)</SelectItem>
                          <SelectItem value="3">3 days (Good preparation time)</SelectItem>
                          <SelectItem value="5">5 days (Build anticipation)</SelectItem>
                          <SelectItem value="7">1 week (Maximum preparation)</SelectItem>
                          <SelectItem value="14">2 weeks (Special events)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        <strong>Tip:</strong> 2-3 days gives people time to prepare without losing momentum.
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-secondary mb-2">Start Date Strategy:</p>
                      <ul className="text-muted-foreground space-y-1 text-xs">
                        <li>
                          • <strong>Fixed Days:</strong> Builds anticipation, allows preparation, good for marketing
                        </li>
                        <li>
                          • <strong>When Full:</strong> Ensures minimum participation, faster starts, good for small
                          groups
                        </li>
                        <li>
                          • <strong>Manual Start:</strong> Maximum control, perfect for coordinated groups
                        </li>
                        {isPrivate && (
                          <li>
                            • <strong>Private challenges:</strong> Manual start works great for coordinating with your
                            specific group
                          </li>
                        )}
                        {!isPrivate && (
                          <li>
                            • <strong>Public challenges:</strong> Fixed days help with discovery and viral sharing
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Feature Guide */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-primary">
                <Lightbulb className="w-4 h-4" />
                Feature Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium mb-2">Points vs Money:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Points: Free, unlimited, low pressure</li>
                  <li>• Money: High accountability, real rewards</li>
                  <li>• Start with points to test your idea</li>
                </ul>
              </div>

              <div>
                <p className="font-medium mb-2">Team Challenges:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• 3x higher completion rates</li>
                  <li>• Creates social bonds</li>
                  <li>• Perfect for competitive people</li>
                  <li>• Auto-balance for fairness</li>
                </ul>
              </div>

              <div>
                <p className="font-medium mb-2">Referral Bonuses:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Drives viral growth</li>
                  <li>• 20% bonus is sweet spot</li>
                  <li>• Only works for public challenges</li>
                  <li>• Bonus only if friends complete</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Participant Limits */}
          <Card className="bg-secondary/5 border-secondary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-secondary">Participant Limits</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-secondary mb-1">Current Settings:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Type: {allowPointsOnly ? "Points-only" : "Money stakes"}</li>
                    <li>• Privacy: {isPrivate ? "Private" : "Public"}</li>
                    <li>• Teams: {enableTeamMode ? "Enabled" : "Disabled"}</li>
                    <li>
                      • Min: {minParticipants} {minParticipants === 1 ? "person" : "people"}
                    </li>
                    <li>• Max: {maxParticipants || "Unlimited"}</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-secondary mb-1">Limits Applied:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {allowPointsOnly && <li>• Points: No limits</li>}
                    {!allowPointsOnly && !isPrivate && <li>• Public money: {enableTeamMode ? "100" : "50"} max</li>}
                    {!allowPointsOnly && isPrivate && <li>• Private money: No limits</li>}
                    {enableTeamMode && <li>• Teams: Higher limits allowed</li>}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Success Tips */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                <Star className="w-4 h-4" />
                Success Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-green-700 mb-1">High Completion Rates:</p>
                  <ul className="text-green-600 space-y-1 text-xs">
                    <li>• Solo challenges: 65% completion</li>
                    <li>• Small groups (2-5): 78% completion</li>
                    <li>• Team challenges: 85% completion</li>
                    <li>• Money stakes: +25% completion</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-green-700 mb-1">Optimal Settings:</p>
                  <ul className="text-green-600 space-y-1 text-xs">
                    <li>• 2-3 day start delay</li>
                    <li>• 5-20 participants for groups</li>
                    <li>• 20% referral bonus</li>
                    <li>• Auto-balance teams</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
