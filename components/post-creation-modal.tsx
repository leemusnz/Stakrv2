"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, ImageIcon, Trophy, Lightbulb, Target, Heart } from "lucide-react"

interface PostCreationModalProps {
  user: {
    id: string
    name: string
    avatar?: string
  }
  activeChallenges: Array<{
    id: string
    title: string
    category: string
  }>
}

const postTypes = [
  {
    id: "progress",
    label: "Progress Update",
    icon: Trophy,
    description: "Share your challenge progress",
    color: "text-primary",
  },
  {
    id: "motivation",
    label: "Motivation",
    icon: Heart,
    description: "Inspire others with motivational content",
    color: "text-red-500",
  },
  {
    id: "tip",
    label: "Tip & Advice",
    icon: Lightbulb,
    description: "Share helpful tips and advice",
    color: "text-yellow-500",
  },
  {
    id: "achievement",
    label: "Achievement",
    icon: Target,
    description: "Celebrate your accomplishments",
    color: "text-green-500",
  },
]

export function PostCreationModal({ user, activeChallenges }: PostCreationModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedType, setSelectedType] = useState("")
  const [content, setContent] = useState("")
  const [selectedChallenge, setSelectedChallenge] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType || !content.trim()) return

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("Creating post:", {
      type: selectedType,
      content,
      challenge: selectedChallenge,
      image,
      user: user.id,
    })

    // Reset form
    setSelectedType("")
    setContent("")
    setSelectedChallenge("")
    setImage(null)
    setIsSubmitting(false)
    setIsOpen(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Post
        </Button>
      </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] mobile-safe-width">
        <DialogHeader>
          <DialogTitle>Create a New Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type Selection */}
          <div className="space-y-3">
            <Label>Post Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {postTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`p-4 border rounded-lg text-left transition-all hover:border-primary/50 ${
                      selectedType === type.id ? "border-primary bg-primary/5" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`w-5 h-5 ${type.color}`} />
                      <span className="font-medium">{type.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="What's on your mind? Share your thoughts, progress, or motivation..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="text-sm text-muted-foreground text-right">{content.length}/500</div>
          </div>

          {/* Challenge Link (for progress posts) */}
          {selectedType === "progress" && activeChallenges.length > 0 && (
            <div className="space-y-2">
              <Label>Link to Challenge (Optional)</Label>
              <Select value={selectedChallenge} onValueChange={setSelectedChallenge}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a challenge to link this post to" />
                </SelectTrigger>
                <SelectContent>
                  {activeChallenges.map((challenge) => (
                    <SelectItem key={challenge.id} value={challenge.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {challenge.category}
                        </Badge>
                        {challenge.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Add Image (Optional)</Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("image-upload")?.click()}
                className="flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                {image ? "Change Image" : "Add Image"}
              </Button>
              <input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              {image && <span className="text-sm text-muted-foreground">{image.name}</span>}
            </div>
          </div>

          {/* Preview */}
          {(selectedType || content) && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="font-medium mb-2">Preview</h4>
              <div className="space-y-2">
                {selectedType && (
                  <div className="flex items-center gap-2">
                    {(() => {
                      const type = postTypes.find((t) => t.id === selectedType)
                      if (!type) return null
                      const Icon = type.icon
                      return (
                        <>
                          <Icon className={`w-4 h-4 ${type.color}`} />
                          <Badge variant="secondary" className="text-xs">
                            {type.label}
                          </Badge>
                        </>
                      )
                    })()}
                  </div>
                )}
                {content && <p className="text-sm whitespace-pre-wrap">{content}</p>}
                {selectedChallenge && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      Linked to: {activeChallenges.find((c) => c.id === selectedChallenge)?.title}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedType || !content.trim() || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
