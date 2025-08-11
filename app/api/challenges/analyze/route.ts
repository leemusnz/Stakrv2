import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AIChallengeAnalyzer, type ChallengeAnalysisRequest } from '@/lib/ai-challenge-analyzer'

export async function POST(request: NextRequest) {
  try {
    // Soft-auth: analysis is allowed without a session to avoid blocking creation UX
    const session = await getServerSession(authOptions)

    // Parse request body
    const body: ChallengeAnalysisRequest = await request.json()
    
    // Validate required fields
    if (!body.title || !body.description) {
      return NextResponse.json({ 
        error: 'Title and description are required' 
      }, { status: 400 })
    }

    console.log('🤖 Analyzing challenge:', body.title)
  console.log('📝 Description includes Additional Context:', body.description?.includes('Additional Context:'))
  console.log('📝 Description length:', body.description?.length)
  console.log('📝 Request keys:', Object.keys(body))
  console.log('📝 Has stakes:', !!body.minStake)
  console.log('📝 Has team mode:', !!body.enableTeamMode)
  console.log('📝 Has difficulty:', !!body.difficulty)
  console.log('🛠️ Has dev settings:', !!body.devSettings)

    // Log dev settings if present
    if (body.devSettings) {
      console.log('🛠️ Dev settings:', body.devSettings)
    }

    // Analyze challenge with AI
    const analysis = await AIChallengeAnalyzer.analyzeChallengeDescription(body)
    
    console.log('✅ Challenge analysis completed:', {
      dailyRequirement: analysis.dailyRequirement,
      confidence: analysis.confidence,
      validationMethod: analysis.validationMethod
    })

    // Generate user-friendly summary  
    const summaryText = `AI understands your challenge as: "${analysis.interpretation}"`

    return NextResponse.json({
      success: true,
      analysis,
      summaryText,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Challenge analysis error:', error)
    
    return NextResponse.json({
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Allow OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
