"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Users,
  Trophy,
  DollarSign,
  AlertTriangle,
  Bell,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { useNotifications } from "@/components/notifications/notification-provider"

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalChallenges: number
  activeChallenges: number
  totalRevenue: number
  monthlyRevenue: number
  pendingVerifications: number
  reportedContent: number
}

interface User {
  id: string
  name: string
  email: string
  joinDate: string
  status: "active" | "suspended" | "pending"
  totalStaked: number
  challengesCompleted: number
}

interface Challenge {
  id: string
  title: string
  creator: string
  participants: number
  totalPot: number
  status: "active" | "completed" | "pending" | "suspended"
  createdAt: string
}

export default function AdminDashboard() {
  const { addNotification } = useNotifications()
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 12847,
    activeUsers: 8934,
    totalChallenges: 1247,
    activeChallenges: 342,
    totalRevenue: 284750,
    monthlyRevenue: 45230,
    pendingVerifications: 23,
    reportedContent: 5,
  })

  const [users] = useState<User[]>([
    {
      id: "1",
      name: "Alex Starr",
      email: "alex@example.com",
      joinDate: "2024-01-15",
      status: "active",
      totalStaked: 1250,
      challengesCompleted: 12,
    },
    {
      id: "2",
      name: "Sarah Chen",
      email: "sarah@example.com",
      joinDate: "2024-02-03",
      status: "active",
      totalStaked: 890,
      challengesCompleted: 8,
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike@example.com",
      joinDate: "2024-01-28",
      status: "suspended",
      totalStaked: 0,
      challengesCompleted: 3,
    },
  ])

  const [challenges] = useState<Challenge[]>([
    {
      id: "1",
      title: "10K Steps Daily",
      creator: "FitnessGuru",
      participants: 567,
      totalPot: 12450,
      status: "active",
      createdAt: "2024-01-10",
    },
    {
      id: "2",
      title: "Morning Meditation Streak",
      creator: "ZenMaster",
      participants: 234,
      totalPot: 5670,
      status: "active",
      createdAt: "2024-01-15",
    },
    {
      id: "3",
      title: "No Social Media",
      creator: "DigitalDetox",
      participants: 89,
      totalPot: 2340,
      status: "pending",
      createdAt: "2024-01-20",
    },
  ])

  const sendTestNotification = () => {
    addNotification({
      type: "system",
      title: "Test Notification",
      message: "This is a test notification from the admin dashboard",
    })
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, challenges, and platform settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={sendTestNotification} size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Test Notification
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{stats.activeUsers.toLocaleString()} active users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeChallenges}</div>
                <p className="text-xs text-muted-foreground">{stats.totalChallenges} total challenges</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">${stats.totalRevenue.toLocaleString()} total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingVerifications + stats.reportedContent}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingVerifications} verifications, {stats.reportedContent} reports
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent User Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { user: "Alex Starr", action: "Completed challenge verification", time: "2 minutes ago" },
                  { user: "Sarah Chen", action: "Joined new challenge", time: "15 minutes ago" },
                  { user: "Mike Johnson", action: "Account suspended", time: "1 hour ago" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{activity.user}</p>
                      <p className="text-sm text-muted-foreground">{activity.action}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>API Response Time</span>
                  <Badge variant="secondary">142ms</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Database Status</span>
                  <Badge className="bg-green-500">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Payment Gateway</span>
                  <Badge className="bg-green-500">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Storage Usage</span>
                  <Badge variant="outline">67%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Input placeholder="Search users..." className="w-64" />
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-primary">{user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">${user.totalStaked}</p>
                        <p className="text-xs text-muted-foreground">{user.challengesCompleted} challenges</p>
                      </div>
                      <Badge
                        variant={
                          user.status === "active"
                            ? "default"
                            : user.status === "suspended"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {user.status}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Input placeholder="Search challenges..." className="w-64" />
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Challenge
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Challenge Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {challenges.map((challenge) => (
                  <div key={challenge.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{challenge.title}</p>
                      <p className="text-sm text-muted-foreground">by {challenge.creator}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{challenge.participants} participants</p>
                        <p className="text-xs text-muted-foreground">${challenge.totalPot} pot</p>
                      </div>
                      <Badge
                        variant={
                          challenge.status === "active"
                            ? "default"
                            : challenge.status === "pending"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {challenge.status}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {challenge.status === "pending" && (
                          <>
                            <Button variant="ghost" size="sm" className="text-green-600">
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notification-type">Type</Label>
                  <select id="notification-type" className="w-full p-2 border rounded-md">
                    <option value="system">System</option>
                    <option value="challenge">Challenge</option>
                    <option value="social">Social</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="notification-target">Target</Label>
                  <select id="notification-target" className="w-full p-2 border rounded-md">
                    <option value="all">All Users</option>
                    <option value="active">Active Users</option>
                    <option value="specific">Specific User</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="notification-title">Title</Label>
                <Input id="notification-title" placeholder="Notification title" />
              </div>
              <div>
                <Label htmlFor="notification-message">Message</Label>
                <Textarea id="notification-message" placeholder="Notification message" />
              </div>
              <Button onClick={sendTestNotification}>
                <Bell className="w-4 h-4 mr-2" />
                Send Notification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>User Registration</Label>
                    <p className="text-sm text-muted-foreground">Allow new user registrations</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Challenge Creation</Label>
                    <p className="text-sm text-muted-foreground">Allow users to create challenges</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable maintenance mode</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="platform-fee">Platform Fee (%)</Label>
                  <Input id="platform-fee" type="number" defaultValue="5" />
                </div>
                <div>
                  <Label htmlFor="min-stake">Minimum Stake ($)</Label>
                  <Input id="min-stake" type="number" defaultValue="10" />
                </div>
                <div>
                  <Label htmlFor="max-stake">Maximum Stake ($)</Label>
                  <Input id="max-stake" type="number" defaultValue="1000" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
