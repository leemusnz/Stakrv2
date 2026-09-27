import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createDbConnection } from "@/lib/db";
import { challengeErrorResponse } from "@/lib/challenge-http";
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    const hosted = new URL(request.url).searchParams.get("scope") === "hosted";
    const sql = createDbConnection();
    const challenges =
      await sql`SELECT c.*,cp.completion_status,cp.verification_status,cp.stake_amount,cp.reward_earned,
      (SELECT count(DISTINCT proof_day) FROM proof_submissions ps WHERE ps.participant_id=cp.id AND ps.status='approved' AND ps.superseded_at IS NULL) AS approved_days
      FROM challenges c LEFT JOIN challenge_participants cp ON c.id=cp.challenge_id AND cp.user_id=${session.user.id}
      WHERE (${hosted} AND c.host_id=${session.user.id}) OR (NOT ${hosted} AND cp.user_id=${session.user.id}) ORDER BY c.created_at DESC LIMIT 200`;
    return NextResponse.json({ success: true, challenges });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
