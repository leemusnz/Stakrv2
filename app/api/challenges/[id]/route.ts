import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createDbConnection } from "@/lib/db";
import { challengeErrorResponse } from "@/lib/challenge-http";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    const id = (await params).id,
      sql = createDbConnection();
    const rows = await sql`SELECT c.*,u.name AS host_name,
      (SELECT count(*) FROM challenge_participants p WHERE p.challenge_id=c.id) AS current_participants,
      (SELECT coalesce(sum(stake_amount),0) FROM challenge_participants p WHERE p.challenge_id=c.id) AS total_stake_pool
      FROM challenges c LEFT JOIN users u ON u.id=c.host_id WHERE c.id=${id}
        AND (c.privacy_type='public' OR c.host_id=${session.user.id} OR EXISTS(SELECT 1 FROM challenge_participants p WHERE p.challenge_id=c.id AND p.user_id=${session.user.id}))`;
    if (!rows[0])
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 },
      );
    const participation =
      (
        await sql`SELECT * FROM challenge_participants WHERE challenge_id=${id} AND user_id=${session.user.id}`
      )[0] ?? null;
    const settlement =
      (
        await sql`SELECT kind,snapshot,created_at FROM challenge_settlement_records WHERE challenge_id=${id}`
      )[0] ?? null;
    return NextResponse.json({
      success: true,
      challenge: rows[0],
      participation,
      settlement,
    });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
export async function PUT() {
  return NextResponse.json(
    {
      error:
        "Published challenge terms are immutable. Cancel with an appropriate refund and create a corrected challenge.",
    },
    { status: 409 },
  );
}
export const PATCH = PUT;
export const DELETE = PUT;
