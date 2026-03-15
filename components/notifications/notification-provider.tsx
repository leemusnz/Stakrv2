"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { toast } from "sonner"

interface Notification {
  id: string
  type: "challenge" | "verification" | "system" | "social"
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
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  removeNotification: (id: string) => void
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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  const fetchNotifications = async () => {
    try {
      setError(null)
      const response = await fetch('/api/user/notifications')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.notifications) {
        setNotifications(
          data.notifications.map((n: any) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            timestamp: new Date(n.timestamp),
            read: n.read,
            actionUrl: n.actionUrl,
            metadata: n.metadata,
          }))
        )
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications'
      setError(errorMessage)
      console.error('Error fetching notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
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

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  // Load real notifications from API on mount and set up polling
  useEffect(() => {
    // Fetch notifications immediately on mount
    fetchNotifications()

    // Set up polling interval (every 30 seconds)
    const pollInterval = setInterval(fetchNotifications, 30000)

    // Cleanup interval on unmount
    return () => clearInterval(pollInterval)
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}