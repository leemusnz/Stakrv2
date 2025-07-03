"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SwipeableTabs } from "@/components/ui/swipeable-tabs"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { Progress } from "@/components/ui/progress"
import { Clock, Calendar, DollarSign, CheckCircle, XCircle, MessageSquare, Plus } from "lucide-react"
import { VerificationAppealModal } from "@/components/verification-appeal-modal"
import { ChallengeAnalyticsModal } from "@/components/challenge-analytics-modal"
import { toast } from "sonner"

export default function MyChallengesPage() {
  const { isMobile } = useEnhancedMobile()
  const { data: session, status } = useSession()
  const [selectedTab, setSelectedTab] = useState("active")
  const [loading, setLoading] = useState(true)
  const [allChallenges, setAllChallenges] = useState<any[]>([])
  const [hostedChallenges, setHostedChallenges] = useState<any[]>([])
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

      // Load hosted challenges
      await loadHostedChallenges()
    } catch (error) {
      console.error('Failed to load challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHostedChallenges = async () => {
    try {
      const response = await fetch('/api/user/hosted-challenges')
      const data = await response.json()
      
      if (data.success) {
        setHostedChallenges(data.challenges)
      }
    } catch (error) {
      console.error('Failed to load hosted challenges:', error)
      // For now, show empty state
      setHostedChallenges([])
    }
  }

  const handleEditChallenge = (challengeId: string) => {
    // For now, show a notification that editing will be available soon
    toast.info('Edit functionality coming soon! You\'ll be able to modify challenge details before it starts.')
  }

  const handleDeleteChallenge = async (challengeId: string, challengeTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${challengeTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Challenge deleted successfully!')
        await loadHostedChallenges() // Refresh the list
      } else {
        toast.error(`Failed to delete challenge: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to delete challenge:', error)
      toast.error('Failed to delete challenge. Please try again.')
    }
  }

  const handleStartChallenge = async (challengeId: string, challengeTitle: string) => {
    if (!confirm(`Are you ready to start "${challengeTitle}"? Once started, participants can begin submitting proofs.`)) {
      return
    }

    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start' }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Challenge started successfully! Participants can now begin.')
        await loadHostedChallenges() // Refresh the list
      } else {
        toast.error(`Failed to start challenge: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to start challenge:', error)
      toast.error('Failed to start challenge. Please try again.')
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
        {isMobile ? (
          <SwipeableTabs
            defaultValue="active"
            value={selectedTab}
            onValueChange={setSelectedTab}
            tabs={[
              {
                value: "active",
                label: `Active (${stats.activeChallenges})`,
                content: (
                  <div className="space-y-6">
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
                  </div>
                )
              },
              {
                value: "hosted",
                label: "My Hosted",
                content: (
                  <div className="space-y-6">
                    {hostedChallenges.length === 0 ? (
                      <Card className="p-8 text-center">
                        <div className="space-y-4">
                          <Plus className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                          <h3 className="text-lg font-medium">No Hosted Challenges</h3>
                          <p className="text-muted-foreground">
                            Create your first challenge to help others build better habits!
                          </p>
                          <Button onClick={() => window.location.href = '/create-challenge'}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Challenge
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {hostedChallenges.map((challenge) => {
                          const challengeStarted = new Date(challenge.start_date) <= new Date()
                          const canEdit = !challengeStarted && challenge.status === 'pending'
                          const canManualStart = challenge.status === 'pending' && challenge.start_date_type === 'manual' && !challengeStarted
                          
                          return (
                            <Card key={challenge.id} className="border-l-4 border-l-secondary">
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
                                          <Badge variant={challenge.status === 'pending' ? 'default' : challenge.status === 'active' ? 'secondary' : 'outline'}>
                                            {challenge.status}
                                          </Badge>
                                          <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            Starts {new Date(challenge.start_date).toLocaleDateString()}
                                          </span>
                                          {challenge.allow_points_only ? (
                                            <Badge variant="outline" className="text-yellow-600">Points Only</Badge>
                                          ) : (
                                            <span className="flex items-center gap-1">
                                              <DollarSign className="w-4 h-4" />
                                              ${challenge.min_stake} - ${challenge.max_stake}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Challenge Stats */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <div className="font-semibold text-primary">{challenge.current_participants || 0}</div>
                                        <div className="text-muted-foreground">Participants</div>
                                      </div>
                                      <div>
                                        <div className="font-semibold text-secondary">{challenge.duration}</div>
                                        <div className="text-muted-foreground">Duration</div>
                                      </div>
                                      <div>
                                        <div className="font-semibold text-orange-600">{challenge.difficulty}</div>
                                        <div className="text-muted-foreground">Difficulty</div>
                                      </div>
                                      <div>
                                        <div className="font-semibold">{challenge.privacy_type}</div>
                                        <div className="text-muted-foreground">Privacy</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex flex-col gap-2 lg:w-48">
                                    <Button variant="outline" className="w-full" onClick={() => window.location.href = `/challenge/${challenge.id}`}>
                                      View Challenge
                                    </Button>
                                    
                                    {canEdit ? (
                                      <>
                                        {canManualStart && (
                                          <Button 
                                            className="w-full bg-green-600 hover:bg-green-700"
                                            onClick={() => handleStartChallenge(challenge.id, challenge.title)}
                                          >
                                            🚀 Start Challenge
                                          </Button>
                                        )}
                                        <Button 
                                          className="w-full bg-blue-600 hover:bg-blue-700"
                                          onClick={() => handleEditChallenge(challenge.id)}
                                        >
                                          ✏️ Edit Challenge
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          className="w-full text-red-600 border-red-300 hover:bg-red-50"
                                          onClick={() => handleDeleteChallenge(challenge.id, challenge.title)}
                                        >
                                          🗑️ Delete
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button variant="outline" className="w-full" disabled>
                                          {challengeStarted ? '🔒 Challenge Started' : '🔒 Cannot Edit'}
                                        </Button>
                                        <ChallengeAnalyticsModal
                                          challengeId={challenge.id}
                                          challengeTitle={challenge.title}
                                          trigger={
                                            <Button variant="ghost" className="w-full">
                                              📊 View Analytics
                                            </Button>
                                          }
                                        />
                                      </>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              },
              {
                value: "completed",
                label: `Completed (${stats.completedChallenges})`,
                content: (
                  <div className="space-y-6">
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
                  </div>
                )
              },
              {
                value: "failed",
                label: `Failed (${stats.failedChallenges})`,
                content: (
                  <div className="space-y-6">
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
                                        {challenge.rejectedVerification && (
                                          <Badge variant="destructive" className="text-xs">
                                            Verification Rejected
                                          </Badge>
                                        )}
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
                  </div>
                )
              }
            ]}
            tabsListClassName="grid-cols-4"
          />
        ) : (
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Active ({stats.activeChallenges})
              </TabsTrigger>
              <TabsTrigger value="hosted" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                My Hosted
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

          {/* Hosted Challenges */}
          <TabsContent value="hosted" className="space-y-6">
            {hostedChallenges.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="space-y-4">
                  <Plus className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium">No Hosted Challenges</h3>
                  <p className="text-muted-foreground">
                    Create your first challenge to help others build better habits!
                  </p>
                  <Button onClick={() => window.location.href = '/create-challenge'}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Challenge
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {hostedChallenges.map((challenge) => {
                  const challengeStarted = new Date(challenge.start_date) <= new Date()
                  const canEdit = !challengeStarted && challenge.status === 'pending'
                  const canManualStart = challenge.status === 'pending' && challenge.start_date_type === 'manual' && !challengeStarted
                  
                  return (
                    <Card key={challenge.id} className="border-l-4 border-l-secondary">
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
                                  <Badge variant={challenge.status === 'pending' ? 'default' : challenge.status === 'active' ? 'secondary' : 'outline'}>
                                    {challenge.status}
                                  </Badge>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Starts {new Date(challenge.start_date).toLocaleDateString()}
                                  </span>
                                  {challenge.allow_points_only ? (
                                    <Badge variant="outline" className="text-yellow-600">Points Only</Badge>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="w-4 h-4" />
                                      ${challenge.min_stake} - ${challenge.max_stake}
                                    </span>
                                  )}
                                  {canEdit && (
                                    <Badge variant="outline" className="text-green-600 border-green-300">
                                      ✏️ Editable
                                    </Badge>
                                  )}
                                  {canManualStart && (
                                    <Badge variant="outline" className="text-blue-600 border-blue-300">
                                      🎯 Ready to Start
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Challenge Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="font-semibold text-primary">{challenge.current_participants || 0}</div>
                                <div className="text-muted-foreground">Participants</div>
                              </div>
                              <div>
                                <div className="font-semibold text-secondary">{challenge.duration}</div>
                                <div className="text-muted-foreground">Duration</div>
                              </div>
                              <div>
                                <div className="font-semibold text-orange-600">{challenge.difficulty}</div>
                                <div className="text-muted-foreground">Difficulty</div>
                              </div>
                              <div>
                                <div className="font-semibold">{challenge.privacy_type}</div>
                                <div className="text-muted-foreground">Privacy</div>
                              </div>
                            </div>

                            {/* Challenge Features */}
                            {(challenge.require_timer || challenge.random_checkin_enabled || challenge.enable_team_mode) && (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {challenge.require_timer && (
                                  <Badge variant="outline" className="text-blue-600">
                                    🕒 Timer Required
                                  </Badge>
                                )}
                                {challenge.random_checkin_enabled && (
                                  <Badge variant="outline" className="text-yellow-600">
                                    ⚡ Anti-Cheat Verification
                                  </Badge>
                                )}
                                {challenge.enable_team_mode && (
                                  <Badge variant="outline" className="text-purple-600">
                                    👥 Team Challenge
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 lg:w-48">
                            <Button variant="outline" className="w-full" onClick={() => window.location.href = `/challenge/${challenge.id}`}>
                              View Challenge
                            </Button>
                            
                            {canEdit ? (
                              <>
                                {canManualStart && (
                                  <Button 
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    onClick={() => handleStartChallenge(challenge.id, challenge.title)}
                                  >
                                    🚀 Start Challenge
                                  </Button>
                                )}
                                <Button 
                                  className="w-full bg-blue-600 hover:bg-blue-700"
                                  onClick={() => handleEditChallenge(challenge.id)}
                                >
                                  ✏️ Edit Challenge
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className="w-full text-red-600 border-red-300 hover:bg-red-50"
                                  onClick={() => handleDeleteChallenge(challenge.id, challenge.title)}
                                >
                                  🗑️ Delete
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button variant="outline" className="w-full" disabled>
                                  {challengeStarted ? '🔒 Challenge Started' : '🔒 Cannot Edit'}
                                </Button>
                                <ChallengeAnalyticsModal
                                  challengeId={challenge.id}
                                  challengeTitle={challenge.title}
                                  trigger={
                                    <Button variant="ghost" className="w-full">
                                      📊 View Analytics
                                    </Button>
                                  }
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
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
                                {challenge.rejectedVerification && (
                                  <Badge variant="destructive" className="text-xs">
                                    Verification Rejected
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge variant="destructive">{challenge.progress || 0}% Complete</Badge>
                          </div>

                          {/* Show rejection reason if available */}
                          {challenge.rejectedVerification && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <h4 className="text-sm font-medium text-red-800 mb-1">Verification Rejected:</h4>
                              <p className="text-xs text-red-700">
                                {challenge.rejectedVerification.reason || 'Your submitted proof did not meet the challenge requirements.'}
                              </p>
                              <p className="text-xs text-red-600 mt-1">
                                Rejected on {new Date(challenge.rejectedVerification.rejectedAt || challenge.failedAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}

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
                          
                          {/* Appeal Button for rejected verifications */}
                          {challenge.rejectedVerification && !challenge.rejectedVerification.appealSubmitted && (
                            <VerificationAppealModal
                              verification={{
                                id: challenge.rejectedVerification.id,
                                challengeTitle: challenge.title,
                                stakeAmount: challenge.stakeAmount,
                                rejectionReason: challenge.rejectedVerification.reason || 'Verification did not meet requirements',
                                rejectedAt: challenge.rejectedVerification.rejectedAt || challenge.failedAt
                              }}
                              trigger={
                                <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Appeal Decision
                                </Button>
                              }
                              onAppealSubmitted={loadUserChallenges}
                            />
                          )}
                          
                          {challenge.rejectedVerification?.appealSubmitted && (
                            <Button variant="outline" className="w-full" disabled>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Appeal Submitted
                            </Button>
                          )}
                          
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
        )}
      </div>
    </div>
  )
}
