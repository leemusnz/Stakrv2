'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Play, Pause, Square, AlertCircle, CheckCircle, Clock, Zap, Hand, Volume2 } from 'lucide-react'
import { toast } from 'sonner'
import { RandomCheckinModal } from './random-checkin-modal'

interface ActivityTimerProps {
  challengeId: string
  challengeName: string
  requiresTimer?: boolean
  randomCheckinsEnabled?: boolean
  minDuration?: number
  maxDuration?: number
  onSessionComplete?: (sessionData: any) => void
}

interface SessionData {
  id: string
  challenge_id: string
  started_at: string
  planned_duration: number
  status: 'active' | 'paused' | 'completed' | 'abandoned'
  elapsed_minutes?: number
  remaining_minutes?: number
  random_checkins_enabled?: boolean
  next_checkin_time?: string
}

export function ActivityTimer({
  challengeId,
  challengeName,
  requiresTimer = false,
  randomCheckinsEnabled = false,
  minDuration = 15,
  maxDuration = 120,
  onSessionComplete
}: ActivityTimerProps) {
  const [session, setSession] = useState<SessionData | null>(null)
  const [plannedDuration, setPlannedDuration] = useState(30)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [activeCheckin, setActiveCheckin] = useState<any>(null)
  const [qualityScore, setQualityScore] = useState(100)
  const [randomChecksPassed, setRandomChecksPassed] = useState(0)
  const [randomChecksFailed, setRandomChecksFailed] = useState(0)

  // Format time display
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate progress percentage
  const progressPercentage = session ? 
    Math.min((elapsedSeconds / (session.planned_duration * 60)) * 100, 100) : 0

  // Start a new session
  const startSession = async () => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planned_duration: plannedDuration,
          location: null
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setSession(data.session)
        setElapsedSeconds(0)
        setIsRunning(true)
        setQualityScore(100)
        setRandomChecksPassed(0)
        setRandomChecksFailed(0)
        toast.success(data.message)
      } else {
        toast.error(data.error || 'Failed to start session')
      }
    } catch (error) {
      console.error('Start session error:', error)
      toast.error('Failed to start session')
    }
  }

  // Complete session
  const completeSession = async () => {
    if (!session) return

    try {
      const response = await fetch(`/api/challenges/${challengeId}/sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          actual_duration: Math.floor(elapsedSeconds / 60)
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setIsRunning(false)
        setSession(null)
        toast.success(data.message)
        onSessionComplete?.(data.session)
      } else {
        toast.error(data.error || 'Failed to complete session')
      }
    } catch (error) {
      console.error('Complete session error:', error)
      toast.error('Failed to complete session')
    }
  }

  // Check for random check-ins with enhanced verification
  const checkRandomCheckins = useCallback(async () => {
    if (!session || !randomCheckinsEnabled || !isRunning) return

    try {
      const response = await fetch('/api/random-checkins/active')
      const data = await response.json()
      
      if (data.success && data.checkin) {
        setActiveCheckin(data.checkin)
        setShowCheckinModal(true)
        setIsRunning(false) // Pause timer during check-in
        
        // Enhanced notification based on verification type
        if (data.checkin.checkin_type.includes('gesture')) {
          toast.warning('🤚 Gesture verification required!', {
            description: 'Complete the specific gesture to continue your session'
          })
        } else if (data.checkin.checkin_type.includes('word')) {
          toast.warning('🗣️ Word verification required!', {
            description: 'Say the required word to continue your session'
          })
        } else {
          toast.warning('🔍 Random verification required!', {
            description: 'Complete the check-in to continue your session'
          })
        }
      }
    } catch (error) {
      console.error('Check random checkins error:', error)
    }
  }, [session, randomCheckinsEnabled, isRunning])

  // Handle random check-in response with enhanced scoring
  const handleCheckinResponse = async (response: any) => {
    if (!activeCheckin) return

    const responseTimeSeconds = Math.floor((Date.now() - new Date(activeCheckin.triggered_at).getTime()) / 1000)

    try {
      const apiResponse = await fetch(`/api/random-checkins/${activeCheckin.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_type: response.type,
          response_data: response.data,
          response_time_seconds: responseTimeSeconds
        })
      })

      const data = await apiResponse.json()
      
      if (data.success) {
        if (data.result === 'approved') {
          setRandomChecksPassed(prev => prev + 1)
          const bonusPoints = activeCheckin.verification_difficulty ? 
            activeCheckin.verification_difficulty * 2 : 5
          setQualityScore(prev => Math.min(prev + bonusPoints, 100))
          
          // Enhanced success messages
          if (activeCheckin.checkin_type.includes('gesture')) {
            toast.success('🎉 Gesture verified! Perfect execution!')
          } else if (activeCheckin.checkin_type.includes('word')) {
            toast.success('🎉 Word verified! Clear pronunciation!')
          } else {
            toast.success('🎉 Verification passed!')
          }
        } else {
          setRandomChecksFailed(prev => prev + 1)
          const penalty = activeCheckin.verification_difficulty ? 
            activeCheckin.verification_difficulty * 3 : 5
          setQualityScore(prev => Math.max(prev - penalty, 0))
          
          toast.error('❌ Verification failed, but you can continue', {
            description: 'This affects your session quality score'
          })
        }
        
        setShowCheckinModal(false)
        setActiveCheckin(null)
        setIsRunning(true) // Resume timer
      } else {
        toast.error(data.error || 'Failed to submit check-in')
      }
    } catch (error) {
      console.error('Submit checkin response error:', error)
      toast.error('Failed to submit check-in response')
    }
  }

  // Timer effect with enhanced random check-in simulation
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && session) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
        
        // Enhanced random check-in simulation for demo
        if (randomCheckinsEnabled && Math.random() < 0.0012) { // ~0.12% chance per second
          // Simulate different verification types
          const verificationTypes = ['gesture', 'word']
          const selectedType = verificationTypes[Math.floor(Math.random() * verificationTypes.length)]
          
          if (selectedType === 'gesture') {
            toast.warning('🤚 Random gesture check triggered!', {
              description: 'Show the required hand gesture'
            })
          } else {
            toast.warning('🗣️ Random word check triggered!', {
              description: 'Say the verification word'
            })
          }
          
          setRandomChecksPassed(prev => prev + 1)
          setQualityScore(prev => Math.min(prev + 3, 100))
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, session, randomCheckinsEnabled])

  // Random check-in polling effect with better timing
  useEffect(() => {
    if (!randomCheckinsEnabled || !isRunning || !session) return

    // Check every 20 seconds for random check-ins (more frequent for better demo)
    const checkInterval = setInterval(checkRandomCheckins, 20000)
    
    return () => clearInterval(checkInterval)
  }, [randomCheckinsEnabled, isRunning, session, checkRandomCheckins])

  if (!requiresTimer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            No Timer Required
          </CardTitle>
          <CardDescription>
            This challenge doesn't require timed sessions. You can submit proof anytime.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timer
            {randomCheckinsEnabled && (
              <Badge variant="secondary" className="ml-2">
                <Zap className="h-3 w-3 mr-1" />
                Enhanced Verification
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Track your activity time for {challengeName}
            {randomCheckinsEnabled && " with gesture and word verification"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!session ? (
            // Setup new session
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Planned Duration (minutes)</label>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPlannedDuration(Math.max(minDuration, plannedDuration - 5))}
                  >
                    -5
                  </Button>
                  <span className="font-mono text-lg px-4">{plannedDuration} min</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPlannedDuration(Math.min(maxDuration, plannedDuration + 5))}
                  >
                    +5
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Range: {minDuration}-{maxDuration} minutes
                </p>
              </div>
              
              {randomCheckinsEnabled && (
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Enhanced Anti-Cheat Verification</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Hand className="h-4 w-4 text-yellow-600" />
                      <span>Gesture verification</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-yellow-600" />
                      <span>Word verification</span>
                    </div>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-3">
                    You may be asked to perform specific gestures (like holding up fingers) or say specific words (like "giraffe") during your session. Respond quickly to maintain your quality score!
                  </p>
                </div>
              )}
              
              <Button onClick={startSession} className="w-full" size="lg">
                <Play className="h-4 w-4 mr-2" />
                Start Enhanced Activity Session
              </Button>
            </div>
          ) : (
            // Active session
            <div className="space-y-6">
              {/* Timer Display */}
              <div className="text-center space-y-2">
                <div className="text-4xl font-mono font-bold">
                  {formatTime(elapsedSeconds)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Target: {session.planned_duration} minutes
                </div>
                <Progress value={progressPercentage} className="w-full" />
              </div>
              
              {/* Enhanced Session Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className={`text-lg font-semibold ${
                    qualityScore >= 90 ? 'text-green-600' : 
                    qualityScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {qualityScore}%
                  </div>
                  <div className="text-xs text-muted-foreground">Quality Score</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-blue-600">
                    {randomChecksPassed}
                  </div>
                  <div className="text-xs text-muted-foreground">Verifications Passed</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-600">
                    {randomChecksFailed}
                  </div>
                  <div className="text-xs text-muted-foreground">Verifications Failed</div>
                </div>
              </div>
              
              {/* Active Check-in Indicator */}
              {activeCheckin && (
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg border border-yellow-300 dark:border-yellow-700">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <Zap className="h-4 w-4" />
                    <span className="font-medium">Verification in Progress</span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Complete the {activeCheckin.checkin_type.includes('gesture') ? 'gesture' : 'word'} verification to continue
                  </p>
                </div>
              )}
              
              <Separator />
              
              {/* Controls */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsRunning(!isRunning)}
                  disabled={showCheckinModal}
                >
                  {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {isRunning ? 'Pause' : 'Resume'}
                </Button>
                
                <Button
                  variant="default"
                  onClick={completeSession}
                  className="flex-1"
                  disabled={elapsedSeconds < 300} // Minimum 5 minutes
                >
                  <Square className="h-4 w-4 mr-2" />
                  Complete Session
                </Button>
              </div>
              
              {elapsedSeconds < 300 && (
                <p className="text-xs text-muted-foreground text-center">
                  Minimum 5 minutes required to complete session
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Enhanced Random Check-in Modal */}
      {showCheckinModal && activeCheckin && (
        <RandomCheckinModal
          checkin={activeCheckin}
          onResponse={handleCheckinResponse}
          onClose={() => {
            setShowCheckinModal(false)
            setActiveCheckin(null)
            setIsRunning(true)
          }}
        />
      )}
    </div>
  )
}
