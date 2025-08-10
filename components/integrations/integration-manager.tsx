'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Watch, 
  Smartphone, 
  Activity, 
  Brain, 
  BookOpen, 
  Code, 
  Utensils, 
  Heart, 
  RefreshCw, 
  Settings, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from 'lucide-react'
import { toast } from 'sonner'
import { getDeviceIcon, getDeviceName } from '@/lib/wearable-integrations'
import { getAppIcon, getAppName } from '@/lib/app-integrations'

interface Integration {
  device?: string
  app?: string
  enabled: boolean
  connected: boolean
  lastSync?: string
  autoSync: boolean
  privacyLevel: string
  createdAt: string
  updatedAt: string
}

interface SyncData {
  wearableDataPoints: number
  appDataPoints: number
  verificationResults: number
  verified: number
  failed: number
  errors: number
}

export function IntegrationManager() {
  const [wearableIntegrations, setWearableIntegrations] = useState<Integration[]>([])
  const [appIntegrations, setAppIntegrations] = useState<Integration[]>([])
  const [availableDevices, setAvailableDevices] = useState<string[]>([])
  const [availableApps, setAvailableApps] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncData, setSyncData] = useState<SyncData | null>(null)
  
  // Add integration state
  const [isAddingWearable, setIsAddingWearable] = useState(false)
  const [isAddingApp, setIsAddingApp] = useState(false)
  const [newIntegration, setNewIntegration] = useState({
    device: '',
    app: '',
    apiKey: '',
    clientId: '',
    accessToken: '',
    username: '',
    privacyLevel: 'standard',
    autoSync: true
  })

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    try {
      setIsLoading(true)

      // Load wearable integrations
      const wearableResponse = await fetch('/api/integrations/wearables')
      if (wearableResponse.ok) {
        const wearableData = await wearableResponse.json()
        setWearableIntegrations(wearableData.integrations || [])
        setAvailableDevices(wearableData.availableDevices || [])
      }

      // Load app integrations
      const appResponse = await fetch('/api/integrations/apps')
      if (appResponse.ok) {
        const appData = await appResponse.json()
        setAppIntegrations(appData.integrations || [])
        setAvailableApps(appData.availableApps || [])
      }

    } catch (error) {
      console.error('Failed to load integrations:', error)
      toast.error('Failed to load integrations')
    } finally {
      setIsLoading(false)
    }
  }

  const addWearableIntegration = async () => {
    try {
      setIsAddingWearable(true)

      const oauthDevices = ['strava', 'fitbit', 'google_fit']
      
      if (oauthDevices.includes(newIntegration.device)) {
        // Start OAuth flow
        const authResponse = await fetch('/api/integrations/oauth/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: newIntegration.device,
            type: 'wearable'
          })
        })

        const authData = await authResponse.json()

        if (authResponse.ok && authData.authUrl) {
          // Redirect to OAuth provider
          window.location.href = authData.authUrl
          return
        } else {
          toast.error('Failed to start OAuth flow')
          return
        }
      }

      // Non-OAuth integration (manual setup)
      const response = await fetch('/api/integrations/wearables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device: newIntegration.device,
          apiKey: newIntegration.apiKey,
          clientId: newIntegration.clientId,
          accessToken: newIntegration.accessToken,
          privacyLevel: newIntegration.privacyLevel,
          autoSync: newIntegration.autoSync
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        loadIntegrations()
        resetNewIntegration()
      } else {
        toast.error(data.error || 'Failed to add integration')
      }

    } catch (error) {
      console.error('Failed to add wearable integration:', error)
      toast.error('Failed to add integration')
    } finally {
      setIsAddingWearable(false)
    }
  }

  const addAppIntegration = async () => {
    try {
      setIsAddingApp(true)

      const oauthApps = ['spotify', 'github', 'todoist', 'myfitnesspal']
      
      if (oauthApps.includes(newIntegration.app)) {
        // Start OAuth flow
        const authResponse = await fetch('/api/integrations/oauth/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: newIntegration.app,
            type: 'app'
          })
        })

        const authData = await authResponse.json()

        if (authResponse.ok && authData.authUrl) {
          // Redirect to OAuth provider
          window.location.href = authData.authUrl
          return
        } else {
          toast.error('Failed to start OAuth flow')
          return
        }
      }

      // Non-OAuth integration (manual setup)
      const response = await fetch('/api/integrations/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app: newIntegration.app,
          apiKey: newIntegration.apiKey,
          accessToken: newIntegration.accessToken,
          username: newIntegration.username,
          privacyLevel: newIntegration.privacyLevel,
          autoSync: newIntegration.autoSync
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        loadIntegrations()
        resetNewIntegration()
      } else {
        toast.error(data.error || 'Failed to add integration')
      }

    } catch (error) {
      console.error('Failed to add app integration:', error)
      toast.error('Failed to add integration')
    } finally {
      setIsAddingApp(false)
    }
  }

  const removeIntegration = async (type: 'wearable' | 'app', identifier: string) => {
    try {
      const endpoint = type === 'wearable' 
        ? `/api/integrations/wearables?device=${identifier}`
        : `/api/integrations/apps?app=${identifier}`

      const response = await fetch(endpoint, { method: 'DELETE' })
      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        loadIntegrations()
      } else {
        toast.error(data.error || 'Failed to remove integration')
      }

    } catch (error) {
      console.error('Failed to remove integration:', error)
      toast.error('Failed to remove integration')
    }
  }

  const syncIntegrations = async () => {
    try {
      setIsSyncing(true)

      const response = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'manual_sync' })
      })

      const data = await response.json()

      if (response.ok) {
        const total = data?.summary?.total ?? 0
        setSyncData({ wearableDataPoints: 0, appDataPoints: 0, verificationResults: 0, verified: data?.summary?.successful ?? 0, failed: data?.summary?.failed ?? 0, errors: data?.summary?.failed ?? 0 })
        toast.success(`Sync completed! ${total} provider result(s)`)        
        loadIntegrations()
      } else {
        toast.error(data.error || 'Sync failed')
      }

    } catch (error) {
      console.error('Sync failed:', error)
      toast.error('Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }

  const syncSingle = async (opts: { type: 'wearable' | 'app'; provider: string }) => {
    try {
      setIsSyncing(true)
      const res = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'manual_sync', provider: opts.provider, type: opts.type })
      })
      const data = await res.json()
      if (res.ok) {
        const total = data?.summary?.total ?? 0
        toast.success(`Synced ${opts.provider}: ${total} result(s)`) 
        loadIntegrations()
      } else {
        toast.error(data.error || `Sync failed for ${opts.provider}`)
      }
    } catch (e) {
      toast.error(`Sync failed for ${opts.provider}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const resetNewIntegration = () => {
    setNewIntegration({
      device: '',
      app: '',
      apiKey: '',
      clientId: '',
      accessToken: '',
      username: '',
      privacyLevel: 'standard',
      autoSync: true
    })
  }

  const getIntegrationIcon = (type: 'wearable' | 'app', identifier: string) => {
    if (type === 'wearable') {
      return getDeviceIcon(identifier as any)
    } else {
      return getAppIcon(identifier as any)
    }
  }

  const getIntegrationName = (type: 'wearable' | 'app', identifier: string) => {
    if (type === 'wearable') {
      return getDeviceName(identifier as any)
    } else {
      return getAppName(identifier as any)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Smart Integrations</h2>
          <p className="text-muted-foreground">
            Connect wearables and apps for automatic verification
          </p>
        </div>
        <Button 
          onClick={syncIntegrations} 
          disabled={isSyncing}
          className="gap-2"
        >
          {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {isSyncing ? 'Syncing...' : 'Sync All'}
        </Button>
      </div>

      {/* Sync Results */}
      {syncData && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Last sync: {syncData.wearableDataPoints + syncData.appDataPoints} data points, {syncData.verified} verified, {syncData.failed} failed
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="wearables" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="wearables">
            <Watch className="w-4 h-4 mr-2" />
            Wearables ({wearableIntegrations.length})
          </TabsTrigger>
          <TabsTrigger value="apps">
            <Smartphone className="w-4 h-4 mr-2" />
            Apps ({appIntegrations.length})
          </TabsTrigger>
        </TabsList>

        {/* Wearables Tab */}
        <TabsContent value="wearables" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Wearable Devices</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Wearable
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Wearable Integration</DialogTitle>
                  <DialogDescription>
                    Connect your wearable device for automatic activity verification
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="device">Device Type</Label>
                    <Select 
                      value={newIntegration.device} 
                      onValueChange={(value) => setNewIntegration(prev => ({ ...prev, device: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a device" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDevices.map(device => (
                          <SelectItem key={device} value={device}>
                            {getDeviceIcon(device as any)} {getDeviceName(device as any)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="privacy">Privacy Level</Label>
                    <Select 
                      value={newIntegration.privacyLevel} 
                      onValueChange={(value) => setNewIntegration(prev => ({ ...prev, privacyLevel: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimal - Basic activity only</SelectItem>
                        <SelectItem value="standard">Standard - Activity + health metrics</SelectItem>
                        <SelectItem value="detailed">Detailed - Full data access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="auto-sync" 
                      checked={newIntegration.autoSync}
                      onCheckedChange={(checked) => setNewIntegration(prev => ({ ...prev, autoSync: checked }))}
                    />
                    <Label htmlFor="auto-sync">Enable automatic sync</Label>
                  </div>

                  <Button 
                    onClick={addWearableIntegration} 
                    disabled={!newIntegration.device || isAddingWearable}
                    className="w-full"
                  >
                    {isAddingWearable ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Add Integration
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wearableIntegrations.map((integration, index) => (
              <Card key={index} className={integration.connected ? 'border-green-200' : 'border-gray-200'}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getIntegrationIcon('wearable', integration.device!)}</span>
                      <div>
                        <CardTitle className="text-sm">{getIntegrationName('wearable', integration.device!)}</CardTitle>
                        <CardDescription className="text-xs">
                          {integration.connected ? 'Connected' : 'Disconnected'}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={integration.connected ? 'default' : 'secondary'}>
                      {integration.connected ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span>Auto Sync</span>
                    <Badge variant="outline">{integration.autoSync ? 'On' : 'Off'}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Privacy</span>
                    <Badge variant="outline">{integration.privacyLevel}</Badge>
                  </div>
                  {integration.lastSync && (
                    <div className="flex items-center justify-between text-xs">
                      <span>Last Sync</span>
                      <span className="text-muted-foreground">
                        {new Date(integration.lastSync).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncSingle({ type: 'wearable', provider: integration.device! })}
                      className="w-full gap-2 bg-transparent"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Sync now
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeIntegration('wearable', integration.device!)}
                      className="w-full gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {wearableIntegrations.length === 0 && (
            <Card className="text-center py-8">
              <CardContent>
                <Watch className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Wearables Connected</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your Apple Watch, Fitbit, or other wearables for automatic verification
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Apps Tab */}
        <TabsContent value="apps" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">App Integrations</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add App
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add App Integration</DialogTitle>
                  <DialogDescription>
                    Connect third-party apps for automatic progress tracking
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="app">App Type</Label>
                    <Select 
                      value={newIntegration.app} 
                      onValueChange={(value) => setNewIntegration(prev => ({ ...prev, app: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an app" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableApps.map(app => (
                          <SelectItem key={app} value={app}>
                            {getAppIcon(app as any)} {getAppName(app as any)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {newIntegration.app === 'duolingo' && (
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        placeholder="Your Duolingo username"
                        value={newIntegration.username}
                        onChange={(e) => setNewIntegration(prev => ({ ...prev, username: e.target.value }))}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="privacy">Privacy Level</Label>
                    <Select 
                      value={newIntegration.privacyLevel} 
                      onValueChange={(value) => setNewIntegration(prev => ({ ...prev, privacyLevel: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimal - Basic progress only</SelectItem>
                        <SelectItem value="standard">Standard - Progress + achievements</SelectItem>
                        <SelectItem value="detailed">Detailed - Full activity data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="auto-sync-app" 
                      checked={newIntegration.autoSync}
                      onCheckedChange={(checked) => setNewIntegration(prev => ({ ...prev, autoSync: checked }))}
                    />
                    <Label htmlFor="auto-sync-app">Enable automatic sync</Label>
                  </div>

                  <Button 
                    onClick={addAppIntegration} 
                    disabled={!newIntegration.app || isAddingApp}
                    className="w-full"
                  >
                    {isAddingApp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Add Integration
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appIntegrations.map((integration, index) => (
              <Card key={index} className={integration.connected ? 'border-green-200' : 'border-gray-200'}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getIntegrationIcon('app', integration.app!)}</span>
                      <div>
                        <CardTitle className="text-sm">{getIntegrationName('app', integration.app!)}</CardTitle>
                        <CardDescription className="text-xs">
                          {integration.connected ? 'Connected' : 'Disconnected'}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={integration.connected ? 'default' : 'secondary'}>
                      {integration.connected ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span>Auto Sync</span>
                    <Badge variant="outline">{integration.autoSync ? 'On' : 'Off'}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Privacy</span>
                    <Badge variant="outline">{integration.privacyLevel}</Badge>
                  </div>
                  {integration.lastSync && (
                    <div className="flex items-center justify-between text-xs">
                      <span>Last Sync</span>
                      <span className="text-muted-foreground">
                        {new Date(integration.lastSync).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncSingle({ type: 'app', provider: integration.app! })}
                      className="w-full gap-2 bg-transparent"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Sync now
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeIntegration('app', integration.app!)}
                      className="w-full gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {appIntegrations.length === 0 && (
            <Card className="text-center py-8">
              <CardContent>
                <Smartphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Apps Connected</h3>
                <p className="text-muted-foreground mb-4">
                  Connect MyFitnessPal, Duolingo, GitHub, and other apps for automatic verification
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
