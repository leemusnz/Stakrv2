/**
 * Notification Templates Library
 * Comprehensive notification templates for all user events in Stakr
 */

import { NotificationData } from './notification-service'

type SqlTag = (strings: TemplateStringsArray, ...values: any[]) => Promise<any[]>

// ============================================================================
// CHALLENGE LIFECYCLE NOTIFICATIONS
// ============================================================================

/**
 * User joins a challenge
 */
export async function notifyChallengeJoined(
  userId: string,
  challengeId: string,
  challengeTitle: string,
  stakeAmount: number,
  startDate: Date,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  const daysUntilStart = Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  
  await createNotification({
    userId,
    type: 'challenge',
    title: '🎯 Challenge Joined!',
    message: `You've joined "${challengeTitle}" with a $${stakeAmount.toFixed(2)} stake. Challenge starts ${daysUntilStart > 0 ? `in ${daysUntilStart} days` : 'today'}!`,
    actionUrl: `/challenge/${challengeId}`,
    metadata: {
      challengeId,
      challengeTitle,
      stakeAmount,
      startDate: startDate.toISOString(),
      eventType: 'challenge_joined'
    },
    sendEmail: true,
    emailSubject: `You're In! "${challengeTitle}" Challenge`,
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🎯 Challenge Joined Successfully!</h2>
        <p>You're officially in! Here are the details:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">${challengeTitle}</h3>
          <p><strong>Your Stake:</strong> $${stakeAmount.toFixed(2)}</p>
          <p><strong>Starts:</strong> ${startDate.toLocaleDateString()}</p>
          <p style="color: #059669; font-weight: 600;">Good luck! 🍀</p>
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/challenge/${challengeId}" 
           style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Challenge Details
        </a>
      </div>
    `
  }, sqlOverride)
}

/**
 * Challenge is starting soon (1 day before)
 */
export async function notifyChallengeStartingSoon(
  userId: string,
  challengeId: string,
  challengeTitle: string,
  startDate: Date,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'challenge',
    title: '⏰ Challenge Starts Tomorrow!',
    message: `"${challengeTitle}" starts tomorrow. Get ready!`,
    actionUrl: `/challenge/${challengeId}`,
    metadata: {
      challengeId,
      challengeTitle,
      startDate: startDate.toISOString(),
      eventType: 'challenge_starting_soon'
    },
    sendEmail: true,
    emailSubject: `Tomorrow's the Day! "${challengeTitle}"`,
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">⏰ Challenge Starts Tomorrow!</h2>
        <p>Your challenge <strong>"${challengeTitle}"</strong> begins tomorrow.</p>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e;">Get Ready!</h3>
          <p>• Review the challenge requirements</p>
          <p>• Prepare your proof submission strategy</p>
          <p>• Set reminders to stay on track</p>
          <p>• Check in with other participants</p>
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/challenge/${challengeId}" 
           style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Challenge
        </a>
      </div>
    `
  }, sqlOverride)
}

/**
 * Challenge has started
 */
export async function notifyChallengeStarted(
  userId: string,
  challengeId: string,
  challengeTitle: string,
  duration: string,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'challenge',
    title: '🚀 Challenge Started!',
    message: `"${challengeTitle}" has begun! Time to make it happen.`,
    actionUrl: `/challenge/${challengeId}`,
    metadata: {
      challengeId,
      challengeTitle,
      duration,
      eventType: 'challenge_started'
    },
    sendEmail: true,
    emailSubject: `Let's Go! "${challengeTitle}" Has Started`,
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🚀 Your Challenge Has Started!</h2>
        <p><strong>"${challengeTitle}"</strong> is officially underway!</p>
        
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="margin-top: 0; color: #065f46; font-size: 28px;">Let's Do This! 💪</h3>
          <p style="font-size: 18px; color: #047857;">Duration: ${duration}</p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0;">Pro Tips:</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Submit proof daily to stay accountable</li>
            <li>Engage with other participants for motivation</li>
            <li>Set daily reminders</li>
            <li>Track your progress in the challenge dashboard</li>
          </ul>
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/challenge/${challengeId}" 
           style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Go to Challenge
        </a>
      </div>
    `
  }, sqlOverride)
}

/**
 * Challenge is ending soon (2 days before)
 */
export async function notifyChallengeEndingSoon(
  userId: string,
  challengeId: string,
  challengeTitle: string,
  endDate: Date,
  hasSubmittedProof: boolean,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  
  await createNotification({
    userId,
    type: 'challenge',
    title: hasSubmittedProof ? '⏳ Challenge Ending Soon!' : '⚠️ Action Required: Submit Proof',
    message: hasSubmittedProof 
      ? `"${challengeTitle}" ends in ${daysLeft} days. Keep it up!`
      : `"${challengeTitle}" ends in ${daysLeft} days. You haven't submitted proof yet!`,
    actionUrl: `/challenge/${challengeId}`,
    metadata: {
      challengeId,
      challengeTitle,
      endDate: endDate.toISOString(),
      hasSubmittedProof,
      daysLeft,
      eventType: 'challenge_ending_soon'
    },
    sendEmail: true,
    emailSubject: hasSubmittedProof 
      ? `Almost There! "${challengeTitle}" Ends Soon`
      : `⚠️ Submit Proof Before It's Too Late!`,
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${hasSubmittedProof ? '#f59e0b' : '#ef4444'};">
          ${hasSubmittedProof ? '⏳ Challenge Ending Soon!' : '⚠️ Action Required!'}
        </h2>
        <p><strong>"${challengeTitle}"</strong> ends in ${daysLeft} days.</p>
        
        <div style="background-color: ${hasSubmittedProof ? '#fef3c7' : '#fee2e2'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${hasSubmittedProof ? '#f59e0b' : '#ef4444'};">
          ${hasSubmittedProof ? `
            <h3 style="margin-top: 0; color: #92400e;">You're Doing Great!</h3>
            <p>Keep pushing to the finish line. You've got this!</p>
          ` : `
            <h3 style="margin-top: 0; color: #991b1b;">⚠️ You Haven't Submitted Proof!</h3>
            <p>Submit your proof now to avoid losing your stake!</p>
            <p><strong>Time remaining: ${daysLeft} days</strong></p>
          `}
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/challenge/${challengeId}" 
           style="display: inline-block; background-color: ${hasSubmittedProof ? '#f59e0b' : '#ef4444'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          ${hasSubmittedProof ? 'View Challenge' : 'Submit Proof Now'}
        </a>
      </div>
    `
  }, sqlOverride)
}

/**
 * Challenge completed by user
 */
export async function notifyChallengeCompleted(
  userId: string,
  challengeId: string,
  challengeTitle: string,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'challenge',
    title: '✅ Challenge Completed!',
    message: `Congratulations! You completed "${challengeTitle}". Awaiting reward calculation.`,
    actionUrl: `/challenge/${challengeId}`,
    metadata: {
      challengeId,
      challengeTitle,
      eventType: 'challenge_completed'
    },
    sendEmail: true,
    emailSubject: `🎉 You Did It! "${challengeTitle}" Completed`,
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🎉 Congratulations!</h2>
        <p>You successfully completed <strong>"${challengeTitle}"</strong>!</p>
        
        <div style="background-color: #d1fae5; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="margin: 0; color: #065f46; font-size: 32px;">✅ CHALLENGE COMPLETE!</h3>
          <p style="font-size: 18px; color: #047857; margin-top: 10px;">You're a champion! 🏆</p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>What's Next?</strong></p>
          <p>We're calculating your reward based on the challenge pool. You'll receive a notification once it's processed.</p>
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/challenge/${challengeId}" 
           style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Challenge Results
        </a>
      </div>
    `
  }, sqlOverride)
}

