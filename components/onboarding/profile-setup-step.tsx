"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowRight, User, Gift, Shuffle } from "lucide-react"
import { useState } from "react"
import type { OnboardingData } from "@/app/onboarding/page"

interface ProfileSetupStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

const avatarOptions = [
  "/placeholder.svg?height=80&width=80&text=😊",
  "/placeholder.svg?height=80&width=80&text=🚀",
  "/placeholder.svg?height=80&width=80&text=💪",
  "/placeholder.svg?height=80&width=80&text=🎯",
  "/placeholder.svg?height=80&width=80&text=⭐",
  "/placeholder.svg?height=80&width=80&text=🔥",
  "/placeholder.svg?height=80&width=80&text=🌟",
  "/placeholder.svg?height=80&width=80&text=⚡",
]

export function ProfileSetupStep({ data, onNext }: ProfileSetupStepProps) {
  const [name, setName] = useState<string>(data.name || "")
  const [selectedAvatar, setSelectedAvatar] = useState<string>(data.avatar || avatarOptions[0])

  const handleRandomAvatar = () => {
    const randomIndex = Math.floor(Math.random() * avatarOptions.length)
    setSelectedAvatar(avatarOptions[randomIndex])
  }

  const handleNext = () => {
    onNext({
      name: name.trim(),
      avatar: selectedAvatar,
    })
  }

  const canProceed = name.trim().length > 0

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          Step 4 of 5
        </Badge>
        <h1 className="text-4xl font-bold">
          Let's Set Up Your <span className="text-primary">Profile</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          What should we call you? Your name will be visible to other challengers for accountability.
        </p>
      </div>

      {/* Welcome Bonus Card - Above the fold on mobile */}
      <Card className="bg-success/5 border-success/20">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <Gift className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-success">Welcome Bonus!</h3>
              <p className="text-muted-foreground">
                Get <strong>$25 in credits</strong> to use on your first challenge. No risk, pure upside!
              </p>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              🎉 Limited time offer for new members
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Profile Setup */}
      <Card>
        <CardContent className="p-8 space-y-6">
          {/* Name Input */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-lg font-bold">
              What should we call you?
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your first name or nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg p-4 h-14"
              maxLength={30}
            />
            <p className="text-sm text-muted-foreground">
              This will be your display name in challenges and leaderboards.
            </p>
          </div>

          {/* Avatar Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-bold">Choose your avatar</Label>
              <Button variant="outline" size="sm" onClick={handleRandomAvatar} className="text-sm bg-transparent">
                <Shuffle className="w-4 h-4 mr-2" />
                Random
              </Button>
            </div>

            <div className="flex items-center justify-center mb-6">
              <Avatar className="w-24 h-24 border-4 border-primary">
                <AvatarImage src={selectedAvatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                  {name.charAt(0).toUpperCase() || <User className="w-8 h-8" />}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {avatarOptions.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`relative rounded-full transition-all hover:scale-110 ${
                    selectedAvatar === avatar
                      ? "ring-4 ring-primary ring-offset-2"
                      : "hover:ring-2 hover:ring-primary/50"
                  }`}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={avatar || "/placeholder.svg"} />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {name && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-bold mb-2">Preview</h4>
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedAvatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{name}</div>
                  <div className="text-sm text-muted-foreground">New challenger</div>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 ml-auto">
                  $25 Credits
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy Note */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <h3 className="font-bold mb-3">🔒 Privacy & Safety</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Your real name and email are never shared publicly</p>
            <p>• Only your display name and avatar are visible to other users</p>
            <p>• You can change your display name and avatar anytime</p>
            <p>• All financial information is encrypted and secure</p>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center space-y-4">
        <Button onClick={handleNext} disabled={!canProceed} size="lg" className="text-lg font-bold px-12 py-6">
          Complete Profile
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        {!canProceed && <p className="text-sm text-muted-foreground">Enter your name to continue</p>}
      </div>
    </div>
  )
}
