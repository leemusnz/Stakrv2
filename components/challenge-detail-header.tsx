import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Clock,
  Users,
  TrendingUp,
  Share2,
  Bookmark,
  Brain,
  Dumbbell,
  Book,
  Smartphone,
  Heart,
  Briefcase,
  Target,
} from "lucide-react"

interface Challenge {
  title: string
  category: string
  duration: string
  difficulty: "Easy" | "Medium" | "Hard"
  participants: number
  completionRate: number
  totalPot: number
}

interface ChallengeDetailHeaderProps {
  challenge: Challenge
}

export function ChallengeDetailHeader({ challenge }: ChallengeDetailHeaderProps) {
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Easy":
        return "bg-success/10 text-success border-success/20"
      case "Medium":
        return "bg-primary/10 text-primary border-primary/20"
      case "Hard":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted text-foreground border-muted"
    }
  }

  const getCategoryIcon = (cat: string) => {
    const iconClass = "w-4 h-4"
    switch (cat.toLowerCase()) {
      case "mindfulness":
        return <Brain className={iconClass} />
      case "fitness":
        return <Dumbbell className={iconClass} />
      case "learning":
        return <Book className={iconClass} />
      case "digital wellness":
        return <Smartphone className={iconClass} />
      case "wellness":
        return <Heart className={iconClass} />
      case "productivity":
        return <Briefcase className={iconClass} />
      default:
        return <Target className={iconClass} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <span>Challenges</span> / <span className="text-foreground">{challenge.title}</span>
      </div>

      {/* Main Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="text-sm font-bold flex items-center gap-2 bg-secondary/10 text-secondary border-secondary/20"
              >
                {getCategoryIcon(challenge.category)}
                {challenge.category.toUpperCase()}
              </Badge>
              <Badge className={`text-sm font-bold border ${getDifficultyColor(challenge.difficulty)}`}>
                {challenge.difficulty}
              </Badge>
            </div>

            <h1 className="text-4xl font-bold leading-tight">{challenge.title}</h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Bookmark className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">{challenge.duration}</p>
                  <p className="text-xs text-muted-foreground">Duration</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-secondary" />
                <div>
                  <p className="text-sm font-medium">{challenge.participants}</p>
                  <p className="text-xs text-muted-foreground">Participants</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <div>
                  <p className="text-sm font-medium">{challenge.completionRate}%</p>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">${challenge.totalPot.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Pot</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
