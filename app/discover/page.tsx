"use client"

import { useState } from "react"
import { DiscoverHeader } from "@/components/discover-header"
import { ChallengeGrid } from "@/components/challenge-grid"
import { TrendingChallenges } from "@/components/trending-challenges"
import { FloatingFilterButton } from "@/components/floating-filter-button"
import { FilterDrawer } from "@/components/filter-drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreatorGrid } from "@/components/creator-grid"
import { BrandGrid } from "@/components/brand-grid"
import { ChallengeSwipeStack } from "@/components/discover/challenge-swipe-stack"
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
  const [viewMode, setViewMode] = useState<'swipe' | 'grid'>('swipe')
  const [challenges, setChallenges] = useState<any[]>([])
  const [bookmarkedChallenges, setBookmarkedChallenges] = useState<Set<string>>(new Set())

  const categories = [
    { id: "mindfulness", name: "Mindfulness" },
    { id: "fitness", name: "Fitness" },
    { id: "learning", name: "Learning" },
    { id: "digital-wellness", name: "Digital Wellness" },
    { id: "wellness", name: "Wellness" },
    { id: "productivity", name: "Productivity" },
  ]

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

  // Swipe action handlers
  const handleLikeChallenge = (challenge: any) => {
    console.log('Liked challenge:', challenge.title)
    // TODO: Navigate to challenge join page
    window.location.href = `/challenge/${challenge.id}`
  }

  const handlePassChallenge = (challenge: any) => {
    console.log('Passed challenge:', challenge.title)
    // Challenge is automatically removed from stack
  }

  const handleBookmarkChallenge = (challenge: any) => {
    console.log('Bookmarked challenge:', challenge.title)
    setBookmarkedChallenges(prev => new Set(prev).add(challenge.id))
    // TODO: Save bookmark to backend
  }

  const handleJoinChallenge = (challenge: any) => {
    console.log('Joining challenge:', challenge.title)
    window.location.href = `/challenge/${challenge.id}`
  }

  const handleLoadMoreChallenges = () => {
    console.log('Loading more challenges...')
    // TODO: Fetch more challenges from API
  }

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
                  variant={viewMode === 'swipe' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('swipe')}
                  className="flex items-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  Swipe
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

          {isMobile && viewMode === 'swipe' ? (
            <div className="space-y-8">
              {/* Swipe Mode Header */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Discover Challenges</h2>
                <p className="text-muted-foreground">
                  Swipe right to join • Swipe left to pass • Swipe up to bookmark
                </p>
              </div>

              {/* Challenge Swipe Stack */}
              <div className="flex justify-center px-4">
                <ChallengeSwipeStack
                  challenges={challenges.length > 0 ? challenges : [
                    // Mock data for demo - replace with real API call
                    {
                      id: '1',
                      title: '30-Day Meditation Challenge',
                      description: 'Develop a daily meditation practice and find inner peace. Join thousands of others on this mindfulness journey.',
                      category: 'Mindfulness',
                      difficulty: 'Beginner',
                      duration: '30 days',
                      min_stake: 25,
                      max_stake: 100,
                      participants_count: 1247,
                      total_stake_pool: 15680,
                      host_name: 'Sarah Chen',
                      host_avatar_url: '/avatars/avatar-1.svg'
                    },
                    {
                      id: '2', 
                      title: '21-Day Fitness Transformation',
                      description: 'Build strength, endurance, and confidence with our proven workout program designed for all fitness levels.',
                      category: 'Fitness',
                      difficulty: 'Intermediate',
                      duration: '21 days',
                      min_stake: 50,
                      max_stake: 200,
                      participants_count: 892,
                      total_stake_pool: 28450,
                      host_name: 'Mike Rodriguez',
                      host_avatar_url: '/avatars/avatar-2.svg'
                    },
                    {
                      id: '3',
                      title: 'Digital Detox Week',
                      description: 'Reclaim your time and mental clarity by reducing screen time and building healthier tech habits.',
                      category: 'Digital Wellness',
                      difficulty: 'Beginner',
                      duration: '7 days', 
                      min_stake: 15,
                      max_stake: 50,
                      participants_count: 634,
                      total_stake_pool: 9870,
                      host_name: 'Alex Thompson',
                      host_avatar_url: '/avatars/avatar-3.svg'
                    }
                  ]}
                  onLike={handleLikeChallenge}
                  onPass={handlePassChallenge}
                  onBookmark={handleBookmarkChallenge}
                  onJoin={handleJoinChallenge}
                  onLoadMore={handleLoadMoreChallenges}
                  className="w-full max-w-sm"
                />
              </div>
            </div>
          ) : (
            <>
              <TrendingChallenges />
              <ChallengeGrid />
            </>
          )}
        </TabsContent>

        <TabsContent value="creators" className="space-y-8">
          <CreatorGrid />
        </TabsContent>

        <TabsContent value="brands" className="space-y-8">
          <BrandGrid />
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
