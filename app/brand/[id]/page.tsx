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
import {
  MapPin,
  Calendar,
  ExternalLink,
  Trophy,
  Star,
  UserPlus,
  MessageCircle,
  Share2,
  Building2,
  Award,
} from "lucide-react"

// Mock brand data
const mockBrand = {
  id: "brand-1",
  name: "FitTech Pro",
  username: "@fittechpro",
  avatar: "/placeholder.svg?height=120&width=120",
  bio: "Leading fitness technology company. We create innovative challenges that combine cutting-edge tech with proven fitness science. 🚀💪",
  location: "San Francisco, CA",
  joinDate: "2023-01-10",
  website: "https://fittechpro.com",
  isVerified: true,
  industry: "Fitness Technology",
  stats: {
    followers: 45230,
    following: 156,
    challengesSponsored: 89,
    totalParticipants: 23450,
    totalRewards: 125000,
    avgRating: 4.7,
  },
  categories: ["Fitness", "Technology", "Wellness", "Innovation"],
  isFollowing: false,
  sponsoredChallenges: [
    {
      id: "1",
      title: "Smart Fitness Tracker Challenge",
      description: "Use our latest fitness tracker to complete daily activity goals and win exclusive rewards!",
      category: "Fitness",
      duration: "30 days",
      participants: 2847,
      minStake: 0,
      maxStake: 50,
      difficulty: "Easy",
      isActive: true,
      rating: 4.8,
      rewards: "FitTech Pro Smartwatch + $500 cash",
      isSponsored: true,
    },
    {
      id: "2",
      title: "Corporate Wellness Program",
      description: "Team-based wellness challenge for companies. Improve employee health and team bonding.",
      category: "Wellness",
      duration: "60 days",
      participants: 1892,
      minStake: 25,
      maxStake: 100,
      difficulty: "Medium",
      isActive: true,
      rating: 4.6,
      rewards: "Team retreat + wellness packages",
      isSponsored: true,
    },
    {
      id: "3",
      title: "Innovation Sprint Challenge",
      description: "Build healthy habits while learning about fitness technology and innovation.",
      category: "Technology",
      duration: "21 days",
      participants: 1234,
      minStake: 15,
      maxStake: 75,
      difficulty: "Medium",
      isActive: true,
      rating: 4.5,
      rewards: "Tech gadgets + mentorship sessions",
      isSponsored: true,
    },
  ],
  posts: [
    {
      id: "1",
      type: "announcement" as const,
      content:
        "🎉 Exciting news! We're launching our biggest challenge yet - the Smart Fitness Tracker Challenge with $10,000 in prizes! Join now and transform your fitness journey with cutting-edge technology.",
      likes: 456,
      comments: 78,
      timestamp: "2024-01-15T14:30:00Z",
      isLiked: false,
    },
    {
      id: "2",
      type: "tip" as const,
      content:
        "Did you know? Our data shows that people who track their workouts are 3x more likely to reach their fitness goals. Technology + consistency = success! 📊💪",
      likes: 289,
      comments: 45,
      timestamp: "2024-01-14T11:15:00Z",
      isLiked: true,
    },
    {
      id: "3",
      type: "achievement" as const,
      content:
        "Milestone achieved! 🏆 Over 23,000 people have participated in our sponsored challenges this year. Thank you for being part of the FitTech Pro community!",
      likes: 723,
      comments: 134,
      timestamp: "2024-01-12T09:45:00Z",
      isLiked: false,
    },
  ],
  partnerships: [
    {
      id: 1,
      name: "Nike Training Club",
      type: "Equipment Partner",
      description: "Providing premium workout gear for challenge winners",
    },
    {
      id: 2,
      name: "MyFitnessPal",
      type: "Technology Partner",
      description: "Nutrition tracking integration for wellness challenges",
    },
    {
      id: 3,
      name: "Peloton",
      type: "Content Partner",
      description: "Exclusive workout content for challenge participants",
    },
  ],
}

