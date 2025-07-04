"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Flag, AlertTriangle } from "lucide-react"

interface ReportContentModalProps {
  contentType: 'user' | 'post' | 'challenge' | 'profile'
  contentId: string
  reportedUserId?: string
  children?: React.ReactNode
}

const reportReasons = {
  user: [
    { value: 'harassment', label: 'Harassment or Bullying', description: 'Targeting or attacking someone' },
    { value: 'spam', label: 'Spam or Fraud', description: 'Fake accounts or misleading content' },
    { value: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone else' },
    { value: 'inappropriate', label: 'Inappropriate Behavior', description: 'Violating community standards' }
  ],
  post: [
    { value: 'hate_speech', label: 'Hate Speech', description: 'Promotes violence or hatred' },
    { value: 'harassment', label: 'Harassment', description: 'Bullying or attacking others' },
    { value: 'spam', label: 'Spam', description: 'Unwanted promotional content' },
    { value: 'misinformation', label: 'False Information', description: 'Spreading misinformation' },
    { value: 'inappropriate', label: 'Inappropriate Content', description: 'Violates community guidelines' },
    { value: 'copyright', label: 'Copyright Violation', description: 'Uses copyrighted material without permission' }
  ],
  challenge: [
    { value: 'inappropriate', label: 'Inappropriate Content', description: 'Violates community guidelines' },
    { value: 'misleading', label: 'Misleading Information', description: 'False or deceptive challenge details' },
    { value: 'spam', label: 'Spam', description: 'Promotional or irrelevant content' },
    { value: 'unsafe', label: 'Safety Concerns', description: 'Potentially harmful activities' }
  ],
  profile: [
    { value: 'inappropriate', label: 'Inappropriate Profile', description: 'Offensive name or image' },
    { value: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone else' },
    { value: 'spam', label: 'Spam Account', description: 'Fake or promotional account' }
  ]
}

export function ReportContentModal({ contentType, contentId, reportedUserId, children }: ReportContentModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState("")
  const [details, setDetails] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      toast({
        title: "Reason Required",
        description: "Please select a reason for reporting this content.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          contentId,
          reportedUserId,
          reason: selectedReason,
          details: details.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Report Submitted",
          description: "Thank you for helping keep our community safe. We'll review this report.",
          variant: "default"
        })
        setIsOpen(false)
        setSelectedReason("")
        setDetails("")
      } else {
        throw new Error(data.error || 'Failed to submit report')
      }
    } catch (error) {
      toast({
        title: "Report Failed",
        description: error instanceof Error ? error.message : "Unable to submit report. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const reasons = reportReasons[contentType] || []

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
            <Flag className="w-4 h-4 mr-1" />
            Report
          </Button>
        )}
      </DialogTrigger>
              <DialogContent className="max-w-md mobile-safe-width">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Report {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">What's the issue?</Label>
            <RadioGroup 
              value={selectedReason} 
              onValueChange={setSelectedReason}
              className="mt-2"
            >
              {reasons.map((reason) => (
                <div key={reason.value} className="flex items-start space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} className="mt-1" />
                  <div className="grid gap-1">
                    <Label 
                      htmlFor={reason.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {reason.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {reason.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="details" className="text-sm font-medium">
              Additional Details (Optional)
            </Label>
            <Textarea
              id="details"
              placeholder="Please provide any additional context that might help our review..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="mt-1"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {details.length}/500 characters
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>Privacy Notice:</strong> Reports are reviewed by our moderation team. 
              False reports may result in action against your account.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={handleSubmitReport}
              disabled={isSubmitting || !selectedReason}
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
