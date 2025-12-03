"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

interface Notification {
  id: string
  type: "challenge" | "verification" | "system" | "social" | "financial" | "insurance" | "withdrawal" | "reward"
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  metadata?: Record<string, any>
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  removeNotification: (id: string) => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastFetchedCount, setLastFetchedCount] = useState(0)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/user/notifications')
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      
      if (data.success && data.notifications) {
        const formattedNotifications = data.notifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }))
        
        setNotifications(formattedNotifications)
        
        // Show toast for new notifications (only if we had previous notifications)
        if (lastFetchedCount > 0 && data.notifications.length > lastFetchedCount) {
          const newNotifications = data.notifications.slice(0, data.notifications.length - lastFetchedCount)
          newNotifications.forEach((n: any) => {
            if (!n.read) {
              toast(n.title, {
                description: n.message,
                action: n.actionUrl
                  ? {
                      label: "View",
                      onClick: () => (window.location.href = n.actionUrl!),
                    }
                  : undefined,
              })
            }
          })
        }
        
        setLastFetchedCount(data.notifications.length)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [status, session, lastFetchedCount])

  // Mark single notification as read
  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))

      const response = await fetch(`/api/user/notifications/${id}`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        // Revert on failure
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)))
        throw new Error('Failed to mark notification as read')
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Optimistic update
      const previousNotifications = [...notifications]
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

      const response = await fetch('/api/user/notifications', {
        method: 'PATCH',
      })

      if (!response.ok) {
        // Revert on failure
        setNotifications(previousNotifications)
        throw new Error('Failed to mark all notifications as read')
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      toast.error('Failed to mark all notifications as read')
    }
  }

  // Add notification (client-side only, for real-time updates)
  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: `temp-${Date.now()}`,
      timestamp: new Date(),
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev])

    // Show toast notification
    toast(notification.title, {
      description: notification.message,
      action: notification.actionUrl
        ? {
            label: "View",
            onClick: () => (window.location.href = notification.actionUrl!),
          }
        : undefined,
    })
  }

  // Remove notification
  const removeNotification = async (id: string) => {
    try {
      // Optimistic update
      const previousNotifications = [...notifications]
      setNotifications((prev) => prev.filter((n) => n.id !== id))

      const response = await fetch(`/api/user/notifications/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        // Revert on failure
        setNotifications(previousNotifications)
        throw new Error('Failed to delete notification')
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  // Refresh notifications manually
  const refreshNotifications = async () => {
    await fetchNotifications()
  }

  // Initial load
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (status !== 'authenticated') return

    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [status, fetchNotifications])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        addNotification,
        removeNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
