'use client'

import { useState, useEffect } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  User, 
  Database, 
  Shield, 
  Settings,
  Play,
  Loader2
} from 'lucide-react'

interface TestResult {
  name: string
  success: boolean
  message: string
  details?: any
}

interface TestResults {
  timestamp: string
  tests: Record<string, TestResult>
}

export default function TestDashboardPage() {
  const { data: session, status } = useSession()
  const [testResults, setTestResults] = useState<TestResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [testCredentials, setTestCredentials] = useState({
    email: 'alex@stakr.app',
    password: 'password123'
  })

  const runTests = async (testType: string = 'all') => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/test-onboarding?test=${testType}`)
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testLogin = async () => {
    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email: testCredentials.email,
        password: testCredentials.password,
        redirect: false,
      })
      
      if (result?.error) {
        alert(`Login failed: ${result.error}`)
      } else {
        alert('Login successful!')
      }
    } catch (error) {
      alert(`Login error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testUserCreation = async () => {
    setIsLoading(true)
    try {
      const testEmail = `test-${Date.now()}@stakr.app`
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: 'testpass123',
          name: 'Test User',
          confirmPassword: 'testpass123'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`✅ Real account creation successful!\n\nEmail: ${testEmail}\nUser ID: ${data.user.id}\nCredits: $${data.user.credits}\nTrust Score: ${data.user.trustScore}`)
      } else {
        alert(`❌ Account creation failed: ${data.message}`)
      }
    } catch (error) {
      alert(`❌ Account creation test error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "Pass" : "Fail"}
      </Badge>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Stakr Testing Dashboard</h1>
        <p className="text-muted-foreground">
          Test onboarding, authentication, and database connectivity
        </p>
      </div>

      <Tabs defaultValue="system" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="system">System Tests</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="session">Session Info</TabsTrigger>
          <TabsTrigger value="manual">Manual Tests</TabsTrigger>
        </TabsList>

        {/* System Tests Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">System Status</h2>
            <Button 
              onClick={() => runTests()} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Tests
            </Button>
          </div>

          {testResults && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(testResults.tests).map(([key, test]) => (
                <Card key={key}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{test.name}</CardTitle>
                      {getStatusIcon(test.success)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      {getStatusBadge(test.success)}
                    </div>
                    <p className="text-sm">{test.message}</p>
                    {test.details && (
                      <details className="text-xs text-muted-foreground">
                        <summary className="cursor-pointer">Details</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {testResults && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Last Updated:</strong> {new Date(testResults.timestamp).toLocaleString()}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Authentication Tab */}
        <TabsContent value="auth" className="space-y-4">
          <h2 className="text-xl font-semibold">Authentication Testing</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Demo Credentials
                </CardTitle>
                <CardDescription>
                  Test authentication with demo accounts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-email">Email</Label>
                  <Input
                    id="test-email"
                    type="email"
                    value={testCredentials.email}
                    onChange={(e) => setTestCredentials(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-password">Password</Label>
                  <Input
                    id="test-password"
                    type="password"
                    value={testCredentials.password}
                    onChange={(e) => setTestCredentials(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <Button onClick={testLogin} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Test Login
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Demo Accounts</CardTitle>
                <CardDescription>
                  Use these credentials for testing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-muted rounded">
                  <p className="font-medium">Admin Account</p>
                  <p className="text-sm text-muted-foreground">alex@stakr.app</p>
                  <p className="text-sm text-muted-foreground">password123</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="font-medium">Regular User</p>
                  <p className="text-sm text-muted-foreground">demo@stakr.app</p>
                  <p className="text-sm text-muted-foreground">demo123</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Session Info Tab */}
        <TabsContent value="session" className="space-y-4">
          <h2 className="text-xl font-semibold">Current Session</h2>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Session Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Authentication Status</span>
                <Badge variant={session ? "default" : "secondary"}>
                  {status === 'loading' ? 'Loading...' : session ? 'Authenticated' : 'Not Authenticated'}
                </Badge>
              </div>
              
              {session && (
                <div className="space-y-2">
                  <Separator />
                  <h4 className="font-medium">User Information</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>ID:</span>
                      <span className="font-mono">{session.user.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span>{session.user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span>{session.user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Credits:</span>
                      <span>${session.user.credits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trust Score:</span>
                      <span>{session.user.trustScore}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verification:</span>
                      <Badge variant="outline">{session.user.verificationTier}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Admin:</span>
                      <Badge variant={session.user.isAdmin ? "default" : "secondary"}>
                        {session.user.isAdmin ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                {session ? (
                  <Button variant="outline" onClick={() => signOut()}>
                    Sign Out
                  </Button>
                ) : (
                  <Button onClick={() => signIn()}>
                    Sign In
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Tests Tab */}
        <TabsContent value="manual" className="space-y-4">
          <h2 className="text-xl font-semibold">Manual Testing</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Creation Test</CardTitle>
                <CardDescription>
                  Test the user creation process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={testUserCreation} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Test User Creation
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Onboarding Flow</CardTitle>
                <CardDescription>
                  Test the complete onboarding process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <a href="/onboarding">
                    <Play className="h-4 w-4 mr-2" />
                    Start Onboarding
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Test Checklist</CardTitle>
              <CardDescription>
                Manual testing steps to verify functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded border border-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">1. Environment Setup</p>
                    <p className="text-sm text-muted-foreground">
                      Verify DATABASE_URL and NEXTAUTH_SECRET are configured
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded border border-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">2. Database Connection</p>
                    <p className="text-sm text-muted-foreground">
                      Test database connectivity and table creation
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded border border-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">3. Authentication Flow</p>
                    <p className="text-sm text-muted-foreground">
                      Test login with demo credentials
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded border border-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">4. Onboarding Process</p>
                    <p className="text-sm text-muted-foreground">
                      Complete the full onboarding flow
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded border border-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">5. Session Management</p>
                    <p className="text-sm text-muted-foreground">
                      Verify session persistence across page reloads
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 