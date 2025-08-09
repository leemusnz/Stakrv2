"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { MobileContainer, MobileSectionWrapper } from "@/components/mobile-container"
import { SwipeableTabs } from "@/components/ui/swipeable-tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { 
  Heart, 
  Filter,
  Search,
  TrendingUp,
  Users,
  Award,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DiscoverMobileProps {
  challenges: any[]
  creators: any[]
  brands: any[]
  onJoinChallenge: (challenge: any) => void
  onSaveChallenge: (challenge: any) => void
  onPassChallenge: (challenge: any) => void
  onFollowCreator: (creator: any) => void
}

export function DiscoverMobile({
  challenges,
  creators,
  brands,
  onJoinChallenge,
  onSaveChallenge,
  onPassChallenge,
  onFollowCreator
}: DiscoverMobileProps) {
  const { isMobile } = useEnhancedMobile()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("challenges")



  if (!isMobile) return null

  // Challenge Content - Simple List for MVP
  const ChallengeContent = () => (
    <div className="space-y-4">
      {challenges.map((challenge, index) => (
        <ChallengeCard
          key={challenge.id || index}
          challenge={challenge}
          onJoin={() => onJoinChallenge(challenge)}
        />
      ))}
    </div>
  )

  // Creator Content - Mobile-optimized
  const CreatorContent = () => (
    <div className="space-y-4">
      {creators.length === 0 ? (
        <Card className="text-center p-8">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No creators yet</h3>
          <p className="text-muted-foreground">Be the first to host a challenge!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {creators.map((creator) => (
            <CreatorCard
              key={creator.id}
              creator={creator}
              onFollow={() => onFollowCreator(creator)}
            />
          ))}
        </div>
      )}
    </div>
  )

  // Brand Content - Mobile-optimized
  const BrandContent = () => (
    <div className="space-y-4">
      {brands.length === 0 ? (
        <Card className="text-center p-8">
          <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No brand partnerships yet</h3>
          <p className="text-muted-foreground">Coming soon!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {brands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
            />
          ))}
        </div>
      )}
    </div>
  )

  const tabs = [
    {
      value: "challenges",
      label: "Challenges",
      content: <ChallengeContent />
    },
    {
      value: "creators",
      label: "Creators",
      content: <CreatorContent />
    },
    {
      value: "brands",
      label: "Brands",
      content: <BrandContent />
    }
  ]

  return (
    <MobileContainer className="pb-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Discover</h1>
        <p className="text-muted-foreground">Find challenges that inspire you</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search challenges..."
          className="pl-10 pr-12"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 h-8 w-8"
        >
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Swipeable Tabs */}
      <SwipeableTabs
        tabs={tabs}
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
        tabsListClassName="grid-cols-3"
      />
    </MobileContainer>
  )
}

// Creator Card Component - Thumbnail-driven for Mobile
function CreatorCard({
  creator,
  onFollow
}: {
  creator: any
  onFollow: () => void
}) {
  return (
    <Card className="transition-all duration-200 hover:shadow-lg overflow-hidden">
      {/* Thumbnail Image */}
      <div className="relative h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Creator</p>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Creator Info */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={creator.avatar} />
            <AvatarFallback>{creator.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="font-bold text-lg">{creator.name}</h4>
            <p className="text-sm text-muted-foreground">
              {creator.challengesHosted} challenges hosted
            </p>
          </div>
        </div>

        {/* Follow Button */}
        <Button
          className="w-full"
          onClick={onFollow}
        >
          Follow Creator
        </Button>
      </CardContent>
    </Card>
  )
}

// Brand Card Component - Thumbnail-driven for Mobile
function BrandCard({
  brand
}: {
  brand: any
}) {
  return (
    <Card className="transition-all duration-200 hover:shadow-lg overflow-hidden">
      {/* Thumbnail Image */}
      <div className="relative h-24 bg-gradient-to-br from-orange-500/20 to-yellow-500/20">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mb-2">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Brand</p>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Brand Info */}
        <div className="mb-3">
          <h4 className="font-bold text-lg mb-2">{brand.name}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">{brand.description}</p>
        </div>

        {/* Coming Soon Badge */}
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            Coming Soon
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// Challenge Card Component - Thumbnail-driven for Mobile
function ChallengeCard({
  challenge,
  onJoin
}: {
  challenge: any
  onJoin: () => void
}) {
  console.log('🔍 ChallengeCard rendering:', {
    id: challenge.id,
    title: challenge.title,
    thumbnail_url: challenge.thumbnail_url
  })

  return (
    <Card className="transition-all duration-200 hover:shadow-lg overflow-hidden">
      {/* Thumbnail Image */}
      <div className="relative h-32 bg-gradient-to-br from-primary/20 to-secondary/20">
        {challenge.thumbnail_url ? (
          <img
            src={challenge.thumbnail_url.includes('stakr-verification-files.s3') 
              ? `/api/image-proxy?url=${encodeURIComponent(challenge.thumbnail_url)}&v=${challenge.thumbnail_url.split('/').pop()?.split('-')[0] || 'default'}`
              : challenge.thumbnail_url
            }
            alt={challenge.title}
            className="w-full h-full object-cover"
            onLoad={() => {
              console.log('✅ Mobile thumbnail loaded successfully:', challenge.thumbnail_url)
            }}
            onError={(e) => {
              console.log('❌ Mobile thumbnail failed to load:', challenge.thumbnail_url)
              // Fall back to placeholder if image fails
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">Challenge</p>
            </div>
          </div>
        )}
        {/* Category Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-xs">{challenge.category}</Badge>
        </div>
        {/* Difficulty Badge */}
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="text-xs">{challenge.difficulty}</Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Challenge Title */}
        <h3 className="text-lg font-bold mb-2 line-clamp-2">{challenge.title}</h3>
        
        {/* Quick Stats Row */}
        <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{challenge.participants_count} joined</span>
          </div>
          <div className="flex items-center gap-1">
            <span>${challenge.min_stake}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{challenge.duration}</span>
          </div>
        </div>

        {/* Host Info */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="w-6 h-6">
            <AvatarImage src={challenge.host_avatar_url} />
            <AvatarFallback>{challenge.host_name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">{challenge.host_name}</p>
          </div>
        </div>

        {/* Join Button */}
        <Button
          className="w-full"
          onClick={onJoin}
        >
          Join Challenge
        </Button>
      </CardContent>
    </Card>
  )
}
