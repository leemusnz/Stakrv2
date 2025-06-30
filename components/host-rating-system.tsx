"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Shield,
  CheckCircle,
  AlertTriangle,
  Trophy,
  Users,
  TrendingUp
} from "lucide-react"

interface HostStats {
  overallRating: number
  totalReviews: number
  challengesHosted: number
  avgCompletionRate: number
  responseRate: number // How often they respond to questions
  badges: string[]
}

interface Review {
  id: string
  rating: number
  comment: string
  challengeTitle: string
  userInitials: string
  completedChallenge: boolean
  createdAt: string
}

interface HostRatingSystemProps {
  hostId: string
  hostName: string
  stats: HostStats
  recentReviews: Review[]
  canReview?: boolean
  onSubmitReview?: (rating: number, comment: string) => void
}

export function HostRatingSystem({ 
  hostId, 
  hostName, 
  stats, 
  recentReviews, 
  canReview = false,
  onSubmitReview 
}: HostRatingSystemProps) {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmitReview = async () => {
    if (newRating === 0) return
    
    setSubmitting(true)
    try {
      await onSubmitReview?.(newRating, newComment)
      setShowReviewForm(false)
      setNewRating(0)
      setNewComment("")
    } catch (error) {
      console.error('Failed to submit review:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getHostTier = (rating: number, challengesHosted: number) => {
    if (rating >= 4.8 && challengesHosted >= 20) return { tier: "Elite Host", color: "text-purple-600", icon: "👑" }
    if (rating >= 4.5 && challengesHosted >= 10) return { tier: "Trusted Host", color: "text-blue-600", icon: "🏆" }
    if (rating >= 4.0 && challengesHosted >= 5) return { tier: "Verified Host", color: "text-green-600", icon: "✅" }
    if (rating >= 3.0) return { tier: "New Host", color: "text-orange-600", icon: "🌟" }
    return { tier: "Learning Host", color: "text-gray-600", icon: "📚" }
  }

  const hostTier = getHostTier(stats.overallRating, stats.challengesHosted)
  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: Math.floor(Math.random() * 20) + 1, // Mock data
    percentage: Math.floor(Math.random() * 60) + 10
  }))

  const renderStarRating = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const starSize = size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Host Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-600" />
            Host Rating & Reviews
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Stats */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.overallRating.toFixed(1)}</div>
              {renderStarRating(Math.round(stats.overallRating), "lg")}
              <div className="text-sm text-muted-foreground mt-1">{stats.totalReviews} reviews</div>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`font-medium ${hostTier.color}`}>
                  {hostTier.icon} {hostTier.tier}
                </span>
                <Badge variant="outline">{stats.challengesHosted} challenges hosted</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">{stats.avgCompletionRate}%</div>
                  <div className="text-muted-foreground">Avg Success Rate</div>
                </div>
                <div>
                  <div className="font-medium">{stats.responseRate}%</div>
                  <div className="text-muted-foreground">Response Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Host Badges */}
          {stats.badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {stats.badges.map((badge, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rating Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ratingDistribution.map(({ stars, count, percentage }) => (
            <div key={stars} className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-16">
                <span className="text-sm">{stars}</span>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              </div>
              <Progress value={percentage} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground w-8">{count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Reviews</CardTitle>
            {canReview && (
              <Button 
                size="sm" 
                onClick={() => setShowReviewForm(true)}
                disabled={showReviewForm}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Write Review
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Review Form */}
          {showReviewForm && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">Rate {hostName}:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setNewRating(star)}
                          className="hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= newRating 
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-gray-300 hover:text-yellow-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Textarea
                  placeholder="Share your experience with this host's challenge..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="text-sm"
                />
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleSubmitReview}
                    disabled={newRating === 0 || submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowReviewForm(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {recentReviews.map((review) => (
              <div key={review.id} className="border-l-4 border-l-muted pl-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {renderStarRating(review.rating, "sm")}
                    <Badge variant={review.completedChallenge ? "default" : "secondary"} className="text-xs">
                      {review.completedChallenge ? "Completed" : "Participated"}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-sm">{review.comment}</p>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{review.userInitials}</span>
                  <span>•</span>
                  <span>{review.challengeTitle}</span>
                </div>
              </div>
            ))}
          </div>

          {recentReviews.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No reviews yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quality Indicators */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <strong>Quality Assurance:</strong> Host ratings help maintain high standards. 
          Low-rated hosts ({"<"}3.0) may have challenges reviewed before publication.
        </AlertDescription>
      </Alert>
    </div>
  )
}
