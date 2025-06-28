"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Clock, Calendar, DollarSign, CheckCircle, XCircle } from "lucide-react"

// Mock user challenges data
const mockUserChallenges = {
  active: [
    {
      id: "1",
      title: "30-Day Morning Workout",
      description: "Start your day with energy! A progressive 30-day workout routine.",
      category: "Fitness",
      duration: "30 days",
      participants: 1247,
      minStake: 25,
      maxStake: 100,
      difficulty: "Medium",
      isJoined: true,
      isActive: true,
      progress: 67,
      daysLeft: 10,
      currentStreak: 20,
      stakeAmount: 50,
      potentialWinnings: 75,
      nextDeadline: "2024-01-16T06:00:00Z",
      creator: {
        name: "Sarah Mitchell",
        avatar: "/placeholder.svg?height=40&width=40",
        isVerified: true,
      },
    },
    {
      id: "2",
      title: "Daily Reading Challenge",
      description: "Read for 30 minutes every day to build a consistent reading habit.",
      category: "Learning",
      duration: "21 days",
      participants: 892,
      minStake: 15,
      maxStake: 75,
      difficulty: "Easy",
      isJoined: true,
      isActive: true,
      progress: 45,
      daysLeft: 12,
      currentStreak: 9,
      stakeAmount: 30,
      potentialWinnings: 45,
      nextDeadline: "2024-01-16T20:00:00Z",
      creator: {
        name: "BookClub Pro",
        avatar: "/placeholder.svg?height=40&width=40",
        isVerified: false,
      },
    },
    {
      id: "3",
      title: "Meditation Mastery",
      description: "Build a daily meditation practice with guided sessions.",
      category: "Mindfulness",
      duration: "14 days",
      participants: 634,
      minStake: 20,
      maxStake: 80,
      difficulty: "Easy",
      isJoined: true,
      isActive: true,
      progress: 85,
      daysLeft: 2,
      currentStreak: 12,
      stakeAmount: 40,
      potentialWinnings: 60,
      nextDeadline: "2024-01-16T07:00:00Z",
      creator: {
        name: "Zen Master",
        avatar: "/placeholder.svg?height=40&width=40",
        isVerified: true,
      },
    },
  ],
  completed: [
    {
      id: "4",
      title: "7-Day Water Challenge",
      description: "Drink 8 glasses of water daily for optimal hydration.",
      category: "Health",
      duration: "7 days",
      participants: 2341,
      minStake: 10,
      maxStake: 50,
      difficulty: "Easy",
      isJoined: true,
      isActive: false,
      progress: 100,
      stakeAmount: 25,
      winnings: 37.5,
      completedDate: "2024-01-10T23:59:59Z",
      creator: {
        name: "Health First",
        avatar: "/placeholder.svg?height=40&width=40",
        isVerified: true,
      },
    },
    {
      id: "5",
      title: "No Social Media Weekend",
      description: "Take a break from social media for the entire weekend.",
      category: "Digital Wellness",
      duration: "2 days",
      participants: 1567,
      minStake: 15,
      maxStake: 60,
      difficulty: "Medium",
      isJoined: true,
      isActive: false,
      progress: 100,
      stakeAmount: 30,
      winnings: 45,
      completedDate: "2024-01-08T23:59:59Z",
      creator: {
        name: "Digital Detox",
        avatar: "/placeholder.svg?height=40&width=40",
        isVerified: false,
      },
    },
  ],
  failed: [
    {
      id: "6",
      title: "5AM Club Challenge",
      description: "Wake up at 5 AM every day for two weeks.",
      category: "Productivity",
      duration: "14 days",
      participants: 987,
      minStake: 25,
      maxStake: 100,
      difficulty: "Hard",
      isJoined: true,
      isActive: false,
      progress: 43,
      stakeAmount: 50,
      lostAmount: 50,
      failedDate: "2024-01-05T05:00:00Z",
      creator: {
        name: "Early Bird",
        avatar: "/placeholder.svg?height=40&width=40",
        isVerified: true,
      },
    },
  ],
}

