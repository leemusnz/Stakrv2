"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { SwipeableListItem, InteractiveCard } from "@/components/gesture-wrapper"
import { MobileContainer } from "@/components/mobile-container"
import { MobileConfirmModal, useMobileModal } from "@/components/mobile-modal"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  Trophy,
  Camera,
  Clock,
  Users,
  Target,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityItem {
  id: string
  type: "proof_submitted" | "challenge_completed" | "challenge_joined" | "milestone_reached"
  user: {
    id: string
    name: string
    avatar: string
  }
  challenge?: {
    id: string
    title: string
    category: string
  }
  content?: string
  image?: string
  timestamp: string
  stats: {
    likes: number
    comments: number
    isLiked: boolean
  }
}

interface MobileActivityFeedProps {
  activities: ActivityItem[]
  onLike: (activityId: string) => void
  onComment: (activityId: string) => void
  onShare: (activityId: string) => void
  onReport: (activityId: string) => void
  onViewProfile: (userId: string) => void
  onViewChallenge: (challengeId: string) => void
}

export function MobileActivityFeed({
  activities,
  onLike,
  onComment,
  onShare,
  onReport,
  onViewProfile,
  onViewChallenge
}: MobileActivityFeedProps) {
  const { isMobile } = useEnhancedMobile()
  const router = useRouter()
  const [likedActivities, setLikedActivities] = useState<Set<string>>(new Set())
  const reportModal = useMobileModal()
  const [reportingActivity, setReportingActivity] = useState<string | null>(null)

  if (!isMobile) return null

  const handleLike = (activityId: string) => {
    setLikedActivities(prev => {
      const newSet = new Set(prev)
      if (newSet.has(activityId)) {
        newSet.delete(activityId)
      } else {
        newSet.add(activityId)
      }
      return newSet
    })
    onLike(activityId)
  }

  const handleReport = (activityId: string) => {
    setReportingActivity(activityId)
    reportModal.open()
  }

  const confirmReport = () => {
    if (reportingActivity) {
      onReport(reportingActivity)
      setReportingActivity(null)
    }
    reportModal.close()
  }

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case "proof_submitted":
        return <Camera className="w-4 h-4 text-blue-500" />
      case "challenge_completed":
        return <Trophy className="w-4 h-4 text-yellow-500" />
      case "challenge_joined":
        return <Users className="w-4 h-4 text-green-500" />
      case "milestone_reached":
        return <Target className="w-4 h-4 text-purple-500" />
      default:
        return <Zap className="w-4 h-4 text-primary" />
    }
  }

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case "proof_submitted":
        return "submitted proof for"
      case "challenge_completed":
        return "completed"
      case "challenge_joined":
        return "joined"
      case "milestone_reached":
        return "reached a milestone in"
      default:
        return "updated"
    }
  }

  return (
    <MobileContainer className="pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Activity Feed</h1>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {activities.map((activity) => (
          <SwipeableListItem
            key={activity.id}
            onShare={() => onShare(activity.id)}
            onDelete={() => handleReport(activity.id)}
            className="p-0"
          >
            <InteractiveCard
              onTap={() => {
                if (activity.challenge) {
                  onViewChallenge(activity.challenge.id)
                }
              }}
              onDoubleTap={() => handleLike(activity.id)}
              onLongPress={() => onViewProfile(activity.user.id)}
              className="border-0 shadow-none"
            >
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={activity.user.avatar} />
                    <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getActivityIcon(activity.type)}
                      <span className="text-sm">
                        <span className="font-medium">{activity.user.name}</span>
                        {" "}
                        <span className="text-muted-foreground">
                          {getActivityText(activity)}
                        </span>
                        {activity.challenge && (
                          <>
                            {" "}
                            <span className="font-medium">{activity.challenge.title}</span>
                          </>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{activity.timestamp}</span>
                      {activity.challenge && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs py-0">
                            {activity.challenge.category}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                {activity.content && (
                  <p className="text-sm mb-3 pl-13">{activity.content}</p>
                )}

                {/* Image */}
                {activity.image && (
                  <div className="mb-3 pl-13">
                    <img
                      src={activity.image}
                      alt="Activity proof"
                      className="w-full max-w-sm h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pl-13">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLike(activity.id)
                      }}
                      className={cn(
                        "h-8 px-2 touch-manipulation",
                        likedActivities.has(activity.id) && "text-red-500"
                      )}
                    >
                      <Heart className={cn(
                        "w-4 h-4 mr-1",
                        likedActivities.has(activity.id) && "fill-current"
                      )} />
                      <span className="text-xs">
                        {activity.stats.likes + (likedActivities.has(activity.id) ? 1 : 0)}
                      </span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onComment(activity.id)
                      }}
                      className="h-8 px-2 touch-manipulation"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      <span className="text-xs">{activity.stats.comments}</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onShare(activity.id)
                      }}
                      className="h-8 px-2 touch-manipulation"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Gesture Hint */}
                  <div className="text-xs text-muted-foreground">
                    💡 Double tap to like
                  </div>
                </div>
              </CardContent>
            </InteractiveCard>
          </SwipeableListItem>
        ))}
      </div>

      {/* Empty State */}
      {activities.length === 0 && (
        <Card className="text-center p-8">
          <CardContent>
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Activity Yet</h3>
            <p className="text-muted-foreground mb-4">
              Follow some challenges to see activity from your community
            </p>
            <Button onClick={() => router.push('/discover')}>
              Discover Challenges
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Gesture Instructions */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-3 text-sm">Gesture Guide</h4>
        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>👆</span>
            <span>Tap to view</span>
          </div>
          <div className="flex items-center gap-2">
            <span>👆👆</span>
            <span>Double tap to like</span>
          </div>
          <div className="flex items-center gap-2">
            <span>👆📱</span>
            <span>Long press for profile</span>
          </div>
          <div className="flex items-center gap-2">
            <span>👈👉</span>
            <span>Swipe for actions</span>
          </div>
        </div>
      </div>

      {/* Report Confirmation Modal */}
      <MobileConfirmModal
        {...reportModal.props}
        title="Report Content"
        description="Are you sure you want to report this activity? Our team will review it."
        confirmLabel="Report"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmReport}
      />
    </MobileContainer>
  )
}

