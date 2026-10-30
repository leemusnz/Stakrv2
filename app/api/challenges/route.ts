import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createDbConnection } from "@/lib/db";
import { createChallenge, createChallengeInput } from "@/lib/challenge-create";
import { challengeErrorResponse } from "@/lib/challenge-http";
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    const query = new URL(request.url).searchParams,
      category = query.get("category") || "",
      search = query.get("q") || "",
      status = query.get("status") || "joinable";
    const limit = Number(query.get("limit") || 100),
      offset = Number(query.get("offset") || 0);
    if (
      !["joinable", "all"].includes(status) ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !Number.isInteger(offset) ||
      offset < 0 ||
      search.length > 100
    )
      return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
    const sql = createDbConnection();
    const challenges =
      await sql`SELECT c.*,u.name AS host_name,u.avatar_url AS host_avatar_url,
      (SELECT count(*) FROM challenge_participants p WHERE p.challenge_id=c.id) AS participants_count,
      (SELECT coalesce(sum(stake_amount),0) FROM challenge_participants p WHERE p.challenge_id=c.id) AS total_stake_pool
      FROM challenges c LEFT JOIN users u ON u.id=c.host_id
      WHERE c.lifecycle_version=1 AND c.privacy_type='public' AND (${category}='' OR c.category=${category})
        AND (${search}='' OR c.title ILIKE ${"%" + search + "%"})
        AND (${status}='all' OR (${status}='joinable' AND c.status IN ('pending','active') AND c.start_date>now()))
      ORDER BY c.start_date,c.id LIMIT ${limit} OFFSET ${offset}`;
    return NextResponse.json({
      success: true,
      challenges,
      hasMore: challenges.length === limit,
      nextOffset: offset + challenges.length,
    });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    const challenge = await createChallenge(
      session.user.id,
      createChallengeInput.parse(await request.json()),
    );
    return NextResponse.json({ success: true, challenge }, { status: 201 });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
