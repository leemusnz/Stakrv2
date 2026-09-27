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
    const params = new URL(request.url).searchParams;
    const page = Number(params.get("page") || 1),
      pageSize = Number(params.get("pageSize") || 20);
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    )
      return NextResponse.json(
        { error: "Invalid pagination" },
        { status: 400 },
      );
    const sql = createDbConnection(),
      userId = session.user.id;
    const users = await sql`SELECT credits FROM users WHERE id=${userId}`;
    if (!users[0])
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    const [transactions, stakes, totals] = await Promise.all([
      sql`SELECT id,amount,description,transaction_type,related_challenge_id,created_at FROM credit_transactions
        WHERE user_id=${userId} ORDER BY created_at DESC,id DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      sql`SELECT coalesce(sum(cp.stake_amount),0)::text AS staked FROM challenge_participants cp JOIN challenges c ON c.id=cp.challenge_id
        WHERE cp.user_id=${userId} AND c.status NOT IN ('cancelled','rewards_distributed')`,
      sql`SELECT count(*) AS total FROM credit_transactions WHERE user_id=${userId}`,
    ]);
    return NextResponse.json({
      success: true,
      wallet: {
        balance: users[0].credits,
        totalStaked: stakes[0].staked,
        transactions: transactions.map((t) => ({
          id: t.id,
          amount: t.amount,
          description: t.description || t.transaction_type,
          type: t.transaction_type,
          challengeId: t.related_challenge_id,
          date: t.created_at,
        })),
      },
      pagination: {
        page,
        pageSize,
        total: Number(totals[0].total),
        hasNext: page * pageSize < Number(totals[0].total),
      },
    });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