export default function BrandProfilePage() {
  const params = useParams()
  const brandId = params.id as string
  const [selectedTab, setSelectedTab] = useState("challenges")
  const [brand, setBrand] = useState(mockBrand)

  const handleFollow = () => {
    setBrand((prev) => ({
      ...prev,
      isFollowing: !prev.isFollowing,
      stats: {
        ...prev.stats,
        followers: prev.isFollowing ? prev.stats.followers - 1 : prev.stats.followers + 1,
      },
    }))
  }

  const handleShare = () => {
    navigator.clipboard.writeText(`https://stakr.app/brand/${brand.id}`)
    console.log("Shared brand profile")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Brand Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center md:items-start">
                <div className="relative">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={brand.avatar || "/placeholder.svg"} alt={brand.name} />
                    <AvatarFallback className="text-2xl bg-secondary text-white">
                      {brand.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {brand.isVerified && (
                    <div className="absolute -bottom-2 -right-2 bg-secondary rounded-full p-1">
                      <Star className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}
                </div>
                <div className="text-center md:text-left mt-4">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <h1 className="text-2xl font-bold">{brand.name}</h1>
                    <Building2 className="w-5 h-5 text-secondary" />
                  </div>
                  <p className="text-muted-foreground">{brand.username}</p>
                  <p className="text-sm text-secondary font-medium">{brand.industry}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground justify-center md:justify-start">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {brand.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(brand.joinDate).toLocaleDateString()}
                    </div>
                  </div>
                  {brand.website && (
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-secondary hover:underline mt-2 justify-center md:justify-start"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {brand.website.replace("https://", "")}
                    </a>
                  )}
                </div>
              </div>

              {/* Bio and Actions */}
              <div className="flex-1">
                <p className="text-muted-foreground mb-4 leading-relaxed">{brand.bio}</p>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {brand.categories.map((category) => (
                    <Badge key={category} variant="secondary" className="text-sm">
                      {category}
                    </Badge>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-6">
                  <Button
                    onClick={handleFollow}
                    className={brand.isFollowing ? "bg-gray-200 text-gray-800 hover:bg-gray-300" : ""}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {brand.isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button variant="outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>

                {/* Brand Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">{brand.stats.followers.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{brand.stats.challengesSponsored}</div>
                    <div className="text-sm text-muted-foreground">Sponsored</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${brand.stats.totalRewards.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Rewards</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{brand.stats.avgRating}</div>
                    <div className="text-sm text-muted-foreground">Avg Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="challenges">Sponsored Challenges</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Sponsored Challenges</h2>
              <Badge variant="secondary">{brand.sponsoredChallenges.length} active</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {brand.sponsoredChallenges.map((challenge) => (
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
                    name: brand.name,
                    avatar: brand.avatar,
                    isVerified: brand.isVerified,
                  }}
                  rating={challenge.rating}
                  isSponsored={challenge.isSponsored}
                  rewards={challenge.rewards}
                />
              ))}
            </div>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Recent Posts</h2>
              <Badge variant="secondary">{brand.posts.length} posts</Badge>
            </div>
            <UserPosts posts={brand.posts} user={brand} isOwnProfile={false} />
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Brand Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Brand Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Followers</span>
                    <span className="font-bold">{brand.stats.followers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Challenges Sponsored</span>
                    <span className="font-bold text-secondary">{brand.stats.challengesSponsored}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Participants</span>
                    <span className="font-bold text-primary">{brand.stats.totalParticipants.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Rewards Given</span>
                    <span className="font-bold text-green-600">${brand.stats.totalRewards.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Average Rating</span>
                    <span className="font-bold text-orange-600">{brand.stats.avgRating}/5.0</span>
                  </div>
                </CardContent>
              </Card>

              {/* Partnerships */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Partnerships
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {brand.partnerships.map((partnership) => (
                      <div key={partnership.id} className="p-3 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{partnership.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {partnership.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{partnership.description}</p>
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
