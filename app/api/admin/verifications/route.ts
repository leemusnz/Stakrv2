import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { createDbConnection } from "@/lib/db";
import { reviewProof } from "@/lib/challenge-proofs";
import { challengeErrorResponse } from "@/lib/challenge-http";
import { z } from "zod";
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;
    const sql = createDbConnection();
    const proofs =
      await sql`SELECT ps.*,c.title AS challenge_title,c.lifecycle_policy,u.name AS user_name
      FROM proof_submissions ps JOIN challenges c ON c.id=ps.challenge_id JOIN users u ON u.id=ps.user_id
      WHERE c.lifecycle_version=1 AND ps.superseded_at IS NULL AND (ps.status IN ('pending','pending_review') OR ps.appeal_status='pending')
      ORDER BY ps.submitted_at LIMIT 200`;
    return NextResponse.json({ success: true, proofs });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;
    const data = z
      .object({
        verificationId: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
        reason: z.string().min(1).max(2000),
        appeal: z.boolean().default(false),
      })
      .parse(await request.json());
    const proof = await reviewProof(
      data.verificationId,
      admin.userId,
      data.decision,
      data.reason,
      data.appeal,
    );
    return NextResponse.json({ success: true, verification: proof });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
export const PATCH = POST;
