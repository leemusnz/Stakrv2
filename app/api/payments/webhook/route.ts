import { NextRequest, NextResponse } from 'next/server'
import { createDbConnection } from '@/lib/db'
import { processCheckoutCompleted } from '@/lib/payments-service'

// Stripe webhook handler (stub). Ensure idempotency by tracking processed event ids.
export async function POST(request: NextRequest) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
    let event: any = null

    if (stripeSecret && endpointSecret) {
      const rawBody = await request.text()
      const signature = request.headers.get('stripe-signature') || ''
      try {
        const stripeMod: any = await import('stripe')
        const Stripe = stripeMod.default || stripeMod
        const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' })
        event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret)
      } catch (err) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
      }
    } else {
      // Fallback: accept JSON payload without signature (dev/test)
      const payload = await request.json()
      event = payload
    }

    const eventId: string | undefined = event?.id

    if (!eventId) {
      return NextResponse.json({ error: 'Missing event id' }, { status: 400 })
    }

    const sql = await createDbConnection()

    // Idempotency: skip if event already processed
    const result = await processCheckoutCompleted(sql as any, event)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}


