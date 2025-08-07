"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { avatarEvents } from '@/lib/avatar-events'

interface AvatarResult {
  avatarUrl: string
  isCustom: boolean
  isLoading: boolean
  refresh: () => void
}

/**
 * Hook to get consistent user avatar across all components
 * Handles S3 proxy, fallbacks, and updates
 */
export function useUserAvatar(): AvatarResult {
  const { data: session, update } = useSession()
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const updateAvatar = async () => {
      setIsLoading(true)
      
      try {
        // Get the latest user profile data
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const userData = await response.json()
          const dbAvatar = userData.user?.avatar_url
          
          // Priority: session image > database avatar > default
          let finalAvatar = session?.user?.image || dbAvatar || ''
          
          // Apply S3 proxy for uploaded images
          if (finalAvatar && finalAvatar.includes('stakr-verification-files.s3')) {
            const stableTimestamp = finalAvatar.split('/').pop()?.split('-')[0] || 'default'
            finalAvatar = `/api/image-proxy?url=${encodeURIComponent(finalAvatar)}&v=${stableTimestamp}`
          }
          
          // Use personalized default if no custom avatar
          if (!finalAvatar && session?.user?.email) {
            const { getPersonalizedAvatar } = await import('@/lib/avatars')
            const defaultAvatar = getPersonalizedAvatar(session.user.email)
            finalAvatar = defaultAvatar.url
          }
          
          // Final fallback
          if (!finalAvatar) {
            finalAvatar = "/placeholder.svg"
          }
          
          setAvatarUrl(finalAvatar)
          
          // Update session if database has newer avatar
          if (dbAvatar && dbAvatar !== session?.user?.image) {
            await update({ image: dbAvatar })
          }
        } else {
          // Fallback to session or default
          let fallbackAvatar = session?.user?.image || ''
          
          if (fallbackAvatar && fallbackAvatar.includes('stakr-verification-files.s3')) {
            const stableTimestamp = fallbackAvatar.split('/').pop()?.split('-')[0] || 'default'
            fallbackAvatar = `/api/image-proxy?url=${encodeURIComponent(fallbackAvatar)}&v=${stableTimestamp}`
          }
          
          if (!fallbackAvatar && session?.user?.email) {
            const { getPersonalizedAvatar } = await import('@/lib/avatars')
            const defaultAvatar = getPersonalizedAvatar(session.user.email)
            fallbackAvatar = defaultAvatar.url
          }
          
          setAvatarUrl(fallbackAvatar || "/placeholder.svg")
        }
      } catch (error) {
        console.error('Error loading user avatar:', error)
        // Fallback to session or default
        const fallbackAvatar = session?.user?.image || "/placeholder.svg"
        setAvatarUrl(fallbackAvatar)
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      updateAvatar()
    } else {
      setAvatarUrl("/placeholder.svg")
      setIsLoading(false)
    }
  }, [session?.user?.image, session?.user?.email, session?.user?.id, refreshTrigger, update])

  // Listen for global avatar update events
  useEffect(() => {
    const unsubscribe = avatarEvents.subscribe((newAvatarUrl) => {
      console.log('🔄 Avatar update event received:', newAvatarUrl)
      setRefreshTrigger(prev => prev + 1)
    })

    return unsubscribe
  }, [])

  // Determine if avatar is custom (not a generated/default one)
  const isCustom = !!(
    avatarUrl &&
    !avatarUrl.includes('dicebear') &&
    !avatarUrl.includes('multiavatar') &&
    !avatarUrl.includes('boringavatars') &&
    !avatarUrl.includes('robohash') &&
    !avatarUrl.includes('placeholder')
  )

  // Manual refresh function
  const refresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return {
    avatarUrl,
    isCustom,
    isLoading,
    refresh
  }
}
