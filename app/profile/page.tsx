"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChallengeCard } from "@/components/challenge-card"
import { UserPosts } from "@/components/user-posts"
import { PostCreationModal } from "@/components/post-creation-modal"
import { MapPin, Calendar, ExternalLink, Trophy, Users, TrendingUp, Settings, Share2, Edit, Flame } from "lucide-react"

// Mock user data
const mockUser = {
  id: "user-1",
  name: "Alex Chen",
  username: "@alexchen",
  avatar: "/placeholder.svg?height=120&width=120",
  bio: "Fitness enthusiast and productivity nerd. Always looking for new challenges to push my limits! 💪📈",
  location: "New York, NY",
  joinDate: "2023-06-15",
  website: "https://alexchen.com",
  isVerified: false,
  stats: {
    followers: 1247,
    following: 389,
    challengesCompleted: 23,
    challengesActive: 3,
    successRate: 87,
    totalEarned: 1250,
    currentStreak: 15,
    longestStreak: 45,
  },
  categories: ["Fitness", "Productivity", "Mindfulness"],
  activeChallenges: [
    {
      id: "1",
      title: "30-Day Morning Workout",
      description: "Start your day with energy! A progressive 30-day workout routine.",
      category: "Fitness",
      duration: "30 days",
      participants: 1247,
      minStake: 25,
      maxStake: 100,
      difficulty: "Medium",
      isJoined: true,
      isActive: true,
      progress: 67,
      creator: {
        name: "Sarah Mitchell",
        avatar: "/placeholder.svg?height=40&width=40",
        isVerified: true,
      },
    },
    {
      id: "2",
      title: "Daily Reading Challenge",
      description: "Read for 30 minutes every day to build a consistent reading habit.",
      category: "Learning",
      duration: "21 days",
      participants: 892,
      minStake: 15,
      maxStake: 75,
      difficulty: "Easy",
      isJoined: true,
      isActive: true,
      progress: 45,
      creator: {
        name: "BookClub Pro",
        avatar: "/placeholder.svg?height=40&width=40",
        isVerified: false,
      },
    },
    {
      id: "3",
      title: "Meditation Mastery",
      description: "Build a daily meditation practice with guided sessions.",
      category: "Mindfulness",
      duration: "14 days",
      participants: 634,
      minStake: 20,
      maxStake: 80,
      difficulty: "Easy",
      isJoined: true,
      isActive: true,
      progress: 85,
      creator: {
        name: "Zen Master",
        avatar: "/placeholder.svg?height=40&width=40",
        isVerified: true,
      },
    },
  ],
  posts: [
    {
      id: "1",
      type: "progress" as const,
      content:
        "Day 20 of my morning workout challenge! 💪 Finally feeling like this is becoming a real habit. The key was starting with just 10 minutes and gradually building up. Who else is working on building consistent habits?",
      challenge: {
        id: "1",
        title: "30-Day Morning Workout",
        category: "Fitness",
      },
      likes: 89,
      comments: 23,
      timestamp: "2024-01-15T07:30:00Z",
      isLiked: false,
    },
    {
      id: "2",
      type: "motivation" as const,
      content:
        "Reminder: You don't have to be perfect, you just have to be consistent. Every small step counts toward your bigger goals! 🎯",
      likes: 156,
      comments: 34,
      timestamp: "2024-01-14T19:15:00Z",
      isLiked: true,
    },
    {
      id: "3",
      type: "achievement" as const,
      content:
        "Just completed my first challenge on Stakr! 🎉 The 7-day water challenge was harder than I thought, but I did it. Already signed up for the next one. The accountability really works!",
      likes: 203,
      comments: 45,
      timestamp: "2024-01-12T16:45:00Z",
      isLiked: false,
    },
    {
      id: "4",
      type: "tip" as const,
      content:
        "Pro tip for anyone starting meditation: Don't aim for perfect silence in your mind. Just notice when your thoughts wander and gently bring attention back to your breath. That's literally the practice! 🧘‍♂️",
      likes: 127,
      comments: 28,
      timestamp: "2024-01-11T08:20:00Z",
      isLiked: true,
    },
  ],
  achievements: [
    {
      id: 1,
      title: "First Steps",
      description: "Completed your first challenge",
      icon: "🎯",
      rarity: "common",
      unlockedDate: "2024-01-10",
    },
    {
      id: 2,
      title: "Streak Master",
      description: "Maintained a 30-day streak",
      icon: "🔥",
      rarity: "rare",
      unlockedDate: "2024-01-08",
    },
    {
      id: 3,
      title: "Community Builder",
      description: "Helped 100+ people with your posts",
      icon: "🤝",
      rarity: "epic",
      unlockedDate: "2024-01-05",
    },
  ],
}

