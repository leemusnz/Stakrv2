import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDbConnection } from '@/lib/db'
import { notifyWithdrawalProcessed } from '@/lib/notification-service'
import { processWithdrawalPayout } from '@/lib/payout-service'

/**
 * POST /api/payments/withdraw
 * Process withdrawal request from user's wallet to their bank account
 * 
 * Charges a 3% cashout fee as per Terms of Service
 * Minimum withdrawal: $10
 * Only allows withdrawal of available balance (excluding locked stakes)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required',
        message: 'You must be logged in to withdraw funds'
      }, { status: 401 })
    }

    const body = await request.json()
    const { amount, withdrawalMethodId } = body

    // Validate withdrawal amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ 
        error: 'Invalid withdrawal amount',
        message: 'Please enter a valid positive amount'
      }, { status: 400 })
    }

    // Enforce minimum withdrawal of $10
    const MIN_WITHDRAWAL = 10
    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json({ 
        error: 'Minimum withdrawal not met',
        message: `Minimum withdrawal amount is $${MIN_WITHDRAWAL}`,
        minimum: MIN_WITHDRAWAL
      }, { status: 400 })
    }

    const sql = await createDbConnection()

    // ========================================
    // SECURITY & FRAUD DETECTION CHECKS
    // ========================================

    // 1. Check for rate limiting (max 3 withdrawals per 24 hours)
    const recentWithdrawals = await sql`
      SELECT COUNT(*) as count, SUM(ABS(amount)) as total_amount
      FROM credit_transactions
      WHERE user_id = ${session.user.id}
        AND transaction_type = 'withdrawal'
        AND created_at > NOW() - INTERVAL '24 hours'
    `

    const withdrawalCount = parseInt(recentWithdrawals[0]?.count || '0')
    const withdrawalTotal = parseFloat(recentWithdrawals[0]?.total_amount || '0')

    if (withdrawalCount >= 3) {
      console.warn(`⚠️ Rate limit exceeded for user ${session.user.id}: ${withdrawalCount} withdrawals in 24h`)
      return NextResponse.json({
        error: 'Withdrawal limit exceeded',
        message: 'You can only make 3 withdrawals per 24 hours. Please try again later.',
        details: {
          limit: 3,
          count: withdrawalCount,
          reset_time: '24 hours after your first withdrawal today'
        }
      }, { status: 429 })
    }

    // 2. Check daily withdrawal limit ($1000/day)
    const DAILY_WITHDRAWAL_LIMIT = 1000
    if (withdrawalTotal + amount > DAILY_WITHDRAWAL_LIMIT) {
      console.warn(`⚠️ Daily limit exceeded for user ${session.user.id}: $${withdrawalTotal + amount} in 24h`)
      return NextResponse.json({
        error: 'Daily withdrawal limit exceeded',
        message: `You can withdraw up to $${DAILY_WITHDRAWAL_LIMIT} per 24 hours`,
        details: {
          limit: DAILY_WITHDRAWAL_LIMIT,
          withdrawn_today: withdrawalTotal,
          requested: amount,
          available: DAILY_WITHDRAWAL_LIMIT - withdrawalTotal
        }
      }, { status: 400 })
    }

    // 3. Get user trust score and account age for fraud detection
    const userInfo = await sql`
      SELECT 
        u.trust_score,
        u.created_at as account_created,
        u.challenges_completed,
        u.false_claims,
        EXTRACT(DAYS FROM (NOW() - u.created_at)) as account_age_days
      FROM users u
      WHERE u.id = ${session.user.id}
    `

    if (userInfo.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const trustScore = parseInt(userInfo[0].trust_score || '50')
    const accountAgeDays = parseFloat(userInfo[0].account_age_days || '0')
    const challengesCompleted = parseInt(userInfo[0].challenges_completed || '0')
    const falseClaims = parseInt(userInfo[0].false_claims || '0')

    // 4. Fraud detection rules
    let suspiciousFlags: string[] = []

    // Flag 1: New account (< 7 days) trying to withdraw large amount
    if (accountAgeDays < 7 && amount > 100) {
      suspiciousFlags.push('new_account_large_withdrawal')
      console.warn(`🚨 Suspicious: New account (${accountAgeDays} days) withdrawing $${amount}`)
    }

    // Flag 2: Low trust score (< 30) with large withdrawal
    if (trustScore < 30 && amount > 50) {
      suspiciousFlags.push('low_trust_large_withdrawal')
      console.warn(`🚨 Suspicious: Low trust score (${trustScore}) withdrawing $${amount}`)
    }

    // Flag 3: User with false claims trying to withdraw
    if (falseClaims > 2 && amount > 50) {
      suspiciousFlags.push('fraud_history_withdrawal')
      console.warn(`🚨 Suspicious: User with ${falseClaims} false claims withdrawing $${amount}`)
    }

    // Flag 4: First withdrawal for new user with no completed challenges
    if (challengesCompleted === 0 && withdrawalCount === 0 && amount > 50) {
      suspiciousFlags.push('no_activity_withdrawal')
      console.warn(`🚨 Suspicious: User with 0 completed challenges withdrawing $${amount}`)
    }

    // 5. Block highly suspicious withdrawals
    if (suspiciousFlags.length >= 2 || (trustScore < 20 && amount > 100)) {
      // Log suspicious activity
      await sql`
        INSERT INTO suspicious_activities (
          user_id, activity_type, description, metadata, severity, created_at
        ) VALUES (
          ${session.user.id},
          'suspicious_withdrawal',
          'Withdrawal blocked due to suspicious patterns',
          ${JSON.stringify({
            amount,
            trust_score: trustScore,
            account_age_days: accountAgeDays,
            flags: suspiciousFlags
          })},
          'high',
          NOW()
        )
      `

      return NextResponse.json({
        error: 'Withdrawal requires manual review',
        message: 'Your withdrawal has been flagged for security review. Our team will review your request within 24-48 hours.',
        details: {
          reason: 'Security verification required',
          contact_support: true
        }
      }, { status: 403 })
    }

    // 6. Flag mildly suspicious but allow with warning
    if (suspiciousFlags.length === 1) {
      // Log for monitoring but allow withdrawal
      await sql`
        INSERT INTO suspicious_activities (
          user_id, activity_type, description, metadata, severity, created_at
        ) VALUES (
          ${session.user.id},
          'flagged_withdrawal',
          'Withdrawal completed but flagged for monitoring',
          ${JSON.stringify({
            amount,
            trust_score: trustScore,
            flags: suspiciousFlags
          })},
          'medium',
          NOW()
        )
      `
    }

    // Continue with normal withdrawal process...
    // ========================================

    // Calculate 3% cashout fee
    const CASHOUT_FEE_PERCENTAGE = 0.03
    const fee = parseFloat((amount * CASHOUT_FEE_PERCENTAGE).toFixed(2))
    const totalRequired = parseFloat((amount + fee).toFixed(2))

    // Get user's available balance (total credits minus locked stakes)
    const userBalance = await sql`
      SELECT 
        u.id,
        u.credits,
        u.email,
        u.name,
        COALESCE(SUM(
          CASE 
            WHEN cp.completion_status = 'active' THEN cp.stake_amount 
            ELSE 0 
          END
        ), 0) as locked_stakes
      FROM users u
      LEFT JOIN challenge_participants cp ON u.id = cp.user_id
      WHERE u.id = ${session.user.id}
      GROUP BY u.id, u.credits, u.email, u.name
    `

    if (userBalance.length === 0) {
      return NextResponse.json({ 
        error: 'User not found'
      }, { status: 404 })
    }

    const user = userBalance[0]
    const currentBalance = parseFloat(user.credits || '0')
    const lockedStakes = parseFloat(user.locked_stakes || '0')
    const availableBalance = currentBalance - lockedStakes

    // Check if user has sufficient available balance
    if (availableBalance < totalRequired) {
      return NextResponse.json({ 
        error: 'Insufficient available balance',
        message: `You need $${totalRequired.toFixed(2)} ($${amount.toFixed(2)} + $${fee.toFixed(2)} fee) but only have $${availableBalance.toFixed(2)} available`,
        details: {
          requested: amount,
          fee: fee,
          total_required: totalRequired,
          current_balance: currentBalance,
          locked_in_challenges: lockedStakes,
          available_balance: availableBalance,
          shortfall: totalRequired - availableBalance
        }
      }, { status: 400 })
    }

    // Perform atomic debit to prevent race conditions
    const debitResult = await sql`
      UPDATE users 
      SET 
        credits = credits - ${totalRequired},
        updated_at = NOW()
      WHERE id = ${session.user.id} 
        AND credits >= ${totalRequired}
      RETURNING credits
    `

    // Double-check the debit succeeded
    if (debitResult.length === 0) {
      return NextResponse.json({ 
        error: 'Withdrawal failed',
        message: 'Insufficient funds or concurrent transaction detected. Please try again.'
      }, { status: 400 })
    }

    const newBalance = parseFloat(debitResult[0].credits || '0')

    // Record withdrawal transaction
    await sql`
      INSERT INTO credit_transactions (
        user_id, amount, transaction_type, description, created_at
      ) VALUES (
        ${session.user.id}, 
        ${-amount}, 
        'withdrawal', 
        'Withdrawal to bank account',
        NOW()
      )
    `

    // Record cashout fee transaction
    await sql`
      INSERT INTO credit_transactions (
        user_id, amount, transaction_type, description, created_at
      ) VALUES (
        ${session.user.id}, 
        ${-fee}, 
        'cashout_fee', 
        'Withdrawal processing fee (3%)',
        NOW()
      )
    `

    // Record platform revenue from cashout fee
    await sql`
      INSERT INTO platform_revenue (
        revenue_type, amount, user_id, created_at
      ) VALUES (
        'cashout_fee', 
        ${fee}, 
        ${session.user.id},
        NOW()
      )
    `

    // Create main transaction record for the withdrawal
    const transactionResult = await sql`
      INSERT INTO transactions (
        user_id, 
        transaction_type, 
        amount, 
        platform_revenue,
        status, 
        created_at
      ) VALUES (
        ${session.user.id}, 
        'withdrawal', 
        ${amount},
        ${fee},
        'pending',
        NOW()
      )
      RETURNING id
    `
    const transactionId = transactionResult[0]?.id || ''


    // Send notification to user
    await notifyWithdrawalProcessed(
      session.user.id,
      amount,
      fee,
      totalRequired,
      newBalance,
      sql
    ).catch(error => {
      console.error('Failed to send withdrawal notification:', error)
      // Don't fail the withdrawal if notification fails
    })

    // Process payout via Stripe Connect
    let payoutStatus = 'pending'
    let payoutMessage = 'Your withdrawal is being processed. Funds will be transferred to your linked bank account.'
    
    try {
      const stripeSecret = process.env.STRIPE_SECRET_KEY
      if (stripeSecret && transactionId) {
        // Initialize Stripe client
        const stripeMod: any = await import('stripe')
        const Stripe = stripeMod.default || stripeMod
        const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' })
        
        // Process the withdrawal payout
        const payoutResult = await processWithdrawalPayout(
          sql,
          stripe,
          session.user.id,
          amount,
          transactionId,
          process.env
        )
        
        if (payoutResult.success) {
          payoutStatus = 'processing'
          payoutMessage = `Your withdrawal is being processed. Transfer ID: ${payoutResult.transferId}`
        } else {
          // Payout failed - but transaction is already marked as failed in DB
          console.warn(`⚠️ Withdrawal payout failed for user ${session.user.id}: ${payoutResult.error}`)
          
          // If no Stripe Connect account, provide helpful message
          if (payoutResult.error === 'NO_STRIPE_CONNECT') {
            return NextResponse.json({
              success: false,
              error: 'Stripe account required',
              message: 'Please connect your Stripe account to receive payouts',
              details: {
                reason: 'stripe_connect_required',
                setupUrl: '/settings/payments/connect-stripe'
              }
            }, { status: 400 })
          }
          
          return NextResponse.json({
            success: false,
            error: 'Payout processing failed',
            message: payoutResult.message,
            details: {
              reason: payoutResult.error,
              transactionId
            }
          }, { status: 500 })
        }
      } else {
        console.warn(`⚠️ Stripe not configured or missing transaction ID for user ${session.user.id}`)
      }
    } catch (payoutError) {
      console.error('❌ Error processing payout:', payoutError)
      
      // Update transaction status to failed
      if (transactionId) {
        await sql`UPDATE transactions SET status = 'failed' WHERE id = ${transactionId}`
      }
      
      return NextResponse.json({
        error: 'Payout processing error',
        message: 'An error occurred while processing your payout. Please contact support.',
        details: process.env.NODE_ENV === 'development' 
          ? (payoutError instanceof Error ? payoutError.message : 'Unknown error') 
          : undefined
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Withdrawal request processed successfully',
      withdrawal: {
        amount: amount,
        fee: fee,
        total_deducted: totalRequired,
        new_balance: newBalance,
        withdrawal_method: withdrawalMethodId || 'default',
        status: payoutStatus,
        estimated_arrival: '3-5 business days',
        note: payoutMessage
      },
      balance_details: {
        previous_balance: currentBalance,
        new_balance: newBalance,
        locked_stakes: lockedStakes,
        available_balance: newBalance - lockedStakes
      }
    })

  } catch (error) {
    console.error('❌ Withdrawal error:', error)
    
    return NextResponse.json({
      error: 'Withdrawal processing failed',
      message: 'An unexpected error occurred while processing your withdrawal. Please try again or contact support.',
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Unknown error') 
        : undefined
    }, { status: 500 })
  }
}

/**
 * GET /api/payments/withdraw
 * Get withdrawal eligibility and fee information
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required'
      }, { status: 401 })
    }

    const sql = await createDbConnection()

    // Get user's balance and locked stakes
    const userBalance = await sql`
      SELECT 
        u.credits,
        COALESCE(SUM(
          CASE 
            WHEN cp.completion_status = 'active' THEN cp.stake_amount 
            ELSE 0 
          END
        ), 0) as locked_stakes
      FROM users u
      LEFT JOIN challenge_participants cp ON u.id = cp.user_id
      WHERE u.id = ${session.user.id}
      GROUP BY u.id, u.credits
    `

    if (userBalance.length === 0) {
      return NextResponse.json({ 
        error: 'User not found'
      }, { status: 404 })
    }

    const currentBalance = parseFloat(userBalance[0].credits || '0')
    const lockedStakes = parseFloat(userBalance[0].locked_stakes || '0')
    const availableBalance = currentBalance - lockedStakes

    return NextResponse.json({
      success: true,
      withdrawal_info: {
        minimum_withdrawal: 10,
        cashout_fee_percentage: 3,
        estimated_delivery: '3-5 business days'
      },
      balance: {
        total: currentBalance,
        locked_in_challenges: lockedStakes,
        available_for_withdrawal: availableBalance,
        can_withdraw: availableBalance >= 10
      },
      example_fees: [
        { amount: 10, fee: 0.30, net: 10, total_deducted: 10.30 },
        { amount: 50, fee: 1.50, net: 50, total_deducted: 51.50 },
        { amount: 100, fee: 3.00, net: 100, total_deducted: 103.00 },
        { amount: 500, fee: 15.00, net: 500, total_deducted: 515.00 }
      ]
    })

  } catch (error) {
    console.error('❌ Withdrawal info error:', error)
    
    return NextResponse.json({
      error: 'Failed to fetch withdrawal information'
    }, { status: 500 })
  }
}

