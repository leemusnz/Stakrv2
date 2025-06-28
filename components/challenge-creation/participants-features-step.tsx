"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Users, UserPlus, Gift, Trophy, Zap, Info, User, Calendar } from "lucide-react"

interface ParticipantsFeaturesStepProps {
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
  // Points only setting
  allowPointsOnly: boolean
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
    label: "Auto-Balance",
    description: "Users randomly placed in teams, keeping sizes equal",
  },
  {
    value: "manual-invite",
    label: "Manual Invite",
    description: "Users create teams and invite friends to join",
  },
  {
    value: "join-existing",
    label: "Join Existing",
    description: "Users can pick which team to join (Red vs Blue style)",
  },
]

const winningCriteriaOptions = [
  {
    value: "completion-rate",
    label: "Highest Completion Rate",
    description: "Team with highest % of members who finish wins",
  },
  {
    value: "average-streak",
    label: "Longest Average Streak",
    description: "Team with longest average streak per member wins",
  },
  {
    value: "total-submissions",
    label: "Most Proof Submissions",
    description: "Team with most daily proof submissions wins",
  },
]

const losingTeamOutcomes = [
  {
    value: "lose-stake",
    label: "Lose Their Stake",
    description: "Most motivating - losing team forfeits their money",
    icon: "❌",
  },
  {
    value: "comeback-discount",
    label: "Comeback Discount",
    description: "Losing team gets discount to try again",
    icon: "💸",
  },
  {
    value: "consolation-points",
    label: "Consolation Points",
    description: "Losing team gets experience points/leaderboard score",
    icon: "🪙",
  },
]

const startDateTypes = [
  { value: "days", label: "Fixed Days", description: "Challenge starts after X days" },
  { value: "participants", label: "When Full", description: "Challenge starts when enough people join" },
  { value: "manual", label: "Manual Start", description: "You decide when to start the challenge" },
]

const minParticipantOptions = [
  { value: 1, label: "1 person (Solo)", description: "Just you - win your stake back or lose it to Stakr" },
  { value: 2, label: "2 people", description: "You + 1 other person" },
  { value: 3, label: "3 people", description: "Small group challenge" },
  { value: 4, label: "4 people", description: "Perfect for close friends" },
  { value: 5, label: "5 people", description: "Small team size" },
  { value: 8, label: "8 people", description: "Medium group" },
  { value: 10, label: "10 people", description: "Larger group" },
  { value: 15, label: "15 people", description: "Big group challenge" },
  { value: 20, label: "20 people", description: "Large community" },
]

const getMaxParticipantOptions = (isPrivate: boolean, enableTeamMode: boolean, allowPointsOnly: boolean) => {
  const baseOptions = [
    { value: null, label: "Unlimited", description: "No limit on participants" },
    { value: 5, label: "5 people max", description: "Keep it small and intimate" },
    { value: 10, label: "10 people max", description: "Medium-sized group" },
    { value: 15, label: "15 people max", description: "Manageable group size" },
    { value: 20, label: "20 people max", description: "Large but controlled" },
    { value: 30, label: "30 people max", description: "Big group challenge" },
    { value: 50, label: "50 people max", description: "Large community" },
  ]

  // For points-only challenges, allow unlimited participants
  if (allowPointsOnly) {
    return [...baseOptions, { value: 100, label: "100 people max", description: "Very large group" }]
  }

  // For public money challenges, cap at 50 (or 100 for teams)
  if (!isPrivate) {
    const maxAllowed = enableTeamMode ? 100 : 50
    if (enableTeamMode) {
      baseOptions.push({ value: 100, label: "100 people max", description: "Very large team competition" })
    }
    return baseOptions.filter((option) => option.value === null || option.value <= maxAllowed)
  }

  // For private challenges, allow unlimited
  return [...baseOptions, { value: 100, label: "100 people max", description: "Very large group" }]
}

