"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { uploadFile } from "@/lib/file-upload"
import { getPersonalizedAvatar } from "@/lib/avatars"
import { Camera, Upload, Trash2, User, CheckCircle, AlertCircle } from "lucide-react"
import { avatarEvents } from '@/lib/avatar-events'

interface ProfilePictureUploadProps {
  currentAvatar?: string
  userName?: string
  size?: "sm" | "md" | "lg"
  showControls?: boolean
  onAvatarUpdate?: (avatarUrl: string) => void
}

export function ProfilePictureUpload({ 
  currentAvatar, 
  userName = "", 
  size = "md", 
  showControls = true,
  onAvatarUpdate 
}: ProfilePictureUploadProps) {
  const { data: session, update } = useSession()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null)
  const [forceRender, setForceRender] = useState(0) // Force re-render counter
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showDebugInfo, setShowDebugInfo] = useState(false)

  // Get default avatar if no custom one is set
  const getDefaultAvatar = () => {
    if (session?.user?.email) {
      return getPersonalizedAvatar(session.user.email).url
    }
    return "/placeholder.svg"
  }

  // Enhanced avatar prioritization - prioritize session image over props
  const sessionAvatar = session?.user?.image
  let rawAvatar = uploadedAvatarUrl || sessionAvatar || currentAvatar || previewUrl || getDefaultAvatar()
  
  // Use image proxy for S3 URLs
  let displayAvatar = rawAvatar
  if (rawAvatar && rawAvatar.includes('stakr-verification-files.s3')) {
    const stableTimestamp = rawAvatar.split('/').pop()?.split('-')[0] || 'default'
    displayAvatar = `/api/image-proxy?url=${encodeURIComponent(rawAvatar)}&v=${stableTimestamp}`
  }
  
  const isCustomAvatar = (uploadedAvatarUrl || sessionAvatar || currentAvatar) && 
    !rawAvatar.includes('dicebear') && 
    !rawAvatar.includes('multiavatar') &&
    !rawAvatar.includes('boringavatars') &&
    !rawAvatar.includes('robohash') &&
    !rawAvatar.includes('placeholder')

  // Sync uploaded avatar with session changes
  useEffect(() => {
    if (sessionAvatar && sessionAvatar !== currentAvatar) {
      setUploadedAvatarUrl(sessionAvatar)
      console.log('🔄 Session avatar synced to local state:', sessionAvatar)
    }
  }, [sessionAvatar, currentAvatar])

  // Additional effect to ensure avatar state is properly synced
  useEffect(() => {
    if (session?.user?.image && session.user.image !== uploadedAvatarUrl) {
      console.log('🔄 Detected session image change, updating local state:', session.user.image)
      setUploadedAvatarUrl(session.user.image)
      setForceRender(prev => prev + 1) // Force component re-render
    }
  }, [session?.user?.image, uploadedAvatarUrl])

  // Force re-render when session changes
  useEffect(() => {
    setForceRender(prev => prev + 1)
  }, [session?.user?.image])

  // Listen for avatar events from other components
  useEffect(() => {
    const unsubscribe = avatarEvents.subscribe((newAvatarUrl) => {
      console.log('🔄 Avatar event received:', newAvatarUrl)
      setUploadedAvatarUrl(newAvatarUrl)
      setForceRender(prev => prev + 1)
    })

    return unsubscribe
  }, [])

  // Size configurations
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32"
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadStatus('error')
      setUploadError('Please select an image file (JPG, PNG, or WebP)')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus('error')
      setUploadError('File size must be less than 10MB')
      return
    }

    setIsUploading(true)
    setUploadStatus('idle')
    setUploadError(null)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setPreviewUrl(e.target?.result as string)
      reader.readAsDataURL(file)

      // Upload to S3
      const result = await uploadFile(file, { 
        challengeId: 'profile-images',
        metadata: { 
          type: 'profile_picture',
          userId: session?.user?.id || 'unknown'
        }
      })

      if (!result.success || !result.fileUrl) {
        throw new Error(result.error || 'Upload failed')
      }

      console.log('✅ File uploaded successfully:', result.fileUrl)

      // Check image moderation if available
      if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_MODERATION === 'true') {
        try {
          console.log('🔍 Running image moderation check...')
          const moderationResponse = await fetch('/api/moderate/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: result.fileUrl })
          })

          if (moderationResponse.ok) {
            const moderationResult = await moderationResponse.json()
            console.log('🛡️ Moderation result:', moderationResult)
            
            if (moderationResult.flagged) {
              const reasons = moderationResult.reason || []
              let userMessage = 'This image does not meet our community guidelines.'
              
              if (reasons.includes('inappropriate')) {
                userMessage = 'This image contains inappropriate content and cannot be used as a profile picture.'
              } else if (reasons.includes('tobacco') || reasons.includes('gambling')) {
                userMessage = 'Images showing tobacco use or gambling are not appropriate for profile pictures.'
              } else if (reasons.includes('minors')) {
                userMessage = 'Images containing children cannot be used for privacy and safety reasons.'
              } else if (reasons.includes('screenshots') || reasons.includes('text_heavy')) {
                userMessage = 'Please upload a photo of yourself rather than screenshots or text-based images.'
              } else if (reasons.includes('political')) {
                userMessage = 'Political content is not appropriate for profile pictures.'
              } else if (reasons.includes('low_quality')) {
                userMessage = 'Please upload a clearer, higher quality image.'
              } else if (reasons.includes('personal_info')) {
                userMessage = 'Images containing personal information (QR codes, phone numbers) are not allowed.'
              } else if (reasons.includes('multiple_people')) {
                userMessage = 'Please use a photo that clearly shows only you.'
              } else if (reasons.includes('harassment')) {
                userMessage = 'Images containing harassment or hate symbols are not allowed.'
              }
              
              throw new Error(userMessage + ' Please choose a different image.')
            }
            
            console.log('✅ Image passed moderation, proceeding with profile update')
          }
        } catch (moderationError) {
          console.warn('Moderation check failed, proceeding with upload:', moderationError)
        }
      }
      
      // Update local state immediately for instant feedback
      setUploadedAvatarUrl(result.fileUrl)
      
      // Save to user profile via API
      const updateResponse = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: result.fileUrl })
      })

      if (updateResponse.ok) {
        const profileUpdateResult = await updateResponse.json()
        console.log('✅ Profile API updated successfully:', profileUpdateResult)
        
        setUploadStatus('success')
        
        // Notify parent component immediately
        onAvatarUpdate?.(result.fileUrl)
        
        // Update session and local state without page reload
        try {
          console.log('✅ Avatar uploaded and database updated successfully')
          console.log('🔄 Updating session with new avatar...')
          
          // Update session to reflect new avatar
          await update({ 
            user: {
              ...session?.user,
              image: result.fileUrl,
              avatar: result.fileUrl
            }
          })
          
          // Update local state for immediate visual feedback
          setUploadedAvatarUrl(result.fileUrl)
          setForceRender(prev => prev + 1)
          
          // Notify all components using the avatar system
          avatarEvents.notify(result.fileUrl)
          
          console.log('✅ Avatar update completed without page reload')
          
        } catch (sessionError) {
          console.error('❌ Session update failed:', sessionError)
          // Fallback: still update local state and notify components
          setUploadedAvatarUrl(result.fileUrl)
          setForceRender(prev => prev + 1)
          avatarEvents.notify(result.fileUrl)
        }
        
        // Clear preview since we have the uploaded version
        setPreviewUrl(null)
      } else {
        throw new Error('Failed to update profile')
      }

    } catch (error) {
      console.error('Upload failed:', error)
      setUploadStatus('error')
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemovePicture = async () => {
    setIsUploading(true)
    try {
      // Remove avatar from profile via API
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: null })
      })

      if (response.ok) {
        // Update session to remove avatar
        await update({ 
          user: {
            ...session?.user,
            image: null,
            avatar: null
          }
        })
        
        // Clear local state
        setUploadedAvatarUrl(null)
        setPreviewUrl(null)
        setForceRender(prev => prev + 1)
        
        // Notify parent component
        onAvatarUpdate?.('')
        
        // Notify all components
        avatarEvents.notify('')
        
        console.log('✅ Avatar removed successfully')
      } else {
        throw new Error('Failed to remove picture')
      }
    } catch (error) {
      console.error('Failed to remove picture:', error)
      setUploadStatus('error')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Avatar Display */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <Avatar 
            className={`${sizeClasses[size]} ${isUploading ? 'opacity-50' : ''}`}
            key={`avatar-container-${displayAvatar}-${forceRender}`} // Force re-render when avatar changes
          >
            <AvatarImage 
              src={displayAvatar} 
              alt={userName} 
              className="object-cover"
              onLoad={() => console.log('🖼️ Avatar image loaded successfully:', displayAvatar)}
              onError={(e) => {
                console.error('❌ Avatar image failed to load:', displayAvatar)
                // Force fallback to show
                const img = e.target as HTMLImageElement
                img.style.display = 'none'
              }}
            />
            <AvatarFallback className="text-xl bg-primary text-white">
              {userName?.charAt(0)?.toUpperCase() || <User className="w-6 h-6" />}
            </AvatarFallback>
          </Avatar>
          
          {/* Upload Progress Indicator */}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}

          {/* Status Badge */}
          {!isCustomAvatar && (
            <Badge 
              variant="outline" 
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs bg-muted border-muted-foreground/30"
            >
              Default
            </Badge>
          )}
        </div>

        {/* Upload Controls */}
        {showControls && (
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              size="sm"
              className="flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              {isCustomAvatar ? 'Change Photo' : 'Upload Photo'}
            </Button>
            
            {isCustomAvatar && (
              <Button
                onClick={handleRemovePicture}
                disabled={isUploading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Status Messages */}
      {uploadStatus === 'success' && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle className="w-4 h-4" />
          Avatar updated successfully!
        </div>
      )}

      {uploadStatus === 'error' && uploadError && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {uploadError}
        </div>
      )}

      {/* Debug Info (Development Only) */}
      {showDebugInfo && process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Session Avatar: {session?.user?.image || 'null'}</div>
          <div>Current Avatar: {currentAvatar || 'null'}</div>
          <div>Uploaded Avatar: {uploadedAvatarUrl || 'null'}</div>
          <div>Display Avatar: {displayAvatar}</div>
          <div>Force Render: {forceRender}</div>
        </div>
      )}
    </div>
  )
}
