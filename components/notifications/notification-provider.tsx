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
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "challenge",
      title: "Challenge Deadline Approaching",
      message: "Your 10K Steps Daily challenge verification is due in 2 hours",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
      actionUrl: "/verification-demo",
    },
    {
      id: "2",
      type: "social",
      title: "New Achievement Unlocked",
      message: "You've completed your first week streak! 🔥",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false,
      actionUrl: "/dashboard?tab=achievements",
    },
    {
      id: "3",
      type: "system",
      title: "Welcome to Stakr!",
      message: "Complete your profile to get personalized challenge recommendations",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      read: true,
      actionUrl: "/profile",
    },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

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

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly add notifications for demo purposes
      if (Math.random() < 0.1) {
        // 10% chance every 30 seconds
        const demoNotifications = [
          {
            type: "social" as const,
            title: "Friend Activity",
            message: "Sarah just completed the Morning Meditation challenge!",
          },
          {
            type: "challenge" as const,
            title: "New Challenge Available",
            message: "30-Day Reading Challenge is now live with a $500 prize pool",
            actionUrl: "/discover",
          },
        ]

        const randomNotification = demoNotifications[Math.floor(Math.random() * demoNotifications.length)]
        addNotification(randomNotification)
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
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
