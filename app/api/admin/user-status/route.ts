import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { setUserStatus } from "@/lib/user-moderation";
import { challengeErrorResponse } from "@/lib/challenge-http";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;
    const data = z
      .object({
        user: z.string().trim().min(3).max(255),
        action: z.enum(["suspend", "restore"]),
        reason: z.string().trim().min(1).max(2000),
      })
      .parse(await request.json());
    return NextResponse.json({
      success: true,
      result: await setUserStatus(
        admin.userId,
        data.user,
        data.action,
        data.reason,
      ),
    });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
