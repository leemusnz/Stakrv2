import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { grantCredits } from "@/lib/credit-grants";
import { challengeErrorResponse } from "@/lib/challenge-http";
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;
    const data = z
      .object({
        userId: z.string().uuid(),
        amount: z.number().positive().max(10000),
        reason: z.string().trim().min(1).max(2000),
        requestId: z.string().uuid(),
      })
      .parse(await request.json());
    return NextResponse.json({
      success: true,
      grant: await grantCredits(
        admin.userId,
        data.userId,
        data.amount,
        data.reason,
        data.requestId,
      ),
    });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
