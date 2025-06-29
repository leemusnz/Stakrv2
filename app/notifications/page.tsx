"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/components/notifications/notification-provider"
import { Bell, Check, X, Clock, Trophy, Users, Settings } from "lucide-react"
import Link from "next/link"

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, removeNotification } = useNotifications()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "challenge":
        return <Trophy className="w-5 h-5 text-primary" />
      case "social":
        return <Users className="w-5 h-5 text-secondary" />
      case "verification":
        return <Clock className="w-5 h-5 text-orange-500" />
      case "system":
        return <Settings className="w-5 h-5 text-muted-foreground" />
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />
    }
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes} minutes ago`
    if (hours < 24) return `${hours} hours ago`
    return `${days} days ago`
  }

  const unreadNotifications = notifications.filter((n) => !n.read)
  const readNotifications = notifications.filter((n) => n.read)

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your challenges and activities</p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            <Check className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
            <p className="text-muted-foreground text-center">When you have notifications, they'll appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Unread Notifications */}
          {unreadNotifications.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Unread ({unreadNotifications.length})</h2>
              <div className="space-y-3">
                {unreadNotifications.map((notification) => (
                  <Card key={notification.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{notification.title}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {notification.type}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">{notification.message}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {formatTimeAgo(notification.timestamp)}
                              </span>
                              {notification.actionUrl && (
                                <Link href={notification.actionUrl}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:text-primary/80"
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    View →
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNotification(notification.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Read Notifications */}
          {readNotifications.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Earlier ({readNotifications.length})</h2>
              <div className="space-y-3">
                {readNotifications.map((notification) => (
                  <Card key={notification.id} className="opacity-75">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{notification.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {notification.type}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-sm">{notification.message}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {formatTimeAgo(notification.timestamp)}
                              </span>
                              {notification.actionUrl && (
                                <Link href={notification.actionUrl}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    View →
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNotification(notification.id)}
                          className="text-muted-foreground hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
