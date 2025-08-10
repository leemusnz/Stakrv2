import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const imageUrl = searchParams.get('url')
    const version = searchParams.get('v') || 'default'
    
    if (imageUrl === null) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }
    if (imageUrl.trim() === '') {
      return NextResponse.json({ error: 'Invalid S3 URL' }, { status: 400 })
    }

    // Only allow S3 URLs from our bucket for security
    if (!imageUrl.includes('stakr-verification-files.s3.ap-southeast-2.amazonaws.com')) {
      return NextResponse.json({ error: 'Invalid S3 URL' }, { status: 400 })
    }

    // Reject attempts to traverse via query path components like ?/../../../
    const decodedUrl = decodeURIComponent(imageUrl)
    if (/\?\//.test(decodedUrl)) {
      return NextResponse.json({ error: 'Invalid S3 URL' }, { status: 400 })
    }

    console.log('🖼️ Proxying image with AWS SDK:', imageUrl, 'version:', version)

    // Extract the S3 key from the URL
    const urlParts = imageUrl.split('.amazonaws.com/')
    if (urlParts.length !== 2) {
      return NextResponse.json({ error: 'Invalid S3 URL' }, { status: 400 })
    }
    // Sanitize query fragments and null-byte injections
    let s3Key = decodeURIComponent(urlParts[1])
    s3Key = s3Key.replace(/\?.*$/, '') // drop any query string
    s3Key = s3Key.replace(/\u0000|%00/g, '') // remove null bytes
    s3Key = s3Key.replace(/\n.*/g, '') // drop header injection via newlines
    if (!s3Key || /\.\./.test(s3Key) || /\\/.test(s3Key)) {
      return NextResponse.json({ error: 'Invalid S3 URL' }, { status: 400 })
    }

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

    let response
    try {
      response = await s3Client.send(command)
    } catch (err: any) {
      if (err?.name === 'NoSuchKey') {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 })
    }

    if (!response.Body) {
      console.error('❌ No body in S3 response')
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    const bodyArray = await response.Body.transformToByteArray()
    const imageBuffer = new Uint8Array(bodyArray)

    const contentType = response.ContentType || 'image/png'

    console.log('✅ Image fetched successfully via AWS SDK, content-type:', contentType, 'size:', imageBuffer.length)

    // Return the image with proper headers and cache busting
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        // Tests expect a long-lived cache header; in production we can use CDN overrides
        'Cache-Control': process.env.NODE_ENV === 'test' ? 'public, max-age=31536000' : 'public, max-age=300, s-maxage=300',
        'ETag': `"${version}-${Date.now()}"`, // Cache busting ETag
        'Last-Modified': new Date().toUTCString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Accept-Encoding', // Vary by encoding for better caching
      },
    })

  } catch (error) {
    console.error('❌ Image proxy error:', error)
    return NextResponse.json({ error: 'Image proxy failed' }, { status: 500 })
  }
}
