"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Share2, Twitter, Facebook, Copy, Check, Trophy, Zap, Target } from "lucide-react"

interface SocialSharingProps {
  type: "achievement" | "challenge_completion" | "streak" | "earnings"
  data: {
    title: string
    description?: string
    amount?: number
    streak?: number
    challenge?: string
    image?: string
  }
  onShare?: (platform: string, message: string) => void
}

const shareTemplates = {
  achievement: {
    twitter: "🏆 Just unlocked '{title}' on @Stakr! {description} #StakrWin #PersonalGrowth",
    facebook: "Excited to share that I just unlocked '{title}' on Stakr! {description}",
    generic: "🎉 Achievement unlocked: {title}! {description}",
  },
  challenge_completion: {
    twitter:
      "💪 Just completed '{challenge}' on @Stakr and earned ${amount}! Who's joining me for the next one? #StakrChallenge #Accountability",
    facebook:
      "Proud to announce I completed '{challenge}' on Stakr! Earned ${amount} back and built an amazing habit. The accountability really works!",
    generic: "🎯 Challenge completed: {challenge}! Earned ${amount} and proved I can stick to my commitments.",
  },
  streak: {
    twitter: "🔥 {streak}-day streak on @Stakr! Consistency is everything. #StreakLife #Habits",
    facebook: "Celebrating my {streak}-day streak on Stakr! Small daily actions really do add up to big results.",
    generic: "⚡ {streak} days in a row! Building habits that stick with Stakr.",
  },
  earnings: {
    twitter:
      "💰 Just earned ${amount} on @Stakr by completing my challenges! Accountability pays off literally 😄 #StakrEarnings",
    facebook:
      "Love how Stakr makes me money while building better habits! Just earned ${amount} by following through on my commitments.",
    generic: "🎉 Earned ${amount} on Stakr by completing my challenges! Accountability that pays.",
  },
}

export function SocialSharing({ type, data, onShare }: SocialSharingProps) {
  const [customMessage, setCustomMessage] = useState("")
  const [copied, setCopied] = useState(false)

  const formatMessage = (template: string) => {
    return template
      .replace("{title}", data.title)
      .replace("{description}", data.description || "")
      .replace("{amount}", data.amount?.toString() || "0")
      .replace("{streak}", data.streak?.toString() || "0")
      .replace("{challenge}", data.challenge || "")
  }

  const getShareUrl = (platform: string, message: string) => {
    const encodedMessage = encodeURIComponent(message)
    const encodedUrl = encodeURIComponent("https://stakr.app")

    switch (platform) {
      case "twitter":
        return `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`
      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`
      default:
        return ""
    }
  }

  const handleShare = (platform: string) => {
    const template =
      shareTemplates[type][platform as keyof (typeof shareTemplates)[typeof type]] || shareTemplates[type].generic
    const message = customMessage || formatMessage(template)

    if (platform === "copy") {
      navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return
    }

    const shareUrl = getShareUrl(platform, message)
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400")
    }

    onShare?.(platform, message)
  }

  const getTypeIcon = () => {
    switch (type) {
      case "achievement":
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case "challenge_completion":
        return <Target className="w-5 h-5 text-primary" />
      case "streak":
        return <Zap className="w-5 h-5 text-orange-500" />
      case "earnings":
        return <Trophy className="w-5 h-5 text-success" />
    }
  }

  const getTypeLabel = () => {
    switch (type) {
      case "achievement":
        return "Achievement Unlocked"
      case "challenge_completion":
        return "Challenge Completed"
      case "streak":
        return "Streak Milestone"
      case "earnings":
        return "Earnings Milestone"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          Share Your Success
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Achievement Preview */}
        <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/10">
          <div className="flex items-center gap-3 mb-3">
            {getTypeIcon()}
            <div>
              <Badge variant="secondary" className="text-xs mb-1">
                {getTypeLabel()}
              </Badge>
              <h3 className="font-bold">{data.title}</h3>
              {data.description && <p className="text-sm text-muted-foreground">{data.description}</p>}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            {data.amount && (
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-success" />
                <span className="font-medium text-success">${data.amount}</span>
              </div>
            )}
            {data.streak && (
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="font-medium">{data.streak} days</span>
              </div>
            )}
            {data.challenge && (
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4 text-primary" />
                <span className="font-medium">{data.challenge}</span>
              </div>
            )}
          </div>
        </div>

        {/* Custom Message */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Customize your message (optional)</label>
          <Textarea
            placeholder={formatMessage(shareTemplates[type].generic)}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Share Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleShare("twitter")}
              className="flex items-center gap-2 bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white"
            >
              <Twitter className="w-4 h-4" />
              Twitter
            </Button>
            <Button
              onClick={() => handleShare("facebook")}
              className="flex items-center gap-2 bg-[#4267B2] hover:bg-[#4267B2]/90 text-white"
            >
              <Facebook className="w-4 h-4" />
              Facebook
            </Button>
          </div>

          <Button
            onClick={() => handleShare("copy")}
            variant="outline"
            className="w-full flex items-center gap-2 bg-transparent"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-success" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Message
              </>
            )}
          </Button>
        </div>

        {/* Motivation */}
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Share your success to inspire others and build your accountability network! 🚀
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
