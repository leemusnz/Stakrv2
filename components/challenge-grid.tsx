"use client"

import { useState, useEffect } from "react"
import { ChallengeCard } from "@/components/challenge-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RotateCcw } from "lucide-react"

export function ChallengeGrid() {
  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load real challenges from API
  useEffect(() => {
    loadChallenges()
  }, [])

  const loadChallenges = async () => {
    try {
      // TODO: Replace with real API call
      // const response = await fetch('/api/challenges')
      // const data = await response.json()
      // setChallenges(data.challenges)
      
      // For now, show empty state
      setChallenges([])
    } catch (error) {
      console.error('Failed to load challenges:', error)
      setChallenges([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">All Challenges</h2>
          <p className="text-sm text-muted-foreground">Loading challenges...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">All Challenges</h2>
          <p className="text-sm text-muted-foreground">
            Community challenges will appear here as they're created
          </p>
        </div>
      </div>

      {/* Challenge Grid or Empty State */}
      {challenges.length === 0 ? (
        <div className="text-center py-16">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <RotateCcw className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium">No Challenges Available Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Be the first to create a challenge for the community! Challenge creation is coming soon.
            </p>
            <Button size="lg" className="mt-4">
              Create First Challenge
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} {...challenge} />
          ))}
        </div>
      )}
    </div>
  )
}
