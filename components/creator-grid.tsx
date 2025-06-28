"use client"

import { CreatorCard } from "./creator-card"

interface Creator {
  id: string
  name: string
  username?: string
  avatar?: string
  bio: string
  followers: number
  challengesCreated?: number
  successRate: number
  totalEarnings: number
  isVerified?: boolean
  isFollowing?: boolean
  categories: string[]
  recentChallenge?: {
    title: string
    participants: number
  }
}

interface CreatorGridProps {
  creators: Creator[]
  loading?: boolean
}

// Mock creators data
const mockCreators: Creator[] = [
  {
    id: "sarah-chen",
    name: "Sarah Chen",
    username: "sarahchen",
    avatar: "/placeholder.svg?height=80&width=80",
    bio: "Mindfulness coach helping people build sustainable meditation habits through guided challenges.",
    followers: 2847,
    challengesCreated: 23,
    successRate: 87,
    totalEarnings: 12450,
    isVerified: true,
    isFollowing: false,
    categories: ["Mindfulness", "Wellness", "Productivity"],
    recentChallenge: {
      title: "30-Day Morning Meditation",
      participants: 1247,
    },
  },
  {
    id: "mike-fitness",
    name: "Mike Rodriguez",
    username: "mikefit",
    avatar: "/placeholder.svg?height=80&width=80",
    bio: "Personal trainer and fitness enthusiast. Creating challenges that make fitness fun and accessible.",
    followers: 1923,
    challengesCreated: 18,
    successRate: 82,
    totalEarnings: 8900,
    isVerified: false,
    isFollowing: true,
    categories: ["Fitness", "Health", "Strength"],
    recentChallenge: {
      title: "30-Day Push-up Challenge",
      participants: 892,
    },
  },
  {
    id: "lisa-productivity",
    name: "Lisa Wang",
    username: "lisawang",
    avatar: "/placeholder.svg?height=80&width=80",
    bio: "Productivity expert and author. Helping professionals optimize their daily routines for success.",
    followers: 3421,
    challengesCreated: 31,
    successRate: 91,
    totalEarnings: 15600,
    isVerified: true,
    isFollowing: false,
    categories: ["Productivity", "Learning", "Career"],
    recentChallenge: {
      title: "Deep Work Challenge",
      participants: 1567,
    },
  },
  {
    id: "alex-nutrition",
    name: "Alex Kim",
    username: "alexnutrition",
    avatar: "/placeholder.svg?height=80&width=80",
    bio: "Registered dietitian creating sustainable nutrition challenges for long-term health.",
    followers: 1654,
    challengesCreated: 15,
    successRate: 89,
    totalEarnings: 7800,
    isVerified: false,
    isFollowing: false,
    categories: ["Nutrition", "Health", "Cooking"],
    recentChallenge: {
      title: "Plant-Based Week",
      participants: 743,
    },
  },
  {
    id: "jordan-mindset",
    name: "Jordan Taylor",
    username: "jordanmindset",
    avatar: "/placeholder.svg?height=80&width=80",
    bio: "Life coach specializing in mindset transformation and personal development challenges.",
    followers: 2156,
    challengesCreated: 27,
    successRate: 85,
    totalEarnings: 11200,
    isVerified: true,
    isFollowing: false,
    categories: ["Mindset", "Personal Development", "Goals"],
    recentChallenge: {
      title: "Gratitude Journal Challenge",
      participants: 1089,
    },
  },
  {
    id: "emma-creativity",
    name: "Emma Thompson",
    username: "emmacreates",
    avatar: "/placeholder.svg?height=80&width=80",
    bio: "Artist and creativity coach inspiring others to unlock their creative potential through daily practice.",
    followers: 1789,
    challengesCreated: 21,
    successRate: 78,
    totalEarnings: 9300,
    isVerified: false,
    isFollowing: false,
    categories: ["Creativity", "Art", "Writing"],
    recentChallenge: {
      title: "Daily Sketch Challenge",
      participants: 634,
    },
  },
]

export function CreatorGrid({ creators = mockCreators, loading = false }: CreatorGridProps) {
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
      {creators.map((creator) => (
        <CreatorCard key={creator.id} creator={creator} />
      ))}
    </div>
  )
}
