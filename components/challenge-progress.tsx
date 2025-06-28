import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Camera, CheckCircle, Clock, Flag } from "lucide-react"

interface Challenge {
  title: string
  duration: string
}

interface ChallengeProgressProps {
  challenge: Challenge
}

export function ChallengeProgress({ challenge }: ChallengeProgressProps) {
  // Mock progress data
  const progress = {
    currentDay: 3,
    totalDays: 7,
    completedDays: 2,
    todayCompleted: false,
    streak: 2,
    nextDeadline: "Today, 10:00 AM",
  }

  const progressPercentage = (progress.completedDays / progress.totalDays) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Flag className="w-5 h-5 text-primary" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Day {progress.currentDay} of {progress.totalDays}
            </span>
            <Badge variant="secondary" className="text-xs">
              {Math.round(progressPercentage)}% Complete
            </Badge>
          </div>

          <Progress value={progressPercentage} className="h-3" />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{progress.completedDays} days completed</span>
            <span>{progress.totalDays - progress.completedDays} days remaining</span>
          </div>
        </div>

        {/* Today's Status */}
        <div
          className={`p-4 rounded-lg border ${
            progress.todayCompleted ? "bg-success/10 border-success/20" : "bg-orange-500/10 border-orange-500/20"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {progress.todayCompleted ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <Clock className="w-5 h-5 text-orange-500" />
            )}
            <span className="font-medium">{progress.todayCompleted ? "Today: Complete! 🎉" : "Today: Pending"}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {progress.todayCompleted
              ? "Great job! Your streak continues."
              : `Submit proof before ${progress.nextDeadline}`}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          {!progress.todayCompleted && (
            <Button className="w-full font-bold">
              <Camera className="w-4 h-4 mr-2" />
              Submit Today's Proof
            </Button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" className="bg-transparent">
              <Calendar className="w-4 h-4 mr-2" />
              View Calendar
            </Button>
            <Button variant="outline" size="sm" className="bg-transparent">
              <CheckCircle className="w-4 h-4 mr-2" />
              History
            </Button>
          </div>
        </div>

        {/* Streak Info */}
        <div className="text-center p-3 bg-primary/5 rounded-lg">
          <div className="text-2xl font-bold text-primary mb-1">🔥 {progress.streak}</div>
          <p className="text-sm text-muted-foreground">Day streak</p>
        </div>
      </CardContent>
    </Card>
  )
}
