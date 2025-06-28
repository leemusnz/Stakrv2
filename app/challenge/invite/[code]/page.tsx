"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Copy, Share2, Users, Clock, DollarSign, Trophy, CheckCircle, Calendar, User } from "lucide-react"

export default function ChallengeInvitePage() {
  const params = useParams()
  const code = params.code as string
  const [copied, setCopied] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  // Mock challenge data - in real app, fetch based on code
  const challenge = {
    id: "challenge-123",
    title: "Smith Family Fitness Challenge",
    description:
      "Let's get fit together! 30 days of daily exercise, tracking our progress as a family. Winner takes all the stakes!",
    category: "Health & Fitness",
    duration: "30",
    difficulty: "intermediate",
    minParticipants: 3,
    maxParticipants: 8,
    currentParticipants: 2,
    minStake: 50,
    maxStake: 100,
    rewardDistribution: "winner-takes-all",
    enableTeamMode: true,
    numberOfTeams: 2,
    isPrivate: true,
    joinDeadlineType: "days",
    joinDeadlineDays: 2,
    host: {
      name: "Sarah Smith",
      avatar: "/placeholder.svg?height=40&width=40",
      verified: true,
    },
    participants: [
      {
        id: "1",
        name: "Sarah Smith",
        avatar: "/placeholder.svg?height=32&width=32",
        joinedAt: "2024-01-15T10:00:00Z",
        isHost: true,
      },
      {
        id: "2",
        name: "Mike Smith",
        avatar: "/placeholder.svg?height=32&width=32",
        joinedAt: "2024-01-15T14:30:00Z",
        isHost: false,
      },
    ],
    startsAt: "2024-01-17T00:00:00Z", // 2 days from creation
  }

  const inviteLink = `https://stakr.app/join/${code}`
  const spotsLeft = challenge.maxParticipants - challenge.currentParticipants
  const daysUntilStart = Math.ceil(
    (new Date(challenge.startsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  )

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }

  const shareChallenge = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: challenge.title,
          text: `Join me in the ${challenge.title}! Let's do this challenge together.`,
          url: inviteLink,
        })
      } catch (err) {
        console.error("Error sharing:", err)
      }
    } else {
      // Fallback to copying link
      copyInviteLink()
    }
  }

  const joinChallenge = async () => {
    setIsJoining(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      // In real app, would join the challenge and redirect
      console.log("Joined challenge:", challenge.id)
    } catch (error) {
      console.error("Failed to join challenge:", error)
    } finally {
      setIsJoining(false)
    }
  }

  const user = {
    name: "Alex Chen",
    avatar: "/placeholder.svg?height=40&width=40",
    credits: 250,
    activeStakes: 3,
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Challenge Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Challenge Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        Private Challenge
                      </Badge>
                      {challenge.enableTeamMode && (
                        <Badge variant="default" className="bg-primary">
                          <Users className="w-3 h-3 mr-1" />
                          Team Challenge
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl">{challenge.title}</CardTitle>
                    <CardDescription className="text-base">{challenge.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Calendar className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium">{challenge.duration} Days</p>
                    <p className="text-xs text-muted-foreground">Duration</p>
                  </div>
                  <div className="text-center">
                    <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {challenge.currentParticipants}/{challenge.maxParticipants}
                    </p>
                    <p className="text-xs text-muted-foreground">Participants</p>
                  </div>
                  <div className="text-center">
                    <DollarSign className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      ${challenge.minStake}-${challenge.maxStake}
                    </p>
                    <p className="text-xs text-muted-foreground">Stake Range</p>
                  </div>
                  <div className="text-center">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium">{daysUntilStart} Days</p>
                    <p className="text-xs text-muted-foreground">Until Start</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Host Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Challenge Host</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={challenge.host.avatar || "/placeholder.svg"} alt={challenge.host.name} />
                    <AvatarFallback>
                      {challenge.host.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{challenge.host.name}</p>
                      {challenge.host.verified && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </div>
                    <p className="text-sm text-muted-foreground">Challenge Creator</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Who's Joining ({challenge.currentParticipants})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {challenge.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={participant.avatar || "/placeholder.svg"} alt={participant.name} />
                        <AvatarFallback>
                          {participant.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{participant.name}</p>
                          {participant.isHost && (
                            <Badge variant="outline" className="text-xs">
                              Host
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Joined {new Date(participant.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Empty spots */}
                  {Array.from({ length: spotsLeft }, (_, i) => (
                    <div key={`empty-${i}`} className="flex items-center gap-3 opacity-50">
                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Waiting for participant...</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join Challenge */}
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Join Challenge
                </CardTitle>
                <CardDescription>
                  {spotsLeft > 0 ? (
                    <>
                      Only {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left!
                    </>
                  ) : (
                    "Challenge is full"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    ${challenge.minStake} - ${challenge.maxStake}
                  </p>
                  <p className="text-sm text-muted-foreground">Your stake amount</p>
                </div>

                <Button className="w-full" size="lg" onClick={joinChallenge} disabled={spotsLeft === 0 || isJoining}>
                  {isJoining ? "Joining..." : spotsLeft === 0 ? "Challenge Full" : "Join Challenge"}
                </Button>

                <div className="text-xs text-muted-foreground text-center space-y-1">
                  <p>• Challenge starts in {daysUntilStart} days</p>
                  <p>
                    •{" "}
                    {challenge.rewardDistribution === "winner-takes-all"
                      ? "Winner takes all stakes"
                      : "Rewards split among winners"}
                  </p>
                  {challenge.enableTeamMode && <p>• Teams compete for the prize pool</p>}
                </div>
              </CardContent>
            </Card>

            {/* Share Challenge */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invite Others</CardTitle>
                <CardDescription>Share this challenge with friends and family</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={copyInviteLink}>
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                  <Button variant="outline" onClick={shareChallenge}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Invite Link:</p>
                  <p className="break-all bg-muted p-2 rounded text-xs">{inviteLink}</p>
                </div>
              </CardContent>
            </Card>

            {/* Challenge Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Challenge Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium">{challenge.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Difficulty:</span>
                  <span className="font-medium capitalize">{challenge.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min Participants:</span>
                  <span className="font-medium">{challenge.minParticipants}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Participants:</span>
                  <span className="font-medium">{challenge.maxParticipants}</span>
                </div>
                {challenge.enableTeamMode && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Teams:</span>
                      <span className="font-medium">{challenge.numberOfTeams} teams</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
