import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { triggerAutoSync, SYNC_TRIGGERS } from '@/lib/auto-sync-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { challengeId, trigger = 'manual_sync' } = await request.json()
    
    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 })
    }
    
    // Validate trigger
    if (!Object.values(SYNC_TRIGGERS).includes(trigger)) {
      return NextResponse.json({ error: 'Invalid sync trigger' }, { status: 400 })
    }
    
    console.log(`🔄 Manual sync requested for challenge ${challengeId} by user ${session.user.id}`)
    
    // Perform the sync
    const results = await triggerAutoSync(challengeId, session.user.id, trigger)
    
    // Count successful syncs
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
    
  } catch (error) {
    console.error('Sync API error:', error)
    return NextResponse.json({ 
      error: 'Failed to sync data',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}