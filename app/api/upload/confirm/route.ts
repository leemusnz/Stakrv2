import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    console.log('📝 Confirming upload:', {
      fileKey,
      fileUrl,
      fileName,
      fileType,
      fileSize,
      challengeId,
      userId: session.user.id
    })

    const sql = await createDbConnection()

    // Enhanced duplicate detection
    if (metadata?.hash) {
      console.log('🔍 Checking for duplicate files with hash:', metadata.hash)
      
      const duplicates = await sql`
        SELECT id, file_key, user_id, challenge_id, created_at
        FROM file_uploads 
        WHERE file_hash = ${metadata.hash}
        AND user_id = ${session.user.id}
        ORDER BY created_at DESC
        LIMIT 1
      `

      if (duplicates.length > 0) {
        const duplicate = duplicates[0]
        console.log('⚠️ Duplicate file detected:', duplicate)
        
        return NextResponse.json({
          success: false,
          error: 'Duplicate file detected',
          duplicate: {
            uploadedAt: duplicate.created_at,
            challengeId: duplicate.challenge_id,
            fileKey: duplicate.file_key
          }
        }, { status: 409 })
      }
    }

    // Store comprehensive file metadata
    const uploadRecord = await sql`
      INSERT INTO file_uploads (
        user_id,
        challenge_id,
        checkin_id,
        session_id,
        file_key,
        file_url,
        original_filename,
        sanitized_filename,
        file_type,
        file_size,
        file_hash,
        actual_mime_type,
        dimensions,
        risk_score,
        security_flags,
        validation_errors,
        validation_warnings,
        gesture_detected,
        word_detected,
        verification_confidence,
        metadata,
        upload_status,
        created_at
      ) VALUES (
        ${session.user.id},
        ${challengeId},
        ${checkinId || null},
        ${sessionId || null},
        ${fileKey},
        ${fileUrl},
        ${fileName},
        ${metadata?.sanitizedName || fileName},
        ${fileType},
        ${fileSize},
        ${metadata?.hash || null},
        ${metadata?.actualMimeType || null},
        ${metadata?.dimensions ? JSON.stringify(metadata.dimensions) : null},
        ${metadata?.riskScore || 0},
        ${metadata?.securityFlags ? JSON.stringify(metadata.securityFlags) : null},
        ${metadata?.errors ? JSON.stringify(metadata.errors) : null},
        ${metadata?.warnings ? JSON.stringify(metadata.warnings) : null},
        ${gestureDetected || false},
        ${wordDetected || false},
        ${verificationConfidence || null},
        ${metadata ? JSON.stringify(metadata) : null},
        'completed',
        NOW()
      )
      RETURNING id, created_at
    `

    console.log('✅ Upload confirmed and recorded in database:', uploadRecord[0])

    // Update user storage usage statistics
    await sql`
      INSERT INTO user_storage_stats (user_id, total_files, total_size, last_upload)
      VALUES (${session.user.id}, 1, ${fileSize}, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        total_files = user_storage_stats.total_files + 1,
        total_size = user_storage_stats.total_size + ${fileSize},
        last_upload = NOW()
    `

    // Log verification activity if this is proof submission
    if (challengeId) {
      await sql`
        INSERT INTO verification_activities (
          user_id,
          challenge_id,
          activity_type,
          file_upload_id,
          metadata,
          created_at
        ) VALUES (
          ${session.user.id},
          ${challengeId},
          'proof_uploaded',
          ${uploadRecord[0].id},
          ${JSON.stringify({
            fileName,
            fileType,
            fileSize,
            riskScore: metadata?.riskScore || 0,
            hasSecurityFlags: (metadata?.securityFlags || []).length > 0
          })},
          NOW()
        )
      `
    }

    return NextResponse.json({
      success: true,
      uploadId: uploadRecord[0].id,
      message: 'Upload confirmed successfully',
      metadata: {
        riskScore: metadata?.riskScore || 0,
        securityFlags: metadata?.securityFlags || [],
        warnings: metadata?.warnings || []
      }
    })

  } catch (error) {
    console.error('💥 Upload confirmation failed:', error)
    return NextResponse.json({
      error: 'Failed to confirm upload',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
