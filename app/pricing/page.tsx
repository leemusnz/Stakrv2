"use client"

import { PricingTransparency } from "@/components/pricing-transparency"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calculator, HelpCircle, MessageCircle } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function PricingPage() {
  const [stakeAmount, setStakeAmount] = useState(100)
  const [includeInsurance, setIncludeInsurance] = useState(true)
  
  const entryFee = stakeAmount * 0.05
  const insuranceFee = includeInsurance ? 1 : 0
  const totalCost = stakeAmount + entryFee + insuranceFee
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Stakr
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Transparent Pricing</h1>
                <p className="text-muted-foreground">Complete breakdown of all fees and costs</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                No Hidden Fees
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                100% Transparent
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Fee Calculator */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Fee Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Input Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Stake Amount
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">$</span>
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      step="10"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(Number(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(Number(e.target.value))}
                      className="w-20 px-2 py-1 border rounded text-center"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="insurance"
                    checked={includeInsurance}
                    onChange={(e) => setIncludeInsurance(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="insurance" className="text-sm">
                    Add $1 insurance (recommended)
                  </label>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">Your Total Cost:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Stake amount:</span>
                    <span className="font-mono">${stakeAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>Platform fee (5%):</span>
                    <span className="font-mono">+${entryFee.toFixed(2)}</span>
                  </div>
                  {includeInsurance && (
                    <div className="flex justify-between text-purple-600">
                      <span>Insurance:</span>
                      <span className="font-mono">+${insuranceFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total you pay:</span>
                    <span className="font-mono text-primary">${totalCost.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-700">
                    <strong>If you complete the challenge:</strong> You get your ${stakeAmount} stake back 
                    + a share of failed stakes (typically 15-30% bonus)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Pricing Component */}
        <PricingTransparency variant="full" showExamples={true} />

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Why do you charge an entry fee?</h4>
                  <p className="text-sm text-muted-foreground">
                    The 5% entry fee covers platform operations, payment processing, 
                    fraud prevention, and continuous development. It's comparable to 
                    credit card processing fees but enables our unique reward system.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Is the 20% cut from failed stakes fair?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes! This only applies if you don't complete the challenge. Winners 
                    still get 80% of failed stakes shared among them. This model incentivizes 
                    completion while funding platform sustainability.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Can fees change?</h4>
                  <p className="text-sm text-muted-foreground">
                    We promise 30 days advance notice for any fee changes. Our current 
                    fees are designed to be sustainable long-term, so changes would be rare.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">What's included with premium?</h4>
                  <p className="text-sm text-muted-foreground">
                    Premium gives you advanced analytics, custom rewards from hosts, 
                    exclusive community features, and priority support. It doesn't 
                    affect your success chances - just enhances your experience.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Why is there a cashout fee?</h4>
                  <p className="text-sm text-muted-foreground">
                    The 3% cashout fee covers bank transfer costs and encourages users 
                    to reinvest winnings into new challenges (compounding success). 
                    No fee to keep credits in your account.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Are there any hidden fees?</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>Absolutely not.</strong> What you see here is everything. 
                    No setup fees, account fees, or surprise charges. We believe 
                    transparency builds trust.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="text-center p-6">
            <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-blue-900 mb-2">Questions About Pricing?</h3>
            <p className="text-blue-700 mb-4">
              Our team is here to help explain any aspect of our pricing model.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" asChild>
                <a href="mailto:support@stakr.app">Email Support</a>
              </Button>
              <Button asChild>
                <Link href="/discover">Browse Challenges</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 