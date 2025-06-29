"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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
import { User, Bell, Shield, SettingsIcon, Camera, Save, Trash2, Eye, EyeOff } from "lucide-react"

export default function SettingsPage() {
  const { data: session, status } = useSession()
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
  const [isLoading, setIsLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

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

  const handleSave = async (section: string) => {
    setIsLoading(true)
    try {
      // TODO: Implement real API call to save settings
      console.log(`Saving ${section} settings:`, settings[section as keyof typeof settings])
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // For now, just simulate success
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsLoading(false)
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
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
                <div className="flex items-center gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={settings.profile.avatar || "/placeholder.svg"} alt={settings.profile.name} />
                    <AvatarFallback className="text-xl bg-primary text-white">
                      {settings.profile.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                      <Camera className="w-4 h-4" />
                      Change Photo
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      Remove Photo
                    </Button>
                  </div>
                </div>

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
                      <p className="text-sm text-muted-foreground">Appear on public leaderboards and rankings</p>
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
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter current password"
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

                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" placeholder="Enter new password" />
                  </div>

                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" placeholder="Confirm new password" />
                  </div>

                  <Button variant="outline" className="bg-transparent">
                    Update Password
                  </Button>
                </div>

                <div className="border-t pt-6 space-y-4">
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
                      <p className="text-sm text-muted-foreground">Get notified of new login attempts</p>
                    </div>
                    <Switch
                      id="login-alerts"
                      checked={settings.account.loginAlerts}
                      onCheckedChange={() => handleAccountToggle("loginAlerts")}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave("account")} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-red-600">Download Your Data</h3>
                    <p className="text-sm text-muted-foreground">Download a copy of all your data</p>
                  </div>
                  <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent">
                    Download Data
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-red-600">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Developer Mode Toggle (only shows if user has dev access) */}
        <DevModeToggle className="mt-6" />
      </div>
    </div>
  )
}
