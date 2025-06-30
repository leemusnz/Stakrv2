import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { S3Client } from '@aws-sdk/client-s3'

// File storage configuration
export const STORAGE_CONFIG = {
  // AWS S3 Configuration
  AWS_REGION: process.env.AWS_REGION || 'ap-southeast-2',
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME || 'stakr-verification-files',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  
  // Cloudinary Configuration (alternative)
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  
  // File limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/webm'],
  
  // URL expiration
  PRESIGNED_URL_EXPIRY: 15 * 60, // 15 minutes
  FILE_ACCESS_EXPIRY: 7 * 24 * 3600, // 7 days
  
  // File organization
  UPLOAD_FOLDERS: {
    PROOF_IMAGES: 'proof-images',
    PROOF_VIDEOS: 'proof-videos',
    PROFILE_IMAGES: 'profile-images'
  }
}

// Initialize S3 Client
let s3Client: S3Client | null = null

function getS3Client(): S3Client {
  if (!s3Client) {
    if (!STORAGE_CONFIG.AWS_ACCESS_KEY_ID || !STORAGE_CONFIG.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured')
    }
    
    s3Client = new S3Client({
      region: STORAGE_CONFIG.AWS_REGION,
      credentials: {
        accessKeyId: STORAGE_CONFIG.AWS_ACCESS_KEY_ID,
        secretAccessKey: STORAGE_CONFIG.AWS_SECRET_ACCESS_KEY,
      },
    })
  }
  return s3Client
}

// File validation
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Size validation
  if (file.size > STORAGE_CONFIG.MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File size exceeds ${STORAGE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB limit` 
    }
  }
  
  // Type validation
  const isImage = STORAGE_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)
  const isVideo = STORAGE_CONFIG.ALLOWED_VIDEO_TYPES.includes(file.type)
  
  if (!isImage && !isVideo) {
    return { 
      valid: false, 
      error: 'Invalid file type. Only JPEG, PNG, WebP images and MP4, QuickTime, WebM videos are allowed.' 
    }
  }
  
  // Anti-fraud validation
  if (file.name.match(/^(stock|shutterstock|getty|adobe|istockphoto|unsplash|pexels|fake|test|sample|demo|generated|ai_?generated)/i)) {
    return { 
      valid: false, 
      error: 'File name suggests stock or generated content' 
    }
  }
  
  return { valid: true }
}

// Generate unique file key
export function generateFileKey(userId: string, challengeId: string, fileType: 'photo' | 'video', fileExtension: string): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  const folder = fileType === 'video' ? 'videos' : 'images'
  
  return `verification-files/${folder}/${challengeId}/${userId}/${timestamp}-${randomId}.${fileExtension}`
}

// Get file extension from MIME type
export function getFileExtension(mimeType: string): string {
  const mimeToExt: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm'
  }
  
  return mimeToExt[mimeType] || 'bin'
}

// AWS S3 Functions
export async function getPresignedUploadUrl(
  userId: string, 
  challengeId: string, 
  file: File
): Promise<{ uploadUrl: string; fileKey: string; fileUrl: string }> {
  const client = getS3Client()
  
  const validation = validateFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }
  
  const fileExtension = getFileExtension(file.type)
  const fileKey = generateFileKey(userId, challengeId, file.type.startsWith('video') ? 'video' : 'photo', fileExtension)
  
  const command = new PutObjectCommand({
    Bucket: STORAGE_CONFIG.AWS_BUCKET_NAME,
    Key: fileKey,
    ContentType: file.type,
    ContentLength: file.size,
    Metadata: {
      'user-id': userId,
      'challenge-id': challengeId,
      'upload-timestamp': Date.now().toString(),
      'original-filename': file.name
    }
  })
  
  const uploadUrl = await getSignedUrl(client, command, { 
    expiresIn: STORAGE_CONFIG.PRESIGNED_URL_EXPIRY 
  })
  
  const fileUrl = `https://${STORAGE_CONFIG.AWS_BUCKET_NAME}.s3.${STORAGE_CONFIG.AWS_REGION}.amazonaws.com/${fileKey}`
  
  return { uploadUrl, fileKey, fileUrl }
}

export async function getPresignedDownloadUrl(fileKey: string): Promise<string> {
  const client = getS3Client()
  
  const command = new GetObjectCommand({
    Bucket: STORAGE_CONFIG.AWS_BUCKET_NAME,
    Key: fileKey,
  })
  
  return await getSignedUrl(client, command, { 
    expiresIn: STORAGE_CONFIG.FILE_ACCESS_EXPIRY 
  })
}

export async function deleteFile(fileKey: string): Promise<void> {
  const client = getS3Client()
  
  const command = new DeleteObjectCommand({
    Bucket: STORAGE_CONFIG.AWS_BUCKET_NAME,
    Key: fileKey,
  })
  
  await client.send(command)
}

// Cloudinary Alternative (for those who prefer it)
export async function uploadToCloudinary(file: File, userId: string, challengeId: string): Promise<{ fileUrl: string; publicId: string }> {
  if (!STORAGE_CONFIG.CLOUDINARY_CLOUD_NAME || !STORAGE_CONFIG.CLOUDINARY_API_KEY || !STORAGE_CONFIG.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials not configured')
  }
  
  const validation = validateFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'stakr_verification') // You need to create this preset in Cloudinary
  formData.append('folder', `verification-files/${challengeId}`)
  formData.append('public_id', `${userId}_${Date.now()}`)
  formData.append('context', `user_id=${userId}|challenge_id=${challengeId}`)
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${STORAGE_CONFIG.CLOUDINARY_CLOUD_NAME}/${file.type.startsWith('video') ? 'video' : 'image'}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to upload to Cloudinary')
  }
  
  const result = await response.json()
  
  return {
    fileUrl: result.secure_url,
    publicId: result.public_id
  }
}

// File metadata extraction
export function extractFileMetadata(file: File): any {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    lastModifiedDate: new Date(file.lastModified).toISOString()
  }
}

// Storage health check
export async function checkStorageHealth(): Promise<{ healthy: boolean; service: string; error?: string }> {
  try {
    if (STORAGE_CONFIG.AWS_ACCESS_KEY_ID && STORAGE_CONFIG.AWS_SECRET_ACCESS_KEY) {
      const client = getS3Client()
      // Simple health check - try to list objects (even if none exist)
      await client.send(new GetObjectCommand({
        Bucket: STORAGE_CONFIG.AWS_BUCKET_NAME,
        Key: 'health-check-non-existent-key'
      })).catch(() => {}) // Expected to fail, just testing connection
      
      return { healthy: true, service: 'AWS S3' }
    } else if (STORAGE_CONFIG.CLOUDINARY_CLOUD_NAME) {
      return { healthy: true, service: 'Cloudinary' }
    } else {
      return { healthy: false, service: 'None', error: 'No storage service configured' }
    }
  } catch (error) {
    return { 
      healthy: false, 
      service: 'AWS S3', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
} 