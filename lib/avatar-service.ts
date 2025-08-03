// Unified avatar service to ensure consistent profile picture handling across all components

import { getPersonalizedAvatar } from './avatars'

export interface AvatarSource {
  url: string
  isCustom: boolean
  source: 'uploaded' | 'session' | 'database' | 'default'
}

/**
 * Get the best avatar URL for a user, with consistent S3 proxy handling
 */
export function getUserAvatar(options: {
  sessionImage?: string | null
  databaseAvatar?: string | null
  uploadedAvatar?: string | null
  userEmail?: string | null
  userName?: string
}): AvatarSource {
  const { sessionImage, databaseAvatar, uploadedAvatar, userEmail, userName } = options

  // Priority: uploaded > session > database > default
  let avatarUrl = uploadedAvatar || sessionImage || databaseAvatar
  let source: AvatarSource['source'] = 'default'

  if (uploadedAvatar) {
    source = 'uploaded'
  } else if (sessionImage) {
    source = 'session'
  } else if (databaseAvatar) {
    source = 'database'
  }

  // If no avatar, use personalized default
  if (!avatarUrl && userEmail) {
    const defaultAvatar = getPersonalizedAvatar(userEmail)
    avatarUrl = defaultAvatar.url
    source = 'default'
  }

  // Fallback to generic placeholder
  if (!avatarUrl) {
    avatarUrl = "/placeholder.svg"
    source = 'default'
  }

  // Apply S3 proxy for uploaded images
  const finalUrl = applyS3Proxy(avatarUrl)

  // Determine if it's a custom avatar
  const isCustom = source !== 'default' && !isGeneratedAvatar(avatarUrl)

  return {
    url: finalUrl,
    isCustom,
    source
  }
}

/**
 * Apply S3 proxy for CORS bypass and caching
 */
export function applyS3Proxy(url: string): string {
  if (!url || !url.includes('stakr-verification-files.s3')) {
    return url
  }

  // Use a stable timestamp based on the image URL to prevent constant re-fetching
  const stableTimestamp = url.split('/').pop()?.split('-')[0] || 'default'
  return `/api/image-proxy?url=${encodeURIComponent(url)}&v=${stableTimestamp}`
}

/**
 * Check if an avatar URL is from a generated avatar service
 */
export function isGeneratedAvatar(url: string): boolean {
  return !!(
    url.includes('dicebear') ||
    url.includes('multiavatar') ||
    url.includes('boringavatars') ||
    url.includes('robohash') ||
    url.includes('placeholder')
  )
}

/**
 * Get avatar initials fallback
 */
export function getAvatarInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const nameParts = name.trim().split(' ')
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    }
    return nameParts[0][0].toUpperCase()
  }
  
  if (email) {
    return email[0].toUpperCase()
  }
  
  return 'U'
}

/**
 * Update user avatar in session and database
 */
export async function updateUserAvatar(
  avatarUrl: string,
  options?: {
    updateSession?: boolean
    updateDatabase?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  const { updateSession = true, updateDatabase = true } = options || {}

  try {
    // Update in database
    if (updateDatabase) {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: avatarUrl })
      })

      if (!response.ok) {
        throw new Error('Failed to update avatar in database')
      }
    }

    // Update session
    if (updateSession && typeof window !== 'undefined') {
      const { update } = await import('next-auth/react')
      await update({ image: avatarUrl })
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to update user avatar:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}