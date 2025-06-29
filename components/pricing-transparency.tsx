import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Info, DollarSign, Users, TrendingUp, Shield } from "lucide-react"

interface PricingTransparencyProps {
  variant?: "full" | "compact" | "onboarding"
  showExamples?: boolean
}

export function PricingTransparency({ variant = "full", showExamples = true }: PricingTransparencyProps) {
  
  const compactView = variant === "compact"
  const onboardingView = variant === "onboarding"
  
  return (
    <div className="space-y-6">
      {/* Header */}
      {!compactView && (
        <div className="text-center space-y-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Shield className="w-3 h-3 mr-1" />
            100% Transparent Pricing
          </Badge>
          <h2 className="text-2xl font-bold">How Stakr Makes Money</h2>
          <p className="text-muted-foreground">
            We believe in complete transparency. Here's exactly how our platform works financially.
          </p>
        </div>
      )}

      {/* Fee Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Entry Fee */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-900">Entry Fee</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">5%</div>
              <div className="text-sm text-blue-700">of your stake</div>
            </div>
            <div className="text-xs text-blue-600">
              <p><strong>When:</strong> Every time you join a challenge</p>
              <p><strong>Example:</strong> $5 fee on $100 stake</p>
              <p><strong>Why:</strong> Platform operations & development</p>
            </div>
          </CardContent>
        </Card>

        {/* Failed Stakes Cut */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-lg text-orange-900">Failed Stakes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">20%</div>
              <div className="text-sm text-orange-700">of non-completers' stakes</div>
            </div>
            <div className="text-xs text-orange-600">
              <p><strong>When:</strong> Only from people who don't finish</p>
              <p><strong>Winners get:</strong> 80% of failed stakes</p>
              <p><strong>Fair:</strong> You only pay if you don't complete</p>
            </div>
          </CardContent>
        </Card>

        {/* Premium Subscription */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-lg text-purple-900">Premium</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">$9.99</div>
              <div className="text-sm text-purple-700">per month (optional)</div>
            </div>
            <div className="text-xs text-purple-600">
              <p><strong>Includes:</strong> Analytics, custom rewards, community</p>
              <p><strong>No advantage:</strong> Same success chances as free users</p>
              <p><strong>Cancel anytime:</strong> No commitments</p>
            </div>
          </CardContent>
        </Card>

        {/* Cashout Fee */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg text-green-900">Cashout Fee</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">3%</div>
              <div className="text-sm text-green-700">when withdrawing to bank</div>
            </div>
            <div className="text-xs text-green-600">
              <p><strong>When:</strong> Only when you cash out to real money</p>
              <p><strong>Alternative:</strong> Keep credits for future challenges</p>
              <p><strong>Minimum:</strong> $10 withdrawal</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive Example */}
      {showExamples && !compactView && (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <CardTitle className="text-center text-blue-900">Real Example: $100 Fitness Challenge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Scenario Setup */}
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-800">Challenge Setup</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 100 participants</li>
                  <li>• Each stakes $100</li>
                  <li>• 60 people complete (60%)</li>
                  <li>• 40 people fail (40%)</li>
                </ul>
              </div>

              {/* Money Flow */}
              <div className="space-y-3">
                <h4 className="font-semibold text-orange-800">Money Flow</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Entry fees: $500 (to Stakr)</li>
                  <li>• Failed stakes: $4,000</li>
                  <li>• Stakr's cut: $800 (20%)</li>
                  <li>• Winners' bonus: $3,200 (80%)</li>
                </ul>
              </div>

              {/* Final Results */}
              <div className="space-y-3">
                <h4 className="font-semibold text-green-800">Results</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Each winner gets: $100 + $53.33</li>
                  <li>• <strong>Winner total: $153.33</strong></li>
                  <li>• Stakr revenue: $1,300</li>
                  <li>• Platform revenue: 13%</li>
                </ul>
              </div>
            </div>

            <Separator />

            <div className="text-center space-y-2">
              <p className="font-semibold text-blue-900">
                Complete your challenges = You make money. We make money. Everyone wins!
              </p>
              <p className="text-sm text-blue-600">
                Our incentives are perfectly aligned with your success.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Fees Disclosure */}
      {!compactView && (
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Additional Fee Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Optional Add-ons:</h4>
                <ul className="space-y-1">
                  <li>• <strong>Insurance:</strong> $1 per challenge (stake protection)</li>
                  <li>• <strong>Premium features:</strong> $9.99/month (cancel anytime)</li>
                  <li>• <strong>Priority support:</strong> Included with premium</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">No Hidden Fees:</h4>
                <ul className="space-y-1">
                  <li>• No setup or account fees</li>
                  <li>• No fees for keeping credits</li>
                  <li>• No fees for challenge creation</li>
                  <li>• No foreign transaction fees</li>
                </ul>
              </div>
            </div>
            
            <Separator />
            
            <div className="text-center">
              <p className="font-medium">
                💡 <strong>Pro Tip:</strong> Keep your winnings as credits to avoid cashout fees and compound your success!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trust Statement */}
      <div className="text-center space-y-2 py-4">
        <p className="text-sm text-muted-foreground">
          <strong>Our Promise:</strong> These fees will never change without 30 days notice.
        </p>
        <p className="text-xs text-muted-foreground">
          Questions about our pricing? <a href="mailto:support@stakr.app" className="text-blue-600 hover:underline">Contact our support team</a>
        </p>
      </div>
    </div>
  )
} 