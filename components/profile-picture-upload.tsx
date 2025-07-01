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
      
      if (result.success && result.fileUrl) {
        console.log('✅ File uploaded successfully:', result.fileUrl)
        
        // 🛡️ MODERATE THE IMAGE BEFORE SAVING TO PROFILE
        console.log('🔍 Moderating uploaded image:', result.fileUrl)
        
        // Use image proxy URL for moderation (OpenAI needs publicly accessible URLs)
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(result.fileUrl)}&v=${Date.now()}`
        const fullProxyUrl = `${window.location.origin}${proxyUrl}`
        
        console.log('🔗 Using proxy URL for moderation:', fullProxyUrl)
        
        const moderationResponse = await fetch('/api/moderate/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageUrl: fullProxyUrl,
            context: 'profile_picture' 
          })
        })

        if (!moderationResponse.ok) {
          console.error('❌ Moderation API failed:', moderationResponse.status)
          // Continue anyway if moderation API fails (fail-safe)
        } else {
          const moderationData = await moderationResponse.json()
          const moderationResult = moderationData.moderation
          console.log('🛡️ Image moderation result:', moderationResult)
          
          if (moderationResult?.flagged) {
            console.log('❌ Image flagged by moderation, rejecting upload')
            setUploadStatus('error')
            setPreviewUrl(null)
            setUploadedAvatarUrl(null)
            
            // Create user-friendly error message based on flagged reasons
            const reasons = moderationResult.reason || []
            
            // Handle technical error cases first
            if (reasons.includes('moderation_unavailable')) {
              throw new Error('Image moderation is currently unavailable. Please try again later or contact support.')
            } else if (reasons.includes('moderation_api_failed') || reasons.includes('moderation_error') || reasons.includes('moderation_download_failed') || reasons.includes('moderation_parse_failed')) {
              throw new Error('Unable to verify image safety. Please try a different image or contact support if this persists.')
            }
            
            // Create specific user-friendly messages for content violations
            let userMessage = 'This image is not appropriate for a profile picture.'
            
            if (reasons.includes('sexual') || reasons.includes('nudity')) {
              userMessage = 'This image contains sexual content or nudity and cannot be used as a profile picture.'
            } else if (reasons.includes('medical_genitalia')) {
              userMessage = 'Medical diagrams of anatomy are not appropriate for profile pictures.'
            } else if (reasons.includes('violence') || reasons.includes('weapons')) {
              userMessage = 'Images containing violence or weapons cannot be used as profile pictures.'
            } else if (reasons.includes('drugs') || reasons.includes('drug_paraphernalia')) {
              userMessage = 'Images showing drugs or drug paraphernalia are not allowed as profile pictures.'
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
      
      // Handle specific error types for better user experience
      let userFriendlyMessage = 'Upload failed. Please try again.'
      
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        
        if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
          userFriendlyMessage = 'Session expired. Please refresh the page and try again.'
        } else if (errorMessage.includes('storage service not available') || errorMessage.includes('503')) {
          userFriendlyMessage = 'File upload service is temporarily unavailable. Please try again in a few minutes.'
        } else if (errorMessage.includes('aws credentials') || errorMessage.includes('storage config')) {
          userFriendlyMessage = 'File upload service is experiencing technical difficulties. Please contact support.'
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          userFriendlyMessage = 'Network error. Please check your connection and try again.'
        } else if (errorMessage.includes('file size') || errorMessage.includes('10mb')) {
          userFriendlyMessage = 'File size must be less than 10MB. Please choose a smaller image.'
        } else if (errorMessage.includes('file type') || errorMessage.includes('invalid')) {
          userFriendlyMessage = 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
        } else if (error.message && error.message.length > 0) {
          // Use the actual error message if it's user-friendly
          userFriendlyMessage = error.message
        }
      }
      
      setUploadError(userFriendlyMessage)
      setPreviewUrl(null)
      setUploadedAvatarUrl(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemovePicture = async () => {
    try {
      setIsUploading(true)
      setUploadError(null)
      
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
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{uploadError || 'Upload failed. Please try again.'}</span>
                </div>
                
                {/* Debug Information Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDebugInfo(!showDebugInfo)}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    {showDebugInfo ? 'Hide' : 'Show'} technical details
                  </button>
                </div>
                
                {showDebugInfo && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded border space-y-1">
                    <div><strong>Debug Info:</strong></div>
                    <div>User ID: {session?.user?.id || 'Not available'}</div>
                    <div>User Email: {session?.user?.email || 'Not available'}</div>
                    <div>Current Avatar: {rawAvatar || 'None'}</div>
                    <div>Upload Status: {uploadStatus}</div>
                    <div>Error Message: {uploadError || 'None'}</div>
                    <div className="pt-2 text-gray-500">
                      <strong>Troubleshooting:</strong><br/>
                      1. Check that you're signed in<br/>
                      2. Try refreshing the page<br/>
                      3. Contact support if the issue persists<br/>
                      4. Visit /api/test-deployment to check system status
                    </div>
                  </div>
                )}
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
