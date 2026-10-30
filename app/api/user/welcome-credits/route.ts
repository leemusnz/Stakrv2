import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createDbConnection } from "@/lib/db";
import { challengeErrorResponse } from "@/lib/challenge-http";
import {
  claimWelcomeCredits,
  welcomeCreditsOffer,
} from "@/lib/welcome-credits";

const unauthenticated = () =>
  NextResponse.json({ error: "Authentication required" }, { status: 401 });

/** Whether the signed-in user can still claim their one-time welcome credits. */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return unauthenticated();
    const offer = await welcomeCreditsOffer(
      createDbConnection(),
      session.user.id,
    );
    return NextResponse.json({ success: true, ...offer });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}

/** Claims the welcome credits. Idempotent: a repeat call grants nothing. */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return unauthenticated();
    const result = await claimWelcomeCredits(session.user.id);
    return NextResponse.json({
      success: true,
      granted: result.granted,
      amount: result.amountCents / 100,
      balance: result.balance,
    });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