/**
 * Challenge failed (user didn't complete)
 */
export async function notifyChallengeFailed(
  userId: string,
  challengeId: string,
  challengeTitle: string,
  hadInsurance: boolean,
  stakeAmount: number,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'challenge',
    title: hadInsurance ? '🛡️ Insurance Protected Your Stake' : '❌ Challenge Not Completed',
    message: hadInsurance 
      ? `You didn't complete "${challengeTitle}", but your insurance covered your $${stakeAmount.toFixed(2)} stake.`
      : `Challenge "${challengeTitle}" ended. Your $${stakeAmount.toFixed(2)} stake was forfeited.`,
    actionUrl: hadInsurance ? '/wallet' : '/discover',
    metadata: {
      challengeId,
      challengeTitle,
      hadInsurance,
      stakeAmount,
      eventType: 'challenge_failed'
    },
    sendEmail: true,
    emailSubject: hadInsurance 
      ? `Insurance Saved Your Stake - "${challengeTitle}"`
      : `Challenge Not Completed - "${challengeTitle}"`,
    emailBody: hadInsurance ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🛡️ Insurance Protected Your Stake!</h2>
        <p>You didn't complete <strong>"${challengeTitle}"</strong>, but your insurance protected you.</p>
        
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="margin-top: 0; color: #065f46;">$${stakeAmount.toFixed(2)} Refunded</h3>
          <p>Your $1 insurance fee covered your stake. The full amount has been returned to your wallet.</p>
        </div>
        
        <p>Don't let this stop you! Try another challenge and keep building your streak.</p>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/discover" 
           style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Find New Challenges
        </a>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Challenge Not Completed</h2>
        <p><strong>"${challengeTitle}"</strong> has ended without completion.</p>
        
        <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <h3 style="margin-top: 0; color: #991b1b;">Stake Forfeited</h3>
          <p>Your $${stakeAmount.toFixed(2)} stake was added to the reward pool for those who completed the challenge.</p>
        </div>
        
        <p>Every setback is a setup for a comeback! Consider adding insurance to your next challenge ($1) to protect your stake.</p>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/discover" 
           style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Try Another Challenge
        </a>
      </div>
    `
  }, sqlOverride)
}

/**
 * User invited to private challenge
 */
export async function notifyChallengeInvite(
  userId: string,
  challengeId: string,
  challengeTitle: string,
  invitedBy: string,
  inviterName: string,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'social',
    title: '✉️ Challenge Invitation',
    message: `${inviterName} invited you to join "${challengeTitle}"`,
    actionUrl: `/challenge/invite?code=${challengeId}`,
    metadata: {
      challengeId,
      challengeTitle,
      invitedBy,
      inviterName,
      eventType: 'challenge_invite'
    },
    sendEmail: true,
    emailSubject: `You're Invited: "${challengeTitle}" Challenge`,
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">✉️ You've Been Invited!</h2>
        <p><strong>${inviterName}</strong> invited you to join a challenge:</p>
        
        <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3 style="margin-top: 0; color: #1e40af;">"${challengeTitle}"</h3>
          <p>Join your friend in this challenge and hold each other accountable!</p>
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/challenge/invite?code=${challengeId}" 
           style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Invitation
        </a>
      </div>
    `
  }, sqlOverride)
}

// ============================================================================
// VERIFICATION & PROOF NOTIFICATIONS
// ============================================================================

/**
 * Proof submission reminder
 */
export async function notifyProofReminder(
  userId: string,
  challengeId: string,
  challengeTitle: string,
  daysRemaining: number,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'verification',
    title: '📸 Time to Submit Proof!',
    message: `Submit your proof for "${challengeTitle}". ${daysRemaining} days left.`,
    actionUrl: `/challenge/${challengeId}`,
    metadata: {
      challengeId,
      challengeTitle,
      daysRemaining,
      eventType: 'proof_reminder'
    }
  }, sqlOverride)
}

/**
 * Proof submitted successfully
 */
export async function notifyProofSubmitted(
  userId: string,
  challengeId: string,
  challengeTitle: string,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'verification',
    title: '✅ Proof Submitted',
    message: `Your proof for "${challengeTitle}" is under review.`,
    actionUrl: `/challenge/${challengeId}`,
    metadata: {
      challengeId,
      challengeTitle,
      eventType: 'proof_submitted'
    }
  }, sqlOverride)
}

/**
 * Proof approved
 */
export async function notifyProofApproved(
  userId: string,
  challengeId: string,
  challengeTitle: string,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'verification',
    title: '✅ Proof Approved!',
    message: `Your proof for "${challengeTitle}" has been approved. Great work!`,
    actionUrl: `/challenge/${challengeId}`,
    metadata: {
      challengeId,
      challengeTitle,
      eventType: 'proof_approved'
    },
    sendEmail: true,
    emailSubject: `Proof Approved - "${challengeTitle}"`,
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">✅ Proof Approved!</h2>
        <p>Your proof submission for <strong>"${challengeTitle}"</strong> has been reviewed and approved!</p>
        
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="margin: 0; color: #065f46; font-size: 28px;">🎉 You're On Track!</h3>
        </div>
        
        <p>Keep up the great work. Continue submitting proof to complete the challenge!</p>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/challenge/${challengeId}" 
           style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Challenge
        </a>
      </div>
    `
  }, sqlOverride)
}

