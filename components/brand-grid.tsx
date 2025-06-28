"use client"

import { BrandCard } from "./brand-card"

interface Brand {
  id: string
  name: string
  logo?: string
  description: string
  industry: string
  followers: number
  challengesSponsored: number
  totalRewards: number
  isVerified?: boolean
  isFollowing?: boolean
  categories: string[]
  featuredChallenge?: {
    title: string
    reward: number
    participants: number
  }
}

interface BrandGridProps {
  brands: Brand[]
  loading?: boolean
}

// Mock brands data
const mockBrands: Brand[] = [
  {
    id: "nike-wellness",
    name: "Nike Wellness",
    logo: "/placeholder.svg?height=80&width=80",
    description: "Empowering athletes worldwide to push their limits and achieve greatness through movement.",
    industry: "Sports & Fitness",
    followers: 15420,
    challengesSponsored: 47,
    totalRewards: 145000,
    isVerified: true,
    isFollowing: false,
    categories: ["Fitness", "Running", "Training"],
    featuredChallenge: {
      title: "Nike Run Club Challenge",
      reward: 5000,
      participants: 3247,
    },
  },
  {
    id: "headspace-mindful",
    name: "Headspace",
    logo: "/placeholder.svg?height=80&width=80",
    description: "Making meditation and mindfulness accessible to everyone through guided challenges.",
    industry: "Mental Health & Wellness",
    followers: 12890,
    challengesSponsored: 32,
    totalRewards: 89000,
    isVerified: true,
    isFollowing: true,
    categories: ["Mindfulness", "Mental Health", "Wellness"],
    featuredChallenge: {
      title: "21-Day Mindfulness Journey",
      reward: 3500,
      participants: 2156,
    },
  },
  {
    id: "myfitnesspal",
    name: "MyFitnessPal",
    logo: "/placeholder.svg?height=80&width=80",
    description:
      "Helping millions track their nutrition and achieve their health goals through data-driven challenges.",
    industry: "Health & Nutrition",
    followers: 9876,
    challengesSponsored: 28,
    totalRewards: 67000,
    isVerified: true,
    isFollowing: false,
    categories: ["Nutrition", "Health", "Tracking"],
    featuredChallenge: {
      title: "30-Day Nutrition Tracking",
      reward: 2500,
      participants: 1834,
    },
  },
  {
    id: "duolingo-learn",
    name: "Duolingo",
    logo: "/placeholder.svg?height=80&width=80",
    description: "Making language learning fun and accessible through gamified challenges and streaks.",
    industry: "Education & Learning",
    followers: 8543,
    challengesSponsored: 24,
    totalRewards: 45000,
    isVerified: true,
    isFollowing: false,
    categories: ["Learning", "Languages", "Education"],
    featuredChallenge: {
      title: "30-Day Language Streak",
      reward: 2000,
      participants: 1567,
    },
  },
  {
    id: "calm-meditation",
    name: "Calm",
    logo: "/placeholder.svg?height=80&width=80",
    description: "Creating peaceful moments in busy lives through meditation and sleep challenges.",
    industry: "Mental Health & Wellness",
    followers: 11234,
    challengesSponsored: 35,
    totalRewards: 78000,
    isVerified: true,
    isFollowing: false,
    categories: ["Meditation", "Sleep", "Relaxation"],
    featuredChallenge: {
      title: "Better Sleep Challenge",
      reward: 3000,
      participants: 1923,
    },
  },
  {
    id: "strava-fitness",
    name: "Strava",
    logo: "/placeholder.svg?height=80&width=80",
    description: "Connecting athletes worldwide through social fitness challenges and community motivation.",
    industry: "Sports & Fitness",
    followers: 13567,
    challengesSponsored: 41,
    totalRewards: 112000,
    isVerified: true,
    isFollowing: false,
    categories: ["Fitness", "Running", "Cycling"],
    featuredChallenge: {
      title: "Monthly Distance Challenge",
      reward: 4000,
      participants: 2789,
    },
  },
]

export function BrandGrid({ brands = mockBrands, loading = false }: BrandGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted rounded-lg h-80"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {brands.map((brand) => (
        <BrandCard key={brand.id} brand={brand} />
      ))}
    </div>
  )
}
