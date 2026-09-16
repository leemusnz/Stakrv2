import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createDbConnection } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { getPresignedDownloadUrl } from "@/lib/storage";
import { challengeErrorResponse } from "@/lib/challenge-http";
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    const id = (await params).id,
      sql = createDbConnection();
    const rows =
      await sql`SELECT p.user_id,u.storage_key FROM proof_submissions p JOIN proof_uploads u ON u.file_key=p.file_url AND u.user_id=p.user_id AND u.challenge_id=p.challenge_id WHERE p.id=${id}`;
    if (!rows[0])
      return NextResponse.json(
        { error: "Evidence not found" },
        { status: 404 },
      );
    if (rows[0].user_id !== session.user.id) {
      const admin = await requireAdmin();
      if (!admin.ok) return admin.response;
    }
    return NextResponse.json(
      { url: await getPresignedDownloadUrl(rows[0].storage_key) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
