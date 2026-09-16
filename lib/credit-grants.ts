import { withTransaction } from "@/lib/db/transaction";
import { ChallengeError } from "@/lib/challenge-engine";
import { creditDecimal, toCreditCents } from "@/lib/credit-amounts";

/** Admin-issued MVP credits, with a stable request key and a matching ledger entry. */
export async function grantCredits(
  actor: string,
  user: string,
  amount: number,
  reason: string,
  requestId: string,
) {
  const cents = toCreditCents(amount);
  if (cents < 1 || cents > 1000000 || !reason.trim() || reason.length > 2000)
    throw new ChallengeError("Provide 0.01–10,000 credits and a reason", 400);
  return withTransaction(async (sql) => {
    const users = await sql`SELECT id FROM users WHERE id=${user} FOR UPDATE`;
    if (!users.length) throw new ChallengeError("User not found", 404);
    const existing =
      await sql`SELECT * FROM credit_grants WHERE id=${requestId}`;
    if (existing[0]) {
      if (
        existing[0].user_id !== user ||
        Number(existing[0].amount_cents) !== cents ||
        existing[0].actor_id !== actor ||
        existing[0].reason !== reason
      )
        throw new ChallengeError(
          "Request key already used for different grant terms",
        );
      return existing[0];
    }
    const grant = (
      await sql`INSERT INTO credit_grants (id,user_id,actor_id,amount_cents,reason)
      VALUES (${requestId},${user},${actor},${cents},${reason}) RETURNING *`
    )[0];
    await sql`UPDATE users SET credits=credits+${creditDecimal(cents)},updated_at=now() WHERE id=${user}`;
    await sql`INSERT INTO credit_transactions (user_id,amount,transaction_type,description,created_at)
      VALUES (${user},${creditDecimal(cents)},'admin_grant',${"MVP credit grant: " + reason},now())`;
    return grant;
  });
}
