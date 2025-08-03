"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Upload, 
  Shield, 
  RefreshCw,
  Image,
  Settings,
  Zap,
  Database
} from "lucide-react"

interface TestResult {
  timestamp: string
  userId: string
  userEmail: string
  testType: string
  results: any
}

interface TestStatus {
  running: boolean
  completed: boolean
  success: boolean
  error?: string
  progress: number
}

export function AvatarTestPanel() {
  const { data: session } = useSession()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [testStatus, setTestStatus] = useState<TestStatus>({
    running: false,
    completed: false,
    success: false,
    progress: 0
  })

  const testTypes = [
    { id: 'upload_test', name: 'Upload Test', icon: Upload, description: 'Test avatar upload functionality' },
    { id: 'moderation_test', name: 'Moderation Test', icon: Shield, description: 'Test AI moderation system' },
    { id: 'session_update_test', name: 'Session Update Test', icon: Settings, description: 'Test session update functionality' },
    { id: 'proxy_test', name: 'Image Proxy Test', icon: Image, description: 'Test image proxy functionality' },
    { id: 'full_pipeline_test', name: 'Full Pipeline Test', icon: Zap, description: 'Test complete avatar pipeline' },
    { id: 'persistence_test', name: 'Persistence Test', icon: Database, description: 'Test avatar persistence after logout/login' }
  ]

  const runTest = async (testType: string) => {
    if (!session?.user?.id) {
      alert('Please log in to run tests')
      return
    }

    setTestStatus({
      running: true,
      completed: false,
      success: false,
      progress: 0
    })

    try {
      console.log(`🧪 Running ${testType}...`)
      
      const response = await fetch('/api/test-avatar-moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType })
      })

      if (response.ok) {
        const result = await response.json()
        setTestResults(prev => [result, ...prev])
        setTestStatus({
          running: false,
          completed: true,
          success: true,
          progress: 100
        })
        console.log(`✅ ${testType} completed successfully`)
      } else {
        const error = await response.json()
        setTestStatus({
          running: false,
          completed: true,
          success: false,
          error: error.error || 'Test failed',
          progress: 100
        })
        console.error(`❌ ${testType} failed:`, error)
      }
    } catch (error) {
      setTestStatus({
        running: false,
        completed: true,
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        progress: 100
      })
      console.error(`❌ ${testType} error:`, error)
    }
  }

  const runAllTests = async () => {
    if (!session?.user?.id) {
      alert('Please log in to run tests')
      return
    }

    setTestStatus({
      running: true,
      completed: false,
      success: false,
      progress: 0
    })

    const results: TestResult[] = []
    
    for (let i = 0; i < testTypes.length; i++) {
      const testType = testTypes[i]
      setTestStatus(prev => ({ ...prev, progress: (i / testTypes.length) * 100 }))
      
      try {
        console.log(`🧪 Running ${testType.name}...`)
        
        const response = await fetch('/api/test-avatar-moderation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testType: testType.id })
        })

        if (response.ok) {
          const result = await response.json()
          results.push(result)
          console.log(`✅ ${testType.name} completed`)
        } else {
          const error = await response.json()
          console.error(`❌ ${testType.name} failed:`, error)
        }
      } catch (error) {
        console.error(`❌ ${testType.name} error:`, error)
      }
    }

    setTestResults(prev => [...results, ...prev])
    setTestStatus({
      running: false,
      completed: true,
      success: results.length === testTypes.length,
      progress: 100
    })
  }

  const renderTestResult = (result: TestResult) => {
    const testType = testTypes.find(t => t.id === result.testType)
    const Icon = testType?.icon || AlertCircle

    const getResultColor = () => {
      if (result.testType === 'upload_test') {
        return result.results.uploadSuccess ? 'default' : 'destructive'
      }
      if (result.testType === 'moderation_test') {
        return result.results.moderationSuccess ? 'default' : 'destructive'
      }
      if (result.testType === 'session_update_test') {
        return result.results.sessionUpdateSuccess ? 'default' : 'destructive'
      }
      if (result.testType === 'proxy_test') {
        return result.results.proxySuccess ? 'default' : 'destructive'
      }
      if (result.testType === 'full_pipeline_test') {
        return result.results.pipelineSuccess ? 'default' : 'destructive'
      }
      if (result.testType === 'persistence_test') {
        return result.results.persistenceSuccess ? 'default' : 'destructive'
      }
      return 'default'
    }

    const getResultDetails = () => {
      switch (result.testType) {
        case 'upload_test':
          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Upload:</span>
                <Badge variant={result.results.uploadSuccess ? 'default' : 'destructive'}>
                  {result.results.uploadSuccess ? 'Success' : 'Failed'}
                </Badge>
              </div>
              {result.results.fileUrl && (
                <div className="text-xs text-muted-foreground">
                  File URL: {result.results.fileUrl.substring(0, 50)}...
                </div>
              )}
              {result.results.uploadTime > 0 && (
                <div className="text-xs text-muted-foreground">
                  Upload time: {result.results.uploadTime}ms
                </div>
              )}
              {result.results.error && (
                <div className="text-xs text-red-600">
                  Error: {result.results.error}
                </div>
              )}
            </div>
          )

        case 'moderation_test':
          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Moderation:</span>
                <Badge variant={result.results.moderationSuccess ? 'default' : 'destructive'}>
                  {result.results.moderationSuccess ? 'Success' : 'Failed'}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="font-medium">Safe Image:</span>
                  <Badge variant={result.results.testImages.safe.passed ? 'default' : 'destructive'} className="ml-1">
                    {result.results.testImages.safe.passed ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Inappropriate:</span>
                  <Badge variant={result.results.testImages.inappropriate.passed ? 'default' : 'destructive'} className="ml-1">
                    {result.results.testImages.inappropriate.passed ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Violence:</span>
                  <Badge variant={result.results.testImages.violence.passed ? 'default' : 'destructive'} className="ml-1">
                    {result.results.testImages.violence.passed ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
              </div>
            </div>
          )

        case 'session_update_test':
          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Session Update:</span>
                <Badge variant={result.results.sessionUpdateSuccess ? 'default' : 'destructive'}>
                  {result.results.sessionUpdateSuccess ? 'Success' : 'Failed'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Profile Update:</span>
                <Badge variant={result.results.profileUpdateSuccess ? 'default' : 'destructive'}>
                  {result.results.profileUpdateSuccess ? 'Success' : 'Failed'}
                </Badge>
              </div>
              {result.results.error && (
                <div className="text-xs text-red-600">
                  Error: {result.results.error}
                </div>
              )}
            </div>
          )

        case 'proxy_test':
          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Image Proxy:</span>
                <Badge variant={result.results.proxySuccess ? 'default' : 'destructive'}>
                  {result.results.proxySuccess ? 'Success' : 'Failed'}
                </Badge>
              </div>
              {result.results.responseTime > 0 && (
                <div className="text-xs text-muted-foreground">
                  Response time: {result.results.responseTime}ms
                </div>
              )}
              {result.results.error && (
                <div className="text-xs text-red-600">
                  Error: {result.results.error}
                </div>
              )}
            </div>
          )

        case 'full_pipeline_test':
          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Full Pipeline:</span>
                <Badge variant={result.results.pipelineSuccess ? 'default' : 'destructive'}>
                  {result.results.pipelineSuccess ? 'Success' : 'Failed'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium">Upload:</span>
                  <Badge variant={result.results.steps.upload ? 'default' : 'destructive'} className="ml-1">
                    {result.results.steps.upload ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Moderation:</span>
                  <Badge variant={result.results.steps.moderation ? 'default' : 'destructive'} className="ml-1">
                    {result.results.steps.moderation ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Session Update:</span>
                  <Badge variant={result.results.steps.sessionUpdate ? 'default' : 'destructive'} className="ml-1">
                    {result.results.steps.sessionUpdate ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Proxy:</span>
                  <Badge variant={result.results.steps.proxy ? 'default' : 'destructive'} className="ml-1">
                    {result.results.steps.proxy ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
              </div>
              {result.results.totalTime > 0 && (
                <div className="text-xs text-muted-foreground">
                  Total time: {result.results.totalTime}ms
                </div>
              )}
              {result.results.errors.length > 0 && (
                <div className="text-xs text-red-600">
                  Errors: {result.results.errors.join(', ')}
                </div>
              )}
            </div>
          )

        case 'persistence_test':
          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Persistence:</span>
                <Badge variant={result.results.persistenceSuccess ? 'default' : 'destructive'}>
                  {result.results.persistenceSuccess ? 'Success' : 'Failed'}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="font-medium">Save:</span>
                  <Badge variant={result.results.steps.save ? 'default' : 'destructive'} className="ml-1">
                    {result.results.steps.save ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Load:</span>
                  <Badge variant={result.results.steps.load ? 'default' : 'destructive'} className="ml-1">
                    {result.results.steps.load ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Match:</span>
                  <Badge variant={result.results.steps.match ? 'default' : 'destructive'} className="ml-1">
                    {result.results.steps.match ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
              </div>
              {result.results.databaseAvatar && (
                <div className="text-xs text-muted-foreground">
                  Database Avatar: {result.results.databaseAvatar.substring(0, 50)}...
                </div>
              )}
              {result.results.error && (
                <div className="text-xs text-red-600">
                  Error: {result.results.error}
                </div>
              )}
            </div>
          )

        default:
          return <div className="text-xs text-muted-foreground">No details available</div>
      }
    }

    return (
      <Card key={`${result.testType}-${result.timestamp}`} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <CardTitle className="text-sm">{testType?.name || result.testType}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getResultColor()}>
                {getResultColor() === 'default' ? 'PASS' : 'FAIL'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(result.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {getResultDetails()}
        </CardContent>
      </Card>
    )
  }

  if (!session?.user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Avatar Test Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please log in to run avatar tests.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Avatar System Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          {testStatus.running && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Running tests...</span>
              </div>
              <Progress value={testStatus.progress} className="w-full" />
            </div>
          )}

          {/* Test Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={runAllTests}
              disabled={testStatus.running}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Run All Tests
            </Button>
            
            {testTypes.map((test) => (
              <Button
                key={test.id}
                onClick={() => runTest(test.id)}
                disabled={testStatus.running}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <test.icon className="w-4 h-4" />
                {test.name}
              </Button>
            ))}
          </div>

          {/* Status */}
          {testStatus.completed && (
            <div className="flex items-center gap-2">
              {testStatus.success ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm">
                {testStatus.success ? 'Tests completed successfully' : 'Tests completed with errors'}
              </span>
              {testStatus.error && (
                <span className="text-sm text-red-600">: {testStatus.error}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Test Results ({testResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map(renderTestResult)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 