/**
 * Proof rejected
 */
export async function notifyProofRejected(
  userId: string,
  challengeId: string,
  challengeTitle: string,
  reason: string,
  canAppeal: boolean,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'verification',
    title: '❌ Proof Rejected',
    message: `Your proof for "${challengeTitle}" was rejected. ${canAppeal ? 'You can appeal this decision.' : ''}`,
    actionUrl: `/challenge/${challengeId}`,
    metadata: {
      challengeId,
      challengeTitle,
      reason,
      canAppeal,
      eventType: 'proof_rejected'
    },
    sendEmail: true,
    emailSubject: `Proof Rejected - "${challengeTitle}"`,
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Proof Submission Issue</h2>
        <p>Your proof submission for <strong>"${challengeTitle}"</strong> was rejected.</p>
        
        <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <h3 style="margin-top: 0; color: #991b1b;">Reason:</h3>
          <p>${reason}</p>
        </div>
        
        ${canAppeal ? `
          <p>You can appeal this decision if you believe it was made in error.</p>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/challenge/${challengeId}" 
             style="display: inline-block; background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">
            Appeal Decision
          </a>
        ` : `
          <p>Please review the challenge requirements and submit new proof if possible.</p>
        `}
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/challenge/${challengeId}" 
           style="display: inline-block; background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Challenge
        </a>
      </div>
    `
  }, sqlOverride)
}

/**
 * Appeal submitted
 */
export async function notifyAppealSubmitted(
  userId: string,
  challengeId: string,
  challengeTitle: string,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'verification',
    title: '📋 Appeal Submitted',
    message: `Your appeal for "${challengeTitle}" is under review.`,
    actionUrl: `/challenge/${challengeId}`,
    metadata: {
      challengeId,
      challengeTitle,
      eventType: 'appeal_submitted'
    }
  }, sqlOverride)
}

/**
 * Appeal approved
 */
export async function notifyAppealApproved(
  userId: string,
  challengeId: string,
  challengeTitle: string,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'verification',
    title: '✅ Appeal Approved!',
    message: `Your appeal for "${challengeTitle}" was approved. Your proof has been accepted.`,
    actionUrl: `/challenge/${challengeId}`,
    metadata: {
      challengeId,
      challengeTitle,
      eventType: 'appeal_approved'
    },
    sendEmail: true,
    emailSubject: `Great News! Appeal Approved - "${challengeTitle}"`,
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">✅ Appeal Approved!</h2>
        <p>Great news! Your appeal for <strong>"${challengeTitle}"</strong> has been reviewed and approved.</p>
        
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="margin: 0; color: #065f46; font-size: 24px;">Your Proof Has Been Accepted! 🎉</h3>
        </div>
        
        <p>You're back on track. Keep up the great work!</p>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/challenge/${challengeId}" 
           style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Challenge
        </a>
      </div>
    `
  }, sqlOverride)
}

