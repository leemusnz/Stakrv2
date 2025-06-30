'use client'

import { ProofSubmission } from '@/components/proof-submission'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Zap, Shield, Clock, Award, Hand, Volume2, Eye, Target } from 'lucide-react'

export default function ProofDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-yellow-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Enhanced Anti-Cheat Demo
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience Stakr's revolutionary verification system with real-time gesture and word verification
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                <Shield className="h-5 w-5" />
                Anti-Cheating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Virtually impossible to fake with specific gestures and spoken words required in real-time.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Hand className="h-5 w-5" />
                Gesture Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Hold up specific fingers, make peace signs, touch your nose - all verified in real-time.
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Volume2 className="h-5 w-5" />
                Word Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Say specific words like "giraffe" or "elephant" with pronunciation guides provided.
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <Target className="h-5 w-5" />
                Smart Difficulty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Adaptive difficulty levels with bonus points for complex gestures and harder words.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Demo: 30-Day Fitness Challenge</CardTitle>
                <CardDescription className="text-base mt-2">
                  Complete 45 minutes of exercise daily with enhanced gesture and word verification
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  <Hand className="h-3 w-3 mr-1" />
                  Gesture Verify
                </Badge>
                <Badge variant="secondary">
                  <Volume2 className="h-3 w-3 mr-1" />
                  Word Verify
                </Badge>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  Timer Required
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Hand className="h-4 w-4" />
                  Example Gesture Verifications
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center gap-2 mb-1">
                      <Hand className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Hold Up 3 Fingers</span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      "Take a photo holding up 3 fingers with your right hand and keep them visible for 3 seconds"
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
                    <div className="flex items-center gap-2 mb-1">
                      <Hand className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Peace Sign</span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      "Take a video making a peace sign (V fingers) with your left hand"
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900 rounded-lg border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center gap-2 mb-1">
                      <Hand className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Touch Nose</span>
                    </div>
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      "Take a photo touching your nose with your right index finger"
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Example Word Verifications
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-orange-50 dark:bg-orange-900 rounded-lg border border-orange-200 dark:border-orange-700">
                    <div className="flex items-center gap-2 mb-1">
                      <Volume2 className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-lg">"Giraffe"</span>
                    </div>
                    <p className="text-xs text-orange-700 dark:text-orange-300">
                      Pronunciation: juh-RAF • Difficulty: ⭐
                    </p>
                  </div>
                  <div className="p-3 bg-teal-50 dark:bg-teal-900 rounded-lg border border-teal-200 dark:border-teal-700">
                    <div className="flex items-center gap-2 mb-1">
                      <Volume2 className="h-4 w-4 text-teal-600" />
                      <span className="font-medium text-lg">"Serendipity"</span>
                    </div>
                    <p className="text-xs text-teal-700 dark:text-teal-300">
                      Pronunciation: ser-uhn-DIP-i-tee • Difficulty: ⭐⭐⭐⭐
                    </p>
                  </div>
                  <div className="p-3 bg-pink-50 dark:bg-pink-900 rounded-lg border border-pink-200 dark:border-pink-700">
                    <div className="flex items-center gap-2 mb-1">
                      <Volume2 className="h-4 w-4 text-pink-600" />
                      <span className="font-medium text-lg">"Perseverance"</span>
                    </div>
                    <p className="text-xs text-pink-700 dark:text-pink-300">
                      Pronunciation: pur-suh-VEER-uhns • Difficulty: ⭐⭐⭐⭐
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revolutionary Features */}
        <Card className="mb-8 border-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              Why This Is Revolutionary
            </CardTitle>
            <CardDescription>
              No other platform has real-time gesture and word verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-red-600">❌ Traditional Platforms</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Submit any photo after activity</li>
                  <li>• Easy to use old photos</li>
                  <li>• Can fake location data</li>
                  <li>• No real-time verification</li>
                  <li>• Honor system only</li>
                  <li>• High potential for cheating</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-green-600">✅ Stakr's Enhanced System</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    Specific gestures required in real-time
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    Spoken words with pronunciation verification
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    Unpredictable timing prevents preparation
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    60-second response window
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    Difficulty-based quality scoring
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    Virtually impossible to cheat
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Try the Enhanced System</h2>
            <p className="text-muted-foreground">
              Start a timed session and experience gesture & word verification
            </p>
          </div>

          <ProofSubmission
            challengeId="demo-fitness-challenge"
            challengeName="30-Day Fitness Challenge"
            challengeType="fitness"
            proofRequirements={{
              types: ['photo', 'text', 'measurement'],
              description: "Submit proof of your workout with enhanced anti-cheat verification including gesture and word challenges during timed sessions.",
              timer_required: true,
              random_checkins: true,
              min_duration: 15,
              max_duration: 120
            }}
            onSubmissionComplete={(data) => console.log('Proof submitted:', data)}
          />
        </div>

        {/* Impact Statement */}
        <Card className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardContent className="p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">The Future of Accountability Platforms</h3>
              <p className="text-lg opacity-90 max-w-3xl mx-auto">
                With gesture and word verification, Stakr creates an environment where genuine effort is the only path to success. 
                This isn't just anti-cheating - it's about building authentic accountability that truly helps people achieve their goals.
              </p>
              <div className="flex items-center justify-center gap-8 mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span>99.9% Cheat-Proof</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  <span>Real-Time Verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  <span>Authentic Achievement</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
