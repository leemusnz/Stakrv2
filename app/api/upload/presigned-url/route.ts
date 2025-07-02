import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPresignedUploadUrl, STORAGE_CONFIG } from '@/lib/storage'
import { validateFileEnhanced } from '@/lib/enhanced-file-validation'

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

    // Create a mock File object for enhanced validation
    const mockFile = {
      name: fileName,
      type: fileType,
      size: fileSize,
      lastModified: Date.now(),
      arrayBuffer: async () => new ArrayBuffer(0),
      slice: () => new Blob(),
      stream: () => new ReadableStream(),
      text: async () => ''
    } as File

    // Enhanced validation with security checks
    console.log('🔒 Running enhanced file validation...')
    const validationResult = await validateFileEnhanced(mockFile)
    
    if (!validationResult.valid) {
      console.log('❌ Enhanced validation failed:', {
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        riskScore: validationResult.riskScore,
        securityFlags: validationResult.securityFlags
      })
      
      return NextResponse.json({ 
        error: 'File validation failed',
        details: validationResult.errors,
        warnings: validationResult.warnings,
        riskScore: validationResult.riskScore,
        securityFlags: validationResult.securityFlags
      }, { status: 400 })
    }
    
    if (validationResult.warnings.length > 0) {
      console.log('⚠️ Validation warnings:', validationResult.warnings)
    }
    
    console.log('✅ Enhanced validation passed with risk score:', validationResult.riskScore)

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
