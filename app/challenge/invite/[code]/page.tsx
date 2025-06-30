"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Copy, 
  Share2, 
  Users, 
  Calendar, 
  DollarSign, 
  CheckCircle,
  Eye,
  Send,
  Mail,
  MessageSquare
} from "lucide-react"
import { useNotifications } from "@/components/notifications/notification-provider"

export default function ChallengeInvitePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { addNotification } = useNotifications()
  
  const inviteCode = params.code as string
  const [challenge, setChallenge] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [inviteEmails, setInviteEmails] = useState("")
  const [sendingInvites, setSendingInvites] = useState(false)

  // Mock challenge data for demo
  useEffect(() => {
    const loadChallenge = async () => {
      try {
        // For demo purposes, create mock challenge data
        const mockChallenge = {
          id: `challenge-${inviteCode}`,
          title: "Private Fitness Challenge",
          description: "A private 30-day fitness challenge for our group",
          category: "fitness",
          difficulty: "medium",
          duration: "30 days",
          minParticipants: 3,
          maxParticipants: 10,
          currentParticipants: 1,
          hostName: session?.user?.name || "Challenge Host",
          startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          minStake: 25,
          maxStake: 100,
          allowPointsOnly: false,
          rules: [
            "Complete 30 minutes of exercise daily",
            "Submit photo proof within 24 hours",
            "Support your teammates",
            "No excuses, only results!"
          ],
          inviteCode: inviteCode
        }
        
        setChallenge(mockChallenge)
      } catch (error) {
        console.error('Failed to load challenge:', error)
      } finally {
        setLoading(false)
      }
    }

    if (inviteCode) {
      loadChallenge()
    }
  }, [inviteCode, session])

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode)
    addNotification({
      type: "system",
      title: "Copied!",
      message: "Invite code copied to clipboard"
    })
  }

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/challenge/invite/${inviteCode}`
    navigator.clipboard.writeText(inviteLink)
    addNotification({
      type: "system",
      title: "Copied!",
      message: "Invite link copied to clipboard"
    })
  }

  const shareChallenge = async () => {
    const inviteLink = `${window.location.origin}/challenge/invite/${inviteCode}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: challenge.title,
          text: `Join my challenge: ${challenge.title}`,
          url: inviteLink
        })
      } catch (error) {
        // Fallback to clipboard
        copyInviteLink()
      }
    } else {
      copyInviteLink()
    }
  }

  const sendEmailInvites = async () => {
    if (!inviteEmails.trim()) {
      addNotification({
        type: "system",
        title: "Missing emails",
        message: "Please enter at least one email address"
      })
      return
    }

    setSendingInvites(true)

    try {
      // Mock API call - in real app would send emails
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      addNotification({
        type: "system",
        title: "Invites sent!",
        message: `Invitations sent to ${inviteEmails.split(',').length} people`
      })
      
      setInviteEmails("")
    } catch (error) {
      addNotification({
        type: "system",
        title: "Failed to send",
        message: "Could not send email invitations"
      })
    } finally {
      setSendingInvites(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading challenge...</p>
        </div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Challenge Not Found</h1>
          <p className="text-muted-foreground">This invite code is invalid or expired</p>
          <Button onClick={() => router.push('/discover')}>
            Browse Public Challenges
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🎯 Private Challenge Invite</h1>
          <p className="text-muted-foreground">Share this challenge with your friends and get started!</p>
        </div>

        {/* Challenge Details */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{challenge.title}</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Created by <span className="font-medium">{challenge.hostName}</span>
                </p>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                Private Challenge
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg">{challenge.description}</p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <div className="font-semibold">{challenge.duration}</div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Users className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <div className="font-semibold">{challenge.currentParticipants}/{challenge.maxParticipants}</div>
                <div className="text-sm text-muted-foreground">Participants</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <DollarSign className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                <div className="font-semibold">${challenge.minStake}-${challenge.maxStake}</div>
                <div className="text-sm text-muted-foreground">Stake Range</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Badge variant="outline" className="mb-2">{challenge.difficulty}</Badge>
                <div className="text-sm text-muted-foreground">Difficulty</div>
              </div>
            </div>

            {/* Rules */}
            <div>
              <h3 className="font-semibold mb-3">Challenge Rules:</h3>
              <ul className="space-y-2">
                {challenge.rules.map((rule: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Alert>
              <Eye className="w-4 h-4" />
              <AlertDescription>
                Starts on {new Date(challenge.startDate).toLocaleDateString()} • 
                Minimum {challenge.minParticipants} participants needed
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Invite Methods */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Share Invite Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="w-5 h-5" />
                Share Invite Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Invite Code:</p>
                <div className="flex gap-2">
                  <Input 
                    value={inviteCode} 
                    readOnly 
                    className="font-mono text-lg text-center"
                  />
                  <Button onClick={copyInviteCode} variant="outline">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={copyInviteLink} variant="outline" className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button onClick={shareChallenge} variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Share this code or link with friends so they can join your private challenge.
              </p>
            </CardContent>
          </Card>

          {/* Email Invites */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Send Email Invites
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Email addresses (comma separated):</p>
                <textarea
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                  placeholder="friend1@email.com, friend2@email.com"
                  className="w-full p-3 border rounded-md resize-none"
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={sendEmailInvites} 
                disabled={sendingInvites || !inviteEmails.trim()}
                className="w-full"
              >
                {sendingInvites ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Invitations
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground">
                We'll send them a personalized invitation with the challenge details.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4 justify-center">
          <Button 
            onClick={() => router.push(`/challenge/${challenge.id}`)} 
            variant="outline"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Challenge
          </Button>
          <Button onClick={() => router.push('/create-challenge')}>
            Create Another Challenge
          </Button>
        </div>
      </div>
    </div>
  )
}
