import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createDbConnection } from "@/lib/db";
import { appealProof } from "@/lib/challenge-proofs";
import { challengeErrorResponse } from "@/lib/challenge-http";
import { z } from "zod";
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    const data = z
      .object({
        verificationId: z.string().uuid(),
        appealReason: z.string().min(1).max(4000),
      })
      .parse(await request.json());
    return NextResponse.json({
      success: true,
      appeal: await appealProof(
        data.verificationId,
        session.user.id,
        data.appealReason,
      ),
    });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    const sql = createDbConnection();
    const appeals =
      await sql`SELECT id,challenge_id,status,appeal_status,appeal_reason,appealed_at,admin_notes FROM proof_submissions WHERE user_id=${session.user.id} AND appeal_status IS NOT NULL ORDER BY appealed_at DESC LIMIT 100`;
    return NextResponse.json({ success: true, appeals });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
