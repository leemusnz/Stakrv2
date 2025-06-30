"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Crown,
  TrendingUp,
  Calendar,
  DollarSign,
  Trophy,
  UserCheck,
  UserX,
  AlertTriangle,
  RefreshCw
} from "lucide-react"

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  credits: number
  trustScore: number
  verificationTier: string
  challengesCompleted: number
  currentStreak: number
  longestStreak: number
  premiumSubscription: boolean
  hasDevAccess: boolean
  isActive: boolean
  lastLogin?: string
  createdAt: string
  falseClaims: number
  status: 'active' | 'suspended'
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  premiumUsers: number
  devUsers: number
}

interface UserData {
  users: User[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  stats: UserStats
}

export function UserManagement() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tierFilter, setTierFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    action: string
    user: User | null
  }>({ open: false, action: '', user: null })
  const [actionReason, setActionReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        status: statusFilter,
        tier: tierFilter
      })

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setUserData(data.data)
      } else {
        console.error('Failed to load users:', data.error)
      }
    } catch (error) {
      console.error('Users fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (action: string, user: User) => {
    setActionDialog({ open: true, action, user })
    setActionReason("")
  }

  const executeUserAction = async () => {
    if (!actionDialog.user) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionDialog.action,
          userId: actionDialog.user.id,
          reason: actionReason
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Refresh user data
        await loadUsers()
        setActionDialog({ open: false, action: '', user: null })
        setActionReason("")
      } else {
        console.error('Action failed:', data.error)
      }
    } catch (error) {
      console.error('User action error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [currentPage, searchTerm, statusFilter, tierFilter])

  const getStatusBadge = (user: User) => {
    if (user.status === 'suspended') {
      return <Badge variant="destructive" className="flex items-center gap-1"><Ban className="w-3 h-3" />Suspended</Badge>
    }
    if (user.isActive) {
      return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />Active</Badge>
    }
    return <Badge variant="secondary" className="flex items-center gap-1"><XCircle className="w-3 h-3" />Inactive</Badge>
  }

  const getTierBadge = (tier: string) => {
    const colors = {
      gold: 'bg-yellow-500',
      silver: 'bg-gray-400', 
      bronze: 'bg-orange-600',
      manual: 'bg-gray-500'
    }
    return (
      <Badge variant="secondary" className={`${colors[tier as keyof typeof colors] || colors.manual} text-white`}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never'
    const date = new Date(lastLogin)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = diff / (1000 * 60 * 60)
    
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${Math.floor(hours)}h ago`
    if (hours < 168) return `${Math.floor(hours / 24)}d ago`
    return formatDate(lastLogin)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load user data. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-700">{userData.stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Users</p>
                <p className="text-2xl font-bold text-green-700">{userData.stats.activeUsers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Suspended</p>
                <p className="text-2xl font-bold text-red-700">{userData.stats.suspendedUsers}</p>
              </div>
              <UserX className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Premium</p>
                <p className="text-2xl font-bold text-yellow-700">{userData.stats.premiumUsers}</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Admin Users</p>
                <p className="text-2xl font-bold text-purple-700">{userData.stats.devUsers}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter" className="text-sm font-medium">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tier-filter" className="text-sm font-medium">Tier</Label>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger id="tier-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadUsers}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trust Score</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userData.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {user.name}
                          {user.hasDevAccess && <Shield className="w-3 h-3 text-purple-600" />}
                          {user.premiumSubscription && <Crown className="w-3 h-3 text-yellow-600" />}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(user)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.trustScore}</span>
                      {user.falseClaims > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {user.falseClaims} false claims
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTierBadge(user.verificationTier)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Trophy className="w-3 h-3" />
                        {user.challengesCompleted} completed
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <TrendingUp className="w-3 h-3" />
                        {user.currentStreak} day streak
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="w-3 h-3" />
                        ${user.credits.toFixed(2)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatLastLogin(user.lastLogin)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.status === 'suspended' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction('unsuspend', user)}
                          className="text-green-600 hover:text-green-700"
                        >
                          Unsuspend
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction('suspend', user)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Suspend
                        </Button>
                      )}
                      
                      {!user.hasDevAccess ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction('grant_admin', user)}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          Grant Admin
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction('revoke_admin', user)}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          Revoke Admin
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {userData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((userData.pagination.page - 1) * userData.pagination.limit) + 1} to {Math.min(userData.pagination.page * userData.pagination.limit, userData.pagination.total)} of {userData.pagination.total} users
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={userData.pagination.page === 1}
              onClick={() => setCurrentPage(userData.pagination.page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {userData.pagination.page} of {userData.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={userData.pagination.page === userData.pagination.totalPages}
              onClick={() => setCurrentPage(userData.pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'suspend' && 'Suspend User'}
              {actionDialog.action === 'unsuspend' && 'Unsuspend User'}
              {actionDialog.action === 'grant_admin' && 'Grant Admin Access'}
              {actionDialog.action === 'revoke_admin' && 'Revoke Admin Access'}
              {actionDialog.action === 'reset_trust_score' && 'Reset Trust Score'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {actionDialog.action.replace('_', ' ')} {actionDialog.user?.name}?
              {actionDialog.action === 'suspend' && ' This will prevent them from participating in challenges.'}
              {actionDialog.action === 'grant_admin' && ' This will give them access to the admin dashboard.'}
              {actionDialog.action === 'revoke_admin' && ' This will remove their admin dashboard access.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Provide a reason for this action..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setActionDialog({ open: false, action: '', user: null })}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={executeUserAction}
              disabled={actionLoading}
              variant={actionDialog.action === 'suspend' ? 'destructive' : 'default'}
            >
              {actionLoading ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 