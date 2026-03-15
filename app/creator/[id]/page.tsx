"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChallengeCard } from "@/components/challenge-card"
import { UserPosts } from "@/components/user-posts"
// import { Navigation } from "@/components/navigation"
import { MapPin, Calendar, ExternalLink, Trophy, Star, UserPlus, MessageCircle, Share2 } from "lucide-react"

// Mock creator data
const mockCreator = {
  id: "creator-1",
  name: "Sarah Mitchell",
  username: "@sarahmitchell",
  avatar: "/placeholder.svg?height=120&width=120",
  bio: "Certified fitness trainer and wellness coach. Helping people build sustainable habits that last. 💪✨ Creator of the 30-Day Transform series.",
  location: "Los Angeles, CA",
  joinDate: "2023-03-15",
  website: "https://sarahmitchell.com",
  isVerified: true,
  stats: {
    followers: 15420,
    following: 234,
    challengesCreated: 47,
    totalParticipants: 8934,
    successRate: 89,
    avgRating: 4.8,
  },
  categories: ["Fitness", "Wellness", "Nutrition", "Mindfulness"],
  isFollowing: false,
  activeChallenges: [
    {
      id: "1",
      title: "30-Day Morning Workout",
      description:
        "Start your day with energy! A progressive 30-day workout routine designed to build strength and establish a morning fitness habit.",
      category: "Fitness",
      duration: "30 days",
      participants: 1247,
      minStake: 25,
      maxStake: 100,
      difficulty: "Medium",
      isActive: true,
      rating: 4.9,
    },
    {
      id: "2",
      title: "Mindful Eating Challenge",
      description: "Transform your relationship with food through mindful eating practices and portion awareness.",
      category: "Wellness",
      duration: "21 days",
      participants: 892,
      minStake: 15,
      maxStake: 75,
      difficulty: "Easy",
      isActive: true,
      rating: 4.7,
    },
    {
      id: "3",
      title: "5AM Club Challenge",
      description: "Join the 5AM club and transform your mornings with early rising, meditation, and goal-setting.",
      category: "Productivity",
      duration: "14 days",
      participants: 634,
      minStake: 20,
      maxStake: 80,
      difficulty: "Hard",
      isActive: true,
      rating: 4.6,
    },
  ],
  posts: [
    {
      id: "1",
      type: "motivation" as const,
      content:
        "Remember: Progress over perfection! Every small step counts toward your bigger goals. What's one small win you had today? 💪",
      likes: 234,
      comments: 45,
      timestamp: "2024-01-15T10:30:00Z",
      isLiked: false,
    },
    {
      id: "2",
      type: "tip" as const,
      content:
        "Pro tip: Set your workout clothes out the night before. This simple habit removes friction and makes it easier to stick to your morning routine! 👟",
      likes: 189,
      comments: 32,
      timestamp: "2024-01-14T08:15:00Z",
      isLiked: true,
    },
    {
      id: "3",
      type: "achievement" as const,
      content:
        "Incredible milestone! Over 8,000 people have joined my challenges this year. Thank you for trusting me with your fitness journey! 🎉",
      likes: 567,
      comments: 89,
      timestamp: "2024-01-12T16:45:00Z",
      isLiked: false,
    },
  ],
  achievements: [
    {
      id: 1,
      title: "Top Creator",
      description: "Ranked in top 1% of challenge creators",
      icon: "🏆",
      rarity: "legendary",
    },
    {
      id: 2,
      title: "Community Builder",
      description: "Helped 5000+ people achieve their goals",
      icon: "🤝",
      rarity: "epic",
    },
    {
      id: 3,
      title: "Consistency Champion",
      description: "Created challenges for 12+ consecutive months",
      icon: "📅",
      rarity: "rare",
    },
  ],
}

