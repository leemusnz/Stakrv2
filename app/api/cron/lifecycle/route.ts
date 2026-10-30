import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runLifecycleBatch } from "@/lib/challenge-engine";
import { challengeErrorResponse } from "@/lib/challenge-http";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret)
    return NextResponse.json(
      { error: "Lifecycle scheduler is not configured" },
      { status: 503 },
    );
  const actual = Buffer.from(request.headers.get("authorization") ?? ""),
    expected = Buffer.from("Bearer " + secret);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({
      success: true,
      results: await runLifecycleBatch(),
    });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
