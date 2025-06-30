"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { ChallengeDetailHeader } from "@/components/challenge-detail-header"
import { ChallengeDescription } from "@/components/challenge-description"
import { ChallengeStakeSection } from "@/components/challenge-stake-section"
import { ChallengeParticipants } from "@/components/challenge-participants"
import { ChallengeHost } from "@/components/challenge-host"
import { ChallengeProgress } from "@/components/challenge-progress"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Trophy, 
  Users, 
  Clock, 
  DollarSign, 
  Calendar,
  CheckCircle,
  AlertCircle
} from "lucide-react"

export default function ChallengePage() {
  const params = useParams()
  const { data: session } = useSession()
  const challengeId = params.id as string
  
  const [challenge, setChallenge] = useState<any>(null)
  const [participation, setParticipation] = useState<any>(null)
  const [isParticipant, setIsParticipant] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchChallengeData = async () => {
      try {
        setLoading(true)
        
        // Use mock data for now since we don't have individual challenge API yet
        const mockChallenge = {
          id: challengeId,
          title: "Morning Meditation Streak",
          description: "Transform your mornings and build unshakeable mental clarity with a 7-day meditation commitment.",
          long_description: `Start every day with intention and focus. This challenge will help you build a sustainable meditation practice that sticks.

**What you'll do:**
• Meditate for 10+ minutes every morning
• Complete before 10 AM in your timezone  
• Submit daily proof via photo or video
• Join our supportive community chat

**What you'll gain:**
• Reduced stress and anxiety
• Better focus throughout the day
• Improved emotional regulation
• A habit that lasts beyond 7 days`,
          category: "Mindfulness",
          duration: "7 days",
          difficulty: "Easy",
          current_participants: 234,
          max_participants: 500,
          min_participants: 10,
          min_stake: 10,
          max_stake: 100,
          allow_points_only: false,
          start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          host_name: "Sarah Chen",
          host_id: "host-123",
          enable_team_mode: false,
          privacy_type: 'public',
          rules: [
            "Meditate for minimum 10 minutes each morning",
            "Must complete before 10 AM in your local timezone",
            "Submit proof daily (photo of meditation setup or brief video)",
            "No makeup days - consistency is key",
            "Be respectful in community discussions",
          ],
          daily_instructions: "Start your day with 10+ minutes of meditation before 10 AM",
          proof_instructions: "Submit a photo of your meditation setup or a brief video",
          selected_proof_types: ["photo", "video"]
        }
        
        setChallenge(mockChallenge)
        
        // Fetch participation status if user is logged in
        if (session?.user) {
          try {
            const participationResponse = await fetch(`/api/challenges/${challengeId}/join`)
            if (participationResponse.ok) {
              const participationData = await participationResponse.json()
              setIsParticipant(participationData.isParticipant)
              setParticipation(participationData.participation)
            }
          } catch (err) {
            // If API fails, assume not participating
            console.log('Could not fetch participation status:', err)
          }
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load challenge')
      } finally {
        setLoading(false)
      }
    }

    if (challengeId) {
      fetchChallengeData()
    }
  }, [challengeId, session])

  const handleJoinSuccess = (newParticipation: any) => {
    setIsParticipant(true)
    setParticipation(newParticipation)
    
    // Refresh challenge data to get updated participant count
    if (challenge) {
      setChallenge({
        ...challenge,
        current_participants: challenge.current_participants + 1
      })
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-8 animate-pulse">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="h-64 bg-muted rounded-lg"></div>
              <div className="h-48 bg-muted rounded-lg"></div>
            </div>
            <div className="space-y-6">
              <div className="h-64 bg-muted rounded-lg"></div>
              <div className="h-32 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !challenge) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Challenge Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error || "This challenge doesn't exist or has been removed."}
            </p>
            <Button onClick={() => window.history.back()} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Transform data for existing components
  const challengeData = {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    longDescription: challenge.long_description || challenge.description,
    category: challenge.category,
    duration: challenge.duration,
    difficulty: challenge.difficulty,
    participants: challenge.current_participants,
    completionRate: 78, // Mock data - would come from database
    minStake: challenge.min_stake,
    maxStake: challenge.max_stake,
    allowPointsOnly: challenge.allow_points_only,
    totalPot: challenge.current_participants * 50, // Mock calculation
    startDate: challenge.start_date,
    endDate: challenge.end_date,
    status: challenge.status,
    hasTeams: challenge.enable_team_mode,
    isPrivate: challenge.privacy_type === 'private',
    rules: challenge.rules,
    dailyInstructions: challenge.daily_instructions,
    proofInstructions: challenge.proof_instructions,
    proofTypes: challenge.selected_proof_types,
    host: {
      name: challenge.host_name,
      avatar: "/placeholder.svg?height=60&width=60",
      bio: "Challenge host",
      completedChallenges: 12,
      successRate: 94,
      verified: true,
    },
    isJoined: isParticipant,
    userProgress: participation?.progress,
    team: participation?.team,
    recentActivity: [],
  }

  const spotsLeft = challenge.max_participants ? challenge.max_participants - challenge.current_participants : null
  const isEnded = new Date(challenge.end_date) <= new Date()
  const canJoin = !isParticipant && !isEnded && 
    (challenge.status === 'active' || challenge.status === 'pending') &&
    (spotsLeft === null || spotsLeft > 0)

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Status Banner */}
      {isParticipant && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <div className="flex items-center justify-between">
              <span>
                You're participating in this challenge! 
                {participation?.team && (
                  <span className="ml-2">
                    Team: <strong>{participation.team.emoji} {participation.team.name}</strong>
                  </span>
                )}
              </span>
              {participation?.progress && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {participation.progress.days_completed}/{participation.progress.total_days} days
                </Badge>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Challenge Header */}
      <ChallengeDetailHeader challenge={challengeData} />
      
      {/* Challenge Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="font-semibold">{challenge.current_participants}</div>
            <div className="text-sm text-muted-foreground">
              {challenge.max_participants ? `/ ${challenge.max_participants}` : ''} Participants
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="font-semibold">{challenge.duration}</div>
            <div className="text-sm text-muted-foreground">Duration</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
            <div className="font-semibold">
              {challenge.allow_points_only ? 'Free' : `$${challenge.min_stake}-${challenge.max_stake}`}
            </div>
            <div className="text-sm text-muted-foreground">Stake Range</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="font-semibold">{challenge.difficulty}</div>
            <div className="text-sm text-muted-foreground">Difficulty</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <ChallengeDescription challenge={challengeData} />
          
          {isParticipant && participation?.progress && (
            <ChallengeProgress challenge={challengeData} />
          )}
          
          <ChallengeParticipants
            participants={challengeData.participants}
            recentActivity={challengeData.recentActivity}
            completionRate={challengeData.completionRate}
          />
        </div>
        
        <div className="space-y-6">
          <ChallengeStakeSection 
            challenge={challengeData} 
            canJoin={canJoin}
            onJoinSuccess={handleJoinSuccess}
          />
          <ChallengeHost host={challengeData.host} />
        </div>
      </div>
    </div>
  )
}
