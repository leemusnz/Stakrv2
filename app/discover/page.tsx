"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useApi } from "@/hooks/use-api"
import { LoadingSpinner, SkeletonLoader } from "@/components/loading-spinner"
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
import { FloatingAmbientGlows } from "@/components/floating-ambient-glows"
import { BackgroundImage } from '@/components/ui/background-image'

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
  
  // Use API hook for challenges
  const { data: challengesData, loading: isLoadingChallenges, execute: fetchChallenges } = useApi<{
    challenges: any[]
  }>(
    "/api/challenges?status=joinable",
    { showSuccessToast: false, showErrorToast: true }
  )
  
  const isLoading = isLoadingChallenges
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
        // Fetch challenges first with the useApi hook
        const result = await fetchChallenges()
        
        if (result) {
          const challengesList = result.challenges || []
          setChallenges(challengesList)

          // Calculate stats
          setStats({
            totalChallenges: challengesList.length,
            activeChallenges: challengesList.filter((c: any) => c.status === "active").length,
            totalParticipants: challengesList.reduce((sum: number, c: any) => sum + (c.participants_count || 0), 0),
            totalRewards: challengesList.reduce((sum: number, c: any) => sum + (c.total_stake_pool || 0), 0),
          })
        }

        // Fetch creators and brands in parallel
        const [creatorsRes, brandsRes] = await Promise.all([
          fetch("/api/creators"),
          fetch("/api/brands"),
        ])

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
    // Guard: prevent joining already-started challenges from Discover
    if (challenge.status === 'active') {
      window.location.href = `/challenge/${challenge.id}`
      return
    }
    window.location.href = `/challenge/${challenge.id}`
  }

  const handleViewDetails = (challenge: any) => {
    console.log("Viewing challenge details:", challenge.title)
    window.location.href = `/challenge/${challenge.id}`
  }

  const handleSaveChallenge = async (challenge: any) => {
    try {
      const response = await fetch('/api/user/saved-challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge.id })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(data.alreadySaved ? 'Challenge already saved' : 'Challenge saved!', {
          description: 'View your saved challenges in your profile'
        })
      } else {
        toast.error('Failed to save challenge')
      }
    } catch (error) {
      console.error('Error saving challenge:', error)
      toast.error('Failed to save challenge')
    }
  }

  const handlePassChallenge = (challenge: any) => {
    // For now, just provide feedback that the challenge was passed
    // This could be enhanced later with a "not interested" tracking system
    toast.info('Challenge passed', {
      description: 'We\'ll show you different challenges'
    })
  }

  const handleFollowCreator = async (creator: any) => {
    try {
      const response = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetUserId: creator.id, 
          action: 'follow' 
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Now following ${creator.name}!`, {
          description: 'You\'ll see their challenges and updates in your feed'
        })
      } else {
        toast.error(data.error || 'Failed to follow creator')
      }
    } catch (error) {
      console.error('Error following creator:', error)
      toast.error('Failed to follow creator')
    }
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

  // Desktop discover with themed layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <BackgroundImage 
          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&q=80"
          alt="Discover challenges background"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/75 to-white/85 dark:from-black/85 dark:via-black/75 dark:to-black/85"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black via-transparent to-white/50 dark:to-black/50"></div>
      </div>

      {/* Ambient Glows - Floating Animation */}
      <FloatingAmbientGlows />

      {/* Noise Texture */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-[#F46036]" />
            <h1 className="text-5xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F46036] to-[#D74E25]">Challenges</span>
            </h1>
            <Fire className="w-8 h-8 text-[#D74E25]" />
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-400 font-body max-w-2xl mx-auto">
            Join thousands of people transforming their lives through accountability and community
          </p>

          {/* Stats Row - Themed Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
              <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl p-4 text-center shadow-lg">
                <div className="text-3xl font-heading font-bold text-[#F46036]">{stats.totalChallenges}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 font-body mt-1">Total Challenges</div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
              <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl p-4 text-center shadow-lg">
                <div className="text-3xl font-heading font-bold text-[#D74E25]">{stats.activeChallenges}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 font-body mt-1">Active Now</div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
              <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl p-4 text-center shadow-lg">
                <div className="text-3xl font-heading font-bold text-[#F46036]">{stats.totalParticipants.toLocaleString()}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 font-body mt-1">Participants</div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F46036] to-[#D74E25] rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
              <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl p-4 text-center shadow-lg">
                <div className="text-3xl font-heading font-bold text-[#D74E25]">${stats.totalRewards.toLocaleString()}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 font-body mt-1">In Rewards</div>
              </div>
            </div>
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
    </div>
  )
}
