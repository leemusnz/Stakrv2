"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { 
  Camera, 
  Image as ImageIcon, 
  Trophy, 
  Target, 
  Share2,
  MessageSquare,
  Eye,
  EyeOff,
  Zap,
  Timer,
  Calendar
} from "lucide-react"

interface PostCreationModalProps {
  trigger?: React.ReactNode
  challengeContext?: {
    id: string
    title: string
    category: string
    dayNumber?: number
    totalDays?: number
    isProofSubmission?: boolean
    proofData?: any
  }
  onPostCreated?: (post: any) => void
}

export function PostCreationModal({ 
  trigger, 
  challengeContext, 
  onPostCreated 
}: PostCreationModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [includeStats, setIncludeStats] = useState(false)
  const [includeChallenge, setIncludeChallenge] = useState(!!challengeContext)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attachedImage, setAttachedImage] = useState<string | null>(null)

  // Auto-generate content based on context
  const generateSuggestedContent = () => {
    if (challengeContext) {
      if (challengeContext.isProofSubmission) {
        return `Just completed day ${challengeContext.dayNumber} of my ${challengeContext.title}! 💪\n\n#StakrChallenge #${challengeContext.category}`
      } else {
        return `Day ${challengeContext.dayNumber}/${challengeContext.totalDays} of my ${challengeContext.title} challenge! Making progress! 🚀\n\n#StakrChallenge #${challengeContext.category}`
      }
    }
    return ""
  }

  const handleCreatePost = async () => {
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      const postData = {
        content: content.trim(),
        isPublic,
        challengeId: challengeContext?.id,
        includeStats,
        includeChallenge,
        attachedImage,
        postType: challengeContext?.isProofSubmission ? 'proof_submission' : 'general'
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      })

      const result = await response.json()

      if (result.success) {
        onPostCreated?.(result.post)
        setIsOpen(false)
        setContent("")
        setAttachedImage(null)
        // Show success toast
      } else {
        throw new Error(result.error || 'Failed to create post')
      }
    } catch (error) {
      console.error('Post creation failed:', error)
      // Show error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAttachedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full">
            <MessageSquare className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {challengeContext ? 'Share Your Progress' : 'Create Post'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Challenge Context */}
          {challengeContext && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900">{challengeContext.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <Badge variant="outline" className="bg-blue-100 border-blue-300">
                        {challengeContext.category}
                      </Badge>
                      {challengeContext.dayNumber && (
                        <span>Day {challengeContext.dayNumber}/{challengeContext.totalDays}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Content Suggestions */}
          {challengeContext && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Start</Label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setContent(generateSuggestedContent())}
                className="w-full text-left justify-start"
              >
                <Zap className="w-4 h-4 mr-2" />
                Use suggested content
              </Button>
            </div>
          )}

          {/* Main Content */}
          <div className="space-y-2">
            <Label htmlFor="content">What's on your mind?</Label>
            <Textarea
              id="content"
              placeholder={challengeContext ? 
                "Share your progress, insights, or motivation..." : 
                "What's happening in your journey?"
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-32 resize-none"
            />
            <div className="text-xs text-muted-foreground text-right">
              {content.length}/500 characters
            </div>
          </div>

          {/* Image Attachment */}
          <div className="space-y-3">
            <Label>Add Photo</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </Button>
              {challengeContext?.isProofSubmission && (
                <Button variant="outline" size="sm">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Use Proof Photo
                </Button>
              )}
            </div>
            {attachedImage && (
              <div className="relative">
                <img 
                  src={attachedImage} 
                  alt="Attached" 
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setAttachedImage(null)}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Post Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Post Options</Label>
            
            {/* Visibility */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <Eye className="w-4 h-4 text-green-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-orange-600" />
                )}
                <span className="text-sm">
                  {isPublic ? 'Public post' : 'Private post'}
                </span>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            {/* Include Challenge Info */}
            {challengeContext && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Include challenge details</span>
                </div>
                <Switch
                  checked={includeChallenge}
                  onCheckedChange={setIncludeChallenge}
                />
              </div>
            )}

            {/* Include Stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-purple-600" />
                <span className="text-sm">Include my stats</span>
              </div>
              <Switch
                checked={includeStats}
                onCheckedChange={setIncludeStats}
              />
            </div>
          </div>

          {/* Preview */}
          {(includeStats || includeChallenge) && (
            <Card className="border-muted bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Preview</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {includeStats && (
                  <div className="text-xs text-muted-foreground">
                    📊 Stats: 15 challenges completed • 85% success rate • 12 day streak
                  </div>
                )}
                {includeChallenge && challengeContext && (
                  <div className="text-xs text-muted-foreground">
                    🎯 Challenge: {challengeContext.title} (Day {challengeContext.dayNumber}/{challengeContext.totalDays})
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCreatePost}
              disabled={!content.trim() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Share2 className="w-4 h-4 mr-2" />
              )}
              {challengeContext?.isProofSubmission ? 'Share Progress' : 'Create Post'}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 