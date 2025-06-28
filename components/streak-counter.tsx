import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame } from "lucide-react"

interface StreakCounterProps {
  currentStreak: number
  longestStreak: number
  streakType: "daily" | "weekly"
}

export function StreakCounter({ currentStreak, longestStreak, streakType }: StreakCounterProps) {
  // Dynamic messaging based on streak length
  const getStreakMessage = () => {
    if (currentStreak === 0) return "🔥 Start your streak!"
    if (currentStreak < 3) return "🔥 Building momentum!"
    if (currentStreak < 7) return "🔥 On a roll!"
    if (currentStreak < 14) return "🔥 Don't break it!"
    if (currentStreak < 30) return "🔥 Unstoppable!"
    return "🔥 Legend status!"
  }

  const getStreakColor = () => {
    if (currentStreak === 0) return "bg-muted text-muted-foreground"
    if (currentStreak < 7) return "bg-primary/10 text-primary border-primary/20"
    if (currentStreak < 14) return "bg-orange-500/10 text-orange-500 border-orange-500/20"
    return "bg-destructive/10 text-destructive border-destructive/20"
  }

  return (
    <Card className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary group-hover:animate-pulse" />
            <span className="font-bold text-sm">STREAK</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {streakType.toUpperCase()}
          </Badge>
        </div>

        {/* Motivational Badge */}
        <div className="mb-4">
          <Badge variant="outline" className={`text-xs font-bold ${getStreakColor()} animate-pulse`}>
            {getStreakMessage()}
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-1 group-hover:scale-105 transition-transform">
              {currentStreak}
            </div>
            <p className="text-sm text-muted-foreground">
              {streakType === "daily" ? "days in a row" : "weeks in a row"}
            </p>
          </div>

          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: Math.min(currentStreak, 7) }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-pulse group-hover:bg-secondary transition-colors"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>

          <div className="text-center pt-2 border-t border-muted">
            <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              Personal best: <span className="font-bold text-foreground">{longestStreak}</span>
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Tap to view history
            </p>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-colors" />
        <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-secondary/5 rounded-full group-hover:bg-secondary/10 transition-colors" />
      </CardContent>
    </Card>
  )
}
