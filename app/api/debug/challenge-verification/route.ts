import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const sql = await createDbConnection()
    
    // Get all challenges with their verification data
    const challenges = await sql`
      SELECT 
        id,
        title,
        verification_type,
        proof_requirements,
        selected_proof_types
      FROM challenges 
      WHERE host_id = ${session.user.id}
      ORDER BY created_at DESC
      LIMIT 10
    `
    
    return NextResponse.json({
      success: true,
      challenges: challenges.map(c => ({
        id: c.id,
        title: c.title,
        verificationType: c.verification_type,
        proofRequirements: c.proof_requirements,
        selectedProofTypes: c.selected_proof_types
      }))
    })
    
  } catch (error) {
    console.error('Debug challenge verification error:', error)
    return NextResponse.json({ 
      error: 'Failed to get challenge verification data',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
