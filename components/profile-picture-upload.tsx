"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { uploadFile } from "@/lib/file-upload"
import { getPersonalizedAvatar } from "@/lib/avatars"
import { Camera, Upload, Trash2, User, CheckCircle, AlertCircle } from "lucide-react"

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null)
  const [forceRender, setForceRender] = useState(0) // Force re-render counter
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  
  // Use image proxy for S3 URLs to bypass CORS issues  
  let displayAvatar = rawAvatar
  if (rawAvatar && rawAvatar.includes('stakr-verification-files.s3')) {
    // Use a stable timestamp based on the image URL to prevent constant re-fetching
    const stableTimestamp = rawAvatar.split('/').pop()?.split('-')[0] || 'default'
    displayAvatar = `/api/image-proxy?url=${encodeURIComponent(rawAvatar)}&v=${stableTimestamp}`
    console.log('🔄 Using image proxy for S3 URL:', rawAvatar, '→', displayAvatar)
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
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus('error')
      return
    }

    setIsUploading(true)
    setUploadStatus('idle')

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
      
      if (result.success && result.fileUrl) {
        console.log('✅ File uploaded successfully:', result.fileUrl)
        
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
            await update()
            
            // Update local state for immediate visual feedback
            setUploadedAvatarUrl(result.fileUrl)
            setForceRender(prev => prev + 1)
            
            console.log('✅ Avatar update completed without page reload')
            
          } catch (sessionError) {
            console.error('❌ Session update failed:', sessionError)
            // Fallback: still update local state
            setUploadedAvatarUrl(result.fileUrl)
            setForceRender(prev => prev + 1)
          }
          
          // Clear preview since we have the uploaded version
          setPreviewUrl(null)
        } else {
          throw new Error('Failed to update profile')
        }
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Profile picture upload failed:', error)
      setUploadStatus('error')
      setPreviewUrl(null)
      setUploadedAvatarUrl(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemovePicture = async () => {
    try {
      setIsUploading(true)
      
      // Reset to default avatar
      const defaultAvatar = getDefaultAvatar()
      
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: defaultAvatar })
      })

      if (response.ok) {
        setPreviewUrl(null)
        setUploadedAvatarUrl(null)
        setUploadStatus('success')
        onAvatarUpdate?.(defaultAvatar)
        
        // Update session and local state without page reload
        try {
          console.log('✅ Avatar removed and database updated successfully')
          console.log('🔄 Updating session with default avatar...')
          
          // Update session to reflect default avatar
          await update()
          
          // Update local state for immediate visual feedback
          setUploadedAvatarUrl(null)
          setForceRender(prev => prev + 1)
          
          console.log('✅ Avatar removal completed without page reload')
          
        } catch (sessionError) {
          console.error('❌ Session update failed:', sessionError)
          // Fallback: still update local state
          setUploadedAvatarUrl(null)
          setForceRender(prev => prev + 1)
        }
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
            key={`avatar-container-${displayAvatar}`} // Force re-render when avatar changes
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
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                {isCustomAvatar ? 'Change Photo' : 'Upload Photo'}
              </Button>
              
              {isCustomAvatar && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRemovePicture}
                  disabled={isUploading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Status Messages */}
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Uploading and updating profile...</span>
              </div>
            )}
            
            {uploadStatus === 'success' && !isUploading && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Profile picture updated successfully!</span>
              </div>
            )}
            
            {uploadStatus === 'error' && !isUploading && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>Upload failed. Please try again.</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              JPG, PNG or WebP. Max 10MB.
            </p>
            
                        {/* Simplified Debug Info - Only for development */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  Debug Info (Click to expand)
                </summary>
                                 <div className="mt-2 p-2 bg-muted/50 rounded text-xs space-y-1">
                   <div>Using Proxy: {rawAvatar?.includes('stakr-verification-files.s3') ? 'Yes' : 'No'}</div>
                   <div>Is Custom: {isCustomAvatar ? 'Yes' : 'No'}</div>
                   <div>Force Render: {forceRender}</div>
                   <Button 
                     size="sm" 
                     variant="outline" 
                     className="mt-2"
                     onClick={() => {
                       console.log('🔍 Avatar Debug:', {
                         session: session?.user?.image,
                         raw: rawAvatar,
                         display: displayAvatar,
                         forceRender: forceRender
                       })
                     }}
                   >
                     Log Debug Info
                   </Button>
                 </div>
              </details>
             )}
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
