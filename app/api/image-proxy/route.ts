import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const imageUrl = searchParams.get('url')
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing image URL' }, { status: 400 })
    }

    // Only allow S3 URLs from our bucket for security
    if (!imageUrl.includes('stakr-verification-files.s3.ap-southeast-2.amazonaws.com')) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 })
    }

    console.log('🖼️ Proxying image with AWS SDK:', imageUrl)

    // Extract the S3 key from the URL
    const urlParts = imageUrl.split('.amazonaws.com/')
    if (urlParts.length !== 2) {
      return NextResponse.json({ error: 'Invalid S3 URL format' }, { status: 400 })
    }
    const s3Key = urlParts[1]

    console.log('📁 S3 Key extracted:', s3Key)

    // Configure S3 client with credentials
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-southeast-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })

    console.log('🔐 AWS Config:', {
      region: process.env.AWS_REGION || 'ap-southeast-2',
      bucket: 'stakr-verification-files',
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
    })

    // Get the object from S3 using authenticated request
    const command = new GetObjectCommand({
      Bucket: 'stakr-verification-files',
      Key: s3Key,
    })

    const response = await s3Client.send(command)

    if (!response.Body) {
      console.error('❌ No body in S3 response')
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    const reader = response.Body.transformToWebStream().getReader()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }

    const imageBuffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
    let offset = 0
    for (const chunk of chunks) {
      imageBuffer.set(chunk, offset)
      offset += chunk.length
    }

    const contentType = response.ContentType || 'image/png'

    console.log('✅ Image fetched successfully via AWS SDK, content-type:', contentType, 'size:', imageBuffer.length)

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('❌ Image proxy error:', error)
    return NextResponse.json({ 
      error: 'Image proxy failed', 
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
} 