/**
 * Appeal denied
 */
export async function notifyAppealDenied(
  userId: string,
  challengeId: string,
  challengeTitle: string,
  reason: string,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'verification',
    title: '❌ Appeal Denied',
    message: `Your appeal for "${challengeTitle}" was reviewed and denied.`,
    actionUrl: `/challenge/${challengeId}`,
    metadata: {
      challengeId,
      challengeTitle,
      reason,
      eventType: 'appeal_denied'
    },
    sendEmail: true,
    emailSubject: `Appeal Decision - "${challengeTitle}"`,
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Appeal Decision</h2>
        <p>Your appeal for <strong>"${challengeTitle}"</strong> has been carefully reviewed.</p>
        
        <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <h3 style="margin-top: 0; color: #991b1b;">Decision: Denied</h3>
          <p><strong>Reason:</strong> ${reason}</p>
        </div>
        
        <p>This decision is final. We encourage you to review the challenge requirements carefully for future submissions.</p>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/challenge/${challengeId}" 
           style="display: inline-block; background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Challenge
        </a>
      </div>
    `
  }, sqlOverride)
}

// ============================================================================
// SOCIAL NOTIFICATIONS
// ============================================================================

/**
 * User received a nudge
 */
export async function notifyNudgeReceived(
  userId: string,
  challengeId: string,
  challengeTitle: string,
  fromUserId: string,
  fromUserName: string,
  message: string,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'social',
    title: '👋 You Got a Nudge!',
    message: `${fromUserName} sent you a nudge in "${challengeTitle}": ${message}`,
    actionUrl: `/challenge/${challengeId}`,
    metadata: {
      challengeId,
      challengeTitle,
      fromUserId,
      fromUserName,
      message,
      eventType: 'nudge_received'
    }
  }, sqlOverride)
}

/**
 * Someone commented on user's challenge
 */
export async function notifyCommentReceived(
  userId: string,
  challengeId: string,
  challengeTitle: string,
  fromUserId: string,
  fromUserName: string,
  comment: string,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'social',
    title: '💬 New Comment',
    message: `${fromUserName} commented on "${challengeTitle}"`,
    actionUrl: `/challenge/${challengeId}`,
    metadata: {
      challengeId,
      challengeTitle,
      fromUserId,
      fromUserName,
      comment,
      eventType: 'comment_received'
    }
  }, sqlOverride)
}

/**
 * New follower
 */
export async function notifyNewFollower(
  userId: string,
  followerId: string,
  followerName: string,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'social',
    title: '👥 New Follower!',
    message: `${followerName} started following you`,
    actionUrl: `/creator/${followerId}`,
    metadata: {
      followerId,
      followerName,
      eventType: 'new_follower'
    }
  }, sqlOverride)
}

/**
 * Someone joined user's hosted challenge
 */
export async function notifyParticipantJoined(
  hostUserId: string,
  challengeId: string,
  challengeTitle: string,
  participantName: string,
  totalParticipants: number,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId: hostUserId,
    type: 'social',
    title: '🎉 New Participant!',
    message: `${participantName} joined your challenge "${challengeTitle}". Total participants: ${totalParticipants}`,
    actionUrl: `/challenge/${challengeId}`,
    metadata: {
      challengeId,
      challengeTitle,
      participantName,
      totalParticipants,
      eventType: 'participant_joined'
    }
  }, sqlOverride)
}

// ============================================================================
// FINANCIAL NOTIFICATIONS (Already implemented in notification-service.ts)
// ============================================================================
// - notifyWithdrawalProcessed
// - notifyRewardEarned
// - notifyInsurancePayout
// - notifyBatchRewards

/**
 * Payment received (deposit)
 */
export async function notifyPaymentReceived(
  userId: string,
  amount: number,
  paymentMethod: string,
  newBalance: number,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'financial',
    title: '💳 Payment Received',
    message: `$${amount.toFixed(2)} added to your wallet via ${paymentMethod}. New balance: $${newBalance.toFixed(2)}`,
    actionUrl: '/wallet',
    metadata: {
      amount,
      paymentMethod,
      newBalance,
      eventType: 'payment_received'
    },
    sendEmail: true,
    emailSubject: 'Payment Received - Stakr',
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">💳 Payment Received!</h2>
        <p>Your payment has been successfully processed.</p>
        
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #065f46;">Amount Received: $${amount.toFixed(2)}</h3>
          <p><strong>Payment Method:</strong> ${paymentMethod}</p>
          <p><strong>New Balance:</strong> $${newBalance.toFixed(2)}</p>
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/wallet" 
           style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Wallet
        </a>
      </div>
    `
  }, sqlOverride)
}

