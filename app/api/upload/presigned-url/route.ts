import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPresignedUploadUrl, STORAGE_CONFIG } from '@/lib/storage'
import { validateFileEnhanced } from '@/lib/enhanced-file-validation'
import { uploadPresignedUrlSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    // Re-enable authentication for production
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }


    const body = await request.json()

    // Validate input with Zod
    const validationResult = uploadPresignedUrlSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.issues
      }, { status: 400 })
    }

    const { fileName, fileType, fileSize, challengeId } = validationResult.data

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
    const fileValidation = await validateFileEnhanced(mockFile)
    
    if (!fileValidation.valid) {
      
      return NextResponse.json({ 
        error: 'File validation failed',
        details: fileValidation.errors,
        warnings: fileValidation.warnings,
        riskScore: fileValidation.riskScore,
        securityFlags: fileValidation.securityFlags
      }, { status: 400 })
    }
    
    if (validationResult.warnings.length > 0) {
    }
    


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
