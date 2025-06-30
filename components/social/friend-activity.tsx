"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getProxiedAvatarUrl } from "@/lib/utils"
import { Users, UserPlus, Trophy, Zap, Target, MessageCircle, ThumbsUp, Share2 } from "lucide-react"

interface Friend {
  id: string
  name: string
  avatar?: string
  status: "online" | "offline" | "in-challenge"
  currentChallenge?: string
  streak: number
  recentActivity: string
  timeAgo: string
  mutualChallenges: number
}

interface FriendActivityProps {
  friends?: Friend[]
  showInviteButton?: boolean
}

const mockFriends: Friend[] = [
  {
    id: "1",
    name: "Sarah Chen",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "in-challenge",
    currentChallenge: "Morning Meditation",
    streak: 12,
    recentActivity: "Completed day 12 of Morning Meditation",
    timeAgo: "2 hours ago",
    mutualChallenges: 3,
  },
  {
    id: "2",
    name: "Mike Rodriguez",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "online",
    streak: 8,
    recentActivity: "Joined 30-Day Fitness Challenge",
    timeAgo: "4 hours ago",
    mutualChallenges: 1,
  },
  {
    id: "3",
    name: "Lisa Wang",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "in-challenge",
    currentChallenge: "Read Daily",
    streak: 25,
    recentActivity: "Achieved 25-day reading streak! 🔥",
    timeAgo: "6 hours ago",
    mutualChallenges: 2,
  },
  {
    id: "4",
    name: "Alex Kim",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "offline",
    streak: 5,
    recentActivity: "Completed Digital Detox challenge",
    timeAgo: "1 day ago",
    mutualChallenges: 0,
  },
]

export function FriendActivity({ friends = mockFriends, showInviteButton = true }: FriendActivityProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-success"
      case "in-challenge":
        return "bg-primary"
      case "offline":
        return "bg-muted-foreground"
      default:
        return "bg-muted-foreground"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "Online"
      case "in-challenge":
        return "In Challenge"
      case "offline":
        return "Offline"
      default:
        return "Unknown"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Friends Activity
        </CardTitle>
        {showInviteButton && (
          <Button size="sm" variant="outline" className="flex items-center gap-2 bg-transparent">
            <UserPlus className="w-4 h-4" />
            Invite Friends
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {friends.map((friend) => (
          <div key={friend.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="relative">
              <Avatar className="w-12 h-12">
                <AvatarImage src={getProxiedAvatarUrl(friend.avatar)} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {friend.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${getStatusColor(friend.status)}`}
                title={getStatusText(friend.status)}
              />
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{friend.name}</span>
                  {friend.streak > 0 && (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {friend.streak}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{friend.timeAgo}</span>
              </div>

              <p className="text-sm text-muted-foreground">{friend.recentActivity}</p>

              {friend.currentChallenge && (
                <div className="flex items-center gap-1 text-xs">
                  <Target className="w-3 h-3 text-primary" />
                  <span className="text-primary font-medium">{friend.currentChallenge}</span>
                </div>
              )}

              {friend.mutualChallenges > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Trophy className="w-3 h-3" />
                  <span>{friend.mutualChallenges} mutual challenges</span>
                </div>
              )}

              {/* Social Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  <ThumbsUp className="w-3 h-3 mr-1" />
                  Cheer
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Message
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  <Share2 className="w-3 h-3 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {friends.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <Users className="w-12 h-12 text-muted-foreground mx-auto" />
            <div>
              <p className="font-medium">No friends yet</p>
              <p className="text-sm text-muted-foreground">Invite friends to make challenges more fun!</p>
            </div>
            <Button size="sm" className="bg-secondary hover:bg-secondary/90">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Your First Friend
            </Button>
          </div>
        )}

        {/* Social Motivation */}
        <div className="pt-4 border-t border-muted">
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Friend Challenge</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              You're ahead of 3 friends this week! Keep it up to stay on top.
            </p>
            <Button size="sm" variant="outline" className="w-full bg-transparent">
              Challenge Friends
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
