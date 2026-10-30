import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { administerChallenge, processChallenge } from "@/lib/challenge-engine";
import { challengeErrorResponse } from "@/lib/challenge-http";
import { z } from "zod";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;
    const data = z
      .object({
        action: z.enum(["suspend", "resume", "cancel", "process"]),
        reason: z.string().min(1).max(2000),
        preset: z
          .enum(["refund_all", "refund_participants", "refund_none"])
          .optional(),
      })
      .parse(await request.json());
    const id = (await params).id;
    const result =
      data.action === "process"
        ? await processChallenge(id, admin.userId, data.reason)
        : await administerChallenge(
            id,
            admin.userId,
            data.action,
            data.reason,
            data.preset,
          );
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
