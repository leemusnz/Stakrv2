"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SwipeableTabs } from "@/components/ui/swipeable-tabs"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { PostCreationModal } from "@/components/post-creation/post-creation-modal"
import { ChallengeStakeSection } from "@/components/challenge-stake-section"
import { 
  MessageCircle, 
  Heart, 
  Users, 
  TrendingUp, 
  Bell, 
  Send,
  Camera,
  Video,
  Trophy,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  UserCheck
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ChallengeCommunityTabsProps {
  challenge: any
  isParticipant: boolean
  canJoin: boolean
  participation?: any
  onJoinSuccess?: (newParticipation: any) => void
}

export function ChallengeCommunityTabs({ 
  challenge, 
  isParticipant, 
  canJoin,
  participation,
  onJoinSuccess 
}: ChallengeCommunityTabsProps) {
  const { isMobile } = useEnhancedMobile()
  const [activeTab, setActiveTab] = useState("details")
  const [posts, setPosts] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")

  // Mock data for demonstration
  const mockActivities = [
    {
      id: "activity-1",
      type: "check_in",
      user: { name: "Sarah Chen", avatar: "/avatars/avatar-1.svg" },
      action: "completed daily check-in",
      challenge: "Day 15",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      streak: 15
    },
    {
      id: "activity-2", 
      type: "verification",
      user: { name: "Mike Rodriguez", avatar: "/avatars/avatar-2.svg" },
      action: "submitted proof of workout",
      challenge: "30-min gym session",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      imageUrl: "/placeholder.jpg"
    },
    {
      id: "activity-3",
      type: "milestone",
      user: { name: "Emma Wilson", avatar: "/avatars/avatar-3.svg" },
      action: "reached 50% completion",
      challenge: "Halfway milestone",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      badge: "🎯"
    },
    {
      id: "activity-4",
      type: "join",
      user: { name: "Alex Thompson", avatar: "/avatars/avatar-4.svg" },
      action: "joined the challenge",
      challenge: "Welcome!",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
    }
  ]

  const mockParticipants = [
    {
      id: "participant-1",
      name: "Sarah Chen",
      avatar: "/avatars/avatar-1.svg",
      progress: { completed: 15, total: 30 },
      streak: 15,
      lastActivity: new Date(Date.now() - 30 * 60 * 1000),
      status: "active",
      isHost: false
    },
    {
      id: "participant-2", 
      name: "Mike Rodriguez",
      avatar: "/avatars/avatar-2.svg",
      progress: { completed: 12, total: 30 },
      streak: 3,
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "active",
      isHost: false
    },
    {
      id: "participant-3",
      name: "Emma Wilson", 
      avatar: "/avatars/avatar-3.svg",
      progress: { completed: 8, total: 30 },
      streak: 1,
      lastActivity: new Date(Date.now() - 36 * 60 * 60 * 1000),
      status: "at_risk", // Behind on check-ins
      isHost: false
    },
    {
      id: "participant-4",
      name: challenge.host?.name || "Challenge Host",
      avatar: challenge.host?.avatar || "/avatars/avatar-5.svg",
      progress: { completed: 20, total: 30 },
      streak: 20,
      lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: "active",
      isHost: true
    }
  ]

  const mockPosts = [
    {
      id: "post-1",
      content: "Day 15 complete! 💪 The morning workouts are becoming a habit. Who else is feeling the momentum building?",
      user: { name: "Sarah Chen", avatar: "/avatars/avatar-1.svg" },
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      likes: 8,
      comments: 3,
      hasImage: true,
      type: "proof_submission"
    },
    {
      id: "post-2", 
      content: "Motivational reminder: Remember WHY you started this challenge. You've got this! 🔥",
      user: { name: challenge.host?.name || "Challenge Host", avatar: challenge.host?.avatar || "/avatars/avatar-5.svg" },
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      likes: 15,
      comments: 7,
      hasImage: false,
      type: "general",
      isHost: true
    },
    {
      id: "post-3",
      content: "Just hit my halfway point! 🎯 The accountability in this group is incredible. Thank you all!",
      user: { name: "Emma Wilson", avatar: "/avatars/avatar-3.svg" },
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      likes: 12,
      comments: 5,
      hasImage: false,
      type: "milestone"
    }
  ]

  const handleNudge = (participantId: string, participantName: string) => {
    // Would send a gentle reminder notification
    console.log(`Nudging ${participantName}`)
    // Add toast notification
  }

  const handleCheer = (participantId: string, participantName: string) => {
    // Would send an encouragement notification
    console.log(`Cheering for ${participantName}`)
    // Add toast notification  
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "check_in": return <CheckCircle className="w-4 h-4 text-green-500" />
      case "verification": return <Camera className="w-4 h-4 text-blue-500" />
      case "milestone": return <Trophy className="w-4 h-4 text-yellow-500" />
      case "join": return <UserCheck className="w-4 h-4 text-purple-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700"
      case "at_risk": return "bg-yellow-100 text-yellow-700"
      case "inactive": return "bg-red-100 text-red-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  // Helper functions for tab content (to avoid duplication)
  const renderDetailsContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Challenge Information */}
          <Card>
            <CardHeader>
              <CardTitle>Challenge Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground leading-relaxed">{challenge.longDescription || challenge.description}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Rules & Requirements</h4>
                  <ul className="space-y-1">
                    {challenge.rules?.map((rule: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground">• {rule}</li>
                    )) || <li className="text-sm text-muted-foreground">• Complete daily check-ins</li>}
                  </ul>
                </div>
                {challenge.dailyInstructions && (
                  <div>
                    <h4 className="font-medium mb-2">Daily Instructions</h4>
                    <p className="text-sm text-muted-foreground">{challenge.dailyInstructions}</p>
                  </div>
                )}
                {challenge.proofInstructions && (
                  <div>
                    <h4 className="font-medium mb-2">Proof Requirements</h4>
                    <p className="text-sm text-muted-foreground">{challenge.proofInstructions}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Join/Participation Status */}
          {!isParticipant && canJoin && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-900 flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  Ready to Join?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-blue-700">
                    Join {challenge.participants} other participants in this challenge!
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-600">Entry:</span>
                    <span className="font-medium">
                      {challenge.allowPointsOnly && (!challenge.minStake || challenge.minStake === 0) 
                        ? "Free (XP Only)" 
                        : `$${challenge.minStake} - $${challenge.maxStake}`
                      }
                    </span>
                  </div>
                  <Button className="w-full" onClick={() => {
                    console.log('Join challenge clicked')
                  }}>
                    Join Challenge
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Participation Confirmation */}
          {isParticipant && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-900 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  You're In!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-700 font-medium">Challenge participation confirmed</p>
                    <p className="text-xs text-green-600 mt-1">You'll receive daily reminders and updates</p>
                  </div>
                  {participation?.progress && (
                    <div className="space-y-2 pt-3 border-t border-green-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-700">Progress</span>
                        <span className="font-medium text-green-900">
                          {participation.progress.days_completed}/{participation.progress.total_days} days
                        </span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${(participation.progress.days_completed / participation.progress.total_days) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-100">
                    View My Progress
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Challenge Host */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-purple-600" />
                Challenge Host
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={challenge.host.avatar} />
                    <AvatarFallback>{challenge.host.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{challenge.host.name}</span>
                      {challenge.host.verified && (
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{challenge.host.bio}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div className="text-center">
                    <div className="font-semibold text-sm">{challenge.host.completedChallenges}</div>
                    <div className="text-xs text-muted-foreground">Challenges</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-sm">{challenge.host.successRate}%</div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Host
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {isMobile ? (
        <SwipeableTabs
          defaultValue="details"
          value={activeTab}
          onValueChange={setActiveTab}
          tabs={[
            {
              value: "details",
              label: "Details",
              content: renderDetailsContent()
            },
            {
              value: "community",
              label: "Community",
              content: (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Posts & Discussions</h3>
                    {isParticipant && (
                      <PostCreationModal
                        trigger={
                          <Button size="sm">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Post
                          </Button>
                        }
                        challengeContext={{
                          id: challenge.id,
                          title: challenge.title,
                          category: challenge.category
                        }}
                        onPostCreated={(post) => {
                          setPosts(prev => [post, ...prev])
                        }}
                      />
                    )}
                  </div>

                  {/* Mobile-optimized Posts Feed */}
                  <div className="space-y-4">
                    {mockPosts.map((post) => (
                      <Card key={post.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <Avatar className="w-10 h-10 flex-shrink-0">
                              <AvatarImage src={post.user.avatar} />
                              <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm">{post.user.name}</span>
                                {post.isHost && (
                                  <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700">
                                    Host
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm leading-relaxed">{post.content}</p>
                              
                              {post.hasImage && (
                                <div className="rounded-lg overflow-hidden border bg-muted">
                                  <div className="aspect-[16/10] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                                    <Camera className="w-8 h-8 text-muted-foreground" />
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-4 pt-2">
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-600 -ml-2">
                                  <Heart className="w-4 h-4 mr-1.5" />
                                  <span className="text-sm">{post.likes}</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-600">
                                  <MessageCircle className="w-4 h-4 mr-1.5" />
                                  <span className="text-sm">{post.comments}</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            },
            {
              value: "participants",
              label: `Participants (${mockParticipants.length})`,
              content: (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Participants ({mockParticipants.length})</h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                        {mockParticipants.filter(p => p.status === 'active').length} Active
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {mockParticipants.map((participant) => (
                      <Card key={participant.id}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={participant.avatar} />
                                <AvatarFallback>{participant.name[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{participant.name}</span>
                                  {participant.isHost && (
                                    <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700">Host</Badge>
                                  )}
                                </div>
                                <Badge variant="secondary" className={`text-xs mt-1 ${getStatusColor(participant.status)}`}>
                                  {participant.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{participant.progress.completed}/{participant.progress.total} days</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${(participant.progress.completed / participant.progress.total) * 100}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Streak</span>
                                <span className="font-medium">🔥 {participant.streak} days</span>
                              </div>
                            </div>
                            
                            {isParticipant && !participant.isHost && (
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleCheer(participant.id, participant.name)}
                                >
                                  <Trophy className="w-4 h-4 mr-1" />
                                  Cheer
                                </Button>
                                {participant.status === "at_risk" && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleNudge(participant.id, participant.name)}
                                  >
                                    <Bell className="w-4 h-4 mr-1" />
                                    Nudge
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            },
            {
              value: "activity",
              label: "Activity",
              content: (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Live Activity Feed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockActivities.map((activity, index) => (
                        <div key={activity.id}>
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={activity.user.avatar} />
                                  <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">{activity.user.name}</span>
                                <span className="text-sm text-muted-foreground">{activity.action}</span>
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-sm font-medium">{activity.challenge}</span>
                                {activity.streak && (
                                  <Badge variant="outline" className="text-xs">
                                    🔥 {activity.streak} day streak
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(activity.timestamp)} ago
                              </p>
                            </div>
                          </div>
                          {index < mockActivities.length - 1 && <Separator className="mt-4" />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            }
          ]}
          tabsListClassName="grid-cols-4"
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full inline-flex md:grid md:grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
            <TabsTrigger value="participants" className="relative">
              Participants
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {mockParticipants.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="activity">
              Activity
              <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </TabsTrigger>
          </TabsList>

      <TabsContent value="details" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Challenge Information */}
            <Card>
              <CardHeader>
                <CardTitle>Challenge Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-muted-foreground leading-relaxed">{challenge.longDescription || challenge.description}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Rules & Requirements</h4>
                    <ul className="space-y-1">
                      {challenge.rules?.map((rule: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground">• {rule}</li>
                      )) || <li className="text-sm text-muted-foreground">• Complete daily check-ins</li>}
                    </ul>
                  </div>
                  {challenge.dailyInstructions && (
                    <div>
                      <h4 className="font-medium mb-2">Daily Instructions</h4>
                      <p className="text-sm text-muted-foreground">{challenge.dailyInstructions}</p>
                    </div>
                  )}
                  {challenge.proofInstructions && (
                    <div>
                      <h4 className="font-medium mb-2">Proof Requirements</h4>
                      <p className="text-sm text-muted-foreground">{challenge.proofInstructions}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Join/Participation Status */}
            {!isParticipant && canJoin && (
              <ChallengeStakeSection 
                challenge={challenge}
                canJoin={canJoin}
                onJoinSuccess={onJoinSuccess}
              />
            )}

            {/* Participation Confirmation */}
            {isParticipant && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-900 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    You're In!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-green-700 font-medium">Challenge participation confirmed</p>
                      <p className="text-xs text-green-600 mt-1">You'll receive daily reminders and updates</p>
                    </div>
                    {participation?.progress && (
                      <div className="space-y-2 pt-3 border-t border-green-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">Progress</span>
                          <span className="font-medium text-green-900">
                            {participation.progress.days_completed}/{participation.progress.total_days} days
                          </span>
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ 
                              width: `${(participation.progress.days_completed / participation.progress.total_days) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-100">
                      View My Progress
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Challenge Host */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-purple-600" />
                  Challenge Host
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={challenge.host.avatar} />
                      <AvatarFallback>{challenge.host.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{challenge.host.name}</span>
                        {challenge.host.verified && (
                          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{challenge.host.bio}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div className="text-center">
                      <div className="font-semibold text-sm">{challenge.host.completedChallenges}</div>
                      <div className="text-xs text-muted-foreground">Challenges</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-sm">{challenge.host.successRate}%</div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message Host
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="community" className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Challenge Posts & Discussions</h3>
          {isParticipant && (
            <PostCreationModal
              trigger={
                <Button size="sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Post Update
                </Button>
              }
              challengeContext={{
                id: challenge.id,
                title: challenge.title,
                category: challenge.category
              }}
              onPostCreated={(post) => {
                setPosts(prev => [post, ...prev])
              }}
            />
          )}
        </div>

        {/* Posts Feed */}
        <div className="w-full">
          <ScrollArea className="h-[600px] w-full">
            <div className="space-y-4 pr-4">
              {mockPosts.map((post) => (
                <Card key={post.id} className="w-full">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarImage src={post.user.avatar} />
                        <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* User Info */}
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{post.user.name}</span>
                          {post.isHost && (
                            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
                              Host
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs capitalize">
                            {post.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            • {formatDistanceToNow(post.timestamp)} ago
                          </span>
                        </div>
                        
                        {/* Post Content */}
                        <div className="space-y-3">
                          <p className="text-sm leading-relaxed">{post.content}</p>
                          
                          {/* Image Attachment */}
                          {post.hasImage && (
                            <div className="rounded-lg overflow-hidden border bg-muted">
                              <div className="aspect-[16/10] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                                <div className="text-center space-y-2">
                                  <Camera className="w-12 h-12 text-muted-foreground mx-auto" />
                                  <p className="text-sm text-muted-foreground">Workout photo</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Interaction Buttons */}
                        <div className="flex items-center space-x-4 pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-muted-foreground hover:text-red-600 hover:bg-red-50 -ml-2"
                          >
                            <Heart className="w-4 h-4 mr-1.5" />
                            <span className="text-sm font-medium">{post.likes}</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                          >
                            <MessageCircle className="w-4 h-4 mr-1.5" />
                            <span className="text-sm font-medium">{post.comments}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Empty State */}
              {mockPosts.length === 0 && (
                <Card className="w-full">
                  <CardContent className="p-12 text-center">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No posts yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Be the first to share your progress or thoughts about this challenge!
                    </p>
                    {isParticipant && (
                      <PostCreationModal
                        trigger={
                          <Button>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Create First Post
                          </Button>
                        }
                        challengeContext={{
                          id: challenge.id,
                          title: challenge.title,
                          category: challenge.category
                        }}
                        onPostCreated={(post) => {
                          setPosts(prev => [post, ...prev])
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>
      </TabsContent>

      <TabsContent value="participants" className="space-y-6">
        {/* Participants List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Challenge Participants ({mockParticipants.length})</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {mockParticipants.filter(p => p.status === 'active').length} Active
              </Badge>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                {mockParticipants.filter(p => p.status === 'at_risk').length} At Risk
              </Badge>
            </div>
          </div>
          
          <ScrollArea className="h-[700px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockParticipants.map((participant) => (
                <Card key={participant.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={participant.avatar} />
                          <AvatarFallback>{participant.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium truncate">{participant.name}</span>
                            {participant.isHost && (
                              <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700">Host</Badge>
                            )}
                          </div>
                          <Badge variant="secondary" className={`text-xs mt-1 ${getStatusColor(participant.status)}`}>
                            {participant.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      {/* Progress Stats */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{participant.progress.completed}/{participant.progress.total} days</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(participant.progress.completed / participant.progress.total) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Current Streak</span>
                          <span className="font-medium flex items-center">
                            🔥 {participant.streak} days
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last activity: {formatDistanceToNow(participant.lastActivity)} ago
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      {isParticipant && !participant.isHost && (
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                            onClick={() => handleCheer(participant.id, participant.name)}
                          >
                            <Trophy className="w-4 h-4 mr-1" />
                            Cheer
                          </Button>
                          {participant.status === "at_risk" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex-1"
                              onClick={() => handleNudge(participant.id, participant.name)}
                            >
                              <Bell className="w-4 h-4 mr-1" />
                              Nudge
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </TabsContent>

      <TabsContent value="activity" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Live Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {mockActivities.map((activity, index) => (
                  <div key={activity.id}>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={activity.user.avatar} />
                            <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{activity.user.name}</span>
                          <span className="text-sm text-muted-foreground">{activity.action}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm font-medium">{activity.challenge}</span>
                          {activity.streak && (
                            <Badge variant="outline" className="text-xs">
                              🔥 {activity.streak} day streak
                            </Badge>
                          )}
                          {activity.badge && (
                            <span className="text-sm">{activity.badge}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(activity.timestamp)} ago
                        </p>
                        {activity.imageUrl && (
                          <div className="mt-2 w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                            <Camera className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                    {index < mockActivities.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
        )}
    </>
  )
}
