import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createDbConnection } from "@/lib/db";
import { proofInput, submitProof } from "@/lib/challenge-proofs";
import { challengeErrorResponse } from "@/lib/challenge-http";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: NextRequest, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    const proof = await submitProof(
      (await params).id,
      session.user.id,
      proofInput.parse(await request.json()),
    );
    return NextResponse.json(
      {
        success: true,
        checkin: proof,
        message: "Proof saved and queued for neutral review.",
      },
      { status: 201 },
    );
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    const sql = createDbConnection(),
      id = (await params).id;
    const proofs =
      await sql`SELECT id,challenge_id,proof_day,proof_type,text_content,file_url,metadata,status,submitted_at,reviewed_at,admin_notes,appeal_status,appeal_deadline_at
      FROM proof_submissions WHERE challenge_id=${id} AND user_id=${session.user.id} AND superseded_at IS NULL ORDER BY proof_day DESC,submitted_at DESC LIMIT 400`;
    return NextResponse.json({ success: true, checkins: proofs });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
