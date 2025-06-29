"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Clock, Calendar, DollarSign, CheckCircle, XCircle } from "lucide-react"

export default function MyChallengesPage() {
  const { data: session, status } = useSession()
  const [selectedTab, setSelectedTab] = useState("active")
  const [loading, setLoading] = useState(true)
  const [allChallenges, setAllChallenges] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalChallenges: 0,
    activeChallenges: 0,
    completedChallenges: 0,
    failedChallenges: 0,
    successRate: 0,
    totalStaked: 0,
    totalWinnings: 0,
    totalLost: 0,
    currentStreak: 0,
    longestStreak: 0,
  })

  // Load user's challenges
  useEffect(() => {
    if (session?.user) {
      loadUserChallenges()
    }
  }, [session])

  const loadUserChallenges = async () => {
    try {
      setLoading(true)
      
      // Load all challenges
      const allResponse = await fetch('/api/user/challenges?status=all')
      const allData = await allResponse.json()
      
      if (allData.success) {
        setAllChallenges(allData.challenges)
        
        // Calculate stats from challenges
        const active = allData.challenges.filter((c: any) => c.completionStatus === 'active')
        const completed = allData.challenges.filter((c: any) => c.completionStatus === 'completed')
        const failed = allData.challenges.filter((c: any) => c.completionStatus === 'failed')
        
        const totalStaked = allData.challenges.reduce((sum: number, c: any) => sum + (c.stakeAmount || 0), 0)
        const totalWinnings = completed.reduce((sum: number, c: any) => sum + (c.rewardEarned || 0), 0)
        const totalLost = failed.reduce((sum: number, c: any) => sum + (c.stakeAmount || 0), 0)
        
        setStats({
          totalChallenges: allData.challenges.length,
          activeChallenges: active.length,
          completedChallenges: completed.length,
          failedChallenges: failed.length,
          successRate: allData.challenges.length > 0 ? Math.round((completed.length / allData.challenges.length) * 100) : 0,
          totalStaked,
          totalWinnings,
          totalLost,
          currentStreak: session?.user?.currentStreak || 0,
          longestStreak: session?.user?.longestStreak || 0,
        })
      }
    } catch (error) {
      console.error('Failed to load challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeLeft = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diff = deadlineDate.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    return hours > 0 ? `${hours}h left` : 'Due now'
  }

  const getFilteredChallenges = (status: string) => {
    switch (status) {
      case 'active':
        return allChallenges.filter(c => c.completionStatus === 'active')
      case 'completed':
        return allChallenges.filter(c => c.completionStatus === 'completed')
      case 'failed':
        return allChallenges.filter(c => c.completionStatus === 'failed')
      default:
        return allChallenges
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your challenges...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Please Sign In</h1>
          <p className="text-muted-foreground">You need to be logged in to view your challenges</p>
        </div>
      </div>
    )
  }

  const activeChallenges = getFilteredChallenges('active')
  const completedChallenges = getFilteredChallenges('completed')
  const failedChallenges = getFilteredChallenges('failed')

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Challenges</h1>
          <p className="text-muted-foreground">Track your progress and manage your active challenges</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.activeChallenges}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completedChallenges}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.successRate}%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary">${stats.totalWinnings.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Won</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.currentStreak}</div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.longestStreak}</div>
              <div className="text-sm text-muted-foreground">Best Streak</div>
            </CardContent>
          </Card>
        </div>

        {/* Challenge Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Active ({stats.activeChallenges})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed ({stats.completedChallenges})
            </TabsTrigger>
            <TabsTrigger value="failed" className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Failed ({stats.failedChallenges})
            </TabsTrigger>
          </TabsList>

          {/* Active Challenges */}
          <TabsContent value="active" className="space-y-6">
            {activeChallenges.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="space-y-4">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium">No Active Challenges</h3>
                  <p className="text-muted-foreground">
                    Join your first challenge to start building better habits!
                  </p>
                  <Button onClick={() => window.location.href = '/discover'}>
                    Browse Challenges
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeChallenges.map((challenge) => (
                  <Card key={challenge.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Challenge Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold mb-2">{challenge.title}</h3>
                              <p className="text-muted-foreground mb-3">{challenge.description}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <Badge variant="secondary">{challenge.category}</Badge>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {challenge.daysRemaining || 0} days left
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />${challenge.stakeAmount} staked
                                </span>
                              </div>
                            </div>
                            <Badge variant="default" className="bg-primary">
                              {challenge.progress || 0}% Complete
                            </Badge>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span>Progress</span>
                              <span>{challenge.progress || 0}%</span>
                            </div>
                            <Progress value={challenge.progress || 0} className="h-2" />
                          </div>

                          {/* Stats Row */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="font-semibold text-orange-600">{challenge.currentStreak || 0}</div>
                              <div className="text-muted-foreground">Current Streak</div>
                            </div>
                            <div>
                              <div className="font-semibold text-green-600">${challenge.potentialWinnings || (challenge.stakeAmount * 1.5).toFixed(2)}</div>
                              <div className="text-muted-foreground">Potential Win</div>
                            </div>
                            <div>
                              <div className="font-semibold text-primary">
                                {challenge.nextDeadline ? formatTimeLeft(challenge.nextDeadline) : 'Soon'}
                              </div>
                              <div className="text-muted-foreground">Next Check-in</div>
                            </div>
                            <div>
                              <div className="font-semibold">{challenge.participants || challenge.totalParticipants || 0}</div>
                              <div className="text-muted-foreground">Participants</div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 lg:w-48">
                          <Button className="w-full">Submit Proof</Button>
                          <Button variant="outline" className="w-full bg-transparent" onClick={() => window.location.href = `/challenge/${challenge.id}`}>
                            View Details
                          </Button>
                          <Button variant="ghost" className="w-full text-red-600 hover:text-red-700">
                            Quit Challenge
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Challenges */}
          <TabsContent value="completed" className="space-y-6">
            {completedChallenges.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="space-y-4">
                  <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium">No Completed Challenges Yet</h3>
                  <p className="text-muted-foreground">
                    Complete your first challenge to see your achievements here!
                  </p>
                  <Button onClick={() => window.location.href = '/discover'}>
                    Find Challenges
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedChallenges.map((challenge) => (
                  <Card key={challenge.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold mb-2">{challenge.title}</h3>
                              <p className="text-muted-foreground mb-3">{challenge.description}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <Badge variant="secondary">{challenge.category}</Badge>
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  Completed {challenge.completedAt ? new Date(challenge.completedAt).toLocaleDateString() : 'Recently'}
                                </span>
                              </div>
                            </div>
                            <Badge variant="default" className="bg-green-600">
                              Success!
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="font-semibold text-primary">${challenge.stakeAmount}</div>
                              <div className="text-muted-foreground">Amount Staked</div>
                            </div>
                            <div>
                              <div className="font-semibold text-green-600">${challenge.rewardEarned || (challenge.stakeAmount * 1.5).toFixed(2)}</div>
                              <div className="text-muted-foreground">Winnings</div>
                            </div>
                            <div>
                              <div className="font-semibold">{challenge.participants || challenge.totalParticipants || 0}</div>
                              <div className="text-muted-foreground">Participants</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:w-48">
                          <Button variant="outline" className="w-full bg-transparent" onClick={() => window.location.href = `/challenge/${challenge.id}`}>
                            View Details
                          </Button>
                          <Button variant="ghost" className="w-full">
                            Share Success
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Failed Challenges */}
          <TabsContent value="failed" className="space-y-6">
            {failedChallenges.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="space-y-4">
                  <XCircle className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium">No Failed Challenges</h3>
                  <p className="text-muted-foreground">
                    Keep up the great work! Your consistency is paying off.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {failedChallenges.map((challenge) => (
                  <Card key={challenge.id} className="border-l-4 border-l-red-500">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold mb-2">{challenge.title}</h3>
                              <p className="text-muted-foreground mb-3">{challenge.description}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <Badge variant="secondary">{challenge.category}</Badge>
                                <span className="flex items-center gap-1 text-red-600">
                                  <XCircle className="w-4 h-4" />
                                  Failed {challenge.failedAt ? new Date(challenge.failedAt).toLocaleDateString() : 'Recently'}
                                </span>
                              </div>
                            </div>
                            <Badge variant="destructive">{challenge.progress || 0}% Complete</Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="font-semibold text-primary">${challenge.stakeAmount}</div>
                              <div className="text-muted-foreground">Amount Staked</div>
                            </div>
                            <div>
                              <div className="font-semibold text-red-600">-${challenge.stakeAmount}</div>
                              <div className="text-muted-foreground">Amount Lost</div>
                            </div>
                            <div>
                              <div className="font-semibold">{challenge.participants || challenge.totalParticipants || 0}</div>
                              <div className="text-muted-foreground">Participants</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:w-48">
                          <Button variant="outline" className="w-full bg-transparent" onClick={() => window.location.href = `/challenge/${challenge.id}`}>
                            View Details
                          </Button>
                          <Button variant="ghost" className="w-full">
                            Try Again
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
