import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { User, CheckCircle, Trophy, TrendingUp, MessageCircle } from "lucide-react"

interface Host {
  name: string
  avatar: string
  bio: string
  completedChallenges: number
  successRate: number
  verified: boolean
}

interface ChallengeHostProps {
  host: Host
}

export function ChallengeHost({ host }: ChallengeHostProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Challenge Host
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Host Profile */}
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={host.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">{host.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold">{host.name}</h3>
              {host.verified && <CheckCircle className="w-4 h-4 text-success" />}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">{host.bio}</p>
          </div>
        </div>

        {/* Host Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-orange-500" />
              <span className="font-bold">{host.completedChallenges}</span>
            </div>
            <p className="text-xs text-muted-foreground">Challenges</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="font-bold">{host.successRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </div>
        </div>

        {/* Credibility Badges */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
              ✓ Verified Host
            </Badge>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              🏆 Top Rated
            </Badge>
          </div>
        </div>

        {/* Contact Host */}
        <Button variant="outline" className="w-full text-sm bg-transparent">
          <MessageCircle className="w-4 h-4 mr-2" />
          Message Host
        </Button>
      </CardContent>
    </Card>
  )
}
