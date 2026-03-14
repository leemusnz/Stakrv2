/**
 * Notification Service
 * Central service for creating in-app and email notifications
 */

import { createDbConnection } from '@/lib/db'
import { sendEmail } from '@/lib/email'

type SqlTag = (strings: TemplateStringsArray, ...values: any[]) => Promise<any[]>

export type NotificationType = 
  | 'financial' 
  | 'challenge' 
  | 'verification' 
  | 'system' 
  | 'social'
  | 'insurance'
  | 'withdrawal'
  | 'reward'

export interface NotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
  metadata?: Record<string, any>
  sendEmail?: boolean
  emailSubject?: string
  emailBody?: string
}

/**
 * Create an in-app notification
 */
export async function createNotification(
  data: NotificationData,
  sqlOverride?: SqlTag
): Promise<{ success: boolean; notificationId?: string }> {
  try {
    const sql = sqlOverride || (await createDbConnection())
    
    const result = await sql`
      INSERT INTO notifications (
        user_id, 
        type, 
        title, 
        message, 
        action_url,
        metadata,
        read, 
        created_at
      ) VALUES (
        ${data.userId},
        ${data.type},
        ${data.title},
        ${data.message},
        ${data.actionUrl || null},
        ${data.metadata ? JSON.stringify(data.metadata) : null},
        false,
        NOW()
      )
      RETURNING id
    `
    
    const notificationId = result[0]?.id
    
    
    // Send email notification if requested
    if (data.sendEmail && data.emailSubject && data.emailBody) {
      // Get user email
      const userResult = await sql`
        SELECT email, name FROM users WHERE id = ${data.userId}
      `
      
      if (userResult.length > 0) {
        const user = userResult[0]
        await sendEmail({
          to: user.email,
          subject: data.emailSubject,
          html: data.emailBody,
          text: data.emailBody.replace(/<[^>]*>/g, '') // Strip HTML for text version
        }).catch(error => {
          console.error('📧 Failed to send email notification:', error)
          // Don't fail the whole notification if email fails
        })
        
      }
    }
    
    return { 
      success: true, 
      notificationId 
    }
    
  } catch (error) {
    console.error('❌ Failed to create notification:', error)
    return { success: false }
  }
}

/**
 * Create notification for withdrawal request
 */
