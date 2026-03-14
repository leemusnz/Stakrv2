// Client-side file upload utility for Stakr verification files

export interface UploadOptions {
  challengeId: string
  checkinId?: string
  sessionId?: string
  gestureDetected?: boolean
  wordDetected?: boolean
  verificationConfidence?: number
  metadata?: Record<string, any>
}

export interface UploadResult {
  success: boolean
  fileKey?: string
  fileUrl?: string
  error?: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

// Upload file using presigned URL
export async function uploadFile(
  file: File, 
  options: UploadOptions,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {

    // Step 1: Get presigned URL from our API
    const presignedResponse = await fetch('/api/upload/presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        challengeId: options.challengeId
      }),
    })


    if (!presignedResponse.ok) {
      const error = await presignedResponse.json()
      console.error('❌ Presigned URL request failed:', {
        status: presignedResponse.status,
        statusText: presignedResponse.statusText,
        error: error
      })
      return { success: false, error: error.error || `HTTP ${presignedResponse.status}: ${presignedResponse.statusText}` }
    }

    const { uploadUrl, fileKey, fileUrl } = await presignedResponse.json()

    // Step 2: Upload directly to S3 using presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    })


    // Track upload progress if callback provided
    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size, percentage: 100 })
    }

    if (!uploadResponse.ok) {
      console.error('❌ S3 upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        headers: Object.fromEntries(uploadResponse.headers.entries())
      })
      return { 
        success: false, 
        error: `S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}` 
      }
    }


    // Step 3: Confirm upload and save metadata to our database
    const confirmResponse = await fetch('/api/upload/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileKey,
        fileUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        challengeId: options.challengeId,
        checkinId: options.checkinId,
        sessionId: options.sessionId,
        gestureDetected: options.gestureDetected,
        wordDetected: options.wordDetected,
        verificationConfidence: options.verificationConfidence,
        metadata: options.metadata
      }),
    })


    if (!confirmResponse.ok) {
      console.warn('⚠️ File uploaded but confirmation failed:', {
        status: confirmResponse.status,
        statusText: confirmResponse.statusText
      })
      // Still return success since the file was uploaded
    } else {
    }

    return { 
      success: true, 
      fileKey, 
      fileUrl 
    }

  } catch (error) {
    console.error('💥 File upload error:', {
      error: error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'No stack trace',
      fileName: file.name,
      challengeId: options.challengeId
    })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}

// Upload multiple files
export async function uploadFiles(
  files: File[], 
  options: UploadOptions,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const result = await uploadFile(file, options, (progress) => {
      onProgress?.(i, progress)
    })
    results.push(result)
  }
  
  return results
}

// File validation (client-side)
export function validateFileForUpload(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/webm'
  ]

  if (file.size > MAX_SIZE) {
    return { 
      valid: false, 
      error: `File size must be less than ${MAX_SIZE / 1024 / 1024}MB` 
    }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Only JPEG, PNG, WebP images and MP4, QuickTime, WebM videos are allowed' 
    }
  }

  // Anti-fraud checks
  if (file.name.match(/^(stock|shutterstock|getty|adobe|istockphoto|unsplash|pexels|fake|test|sample|demo|generated|ai_?generated)/i)) {
    return { 
      valid: false, 
      error: 'File name suggests stock or generated content' 
    }
  }

  return { valid: true }
}

// Create preview URL for uploaded files
export function createFilePreview(file: File): string {
  return URL.createObjectURL(file)
}

// Clean up preview URL
export function revokeFilePreview(previewUrl: string): void {
  URL.revokeObjectURL(previewUrl)
}

// Get file type category
export function getFileTypeCategory(file: File): 'image' | 'video' | 'unknown' {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return 'unknown'
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
