"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Check, X, Clock, Trophy, Users, Settings } from "lucide-react"
import { useNotifications } from "./notification-provider"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "challenge":
        return <Trophy className="w-4 h-4 text-primary" />
      case "social":
        return <Users className="w-4 h-4 text-secondary" />
      case "verification":
        return <Clock className="w-4 h-4 text-orange-500" />
      case "system":
        return <Settings className="w-4 h-4 text-muted-foreground" />
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />
    }
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-primary text-white text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-auto p-1">
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-0 focus:bg-muted"
                onSelect={(e) => e.preventDefault()}
              >
                <div className="w-full p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm font-medium leading-none", !notification.read && "font-semibold")}>
                            {notification.title}
                          </p>
                          {!notification.read && <div className="w-2 h-2 bg-primary rounded-full" />}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{formatTimeAgo(notification.timestamp)}</span>
                          {notification.actionUrl && (
                            <Link href={notification.actionUrl}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-auto p-1 text-primary hover:text-primary/80"
                                onClick={() => {
                                  markAsRead(notification.id)
                                  setIsOpen(false)
                                }}
                              >
                                View →
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="w-6 h-6 p-0 hover:bg-muted"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNotification(notification.id)}
                        className="w-6 h-6 p-0 hover:bg-muted"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="w-full text-center cursor-pointer">
            <span className="text-sm text-muted-foreground">View all notifications</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
