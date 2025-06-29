"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Shield,
  UserPlus,
  UserMinus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Calendar,
  User
} from "lucide-react"

interface User {
  id: string
  email: string
  name: string
  isDev: boolean
  devModeEnabled: boolean
  devAccessGrantedAt: string | null
  createdAt: string
}

interface DevAccessManagerProps {
  className?: string
}

export function DevAccessManager({ className }: DevAccessManagerProps) {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "dev" | "non-dev">("all")
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [action, setAction] = useState<"grant" | "revoke">("grant")
  const [reason, setReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Check if user is admin
  const isAdmin = session?.user?.isAdmin || false

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  useEffect(() => {
    // Filter users based on search and status
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(user => 
        filterStatus === "dev" ? user.isDev : !user.isDev
      )
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, filterStatus])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/dev-access')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }

      setUsers(data.users)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDevAccess = async () => {
    if (!selectedUser || !reason.trim()) return

    try {
      setIsProcessing(true)
      const response = await fetch('/api/admin/dev-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          action,
          reason: reason.trim()
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to manage dev access')
      }

      // Refresh the users list
      await fetchUsers()
      
      // Close dialog and reset state
      setIsDialogOpen(false)
      setSelectedUser(null)
      setReason("")
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to manage dev access')
    } finally {
      setIsProcessing(false)
    }
  }

  const openDialog = (user: User, actionType: "grant" | "revoke") => {
    setSelectedUser(user)
    setAction(actionType)
    setReason("")
    setIsDialogOpen(true)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  // Don't render anything if not admin
  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Admin access required to manage dev access.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className={`border-purple-200 bg-purple-50/50 ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-purple-700">
          <Shield className="w-5 h-5" />
          🔒 Dev Access Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filter Controls */}
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
            <Label htmlFor="filter" className="text-sm font-medium">Filter by Status</Label>
            <Select value={filterStatus} onValueChange={(value: "all" | "dev" | "non-dev") => setFilterStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="dev">Dev Access Only</SelectItem>
                <SelectItem value="non-dev">No Dev Access</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button 
              onClick={fetchUsers} 
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Separator />

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Users Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading users...</span>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Dev Access</TableHead>
                  <TableHead>Mode Status</TableHead>
                  <TableHead>Granted Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No users found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isDev ? "default" : "secondary"} className="flex items-center gap-1 w-fit">
                          {user.isDev ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Has Access
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              No Access
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isDev ? (
                          <Badge variant={user.devModeEnabled ? "default" : "outline"} className="flex items-center gap-1 w-fit">
                            {user.devModeEnabled ? "Enabled" : "Disabled"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {formatDate(user.devAccessGrantedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.isDev ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openDialog(user, "revoke")}
                              className="flex items-center gap-1"
                            >
                              <UserMinus className="w-3 h-3" />
                              Revoke
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => openDialog(user, "grant")}
                              className="flex items-center gap-1"
                            >
                              <UserPlus className="w-3 h-3" />
                              Grant
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Dev Access Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {action === "grant" ? "Grant Dev Access" : "Revoke Dev Access"}
              </DialogTitle>
              <DialogDescription>
                {action === "grant" 
                  ? `Grant developer access to ${selectedUser?.name}?`
                  : `Revoke developer access from ${selectedUser?.name}?`
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">Reason (Required)</Label>
                <Textarea
                  id="reason"
                  placeholder={`Explain why you ${action === "grant" ? "granting" : "revoking"} dev access...`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDevAccess}
                disabled={!reason.trim() || isProcessing}
                variant={action === "grant" ? "default" : "destructive"}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  action === "grant" ? "Grant Access" : "Revoke Access"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 