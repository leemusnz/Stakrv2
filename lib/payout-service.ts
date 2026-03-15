/**
 * Payout Service - Handles Stripe Connect payouts for withdrawals
 * Integrates with Stripe Connect to transfer funds to connected accounts
 */

type SqlTag = any // Neon SQL query function type

export interface PayoutResult {
  success: boolean
  transferId?: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  error?: string
  message: string
}

/**
 * Create a Stripe Connect transfer (payout) to user's connected bank account
 * 
 * Prerequisites:
 * - User must have a connected Stripe Connect account (stripeConnectAccountId)
 * - User's bank account must be verified in Stripe Connect
 * 
 * @param stripe - Stripe client instance
 * @param userId - User ID requesting withdrawal
 * @param stripeConnectAccountId - User's Stripe Connect account ID
 * @param amount - Amount in USD cents
 * @param description - Transaction description
 * @returns PayoutResult with transfer details
 */
export async function createStripeTransfer(
  stripe: any,
  userId: string,
  stripeConnectAccountId: string,
  amountCents: number,
  description: string
): Promise<PayoutResult> {
  try {
    if (!stripeConnectAccountId) {
      return {
        success: false,
        amount: amountCents / 100,
        status: 'failed',
        error: 'NO_STRIPE_ACCOUNT',
        message: 'User does not have a connected Stripe account',
      }
    }

    // Create a transfer to the connected account
    // Transfers move funds from platform account to the connected account
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'usd',
      destination: stripeConnectAccountId,
      description: description,
      metadata: {
        userId,
        type: 'withdrawal_payout',
      },
    })

    return {
      success: true,
      transferId: transfer.id,
      amount: amountCents / 100,
      status: transfer.status === 'succeeded' ? 'completed' : 'pending',
      message: `Transfer ${transfer.id} created successfully`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Stripe transfer error for user ${userId}:`, errorMessage)

    return {
      success: false,
      amount: amountCents / 100,
      status: 'failed',
      error: errorMessage,
      message: `Failed to create transfer: ${errorMessage}`,
    }
  }
}

/**
 * Process a withdrawal with Stripe Connect payout
 * 
 * Steps:
 * 1. Verify user has Stripe Connect account
 * 2. Create Stripe transfer
 * 3. Update transaction status
 * 4. Return result
 * 
 * @param sql - Database connection
 * @param stripe - Stripe client instance
 * @param userId - User ID
 * @param amount - Amount in USD (dollars, not cents)
 * @param transactionId - Database transaction ID
 * @param env - Environment variables
 * @returns PayoutResult
 */
export async function processWithdrawalPayout(
  sql: SqlTag,
  stripe: any,
  userId: string,
  amount: number,
  transactionId: string,
  env: Partial<Record<string, string | undefined>> = {}
): Promise<PayoutResult> {
  try {
    // Get user's Stripe Connect account
    const userResult = await sql`
      SELECT stripe_connect_account_id, email, name 
      FROM users 
      WHERE id = ${userId}
    `

    if (userResult.length === 0) {
      return {
        success: false,
        amount,
        status: 'failed',
        error: 'USER_NOT_FOUND',
        message: 'User not found in database',
      }
    }

    const user = userResult[0]
    const stripeConnectAccountId = user.stripe_connect_account_id

    // Check if user has Stripe Connect enabled
    if (!stripeConnectAccountId) {
      // For development/testing without Stripe Connect, keep the transaction in pending state
      // In production, this should require Stripe Connect setup
      if (env.ALLOW_MOCK_PAYOUTS === 'true') {
        console.log(
          `⚠️ Mock payout mode: User ${userId} has no Stripe Connect account. ` +
          `Transfer would be: $${amount} (mock)`
        )

        // Update transaction to completed in mock mode
        await sql`
          UPDATE transactions 
          SET status = 'completed'
          WHERE id = ${transactionId}
        `

        return {
          success: true,
          transferId: `mock_transfer_${Date.now()}`,
          amount,
          status: 'completed',
          message: 'Withdrawal processed in mock mode (no Stripe Connect)',
        }
      }

      // Production: require Stripe Connect
      await sql`
        UPDATE transactions 
        SET status = 'failed'
        WHERE id = ${transactionId}
      `

      return {
        success: false,
        amount,
        status: 'failed',
        error: 'NO_STRIPE_CONNECT',
        message: 'User must connect their Stripe account to receive payouts',
      }
    }

    // Proceed with real Stripe transfer
    const amountCents = Math.round(amount * 100)
    const transferResult = await createStripeTransfer(
      stripe,
      userId,
      stripeConnectAccountId,
      amountCents,
      `Stakr withdrawal: $${amount.toFixed(2)} to ${user.email}`
    )

    // Update transaction with Stripe transfer ID
    if (transferResult.transferId) {
      await sql`
        UPDATE transactions 
        SET 
          status = ${transferResult.status === 'completed' ? 'completed' : 'processing'},
          stripe_payment_id = ${transferResult.transferId}
        WHERE id = ${transactionId}
      `
    } else {
      // Transfer failed
      await sql`
        UPDATE transactions 
        SET status = 'failed'
        WHERE id = ${transactionId}
      `
    }

    return transferResult
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Withdrawal payout error for user ${userId}:`, errorMessage)

    // Mark transaction as failed
    try {
      await sql`
        UPDATE transactions 
        SET status = 'failed'
        WHERE id = ${transactionId}
      `
    } catch (dbError) {
      console.error('Failed to update transaction status:', dbError)
    }

    return {
      success: false,
      amount,
      status: 'failed',
      error: errorMessage,
      message: `Withdrawal payout failed: ${errorMessage}`,
    }
  }
}

/**
 * Verify user has Stripe Connect account setup
 * Useful for checking withdrawal eligibility before processing
 */
export async function getUserPayoutStatus(
  sql: SqlTag,
  userId: string
): Promise<{
  canWithdraw: boolean
  stripeConnectEnabled: boolean
  stripeConnectAccountId?: string
  message: string
}> {
  try {
    const result = await sql`
      SELECT stripe_connect_account_id 
      FROM users 
      WHERE id = ${userId}
    `

    if (result.length === 0) {
      return {
        canWithdraw: false,
        stripeConnectEnabled: false,
        message: 'User not found',
      }
    }

    const stripeConnectAccountId = result[0].stripe_connect_account_id

    return {
      canWithdraw: !!stripeConnectAccountId,
      stripeConnectEnabled: !!stripeConnectAccountId,
      stripeConnectAccountId: stripeConnectAccountId || undefined,
      message: stripeConnectAccountId
        ? 'User has Stripe Connect enabled'
        : 'User needs to connect Stripe account for withdrawals',
    }
  } catch (error) {
    console.error(`Error checking payout status for user ${userId}:`, error)

    return {
      canWithdraw: false,
      stripeConnectEnabled: false,
      message: 'Error checking payout eligibility',
    }
  }
}
