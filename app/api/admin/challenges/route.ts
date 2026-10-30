import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { createDbConnection } from "@/lib/db";
import { challengeErrorResponse } from "@/lib/challenge-http";
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;
    const sql = createDbConnection();
    const challenges =
      await sql`SELECT c.id,c.title,c.status,c.lifecycle_version,c.end_date,q.last_error,q.attempts,
      (SELECT count(*) FROM challenge_participants cp WHERE cp.challenge_id=c.id) AS participants
      FROM challenges c LEFT JOIN challenge_lifecycle_queue q ON q.challenge_id=c.id ORDER BY c.created_at DESC LIMIT 200`;
    const drift =
      await sql`SELECT u.id,u.credits,coalesce(sum(ct.amount),0)::text AS ledger_balance
      FROM users u LEFT JOIN credit_transactions ct ON ct.user_id=u.id GROUP BY u.id,u.credits
      HAVING u.credits<>coalesce(sum(ct.amount),0) LIMIT 100`;
    return NextResponse.json({ success: true, challenges, ledgerDrift: drift });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
