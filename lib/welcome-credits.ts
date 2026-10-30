import { withTransaction } from "@/lib/db/transaction";
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
 * Grants the welcome credits at most once per verified user. The users-row lock
 * serialises concurrent claims, and the grant is written to the same ledger as
 * every other credit movement so balance and history always reconcile.
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
    const updated =
      await sql`UPDATE users SET credits=credits+${creditDecimal(cents)},updated_at=now()
      WHERE id=${userId} RETURNING credits`;
    await sql`INSERT INTO credit_transactions (user_id,amount,transaction_type,description,created_at)
      VALUES (${userId},${creditDecimal(cents)},${WELCOME_GRANT_TYPE},'Welcome credits',now())`;
    return { granted: true, amountCents: cents, balance: updated[0].credits };
  });
}

/** Read-only eligibility for the dashboard prompt. */
export async function welcomeCreditsOffer(
  sql: (s: TemplateStringsArray, ...v: unknown[]) => Promise<any[]>,
  userId: string,
) {
  const cents = welcomeGrantCents();
  if (cents === 0) return { eligible: false, amount: 0 };
  const rows = await sql`SELECT u.email_verified,
      EXISTS(SELECT 1 FROM credit_transactions t
        WHERE t.user_id=u.id AND t.transaction_type=${WELCOME_GRANT_TYPE}) AS claimed
    FROM users u WHERE u.id=${userId}`;
  const eligible = Boolean(rows[0]?.email_verified) && !rows[0]?.claimed;
  return { eligible, amount: cents / 100 };
}
