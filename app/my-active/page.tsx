"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Timer, 
  Camera, 
  CheckCircle, 
  Clock, 
  Target,
  AlertCircle,
  Zap,
  Calendar,
  Trophy,
  Play,
  Upload,
  Eye,
  Share2,
  MessageSquare
} from "lucide-react"
import Link from "next/link"
import { PostCreationModal } from "@/components/post-creation/post-creation-modal"
import { SocialShareModal } from "@/components/social-sharing/social-share-modal"

interface ActiveChallenge {
  id: string
  title: string
  category: string
  daysCompleted: number
  totalDays: number
  todayCompleted: boolean
  nextDeadline: string
  requiresTimer: boolean
  timerMinDuration: number
  timerMaxDuration: number
  proofTypes: string[]
  todayInstructions: string
  streak: number
  status: 'active' | 'pending' | 'completed'
  priority: 'high' | 'medium' | 'low'
}

export default function MyActivePage() {
  const { data: session } = useSession()
  const [activeChallenges, setActiveChallenges] = useState<ActiveChallenge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActiveChallenges = async () => {
      if (!session?.user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Fetch user's challenges from the API
        const response = await fetch('/api/user/challenges')
        if (!response.ok) {
          throw new Error('Failed to fetch challenges')
        }
        
        const data = await response.json()
        
        if (data.success && data.challenges) {
          // Transform API data to match our interface
          const transformedChallenges: ActiveChallenge[] = data.challenges
            .filter((challenge: any) => {
              // Filter for active challenges only (not completed or failed)
              return challenge.completionStatus === 'active'
            })
            .map((challenge: any) => {
              // Calculate progress and deadlines
              const now = new Date()
              const startDate = new Date(challenge.joinedAt) // Use joinedAt as start reference
              
              // Parse duration - extract number from strings like "30 days", "21 days", etc.
              const durationMatch = challenge.duration.match(/(\d+)/)
              const totalDays = durationMatch ? parseInt(durationMatch[1]) : 30
              
              // Calculate days since joining
              const daysSinceJoined = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
              const daysCompleted = Math.min(daysSinceJoined, totalDays)
              
              // Calculate next deadline (end of today)
              const nextDeadline = new Date()
              nextDeadline.setHours(23, 59, 59, 999)
              
              // All filtered challenges are active
              const status: 'active' | 'pending' | 'completed' = 'active'
              
              // Use actual streak from API or default
              const streak = challenge.currentStreak || Math.max(1, daysCompleted)
              
              // Generate priority based on progress
              let priority: 'high' | 'medium' | 'low' = 'medium'
              const progressPercent = (daysCompleted / totalDays) * 100
              if (progressPercent < 20) priority = 'high'
              else if (progressPercent > 80) priority = 'low'
              
              return {
                id: challenge.id,
                title: challenge.title,
                category: challenge.category,
                daysCompleted,
                totalDays,
                todayCompleted: false, // Would need to check daily completions API
                nextDeadline: nextDeadline.toISOString(),
                requiresTimer: false, // Would need challenge details API for this
                timerMinDuration: 15,
                timerMaxDuration: 60,
                proofTypes: ["photo"], // Would need challenge details API for this
                todayInstructions: `Continue your ${challenge.title} journey! Day ${daysCompleted + 1} of ${totalDays}.`,
                streak,
                status,
                priority
              }
            })
          
          setActiveChallenges(transformedChallenges)
        } else {
          // Fallback to empty array if no data
          setActiveChallenges([])
        }
      } catch (error) {
        console.error('Error fetching active challenges:', error)
        
        // Show a few demo challenges if API fails
        const demoChallenges: ActiveChallenge[] = [
          {
            id: "demo-1",
            title: "Demo Challenge - API Error",
            category: "Demo",
            daysCompleted: 1,
            totalDays: 7,
            todayCompleted: false,
            nextDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
            requiresTimer: false,
            timerMinDuration: 15,
            timerMaxDuration: 30,
            proofTypes: ["photo"],
            todayInstructions: "Demo challenge - check your internet connection",
            streak: 1,
            status: 'active',
            priority: 'medium'
          }
        ]
        setActiveChallenges(demoChallenges)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveChallenges()
  }, [session])

  const getTimeUntilDeadline = (deadline: string) => {
    const now = new Date().getTime()
    const deadlineTime = new Date(deadline).getTime()
    const diff = deadlineTime - now

    if (diff <= 0) return "Overdue!"
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const getPriorityColor = (priority: string, isOverdue: boolean) => {
    if (isOverdue) return "border-red-500 bg-red-50"
    
    switch (priority) {
      case 'high': return "border-orange-500 bg-orange-50"
      case 'medium': return "border-blue-500 bg-blue-50" 
      case 'low': return "border-gray-500 bg-gray-50"
      default: return "border-gray-200 bg-white"
    }
  }

  const getUrgencyMessage = (deadline: string, todayCompleted: boolean) => {
    const now = new Date().getTime()
    const deadlineTime = new Date(deadline).getTime()
    const hoursLeft = (deadlineTime - now) / (1000 * 60 * 60)

    if (todayCompleted) return null
    if (hoursLeft <= 0) return { type: "error", message: "Deadline passed! Complete ASAP to avoid penalty" }
    if (hoursLeft <= 2) return { type: "warning", message: "⚠️ Less than 2 hours left!" }
    if (hoursLeft <= 6) return { type: "info", message: "🕐 6 hours remaining today" }
    return null
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-6">
            <div className="h-64 bg-muted rounded-lg"></div>
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  const activeChallengesOnly = activeChallenges.filter(c => c.status === 'active')
  const pendingChallenges = activeChallenges.filter(c => c.status === 'pending')
  const todayIncomplete = activeChallengesOnly.filter(c => !c.todayCompleted)
  const overdueChallenges = activeChallengesOnly.filter(c => {
    const now = new Date().getTime()
    const deadline = new Date(c.nextDeadline).getTime()
    return deadline < now && !c.todayCompleted
  })

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Active Challenges</h1>
          <p className="text-muted-foreground mt-2">
            Track progress and complete today's requirements
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {activeChallengesOnly.filter(c => c.todayCompleted).length}/{activeChallengesOnly.length}
          </div>
          <div className="text-sm text-muted-foreground">completed today</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="font-semibold">{activeChallengesOnly.length}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <div className="font-semibold">{todayIncomplete.length}</div>
            <div className="text-sm text-muted-foreground">To Complete</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-red-600" />
            <div className="font-semibold">{overdueChallenges.length}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="font-semibold">{Math.round(activeChallengesOnly.reduce((acc, c) => acc + c.streak, 0) / Math.max(activeChallengesOnly.length, 1))}</div>
            <div className="text-sm text-muted-foreground">Avg Streak</div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Actions Alert */}
      {overdueChallenges.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>Urgent:</strong> {overdueChallenges.length} challenge{overdueChallenges.length > 1 ? 's' : ''} overdue! 
            Complete them now to avoid losing your stake.
          </AlertDescription>
        </Alert>
      )}

      {/* Active Challenges */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Today's Challenges</h2>
        
        {activeChallengesOnly.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Active Challenges</h3>
              <p className="text-muted-foreground mb-4">
                Join a challenge to start building habits and earning rewards!
              </p>
              <Link href="/discover">
                <Button>
                  <Zap className="w-4 h-4 mr-2" />
                  Discover Challenges
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {activeChallengesOnly
              .sort((a, b) => {
                // Sort by: overdue first, then by deadline
                const aOverdue = new Date(a.nextDeadline).getTime() < Date.now()
                const bOverdue = new Date(b.nextDeadline).getTime() < Date.now()
                
                if (aOverdue && !bOverdue) return -1
                if (!aOverdue && bOverdue) return 1
                
                return new Date(a.nextDeadline).getTime() - new Date(b.nextDeadline).getTime()
              })
              .map((challenge) => {
                const isOverdue = new Date(challenge.nextDeadline).getTime() < Date.now()
                const urgencyMessage = getUrgencyMessage(challenge.nextDeadline, challenge.todayCompleted)
                const progressPercentage = (challenge.daysCompleted / challenge.totalDays) * 100

                return (
                  <Card 
                    key={challenge.id} 
                    className={`${getPriorityColor(challenge.priority, isOverdue && !challenge.todayCompleted)}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg">{challenge.title}</CardTitle>
                            {challenge.todayCompleted && (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Complete
                              </Badge>
                            )}
                            <Badge variant="outline">{challenge.category}</Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Day {challenge.daysCompleted + 1} of {challenge.totalDays}</span>
                            <span>🔥 {challenge.streak} day streak</span>
                            <span className={`font-medium ${isOverdue && !challenge.todayCompleted ? 'text-red-600' : 'text-blue-600'}`}>
                              {getTimeUntilDeadline(challenge.nextDeadline)} left
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Progress value={progressPercentage} className="h-2" />
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Urgency Alert */}
                      {urgencyMessage && (
                        <Alert className={
                          urgencyMessage.type === 'error' ? 'border-red-200 bg-red-50' :
                          urgencyMessage.type === 'warning' ? 'border-orange-200 bg-orange-50' :
                          'border-blue-200 bg-blue-50'
                        }>
                          <AlertDescription className={
                            urgencyMessage.type === 'error' ? 'text-red-700' :
                            urgencyMessage.type === 'warning' ? 'text-orange-700' :
                            'text-blue-700'
                          }>
                            {urgencyMessage.message}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {/* Today's Instructions */}
                      <div className="p-3 bg-muted rounded-lg">
                        <h4 className="font-medium text-sm mb-1">Today's Task:</h4>
                        <p className="text-sm">{challenge.todayInstructions}</p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          {challenge.requiresTimer && !challenge.todayCompleted && (
                            <Button className="flex-1">
                              <Timer className="w-4 h-4 mr-2" />
                              Start Timer ({challenge.timerMinDuration}-{challenge.timerMaxDuration}min)
                            </Button>
                          )}
                          
                          {!challenge.todayCompleted ? (
                            <Button variant="outline" className="flex-1">
                              <Camera className="w-4 h-4 mr-2" />
                              Submit Proof
                            </Button>
                          ) : (
                            <Button variant="outline" className="flex-1">
                              <Eye className="w-4 h-4 mr-2" />
                              View Submission
                            </Button>
                          )}
                          
                          <Link href={`/challenge/${challenge.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>

                        {/* Social Actions */}
                        <div className="flex gap-2">
                          <PostCreationModal 
                            trigger={
                              <Button variant="outline" size="sm" className="flex-1">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Share Progress
                              </Button>
                            }
                            challengeContext={{
                              id: challenge.id,
                              title: challenge.title,
                              category: challenge.category,
                              dayNumber: challenge.daysCompleted + 1,
                              totalDays: challenge.totalDays,
                              isProofSubmission: challenge.todayCompleted
                            }}
                            onPostCreated={(post) => {
                              console.log('Post created:', post)
                              // Could show toast notification here
                            }}
                          />
                          
                          <SocialShareModal
                            trigger={
                              <Button variant="outline" size="sm" className="flex-1">
                                <Share2 className="w-4 h-4 mr-2" />
                                Share Challenge
                              </Button>
                            }
                            content={{
                              type: 'challenge',
                              title: `${challenge.title} - Day ${challenge.daysCompleted + 1}`,
                              description: `I'm taking on the "${challenge.title}" challenge! Currently on day ${challenge.daysCompleted + 1}/${challenge.totalDays}`,
                              url: `${typeof window !== 'undefined' ? window.location.origin : ''}/challenge/${challenge.id}`,
                              challenge: {
                                title: challenge.title,
                                category: challenge.category,
                                dayNumber: challenge.daysCompleted + 1,
                                totalDays: challenge.totalDays
                              }
                            }}
                            onShare={(platform) => {
                              console.log('Shared to:', platform)
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        )}
      </div>

      {/* Pending Challenges */}
      {pendingChallenges.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Starting Soon</h2>
          <div className="grid gap-4">
            {pendingChallenges.map((challenge) => (
              <Card key={challenge.id} className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{challenge.title}</h3>
                      <p className="text-sm text-muted-foreground">{challenge.todayInstructions}</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700">
                      Starts {getTimeUntilDeadline(challenge.nextDeadline)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
