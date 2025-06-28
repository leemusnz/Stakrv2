import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Activity, TrendingUp } from "lucide-react"

interface ActivityItem {
  id: string
  user: string
  action: string
  timestamp: string
  avatar: string
}

interface ChallengeParticipantsProps {
  participants: number
  recentActivity: ActivityItem[]
  completionRate: number
}

export function ChallengeParticipants({ participants, recentActivity, completionRate }: ChallengeParticipantsProps) {
  return (
    <div className="space-y-6">
      {/* Community Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Community
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{participants}</div>
              <p className="text-xs text-muted-foreground">Participants</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{completionRate}%</div>
              <p className="text-xs text-muted-foreground">Success Rate</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">4.8</div>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-secondary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={activity.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {activity.user.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.user}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>
                </p>
                <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
              </div>
            </div>
          ))}

          <div className="pt-3 border-t border-muted">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-sm text-muted-foreground">Activity up 23% this week</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Hot 🔥
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
