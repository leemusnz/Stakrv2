"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { DevModeToggle, useDevMode } from "@/components/dev-mode-toggle"
import { AvatarTestPanel } from "@/components/avatar-test-panel"
import { AIAnalyzerControls } from "@/components/dev-tools/ai-analyzer-controls"
import {
  Bug,
  Database,
  Zap,
  RefreshCw,
  TestTube,
  Settings,
  Code,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Play,
  Server,
  Terminal,
  FileText,
  Users,
  Lock,
  User,
  Brain
} from "lucide-react"

export default function DevToolsPage() {
  const { data: session, status } = useSession()
  const { hasDevAccess, isDevModeEnabled } = useDevMode()
  const [activeTab, setActiveTab] = useState("overview")
  const [testResults, setTestResults] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [systemData, setSystemData] = useState<any>(null)

  const runTest = async (testType: string, params?: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: testType, params })
      })
      
      const data = await response.json()
      
      setTestResults(prev => ({
        ...prev,
        [testType]: {
          success: data.success,
          result: data.result,
          timestamp: new Date().toISOString()
        }
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testType]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }))
    } finally {
      setLoading(false)
    }
  }

  const loadSystemData = async () => {
    try {
      const response = await fetch('/api/admin/system')
      const data = await response.json()
      
      if (data.success) {
        setSystemData(data.system)
      }
    } catch (error) {
      console.error('Failed to load system data:', error)
    }
  }

  useEffect(() => {
    if (hasDevAccess && isDevModeEnabled) {
      loadSystemData()
    }
  }, [hasDevAccess, isDevModeEnabled])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dev tools...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Lock className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-muted-foreground">Please sign in to access developer tools</p>
        </div>
      </div>
    )
  }

  if (!hasDevAccess) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-6">
          <Bug className="w-16 h-16 mx-auto text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold">Developer Access Required</h1>
            <p className="text-muted-foreground">Contact an administrator to grant developer access</p>
          </div>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Current Status:</strong> No developer access</p>
                <p><strong>How to get access:</strong></p>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Contact a platform administrator</li>
                  <li>Request developer access for your account</li>
                  <li>Once granted, you can enable dev mode in Settings</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!isDevModeEnabled) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-6">
          <Settings className="w-16 h-16 mx-auto text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold">Enable Developer Mode</h1>
            <p className="text-muted-foreground">Developer mode is currently disabled</p>
          </div>
          
          <div className="max-w-md mx-auto">
            <DevModeToggle />
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>You have developer access!</strong></p>
                <p>Enable dev mode above to access all developer tools and testing features.</p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🛠️ Developer Tools</h1>
            <p className="text-muted-foreground">Testing, debugging, and system monitoring tools</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Dev Mode Active
            </Badge>
            <Button variant="outline" onClick={loadSystemData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ai-analyzer">AI Analyzer</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="api">API Testing</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="users">User Tools</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="avatar">Avatar</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => runTest('test_database')}
                    disabled={loading}
                    className="w-full justify-start"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Test Database Connection
                  </Button>
                  
                  <Button 
                    onClick={() => runTest('clear_cache')}
                    disabled={loading}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear System Cache
                  </Button>
                  
                  <Button 
                    onClick={() => runTest('toggle_debug', { enabled: true })}
                    disabled={loading}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Toggle Debug Mode
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="w-5 h-5" />
                    Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(testResults).length === 0 ? (
                    <div className="text-center py-8">
                      <TestTube className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No tests run yet</p>
                      <p className="text-sm text-muted-foreground">Click a test button to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(testResults).map(([test, result]: [string, any]) => (
                        <div key={test} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {result.success ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                            <div>
                              <p className="font-medium">{test.replace('_', ' ')}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(result.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant={result.success ? "default" : "destructive"}>
                            {result.success ? "Passed" : "Failed"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* AI Analyzer Quick Access */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-500" />
                    AI Analyzer Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Configure and test the AI Challenge Analyzer with different challenge types and settings.
                    </p>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        onClick={() => setActiveTab('ai-analyzer')}
                        variant="outline"
                        className="justify-start"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Open AI Analyzer Dev Tools
                      </Button>
                      
                      <Button 
                        onClick={() => window.open('/create-challenge?preset=physical_skills&context=90&skip_obvious=true', '_blank')}
                        variant="ghost"
                        size="sm"
                        className="justify-start text-xs"
                      >
                        🤸 Test Physical Skills Mode
                      </Button>
                      
                      <Button 
                        onClick={() => window.open('/create-challenge?analyzer_debug=true', '_blank')}
                        variant="ghost"
                        size="sm"
                        className="justify-start text-xs"
                      >
                        🔍 Test Debug Mode
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            {systemData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <Database className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <p className="font-medium">Database</p>
                      <p className="text-sm text-muted-foreground">{systemData.database.status}</p>
                      <p className="text-xs text-green-600">
                        {systemData.database.responseTime || 35}ms
                      </p>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <Server className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                      <p className="font-medium">Memory</p>
                      <p className="text-sm text-muted-foreground">
                        {systemData.performance.memoryUsage || 45}%
                      </p>
                      <Progress value={systemData.performance.memoryUsage || 45} className="mt-2 h-2" />
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                      <p className="font-medium">API Response</p>
                      <p className="text-sm text-muted-foreground">
                        {systemData.performance.apiResponseTime || 142}ms
                      </p>
                      <p className="text-xs text-green-600">Excellent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AI Analyzer Tools */}
          <TabsContent value="ai-analyzer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-500" />
                  AI Challenge Analyzer Dev Tools
                </CardTitle>
                <p className="text-muted-foreground">
                  Comprehensive testing and tuning controls for the AI Challenge Analyzer. 
                  Configure behavior, test different challenge types, and fine-tune analysis quality.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Alert>
                    <Brain className="h-4 w-4" />
                    <AlertDescription>
                      These settings will be applied to all challenge analysis requests when dev mode is active.
                      Changes are saved to localStorage and can be overridden with URL parameters.
                    </AlertDescription>
                  </Alert>
                  
                  <AIAnalyzerControls
                    onSettingsChange={(settings) => {
                      console.log('🛠️ Dev Tools: Analyzer settings updated:', settings)
                      // Settings are automatically saved to localStorage by the component
                    }}
                    onTestAnalyzer={(testInput) => {
                      console.log('🧪 Dev Tools: Testing analyzer with:', testInput)
                      // Could trigger a test analysis here
                    }}
                    currentChallenge={null}
                  />
                  
                  <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Quick Testing URLs</h3>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="font-medium">Physical Skills (Handstands):</Label>
                          <Input 
                            readOnly 
                            value="/create-challenge?preset=physical_skills&context=90&skip_obvious=true"
                            className="text-xs mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label className="font-medium">Habits (Daily Tasks):</Label>
                          <Input 
                            readOnly 
                            value="/create-challenge?preset=habits&context=85&verbosity=40"
                            className="text-xs mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label className="font-medium">Debug Mode (Verbose):</Label>
                          <Input 
                            readOnly 
                            value="/create-challenge?analyzer_debug=true"
                            className="text-xs mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label className="font-medium">Quick Mode (Minimal):</Label>
                          <Input 
                            readOnly 
                            value="/create-challenge?analyzer_quick=true"
                            className="text-xs mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Tools */}
          <TabsContent value="database" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Testing Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => runTest('test_database')}
                    disabled={loading}
                    variant="outline"
                    className="h-20 flex-col"
                  >
                    <Database className="w-6 h-6 mb-2" />
                    Test Connection
                  </Button>
                  
                  <Button 
                    onClick={() => window.location.href = '/api/test-db'}
                    variant="outline"
                    className="h-20 flex-col"
                  >
                    <FileText className="w-6 h-6 mb-2" />
                    Schema Info
                  </Button>
                </div>

                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    <p><strong>Database Tools Available:</strong></p>
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                      <li>Connection testing and health checks</li>
                      <li>Schema validation and table information</li>
                      <li>Query performance monitoring</li>
                      <li>Demo vs real data switching</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Testing */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  API Testing Console
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => window.location.href = '/api/user/dashboard'}
                    variant="outline"
                    className="h-16 flex-col"
                  >
                    <Users className="w-6 h-6 mb-1" />
                    <span className="text-xs">User Dashboard</span>
                  </Button>
                  
                  <Button 
                    onClick={() => window.location.href = '/api/admin/analytics'}
                    variant="outline"
                    className="h-16 flex-col"
                  >
                    <Monitor className="w-6 h-6 mb-1" />
                    <span className="text-xs">Analytics API</span>
                  </Button>
                  
                  <Button 
                    onClick={() => window.location.href = '/api/admin/system'}
                    variant="outline"
                    className="h-16 flex-col"
                  >
                    <Server className="w-6 h-6 mb-1" />
                    <span className="text-xs">System API</span>
                  </Button>
                </div>

                <Alert>
                  <Terminal className="h-4 w-4" />
                  <AlertDescription>
                    <p><strong>API Testing Features:</strong></p>
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                      <li>Direct API endpoint testing</li>
                      <li>Response time monitoring</li>
                      <li>Error tracking and debugging</li>
                      <li>Demo data vs real data comparison</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tools */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  System Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Cache Management</h4>
                    <Button 
                      onClick={() => runTest('clear_cache')}
                      disabled={loading}
                      variant="outline"
                      className="w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Clear Cache
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Debug Settings</h4>
                    <Button 
                      onClick={() => runTest('toggle_debug', { enabled: true })}
                      disabled={loading}
                      variant="outline"
                      className="w-full"
                    >
                      <Bug className="w-4 h-4 mr-2" />
                      Toggle Debug Mode
                    </Button>
                  </div>
                </div>

                {systemData && (
                  <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-3">System Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Environment:</span>
                        <span className="ml-2 font-mono">{systemData.systemHealth.environment}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Version:</span>
                        <span className="ml-2 font-mono">{systemData.systemHealth.version}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Uptime:</span>
                        <span className="ml-2 font-mono">{systemData.systemHealth.uptime || 99.8}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <span className="ml-2 font-mono text-green-600">{systemData.systemHealth.status}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Tools */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Development Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p><strong>Current Session:</strong></p>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>User ID: <code className="bg-muted px-1 rounded">{session.user.id}</code></p>
                      <p>Email: <code className="bg-muted px-1 rounded">{session.user.email}</code></p>
                      <p>Dev Access: <Badge className="ml-1">{hasDevAccess ? 'Yes' : 'No'}</Badge></p>
                      <p>Dev Mode: <Badge className="ml-1">{isDevModeEnabled ? 'Enabled' : 'Disabled'}</Badge></p>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h4 className="font-medium">Available Demo Accounts</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="p-3 border rounded bg-blue-50">
                      <p className="font-medium">Admin Demo Account</p>
                      <p>Email: <code>alex@stakr.app</code> | Password: <code>password123</code></p>
                      <p className="text-muted-foreground">Has full admin access and dev tools</p>
                    </div>
                    <div className="p-3 border rounded bg-green-50">
                      <p className="font-medium">Regular Demo Account</p>
                      <p>Email: <code>demo@stakr.app</code> | Password: <code>demo123</code></p>
                      <p className="text-muted-foreground">Standard user experience with mock data</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring */}
          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Real-Time Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                {systemData ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{systemData.performance.memoryUsage || 45}%</div>
                        <p className="text-sm text-muted-foreground">Memory Usage</p>
                        <Progress value={systemData.performance.memoryUsage || 45} className="mt-2" />
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{systemData.performance.apiResponseTime || 142}ms</div>
                        <p className="text-sm text-muted-foreground">API Response</p>
                        <Badge className="mt-2 bg-green-500">Excellent</Badge>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{systemData.performance.activeConnections || 234}</div>
                        <p className="text-sm text-muted-foreground">Active Connections</p>
                        <Badge className="mt-2" variant="outline">Normal</Badge>
                      </div>
                    </div>

                    {systemData.logs && (
                      <div>
                        <h4 className="font-medium mb-3">Recent System Logs</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {systemData.logs.slice(0, 10).map((log: any) => (
                            <div key={log.id} className="flex items-center gap-3 p-2 border rounded text-sm font-mono">
                              <Badge variant={
                                log.level === 'error' ? 'destructive' :
                                log.level === 'warning' ? 'secondary' :
                                'outline'
                              }>
                                {log.level}
                              </Badge>
                              <span className="text-muted-foreground">
                                [{new Date(log.timestamp).toLocaleTimeString()}]
                              </span>
                              <span className="flex-1">{log.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Monitor className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Loading system monitoring data...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Avatar Test Panel */}
          <TabsContent value="avatar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Avatar Testing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AvatarTestPanel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dev Mode Control */}
        <DevModeToggle className="mt-8" />
      </div>
    </div>
  )
}