/**
 * Refund processed
 */
export async function notifyRefundProcessed(
  userId: string,
  amount: number,
  reason: string,
  challengeTitle?: string,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'financial',
    title: '🔄 Refund Processed',
    message: `$${amount.toFixed(2)} refund processed${challengeTitle ? ` for "${challengeTitle}"` : ''}`,
    actionUrl: '/wallet',
    metadata: {
      amount,
      reason,
      challengeTitle,
      eventType: 'refund_processed'
    },
    sendEmail: true,
    emailSubject: 'Refund Processed - Stakr',
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🔄 Refund Processed</h2>
        <p>A refund has been processed to your Stakr wallet.</p>
        
        <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">Refund Amount: $${amount.toFixed(2)}</h3>
          ${challengeTitle ? `<p><strong>Challenge:</strong> ${challengeTitle}</p>` : ''}
          <p><strong>Reason:</strong> ${reason}</p>
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/wallet" 
           style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Wallet
        </a>
      </div>
    `
  }, sqlOverride)
}

// ============================================================================
// MILESTONE & ACHIEVEMENT NOTIFICATIONS
// ============================================================================

/**
 * First challenge completed
 */
export async function notifyFirstChallengeCompleted(
  userId: string,
  challengeTitle: string,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'system',
    title: '🏆 First Challenge Complete!',
    message: `Congratulations on completing your first challenge: "${challengeTitle}"!`,
    actionUrl: '/dashboard',
    metadata: {
      challengeTitle,
      milestone: 'first_challenge',
      eventType: 'milestone_achieved'
    },
    sendEmail: true,
    emailSubject: '🏆 Milestone Achieved: First Challenge Complete!',
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">🏆 Milestone Achieved!</h2>
        <p>Congratulations! You've completed your first challenge on Stakr!</p>
        
        <div style="background-color: #fef3c7; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="margin: 0; color: #92400e; font-size: 32px;">🎉 FIRST CHALLENGE COMPLETE! 🎉</h3>
          <p style="font-size: 18px; color: #78350f; margin-top: 10px;">"${challengeTitle}"</p>
        </div>
        
        <p>This is just the beginning of your journey. Keep building your streak and achieving your goals!</p>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/discover" 
           style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Find Your Next Challenge
        </a>
      </div>
    `
  }, sqlOverride)
}

