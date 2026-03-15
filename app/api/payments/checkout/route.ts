import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { createCheckoutSession } from '@/lib/payments-service'
import { checkoutSessionSchema } from '@/lib/validation'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'

// Stub endpoint for creating a Stripe Checkout session for CASH joins
// In development, returns a mock session and 202 to indicate further action
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting: 10 requests per minute per user for payment routes
    const rateLimitResult = checkRateLimit(`checkout:${session.user.id}`, 'payment')
    
    const rateLimitResponse = createRateLimitResponse(rateLimitResult)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const body = await request.json()
    
    // Validate input with Zod
    const validationResult = checkoutSessionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.issues
      }, { status: 400 })
    }

    const { challengeId, stakeAmount } = validationResult.data

    // Lookup challenge for entry fee percentage
    const sql = createDbConnection()
    const rows = await sql`
      SELECT title, entry_fee_percentage FROM challenges WHERE id = ${challengeId}
    `
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }
    const entryFeePct = parseFloat(rows[0].entry_fee_percentage || '5')
    const entryFee = Number(stakeAmount) * (entryFeePct / 100)
    const total = Number(stakeAmount) + entryFee

    const result = await createCheckoutSession(
      sql,
      String(session.user.id),
      String(challengeId),
      Number(stakeAmount),
      {
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      }
    )
    const statusCode = process.env.STRIPE_SECRET_KEY ? 200 : 202
    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}


