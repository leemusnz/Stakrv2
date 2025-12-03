"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useMutation } from "@/hooks/use-api"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DevModeToggle } from "@/components/dev-mode-toggle"
import { ProfilePictureUpload } from "@/components/profile-picture-upload"
import { IntegrationManager } from "@/components/integrations/integration-manager"
import { User, Bell, Shield, SettingsIcon, Camera, Save, Trash2, Eye, EyeOff, Link } from "lucide-react"

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const searchParams = useSearchParams()
  const [selectedTab, setSelectedTab] = useState("profile")
  const [settings, setSettings] = useState({
    profile: {
      name: "",
      username: "",
      email: "",
      bio: "",
      avatar: "",
      location: "",
      website: "",
      categories: [] as string[],
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      challengeReminders: true,
      socialUpdates: false,
      marketingEmails: false,
      weeklyDigest: true,
      achievementAlerts: true,
      friendActivity: true,
    },
    privacy: {
      profileVisibility: "public",
      showStats: true,
      showChallenges: true,
      showFollowers: true,
      allowMessages: true,
      showOnLeaderboards: true,
    },
    account: {
      twoFactorEnabled: false,
      loginAlerts: true,
      dataDownload: false,
    },
  })
  const [showPassword, setShowPassword] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  // Use mutation hook for profile updates with automatic toast notifications
  const { loading: isSavingProfile, mutate: saveProfile } = useMutation(
    '/api/user/profile',
    {
      showSuccessToast: 'Profile updated successfully!',
      onSuccess: async () => {
        // Refresh session to get updated data
        await update()
      }
    }
  )
  
  const isLoading = isSavingProfile

  // Handle URL parameters (tab switching and success messages)
  useEffect(() => {
    const tab = searchParams.get('tab')
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    
    if (tab) {
      setSelectedTab(tab)
    }
    
    if (success === 'whoop_connected') {
      toast.success('Whoop connected successfully! 💪')
    } else if (error === 'whoop_auth_failed') {
      toast.error('Failed to connect Whoop. Please try again.')
    } else if (error === 'token_exchange_failed') {
      toast.error('Whoop authentication failed. Please check your credentials.')
    } else if (error === 'invalid_state') {
      toast.error('Security validation failed. Please try again.')
    }
  }, [searchParams])
  
  // Load user data from session
  useEffect(() => {
    if (session?.user && !dataLoaded) {
      setSettings(prev => ({
        ...prev,
        profile: {
          name: session.user.name || "",
          username: session.user.email?.split('@')[0] || "",
          email: session.user.email || "",
          bio: "Welcome to Stakr! Add your bio here.",
          avatar: session.user.image || "",
          location: "",
          website: "",
          categories: [],
        }
      }))
      setDataLoaded(true)
    }
  }, [session, dataLoaded])

  // Update settings when session changes (e.g., after avatar upload)
  useEffect(() => {
    if (session?.user?.image && settings.profile.avatar !== session.user.image) {
      console.log('🔄 Syncing avatar from session to settings:', session.user.image)
      setSettings(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          avatar: session.user.image || ""
        }
      }))
    }
  }, [session?.user?.image, settings.profile.avatar])

  const handleSave = async (section: string) => {
    try {
      if (section === 'profile') {
        // Save profile settings using mutation hook with automatic loading & toast
        await updateProfile({
          name: settings.profile.name,
          username: settings.profile.username,
          avatar: settings.profile.avatar
        })
      } else {
        // For other sections, show info toast
        toast.info(`${section} settings saved!`, {
          description: "Your preferences have been updated."
        })
        console.log(`Saving ${section} settings:`, settings[section as keyof typeof settings])
      }
    } catch (error) {
      // Error is automatically handled by useMutation with toast
      console.error('Failed to save settings:', error)
    }
  }

  const handleProfileUpdate = (field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value,
      },
    }))
  }

  const handleAvatarUpdate = async (avatarUrl: string) => {
    console.log('🔄 Settings page received avatar update:', avatarUrl)
    
    // Update local settings state immediately
    handleProfileUpdate("avatar", avatarUrl)
    
    // Refresh the session to get updated data
    try {
      console.log('🔄 Settings page updating session with:', avatarUrl)
      
      await update({
        user: {
          ...session?.user,
          image: avatarUrl,
          avatar: avatarUrl
        }
      })
      console.log('✅ Settings page session updated with new avatar')
      
      // Additional refresh after a short delay to ensure persistence
      setTimeout(async () => {
        try {
          await update()
          console.log('✅ Settings page session double-refreshed')
        } catch (err) {
          console.error('❌ Settings page double refresh failed:', err)
        }
      }, 500)
      
    } catch (error) {
      console.error('❌ Settings page failed to update session:', error)
    }
  }

  const handleNotificationToggle = (field: string) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: !prev.notifications[field as keyof typeof prev.notifications],
      },
    }))
  }

  const handlePrivacyToggle = (field: string, value?: string) => {
    setSettings((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [field]: value !== undefined ? value : !prev.privacy[field as keyof typeof prev.privacy],
      },
    }))
  }

  const handleAccountToggle = (field: string) => {
    setSettings((prev) => ({
      ...prev,
      account: {
        ...prev.account,
        [field]: !prev.account[field as keyof typeof prev.account],
      },
    }))
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your settings...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Please Sign In</h1>
          <p className="text-muted-foreground">You need to be logged in to access settings</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and privacy settings</p>
        </div>

        {/* Settings Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <ProfilePictureUpload 
                  currentAvatar={settings.profile.avatar}
                  userName={settings.profile.name}
                  size="lg"
                  showControls={true}
                  onAvatarUpdate={handleAvatarUpdate}
                />

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={settings.profile.name}
                      onChange={(e) => handleProfileUpdate("name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={settings.profile.username}
                      onChange={(e) => handleProfileUpdate("username", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => handleProfileUpdate("email", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={settings.profile.bio}
                    onChange={(e) => handleProfileUpdate("bio", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={settings.profile.location}
                      onChange={(e) => handleProfileUpdate("location", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={settings.profile.website}
                      onChange={(e) => handleProfileUpdate("website", e.target.value)}
                    />
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <Label>Interests</Label>
                  <div className="flex flex-wrap gap-2">
                    {settings.profile.categories.map((category) => (
                      <Badge key={category} variant="secondary" className="text-sm">
                        {category}
                        <button className="ml-2 text-xs hover:text-red-600">×</button>
                      </Badge>
                    ))}
                    <Button variant="outline" size="sm">
                      + Add Interest
                    </Button>
                  </div>
                </div>

                <Button onClick={() => handleSave("profile")} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Settings */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Device & App Integrations</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Connect your wearable devices and apps for automatic challenge verification
                </p>
              </CardHeader>
              <CardContent>
                <IntegrationManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={settings.notifications.emailNotifications}
                      onCheckedChange={() => handleNotificationToggle("emailNotifications")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={settings.notifications.pushNotifications}
                      onCheckedChange={() => handleNotificationToggle("pushNotifications")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="challenge-reminders">Challenge Reminders</Label>
                      <p className="text-sm text-muted-foreground">Daily reminders for active challenges</p>
                    </div>
                    <Switch
                      id="challenge-reminders"
                      checked={settings.notifications.challengeReminders}
                      onCheckedChange={() => handleNotificationToggle("challengeReminders")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="social-updates">Social Updates</Label>
                      <p className="text-sm text-muted-foreground">Updates from people you follow</p>
                    </div>
                    <Switch
                      id="social-updates"
                      checked={settings.notifications.socialUpdates}
                      onCheckedChange={() => handleNotificationToggle("socialUpdates")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing-emails">Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">Promotional emails and updates</p>
                    </div>
                    <Switch
                      id="marketing-emails"
                      checked={settings.notifications.marketingEmails}
                      onCheckedChange={() => handleNotificationToggle("marketingEmails")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weekly-digest">Weekly Digest</Label>
                      <p className="text-sm text-muted-foreground">Weekly summary of your activity</p>
                    </div>
                    <Switch
                      id="weekly-digest"
                      checked={settings.notifications.weeklyDigest}
                      onCheckedChange={() => handleNotificationToggle("weeklyDigest")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="achievement-alerts">Achievement Alerts</Label>
                      <p className="text-sm text-muted-foreground">Notifications when you earn achievements</p>
                    </div>
                    <Switch
                      id="achievement-alerts"
                      checked={settings.notifications.achievementAlerts}
                      onCheckedChange={() => handleNotificationToggle("achievementAlerts")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="friend-activity">Friend Activity</Label>
                      <p className="text-sm text-muted-foreground">Updates about your friends' challenges</p>
                    </div>
                    <Switch
                      id="friend-activity"
                      checked={settings.notifications.friendActivity}
                      onCheckedChange={() => handleNotificationToggle("friendActivity")}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave("notifications")} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-muted-foreground mb-3">Who can see your profile</p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="public"
                          name="visibility"
                          checked={settings.privacy.profileVisibility === "public"}
                          onChange={() => handlePrivacyToggle("profileVisibility", "public")}
                        />
                        <Label htmlFor="public">Public - Anyone can see your profile</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="followers"
                          name="visibility"
                          checked={settings.privacy.profileVisibility === "followers"}
                          onChange={() => handlePrivacyToggle("profileVisibility", "followers")}
                        />
                        <Label htmlFor="followers">Followers Only - Only your followers can see your profile</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="private"
                          name="visibility"
                          checked={settings.privacy.profileVisibility === "private"}
                          onChange={() => handlePrivacyToggle("profileVisibility", "private")}
                        />
                        <Label htmlFor="private">Private - Only you can see your profile</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-stats">Show Statistics</Label>
                      <p className="text-sm text-muted-foreground">Display your challenge statistics publicly</p>
                    </div>
                    <Switch
                      id="show-stats"
                      checked={settings.privacy.showStats}
                      onCheckedChange={() => handlePrivacyToggle("showStats")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-challenges">Show Challenges</Label>
                      <p className="text-sm text-muted-foreground">Display your active and completed challenges</p>
                    </div>
                    <Switch
                      id="show-challenges"
                      checked={settings.privacy.showChallenges}
                      onCheckedChange={() => handlePrivacyToggle("showChallenges")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-followers">Show Followers</Label>
                      <p className="text-sm text-muted-foreground">Display your followers and following lists</p>
                    </div>
                    <Switch
                      id="show-followers"
                      checked={settings.privacy.showFollowers}
                      onCheckedChange={() => handlePrivacyToggle("showFollowers")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-messages">Allow Messages</Label>
                      <p className="text-sm text-muted-foreground">Allow other users to send you messages</p>
                    </div>
                    <Switch
                      id="allow-messages"
                      checked={settings.privacy.allowMessages}
                      onCheckedChange={() => handlePrivacyToggle("allowMessages")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-leaderboards">Show on Leaderboards</Label>
                      <p className="text-sm text-muted-foreground">Include your profile in public leaderboards</p>
                    </div>
                    <Switch
                      id="show-leaderboards"
                      checked={settings.privacy.showOnLeaderboards}
                      onCheckedChange={() => handlePrivacyToggle("showOnLeaderboards")}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave("privacy")} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Switch
                      id="two-factor"
                      checked={settings.account.twoFactorEnabled}
                      onCheckedChange={() => handleAccountToggle("twoFactorEnabled")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="login-alerts">Login Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get notified when someone logs into your account</p>
                    </div>
                    <Switch
                      id="login-alerts"
                      checked={settings.account.loginAlerts}
                      onCheckedChange={() => handleAccountToggle("loginAlerts")}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t">
                  <h3 className="text-lg font-medium">Password</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your new password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your new password"
                      />
                    </div>
                    <Button variant="outline">
                      Update Password
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t">
                  <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                      <div>
                        <Label className="text-red-600">Download Your Data</Label>
                        <p className="text-sm text-red-500">Download a copy of all your Stakr data</p>
                      </div>
                      <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-100">
                        Download Data
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                      <div>
                        <Label className="text-red-600">Delete Account</Label>
                        <p className="text-sm text-red-500">Permanently delete your account and all data</p>
                      </div>
                      <Button variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleSave("account")} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            {/* Dev Mode Toggle */}
            {session?.user?.isDev && (
              <Card>
                <CardHeader>
                  <CardTitle>Developer Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <DevModeToggle />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
