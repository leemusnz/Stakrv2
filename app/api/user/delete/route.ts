import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { deleteAccount } from "@/lib/account-data";
import { challengeErrorResponse } from "@/lib/challenge-http";

/** Permanently closes the signed-in user's account. Requires the literal word DELETE. */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    z.object({ confirm: z.literal("DELETE") }).parse(await request.json());
    const result = await deleteAccount(session.user.id);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
