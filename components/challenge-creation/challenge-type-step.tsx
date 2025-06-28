"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe, Lock, Users, User, Info } from "lucide-react"

interface ChallengeTypeStepProps {
  selectedType: string
  onTypeSelect: (type: string) => void
}

export function ChallengeTypeStep({ selectedType, onTypeSelect }: ChallengeTypeStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">What type of challenge do you want to create?</h2>
        <p className="text-muted-foreground">
          Choose whether your challenge will be public for everyone to discover, or private for your specific group.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Public Challenge Card */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedType === "public" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
          }`}
          onClick={() => onTypeSelect("public")}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-3 rounded-lg ${selectedType === "public" ? "bg-primary text-white" : "bg-primary/10"}`}
              >
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg">Public Challenge</CardTitle>
                <Badge variant="secondary" className="text-xs mt-1">
                  <Users className="w-3 h-3 mr-1" />
                  Open to Everyone
                </Badge>
              </div>
            </div>
            <CardDescription className="text-sm">
              Anyone can discover and join your challenge through the public feed
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0 space-y-4">
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-medium text-green-700 mb-2">Perfect for:</p>
                <ul className="text-green-600 space-y-1 text-xs">
                  <li>• Building a community around your challenge</li>
                  <li>• Reaching people with similar goals</li>
                  <li>• Growing your challenge through referrals</li>
                  <li>• Maximum social accountability</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Features Available:</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    Team vs Team
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Referral Bonuses
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Public Discovery
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Up to 50 people
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Private Challenge Card */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedType === "private" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
          }`}
          onClick={() => onTypeSelect("private")}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-3 rounded-lg ${selectedType === "private" ? "bg-orange-500 text-white" : "bg-orange-100"}`}
              >
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg">Private Challenge</CardTitle>
                <Badge variant="secondary" className="text-xs mt-1">
                  <User className="w-3 h-3 mr-1" />
                  Invite Only
                </Badge>
              </div>
            </div>
            <CardDescription className="text-sm">
              Only people with your invite link can join - perfect for friends, family, or coworkers
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0 space-y-4">
            <div className="space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm font-medium text-orange-700 mb-2">Perfect for:</p>
                <ul className="text-orange-600 space-y-1 text-xs">
                  <li>• Friend groups and family challenges</li>
                  <li>• Workplace wellness programs</li>
                  <li>• Small, intimate accountability groups</li>
                  <li>• Personal solo challenges</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Features Available:</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    Team vs Team
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Solo Challenges
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Custom Start Dates
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Unlimited Size
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedType && (
        <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-secondary font-medium mb-2">
            <Info className="w-4 h-4" />
            Great Choice!
          </div>
          <p className="text-sm text-muted-foreground">
            You've selected a <strong>{selectedType} challenge</strong>.
            {selectedType === "public"
              ? " Your challenge will be discoverable by anyone and can grow through social sharing."
              : " You'll get a shareable invite link to control exactly who can join."}
          </p>
        </div>
      )}
    </div>
  )
}
