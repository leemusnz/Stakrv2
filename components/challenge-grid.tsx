"use client"

import { useState } from "react"
import { ChallengeCard } from "@/components/challenge-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RotateCcw } from "lucide-react"

export function ChallengeGrid() {
  const [showFiltered, setShowFiltered] = useState(false)

  // Mock challenge data - unique challenges not in trending
  const allChallenges = [
    {
      id: "read-20-pages-daily",
      title: "Read 20 Pages Daily",
      description: "Read at least 20 pages of a book every day. Expand your mind and build a consistent reading habit.",
      category: "Learning",
      duration: "21 days",
      participants: 345,
      minStake: 15,
      maxStake: 150,
      difficulty: "Easy" as const,
    },
    {
      id: "cold-shower-challenge",
      title: "Cold Shower Challenge",
      description: "Take a cold shower every morning for 14 days. Build mental toughness and boost your energy levels.",
      category: "Wellness",
      duration: "14 days",
      participants: 156,
      minStake: 20,
      maxStake: 100,
      difficulty: "Medium" as const,
    },
    {
      id: "side-project-launch",
      title: "Launch Your Side Project",
      description: "Ship a complete side project in 30 days. No more excuses - it's time to build something real.",
      category: "Productivity",
      duration: "30 days",
      participants: 67,
      minStake: 100,
      maxStake: 1000,
      difficulty: "Hard" as const,
    },
    {
      id: "no-junk-food",
      title: "No Junk Food Challenge",
      description:
        "Eliminate all processed junk food from your diet for 21 days. Feel the difference in your energy and health.",
      category: "Wellness",
      duration: "21 days",
      participants: 298,
      minStake: 30,
      maxStake: 150,
      difficulty: "Medium" as const,
    },
    {
      id: "learn-new-skill",
      title: "Learn a New Skill",
      description: "Dedicate 1 hour daily to learning a completely new skill. 30 days to transform your capabilities.",
      category: "Learning",
      duration: "30 days",
      participants: 124,
      minStake: 40,
      maxStake: 200,
      difficulty: "Medium" as const,
    },
    {
      id: "water-intake-challenge",
      title: "Daily Water Goal",
      description: "Drink 8 glasses of water every single day for 14 days. Hydrate your way to better health.",
      category: "Wellness",
      duration: "14 days",
      participants: 412,
      minStake: 10,
      maxStake: 50,
      difficulty: "Easy" as const,
    },
    {
      id: "phone-free-evenings",
      title: "Phone-Free Evenings",
      description: "Put your phone away after 8 PM every night for 21 days. Reclaim your evening peace.",
      category: "Digital Wellness",
      duration: "21 days",
      participants: 178,
      minStake: 25,
      maxStake: 100,
      difficulty: "Medium" as const,
    },
    {
      id: "daily-pushups",
      title: "100 Push-ups Daily",
      description: "Complete 100 push-ups every day for 30 days. Build strength and discipline simultaneously.",
      category: "Fitness",
      duration: "30 days",
      participants: 289,
      minStake: 20,
      maxStake: 150,
      difficulty: "Hard" as const,
    },
    {
      id: "creative-writing",
      title: "Daily Creative Writing",
      description: "Write 500 words of creative content every day for 21 days. Unlock your creative potential.",
      category: "Learning",
      duration: "21 days",
      participants: 156,
      minStake: 25,
      maxStake: 100,
      difficulty: "Medium" as const,
    },
  ]

  const displayedChallenges = showFiltered ? allChallenges.slice(0, 6) : allChallenges

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">All Challenges</h2>
          <p className="text-sm text-muted-foreground">
            Showing {displayedChallenges.length} challenges • Sorted by popularity
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            {displayedChallenges.length} results
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground hover:text-foreground bg-transparent"
            onClick={() => setShowFiltered(!showFiltered)}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {showFiltered ? "Show All" : "Reset View"}
          </Button>
        </div>
      </div>

      {/* Challenge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedChallenges.map((challenge) => (
          <ChallengeCard key={challenge.id} {...challenge} />
        ))}
      </div>

      {/* Load More */}
      <div className="text-center pt-8">
        <Button variant="outline" size="lg" className="bg-transparent hover:bg-muted">
          Load More Challenges
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Showing {displayedChallenges.length} of {allChallenges.length + 5} challenges
        </p>
      </div>
    </div>
  )
}
