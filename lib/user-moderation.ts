import { withTransaction } from "@/lib/db/transaction";
import { ChallengeError } from "@/lib/challenge-engine";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type UserStatusAction = "suspend" | "restore";

/**
 * Suspends or restores an account. A suspended user cannot sign in and loses
 * access on their very next request (see lib/account-status.ts). Money already
 * staked stays escrowed and settles under the challenge's published rules; this
 * never moves credits. Every change is audited with the acting admin and reason.
 */
export async function setUserStatus(
  adminId: string,
  identifier: string,
  action: UserStatusAction,
  reason: string,
) {
  const who = identifier.trim();
  if (!who || !reason.trim() || reason.length > 2000)
    throw new ChallengeError("Provide a user and a reason", 400);
  return withTransaction(async (sql) => {
    const users = UUID.test(who)
      ? await sql`SELECT id,email,moderation_status,is_dev,has_dev_access FROM users WHERE id=${who} FOR UPDATE`
      : await sql`SELECT id,email,moderation_status,is_dev,has_dev_access FROM users WHERE lower(email)=lower(${who}) FOR UPDATE`;
    const user = users[0];
    if (!user) throw new ChallengeError("User not found", 404);
    if (user.id === adminId)
      throw new ChallengeError(
        "You cannot change your own account status",
        400,
      );
    if (user.is_dev || user.has_dev_access)
      throw new ChallengeError("Admin accounts cannot be suspended here", 403);
    const next = action === "suspend" ? "suspended" : "approved";
    if (user.moderation_status === next)
      return { id: user.id, status: next, changed: false };
    await sql`UPDATE users SET moderation_status=${next},last_moderated_at=now(),moderation_notes=${reason},updated_at=now() WHERE id=${user.id}`;
    await sql`INSERT INTO audit_events (actor_type,actor_id,entity_type,entity_id,action,details)
      VALUES ('admin',${adminId},'user',${user.id},${action === "suspend" ? "user_suspended" : "user_restored"},
        ${JSON.stringify({ reason, previous: user.moderation_status })}::jsonb)`;
    return { id: user.id, status: next, changed: true };
  });
}