export default function ProfilePage() {
  const [selectedTab, setSelectedTab] = useState("posts")
  const [user, setUser] = useState(mockUser)

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
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center md:items-start">
                <div className="relative">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="text-2xl bg-primary text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-primary hover:bg-primary/90"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-center md:text-left mt-4">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    {user.isVerified && <Badge variant="secondary">Verified</Badge>}
                  </div>
                  <p className="text-muted-foreground">{user.username}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground justify-center md:justify-start">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {user.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(user.joinDate).toLocaleDateString()}
                    </div>
                  </div>
                  {user.website && (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline mt-2 justify-center md:justify-start"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {user.website.replace("https://", "")}
                    </a>
                  )}
                </div>
              </div>

              {/* Bio and Actions */}
              <div className="flex-1">
                <p className="text-muted-foreground mb-4 leading-relaxed">{user.bio}</p>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {user.categories.map((category) => (
                    <Badge key={category} variant="secondary" className="text-sm">
                      {category}
                    </Badge>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-6">
                  <Button variant="outline" className="bg-transparent">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" className="bg-transparent">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Profile
                  </Button>
                  <PostCreationModal user={user} activeChallenges={user.activeChallenges} />
                </div>

                {/* User Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{user.stats.followers.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">{user.stats.following}</div>
                    <div className="text-sm text-muted-foreground">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{user.stats.challengesCompleted}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{user.stats.successRate}%</div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Recent Posts</h2>
              <Badge variant="secondary">{user.posts.length} posts</Badge>
            </div>
            <UserPosts posts={user.posts} user={user} isOwnProfile={true} />
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Active Challenges</h2>
              <Badge variant="secondary">{user.activeChallenges.length} active</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {user.activeChallenges.map((challenge) => (
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
                  isJoined={challenge.isJoined}
                  isActive={challenge.isActive}
                  creator={challenge.creator}
                  progress={challenge.progress}
                />
              ))}
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Achievements</h2>
              <Badge variant="secondary">{user.achievements.length} unlocked</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {user.achievements.map((achievement) => (
                <Card key={achievement.id}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-4xl mb-3">{achievement.icon}</div>
                      <h3 className="font-semibold mb-2">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                      <div className="flex items-center justify-center gap-2">
                        <Badge className={getRarityColor(achievement.rarity)} variant="outline">
                          {achievement.rarity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(achievement.unlockedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Challenge Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Challenge Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Challenges Completed</span>
                    <span className="font-bold text-green-600">{user.stats.challengesCompleted}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Active Challenges</span>
                    <span className="font-bold text-primary">{user.stats.challengesActive}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-bold text-orange-600">{user.stats.successRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Earned</span>
                    <span className="font-bold text-secondary">${user.stats.totalEarned}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Social Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Social Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Followers</span>
                    <span className="font-bold text-primary">{user.stats.followers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Following</span>
                    <span className="font-bold text-secondary">{user.stats.following}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Posts</span>
                    <span className="font-bold text-green-600">{user.posts.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Achievements</span>
                    <span className="font-bold text-orange-600">{user.achievements.length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Streak Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="w-5 h-5" />
                    Streak Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Current Streak</span>
                    <span className="font-bold text-red-600">{user.stats.currentStreak} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Longest Streak</span>
                    <span className="font-bold text-orange-600">{user.stats.longestStreak} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">This Week</span>
                    <span className="font-bold text-green-600">7 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">This Month</span>
                    <span className="font-bold text-blue-600">15 days</span>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Average Completion</span>
                    <span className="font-bold text-green-600">87%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Best Category</span>
                    <span className="font-bold text-primary">Fitness</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Days Active</span>
                    <span className="font-bold text-secondary">156 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Rank</span>
                    <span className="font-bold text-orange-600">Top 15%</span>
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
