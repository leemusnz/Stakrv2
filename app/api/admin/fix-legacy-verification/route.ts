import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Check admin permissions
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const sql = await createDbConnection()
    
    // Fix legacy email verification
    const result = await sql`
      UPDATE users 
      SET 
        email_verified = TRUE,
        email_verified_at = created_at
      WHERE 
        email_verified = FALSE 
        AND created_at IS NOT NULL
      RETURNING id, email, created_at as verification_date
    `
    
    // Get final counts
    const counts = await sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN email_verified = TRUE THEN 1 END) as verified_users,
        COUNT(CASE WHEN email_verified = FALSE THEN 1 END) as unverified_users
      FROM users
    `

    return NextResponse.json({
      success: true,
      message: `Fixed ${result.length} legacy accounts`,
      updatedAccounts: result.length,
      finalCounts: counts[0],
      updatedUsers: result.map((u: Record<string, any>) => ({
        id: u.id,
        email: u.email,
        verificationDate: u.verification_date
      }))
    })

  } catch (error) {
    console.error('❌ Legacy verification fix error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fix legacy verification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
