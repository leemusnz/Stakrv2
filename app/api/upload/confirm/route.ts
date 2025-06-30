import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // TEMPORARILY DISABLE AUTH FOR TESTING
    // const session = await getServerSession(authOptions)
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { 
      fileKey, 
      fileUrl, 
      fileName, 
      fileType, 
      fileSize, 
      challengeId,
      checkinId,
      sessionId,
      gestureDetected,
      wordDetected,
      verificationConfidence,
      metadata
    } = await request.json()

    // Validation
    if (!fileKey || !fileUrl || !fileName || !fileType || !fileSize || !challengeId) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // For now, return success without database insertion (until tables are migrated)
    const mockFileRecord = {
      id: `file_${Date.now()}`,
      file_key: fileKey,
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType.startsWith('video') ? 'video' : 'photo',
      file_size: fileSize,
      mime_type: fileType,
      user_id: 'test-user-id', // session.user.id,
      challenge_id: challengeId,
      checkin_id: checkinId || null,
      session_id: sessionId || null,
      gesture_detected: gestureDetected || null,
      word_detected: wordDetected || null,
      verification_confidence: verificationConfidence || null,
      metadata: metadata || null,
      uploaded_at: new Date().toISOString()
    }

    console.log('File upload confirmed:', mockFileRecord)

    return NextResponse.json({
      success: true,
      file: mockFileRecord
    })

  } catch (error) {
    console.error('File upload confirmation failed:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to confirm file upload' 
    }, { status: 500 })
  }
}
