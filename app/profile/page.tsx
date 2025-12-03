"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SwipeableTabs } from "@/components/ui/swipeable-tabs"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { ChallengeCard } from "@/components/challenge-card"
import { UserPosts } from "@/components/user-posts"
import { PostCreationModal } from "@/components/post-creation/post-creation-modal"
import { SocialShareModal } from "@/components/social-sharing/social-share-modal"
import { ProfilePictureUpload } from "@/components/profile-picture-upload"
import { getPersonalizedAvatar } from "@/lib/avatars"
import { MapPin, Calendar, ExternalLink, Trophy, Users, TrendingUp, Settings, Share2, Edit, Flame } from "lucide-react"
import { FloatingAmbientGlows } from '@/components/floating-ambient-glows'

export default function ProfilePage() {
  const { isMobile } = useEnhancedMobile()
  const { data: session, status } = useSession()
  const [selectedTab, setSelectedTab] = useState("posts")
  const [loading, setLoading] = useState(true)
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)
  const [user, setUser] = useState({
    id: "",
    name: "",
    username: "",
    avatar: "",
    bio: "",
    location: "",
    joinDate: "",
    website: "",
    isVerified: false,
    stats: {
      followers: 0,
      following: 0,
      challengesCompleted: 0,
      challengesActive: 0,
      successRate: 0,
      totalEarned: 0,
      currentStreak: 0,
      longestStreak: 0,
    },
    categories: [] as string[],
    activeChallenges: [] as any[],
    posts: [] as any[],
    achievements: [] as any[],
  })

  // Get default avatar based on user email
  const getDefaultAvatar = () => {
    if (session?.user?.email) {
      return getPersonalizedAvatar(session.user.email).url
    }
    return "/placeholder.svg"
  }

  // Load real user data and update when session changes
  useEffect(() => {
    if (session?.user) {
      const rawAvatar = session.user.image || getDefaultAvatar()
      let avatarUrl = rawAvatar
      
      // Use image proxy for S3 URLs to match settings page behavior
      if (rawAvatar && rawAvatar.includes('stakr-verification-files.s3')) {
        const stableTimestamp = rawAvatar.split('/').pop()?.split('-')[0] || 'default'
        avatarUrl = `/api/image-proxy?url=${encodeURIComponent(rawAvatar)}&v=${stableTimestamp}`
      }
      
      setUser(prev => ({
        ...prev,
        id: session.user.id,
        name: session.user.name || "",
        username: `@${session.user.email?.split('@')[0] || 'user'}`,
        avatar: avatarUrl,
        bio: "Welcome to Stakr! Complete challenges to build your profile.",
        joinDate: new Date().toISOString().split('T')[0], // Today as join date for demo
        isVerified: false,
        stats: {
          followers: 0,
          following: 0,
          challengesCompleted: session.user.challengesCompleted || 0,
          challengesActive: 0,
          successRate: 100,
          totalEarned: 0,
          currentStreak: session.user.currentStreak || 0,
          longestStreak: session.user.longestStreak || 0,
        }
      }))
      setLoading(false)
    }
  }, [session])

  // Update avatar when session image changes (for real-time updates)
  useEffect(() => {
    if (session?.user?.image) {
      const rawAvatar = session.user.image
      let avatarUrl = rawAvatar
      
      // Use image proxy for S3 URLs
      if (rawAvatar.includes('stakr-verification-files.s3')) {
        const stableTimestamp = rawAvatar.split('/').pop()?.split('-')[0] || 'default'
        avatarUrl = `/api/image-proxy?url=${encodeURIComponent(rawAvatar)}&v=${stableTimestamp}`
      }
      
      setUser(prev => ({ ...prev, avatar: avatarUrl }))
      console.log('🔄 Profile page avatar updated:', avatarUrl)
    }
  }, [session?.user?.image])

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

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    // Convert S3 URL to proxy URL for consistency
    let avatarUrl = newAvatarUrl
    if (newAvatarUrl.includes('stakr-verification-files.s3')) {
      const stableTimestamp = newAvatarUrl.split('/').pop()?.split('-')[0] || 'default'
      avatarUrl = `/api/image-proxy?url=${encodeURIComponent(newAvatarUrl)}&v=${stableTimestamp}`
    }
    
    setUser(prev => ({ ...prev, avatar: avatarUrl }))
    setShowAvatarUpload(false)
    console.log('🔄 Profile page handleAvatarUpdate:', avatarUrl)
    
    // Force a re-render to ensure the avatar updates immediately
    setTimeout(() => {
      setUser(prev => ({ ...prev }))
    }, 100)
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Please Sign In</h1>
          <p className="text-muted-foreground">You need to be logged in to view your profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] relative overflow-hidden">
      {/* Ambient Glows */}
      <FloatingAmbientGlows />

      {/* Noise Texture */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center md:items-start">
                <div className="relative">
                  {showAvatarUpload ? (
                    <div className="space-y-4">
                      <ProfilePictureUpload
                        currentAvatar={user.avatar}
                        userName={user.name}
                        size="lg"
                        showControls={true}
                        onAvatarUpdate={handleAvatarUpdate}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowAvatarUpload(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Avatar 
                        className="w-32 h-32"
                        key={`profile-avatar-${user.avatar}`} // Force re-render when avatar changes
                      >
                        <AvatarImage 
                          src={user.avatar} 
                          alt={user.name} 
                          onLoad={() => console.log('🖼️ Profile page avatar loaded:', user.avatar)}
                        />
                        <AvatarFallback className="text-2xl bg-primary text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        onClick={() => setShowAvatarUpload(true)}
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-primary hover:bg-primary/90"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </>
                  )}
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
                      {user.location || "Not specified"}
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
                  <Button 
                    variant="outline" 
                    className="bg-transparent"
                    onClick={() => window.location.href = '/settings'}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>

                  <PostCreationModal
                    trigger={
                      <Button>
                        Create Post
                      </Button>
                    }
                    onPostCreated={(post) => {
                      console.log('Post created:', post)
                      // Could update user posts here
                      setUser(prev => ({
                        ...prev,
                        posts: [post, ...prev.posts]
                      }))
                    }}
                  />
                  <SocialShareModal
                    trigger={
                      <Button variant="outline" className="bg-transparent">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Stats
                      </Button>
                    }
                    content={{
                      type: 'stats',
                      title: `${user.name}'s Stakr Journey`,
                      description: `Check out my progress on Stakr!`,
                      url: `${typeof window !== 'undefined' ? window.location.origin : ''}/profile`,
                      stats: {
                        challengesCompleted: user.stats.challengesCompleted,
                        successRate: user.stats.successRate,
                        currentStreak: user.stats.currentStreak,
                        totalEarnings: user.stats.totalEarned
                      }
                    }}
                    onShare={(platform) => {
                      console.log('Shared to:', platform)
                    }}
                  />
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
        {isMobile ? (
          <SwipeableTabs
            defaultValue="posts"
            value={selectedTab}
            onValueChange={setSelectedTab}
            tabs={[
              {
                value: "posts",
                label: `Posts (${user.posts.length})`,
                content: (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold">Recent Posts</h2>
                      <Badge variant="secondary">{user.posts.length} posts</Badge>
                    </div>
                    {user.posts.length === 0 ? (
                      <Card className="p-8 text-center">
                        <div className="space-y-4">
                          <Users className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                          <h3 className="text-lg font-medium">No Posts Yet</h3>
                          <p className="text-muted-foreground">
                            Share your challenge progress and motivate others!
                          </p>
                        </div>
                      </Card>
                    ) : (
                      <UserPosts posts={user.posts} user={user} isOwnProfile={true} />
                    )}
                  </div>
                )
              },
              {
                value: "challenges",
                label: `Challenges (${user.activeChallenges.length})`,
                content: (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold">Active Challenges</h2>
                      <Badge variant="secondary">{user.activeChallenges.length} active</Badge>
                    </div>
                    {user.activeChallenges.length === 0 ? (
                      <Card className="p-8 text-center">
                        <div className="space-y-4">
                          <Trophy className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                          <h3 className="text-lg font-medium">No Active Challenges</h3>
                          <p className="text-muted-foreground">
                            Join your first challenge to start building better habits!
                          </p>
                          <Button onClick={() => window.location.href = '/discover'}>
                            Browse Challenges
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 gap-6">
                        {/* Mobile-optimized challenge cards */}
                      </div>
                    )}
                  </div>
                )
              },
              {
                value: "achievements",
                label: `Achievements (${user.achievements.length})`,
                content: (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold">Achievements</h2>
                      <Badge variant="secondary">{user.achievements.length} unlocked</Badge>
                    </div>
                    {user.achievements.length === 0 ? (
                      <Card className="p-8 text-center">
                        <div className="space-y-4">
                          <Trophy className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                          <h3 className="text-lg font-medium">No Achievements Yet</h3>
                          <p className="text-muted-foreground">
                            Complete challenges to unlock achievements and show off your progress!
                          </p>
                          <Button onClick={() => window.location.href = '/discover'}>
                            Start Your First Challenge
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {user.achievements.map((achievement) => (
                          <Card key={achievement.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="text-3xl">{achievement.icon}</div>
                                <div className="flex-1">
                                  <h3 className="font-semibold">{achievement.title}</h3>
                                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge className={getRarityColor(achievement.rarity)} variant="outline">
                                      {achievement.rarity}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(achievement.unlockedDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )
              },
              {
                value: "stats",
                label: "Stats",
                content: (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Statistics</h2>
                    <div className="space-y-4">
                      {/* Mobile-optimized stats cards */}
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
                            <span className="text-muted-foreground">Success Rate</span>
                            <span className="font-bold text-orange-600">{user.stats.successRate}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Total Earned</span>
                            <span className="font-bold text-secondary">${user.stats.totalEarned}</span>
                          </div>
                        </CardContent>
                      </Card>

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
                        </CardContent>
                      </Card>

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
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )
              }
            ]}
            tabsListClassName="grid-cols-4"
          />
        ) : (
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
            {user.posts.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="space-y-4">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium">No Posts Yet</h3>
                  <p className="text-muted-foreground">
                    Share your challenge progress and motivate others!
                  </p>
                </div>
              </Card>
            ) : (
              <UserPosts posts={user.posts} user={user} isOwnProfile={true} />
            )}
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Active Challenges</h2>
              <Badge variant="secondary">{user.activeChallenges.length} active</Badge>
            </div>
            {user.activeChallenges.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="space-y-4">
                  <Trophy className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium">No Active Challenges</h3>
                  <p className="text-muted-foreground">
                    Join your first challenge to start building better habits!
                  </p>
                  <Button onClick={() => window.location.href = '/discover'}>
                    Browse Challenges
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Real challenge data will be loaded here when available */}
              </div>
            )}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Achievements</h2>
              <Badge variant="secondary">{user.achievements.length} unlocked</Badge>
            </div>
            {user.achievements.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="space-y-4">
                  <Trophy className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium">No Achievements Yet</h3>
                  <p className="text-muted-foreground">
                    Complete challenges to unlock achievements and show off your progress!
                  </p>
                  <Button onClick={() => window.location.href = '/discover'}>
                    Start Your First Challenge
                  </Button>
                </div>
              </Card>
            ) : (
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
            )}
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
        )}
      </div>
    </div>
  )
}
