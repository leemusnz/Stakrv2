"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getProxiedAvatarUrl } from "@/lib/utils"
import { Heart, MessageCircle, Share2, Trophy, Lightbulb, Target, MoreHorizontal, Flag, Bookmark } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Post {
  id: string
  type: "progress" | "motivation" | "tip" | "achievement" | "announcement"
  content: string
  image?: string
  challenge?: {
    id: string
    title: string
    category: string
  }
  likes: number
  comments: number
  timestamp: string
  isLiked: boolean
}

interface User {
  id: string
  name: string
  username?: string
  avatar?: string
}

interface UserPostsProps {
  posts: Post[]
  user: User
  isOwnProfile: boolean
}

const postTypeConfig = {
  progress: {
    icon: Trophy,
    label: "Progress Update",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  motivation: {
    icon: Heart,
    label: "Motivation",
    color: "text-red-500",
    bgColor: "bg-red-50",
  },
  tip: {
    icon: Lightbulb,
    label: "Tip & Advice",
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
  },
  achievement: {
    icon: Target,
    label: "Achievement",
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
  announcement: {
    icon: Trophy,
    label: "Announcement",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
}

export function UserPosts({ posts, user, isOwnProfile }: UserPostsProps) {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(
    new Set(posts.filter((post) => post.isLiked).map((post) => post.id)),
  )

  const handleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const postTime = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks}w ago`
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No posts yet</h3>
            <p className="text-sm">
              {isOwnProfile
                ? "Share your first post to connect with the community!"
                : `${user.name} hasn't shared any posts yet.`}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => {
        const typeConfig = postTypeConfig[post.type]
        const Icon = typeConfig.icon
        const isLiked = likedPosts.has(post.id)
        const likeCount = post.likes + (isLiked && !post.isLiked ? 1 : 0) - (!isLiked && post.isLiked ? 1 : 0)

        return (
          <Card key={post.id} className="overflow-hidden">
            <CardContent className="p-6">
              {/* Post Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={getProxiedAvatarUrl(user.avatar)} alt={user.name} />
                    <AvatarFallback className="bg-primary text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{user.name}</h4>
                      {user.username && <span className="text-sm text-muted-foreground">{user.username}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatTimeAgo(post.timestamp)}</span>
                      <span>•</span>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${typeConfig.bgColor}`}>
                        <Icon className={`w-3 h-3 ${typeConfig.color}`} />
                        <span className={`text-xs font-medium ${typeConfig.color}`}>{typeConfig.label}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Bookmark className="w-4 h-4 mr-2" />
                      Save Post
                    </DropdownMenuItem>
                    {!isOwnProfile && (
                      <DropdownMenuItem className="text-red-600">
                        <Flag className="w-4 h-4 mr-2" />
                        Report Post
                      </DropdownMenuItem>
                    )}
                    {isOwnProfile && (
                      <>
                        <DropdownMenuItem>Edit Post</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Delete Post</DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Challenge Link */}
              {post.challenge && (
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                    <Trophy className="w-4 h-4 text-primary" />
                    <Badge variant="secondary" className="text-xs">
                      {post.challenge.category}
                    </Badge>
                    <span className="text-sm font-medium">{post.challenge.title}</span>
                  </div>
                </div>
              )}

              {/* Post Image */}
              {post.image && (
                <div className="mb-4 relative w-full max-h-96">
                  <Image
                    src={post.image || "/placeholder.svg"}
                    alt="Post content"
                    width={500}
                    height={400}
                    className="w-full rounded-lg max-h-96 object-cover"
                  />
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 ${
                      isLiked ? "text-red-500 hover:text-red-600" : "text-muted-foreground"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                    <span>{likeCount}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.comments}</span>
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