/**
 * Streak milestone (7, 30, 100 days)
 */
export async function notifyStreakMilestone(
  userId: string,
  streak: number,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  const milestones = {
    7: { emoji: '🔥', title: 'Week Warrior', message: 'You\'re on fire!' },
    30: { emoji: '💪', title: 'Month Master', message: 'Consistency is key!' },
    100: { emoji: '🏆', title: 'Century Champion', message: 'You\'re unstoppable!' },
    365: { emoji: '👑', title: 'Year Legend', message: 'You\'re a living legend!' }
  }
  
  const milestone = milestones[streak as keyof typeof milestones] || { emoji: '⚡', title: `${streak}-Day Streak!`, message: 'Keep going!' }
  
  await createNotification({
    userId,
    type: 'system',
    title: `${milestone.emoji} ${streak}-Day Streak!`,
    message: `${milestone.title}: ${milestone.message}`,
    actionUrl: '/dashboard',
    metadata: {
      streak,
      milestone: `streak_${streak}`,
      eventType: 'milestone_achieved'
    },
    sendEmail: true,
    emailSubject: `${milestone.emoji} ${streak}-Day Streak Achievement!`,
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">${milestone.emoji} Streak Milestone!</h2>
        <p>Incredible work! You've hit a major milestone.</p>
        
        <div style="background-color: #fef3c7; padding: 40px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="margin: 0; color: #92400e; font-size: 48px; font-weight: bold;">${streak} DAYS!</h3>
          <p style="font-size: 24px; color: #78350f; margin-top: 10px;">${milestone.title}</p>
          <p style="font-size: 18px; color: #92400e; margin-top: 10px;">${milestone.message}</p>
        </div>
        
        <p>Your dedication is inspiring. Keep up the momentum!</p>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard" 
           style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Your Progress
        </a>
      </div>
    `
  }, sqlOverride)
}

/**
 * Total rewards milestone ($100, $500, $1000)
 */
export async function notifyRewardsMilestone(
  userId: string,
  totalRewards: number,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'system',
    title: `💰 $${totalRewards} in Total Rewards!`,
    message: `You've earned $${totalRewards.toFixed(2)} in total rewards. Amazing work!`,
    actionUrl: '/wallet',
    metadata: {
      totalRewards,
      milestone: `rewards_${totalRewards}`,
      eventType: 'milestone_achieved'
    },
    sendEmail: true,
    emailSubject: `💰 Milestone: $${totalRewards} in Rewards Earned!`,
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">💰 Rewards Milestone!</h2>
        <p>You've reached an incredible financial milestone on Stakr!</p>
        
        <div style="background-color: #d1fae5; padding: 40px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="margin: 0; color: #065f46; font-size: 48px; font-weight: bold;">$${totalRewards.toFixed(2)}</h3>
          <p style="font-size: 20px; color: #047857; margin-top: 10px;">Total Rewards Earned!</p>
        </div>
        
        <p>You're not just building habits—you're building wealth through commitment!</p>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/wallet" 
           style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Your Wallet
        </a>
      </div>
    `
  }, sqlOverride)
}

// ============================================================================
// SYSTEM NOTIFICATIONS
// ============================================================================

/**
 * Welcome new user
 */
export async function notifyWelcome(
  userId: string,
  userName: string,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'system',
    title: '👋 Welcome to Stakr!',
    message: `Hi ${userName}! Start your first challenge to begin your journey.`,
    actionUrl: '/discover',
    metadata: {
      userName,
      eventType: 'welcome'
    },
    sendEmail: true,
    emailSubject: 'Welcome to Stakr - Start Your First Challenge!',
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">👋 Welcome to Stakr, ${userName}!</h2>
        <p>We're excited to have you join our community of goal-achievers!</p>
        
        <div style="background-color: #dbeafe; padding: 30px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">How Stakr Works:</h3>
          <ol style="margin: 10px 0; padding-left: 20px; line-height: 1.8;">
            <li><strong>Choose a Challenge:</strong> Find a challenge that excites you</li>
            <li><strong>Stake Money:</strong> Put money on the line to stay accountable</li>
            <li><strong>Complete It:</strong> Submit proof and complete the challenge</li>
            <li><strong>Win Rewards:</strong> Get your stake back + share of the reward pool!</li>
          </ol>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>💡 Pro Tip:</strong> Add $1 insurance to any challenge to protect your stake if life gets in the way!</p>
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/discover" 
           style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Browse Challenges
        </a>
      </div>
    `
  }, sqlOverride)
}

