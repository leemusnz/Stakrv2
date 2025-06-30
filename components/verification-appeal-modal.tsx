"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageSquare, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { useNotifications } from "@/components/notifications/notification-provider"

interface VerificationAppealModalProps {
  verification: {
    id: string
    challengeTitle: string
    stakeAmount: number
    rejectionReason: string
    rejectedAt: string
  }
  trigger?: React.ReactNode
  onAppealSubmitted?: () => void
}

export function VerificationAppealModal({ 
  verification, 
  trigger,
  onAppealSubmitted 
}: VerificationAppealModalProps) {
  const { addNotification } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [appealReason, setAppealReason] = useState("")
  const [additionalEvidence, setAdditionalEvidence] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitAppeal = async () => {
    if (!appealReason.trim()) {
      addNotification({
        type: "system",
        title: "Missing Information",
        message: "Please provide a reason for your appeal"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/user/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId: verification.id,
          appealReason: appealReason.trim(),
          additionalEvidence: additionalEvidence.trim() || null
        })
      })

      const data = await response.json()

      if (data.success) {
        addNotification({
          type: "system",
          title: "Appeal Submitted",
          message: data.message
        })
        
        setIsOpen(false)
        setAppealReason("")
        setAdditionalEvidence("")
        
        if (onAppealSubmitted) {
          onAppealSubmitted()
        }
      } else {
        throw new Error(data.error || 'Failed to submit appeal')
      }
    } catch (error) {
      addNotification({
        type: "system",
        title: "Appeal Error",
        message: error instanceof Error ? error.message : 'Failed to submit appeal'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Appeal Decision
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Appeal Verification Decision
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Challenge Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{verification.challengeTitle}</CardTitle>
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="destructive">Rejected</Badge>
                <span>${verification.stakeAmount} stake</span>
                <span>Rejected on {new Date(verification.rejectedAt).toLocaleString()}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Rejection Reason:
                </h4>
                <p className="text-sm text-red-700">{verification.rejectionReason}</p>
              </div>
            </CardContent>
          </Card>

          {/* Appeal Form */}
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Appeals are reviewed by our admin team within 24-48 hours. Please provide detailed 
                reasoning and any additional evidence that supports your case.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="appealReason" className="text-sm font-medium">
                Why should this decision be reconsidered? *
              </Label>
              <Textarea
                id="appealReason"
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="Explain why you believe the rejection was incorrect. Be specific about any errors in the review process or provide context that may have been missed..."
                className="min-h-[120px]"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">
                {appealReason.length}/1000 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalEvidence" className="text-sm font-medium">
                Additional Evidence (Optional)
              </Label>
              <Textarea
                id="additionalEvidence"
                value={additionalEvidence}
                onChange={(e) => setAdditionalEvidence(e.target.value)}
                placeholder="Describe any additional proof, documentation, or context you can provide (e.g., 'I have screenshots showing...', 'My fitness tracker data confirms...', etc.)"
                className="min-h-[80px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {additionalEvidence.length}/500 characters
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitAppeal}
              disabled={isSubmitting || !appealReason.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Appeal
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 