export async function notifyWithdrawalProcessed(
  userId: string,
  amount: number,
  fee: number,
  totalDeducted: number,
  newBalance: number,
  sqlOverride?: SqlTag
): Promise<void> {
  const notification: NotificationData = {
    userId,
    type: 'withdrawal',
    title: '💸 Withdrawal Processed',
    message: `Your withdrawal of $${amount.toFixed(2)} has been processed. Total deducted: $${totalDeducted.toFixed(2)} (including $${fee.toFixed(2)} fee). New balance: $${newBalance.toFixed(2)}`,
    actionUrl: '/wallet',
    metadata: {
      amount,
      fee,
      totalDeducted,
      newBalance,
      timestamp: new Date().toISOString()
    },
    sendEmail: true,
    emailSubject: 'Stakr - Withdrawal Processed',
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">💸 Withdrawal Processed</h2>
        <p>Your withdrawal request has been successfully processed.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Withdrawal Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0;"><strong>Amount:</strong></td>
              <td style="text-align: right;">$${amount.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 1px solid #d1d5db;">
              <td style="padding: 8px 0;"><strong>Processing Fee (3%):</strong></td>
              <td style="text-align: right; color: #ef4444;">-$${fee.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 2px solid #9ca3af; font-weight: bold;">
              <td style="padding: 8px 0;">Total Deducted:</td>
              <td style="text-align: right;">$${totalDeducted.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 1px solid #d1d5db;">
              <td style="padding: 8px 0;"><strong>New Balance:</strong></td>
              <td style="text-align: right; color: #10b981;">$${newBalance.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          <strong>⏰ Estimated Arrival:</strong> 3-5 business days<br/>
          Funds will be transferred to your linked bank account.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://stakr.app'}/wallet" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Wallet
          </a>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
          If you didn't request this withdrawal, please contact support immediately.
        </p>
      </div>
    `
  }
  
  await createNotification(notification, sqlOverride)
}

/**
 * Create notification for insurance payout
 */
export async function notifyInsurancePayout(
  userId: string,
  challengeTitle: string,
  stakeAmount: number,
  challengeId: string,
  sqlOverride?: SqlTag
): Promise<void> {
  const notification: NotificationData = {
    userId,
    type: 'insurance',
    title: '🛡️ Insurance Payout Received',
    message: `Your insurance covered your $${stakeAmount.toFixed(2)} stake in "${challengeTitle}". The stake has been refunded to your wallet.`,
    actionUrl: '/wallet',
    metadata: {
      challengeId,
      challengeTitle,
      stakeAmount,
      timestamp: new Date().toISOString()
    },
    sendEmail: true,
    emailSubject: 'Stakr - Insurance Payout Received',
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🛡️ Insurance Payout Received</h2>
        <p>Your insurance has protected your stake!</p>
        
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="margin-top: 0; color: #047857;">Challenge: ${challengeTitle}</h3>
          <p style="font-size: 18px; margin: 10px 0;">
            <strong>Refunded Amount:</strong> 
            <span style="color: #10b981; font-size: 24px;">$${stakeAmount.toFixed(2)}</span>
          </p>
          <p style="color: #065f46; margin-bottom: 0;">
            Your $1 insurance fee covered your stake. The funds have been returned to your wallet.
          </p>
        </div>
        
        <p style="color: #6b7280;">
          Even though you didn't complete this challenge, your insurance protected your investment. 
          Keep challenging yourself!
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://stakr.app'}/wallet" 
             style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">
            View Wallet
          </a>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://stakr.app'}/discover" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Find New Challenges
          </a>
        </div>
      </div>
    `
  }
  
  await createNotification(notification, sqlOverride)
}

/**
 * Create notification for challenge reward
 */
export async function notifyRewardEarned(
  userId: string,
  challengeTitle: string,
  rewardAmount: number,
  challengeId: string,
  breakdown?: {
    stakeReturn: number
    bonusReward: number
    hostContribution: number
  },
  sqlOverride?: SqlTag
): Promise<void> {
  const notification: NotificationData = {
    userId,
    type: 'reward',
    title: '🎉 Challenge Reward Earned!',
    message: `Congratulations! You earned $${rewardAmount.toFixed(2)} for completing "${challengeTitle}"`,
    actionUrl: `/challenge/${challengeId}`,
    metadata: {
      challengeId,
      challengeTitle,
      rewardAmount,
      breakdown,
      timestamp: new Date().toISOString()
    },
    sendEmail: true,
    emailSubject: 'Stakr - You Earned a Reward!',
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">🎉 Congratulations! You Earned a Reward!</h2>
        <p>You successfully completed a challenge and earned your reward.</p>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e;">Challenge: ${challengeTitle}</h3>
          <p style="font-size: 18px; margin: 10px 0;">
            <strong>Total Reward:</strong> 
            <span style="color: #f59e0b; font-size: 28px; font-weight: bold;">$${rewardAmount.toFixed(2)}</span>
          </p>
          ${breakdown ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #fbbf24;">
              <p style="margin: 5px 0; color: #78350f;"><strong>Breakdown:</strong></p>
              <p style="margin: 5px 0; color: #78350f;">• Stake Return: $${breakdown.stakeReturn.toFixed(2)}</p>
              <p style="margin: 5px 0; color: #78350f;">• Bonus Reward: $${breakdown.bonusReward.toFixed(2)}</p>
              ${breakdown.hostContribution > 0 ? `<p style="margin: 5px 0; color: #78350f;">• Host Contribution: $${breakdown.hostContribution.toFixed(2)}</p>` : ''}
            </div>
          ` : ''}
        </div>
        
        <p style="color: #6b7280;">
          Your reward has been added to your wallet. You can withdraw it anytime or use it for your next challenge!
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://stakr.app'}/wallet" 
             style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">
            View Wallet
          </a>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://stakr.app'}/discover" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Start Next Challenge
          </a>
        </div>
      </div>
    `
  }
  
  await createNotification(notification, sqlOverride)
}

/**
 * Batch notify all participants of a challenge completion
 */
export async function notifyBatchRewards(
  participantRewards: Array<{
    user_id: string
    challenge_title: string
    challenge_id: string
    net_reward: number
    reward_breakdown?: {
      stake_return: number
      bonus_reward: number
      host_contribution_share: number
    }
  }>,
  sqlOverride?: SqlTag
): Promise<void> {
  
  for (const reward of participantRewards) {
    await notifyRewardEarned(
      reward.user_id,
      reward.challenge_title,
      reward.net_reward,
      reward.challenge_id,
      reward.reward_breakdown ? {
        stakeReturn: reward.reward_breakdown.stake_return,
        bonusReward: reward.reward_breakdown.bonus_reward,
        hostContribution: reward.reward_breakdown.host_contribution_share
      } : undefined,
      sqlOverride
    )
  }
  
}

