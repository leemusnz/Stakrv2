"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { SocialFeed } from "@/components/social/social-feed"
import { Leaderboard } from "@/components/social/leaderboard"
import { FriendActivity } from "@/components/social/friend-activity"
import { SocialProof } from "@/components/social/social-proof"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, Trophy, UserPlus } from "lucide-react"

export default function SocialPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<"feed" | "leaderboard" | "friends">("feed")

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="w-8 h-8 text-primary" />
              Social Hub
            </h1>
            <p className="text-muted-foreground">
              {session?.user?.name ? `Welcome ${session.user.name}! ` : ''}Connect with the community, celebrate wins, and stay motivated together
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">10,247</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-success">89%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-secondary">$2.3M</div>
                <div className="text-sm text-muted-foreground">Total Earned</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-500">47K</div>
                <div className="text-sm text-muted-foreground">Challenges Done</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-muted">
          <Button
            variant={activeTab === "feed" ? "default" : "ghost"}
            onClick={() => setActiveTab("feed")}
            className="rounded-b-none flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Community Feed
          </Button>
          <Button
            variant={activeTab === "leaderboard" ? "default" : "ghost"}
            onClick={() => setActiveTab("leaderboard")}
            className="rounded-b-none flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </Button>
          <Button
            variant={activeTab === "friends" ? "default" : "ghost"}
            onClick={() => setActiveTab("friends")}
            className="rounded-b-none flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Friends
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "feed" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Feed */}
            <div className="lg:col-span-3">
              <SocialFeed showFilters={true} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <SocialProof variant="compact" />
              <Leaderboard timeframe="weekly" />
            </div>
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Leaderboard */}
            <div className="lg:col-span-2">
              <Leaderboard timeframe="weekly" category="overall" showCurrentUser={true} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <SocialProof showActivity={true} showStats={false} showTestimonials={false} />
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Other Rankings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Trophy className="w-4 h-4 mr-2" />
                    Top Earners
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Longest Streaks
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Users className="w-4 h-4 mr-2" />
                    Most Challenges
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "friends" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Friends Activity */}
            <div className="space-y-6">
              <FriendActivity showInviteButton={true} />
            </div>

            {/* Social Features */}
            <div className="space-y-6">
              <SocialProof showActivity={false} showStats={true} showTestimonials={true} />

              {/* Friend Challenges */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Friend Challenges
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg">
                    <h3 className="font-medium mb-2">Challenge Your Friends</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Create private challenges and compete with your friends for extra motivation!
                    </p>
                    <Button size="sm" className="w-full">
                      Create Friend Challenge
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Active Friend Challenges</h4>
                    <div className="text-center py-4 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No active friend challenges</p>
                      <p className="text-xs">Invite friends to get started!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
