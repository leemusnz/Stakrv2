import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createDbConnection } from "@/lib/db";
import { confirmEvidenceObject } from "@/lib/storage";
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
      .object({ fileKey: z.string().max(1000), challengeId: z.string().uuid() })
      .parse(await request.json());
    const sql = createDbConnection();
    const member =
      await sql`SELECT id FROM challenge_participants WHERE challenge_id=${data.challengeId} AND user_id=${session.user.id}`;
    if (!member.length)
      return NextResponse.json(
        { error: "Challenge participation required" },
        { status: 403 },
      );
    const existing =
      await sql`SELECT file_key FROM proof_uploads WHERE file_key=${data.fileKey} AND user_id=${session.user.id} AND challenge_id=${data.challengeId}`;
    if (existing.length)
      return NextResponse.json({ success: true, fileKey: data.fileKey });
    const verified = await confirmEvidenceObject(
      data.fileKey,
      session.user.id,
      data.challengeId,
    );
    await sql`INSERT INTO proof_uploads (file_key,storage_key,user_id,challenge_id,content_type,byte_size)
      VALUES (${data.fileKey},${verified.storageKey},${session.user.id},${data.challengeId},${verified.contentType},${verified.byteSize}) ON CONFLICT (file_key) DO NOTHING`;
    return NextResponse.json({ success: true, fileKey: data.fileKey });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