const mockStats = {
  totalChallenges: 6,
  activeChallenges: 3,
  completedChallenges: 2,
  failedChallenges: 1,
  successRate: 67,
  totalStaked: 225,
  totalWinnings: 82.5,
  totalLost: 50,
  currentStreak: 20,
  longestStreak: 45,
}

export default function MyChallengesPage() {
  const [selectedTab, setSelectedTab] = useState("active")

  const formatTimeLeft = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diff = deadlineDate.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    return `${hours}h left`
  }

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
              <div className="text-2xl font-bold text-primary">{mockStats.activeChallenges}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{mockStats.completedChallenges}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{mockStats.successRate}%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary">${mockStats.totalWinnings}</div>
              <div className="text-sm text-muted-foreground">Total Won</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{mockStats.currentStreak}</div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{mockStats.longestStreak}</div>
              <div className="text-sm text-muted-foreground">Best Streak</div>
            </CardContent>
          </Card>
        </div>

        {/* Challenge Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Active ({mockStats.activeChallenges})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed ({mockStats.completedChallenges})
            </TabsTrigger>
            <TabsTrigger value="failed" className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Failed ({mockStats.failedChallenges})
            </TabsTrigger>
          </TabsList>

          {/* Active Challenges */}
          <TabsContent value="active" className="space-y-6">
            <div className="space-y-4">
              {mockUserChallenges.active.map((challenge) => (
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
                                {challenge.daysLeft} days left
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />${challenge.stakeAmount} staked
                              </span>
                            </div>
                          </div>
                          <Badge variant="default" className="bg-primary">
                            {challenge.progress}% Complete
                          </Badge>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span>{challenge.progress}%</span>
                          </div>
                          <Progress value={challenge.progress} className="h-2" />
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="font-semibold text-orange-600">{challenge.currentStreak}</div>
                            <div className="text-muted-foreground">Current Streak</div>
                          </div>
                          <div>
                            <div className="font-semibold text-green-600">${challenge.potentialWinnings}</div>
                            <div className="text-muted-foreground">Potential Win</div>
                          </div>
                          <div>
                            <div className="font-semibold text-primary">{formatTimeLeft(challenge.nextDeadline)}</div>
                            <div className="text-muted-foreground">Next Check-in</div>
                          </div>
                          <div>
                            <div className="font-semibold">{challenge.participants}</div>
                            <div className="text-muted-foreground">Participants</div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 lg:w-48">
                        <Button className="w-full">Submit Proof</Button>
                        <Button variant="outline" className="w-full bg-transparent">
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
          </TabsContent>

          {/* Completed Challenges */}
          <TabsContent value="completed" className="space-y-6">
            <div className="space-y-4">
              {mockUserChallenges.completed.map((challenge) => (
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
                                Completed {new Date(challenge.completedDate!).toLocaleDateString()}
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
                            <div className="font-semibold text-green-600">${challenge.winnings}</div>
                            <div className="text-muted-foreground">Winnings</div>
                          </div>
                          <div>
                            <div className="font-semibold">{challenge.participants}</div>
                            <div className="text-muted-foreground">Participants</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 lg:w-48">
                        <Button variant="outline" className="w-full bg-transparent">
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
          </TabsContent>

          {/* Failed Challenges */}
          <TabsContent value="failed" className="space-y-6">
            <div className="space-y-4">
              {mockUserChallenges.failed.map((challenge) => (
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
                                Failed {new Date(challenge.failedDate!).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Badge variant="destructive">{challenge.progress}% Complete</Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="font-semibold text-primary">${challenge.stakeAmount}</div>
                            <div className="text-muted-foreground">Amount Staked</div>
                          </div>
                          <div>
                            <div className="font-semibold text-red-600">-${challenge.lostAmount}</div>
                            <div className="text-muted-foreground">Amount Lost</div>
                          </div>
                          <div>
                            <div className="font-semibold">{challenge.participants}</div>
                            <div className="text-muted-foreground">Participants</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 lg:w-48">
                        <Button variant="outline" className="w-full bg-transparent">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
