"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useEnhancedMobile, useSwipeGesture } from "@/hooks/use-enhanced-mobile"
import { MobileContainer, MobileSectionWrapper } from "@/components/mobile-container"
import { SwipeableTabs } from "@/components/ui/swipeable-tabs"
import { ChallengeCarousel } from "@/components/discover/challenge-carousel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { 
  Heart, 
  X, 
  Bookmark, 
  Filter,
  Search,
  TrendingUp,
  Users,
  Award,
  Sparkles,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  RefreshCcw
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
  const [viewMode, setViewMode] = useState<"swipe" | "browse">("swipe")
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0)

  if (!isMobile) return null

  // Swipe-to-Action Challenge Stack
  const SwipeStack = () => {
    const [stackChallenges, setStackChallenges] = useState(challenges.slice(0, 3))
    const topChallengeRef = useRef<HTMLDivElement>(null)
    
    const { swipeDirection, onTouchStart, onTouchEnd, onTouchMove, clearSwipe } = useSwipeGesture(100, 300)

    const handleSwipeAction = (direction: string, challenge: any) => {
      switch (direction) {
        case 'left':
          onPassChallenge(challenge)
          break
        case 'right':
          onJoinChallenge(challenge)
          break
        case 'up':
          onSaveChallenge(challenge)
          break
      }
      
      // Remove the top challenge and add a new one
      setStackChallenges(prev => {
        const remaining = prev.slice(1)
        const nextIndex = currentChallengeIndex + prev.length
        if (nextIndex < challenges.length) {
          remaining.push(challenges[nextIndex])
        }
        return remaining
      })
      
      setCurrentChallengeIndex(prev => prev + 1)
      clearSwipe()
    }

    if (stackChallenges.length === 0) {
      return (
        <Card className="h-[600px] flex items-center justify-center">
          <CardContent className="text-center">
            <RefreshCcw className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No more challenges!</h3>
            <p className="text-muted-foreground mb-4">You've seen them all for now.</p>
            <Button onClick={() => {
              setStackChallenges(challenges.slice(0, 3))
              setCurrentChallengeIndex(0)
            }}>
              Start Over
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="relative h-[600px]">
        {/* Swipe Instructions */}
        <div className="text-center mb-4">
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              <span>Pass</span>
            </div>
            <div className="flex items-center gap-1">
              <ArrowUp className="w-4 h-4" />
              <span>Save</span>
            </div>
            <div className="flex items-center gap-1">
              <ArrowRight className="w-4 h-4" />
              <span>Join</span>
            </div>
          </div>
        </div>

        {/* Challenge Stack */}
        <div className="relative h-full">
          {stackChallenges.map((challenge, index) => (
            <SwipeableCard
              key={`${challenge.id}-${currentChallengeIndex + index}`}
              challenge={challenge}
              index={index}
              isTop={index === 0}
              onSwipe={handleSwipeAction}
              onTouchStart={index === 0 ? onTouchStart : undefined}
              onTouchEnd={index === 0 ? onTouchEnd : undefined}
              onTouchMove={index === 0 ? onTouchMove : undefined}
              swipeDirection={index === 0 ? swipeDirection : null}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={() => handleSwipeAction('left', stackChallenges[0])}
          >
            <X className="w-5 h-5 text-red-500" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={() => handleSwipeAction('up', stackChallenges[0])}
          >
            <Bookmark className="w-5 h-5 text-blue-500" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={() => handleSwipeAction('right', stackChallenges[0])}
          >
            <Heart className="w-5 h-5 text-green-500" />
          </Button>
        </div>
      </div>
    )
  }

  // Challenge Content with Toggle
  const ChallengeContent = () => (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex justify-center">
        <div className="flex bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === 'swipe' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('swipe')}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Swipe Mode
          </Button>
          <Button
            variant={viewMode === 'browse' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('browse')}
            className="flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Browse
          </Button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'swipe' ? (
        <SwipeStack />
      ) : (
        <ChallengeCarousel
          challenges={challenges}
          onJoin={onJoinChallenge}
          onViewDetails={(challenge) => router.push(`/challenge/${challenge.id}`)}
          className="w-full"
        />
      )}
    </div>
  )

  // Creator Content
  const CreatorContent = () => (
    <div className="space-y-4">
      {creators.length === 0 ? (
        <Card className="text-center p-8">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No creators yet</h3>
          <p className="text-muted-foreground">Be the first to host a challenge!</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {creators.map((creator) => (
            <Card key={creator.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={creator.avatar} />
                    <AvatarFallback>{creator.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium">{creator.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {creator.challengesHosted} challenges hosted
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onFollowCreator(creator)}
                  >
                    Follow
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  // Brand Content
  const BrandContent = () => (
    <div className="space-y-4">
      {brands.length === 0 ? (
        <Card className="text-center p-8">
          <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No brand partnerships yet</h3>
          <p className="text-muted-foreground">Coming soon!</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {brands.map((brand) => (
            <Card key={brand.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{brand.name}</h4>
                    <p className="text-sm text-muted-foreground">{brand.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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

// Swipeable Challenge Card Component
function SwipeableCard({
  challenge,
  index,
  isTop,
  onSwipe,
  onTouchStart,
  onTouchEnd,
  onTouchMove,
  swipeDirection
}: {
  challenge: any
  index: number
  isTop: boolean
  onSwipe: (direction: string, challenge: any) => void
  onTouchStart?: (e: React.TouchEvent) => void
  onTouchEnd?: (e: React.TouchEvent) => void
  onTouchMove?: (e: React.TouchEvent) => void
  swipeDirection?: any
}) {
  const scale = 1 - (index * 0.05)
  const yOffset = index * 10
  const zIndex = 10 - index

  // Calculate rotation based on swipe
  let rotation = 0
  let translateX = 0
  let translateY = 0
  
  if (isTop && swipeDirection) {
    const { direction, distance } = swipeDirection
    
    if (direction === 'left') {
      rotation = -distance / 10
      translateX = -distance / 2
    } else if (direction === 'right') {
      rotation = distance / 10
      translateX = distance / 2
    } else if (direction === 'up') {
      translateY = -distance / 2
    }
  }

  return (
    <Card
      className={cn(
        "absolute inset-0 transition-all duration-200 cursor-grab active:cursor-grabbing",
        "shadow-lg border-2",
        isTop && "border-primary/20"
      )}
      style={{
        transform: `
          scale(${scale}) 
          translateY(${yOffset + translateY}px)
          translateX(${translateX}px)
          rotate(${rotation}deg)
        `,
        zIndex
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
    >
      <CardContent className="p-6 h-full flex flex-col">
        {/* Challenge Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-3">
            <Badge variant="secondary" className="mb-2">{challenge.category}</Badge>
            <Badge variant="outline">{challenge.difficulty}</Badge>
          </div>
          <h3 className="text-xl font-bold mb-2 line-clamp-2">{challenge.title}</h3>
          <p className="text-muted-foreground line-clamp-3">{challenge.description}</p>
        </div>

        {/* Challenge Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-bold text-lg">{challenge.duration}</div>
            <div className="text-muted-foreground">Duration</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-bold text-lg">{challenge.participants_count}</div>
            <div className="text-muted-foreground">Joined</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-bold text-lg">${challenge.min_stake}</div>
            <div className="text-muted-foreground">Min Stake</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-bold text-lg">${challenge.total_stake_pool}</div>
            <div className="text-muted-foreground">Total Pool</div>
          </div>
        </div>

        {/* Host Info */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg mt-auto">
          <Avatar className="w-10 h-10">
            <AvatarImage src={challenge.host_avatar_url} />
            <AvatarFallback>{challenge.host_name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{challenge.host_name}</p>
            <p className="text-xs text-muted-foreground">Challenge Host</p>
          </div>
        </div>

        {/* Swipe hint for top card */}
        {isTop && (
          <div className="text-center mt-4">
            <p className="text-xs text-muted-foreground">
              👈 Pass • 👆 Save • 👉 Join
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 