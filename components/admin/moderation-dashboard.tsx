"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Flag, 
  Eye, 
  Clock,
  User,
  MessageSquare,
  FileText
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ModerationItem {
  id: string
  contentType: string
  contentId: string
  userId: string
  priority: number
  flaggedReasons: string[]
  aiConfidence: number
  contentPreview: string
  contentUrl?: string
  status: string
  autoFlaggedAt: string
  userInfo?: {
    name: string
    email: string
    avatar?: string
  }
}

interface UserReport {
  id: string
  reporterName: string
  reportedUserName?: string
  contentType: string
  contentId: string
  reason: string
  details?: string
  status: string
  createdAt: string
  contentPreview?: string
}

export function ModerationDashboard() {
  const [activeTab, setActiveTab] = useState("queue")
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([])
  const [userReports, setUserReports] = useState<UserReport[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadModerationData = async () => {
    try {
      setLoading(true)
      
      // Load moderation queue
      const queueResponse = await fetch('/api/admin/moderation/queue')
      if (queueResponse.ok) {
        const queueData = await queueResponse.json()
        setModerationQueue(queueData.items || [])
      }

      // Load user reports
      const reportsResponse = await fetch('/api/admin/moderation/reports')
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json()
        setUserReports(reportsData.reports || [])
      }

    } catch (error) {
      console.error('Failed to load moderation data:', error)
      toast({
        title: "Load Error",
        description: "Failed to load moderation data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const processModerationItem = async (
    itemId: string, 
    decision: 'approve' | 'reject', 
    notes: string = ''
  ) => {
    try {
      setProcessingId(itemId)
      
      const response = await fetch('/api/admin/moderation/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          decision,
          notes: notes.trim()
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Item Processed",
          description: `Content ${decision}d successfully`,
          variant: "default"
        })
        
        // Remove from queue
        setModerationQueue(prev => prev.filter(item => item.id !== itemId))
        
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Process Failed",
        description: error instanceof Error ? error.message : "Failed to process item",
        variant: "destructive"
      })
    } finally {
      setProcessingId(null)
    }
  }

  const processUserReport = async (
    reportId: string, 
    action: 'dismiss' | 'investigate' | 'resolve',
    notes: string = ''
  ) => {
    try {
      setProcessingId(reportId)
      
      const response = await fetch('/api/admin/moderation/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          action,
          notes: notes.trim()
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Report Processed",
          description: `Report ${action}d successfully`,
          variant: "default"
        })
        
        // Update report status
        setUserReports(prev => prev.map(report => 
          report.id === reportId 
            ? { ...report, status: action === 'dismiss' ? 'dismissed' : action }
            : report
        ))
        
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Process Failed",
        description: error instanceof Error ? error.message : "Failed to process report",
        variant: "destructive"
      })
    } finally {
      setProcessingId(null)
    }
  }

  useEffect(() => {
    loadModerationData()
  }, [])

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return "text-red-600 bg-red-100"
    if (priority <= 5) return "text-orange-600 bg-orange-100"
    return "text-yellow-600 bg-yellow-100"
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'post': return MessageSquare
      case 'challenge': return FileText
      case 'user':
      case 'profile': return User
      default: return AlertTriangle
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading moderation data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Moderation</h2>
          <p className="text-muted-foreground">Review and moderate community content</p>
        </div>
        <Button onClick={loadModerationData} variant="outline">
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Moderation Queue ({moderationQueue.length})
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="w-4 h-4" />
            User Reports ({userReports.filter(r => r.status === 'pending').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          {moderationQueue.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                  <h3 className="text-lg font-semibold">All Clear!</h3>
                  <p className="text-muted-foreground">No items in the moderation queue</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            moderationQueue.map((item) => {
              const ContentIcon = getContentTypeIcon(item.contentType)
              return (
                <Card key={item.id} className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <ContentIcon className="w-5 h-5 text-orange-600" />
                        <div>
                          <CardTitle className="text-lg">
                            {item.contentType.charAt(0).toUpperCase() + item.contentType.slice(1)} Review
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getPriorityColor(item.priority)}>
                              Priority {item.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {item.aiConfidence}% confidence
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {new Date(item.autoFlaggedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Flagged for:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.flaggedReasons.map((reason, i) => (
                          <Badge key={i} variant="destructive" className="text-xs">
                            {reason.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Content Preview:</Label>
                      <div className="bg-gray-50 rounded-lg p-3 mt-1">
                        <p className="text-sm">{item.contentPreview}</p>
                        {item.contentUrl && (
                          <a 
                            href={item.contentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs mt-2 inline-block"
                          >
                            View full content →
                          </a>
                        )}
                      </div>
                    </div>

                    {item.userInfo && (
                      <div>
                        <Label className="text-sm font-medium">User:</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3" />
                          </div>
                          <span className="text-sm">{item.userInfo.name}</span>
                          <span className="text-xs text-muted-foreground">({item.userInfo.email})</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => processModerationItem(item.id, 'approve')}
                        disabled={processingId === item.id}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => processModerationItem(item.id, 'reject')}
                        disabled={processingId === item.id}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {userReports.filter(r => r.status === 'pending').length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                  <h3 className="text-lg font-semibold">No Pending Reports</h3>
                  <p className="text-muted-foreground">All user reports have been processed</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            userReports
              .filter(report => report.status === 'pending')
              .map((report) => {
                const ContentIcon = getContentTypeIcon(report.contentType)
                return (
                  <Card key={report.id} className="border-l-4 border-l-red-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <ContentIcon className="w-5 h-5 text-red-600" />
                          <div>
                            <CardTitle className="text-lg">
                              {report.contentType.charAt(0).toUpperCase() + report.contentType.slice(1)} Report
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="destructive">
                                {report.reason.replace(/_/g, ' ')}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {new Date(report.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Reported by:</Label>
                        <p className="text-sm mt-1">{report.reporterName}</p>
                      </div>

                      {report.reportedUserName && (
                        <div>
                          <Label className="text-sm font-medium">Reported user:</Label>
                          <p className="text-sm mt-1">{report.reportedUserName}</p>
                        </div>
                      )}

                      {report.details && (
                        <div>
                          <Label className="text-sm font-medium">Details:</Label>
                          <div className="bg-gray-50 rounded-lg p-3 mt-1">
                            <p className="text-sm">{report.details}</p>
                          </div>
                        </div>
                      )}

                      {report.contentPreview && (
                        <div>
                          <Label className="text-sm font-medium">Content:</Label>
                          <div className="bg-gray-50 rounded-lg p-3 mt-1">
                            <p className="text-sm">{report.contentPreview}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => processUserReport(report.id, 'dismiss')}
                          disabled={processingId === report.id}
                        >
                          Dismiss
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-orange-600 border-orange-600 hover:bg-orange-50"
                          onClick={() => processUserReport(report.id, 'investigate')}
                          disabled={processingId === report.id}
                        >
                          Investigate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => processUserReport(report.id, 'resolve')}
                          disabled={processingId === report.id}
                        >
                          Take Action
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
