"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
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
  isLoading: boolean
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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/user/notifications')
      if (!response.ok) throw new Error('Failed to fetch notifications')

      const data = await response.json()
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        })))
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error("Failed to load notifications")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load real notifications from API
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))

    try {
      await fetch(`/api/user/notifications/${id}`, { method: 'PATCH' })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      // We could revert the optimistic update here if needed,
      // but for read status it's often acceptable to just log the error
    }
  }

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

    try {
      await fetch('/api/user/notifications', { method: 'PATCH' })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error("Failed to mark all as read")
    }
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

  const removeNotification = async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id))

    try {
      await fetch(`/api/user/notifications/${id}`, { method: 'DELETE' })
    } catch (error) {
      console.error('Error removing notification:', error)
      toast.error("Failed to remove notification")
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
        removeNotification,
        isLoading,
        refreshNotifications: fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
