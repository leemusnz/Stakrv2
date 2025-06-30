import { NextRequest, NextResponse } from 'next/server'
import { getPresignedUploadUrl, STORAGE_CONFIG } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType, fileSize } = await request.json()

    console.log('Test upload request:', { fileName, fileType, fileSize })

    // Basic validation
    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json({ 
        error: 'Missing required fields: fileName, fileType, fileSize' 
      }, { status: 400 })
    }

    // Create mock file for S3 upload
    const mockFile = {
      name: fileName,
      type: fileType,
      size: fileSize
    } as File

    console.log('Attempting S3 upload with AWS config:', {
      region: STORAGE_CONFIG.AWS_REGION,
      bucket: STORAGE_CONFIG.AWS_BUCKET_NAME,
      hasCredentials: !!(STORAGE_CONFIG.AWS_ACCESS_KEY_ID && STORAGE_CONFIG.AWS_SECRET_ACCESS_KEY)
    })

    // Test S3 integration
    const { uploadUrl, fileKey, fileUrl } = await getPresignedUploadUrl(
      'test-user',
      'test-challenge',
      mockFile
    )

    console.log('S3 upload successful:', { fileKey, uploadUrl: uploadUrl.substring(0, 50) + '...' })

    return NextResponse.json({
      success: true,
      uploadUrl,
      fileKey,
      fileUrl,
      expiresIn: STORAGE_CONFIG.PRESIGNED_URL_EXPIRY,
      message: 'Test upload URL generated successfully!'
    })

  } catch (error) {
    console.error('Test upload failed:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Test upload failed',
      details: error instanceof Error ? error.stack : 'Unknown error'
    }, { status: 500 })
  }
} 