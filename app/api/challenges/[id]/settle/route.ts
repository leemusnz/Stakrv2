import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { processChallenge } from "@/lib/challenge-engine";
import { challengeErrorResponse } from "@/lib/challenge-http";
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;
    const result = await processChallenge((await params).id, admin.userId);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