export default function CreatorProfilePage() {
  const params = useParams()
  const creatorId = params.id as string
  const [selectedTab, setSelectedTab] = useState("challenges")
  const [creator, setCreator] = useState(mockCreator)

  const handleFollow = () => {
    setCreator((prev) => ({
      ...prev,
      isFollowing: !prev.isFollowing,
      stats: {
        ...prev.stats,
        followers: prev.isFollowing ? prev.stats.followers - 1 : prev.stats.followers + 1,
      },
    }))
  }

  const handleShare = () => {
    navigator.clipboard.writeText(`https://stakr.app/creator/${creator.id}`)
    console.log("Shared creator profile")
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-100 text-gray-800 border-gray-300"
      case "rare":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "epic":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "legendary":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F]">
      {/* <Navigation
        user={{
          name: "Alex Chen",
          avatar: "/placeholder.svg?height=40&width=40",
          credits: 250,
          activeStakes: 3,
        }}
      /> */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Creator Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center md:items-start">
                <div className="relative">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} />
                    <AvatarFallback className="text-2xl bg-primary text-white">
                      {creator.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {creator.isVerified && (
                    <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-1">
                      <Star className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}
                </div>
                <div className="text-center md:text-left mt-4">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <h1 className="text-2xl font-bold">{creator.name}</h1>
                  </div>
                  <p className="text-muted-foreground">{creator.username}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground justify-center md:justify-start">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {creator.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(creator.joinDate).toLocaleDateString()}
                    </div>
                  </div>
                  {creator.website && (
                    <a
                      href={creator.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline mt-2 justify-center md:justify-start"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {creator.website.replace("https://", "")}
                    </a>
                  )}
                </div>
              </div>

              {/* Bio and Actions */}
              <div className="flex-1">
                <p className="text-muted-foreground mb-4 leading-relaxed">{creator.bio}</p>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {creator.categories.map((category) => (
                    <Badge key={category} variant="secondary" className="text-sm">
                      {category}
                    </Badge>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-6">
                  <Button
                    onClick={handleFollow}
                    className={creator.isFollowing ? "bg-gray-200 text-gray-800 hover:bg-gray-300" : ""}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {creator.isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button variant="outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>

                {/* Creator Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{creator.stats.followers.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">{creator.stats.challengesCreated}</div>
                    <div className="text-sm text-muted-foreground">Challenges</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{creator.stats.successRate}%</div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{creator.stats.avgRating}</div>
                    <div className="text-sm text-muted-foreground">Avg Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Creator Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Active Challenges</h2>
              <Badge variant="secondary">{creator.activeChallenges.length} active</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creator.activeChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  id={challenge.id}
                  title={challenge.title}
                  description={challenge.description}
                  category={challenge.category}
                  duration={challenge.duration}
                  participants={challenge.participants}
                  minStake={challenge.minStake}
                  maxStake={challenge.maxStake}
                  difficulty={challenge.difficulty}
                  isJoined={false}
                  isActive={challenge.isActive}
                  creator={{
                    name: creator.name,
                    avatar: creator.avatar,
                    isVerified: creator.isVerified,
                  }}
                  rating={challenge.rating}
                />
              ))}
            </div>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Recent Posts</h2>
              <Badge variant="secondary">{creator.posts.length} posts</Badge>
            </div>
            <UserPosts posts={creator.posts} user={creator} isOwnProfile={false} />
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Creator Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Creator Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Followers</span>
                    <span className="font-bold">{creator.stats.followers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Challenges Created</span>
                    <span className="font-bold text-primary">{creator.stats.challengesCreated}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Participants</span>
                    <span className="font-bold text-secondary">{creator.stats.totalParticipants.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-bold text-green-600">{creator.stats.successRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Average Rating</span>
                    <span className="font-bold text-orange-600">{creator.stats.avgRating}/5.0</span>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {creator.achievements.map((achievement) => (
                      <div key={achievement.id} className="p-3 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{achievement.title}</h3>
                              <Badge className={getRarityColor(achievement.rarity)} variant="outline">
                                {achievement.rarity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
