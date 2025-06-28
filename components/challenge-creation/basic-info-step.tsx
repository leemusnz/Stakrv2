"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, X, ImageIcon, Info, Lightbulb, Target, Clock } from "lucide-react"
import { useState } from "react"

interface BasicInfoStepProps {
  title: string
  description: string
  tags: string[]
  duration: string
  difficulty: string
  thumbnailImage: File | null
  isPrivate: boolean
  onTitleChange: (title: string) => void
  onDescriptionChange: (description: string) => void
  onTagsChange: (tags: string[]) => void
  onDurationChange: (duration: string) => void
  onDifficultyChange: (difficulty: string) => void
  onThumbnailImageChange: (image: File | null) => void
}

const durationOptions = [
  {
    value: "3-days",
    label: "3 Days",
    description: "Quick sprint challenge",
    examples: "Digital detox, gratitude practice",
  },
  {
    value: "1-week",
    label: "1 Week",
    description: "Perfect for building habits",
    examples: "Morning routine, daily reading",
  },
  {
    value: "2-weeks",
    label: "2 Weeks",
    description: "Solid habit formation",
    examples: "Exercise streak, meditation practice",
  },
  { value: "30-days", label: "30 Days", description: "Transform your life", examples: "No sugar, daily journaling" },
  {
    value: "60-days",
    label: "60 Days",
    description: "Deep habit integration",
    examples: "Language learning, fitness transformation",
  },
  {
    value: "90-days",
    label: "90 Days",
    description: "Complete lifestyle change",
    examples: "Career pivot, major health overhaul",
  },
]

const difficultyOptions = [
  {
    value: "beginner",
    label: "Beginner",
    description: "Easy to start, perfect for newcomers",
    examples: "5 min meditation, 1 page reading, 10 pushups",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Moderate effort required",
    examples: "30 min workout, 10 pages reading, cold shower",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "Challenging, for experienced participants",
    examples: "1 hour workout, 50 pages reading, 16:8 fasting",
    color: "bg-orange-100 text-orange-800",
  },
  {
    value: "expert",
    label: "Expert",
    description: "Extremely difficult, for dedicated individuals",
    examples: "2 hour workout, 100 pages reading, 20:4 fasting",
    color: "bg-red-100 text-red-800",
  },
]

const popularTags = [
  "Health",
  "Fitness",
  "Mindfulness",
  "Productivity",
  "Learning",
  "Creativity",
  "Social",
  "Career",
  "Finance",
  "Relationships",
  "Wellness",
  "Adventure",
  "Nutrition",
  "Sleep",
  "Focus",
  "Strength",
  "Endurance",
  "Flexibility",
]

const titleExamples = [
  "30-Day Morning Meditation Challenge",
  "21-Day No Sugar Challenge",
  "7-Day Digital Detox Challenge",
  "60-Day Fitness Transformation",
  "14-Day Gratitude Journal Challenge",
  "30-Day Learn Spanish Challenge",
]

