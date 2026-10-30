import { createDbConnection } from "@/lib/db";
import { withTransaction } from "@/lib/db/transaction";
import { ChallengeError } from "@/lib/challenge-engine";
import { creditDecimal, toCreditCents } from "@/lib/credit-amounts";

/**
 * Everything Stakr holds about one person, as JSON they can download
 * (NZ Privacy Act 2020, information privacy principle 6: access to personal
 * information). Credentials, internal moderation notes and other people's data
 * are deliberately excluded.
 */
export async function exportAccountData(userId: string) {
  const sql = createDbConnection();
  const [profile, credits, joined, hosted, proofs, notifications, xp] =
    await Promise.all([
      sql`SELECT id,email,name,username,avatar_url,credits,xp,level,email_verified,email_verified_at,
        onboarding_completed,created_at,last_login FROM users WHERE id=${userId}`,
      sql`SELECT created_at,amount,transaction_type,description,related_challenge_id
        FROM credit_transactions WHERE user_id=${userId} ORDER BY created_at`,
      sql`SELECT c.id AS challenge_id,c.title,cp.stake_amount,cp.entry_fee_paid,cp.completion_status,
        cp.reward_earned,cp.joined_at,cp.completed_at
        FROM challenge_participants cp JOIN challenges c ON c.id=cp.challenge_id
        WHERE cp.user_id=${userId} ORDER BY cp.joined_at`,
      sql`SELECT id,title,status,start_date,end_date,host_contribution,created_at
        FROM challenges WHERE host_id=${userId} ORDER BY created_at`,
      sql`SELECT challenge_id,proof_day,proof_type,status,coalesce(text_content,proof_content) AS text,
        (file_url IS NOT NULL) AS has_file,human_notes AS reviewer_notes,appeal_reason,submitted_at
        FROM proof_submissions WHERE user_id=${userId} ORDER BY submitted_at`,
      sql`SELECT created_at,type,title,message,read FROM notifications WHERE user_id=${userId} ORDER BY created_at`,
      sql`SELECT created_at,amount,source,description FROM xp_transactions WHERE user_id=${userId} ORDER BY created_at`,
    ]);
  if (!profile[0]) throw new ChallengeError("User not found", 404);
  return {
    exportedAt: new Date().toISOString(),
    notice:
      "Evidence files you uploaded are stored privately and are not embedded here; contact support to request copies.",
    profile: profile[0],
    creditLedger: credits,
    challengesJoined: joined,
    challengesHosted: hosted,
    evidence: proofs,
    notifications,
    experiencePoints: xp,
  };
}

/**
 * Closes the account and removes the person from Stakr while keeping the
 * financial and audit trail that other users' settlements depend on.
 *
 * Refused while the person hosts or takes part in any unsettled challenge, so
 * nobody else's pool or deadline is affected. Remaining credits (which have no
 * cash value) are forfeited through a ledger entry so balances still reconcile.
 * The login is disabled immediately: the account becomes suspended + unverified,
 * which the session check treats as signed out on the next request.
 */
export async function deleteAccount(userId: string) {
  return withTransaction(async (sql) => {
    const users =
      await sql`SELECT id,credits,is_dev,has_dev_access FROM users WHERE id=${userId} FOR UPDATE`;
    const user = users[0];
    if (!user) throw new ChallengeError("User not found", 404);
    if (user.is_dev || user.has_dev_access)
      throw new ChallengeError(
        "Admin accounts must be demoted before deletion",
        403,
      );
    const open = await sql`SELECT 1 FROM challenges c
      WHERE c.status NOT IN ('cancelled','rewards_distributed')
        AND (c.host_id=${userId} OR EXISTS (SELECT 1 FROM challenge_participants cp
             WHERE cp.challenge_id=c.id AND cp.user_id=${userId})) LIMIT 1`;
    if (open.length)
      throw new ChallengeError(
        "You still host or take part in a challenge that has not finished. Delete your account once it has settled.",
        409,
      );
    const forfeitCents = toCreditCents(user.credits);
    if (forfeitCents > 0)
      await sql`INSERT INTO credit_transactions (user_id,amount,transaction_type,description,created_at)
        VALUES (${userId},${creditDecimal(-forfeitCents)},'account_closed','Remaining credits forfeited on account deletion',now())`;
    const tag = String(userId).replace(/-/g, "").slice(0, 12);
    await sql`UPDATE users SET email=${"deleted-" + tag + "@deleted.invalid"},name='Deleted user',
      username=${"deleted_" + tag},avatar_url=NULL,password_hash=NULL,credits=0,email_verified=false,
      email_verified_at=NULL,moderation_status='suspended',moderation_notes='Account deleted by the user',
      updated_at=now() WHERE id=${userId}`;
    await sql`DELETE FROM verification_tokens WHERE user_id=${userId}`;
    await sql`DELETE FROM notifications WHERE user_id=${userId}`;
    await sql`DELETE FROM oauth_states WHERE user_id=${userId}`;
    await sql`DELETE FROM app_integrations WHERE user_id=${userId}`;
    await sql`DELETE FROM wearable_integrations WHERE user_id=${userId}`;
    await sql`INSERT INTO audit_events (actor_type,actor_id,entity_type,entity_id,action,details)
      VALUES ('user',${userId},'user',${userId},'account_deleted',${JSON.stringify({ forfeitedCents: forfeitCents })}::jsonb)`;
    return { deleted: true, forfeitedCredits: forfeitCents / 100 };
  });
}
