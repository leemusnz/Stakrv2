"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, User, Gift, Shuffle, Sparkles } from "lucide-react"
import { useState, useEffect } from "react"
import type { OnboardingData } from "@/app/onboarding/page"
import { getAllAvatars, getAvatarsByCategory, getRandomAvatar, getPersonalizedAvatar, avatarCategories, type AvatarOption } from "@/lib/avatars"
import { useSession } from "next-auth/react"

interface ProfileSetupStepProps {
  data: OnboardingData
  onNext: (data?: Partial<OnboardingData>) => void
  onBack: () => void
  onSkip: () => void
}

export function ProfileSetupStep({ data, onNext }: ProfileSetupStepProps) {
  const { data: session } = useSession()
  const [name, setName] = useState<string>(data.name || "")
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption | null>(null)
  const [allAvatars, setAllAvatars] = useState<AvatarOption[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('characters')

  useEffect(() => {
    // Generate avatars with user's email as seed for personalization
    const userSeed = session?.user?.email || 'stakr-user'
    const avatars = getAllAvatars(userSeed)
    setAllAvatars(avatars)
    
    // Set initial avatar - either from data or personalized default
    if (data.avatar) {
      const existingAvatar = avatars.find(a => a.url === data.avatar)
      setSelectedAvatar(existingAvatar || getPersonalizedAvatar(userSeed))
    } else {
      setSelectedAvatar(getPersonalizedAvatar(userSeed))
    }
  }, [session?.user?.email, data.avatar])

  const handleRandomAvatar = () => {
    const userSeed = session?.user?.email || 'stakr-user'
    const randomAvatar = getRandomAvatar(userSeed)
    setSelectedAvatar(randomAvatar)
  }

  const handleNext = () => {
    // Save profile data if user is authenticated
    if (session?.user?.id && selectedAvatar) {
      saveProfileData()
    } else {
      // If not authenticated, just continue with the data
      onNext({
        name: name.trim(),
        avatar: selectedAvatar?.url || allAvatars[0]?.url,
      })
    }
  }

  const saveProfileData = async () => {
    try {
      const response = await fetch('/api/onboarding/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          avatar: selectedAvatar?.url,
          goals: data.goals || [],
          interests: data.interests || [],
          experience: data.experience || '',
          motivation: data.motivation || '',
          preferredStakeRange: data.preferredStakeRange || ''
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Profile saved successfully:', result.user)
        onNext({
          name: name.trim(),
          avatar: selectedAvatar?.url,
          profileSaved: true
        })
      } else {
        console.error('❌ Failed to save profile:', result.error)
        // Continue anyway, profile can be updated later
        onNext({
          name: name.trim(),
          avatar: selectedAvatar?.url,
          profileSaved: false
        })
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error)
      // Continue anyway, profile can be updated later
      onNext({
        name: name.trim(),
        avatar: selectedAvatar?.url,
        profileSaved: false
      })
    }
  }

  const canProceed = name.trim().length > 0

  const filteredAvatars = getAvatarsByCategory(activeCategory, session?.user?.email || 'stakr-user')

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

      {/* Welcome Bonus Card */}
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-bold">Choose your avatar</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRandomAvatar} className="text-sm">
                  <Shuffle className="w-4 h-4 mr-2" />
                  Random
                </Button>
                {session?.user?.email && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedAvatar(getPersonalizedAvatar(session.user.email!))}
                    className="text-sm"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Personal
                  </Button>
                )}
              </div>
            </div>

            {/* Current Avatar Preview */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-primary">
                  <AvatarImage src={selectedAvatar?.url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                    {name.charAt(0).toUpperCase() || <User className="w-8 h-8" />}
                  </AvatarFallback>
                </Avatar>
                {selectedAvatar?.type === 'generated' && (
                  <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs">
                    AI Generated
                  </Badge>
                )}
              </div>
            </div>

            {/* Avatar Category Tabs */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="grid w-full grid-cols-4">
                {avatarCategories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id} className="text-xs">
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {avatarCategories.map((category) => (
                <TabsContent key={category.id} value={category.id} className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    {category.description}
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-h-64 overflow-y-auto">
                    {filteredAvatars.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`relative rounded-full transition-all hover:scale-105 p-1 ${
                          selectedAvatar?.id === avatar.id
                            ? "ring-4 ring-primary ring-offset-2 bg-primary/5"
                            : "hover:ring-2 hover:ring-primary/50 hover:bg-muted/50"
                        }`}
                        title={avatar.description}
                      >
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={avatar.url} className="object-cover" />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10">
                            {avatar.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {avatar.type === 'service' && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {selectedAvatar && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Selected: <span className="font-medium">{selectedAvatar.name}</span>
                  {selectedAvatar.description && ` - ${selectedAvatar.description}`}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Powered by {selectedAvatar.url.includes('dicebear') ? 'DiceBear' : 
                             selectedAvatar.url.includes('multiavatar') ? 'Multiavatar' :
                             selectedAvatar.url.includes('boringavatars') ? 'Boring Avatars' :
                             selectedAvatar.url.includes('robohash') ? 'RoboHash' : 'Avatar Service'}
                </p>
              </div>
            )}
          </div>

          {/* Preview */}
          {name && selectedAvatar && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-bold mb-2">Preview</h4>
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedAvatar.url} />
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
