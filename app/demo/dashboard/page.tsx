"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDemoMode } from '@/lib/demo-mode'
import { Eye, AlertTriangle } from 'lucide-react'

// Demo Mode Indicator Component
function DemoModeIndicator() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-blue-900">🎭 Demo Mode Active</span>
        </div>
        <Badge variant="secondary">Populated Sample Data</Badge>
      </div>
      <p className="text-sm text-blue-700 mt-2">
        This page shows how Stakr looks with active users and challenges. All data is for demonstration purposes.
      </p>
      <div className="flex gap-2 mt-3">
        <Button size="sm" variant="outline" onClick={() => window.open('/dashboard', '_blank')}>
          <AlertTriangle className="w-4 h-4 mr-2" />
          View Real Dashboard
        </Button>
        <Button size="sm" variant="outline" onClick={() => window.open('/discover', '_blank')}>
          Browse Real Challenges
        </Button>
      </div>
    </div>
  )
}

export default function DemoDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [challenges, setChallenges] = useState<any[]>([])
  const { isDemoMode } = useDemoMode()

  useEffect(() => {
    // Fetch demo dashboard data
    fetch('/api/user/dashboard?demo=true')
      .then(res => res.json())
      .then(data => setDashboardData(data))
      .catch(err => console.error('Failed to load demo dashboard:', err))

    // Fetch demo challenges  
    fetch('/api/challenges?demo=true&limit=6')
      .then(res => res.json())
      .then(data => setChallenges(data.challenges || []))
      .catch(err => console.error('Failed to load demo challenges:', err))
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Demo Mode Indicator */}
      <DemoModeIndicator />

      {/* Demo Dashboard Content */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Welcome back, Demo User! 👋</h1>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {isDemoMode ? 'Demo Data' : 'Live Data'} ✓
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">+1 from last week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2,450</div>
              <p className="text-xs text-muted-foreground">+$150 this week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground">Above average!</p>
            </CardContent>
          </Card>
        </div>

        {/* Popular Challenges */}
        <Card>
          <CardHeader>
            <CardTitle>Trending Demo Challenges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {challenges.map((challenge, index) => (
                <Card key={challenge.id || index} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <h3 className="font-bold text-lg mb-2">{challenge.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {challenge.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{challenge.category}</Badge>
                      <span className="text-sm font-medium">
                        {challenge.participants_count} participants
                      </span>
                    </div>
                    <div className="mt-3 text-sm">
                      <span className="font-medium">Pool: ${challenge.total_stake_pool}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Demo Features Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Demo Features Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">✅ Working Features:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Challenge creation and discovery</li>
                  <li>• User dashboard with live stats</li>
                  <li>• Social features (feed, follows, likes)</li>
                  <li>• Reward calculation system</li>
                  <li>• Admin dashboard and analytics</li>
                  <li>• File upload and verification</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">🔧 Demo Access Methods:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <code>/demo/*</code> routes (always demo)</li>
                  <li>• <code>?demo=true</code> in development</li>
                  <li>• <code>?preview=demo</code> for admins</li>
                  <li>• Safe separation from real users</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold">Ready to try the real thing?</h3>
              <p className="text-muted-foreground">
                Experience Stakr with real challenges and start building better habits today.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => window.open('/auth/signin', '_blank')}>
                  Sign Up Free
                </Button>
                <Button variant="outline" onClick={() => window.open('/discover', '_blank')}>
                  Browse Real Challenges
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
