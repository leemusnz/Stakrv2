import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { avatarEvents } from '@/lib/avatar-events'
import { getPersonalizedAvatar } from '@/lib/avatars'

export function useAvatar() {
  const { data: session, update } = useSession()
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Get default avatar based on user email
  const getDefaultAvatar = () => {
    if (session?.user?.email) {
      return getPersonalizedAvatar(session.user.email).url
    }
    return "/placeholder.svg"
  }

  // Process avatar URL to use image proxy for S3 URLs
  const processAvatarUrl = (url: string) => {
    if (url && url.includes('stakr-verification-files.s3')) {
      const stableTimestamp = url.split('/').pop()?.split('-')[0] || 'default'
      return `/api/image-proxy?url=${encodeURIComponent(url)}&v=${stableTimestamp}`
    }
    return url
  }

  // Update avatar state
  const updateAvatar = async (newAvatarUrl: string) => {
    setIsLoading(true)
    try {
      // Update session
      await update({
        user: {
          ...session?.user,
          image: newAvatarUrl,
          avatar: newAvatarUrl
        }
      })

      // Update local state
      setAvatarUrl(processAvatarUrl(newAvatarUrl))
      
      // Notify all components
      avatarEvents.notify(newAvatarUrl)
      
      console.log('✅ Avatar updated successfully:', newAvatarUrl)
    } catch (error) {
      console.error('❌ Failed to update avatar:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize avatar from session
  useEffect(() => {
    if (session?.user?.image) {
      setAvatarUrl(processAvatarUrl(session.user.image))
    } else {
      setAvatarUrl(processAvatarUrl(getDefaultAvatar()))
    }
  }, [session?.user?.image])

  // Listen for avatar events from other components
  useEffect(() => {
    const unsubscribe = avatarEvents.subscribe((newAvatarUrl) => {
      console.log('🔄 Avatar event received in useAvatar:', newAvatarUrl)
      setAvatarUrl(processAvatarUrl(newAvatarUrl))
    })

    return unsubscribe
  }, [])

  return {
    avatarUrl,
    isLoading,
    updateAvatar,
    isCustomAvatar: avatarUrl && 
      !avatarUrl.includes('dicebear') && 
      !avatarUrl.includes('multiavatar') &&
      !avatarUrl.includes('boringavatars') &&
      !avatarUrl.includes('robohash') &&
      !avatarUrl.includes('placeholder')
  }
}
