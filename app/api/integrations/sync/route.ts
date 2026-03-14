import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { triggerAutoSync, SYNC_TRIGGERS, requiresAutoSync, type ChallengeData, syncChallengeData, type SyncResult } from '@/lib/auto-sync-service'
import { createDbConnection } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const challengeId: string | undefined = body?.challengeId
    const trigger: keyof typeof SYNC_TRIGGERS = body?.trigger || 'manual_sync'
    // Optional provider targeting (not strictly required by backend sync yet, but accepted for API ergonomics)
    const provider: string | undefined = body?.provider // e.g. 'strava', 'spotify'
    const integrationType: 'wearable' | 'app' | undefined = body?.type
    
    // Validate trigger
    if (!Object.values(SYNC_TRIGGERS).includes(trigger)) {
      return NextResponse.json({ error: 'Invalid sync trigger' }, { status: 400 })
    }
    
    // Single-challenge path (legacy)
    if (challengeId) {
      const results = await triggerAutoSync(challengeId, session.user.id, trigger)
      const successfulSyncs = results.filter(r => r.success).length
      const failedSyncs = results.filter(r => !r.success).length
      return NextResponse.json({
        success: true,
        message: `Synchronization completed: ${successfulSyncs} successful, ${failedSyncs} failed`,
        results,
        summary: {
          total: results.length,
          successful: successfulSyncs,
          failed: failedSyncs,
          providers: results.map(r => r.provider).filter(Boolean)
        }
      })
    }

    // Global/per-provider path: sync for all of the user's active auto-sync challenges
    const sql = await createDbConnection()

    // Fetch user's active challenges
    const raw = await sql`
      SELECT c.id, c.title, c.description, c.verification_type, c.proof_requirements, c.ai_analysis
      FROM challenges c
      JOIN challenge_participants cp ON cp.challenge_id = c.id
      WHERE cp.user_id = ${session.user.id} AND cp.completion_status = 'active'
    `

    const challenges: ChallengeData[] = (raw || []).map((row: any) => ({
      id: row.id,
      verificationType: row.verification_type,
      verificationRequirements: typeof row.proof_requirements === 'string' ? (() => { try { return JSON.parse(row.proof_requirements) } catch { return null } })() : row.proof_requirements,
      selectedProofTypes: undefined
    }))

    const autoChallenges = challenges.filter(c => requiresAutoSync(c))
    if (autoChallenges.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active challenges require auto-sync',
        results: [],
        summary: { total: 0, successful: 0, failed: 0, providers: [] }
      })
    }

    const allResults: SyncResult[] = []
    for (const ch of autoChallenges) {
      const results = await syncChallengeData(ch.id, session.user.id, trigger)
      // Optionally filter by provider in summary display only (actual sync currently runs all user's providers)
      const filtered = provider ? results.filter(r => r.provider === provider) : results
      allResults.push(...filtered)
    }
    
    const successfulSyncs = allResults.filter(r => r.success).length
    const failedSyncs = allResults.filter(r => !r.success).length
    
    return NextResponse.json({
      success: true,
      message: `Synchronization completed: ${successfulSyncs} successful, ${failedSyncs} failed`,
      results: allResults,
      summary: {
        total: allResults.length,
        successful: successfulSyncs,
        failed: failedSyncs,
        providers: allResults.map(r => r.provider).filter(Boolean)
      }
    })
    
  } catch (error) {
    console.error('Sync API error:', error)
    return NextResponse.json({ 
      error: 'Failed to sync data',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}
