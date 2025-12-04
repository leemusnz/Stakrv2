"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { notFound } from "next/navigation"

// Production guard - only allow in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  notFound()
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, Database, Save, RefreshCw } from "lucide-react"

export default function TestAvatarPage() {
  const { data: session, status } = useSession()
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runPersistenceTest = async () => {
    setIsLoading(true)
    setTestResults(null)

    try {
      const response = await fetch('/api/test-avatar-persistence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-muted-foreground">Please sign in to test avatar persistence</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Avatar Persistence Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                This test verifies that avatars are properly saved to and loaded from the database,
                which is essential for avatar persistence across logout/login cycles.
              </p>
              <div className="text-sm">
                <p><strong>User:</strong> {session.user.email}</p>
                <p><strong>Test:</strong> Save → Load → Verify Match</p>
              </div>
            </div>

            <Button 
              onClick={runPersistenceTest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Running Test...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Persistence Test
                </>
              )}
            </Button>

            {testResults && (
              <div className="space-y-4">
                <Alert variant={testResults.success ? "default" : "destructive"}>
                  {testResults.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    <strong>Test Result:</strong> {testResults.success ? 'PASSED' : 'FAILED'}
                  </AlertDescription>
                </Alert>

                {testResults.results && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          {testResults.results.steps.save ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <p className="text-sm font-medium">Save</p>
                        <Badge variant={testResults.results.steps.save ? "default" : "destructive"}>
                          {testResults.results.steps.save ? "PASS" : "FAIL"}
                        </Badge>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          {testResults.results.steps.load ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <p className="text-sm font-medium">Load</p>
                        <Badge variant={testResults.results.steps.load ? "default" : "destructive"}>
                          {testResults.results.steps.load ? "PASS" : "FAIL"}
                        </Badge>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          {testResults.results.steps.match ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <p className="text-sm font-medium">Match</p>
                        <Badge variant={testResults.results.steps.match ? "default" : "destructive"}>
                          {testResults.results.steps.match ? "PASS" : "FAIL"}
                        </Badge>
                      </div>
                    </div>

                    {testResults.results.databaseAvatar && (
                      <div className="text-sm">
                        <p><strong>Database Avatar:</strong></p>
                        <p className="text-muted-foreground break-all">
                          {testResults.results.databaseAvatar}
                        </p>
                      </div>
                    )}

                    {testResults.results.error && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Error:</strong> {testResults.results.error}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="text-xs text-muted-foreground">
                      <p><strong>Timestamp:</strong> {testResults.results.timestamp}</p>
                    </div>
                  </div>
                )}

                {testResults.error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Test Error:</strong> {testResults.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
