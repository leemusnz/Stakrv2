"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { getProxiedAvatarUrl } from "@/lib/utils"
import { ChallengeDetailHeader } from "@/components/challenge-detail-header"
import { ChallengeDescription } from "@/components/challenge-description"
import { ChallengeStakeSection } from "@/components/challenge-stake-section"
import { ChallengeParticipants } from "@/components/challenge-participants"
import { ChallengeHost } from "@/components/challenge-host"
import { ChallengeProgress } from "@/components/challenge-progress"
import { ChallengeCommunityTabs } from "@/components/challenge-community-tabs"
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
  AlertCircle,
  Star
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
        
        // Fetch real challenge data from API
        const response = await fetch(`/api/challenges/${challengeId}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch challenge: ${response.status}`)
        }
        
        const data = await response.json()
        if (!data.success || !data.challenge) {
          throw new Error('Invalid challenge data received')
        }
        
        const challengeData = data.challenge
        
        // Debug: Check what host data we're getting
        console.log('🔍 Challenge host data:', {
          host_name: challengeData.host_name,
          host_id: challengeData.host_id,
          host_avatar_url: challengeData.host_avatar_url
        })
        
        // Transform database data to match expected format
        const transformedChallenge = {
          id: challengeData.id,
          title: challengeData.title,
          description: challengeData.description,
          long_description: challengeData.long_description || challengeData.description,
          category: challengeData.category,
          duration: challengeData.duration,
          difficulty: challengeData.difficulty,
          current_participants: challengeData.current_participants || 0,
          max_participants: challengeData.max_participants,
          min_participants: challengeData.min_participants,
          min_stake: challengeData.min_stake,
          max_stake: challengeData.max_stake,
          allow_points_only: challengeData.allow_points_only,
          start_date: challengeData.start_date,
          end_date: challengeData.end_date,
          status: challengeData.status,
          host_name: challengeData.host_name,
          host_id: challengeData.host_id,
          host_avatar_url: challengeData.host_avatar_url,
          enable_team_mode: challengeData.enable_team_mode,
          privacy_type: challengeData.privacy_type,
          rules: challengeData.rules || [],
          daily_instructions: challengeData.daily_instructions,
          proof_instructions: challengeData.proof_instructions,
          selected_proof_types: challengeData.selected_proof_types || ["photo"],
          proofRequirements: challengeData.proofRequirements || [], // Use the transformed ProofRequirement objects from API
          general_instructions: challengeData.general_instructions,
          require_timer: challengeData.require_timer,
          timer_min_duration: challengeData.timer_min_duration,
          timer_max_duration: challengeData.timer_max_duration,
          random_checkin_enabled: challengeData.random_checkin_enabled,
          random_checkin_probability: challengeData.random_checkin_probability
        }
        
        setChallenge(transformedChallenge)
        
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

  // Debug: Check what we're passing to host
  console.log('🖼️ Host avatar processing:', {
    raw_avatar_url: challenge.host_avatar_url,
    proxied_avatar_url: getProxiedAvatarUrl(challenge.host_avatar_url),
    host_name: challenge.host_name
  })

  const spotsLeft = challenge.max_participants ? challenge.max_participants - challenge.current_participants : null
  const isEnded = new Date(challenge.end_date) <= new Date()
  const isHost = session?.user?.id === challenge.host_id
  const canJoin = !isParticipant && !isEnded && 
    (challenge.status === 'active' || challenge.status === 'pending') &&
    (spotsLeft === null || spotsLeft > 0)
    
  // Debug logging for host join issues
  if (isHost) {
    console.log('🏆 Host Debug Info:', {
      isHost: true,
      isParticipant,
      canJoin,
      challengeStatus: challenge.status,
      isEnded,
      spotsLeft,
      userId: session?.user?.id,
      hostId: challenge.host_id
    })
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
    isHost: isHost,
    rules: challenge.rules,
    dailyInstructions: challenge.daily_instructions,
    proofInstructions: challenge.proof_instructions,
    proofTypes: challenge.selected_proof_types,
    host: {
      name: challenge.host_name,
      avatar: getProxiedAvatarUrl(challenge.host_avatar_url),
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

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-20">
      {/* Status Banner */}
      {isParticipant && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <div className="flex items-center justify-between">
              <span>
                {isHost ? "You're hosting AND participating in this challenge! 🎯" : "You're participating in this challenge!"}
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
      
      {/* Host Can Join Banner */}
      {isHost && !isParticipant && canJoin && (
        <Alert className="border-blue-200 bg-blue-50">
          <Trophy className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            <div className="flex items-center justify-between">
              <span>
                <strong>You're the host!</strong> Want to participate alongside your community? 
                You can stake money and compete for rewards just like everyone else.
              </span>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                Host + Participant = Max Earnings! 💰
              </Badge>
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
            {challenge.allow_points_only && (!challenge.min_stake || !challenge.max_stake || 
              (Number(challenge.min_stake) === 0 && Number(challenge.max_stake) === 0)) ? (
              <>
                <Star className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                <div className="font-semibold">Points Only</div>
                <div className="text-sm text-muted-foreground">No Money Required</div>
              </>
            ) : (
              <>
                <DollarSign className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                <div className="font-semibold">
                  {challenge.allow_points_only ? 'Free or Money' : `$${challenge.min_stake}-${challenge.max_stake}`}
                </div>
                <div className="text-sm text-muted-foreground">
                  {challenge.allow_points_only ? 'Flexible Options' : 'Stake Range'}
                </div>
              </>
            )}
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

      {/* Community Tabs Interface */}
      <ChallengeCommunityTabs 
        challenge={challengeData}
        isParticipant={isParticipant}
        canJoin={canJoin}
        participation={participation}
        onJoinSuccess={handleJoinSuccess}
      />
    </div>
  )
}
