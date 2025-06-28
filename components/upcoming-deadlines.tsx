import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, AlertTriangle, CheckCircle } from "lucide-react"

interface Deadline {
  id: string
  challengeTitle: string
  type: "verification" | "completion" | "milestone"
  dueDate: string
  timeLeft: string
  urgency: "high" | "medium" | "low"
}

interface UpcomingDeadlinesProps {
  deadlines: Deadline[]
}

export function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "medium":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "low":
        return "bg-success/10 text-success border-success/20"
      default:
        return "bg-muted text-muted-foreground border-muted"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "verification":
        return <CheckCircle className="w-4 h-4" />
      case "completion":
        return <AlertTriangle className="w-4 h-4" />
      case "milestone":
        return <Clock className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Upcoming Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {deadlines.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
            <p className="text-sm">All caught up! 🎉</p>
          </div>
        ) : (
          deadlines.map((deadline) => (
            <div key={deadline.id} className={`p-3 rounded-lg border ${getUrgencyColor(deadline.urgency)} relative`}>
              {/* Time badge in upper-right corner */}
              <Badge
                variant="outline"
                className={`absolute top-2 right-2 text-xs font-bold ${
                  deadline.urgency === "high"
                    ? "bg-destructive/20 text-destructive border-destructive animate-pulse"
                    : deadline.urgency === "medium"
                      ? "bg-orange-500/20 text-orange-500 border-orange-500"
                      : "bg-success/20 text-success border-success"
                }`}
              >
                {deadline.timeLeft}
              </Badge>

              <div className="flex items-start justify-between mb-2 pr-16">
                <div className="flex items-center gap-2">
                  {getTypeIcon(deadline.type)}
                  <span className="font-medium text-sm">{deadline.challengeTitle}</span>
                </div>
              </div>
              <p className="text-xs opacity-80 mb-3">
                {deadline.type === "verification"
                  ? "Submit proof of completion"
                  : deadline.type === "completion"
                    ? "Complete challenge"
                    : "Reach milestone"}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs bg-transparent hover:bg-muted/50 transition-all min-h-[32px] flex items-center justify-center"
              >
                {deadline.type === "verification"
                  ? "📸 Upload Proof"
                  : deadline.type === "completion"
                    ? "🎯 View Challenge"
                    : "🏆 Check Progress"}
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
