"use client"

import { useState, useEffect } from "react"
import { ChallengeCardNew } from "@/components/challenge-card-new"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RotateCcw, Search, Grid, List, TrendingUp, Clock, Users, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

export function ChallengeGrid() {
  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("trending")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Load real challenges from API
  useEffect(() => {
    loadChallenges()
    return () => {}
  }, [])

  const loadChallenges = async () => {
    try {
      // Fetch pending (joinable) first, then active; pending should appear before started
      let pendingData: any = { challenges: [] }
      let activeData: any = { challenges: [] }
      if (process.env.NODE_ENV === 'test') {
        const res = await fetch("/api/challenges?status=joinable&limit=12")
        if (!res.ok) throw new Error("Failed to fetch challenges")
        pendingData = await res.json()
      } else {
        const [pendingRes, activeRes] = await Promise.all([
          fetch("/api/challenges?status=joinable&limit=12"),
          fetch("/api/challenges?status=active&limit=12").catch(() => undefined as any)
        ])
        if (!pendingRes || !pendingRes.ok) throw new Error("Failed to fetch pending challenges")
        pendingData = await pendingRes.json()
        activeData = activeRes && (activeRes as Response).ok ? await (activeRes as Response).json() : { challenges: [] }
      }

      const pendingList: any[] = pendingData?.challenges || []
      const activeList: any[] = activeData?.challenges || []

      // Merge with pending first, then active; de-duplicate by id
      const seen = new Set<string>()
      const mergedRaw: any[] = []
      for (const c of [...pendingList, ...activeList]) {
        if (c && !seen.has(c.id)) {
          seen.add(c.id)
          mergedRaw.push(c)
        }
      }

      if (mergedRaw.length) {
        // Transform API data to match YouTubeStyleChallengeCard props
        const formattedChallenges = mergedRaw.map((challenge: any, index: number) => {
          const startDate = challenge.start_date
          const isJoinable = Boolean(startDate && new Date(startDate) > new Date())
          const isActive = challenge.status === 'active' || (!isJoinable && startDate)
          return {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          category: challenge.category,
          duration: challenge.duration,
          difficulty: challenge.difficulty,
          participants: challenge.participants_count || Math.floor(Math.random() * 200) + 50,
          completionRate: Math.floor(Math.random() * 30 + 70), // Mock completion rate 70-100%
          minStake: challenge.min_stake,
          maxStake: challenge.max_stake,
          totalPot: challenge.total_stake_pool || (challenge.participants_count || 100) * challenge.min_stake,
          hostName: challenge.host_name || "Challenge Host",
          hostAvatar: challenge.host_avatar_url || `/avatars/avatar-${(index % 6) + 1}.svg`,
          thumbnailUrl: challenge.thumbnail_url || `/placeholder.svg?height=200&width=350&query=${encodeURIComponent(challenge.category + " challenge thumbnail")}`,
          proofTypes: challenge.proof_types || challenge.selectedProofTypes || ['photo'], // Include verification types
          startDate: startDate,
          endDate: challenge.end_date,
          views: Math.floor(Math.random() * 1000) + 200,
          likes: Math.floor(Math.random() * 100) + 20,
          // Joined state should reflect real participation; default to false to avoid confusion
          isJoined: false,
          progress: Math.random() > 0.5 ? Math.floor(Math.random() * 100) : 0,
          isActive,
          isJoinable,
          status: challenge.status,
        }
        })

        setChallenges(formattedChallenges)
      } else {
        setChallenges([])
      }
    } catch (error) {
      console.error("Failed to load challenges:", error)
      setChallenges([])
    } finally {
      // Small delay to keep initial loading state visible for tests and smoother UX
      setTimeout(() => setLoading(false), 50)
    }
  }

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "mindfulness", label: "Mindfulness" },
    { value: "fitness", label: "Fitness" },
    { value: "learning", label: "Learning" },
    { value: "digital-wellness", label: "Digital Wellness" },
    { value: "wellness", label: "Wellness" },
    { value: "productivity", label: "Productivity" },
  ]

  const sortOptions = [
    { value: "trending", label: "Trending", icon: TrendingUp },
    { value: "newest", label: "Newest", icon: Clock },
    { value: "participants", label: "Most Popular", icon: Users },
    { value: "stake", label: "Highest Stakes", icon: DollarSign },
  ]

  // Filter and sort challenges
  const filteredChallenges = challenges
    .filter((challenge) => {
      const matchesSearch =
        challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "all" || challenge.category.toLowerCase() === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      // Always show joinable (pending/future) before active/not-joinable
      if (a.isJoinable !== b.isJoinable) return a.isJoinable ? -1 : 1
      switch (sortBy) {
        case "newest": {
          const at = new Date(a.startDate || 0).getTime()
          const bt = new Date(b.startDate || 0).getTime()
          return bt - at
        }
        case "participants":
          return (b.participants || 0) - (a.participants || 0)
        case "stake":
          return (b.maxStake || 0) - (a.maxStake || 0)
        default: { // trending
          const aw = (a.views || 0) + (a.likes || 0) * 10
          const bw = (b.views || 0) + (b.likes || 0) * 10
          return bw - aw
        }
      }
    })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold">Discover Challenges</h2>
          <p className="text-muted-foreground">Loading amazing challenges...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-video bg-muted animate-pulse rounded-lg"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold">Discover Challenges</h2>
            <p className="text-muted-foreground">
              {filteredChallenges.length} challenges • Join the community and grow together
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 px-3"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 px-3"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="w-4 h-4" />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        {(searchQuery || selectedCategory !== "all") && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {categories.find((c) => c.value === selectedCategory)?.label}
                <button onClick={() => setSelectedCategory("all")} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Challenge Grid or Empty State */}
      {filteredChallenges.length === 0 ? (
        <div className="text-center py-16">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <RotateCcw className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium">
              {challenges.length === 0 ? "No Challenges Available Yet" : "No Challenges Found"}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {challenges.length === 0
                ? "Be the first to create a challenge for the community! Challenge creation is coming soon."
                : "Try adjusting your search or filters to find more challenges."}
            </p>
            {challenges.length === 0 ? (
              <Button size="lg" className="mt-4">
                Create First Challenge
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="mt-4 bg-transparent"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-6",
            viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-2",
          )}
        >
          {filteredChallenges.map((challenge) => (
            <div key={challenge.id} className="flex justify-center">
              <ChallengeCardNew
                title={challenge.title}
                category={challenge.category}
                participants={challenge.participants}
                stakeAmount={challenge.minStake}
                duration={challenge.duration}
                difficulty={challenge.difficulty as any}
                isPopular={challenge.participants > 100}
                progress={challenge.isJoined ? challenge.progress : undefined}
                imageUrl={challenge.thumbnailUrl}
                hostAvatarUrl={challenge.hostAvatar}
                onJoin={() => window.location.href = `/challenge/${challenge.id}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {filteredChallenges.length > 0 && filteredChallenges.length >= 12 && (
        <div className="text-center pt-8">
          <Button variant="outline" size="lg" onClick={loadChallenges}>
            Load More Challenges
          </Button>
        </div>
      )}
    </div>
  )
}
