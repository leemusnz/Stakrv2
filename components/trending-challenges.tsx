"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Clock, Flame, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

export function TrendingChallenges() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const trendingChallenges = [
    {
      id: "morning-meditation-7day",
      title: "Morning Meditation Streak",
      category: "Mindfulness",
      participants: 234,
      duration: "7 days",
      minStake: 10,
      trend: "+47 today",
      hot: true,
    },
    {
      id: "10k-steps-daily",
      title: "10K Steps Daily",
      category: "Fitness",
      participants: 567,
      duration: "14 days",
      minStake: 25,
      trend: "+23 today",
      hot: true,
    },
    {
      id: "no-social-media",
      title: "Digital Detox Challenge",
      category: "Digital Wellness",
      participants: 89,
      duration: "30 days",
      minStake: 50,
      trend: "+12 today",
      hot: false,
    },
    {
      id: "gratitude-journal-unique",
      title: "Daily Gratitude Practice",
      category: "Mindfulness",
      participants: 189,
      duration: "14 days",
      minStake: 15,
      trend: "+31 today",
      hot: true,
    },
    {
      id: "early-riser-challenge",
      title: "5 AM Club Challenge",
      category: "Productivity",
      participants: 145,
      duration: "21 days",
      minStake: 35,
      trend: "+18 today",
      hot: false,
    },
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(trendingChallenges.length / 3))
  }

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + Math.ceil(trendingChallenges.length / 3)) % Math.ceil(trendingChallenges.length / 3),
    )
  }

  const visibleChallenges = trendingChallenges.slice(currentSlide * 3, (currentSlide + 1) * 3)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Trending Now
          </h2>
          <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
            <Flame className="w-3 h-3 mr-1" />
            Hot picks
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={prevSlide} className="h-8 w-8 p-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={nextSlide} className="h-8 w-8 p-0">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {visibleChallenges.map((challenge) => (
            <Card key={challenge.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
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

                  {/* Title */}
                  <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                    {challenge.title}
                  </h3>

                  {/* Stats */}
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

                  {/* Trending Info */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-success font-medium">
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      {challenge.trend}
                    </div>
                    <div className="text-xs text-muted-foreground">From ${challenge.minStake}</div>
                  </div>

                  {/* CTA */}
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
      </div>
    </div>
  )
}