/**
 * Account verified
 */
export async function notifyAccountVerified(
  userId: string,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'system',
    title: '✅ Account Verified!',
    message: 'Your account has been verified. You now have full access to Stakr.',
    actionUrl: '/dashboard',
    metadata: {
      eventType: 'account_verified'
    }
  }, sqlOverride)
}

/**
 * Premium subscription activated
 */
export async function notifyPremiumActivated(
  userId: string,
  expiryDate: Date,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'system',
    title: '⭐ Premium Activated!',
    message: `Welcome to Stakr Premium! Your subscription is active until ${expiryDate.toLocaleDateString()}.`,
    actionUrl: '/pricing',
    metadata: {
      expiryDate: expiryDate.toISOString(),
      eventType: 'premium_activated'
    },
    sendEmail: true,
    emailSubject: '⭐ Welcome to Stakr Premium!',
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">⭐ Welcome to Stakr Premium!</h2>
        <p>Your premium subscription is now active!</p>
        
        <div style="background-color: #fef3c7; padding: 30px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #92400e;">Premium Benefits:</h3>
          <ul style="margin: 10px 0; padding-left: 20px; line-height: 1.8;">
            <li>Create unlimited challenges</li>
            <li>Access premium-only challenges</li>
            <li>Priority customer support</li>
            <li>Advanced analytics & insights</li>
            <li>Custom challenge features</li>
            <li>No platform fees on rewards</li>
          </ul>
        </div>
        
        <p><strong>Active Until:</strong> ${expiryDate.toLocaleDateString()}</p>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard" 
           style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Explore Premium Features
        </a>
      </div>
    `
  }, sqlOverride)
}

/**
 * Premium subscription expiring soon
 */
export async function notifyPremiumExpiring(
  userId: string,
  expiryDate: Date,
  daysLeft: number,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'system',
    title: '⚠️ Premium Expiring Soon',
    message: `Your premium subscription expires in ${daysLeft} days. Renew to keep your benefits!`,
    actionUrl: '/pricing',
    metadata: {
      expiryDate: expiryDate.toISOString(),
      daysLeft,
      eventType: 'premium_expiring'
    },
    sendEmail: true,
    emailSubject: 'Your Stakr Premium Subscription is Expiring Soon',
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">⚠️ Premium Subscription Expiring</h2>
        <p>Your Stakr Premium subscription will expire soon.</p>
        
        <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <h3 style="margin-top: 0; color: #991b1b;">Expires in ${daysLeft} Days</h3>
          <p><strong>Expiry Date:</strong> ${expiryDate.toLocaleDateString()}</p>
        </div>
        
        <p>Don't lose access to your premium benefits! Renew today to continue enjoying:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Unlimited challenge creation</li>
          <li>Premium-only challenges</li>
          <li>Priority support</li>
          <li>Advanced features</li>
        </ul>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/pricing" 
           style="display: inline-block; background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Renew Subscription
        </a>
      </div>
    `
  }, sqlOverride)
}

