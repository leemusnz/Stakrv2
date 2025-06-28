import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Trophy, Zap, Target, CheckCircle, Users, TrendingUp } from "lucide-react"

interface ActivityItem {
  id: string
  type: "joined" | "completed" | "verified" | "milestone" | "earned"
  title: string
  description: string
  timestamp: string
  amount?: number
  challenge?: string
}

interface ActivityFeedProps {
  activities: ActivityItem[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "joined":
        return <Zap className="w-4 h-4 text-primary" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-success" />
      case "verified":
        return <Target className="w-4 h-4 text-secondary" />
      case "milestone":
        return <Trophy className="w-4 h-4 text-orange-500" />
      case "earned":
        return <Trophy className="w-4 h-4 text-success" />
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "joined":
        return "bg-primary/10 border-primary/20"
      case "completed":
        return "bg-success/10 border-success/20"
      case "verified":
        return "bg-secondary/10 border-secondary/20"
      case "milestone":
        return "bg-orange-500/10 border-orange-500/20"
      case "earned":
        return "bg-success/10 border-success/20"
      default:
        return "bg-muted border-muted"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
        {/* Leaderboard Link */}
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <TrendingUp className="w-3 h-3" />
          Leaderboard
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 animate-in slide-in-from-left-4"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`p-2 rounded-full border ${getActivityColor(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{activity.title}</p>
                <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
              </div>
              <p className="text-xs text-muted-foreground">{activity.description}</p>
              {activity.amount && (
                <Badge variant="secondary" className="text-xs">
                  +${activity.amount}
                </Badge>
              )}
            </div>
          </div>
        ))}

        {/* Subtle Social Motivation */}
        <div className="pt-3 border-t border-muted">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>You're ahead of 73% of users this week</span>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-auto p-1 hover:text-primary">
              See ranking →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
