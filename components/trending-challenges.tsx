"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Clock, Flame, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

export function TrendingChallenges() {
  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load trending challenges
  useEffect(() => {
    loadTrendingChallenges()
  }, [])

  const loadTrendingChallenges = async () => {
    try {
      // TODO: Replace with real API call
      // const response = await fetch('/api/challenges/trending')
      // const data = await response.json()
      // setChallenges(data.challenges)
      
      // For now, show empty state
      setChallenges([])
    } catch (error) {
      console.error('Failed to load trending challenges:', error)
      setChallenges([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Trending Now
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Trending Now
          </h2>
        </div>
      </div>

      {challenges.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium">No Trending Challenges Yet</h3>
            <p className="text-muted-foreground">
              Trending challenges will appear here as the community grows!
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {challenges.map((challenge) => (
            <Card key={challenge.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <Badge variant="secondary" className="text-xs bg-secondary/10 text-secondary border-secondary/20">
                      {challenge.category.toUpperCase()}
                    </Badge>
                    {challenge.hot && (
                      <Badge className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                        <Flame className="w-3 h-3 mr-1" />
                        HOT
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                    {challenge.title}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{challenge.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{challenge.participants}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-success font-medium">
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      {challenge.trend}
                    </div>
                    <div className="text-xs text-muted-foreground">From ${challenge.minStake}</div>
                  </div>

                  <Link href={`/challenge/${challenge.id}`}>
                    <Button
                      size="sm"
                      className="w-full mt-2 group-hover:bg-primary/90 transition-colors hover:shadow-md"
                    >
                      View Challenge
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