// Example usage with mock data
export function ActivityFeedExample() {
  const mockActivities: ActivityItem[] = [
    {
      id: "1",
      type: "proof_submitted",
      user: {
        id: "user1",
        name: "Sarah Chen",
        avatar: "/avatars/avatar-1.svg"
      },
      challenge: {
        id: "challenge1",
        title: "30-Day Meditation",
        category: "Mindfulness"
      },
      content: "Just completed my morning meditation session! Feeling centered and ready for the day. 🧘‍♀️",
      image: "/placeholder.jpg",
      timestamp: "2 hours ago",
      stats: {
        likes: 12,
        comments: 3,
        isLiked: false
      }
    },
    {
      id: "2",
      type: "challenge_completed",
      user: {
        id: "user2",
        name: "Mike Rodriguez",
        avatar: "/avatars/avatar-2.svg"
      },
      challenge: {
        id: "challenge2",
        title: "Daily Reading",
        category: "Learning"
      },
      content: "Successfully completed my 21-day reading challenge! 📚 Next up: a 30-day writing challenge.",
      timestamp: "4 hours ago",
      stats: {
        likes: 25,
        comments: 8,
        isLiked: true
      }
    }
  ]

  const handleLike = (activityId: string) => {
    console.log("Liked activity:", activityId)
  }

  const handleComment = (activityId: string) => {
    console.log("Comment on activity:", activityId)
  }

  const handleShare = (activityId: string) => {
    console.log("Share activity:", activityId)
  }

  const handleReport = (activityId: string) => {
    console.log("Report activity:", activityId)
  }

  const handleViewProfile = (userId: string) => {
    console.log("View profile:", userId)
  }

  const handleViewChallenge = (challengeId: string) => {
    console.log("View challenge:", challengeId)
  }

  return (
    <MobileActivityFeed
      activities={mockActivities}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onReport={handleReport}
      onViewProfile={handleViewProfile}
      onViewChallenge={handleViewChallenge}
    />
  )
}
