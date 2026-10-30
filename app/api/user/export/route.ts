import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exportAccountData } from "@/lib/account-data";
import { challengeErrorResponse } from "@/lib/challenge-http";

/** Downloads everything held about the signed-in user as JSON. */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    const data = await exportAccountData(session.user.id);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="stakr-my-data.json"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return challengeErrorResponse(error);
  }
}
