import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info, Calculator, Shield } from "lucide-react"
import Link from "next/link"

interface FeeDisclosureProps {
  stakeAmount: number
  includeInsurance?: boolean
  variant?: "inline" | "modal" | "sidebar"
  showDetailedBreakdown?: boolean
}

export function FeeDisclosure({ 
  stakeAmount, 
  includeInsurance = false, 
  variant = "inline",
  showDetailedBreakdown = true 
}: FeeDisclosureProps) {
  
  const entryFee = stakeAmount * 0.05
  const insuranceFee = includeInsurance ? 1 : 0
  const totalCost = stakeAmount + entryFee + insuranceFee
  
  const estimatedBonus = stakeAmount * 0.23 // Typical 23% bonus from failed stakes
  const potentialEarnings = stakeAmount + estimatedBonus

  const compactView = variant === "sidebar"
  
  return (
    <Card className={`${compactView ? 'border-blue-200 bg-blue-50' : 'border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white'}`}>
      <CardContent className="p-4 space-y-3">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-600" />
            <h4 className="font-semibold text-blue-900">
              {compactView ? "Cost Breakdown" : "Transparent Fee Breakdown"}
            </h4>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
            <Shield className="w-3 h-3 mr-1" />
            No Hidden Fees
          </Badge>
        </div>

        {/* Cost Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Your stake:</span>
            <span className="font-mono font-semibold">${stakeAmount.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center text-blue-600">
            <span className="text-sm">Platform fee (5%):</span>
            <span className="font-mono">+${entryFee.toFixed(2)}</span>
          </div>
          
          {includeInsurance && (
            <div className="flex justify-between items-center text-purple-600">
              <span className="text-sm">Insurance (optional):</span>
              <span className="font-mono">+${insuranceFee.toFixed(2)}</span>
            </div>
          )}
          
          <div className="border-t pt-2 flex justify-between items-center font-bold">
            <span>Total you pay:</span>
            <span className="font-mono text-lg text-primary">${totalCost.toFixed(2)}</span>
          </div>
        </div>

        {/* Potential Earnings */}
        {showDetailedBreakdown && (
          <div className="bg-green-50 border border-green-200 rounded p-3 space-y-2">
            <h5 className="font-semibold text-green-800 text-sm">If you complete the challenge:</h5>
            <div className="flex justify-between text-sm">
              <span className="text-green-700">Your stake back:</span>
              <span className="font-mono text-green-800">${stakeAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-700">Estimated bonus:</span>
              <span className="font-mono text-green-800">+${estimatedBonus.toFixed(2)}</span>
            </div>
            <div className="border-t border-green-200 pt-2 flex justify-between font-semibold">
              <span className="text-green-800">Total earnings:</span>
              <span className="font-mono text-green-800">${potentialEarnings.toFixed(2)}</span>
            </div>
            <p className="text-xs text-green-600">
              *Bonus varies based on completion rates (typically 15-30%)
            </p>
          </div>
        )}

        {/* Key Points */}
        {!compactView && (
          <div className="space-y-1 text-xs text-blue-600">
            <div className="flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Winners share 80% of failed stakes equally</span>
            </div>
            <div className="flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Platform keeps 20% of failed stakes only</span>
            </div>
            <div className="flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>No additional fees for completing challenges</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-2 border-t">
          <Link 
            href="/pricing" 
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            View complete pricing breakdown →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// Quick calculation hook for other components
export function useFeeCalculation(stakeAmount: number, includeInsurance: boolean = false) {
  const entryFee = stakeAmount * 0.05
  const insuranceFee = includeInsurance ? 1 : 0
  const totalCost = stakeAmount + entryFee + insuranceFee
  const estimatedBonus = stakeAmount * 0.23
  const potentialEarnings = stakeAmount + estimatedBonus
  
  return {
    stakeAmount,
    entryFee,
    insuranceFee,
    totalCost,
    estimatedBonus,
    potentialEarnings,
    breakdown: {
      platformFeePercentage: 5,
      failedStakeCutPercentage: 20,
      winnersSharePercentage: 80
    }
  }
}