/**
 * Security alert - new login
 */
export async function notifyNewLogin(
  userId: string,
  location: string,
  device: string,
  ipAddress: string,
  sqlOverride?: SqlTag
): Promise<void> {
  const { createNotification } = await import('./notification-service')
  
  await createNotification({
    userId,
    type: 'system',
    title: '🔒 New Login Detected',
    message: `New login from ${location} on ${device}. If this wasn't you, secure your account immediately.`,
    actionUrl: '/settings',
    metadata: {
      location,
      device,
      ipAddress,
      eventType: 'new_login'
    },
    sendEmail: true,
    emailSubject: '🔒 Security Alert: New Login to Your Stakr Account',
    emailBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">🔒 Security Alert: New Login</h2>
        <p>We detected a new login to your Stakr account.</p>
        
        <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <h3 style="margin-top: 0; color: #991b1b;">Login Details:</h3>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Device:</strong> ${device}</p>
          <p><strong>IP Address:</strong> ${ipAddress}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p><strong>Was this you?</strong></p>
        <p>If you recognize this login, no action is needed.</p>
        <p><strong style="color: #ef4444;">If you don't recognize this login:</strong></p>
        <ol style="margin: 10px 0; padding-left: 20px;">
          <li>Change your password immediately</li>
          <li>Review your account activity</li>
          <li>Contact our support team</li>
        </ol>
        
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/settings" 
           style="display: inline-block; background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Secure My Account
        </a>
      </div>
    `
  }, sqlOverride)
}

// Export all notification functions
export {
  // Challenge lifecycle
  notifyChallengeJoined,
  notifyChallengeStartingSoon,
  notifyChallengeStarted,
  notifyChallengeEndingSoon,
  notifyChallengeCompleted,
  notifyChallengeFailed,
  notifyChallengeInvite,
  
  // Verification & Proof
  notifyProofReminder,
  notifyProofSubmitted,
  notifyProofApproved,
  notifyProofRejected,
  notifyAppealSubmitted,
  notifyAppealApproved,
  notifyAppealDenied,
  
  // Social
  notifyNudgeReceived,
  notifyCommentReceived,
  notifyNewFollower,
  notifyParticipantJoined,
  
  // Financial
  notifyPaymentReceived,
  notifyRefundProcessed,
  
  // Milestones
  notifyFirstChallengeCompleted,
  notifyStreakMilestone,
  notifyRewardsMilestone,
  
  // System
  notifyWelcome,
  notifyAccountVerified,
  notifyPremiumActivated,
  notifyPremiumExpiring,
  notifyNewLogin
}