export function BasicInfoStep({
  title,
  description,
  tags,
  duration,
  difficulty,
  thumbnailImage,
  isPrivate,
  onTitleChange,
  onDescriptionChange,
  onTagsChange,
  onDurationChange,
  onDifficultyChange,
  onThumbnailImageChange,
}: BasicInfoStepProps) {
  const [newTag, setNewTag] = useState("")

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag) && tags.length < 5) {
      onTagsChange([...tags, tag])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onThumbnailImageChange(file)
    }
  }

  const selectedDuration = durationOptions.find((d) => d.value === duration)
  const selectedDifficulty = difficultyOptions.find((d) => d.value === difficulty)

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Tell us about your challenge</h2>
        <p className="text-muted-foreground">
          Create a compelling title and description that motivates people to join and succeed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Challenge Details</CardTitle>
                  <CardDescription className="text-sm">
                    The core information that defines your challenge
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Challenge Title *</Label>
                <Input
                  placeholder="e.g., 30-Day Morning Meditation Challenge"
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  className="text-base"
                />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Make it specific and motivating. Include duration and main activity for clarity.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Great title examples:</p>
                    <div className="grid grid-cols-1 gap-1">
                      {titleExamples.slice(0, 3).map((example, index) => (
                        <p key={index} className="text-xs text-muted-foreground">
                          • {example}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Description *</Label>
                <Textarea
                  placeholder="Describe what participants will do daily, why this challenge matters, and what they'll gain from completing it. Be specific about the commitment and benefits..."
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {description.length}/500 characters. Include daily requirements, benefits, and what makes this
                    special.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Include in your description:</p>
                    <div className="grid grid-cols-1 gap-1">
                      <p className="text-xs text-muted-foreground">• What participants do each day</p>
                      <p className="text-xs text-muted-foreground">• Time commitment required</p>
                      <p className="text-xs text-muted-foreground">• Benefits they'll experience</p>
                      <p className="text-xs text-muted-foreground">• What makes this challenge unique</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Duration & Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Duration *
                  </Label>
                  <Select value={duration} onValueChange={onDurationChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="py-1">
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                            <div className="text-xs text-muted-foreground mt-1">Examples: {option.examples}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedDuration && (
                    <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-secondary mb-1">{selectedDuration.label} Challenge</p>
                      <p className="text-xs text-muted-foreground">{selectedDuration.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">Examples: {selectedDuration.examples}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Target className="w-4 h-4 text-secondary" />
                    Difficulty Level *
                  </Label>
                  <Select value={difficulty} onValueChange={onDifficultyChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {difficultyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="py-1">
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${option.color}`}>{option.label}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
                            <div className="text-xs text-muted-foreground mt-1">Examples: {option.examples}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedDifficulty && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-orange-700 mb-1">{selectedDifficulty.label} Level</p>
                      <p className="text-xs text-orange-600">{selectedDifficulty.description}</p>
                      <p className="text-xs text-orange-600 mt-1">Examples: {selectedDifficulty.examples}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Tags & Discovery</CardTitle>
              <CardDescription className="text-sm">Help people find your challenge (max 5 tags)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Add Custom Tag</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTag(newTag)
                      }
                    }}
                    disabled={tags.length >= 5}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAddTag(newTag)}
                    disabled={!newTag || tags.length >= 5}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Popular Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTag(tag)}
                      disabled={tags.includes(tag) || tags.length >= 5}
                      className="h-8 text-xs"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>

              {tags.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Selected Tags ({tags.length}/5)</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTag(tag)}
                          className="h-4 w-4 p-0 hover:bg-transparent"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-700 mb-1">Tag Strategy:</p>
                    <ul className="text-blue-600 space-y-1 text-xs">
                      <li>• Use specific tags that describe your challenge type</li>
                      <li>• Include difficulty level and target audience</li>
                      <li>• Add benefit-focused tags (e.g., "stress-relief", "strength")</li>
                      <li>• Tags help people discover your challenge in search</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thumbnail Image */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Challenge Thumbnail</CardTitle>
              <CardDescription className="text-sm">
                Upload an image to make your challenge stand out (optional but recommended)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Upload Image</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  {thumbnailImage ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{thumbnailImage.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(thumbnailImage.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => onThumbnailImageChange(null)}>
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground mb-4">PNG, JPG up to 5MB. Recommended: 1200x630px</p>
                      <label htmlFor="thumbnail-upload">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span className="cursor-pointer">Choose File</span>
                        </Button>
                      </label>
                      <input
                        id="thumbnail-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-green-700 mb-1">Image Tips:</p>
                    <ul className="text-green-600 space-y-1 text-xs">
                      <li>• Use bright, motivating images that relate to your challenge</li>
                      <li>• Avoid text-heavy images - keep it simple and visual</li>
                      <li>• Square or landscape orientation works best</li>
                      <li>• High contrast images perform better in feeds</li>
                      <li>• Challenges with images get 3x more participants</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Writing Tips */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-primary">
                <Lightbulb className="w-4 h-4" />
                Writing Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium mb-2">Great Titles Include:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Duration (30-Day, 1-Week)</li>
                  <li>• Main activity (Meditation, Reading)</li>
                  <li>• Benefit (Better Sleep, Stronger Core)</li>
                  <li>• Target audience (Beginner, Advanced)</li>
                </ul>
              </div>

              <div>
                <p className="font-medium mb-2">Strong Descriptions:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Explain the daily commitment clearly</li>
                  <li>• Share the benefits/outcomes</li>
                  <li>• Include any special requirements</li>
                  <li>• Mention community aspects</li>
                  <li>• Use motivating, positive language</li>
                </ul>
              </div>

              <div>
                <p className="font-medium mb-2">Duration Guide:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• 3-7 days: Habit testing</li>
                  <li>• 1-2 weeks: Skill building</li>
                  <li>• 30+ days: Habit formation</li>
                  <li>• 60+ days: Lifestyle change</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Info */}
          <Card className={`${isPrivate ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"}`}>
            <CardHeader className="pb-3">
              <CardTitle
                className={`text-sm flex items-center gap-2 ${isPrivate ? "text-blue-600" : "text-green-600"}`}
              >
                {isPrivate ? "🔒 Private Challenge" : "🌍 Public Challenge"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {isPrivate ? (
                <div className="text-blue-700">
                  <p className="mb-2">Your challenge will be:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Only accessible via invite link</li>
                    <li>• Hidden from public discovery</li>
                    <li>• Perfect for friends & family</li>
                    <li>• No participant limits</li>
                    <li>• Custom start dates available</li>
                  </ul>
                </div>
              ) : (
                <div className="text-green-700">
                  <p className="mb-2">Your challenge will be:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Visible in public discovery</li>
                    <li>• Searchable by tags & category</li>
                    <li>• Open for anyone to join</li>
                    <li>• Great for building community</li>
                    <li>• Referral bonuses available</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Success Stats */}
          <Card className="bg-secondary/5 border-secondary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-secondary">Success Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-secondary mb-1">Completion Rates:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Clear titles: +40% completion</li>
                    <li>• Good descriptions: +35% completion</li>
                    <li>• Proper difficulty: +50% completion</li>
                    <li>• With images: +25% participation</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