export function ParticipantsFeaturesStep({
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
  allowPointsOnly,
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
}: ParticipantsFeaturesStepProps) {
  const isSoloChallenge = minParticipants === 1

  return (
    <div className="space-y-8">
      {/* Participant Settings */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
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
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
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
                  {minParticipantOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isSoloChallenge && (
              <div className="space-y-2">
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
                        <SelectItem key={option.value || "unlimited"} value={option.value?.toString() || "unlimited"}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-700 mb-1">Solo Challenge:</p>
                  <ul className="text-blue-600 space-y-1 text-xs">
                    <li>• Complete the challenge to win your stake back</li>
                    <li>• Fail the challenge and Stakr keeps your stake</li>
                    <li>• Perfect for personal accountability and self-discipline</li>
                    <li>• No competition with others - just you vs the challenge</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Multi-participant Info */}
          {!isSoloChallenge && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-green-700 mb-1">Group Challenge:</p>
                  <ul className="text-green-600 space-y-1 text-xs">
                    <li>
                      • Minimum {minParticipants} {minParticipants === 1 ? "person" : "people"} needed to start
                    </li>
                    <li>
                      •{" "}
                      {maxParticipants ? `Maximum ${maxParticipants} people allowed` : "Unlimited participants allowed"}
                    </li>
                    <li>• Rewards distributed based on your chosen payout method</li>
                    <li>• Social accountability increases success rates</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Challenge Features - Show first for multi-participant challenges */}
      {!isSoloChallenge && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Challenge Features
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Add special features to make your challenge more engaging and social.
            </p>

            {/* Team vs Team Mode */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
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
                        <SelectItem value="2">2 Teams (Red vs Blue)</SelectItem>
                        <SelectItem value="3">3 Teams</SelectItem>
                        <SelectItem value="4">4 Teams</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Start with 2 teams for simplicity - most competitive and easy to understand.
                    </p>
                  </div>

                  {/* Team Assignment Method */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Team Assignment Method</Label>
                    <RadioGroup value={teamAssignmentMethod} onValueChange={onTeamAssignmentMethodChange}>
                      {teamAssignmentMethods.map((method) => (
                        <div key={method.value} className="flex items-start space-x-3 space-y-0">
                          <RadioGroupItem value={method.value} id={method.value} className="mt-1" />
                          <div className="space-y-1 flex-1">
                            <Label htmlFor={method.value} className="text-sm font-medium cursor-pointer">
                              {method.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">{method.description}</p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Winning Criteria */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">How Teams Win</Label>
                    <RadioGroup value={winningCriteria} onValueChange={onWinningCriteriaChange}>
                      {winningCriteriaOptions.map((criteria) => (
                        <div key={criteria.value} className="flex items-start space-x-3 space-y-0">
                          <RadioGroupItem value={criteria.value} id={criteria.value} className="mt-1" />
                          <div className="space-y-1 flex-1">
                            <Label htmlFor={criteria.value} className="text-sm font-medium cursor-pointer">
                              {criteria.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">{criteria.description}</p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Losing Team Outcome */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">What Happens to Losing Teams?</Label>
                    <RadioGroup value={losingTeamOutcome} onValueChange={onLosingTeamOutcomeChange}>
                      {losingTeamOutcomes.map((outcome) => (
                        <div key={outcome.value} className="flex items-start space-x-3 space-y-0">
                          <RadioGroupItem value={outcome.value} id={outcome.value} className="mt-1" />
                          <div className="space-y-1 flex-1">
                            <Label
                              htmlFor={outcome.value}
                              className="text-sm font-medium cursor-pointer flex items-center gap-2"
                            >
                              <span>{outcome.icon}</span>
                              {outcome.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">{outcome.description}</p>
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
                          <li>• Uses all your existing reward distribution logic</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Referral Bonus - Only show for public challenges */}
            {!isPrivate && (
              <Card>
                <CardHeader className="pb-3">
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
                            <SelectItem value="20">20% per referral</SelectItem>
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
                            <SelectItem value="3">3 referrals max</SelectItem>
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
                              • {referralBonusPercentage}% bonus added to their final reward for each successful
                              referral
                            </li>
                            <li>• Maximum {maxReferrals} successful referrals per person</li>
                            <li>• Drives viral growth and makes challenges more social</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Start Date Settings - Show AFTER features for multi-participant challenges */}
      {!isSoloChallenge && (
        <Card className="border-2 border-secondary/20">
          <CardHeader className="pb-3">
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
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">When Should the Challenge Start?</Label>
              <RadioGroup value={startDateType} onValueChange={onStartDateTypeChange}>
                {startDateTypes.map((type) => (
                  <div key={type.value} className="flex items-start space-x-3 space-y-0">
                    <RadioGroupItem value={type.value} id={`start-${type.value}`} className="mt-1" />
                    <div className="space-y-1 flex-1">
                      <Label htmlFor={`start-${type.value}`} className="text-sm font-medium cursor-pointer">
                        {type.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>

              {startDateType === "days" && (
                <div className="ml-6 space-y-2">
                  <Label className="text-sm font-medium">Start After How Many Days?</Label>
                  <Select
                    value={startDateDays.toString()}
                    onValueChange={(value) => onStartDateDaysChange(Number(value))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="2">2 days</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="5">5 days</SelectItem>
                      <SelectItem value="7">1 week</SelectItem>
                      <SelectItem value="14">2 weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-secondary mb-1">Start Date Options:</p>
                  <ul className="text-muted-foreground space-y-1 text-xs">
                    <li>
                      • <strong>Fixed Days:</strong> Gives people time to prepare and join
                    </li>
                    <li>
                      • <strong>When Full:</strong> Starts automatically when you reach max participants
                    </li>
                    <li>
                      • <strong>Manual Start:</strong> You control exactly when to begin
                    </li>
                    {isPrivate && (
                      <li>
                        • <strong>Private challenges:</strong> Perfect for coordinating with your group
                      </li>
                    )}
                    {!isPrivate && (
                      <li>
                        • <strong>Public challenges:</strong> Builds anticipation and allows discovery
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
  )
}
