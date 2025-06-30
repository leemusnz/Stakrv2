"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Instagram, 
  Linkedin,
  Link2,
  Download,
  Copy,
  Check
} from "lucide-react"

interface ShareableContent {
  type: 'challenge' | 'stats' | 'post' | 'achievement'
  title: string
  description: string
  url: string
  imageUrl?: string
  stats?: {
    challengesCompleted: number
    successRate: number
    currentStreak: number
    totalEarnings?: number
  }
  challenge?: {
    title: string
    category: string
    dayNumber?: number
    totalDays?: number
  }
}

interface SocialShareModalProps {
  trigger?: React.ReactNode
  content: ShareableContent
  onShare?: (platform: string) => void
}

export function SocialShareModal({ trigger, content, onShare }: SocialShareModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateShareText = (platform: string) => {
    const baseText = getBaseShareText()
    const hashtags = getHashtags()
    
    switch (platform) {
      case 'twitter':
        return `${baseText}\n\n${hashtags.slice(0, 3).join(' ')} #Stakr`
      case 'facebook':
        return `${baseText}\n\nJoin me on Stakr - where accountability meets achievement! 🚀`
      case 'linkedin':
        return `${baseText}\n\nBuilding better habits through accountability and community. Check out Stakr for your own self-improvement journey.`
      case 'instagram':
        return baseText
      default:
        return baseText
    }
  }

  const getBaseShareText = () => {
    switch (content.type) {
      case 'challenge':
        if (content.challenge) {
          return `I'm taking on the "${content.challenge.title}" challenge on Stakr! ${content.challenge.dayNumber ? `Currently on day ${content.challenge.dayNumber}/${content.challenge.totalDays}` : 'Just getting started!'} 💪`
        }
        return `Just joined an amazing challenge on Stakr! 🎯`
      
      case 'stats':
        if (content.stats) {
          return `My Stakr journey so far: ${content.stats.challengesCompleted} challenges completed, ${content.stats.successRate}% success rate, and a ${content.stats.currentStreak}-day streak! ${content.stats.totalEarnings ? `Earned $${content.stats.totalEarnings} through consistency!` : ''} 📈`
        }
        return `Making great progress on my self-improvement journey with Stakr! 📊`
      
      case 'achievement':
        return `Just unlocked a new achievement on Stakr! ${content.description} 🏆`
      
      case 'post':
        return content.description
      
      default:
        return content.description
    }
  }

  const getHashtags = () => {
    const baseHashtags = ['#SelfImprovement', '#Accountability', '#Habits']
    
    if (content.challenge?.category) {
      const categoryHash = `#${content.challenge.category.replace(/\s+/g, '')}`
      baseHashtags.unshift(categoryHash)
    }
    
    switch (content.type) {
      case 'challenge':
        return [...baseHashtags, '#Challenge', '#GoalSetting']
      case 'stats':
        return [...baseHashtags, '#Progress', '#Success']
      case 'achievement':
        return [...baseHashtags, '#Achievement', '#Milestone']
      default:
        return baseHashtags
    }
  }

  const handlePlatformShare = (platform: string) => {
    const text = generateShareText(platform)
    const encodedText = encodeURIComponent(text)
    const encodedUrl = encodeURIComponent(content.url)
    
    let shareUrl = ''
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedText}`
        break
      case 'instagram':
        // Instagram doesn't have direct sharing URLs, so we copy text for manual posting
        copyToClipboard(text)
        return
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
      onShare?.(platform)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const downloadAsImage = () => {
    // This would generate a beautiful stats card image
    // For now, we'll create a simple implementation
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      canvas.width = 800
      canvas.height = 600
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 800, 600)
      gradient.addColorStop(0, '#F46036')
      gradient.addColorStop(1, '#1D4ED8')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 800, 600)
      
      // Add text
      ctx.fillStyle = 'white'
      ctx.font = 'bold 48px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Stakr Progress', 400, 100)
      
      if (content.stats) {
        ctx.font = '32px system-ui'
        ctx.fillText(`${content.stats.challengesCompleted} Challenges Completed`, 400, 200)
        ctx.fillText(`${content.stats.successRate}% Success Rate`, 400, 280)
        ctx.fillText(`${content.stats.currentStreak} Day Streak`, 400, 360)
      }
      
      // Download the image
      const link = document.createElement('a')
      link.download = 'stakr-progress.png'
      link.href = canvas.toDataURL()
      link.click()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Your Progress
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <Card className="border-muted">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">{content.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{getBaseShareText()}</p>
              
              {/* Stats Display */}
              {content.stats && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="font-bold text-lg">{content.stats.challengesCompleted}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="font-bold text-lg">{content.stats.successRate}%</div>
                    <div className="text-xs text-muted-foreground">Success</div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="font-bold text-lg">{content.stats.currentStreak}</div>
                    <div className="text-xs text-muted-foreground">Streak</div>
                  </div>
                </div>
              )}

              {/* Challenge Info */}
              {content.challenge && (
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">{content.challenge.category}</Badge>
                  {content.challenge.dayNumber && (
                    <span className="text-sm text-muted-foreground">
                      Day {content.challenge.dayNumber}/{content.challenge.totalDays}
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-1">
                {getHashtags().slice(0, 4).map(tag => (
                  <span key={tag} className="text-xs text-blue-600">{tag}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Social Platforms */}
          <div className="space-y-4">
            <h4 className="font-medium">Share to social media</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handlePlatformShare('twitter')}
                className="justify-start"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handlePlatformShare('facebook')}
                className="justify-start"
              >
                <Facebook className="w-4 h-4 mr-2" />
                Facebook
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handlePlatformShare('linkedin')}
                className="justify-start"
              >
                <Linkedin className="w-4 h-4 mr-2" />
                LinkedIn
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handlePlatformShare('instagram')}
                className="justify-start"
              >
                <Instagram className="w-4 h-4 mr-2" />
                Instagram
              </Button>
            </div>
          </div>

          <Separator />

          {/* Additional Options */}
          <div className="space-y-3">
            <h4 className="font-medium">More options</h4>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(content.url)}
                className="flex-1"
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Link2 className="w-4 h-4 mr-2" />
                )}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              {content.stats && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadAsImage}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Image
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
