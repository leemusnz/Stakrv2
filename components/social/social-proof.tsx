"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, TrendingUp, Star, Zap } from "lucide-react"

interface SocialProofProps {
  variant?: "inline" | "card" | "compact"
  showActivity?: boolean
  showStats?: boolean
  showTestimonials?: boolean
}

const liveActivities = [
  { user: "Sarah", action: "completed", challenge: "Morning Meditation", timeAgo: "2m ago" },
  { user: "Mike", action: "joined", challenge: "10K Steps Daily", timeAgo: "5m ago" },
  { user: "Lisa", action: "earned", amount: "$85", challenge: "Reading Streak", timeAgo: "8m ago" },
  { user: "Alex", action: "achieved", milestone: "7-day streak", timeAgo: "12m ago" },
  { user: "Jordan", action: "completed", challenge: "Cold Shower", timeAgo: "15m ago" },
]

const testimonials = [
  {
    name: "Sarah Chen",
    avatar: "/placeholder.svg?height=32&width=32",
    text: "Stakr helped me build habits I never thought possible. 28-day streak and counting!",
    rating: 5,
    achievement: "Meditation Master",
  },
  {
    name: "Mike Rodriguez",
    avatar: "/placeholder.svg?height=32&width=32",
    text: "The accountability is real. Lost 15 pounds and earned $200 back!",
    rating: 5,
    achievement: "Fitness Champion",
  },
  {
    name: "Lisa Wang",
    avatar: "/placeholder.svg?height=32&width=32",
    text: "Finally reading consistently. Best investment in myself ever.",
    rating: 5,
    achievement: "Bookworm",
  },
]

export function SocialProof({
  variant = "card",
  showActivity = true,
  showStats = true,
  showTestimonials = true,
}: SocialProofProps) {
  if (variant === "inline") {
    return (
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/10">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <Avatar key={i} className="w-8 h-8 border-2 border-background">
                <AvatarImage src={`/placeholder.svg?height=32&width=32&text=${i}`} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">U{i}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div>
            <p className="font-medium text-sm">Join 10,247+ users crushing their goals</p>
            <p className="text-xs text-muted-foreground">89% success rate • $2.3M earned back</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">47 active now</span>
          </div>
        </div>
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Community Pulse</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Active users</span>
              <span className="font-medium">10,247</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Success rate</span>
              <span className="font-medium text-success">89%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total earned</span>
              <span className="font-medium text-primary">$2.3M</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Live Activity */}
      {showActivity && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Live Activity
            </CardTitle>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">47 active</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {liveActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {activity.user.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <span className="font-medium">{activity.user}</span>
                  <span className="text-muted-foreground"> {activity.action} </span>
                  {activity.challenge && <span className="font-medium">{activity.challenge}</span>}
                  {activity.amount && <span className="font-medium text-success">{activity.amount}</span>}
                  {activity.milestone && <span className="font-medium text-primary">{activity.milestone}</span>}
                </div>
                <span className="text-xs text-muted-foreground">{activity.timeAgo}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Community Stats */}
      {showStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              Community Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">10,247</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center p-4 bg-success/5 rounded-lg">
              <div className="text-2xl font-bold text-success">89%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center p-4 bg-secondary/5 rounded-lg">
              <div className="text-2xl font-bold text-secondary">$2.3M</div>
              <div className="text-sm text-muted-foreground">Total Earned</div>
            </div>
            <div className="text-center p-4 bg-orange-500/5 rounded-lg">
              <div className="text-2xl font-bold text-orange-500">47K</div>
              <div className="text-sm text-muted-foreground">Challenges Completed</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Testimonials */}
      {showTestimonials && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Success Stories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="p-4 bg-slate-100/30 dark:bg-white/5 rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={testimonial.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary/10 text-primary">{testimonial.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{testimonial.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {testimonial.achievement}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic">"{testimonial.text}"</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
