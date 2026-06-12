// Payments service - extracts logic from route handlers for easier testing
// Functions here avoid importing next/server or next-auth, and operate on provided sql and env.

import type { NeonQueryFunction } from '@neondatabase/serverless'

type SqlTag = NeonQueryFunction<false, false>

export interface CheckoutSessionResult {
  success: boolean
  provider: 'stripe'
  mode: 'checkout'
  sessionId: string
  amount: number
  currency: 'usd'
  checkoutUrl: string
  message: string
}

export async function createCheckoutSession(
  sql: SqlTag,
  userId: string,
  challengeId: string,
  stakeAmount: number,
  env: Partial<Record<string, string | undefined>> = {}
): Promise<CheckoutSessionResult> {
  const rows = await sql`
    SELECT title, entry_fee_percentage FROM challenges WHERE id = ${challengeId}
  `
  if (rows.length === 0) {
    throw new Error('Challenge not found')
  }
  const entryFeePct = parseFloat(rows[0].entry_fee_percentage || '5')
  const entryFee = Number(stakeAmount) * (entryFeePct / 100)
  const total = Number(stakeAmount) + entryFee

  const baseUrl = env.NEXT_PUBLIC_BASE_URL || env.NEXTAUTH_URL || 'http://localhost:3000'
  const stripeSecret = env.STRIPE_SECRET_KEY
  let sessionId = ''
  let checkoutUrl = ''
  let message = ''

  if (stripeSecret) {
    try {
      const stripeMod: any = await import('stripe')
      const Stripe = stripeMod.default || stripeMod
      const stripe = new Stripe(stripeSecret as string, { apiVersion: '2024-06-20' })
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: rows[0].title || 'Challenge Commitment',
                description: `Stake + entry fee (${entryFeePct.toFixed(2)}%)`,
              },
              unit_amount: Math.round(total * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/wallet?payment=success`,
        cancel_url: `${baseUrl}/challenge/${challengeId}?payment=cancelled`,
        metadata: {
          userId: String(userId),
          challengeId: String(challengeId),
          stakeAmount: String(stakeAmount),
          entryFee: String(entryFee),
        },
      })
      sessionId = session.id
      checkoutUrl = session.url || `${baseUrl}/payments/checkout?session_id=${sessionId}`
      message = 'Stripe Checkout session created'
    } catch (stripeError) {
      // With a live Stripe key configured, a failure here must surface to the
      // caller — silently issuing a mock checkout URL would tell the user a
      // real-money payment is underway when nothing was created.
      throw stripeError instanceof Error
        ? stripeError
        : new Error('Stripe checkout session creation failed')
    }
  } else {
    sessionId = `cs_test_${Date.now()}`
    checkoutUrl = `${baseUrl}/payments/checkout?session_id=${sessionId}`
    message = 'Checkout session created (mock). Complete payment to finalize your join.'
  }

  await sql`
    INSERT INTO transactions (
      user_id, challenge_id, transaction_type, amount, platform_revenue, stripe_payment_id, status, created_at
    ) VALUES (
      ${userId}, ${challengeId}, 'cash_join', ${total}, ${entryFee}, ${sessionId}, 'pending', NOW()
    )
    ON CONFLICT (stripe_payment_id) DO NOTHING
  `

  return {
    success: true,
    provider: 'stripe',
    mode: 'checkout',
    sessionId,
    amount: total,
    currency: 'usd',
    checkoutUrl,
    message,
  }
}

export interface CheckoutCompletedEvent {
  id: string
  type: string
  data: { object: { id?: string; payment_intent?: string; metadata?: Record<string, string> } }
}

export async function processCheckoutCompleted(
  sql: SqlTag,
  event: CheckoutCompletedEvent
): Promise<{ success: boolean }> {
  const eventId = event?.id
  if (!eventId) return { success: false }

  // Ensure idempotency table exists; ignore errors
  try {
    await sql`CREATE TABLE IF NOT EXISTS webhook_events (id text primary key, type text, received_at timestamptz default now())`
  } catch {}

  const existing = await sql`SELECT id FROM webhook_events WHERE id = ${eventId}`
  if (existing.length > 0) {
    return { success: true }
  }
  await sql`INSERT INTO webhook_events (id, type) VALUES (${eventId}, ${event?.type || 'unknown'})`

  if (event.type === 'checkout.session.completed') {
    const data = event.data?.object || {}
    const sessionId = data.id
    if (!sessionId) {
      return { success: true }
    }

    // SECURITY: identities and amounts come from the pending transaction row
    // recorded when the checkout session was created — never from event
    // metadata, which is attacker-influencable and was previously trusted.
    const pending = await sql`
      SELECT user_id, challenge_id, amount, platform_revenue
      FROM transactions
      WHERE stripe_payment_id = ${sessionId} AND transaction_type = 'cash_join'
      LIMIT 1
    `
    if (pending.length === 0) {
      console.error(
        `Stripe webhook: no recorded checkout for session ${sessionId}; ignoring event ${eventId}`,
      )
      return { success: true }
    }

    const userId = pending[0].user_id
    const challengeId = pending[0].challenge_id
    const total = parseFloat(pending[0].amount)
    const entryFee = parseFloat(pending[0].platform_revenue) || 0
    const stakeAmount = total - entryFee

    if (userId && challengeId && stakeAmount > 0) {
      const existingParticipant = await sql`
        SELECT id FROM challenge_participants WHERE challenge_id = ${challengeId} AND user_id = ${userId}
      `
      if (existingParticipant.length === 0) {
        await sql`
          INSERT INTO challenge_participants (
            challenge_id, user_id, stake_amount, entry_fee_paid, insurance_purchased, insurance_fee_paid, completion_status, joined_at
          ) VALUES (
            ${challengeId}, ${userId}, ${stakeAmount}, ${entryFee}, false, 0, 'active', NOW()
          )
        `
      }
      await sql`UPDATE transactions SET status = 'succeeded' WHERE stripe_payment_id = ${sessionId}`
    }
  }
  return { success: true }
}


