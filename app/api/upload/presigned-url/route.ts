import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPresignedUploadUrl, STORAGE_CONFIG } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    // Re-enable authentication for production
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Upload request received for user:', session.user.id)

    const { fileName, fileType, fileSize, challengeId } = await request.json()

    console.log('Request data:', { fileName, fileType, fileSize, challengeId })

    // Validation
    if (!fileName || !fileType || !fileSize || !challengeId) {
      return NextResponse.json({ 
        error: 'Missing required fields: fileName, fileType, fileSize, challengeId' 
      }, { status: 400 })
    }

    // File size validation
    if (fileSize > STORAGE_CONFIG.MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File size exceeds ${STORAGE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB limit` 
      }, { status: 400 })
    }

    // File type validation
    const isImage = STORAGE_CONFIG.ALLOWED_IMAGE_TYPES.includes(fileType)
    const isVideo = STORAGE_CONFIG.ALLOWED_VIDEO_TYPES.includes(fileType)
    
    if (!isImage && !isVideo) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, WebP images and MP4, QuickTime, WebM videos are allowed.' 
      }, { status: 400 })
    }

    // Create a mock File object for the storage service
    const mockFile = {
      name: fileName,
      type: fileType,
      size: fileSize
    } as File

    console.log('AWS Config Check:', {
      region: STORAGE_CONFIG.AWS_REGION,
      bucket: STORAGE_CONFIG.AWS_BUCKET_NAME,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
    })

    // Check if AWS credentials are available
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('❌ AWS credentials not configured')
      return NextResponse.json({ 
        error: 'File storage service not available. Please contact support.',
        code: 'STORAGE_CONFIG_ERROR'
      }, { status: 503 })
    }

    // Get presigned URL using real user ID
    const { uploadUrl, fileKey, fileUrl } = await getPresignedUploadUrl(
      session.user.id,
      challengeId,
      mockFile
    )

    console.log('S3 Success:', { fileKey, uploadUrl: uploadUrl.substring(0, 50) + '...' })

    return NextResponse.json({
      uploadUrl,
      fileKey,
      fileUrl,
      expiresIn: STORAGE_CONFIG.PRESIGNED_URL_EXPIRY,
      message: 'SUCCESS: S3 integration working!'
    })

  } catch (error) {
    console.error('Presigned URL generation failed:', error)
    
    // Provide more specific error messages for common issues
    let errorMessage = 'Failed to generate upload URL'
    let statusCode = 500
    
    if (error instanceof Error) {
      if (error.message.includes('AWS credentials not configured')) {
        errorMessage = 'File storage service unavailable. Please try again later or contact support.'
        statusCode = 503
      } else if (error.message.includes('region')) {
        errorMessage = 'File storage configuration error. Please contact support.'
        statusCode = 503
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      code: 'UPLOAD_ERROR',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: statusCode })
  }
}
