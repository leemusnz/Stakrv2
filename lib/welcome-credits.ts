import { withTransaction, type TransactionSql } from "@/lib/db/transaction";
import { ChallengeError } from "@/lib/challenge-engine";
import { creditDecimal } from "@/lib/credit-amounts";

export const WELCOME_GRANT_TYPE = "welcome_grant";
const DEFAULT_WELCOME_CREDITS = "50";
const MAX_WELCOME_CREDITS = 1000;

/**
 * One-time welcome credits in cents, from STAKR_WELCOME_CREDITS (default 50).
 * Challenges need a stake and new accounts start at zero, so without this a
 * self-serve user could never join anything. 0 disables it; an unparseable or
 * out-of-range value disables it too (fail closed, never over-grant).
 */
export function welcomeGrantCents(
  value: string | undefined = process.env.STAKR_WELCOME_CREDITS,
): number {
  const credits = Number(
    value === undefined || value.trim() === ""
      ? DEFAULT_WELCOME_CREDITS
      : value,
  );
  if (!Number.isFinite(credits) || credits < 0 || credits > MAX_WELCOME_CREDITS)
    return 0;
  return Math.round(credits * 100);
}

/**
 * The user's inbox, and whether another account on that same inbox already took
 * the grant. Addresses that deliver to one inbox share a key (lower-cased, any
 * "+tag" removed, and for Gmail dots and googlemail.com ignored), so one person
 * cannot collect the grant repeatedly with me+1@, me+2@ or m.e@gmail.com.
 * Distinct mailboxes stay distinct: this limits one inbox, not one person.
 */
async function mailboxState(sql: TransactionSql, userId: string) {
  const rows = await sql`WITH keyed AS (
      SELECT id, CASE WHEN split_part(lower(email),'@',2) IN ('gmail.com','googlemail.com')
          THEN replace(split_part(split_part(lower(email),'@',1),'+',1),'.','') || '@gmail.com'
          ELSE split_part(split_part(lower(email),'@',1),'+',1) || '@' || split_part(lower(email),'@',2)
        END AS mailbox
      FROM users)
    SELECT me.mailbox, EXISTS (
        SELECT 1 FROM keyed other
          JOIN credit_transactions t ON t.user_id=other.id AND t.transaction_type=${WELCOME_GRANT_TYPE}
        WHERE other.mailbox=me.mailbox AND other.id<>me.id) AS taken
    FROM keyed me WHERE me.id=${userId}`;
  return {
    mailbox: (rows[0]?.mailbox ?? null) as string | null,
    taken: Boolean(rows[0]?.taken),
  };
}

/**
 * Serialises claims per inbox for the rest of the transaction. Without it two
 * aliases claiming at the same moment would both pass the "taken" check, since
 * each only holds the lock on its own users row.
 */
async function lockMailbox(sql: TransactionSql, userId: string) {
  const { mailbox } = await mailboxState(sql, userId);
  if (mailbox)
    await sql`SELECT pg_advisory_xact_lock(hashtext(${"welcome-grant:" + mailbox}))`;
}

/**
 * Grants the welcome credits at most once per verified user, and once per inbox.
 * The users-row lock serialises concurrent claims by one account, the mailbox
 * lock those by aliases of one inbox, and the grant is written to the same ledger
 * as every other credit movement so balance and history always reconcile.
 */
export async function claimWelcomeCredits(userId: string) {
  const cents = welcomeGrantCents();
  if (cents === 0)
    throw new ChallengeError("Welcome credits are not available", 404);
  return withTransaction(async (sql) => {
    const users =
      await sql`SELECT email_verified, credits FROM users WHERE id=${userId} FOR UPDATE`;
    if (!users[0]) throw new ChallengeError("User not found", 404);
    if (!users[0].email_verified)
      throw new ChallengeError(
        "Verify your email to claim your welcome credits",
        403,
      );
    const claimed = await sql`SELECT 1 FROM credit_transactions
      WHERE user_id=${userId} AND transaction_type=${WELCOME_GRANT_TYPE} LIMIT 1`;
    if (claimed.length)
      return { granted: false, amountCents: cents, balance: users[0].credits };
    await lockMailbox(sql, userId);
    if ((await mailboxState(sql, userId)).taken)
      throw new ChallengeError(
        "Welcome credits have already been claimed with this email address",
        409,
      );
    const updated =
      await sql`UPDATE users SET credits=credits+${creditDecimal(cents)},updated_at=now()
      WHERE id=${userId} RETURNING credits`;
    await sql`INSERT INTO credit_transactions (user_id,amount,transaction_type,description,created_at)
      VALUES (${userId},${creditDecimal(cents)},${WELCOME_GRANT_TYPE},'Welcome credits',now())`;
    return { granted: true, amountCents: cents, balance: updated[0].credits };
  });
}

/** Read-only eligibility for the dashboard prompt. */
export async function welcomeCreditsOffer(sql: TransactionSql, userId: string) {
  const cents = welcomeGrantCents();
  if (cents === 0) return { eligible: false, amount: 0 };
  const rows = await sql`SELECT u.email_verified,
      EXISTS(SELECT 1 FROM credit_transactions t
        WHERE t.user_id=u.id AND t.transaction_type=${WELCOME_GRANT_TYPE}) AS claimed
    FROM users u WHERE u.id=${userId}`;
  const eligible =
    Boolean(rows[0]?.email_verified) &&
    !rows[0]?.claimed &&
    !(await mailboxState(sql, userId)).taken;
  return { eligible, amount: cents / 100 };
}
