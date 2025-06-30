import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkStorageHealth, STORAGE_CONFIG } from '@/lib/storage'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admin access
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const healthCheck = await checkStorageHealth()
    
    return NextResponse.json({
      storage: healthCheck,
      config: {
        region: STORAGE_CONFIG.AWS_REGION,
        bucket: STORAGE_CONFIG.AWS_BUCKET_NAME,
        maxFileSize: `${STORAGE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`,
        allowedImageTypes: STORAGE_CONFIG.ALLOWED_IMAGE_TYPES,
        allowedVideoTypes: STORAGE_CONFIG.ALLOWED_VIDEO_TYPES,
        presignedUrlExpiry: `${STORAGE_CONFIG.PRESIGNED_URL_EXPIRY / 3600} hours`,
        fileAccessExpiry: `${STORAGE_CONFIG.FILE_ACCESS_EXPIRY / 3600 / 24} days`,
        hasAwsCredentials: !!(STORAGE_CONFIG.AWS_ACCESS_KEY_ID && STORAGE_CONFIG.AWS_SECRET_ACCESS_KEY),
        hasCloudinaryCredentials: !!(STORAGE_CONFIG.CLOUDINARY_CLOUD_NAME && STORAGE_CONFIG.CLOUDINARY_API_KEY)
      }
    })

  } catch (error) {
    console.error('Storage health check failed:', error)
    return NextResponse.json(
      { 
        error: 'Storage health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
} 