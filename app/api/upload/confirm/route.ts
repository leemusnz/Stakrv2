import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createDbConnection } from "@/lib/db";
import { withTransaction } from "@/lib/db/transaction";
import { confirmEvidenceObject } from "@/lib/storage";
import { challengeErrorResponse } from "@/lib/challenge-http";
import { enforce, LIMITS, tooManyRequests } from "@/lib/rate-limit-db";
import { z } from "zod";
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    // Each call can copy a stored object: cap it per user, like the presign step.
    const limited = await enforce([[LIMITS.confirmPerUser, session.user.id]]);
    if (!limited.allowed) return tooManyRequests(limited.retryAfterSeconds);
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
    const userId = session.user.id;
    // One confirmation per upload at a time. Without it, concurrent replays each
    // copy the object (orphans), and a later copy of a swapped source file could
    // overwrite the evidence already recorded. Waiters find the row and return.
    await withTransaction(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(hashtext(${"evidence-confirm:" + data.fileKey}))`;
      const existing =
        await tx`SELECT file_key FROM proof_uploads WHERE file_key=${data.fileKey} AND user_id=${userId} AND challenge_id=${data.challengeId}`;
      if (existing.length) return;
      const verified = await confirmEvidenceObject(
        data.fileKey,
        userId,
        data.challengeId,
      );
      await tx`INSERT INTO proof_uploads (file_key,storage_key,user_id,challenge_id,content_type,byte_size)
        VALUES (${data.fileKey},${verified.storageKey},${userId},${data.challengeId},${verified.contentType},${verified.byteSize}) ON CONFLICT (file_key) DO NOTHING`;
    });
    return NextResponse.json({ success: true, fileKey: data.fileKey });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
