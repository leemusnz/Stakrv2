"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  DollarSign, 
  Trophy, 
  Users, 
  TrendingUp, 
  Shield, 
  CheckCircle,
  Info
} from "lucide-react"

interface HostIncentiveInfoProps {
  estimatedParticipants?: number
  averageStake?: number
  hostContribution?: number
  showFullDetails?: boolean
}

export function HostIncentiveInfo({ 
  estimatedParticipants = 50, 
  averageStake = 50, 
  hostContribution = 0,
  showFullDetails = true 
}: HostIncentiveInfoProps) {
  
  // Calculate projections based on typical Stakr metrics
  const totalStakes = estimatedParticipants * averageStake
  const entryFees = totalStakes * 0.05 // 5% entry fee
  const failedStakes = totalStakes * 0.3 * 0.2 // Assume 30% fail, 20% platform cut
  const platformRevenue = entryFees + failedStakes
  const hostRevenue = platformRevenue * 0.3 // 30% revenue share
  const contributionReturn = hostContribution // Returned if >50% success
  const successBonus = hostRevenue * 0.2 // 20% bonus if >80% success
  const totalPotentialEarnings = hostRevenue + contributionReturn + successBonus

  return (
    <div className="space-y-4">
      {/* Main Incentive Card */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Trophy className="w-5 h-5" />
            Host Incentives & Earnings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">
                ${Math.round(hostRevenue)}
              </div>
              <div className="text-sm text-green-600">Revenue Share</div>
              <div className="text-xs text-muted-foreground">30% of platform fees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">
                ${hostContribution}
              </div>
              <div className="text-sm text-green-600">Contribution Return</div>
              <div className="text-xs text-muted-foreground">If challenge succeeds</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">
                ${Math.round(successBonus)}
              </div>
              <div className="text-sm text-green-600">Success Bonus</div>
              <div className="text-xs text-muted-foreground">If {'>'}80% complete</div>
            </div>
          </div>

          <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
            <div className="flex justify-between items-center font-bold text-green-800">
              <span>Potential Total Earnings:</span>
              <span className="text-xl">${Math.round(totalPotentialEarnings)}</span>
            </div>
            <div className="text-xs text-green-600 mt-1">
              Based on {estimatedParticipants} participants × ${averageStake} average stake
            </div>
          </div>
        </CardContent>
      </Card>

      {showFullDetails && (
        <>
          {/* Host Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                Why Host Challenges?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Earn Real Money</span>
                  </div>
                  <p className="text-muted-foreground text-xs pl-6">
                    Get 30% of all platform revenue from your challenge
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Build Community</span>
                  </div>
                  <p className="text-muted-foreground text-xs pl-6">
                    Help others achieve their goals while earning
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">Passive Income</span>
                  </div>
                  <p className="text-muted-foreground text-xs pl-6">
                    Earnings continue throughout the challenge
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-orange-600" />
                    <span className="font-medium">Join Your Own Challenge</span>
                  </div>
                  <p className="text-muted-foreground text-xs pl-6">
                    Participate alongside your community members
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Host Participation */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Shield className="w-5 h-5" />
                Can Hosts Participate?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800">Yes! Hosts can join their own challenges</p>
                  <p className="text-blue-600 text-xs">
                    You stake money just like other participants and can win rewards
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 pl-6">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Anti-Cheat Protection
                  </Badge>
                </div>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• Same verification requirements as all participants</li>
                  <li>• Random check-ins prevent manipulation</li>
                  <li>• Community can report suspicious activity</li>
                  <li>• Your success rate is publicly tracked</li>
                </ul>
              </div>

              <div className="bg-blue-100 border border-blue-200 rounded p-2 mt-3">
                <p className="text-xs text-blue-700 font-medium">
                  💡 Hosting + Participating = Maximum Earnings Potential
                </p>
                <p className="text-xs text-blue-600">
                  Earn from revenue share AND potentially win your stake back + bonus!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Earnings Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                How Host Earnings Work
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entry fees (5% × {estimatedParticipants} × ${averageStake}):</span>
                  <span className="font-medium">${Math.round(entryFees)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Failed stake cuts (20% of ~30% failures):</span>
                  <span className="font-medium">${Math.round(failedStakes)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Total platform revenue:</span>
                  <span className="font-bold">${Math.round(platformRevenue)}</span>
                </div>
                <div className="flex justify-between text-green-700">
                  <span className="font-medium">Your share (30%):</span>
                  <span className="font-bold">${Math.round(hostRevenue)}</span>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded p-2 text-xs text-muted-foreground">
                <strong>Note:</strong> Actual earnings depend on final participant count, completion rates, and stake amounts.
                These projections use platform averages.
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 