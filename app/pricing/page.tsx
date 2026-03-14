"use client"

import { PricingTransparency } from "@/components/pricing-transparency"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calculator, HelpCircle, MessageCircle } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { FloatingAmbientGlows } from '@/components/floating-ambient-glows'

export default function PricingPage() {
  const [stakeAmount, setStakeAmount] = useState(100)
  const [includeInsurance, setIncludeInsurance] = useState(true)
  
  const entryFee = stakeAmount * 0.05
  const insuranceFee = includeInsurance ? 1 : 0
  const totalCost = stakeAmount + entryFee + insuranceFee
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1920&q=80" 
          alt="Background"
          className="w-full h-full object-cover grayscale-[30%] dark:grayscale-[50%]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/70 to-white/80 dark:from-black/80 dark:via-black/70 dark:to-black/80"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black via-transparent to-white/50 dark:to-black/50"></div>
      </div>

      {/* Ambient Glows */}
      <FloatingAmbientGlows />

      {/* Noise Texture */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <div className="relative z-10 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Stakr
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
                  Transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F46036] to-[#D74E25]">Pricing</span>
                </h1>
                <p className="text-slate-600 dark:text-slate-400 font-body">Complete breakdown of all fees and costs</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">
                No Hidden Fees
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                100% Transparent
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Fee Calculator */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
          
          <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border-2 border-[#F46036]/20 dark:border-[#F46036]/30 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <div className="relative">
              <div className="p-6 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#F46036] to-[#D74E25] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">Fee Calculator</h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Input Controls */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-heading font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider mb-3">
                        Your Stake Amount
                      </label>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-heading font-bold text-slate-900 dark:text-white">$</span>
                        <input
                          type="range"
                          min="10"
                          max="1000"
                          step="10"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(Number(e.target.value))}
                          className="flex-1 h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-[#F46036] [&::-webkit-slider-thumb]:to-[#D74E25] [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-orange-500/20"
                        />
                        <input
                          type="number"
                          min="10"
                          max="1000"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(Number(e.target.value))}
                          className="w-24 px-3 py-2 bg-slate-100/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg text-center font-heading font-bold text-slate-900 dark:text-white focus:border-[#F46036] focus:ring-2 focus:ring-[#F46036]/20 backdrop-blur-sm transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-slate-100/50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl p-4">
                      <input
                        type="checkbox"
                        id="insurance"
                        checked={includeInsurance}
                        onChange={(e) => setIncludeInsurance(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 dark:border-white/10 text-[#F46036] focus:ring-2 focus:ring-[#F46036]/20"
                      />
                      <label htmlFor="insurance" className="text-sm font-body text-slate-700 dark:text-slate-300 cursor-pointer">
                        Add $1 insurance (recommended)
                      </label>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="bg-slate-100/50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl p-6 space-y-4">
                    <h4 className="text-sm font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">Your Total Cost:</h4>
                    <div className="space-y-3 text-sm font-body">
                      <div className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>Stake amount:</span>
                        <span className="font-mono font-bold">${stakeAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-blue-600 dark:text-blue-400">
                        <span>Platform fee (5%):</span>
                        <span className="font-mono font-bold">+${entryFee.toFixed(2)}</span>
                      </div>
                      {includeInsurance && (
                        <div className="flex justify-between text-purple-600 dark:text-purple-400">
                          <span>Insurance:</span>
                          <span className="font-mono font-bold">+${insuranceFee.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-slate-200 dark:border-white/10 pt-3 flex justify-between text-lg">
                        <span className="font-heading font-bold text-slate-900 dark:text-white">Total you pay:</span>
                        <span className="font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F46036] to-[#D74E25]">${totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 backdrop-blur-sm rounded-xl">
                      <p className="text-sm text-green-700 dark:text-green-300 font-body">
                        <strong className="font-heading">If you complete the challenge:</strong> You get your ${stakeAmount} stake back 
                        + a share of failed stakes (typically 15-30% bonus)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Pricing Component */}
        <PricingTransparency variant="full" showExamples={true} />

        {/* FAQ Section */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-2xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500"></div>
          
          <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <div className="relative">
              <div className="p-6 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  </div>
                  <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">Frequently Asked Questions</h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl p-4">
                      <h4 className="font-heading font-bold text-slate-900 dark:text-white mb-2">Why do you charge an entry fee?</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-body">
                        The 5% entry fee covers platform operations, payment processing, 
                        fraud prevention, and continuous development. It's comparable to 
                        credit card processing fees but enables our unique reward system.
                      </p>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl p-4">
                      <h4 className="font-heading font-bold text-slate-900 dark:text-white mb-2">Is the 20% cut from failed stakes fair?</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-body">
                        Yes! This only applies if you don't complete the challenge. Winners 
                        still get 80% of failed stakes shared among them. This model incentivizes 
                        completion while funding platform sustainability.
                      </p>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl p-4">
                      <h4 className="font-heading font-bold text-slate-900 dark:text-white mb-2">Can fees change?</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-body">
                        We promise 30 days advance notice for any fee changes. Our current 
                        fees are designed to be sustainable long-term, so changes would be rare.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl p-4">
                      <h4 className="font-heading font-bold text-slate-900 dark:text-white mb-2">What's included with premium?</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-body">
                        Premium gives you advanced analytics, custom rewards from hosts, 
                        exclusive community features, and priority support. It doesn't 
                        affect your success chances - just enhances your experience.
                      </p>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl p-4">
                      <h4 className="font-heading font-bold text-slate-900 dark:text-white mb-2">Why is there a cashout fee?</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-body">
                        The 3% cashout fee covers bank transfer costs and encourages users 
                        to reinvest winnings into new challenges (compounding success). 
                        No fee to keep credits in your account.
                      </p>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl p-4">
                      <h4 className="font-heading font-bold text-slate-900 dark:text-white mb-2">Are there any hidden fees?</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-body">
                        <strong className="text-slate-900 dark:text-white">Absolutely not.</strong> What you see here is everything. 
                        No setup fees, account fees, or surprise charges. We believe 
                        transparency builds trust.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
          
          <div className="relative bg-blue-500/10 dark:bg-blue-500/5 backdrop-blur-2xl border border-blue-500/20 dark:border-blue-500/30 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <div className="relative text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-2">Questions About Pricing?</h3>
              <p className="text-slate-600 dark:text-slate-400 font-body mb-6 max-w-md mx-auto">
                Our team is here to help explain any aspect of our pricing model.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button 
                  variant="outline" 
                  asChild
                  size="lg"
                  className="h-12 bg-white/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-white hover:bg-white dark:hover:bg-white/10 backdrop-blur-sm transition-all duration-300 font-heading font-medium"
                >
                  <a href="mailto:support@stakr.app">Email Support</a>
                </Button>
                <Button 
                  asChild
                  size="lg"
                  className="h-12 bg-gradient-to-r from-[#F46036] to-[#D74E25] hover:from-[#ff724c] hover:to-[#e85a30] text-white font-heading font-bold shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-[1.02] rounded-xl"
                >
                  <Link href="/discover">Browse Challenges</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
