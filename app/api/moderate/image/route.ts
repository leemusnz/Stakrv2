import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { moderationService } from '@/lib/moderation'

export async function POST(request: NextRequest) {
  const isDevelopment = process.env.NODE_ENV !== 'production'
  
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { imageUrl, context = 'profile_picture' } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 })
    }

    console.log('🔍 Server-side image moderation request:', imageUrl, 'context:', context)
    console.log('🔧 Environment:', process.env.NODE_ENV)
    console.log('🔑 OpenAI API key configured:', !!process.env.OPENAI_API_KEY)

    // DISABLED: Development mode override - ensuring real moderation for security
    // if (isDevelopment) {
    //   console.log('🔧 Development mode: Using lenient moderation for better UX')
    //   
    //   // Still call moderation service but override result for development
    //   try {
    //     const moderationResult = await moderationService.moderateImage(imageUrl, context)
    //     console.log('🛡️ Server-side moderation result (dev override):', moderationResult)
    //     
    //     // Force approval in development unless it's a severe case
    //     const forcedResult = {
    //       ...moderationResult,
    //       flagged: false,
    //       action: 'approve' as const,
    //       reason: [...(moderationResult.reason || []), 'dev_mode_override'],
    //       notes: 'Approved in development mode for better UX'
    //     }
    //     
    //     return NextResponse.json({
    //       success: true,
    //       moderation: forcedResult
    //     })
    //   } catch (error) {
    //     console.warn('🔧 Development mode: Moderation service error, approving anyway:', error)
    //     return NextResponse.json({
    //       success: true,
    //       moderation: {
    //         flagged: false,
    //         reason: ['dev_mode_fallback'],
    //         confidence: 0,
    //         action: 'approve',
    //         notes: 'Approved in development mode due to moderation service error'
    //       }
    //     })
    //   }
    // }

    // Production moderation
    const moderationResult = await moderationService.moderateImage(imageUrl, context)
    console.log('🛡️ DETAILED moderation result from OpenAI:')
    console.log('   - Flagged:', moderationResult.flagged)
    console.log('   - Action:', moderationResult.action)
    console.log('   - Confidence:', moderationResult.confidence)
    console.log('   - Reasons:', moderationResult.reason)
    console.log('   - Notes:', moderationResult.notes)
    console.log('   - Raw result:', JSON.stringify(moderationResult, null, 2))

    // Log specific failure reasons for debugging
    if (moderationResult.flagged && moderationResult.reason) {
      console.log('🚨 Moderation blocked image. Reasons:', moderationResult.reason)
      
      const isTechnicalError = moderationResult.reason.some(r => 
        r.includes('moderation_') || r.includes('api_') || r.includes('download_') || r.includes('parse_')
      )
      console.log('🚨 Is technical error?', isTechnicalError)
      
             // TEMPORARY FIX: DISABLED DUE TO SECURITY ISSUE
       // TODO: Re-enable with more restrictive logic once moderation issues are resolved
       if (context === 'profile_picture' && isTechnicalError) {
         console.error('🚨 SECURITY: Technical moderation error detected but NOT overriding due to security concerns')
         console.error('🚨 Original error reasons:', moderationResult.reason)
         
         // DO NOT OVERRIDE - let the real moderation result stand
         // return NextResponse.json({
         //   success: true,
         //   moderation: {
         //     flagged: false,
         //     reason: ['temp_technical_override'],
         //     confidence: 0,
         //     action: 'approve',
         //     notes: 'Temporarily approved due to moderation service technical issues'
         //   }
         // })
       }
    }

    return NextResponse.json({
      success: true,
      moderation: moderationResult
    })

  } catch (error) {
    console.error('Image moderation API error:', error)
    
    // DISABLED: Development mode API error override - ensuring real moderation for security
    // In development, fail gracefully  
    // if (isDevelopment) {
    //   console.warn('🔧 Development mode: Moderation API error, approving anyway')
    //   return NextResponse.json({
    //     success: true,
    //     moderation: {
    //       flagged: false,
    //       reason: ['dev_api_error_override'],
    //       confidence: 0,
    //       action: 'approve',
    //       notes: 'Approved in development mode due to API error'
    //     }
    //   })
    // }
    
    return NextResponse.json({
      error: 'Moderation failed',
      details: isDevelopment ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
