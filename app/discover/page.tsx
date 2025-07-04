"use client"

import { useState, useEffect } from "react"
import { DiscoverHeader } from "@/components/discover-header"
import { DiscoverMobile } from "@/components/discover-mobile"
import { ChallengeGrid } from "@/components/challenge-grid"
import { TrendingChallenges } from "@/components/trending-challenges"
import { FloatingFilterButton } from "@/components/floating-filter-button"
import { FilterDrawer } from "@/components/filter-drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreatorGrid } from "@/components/creator-grid"
import { BrandGrid } from "@/components/brand-grid"
import { ChallengeCarousel } from "@/components/discover/challenge-carousel"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { Button } from "@/components/ui/button"
import { Grid, Layers } from "lucide-react"

export default function Discover() {
  const { isMobile } = useEnhancedMobile()
  const [activeTab, setActiveTab] = useState("challenges")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("")
  const [selectedDuration, setSelectedDuration] = useState<string>("")
  const [selectedStakeRange, setSelectedStakeRange] = useState<string>("")
  const [viewMode, setViewMode] = useState<'browse' | 'grid'>('browse')
  const [challenges, setChallenges] = useState<any[]>([])
  const [creators, setCreators] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
          fetch('/api/challenges'),
          fetch('/api/creators'),
          fetch('/api/brands')
        ])

        if (challengesRes.ok) {
          const challengesData = await challengesRes.json()
          setChallenges(challengesData.challenges || [])
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
        console.error('Failed to fetch discover data:', error)
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
    console.log('Joining challenge:', challenge.title)
    window.location.href = `/challenge/${challenge.id}`
  }

  const handleViewDetails = (challenge: any) => {
    console.log('Viewing challenge details:', challenge.title)
    window.location.href = `/challenge/${challenge.id}`
  }

  const handleSaveChallenge = (challenge: any) => {
    console.log('Saving challenge:', challenge.title)
    // TODO: Implement save functionality
  }

  const handlePassChallenge = (challenge: any) => {
    console.log('Passing on challenge:', challenge.title)
    // TODO: Implement pass functionality
  }

  const handleFollowCreator = (creator: any) => {
    console.log('Following creator:', creator.name)
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

  // Desktop discover
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <DiscoverHeader activeTab={activeTab} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex justify-center">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted/50">
            <TabsTrigger value="challenges" className="font-bold">
              Challenges
            </TabsTrigger>
            <TabsTrigger value="creators" className="font-bold">
              Creators
            </TabsTrigger>
            <TabsTrigger value="brands" className="font-bold">
              Brands
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="challenges" className="space-y-8">
          {isMobile && (
            <div className="flex justify-center mb-6">
              <div className="flex bg-muted p-1 rounded-lg">
                <Button
                  variant={viewMode === 'browse' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('browse')}
                  className="flex items-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  Browse
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="flex items-center gap-2"
                >
                  <Grid className="w-4 h-4" />
                  Grid
                </Button>
              </div>
            </div>
          )}

          {isMobile && viewMode === 'browse' ? (
            <div className="px-4">
              <ChallengeCarousel
                challenges={challenges}
                onJoin={handleJoinChallenge}
                onViewDetails={handleViewDetails}
                className="w-full max-w-lg mx-auto"
              />
            </div>
          ) : (
            <>
              <TrendingChallenges />
              <ChallengeGrid />
            </>
          )}
        </TabsContent>

        <TabsContent value="creators" className="space-y-8">
          <CreatorGrid creators={creators} />
        </TabsContent>

        <TabsContent value="brands" className="space-y-8">
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
