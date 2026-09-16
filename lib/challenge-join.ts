import { withTransaction } from '@/lib/db/transaction'
import { creditDecimal, entryFeeBps, feeCents, toCreditCents } from '@/lib/credit-amounts'
import type { ChallengeJoinInput } from '@/lib/validation'

export class JoinError extends Error {
  constructor(message: string, public readonly status = 400) { super(message) }
}

/** All eligibility checks and writes run on the same locked database snapshot. */
export async function joinChallenge(challengeId: string, userId: string, input: ChallengeJoinInput) {
  return withTransaction(async sql => {
    // Serialize capacity checks and duplicate joins for this challenge.
    const challenges = await sql`SELECT c.* FROM challenges c WHERE c.id = ${challengeId} FOR UPDATE`
    if (!challenges[0]) throw new JoinError('Challenge not found', 404)
    const challenge = challenges[0]
    if (!['pending', 'active'].includes(challenge.status)) {
      throw new JoinError('This challenge is no longer accepting participants')
    }

    // Evaluate database time AFTER acquiring the lock. NOW() is transaction-start time.
    // Existing timestamp-without-time-zone columns are interpreted as UTC.
    const eligibility = await sql`
      SELECT start_date IS NOT NULL AND end_date > start_date
        AND start_date > clock_timestamp() AS can_join
      FROM challenges WHERE id = ${challengeId}
    `
    if (!eligibility[0]?.can_join) throw new JoinError('Joining closes when the challenge starts')

    const existing = await sql`
      SELECT id FROM challenge_participants WHERE challenge_id = ${challengeId} AND user_id = ${userId}
    `
    if (existing.length) throw new JoinError('You have already joined this challenge', 409)
    const counts = await sql`SELECT COUNT(*) AS count FROM challenge_participants WHERE challenge_id = ${challengeId}`
    const count = Number(counts[0].count)
    if (challenge.max_participants != null && count >= Number(challenge.max_participants)) {
      throw new JoinError('Challenge is full', 409)
    }

    // The reward path is selected per challenge, so a client cannot choose its own mode.
    const pointsOnly = challenge.allow_points_only === true
    if (input.pointsOnly !== pointsOnly) {
      throw new JoinError(pointsOnly ? 'This challenge uses points only' : 'This challenge requires a credit stake')
    }
    let proofRequirements = challenge.proof_requirements ?? {}
    if (typeof proofRequirements === 'string') {
      try { proofRequirements = JSON.parse(proofRequirements) }
      catch { throw new JoinError('Challenge payment configuration needs review', 409) }
    }
    if (!proofRequirements || typeof proofRequirements !== 'object' || Array.isArray(proofRequirements)) {
      throw new JoinError('Challenge payment configuration needs review', 409)
    }
    const currency = proofRequirements.currency ?? 'CREDITS'
    if (!pointsOnly && currency !== 'CREDITS') {
      throw new JoinError('Cash challenge entry is not available in the credits MVP', 403)
    }
    // These modes lack the policy/settlement needed for a fair MVP. Do not sell them.
    if (input.insurancePurchased) throw new JoinError('Challenge insurance is not available in the MVP')
    if (challenge.enable_team_mode) throw new JoinError('Team challenges are not available in the MVP', 409)
    if (input.referralCode || input.teamPreference) throw new JoinError('Referrals and team preferences are not available in the MVP')

    let stakeCents = 0
    if (!pointsOnly) {
      try { stakeCents = toCreditCents(input.stakeAmount) }
      catch { throw new JoinError('Stake must be a positive credit amount with at most two decimal places') }
      if (stakeCents <= 0 || stakeCents < toCreditCents(challenge.min_stake) || stakeCents > toCreditCents(challenge.max_stake)) {
        throw new JoinError(`Stake must be between ${challenge.min_stake} and ${challenge.max_stake} credits`)
      }
      const tiers = proofRequirements.stake_tiers
      if (tiers != null && (!Array.isArray(tiers) || tiers.length === 0)) {
        throw new JoinError('Challenge stake configuration needs review', 409)
      }
      if (tiers && !tiers.map(toCreditCents).includes(stakeCents)) throw new JoinError('Choose one of the challenge stake tiers')
    }
    const bps = pointsOnly ? 0 : entryFeeBps(challenge.entry_fee_percentage)
    const entryCents = feeCents(stakeCents, bps)
    const totalCents = stakeCents + entryCents
    if (!Number.isSafeInteger(totalCents)) throw new JoinError('Total credit amount is too large')

    // Serialize balance checks even when this user joins DIFFERENT challenges.
    const users = await sql`SELECT credits FROM users WHERE id = ${userId} FOR UPDATE`
    if (!users[0]) throw new JoinError('User not found', 404)
    let balanceCents = toCreditCents(users[0].credits)
    if (balanceCents < totalCents) throw new JoinError('Insufficient credits')

    // Lock waits above must not allow a request to enter after the start deadline.
    const participation = await sql`
      INSERT INTO challenge_participants (
        challenge_id, user_id, stake_amount, entry_fee_paid, insurance_purchased,
        insurance_fee_paid, completion_status, joined_at
      )
      SELECT ${challengeId}, ${userId}, ${creditDecimal(stakeCents)}, ${creditDecimal(entryCents)},
        false, 0, 'active', clock_timestamp()
      FROM challenges WHERE id = ${challengeId} AND start_date > clock_timestamp()
      RETURNING id, joined_at
    `
    if (!participation.length) throw new JoinError('Joining closes when the challenge starts')

    if (totalCents > 0) {
      const debit = await sql`
        UPDATE users SET credits = credits - ${creditDecimal(totalCents)}, updated_at = NOW()
        WHERE id = ${userId} AND credits >= ${creditDecimal(totalCents)} RETURNING credits
      `
      if (!debit.length) throw new JoinError('Insufficient credits')
      balanceCents = toCreditCents(debit[0].credits)
      await sql`
        INSERT INTO credit_transactions (user_id, amount, transaction_type, related_challenge_id, description, created_at)
        VALUES
          (${userId}, ${creditDecimal(-stakeCents)}, 'stake_lock', ${challengeId}, ${'Stake locked for challenge: ' + challenge.title}, NOW()),
          (${userId}, ${creditDecimal(-entryCents)}, 'entry_fee', ${challengeId}, ${'Entry fee for challenge: ' + challenge.title}, NOW())
      `
    }
    const audit = { participantId: participation[0].id, pointsOnly, stakeCents, entryFeeCents: entryCents, entryFeeBps: bps, balanceCents }
    await sql`
      INSERT INTO challenge_audit_events (challenge_id, actor_id, event_type, reason, details)
      VALUES (${challengeId}, ${userId}, 'participant_joined', 'User accepted the challenge entry terms', ${JSON.stringify(audit)}::jsonb)
    `
    const host = challenge.host_id ? await sql`SELECT name FROM users WHERE id = ${challenge.host_id}` : []
    return {
      participation: { id: participation[0].id, challenge_id: challengeId, user_id: userId,
        stake_amount: stakeCents / 100, total_cost: totalCents / 100, team_id: null, joined_at: participation[0].joined_at },
      financial_breakdown: { stake_amount: stakeCents / 100, entry_fee: entryCents / 100, insurance_fee: 0,
        total_cost: totalCents / 100, remaining_credits: balanceCents / 100, reward_type: pointsOnly ? 'XP' : 'CREDITS' },
      challenge_info: { title: challenge.title, total_participants: count + 1, host_name: host[0]?.name ?? null,
        start_date: challenge.start_date, end_date: challenge.end_date, has_teams: false, team_assigned: null },
    }
  })
}
