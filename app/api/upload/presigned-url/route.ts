import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPresignedUploadUrl, STORAGE_CONFIG } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    // TEMPORARILY DISABLE AUTH FOR TESTING
    // const session = await getServerSession(authOptions)
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    console.log('Upload request received')

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

    // Get presigned URL
    const { uploadUrl, fileKey, fileUrl } = await getPresignedUploadUrl(
      'test-user-id', // session.user.id,
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
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate upload URL',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 })
  }
}
