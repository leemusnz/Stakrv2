"use client"

import { useState, useEffect } from "react"
import { DiscoverMobile } from "@/components/discover-mobile"
import { ChallengeGrid } from "@/components/challenge-grid"
import { TrendingChallenges } from "@/components/trending-challenges"
import { FloatingFilterButton } from "@/components/floating-filter-button"
import { FilterDrawer } from "@/components/filter-drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreatorGrid } from "@/components/creator-grid"
import { BrandGrid } from "@/components/brand-grid"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, Award, Sparkles, FlameIcon as Fire } from "lucide-react"

export default function Discover() {
  const { isMobile } = useEnhancedMobile()
  const [activeTab, setActiveTab] = useState("challenges")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("")
  const [selectedDuration, setSelectedDuration] = useState<string>("")
  const [selectedStakeRange, setSelectedStakeRange] = useState<string>("")
  const [challenges, setChallenges] = useState<any[]>([])
  const [creators, setCreators] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalChallenges: 0,
    activeChallenges: 0,
    totalParticipants: 0,
    totalRewards: 0,
  })

  const categories = [
    { id: "mindfulness", name: "Mindfulness" },
    { id: "fitness", name: "Fitness" },
    { id: "learning", name: "Learning" },
    { id: "digital-wellness", name: "Digital Wellness" },
    { id: "wellness", name: "Wellness" },
    { id: "productivity", name: "Productivity" },
  ]

  // Fetch data on component mount
  useEffect(() => {
    const fetchDiscoverData = async () => {
      try {
        setIsLoading(true)

        // Fetch challenges, creators, and brands in parallel
        const [challengesRes, creatorsRes, brandsRes] = await Promise.all([
          fetch("/api/challenges"),
          fetch("/api/creators"),
          fetch("/api/brands"),
        ])

        if (challengesRes.ok) {
          const challengesData = await challengesRes.json()
          const challengesList = challengesData.challenges || []
          setChallenges(challengesList)

          // Calculate stats
          setStats({
            totalChallenges: challengesList.length,
            activeChallenges: challengesList.filter((c: any) => c.status === "active").length,
            totalParticipants: challengesList.reduce((sum: number, c: any) => sum + (c.participants_count || 0), 0),
            totalRewards: challengesList.reduce((sum: number, c: any) => sum + (c.total_stake_pool || 0), 0),
          })
        }

        if (creatorsRes.ok) {
          const creatorsData = await creatorsRes.json()
          setCreators(creatorsData.creators || [])
        }

        if (brandsRes.ok) {
          const brandsData = await brandsRes.json()
          setBrands(brandsData.brands || [])
        }
      } catch (error) {
        console.error("Failed to fetch discover data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDiscoverData()
  }, [])

  const filterCount =
    selectedCategories.length + (selectedDifficulty ? 1 : 0) + (selectedDuration ? 1 : 0) + (selectedStakeRange ? 1 : 0)

  const activeFilters = [
    ...selectedCategories.map((id) => ({
      id,
      label: categories.find((c) => c.id === id)?.name || id,
      onRemove: () => setSelectedCategories((prev) => prev.filter((c) => c !== id)),
    })),
    ...(selectedDifficulty
      ? [
          {
            id: "difficulty",
            label: selectedDifficulty,
            onRemove: () => setSelectedDifficulty(""),
          },
        ]
      : []),
    ...(selectedDuration
      ? [
          {
            id: "duration",
            label: selectedDuration,
            onRemove: () => setSelectedDuration(""),
          },
        ]
      : []),
    ...(selectedStakeRange
      ? [
          {
            id: "stake",
            label: selectedStakeRange,
            onRemove: () => setSelectedStakeRange(""),
          },
        ]
      : []),
  ]

  // Challenge action handlers
  const handleJoinChallenge = (challenge: any) => {
    console.log("Joining challenge:", challenge.title)
    window.location.href = `/challenge/${challenge.id}`
  }

  const handleViewDetails = (challenge: any) => {
    console.log("Viewing challenge details:", challenge.title)
    window.location.href = `/challenge/${challenge.id}`
  }

  const handleSaveChallenge = (challenge: any) => {
    console.log("Saving challenge:", challenge.title)
    // TODO: Implement save functionality
  }

  const handlePassChallenge = (challenge: any) => {
    console.log("Passing on challenge:", challenge.title)
    // TODO: Implement pass functionality
  }

  const handleFollowCreator = (creator: any) => {
    console.log("Following creator:", creator.name)
    // TODO: Implement follow functionality
  }

  // Use mobile discover on mobile devices
  if (isMobile) {
    return (
      <DiscoverMobile
        challenges={challenges}
        creators={creators}
        brands={brands}
        onJoinChallenge={handleJoinChallenge}
        onSaveChallenge={handleSaveChallenge}
        onPassChallenge={handlePassChallenge}
        onFollowCreator={handleFollowCreator}
      />
    )
  }

  // Desktop discover with YouTube-style layout
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Discover Amazing Challenges
          </h1>
          <Fire className="w-8 h-8 text-secondary" />
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Join thousands of people transforming their lives through accountability and community
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{stats.totalChallenges}</div>
              <div className="text-sm text-muted-foreground">Total Challenges</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-secondary">{stats.activeChallenges}</div>
              <div className="text-sm text-muted-foreground">Active Now</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{stats.totalParticipants.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Participants</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-secondary">${stats.totalRewards.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">In Rewards</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="flex justify-center">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted/50 h-12">
            <TabsTrigger value="challenges" className="font-bold text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="creators" className="font-bold text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Creators
            </TabsTrigger>
            <TabsTrigger value="brands" className="font-bold text-base flex items-center gap-2">
              <Award className="w-4 h-4" />
              Brands
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="challenges" className="space-y-8">
          {/* Featured/Trending Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Fire className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Trending This Week</h2>
              <Badge variant="secondary" className="ml-2">
                Hot
              </Badge>
            </div>
            <TrendingChallenges />
          </div>

          {/* Main Challenge Grid */}
          <ChallengeGrid />
        </TabsContent>

        <TabsContent value="creators" className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Top Challenge Creators</h2>
            <p className="text-muted-foreground">Follow inspiring creators and join their challenges</p>
          </div>
          <CreatorGrid creators={creators} />
        </TabsContent>

        <TabsContent value="brands" className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Brand Partnerships</h2>
            <p className="text-muted-foreground">Exclusive challenges from our brand partners</p>
          </div>
          <BrandGrid brands={brands} />
        </TabsContent>
      </Tabs>

      <FloatingFilterButton
        filterCount={filterCount}
        onOpenFilters={() => setIsFilterOpen(true)}
        activeFilters={activeFilters}
      />

      <FilterDrawer
        isOpen={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectedDifficulty={selectedDifficulty}
        setSelectedDifficulty={setSelectedDifficulty}
        selectedDuration={selectedDuration}
        setSelectedDuration={setSelectedDuration}
        selectedStakeRange={selectedStakeRange}
        setSelectedStakeRange={setSelectedStakeRange}
      />
    </div>
  )
}
